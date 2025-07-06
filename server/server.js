const express = require('express');
const bodyParser = require('body-parser');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getAuth } = require('firebase-admin/auth');
const { getMessaging } = require('firebase-admin/messaging');
const redis = require('redis');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Inisialisasi Firebase Admin
const firebaseConfig = {
    credential: require('./service-account.json'), // Ganti dengan path ke file service account
    databaseURL: process.env.FIREBASE_DATABASE_URL
};
initializeApp(firebaseConfig);
const db = getDatabase();
const auth = getAuth();
const messaging = getMessaging();

// Inisialisasi Redis
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.connect().catch(console.error);

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(csurf({ cookie: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100, // Maksimum 100 request per IP
    message: 'Terlalu banyak permintaan, silakan coba lagi nanti.'
});
app.use('/api/', limiter);

// Sanitasi Input
const sanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: { img: ['src', 'alt'] }
};

// Middleware untuk logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// CSRF Token Endpoint
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Endpoint untuk mengambil daftar tools
app.get('/api/tools', async (req, res) => {
    const cacheKey = 'tools_list';
    try {
        const cachedTools = await redisClient.get(cacheKey);
        if (cachedTools) {
            return res.json(JSON.parse(cachedTools));
        }

        const snapshot = await db.ref('tools').once('value');
        const tools = [];
        snapshot.forEach(child => {
            tools.push({ id: child.key, ...child.val() });
        });

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(tools));
        res.json(tools);
    } catch (error) {
        console.error('Error fetching tools:', error);
        res.status(500).json({ error: 'Gagal memuat tools' });
    }
});

// Endpoint untuk mengambil tool spesifik
app.get('/api/tools/:id', async (req, res) => {
    const { id } = req.params;
    const cacheKey = `tool_${id}`;
    try {
        const cachedTool = await redisClient.get(cacheKey);
        if (cachedTool) {
            return res.json(JSON.parse(cachedTool));
        }

        const snapshot = await db.ref(`tools/${id}`).once('value');
        const tool = snapshot.val();
        if (!tool) {
            return res.status(404).json({ error: 'Tool tidak ditemukan' });
        }

        await redisClient.setEx(cacheKey, 3600, JSON.stringify({ id, ...tool }));
        res.json({ id, ...tool });
    } catch (error) {
        console.error('Error fetching tool:', error);
        res.status(500).json({ error: 'Gagal memuat tool' });
    }
});

// Endpoint untuk mengambil daftar artikel blog
app.get('/api/blog-posts', async (req, res) => {
    const cacheKey = 'blog_posts';
    try {
        const cachedPosts = await redisClient.get(cacheKey);
        if (cachedPosts) {
            return res.json(JSON.parse(cachedPosts));
        }

        const snapshot = await db.ref('blog_posts').once('value');
        const posts = [];
        snapshot.forEach(child => {
            posts.push({ id: child.key, ...child.val() });
        });

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(posts));
        res.json(posts);
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        res.status(500).json({ error: 'Gagal memuat artikel' });
    }
});

// Endpoint untuk mengambil artikel spesifik
app.get('/api/blog-posts/:id', async (req, res) => {
    const { id } = req.params;
    const cacheKey = `blog_post_${id}`;
    try {
        const cachedPost = await redisClient.get(cacheKey);
        if (cachedPost) {
            return res.json(JSON.parse(cachedPost));
        }

        const snapshot = await db.ref(`blog_posts/${id}`).once('value');
        const post = snapshot.val();
        if (!post) {
            return res.status(404).json({ error: 'Artikel tidak ditemukan' });
        }

        await redisClient.setEx(cacheKey, 3600, JSON.stringify({ id, ...post }));
        res.json({ id, ...post });
    } catch (error) {
        console.error('Error fetching blog post:', error);
        res.status(500).json({ error: 'Gagal memuat artikel' });
    }
});

// Endpoint untuk mengirim komentar blog
app.post('/api/blog-comments/:postId', async (req, res) => {
    const { postId } = req.params;
    const { text, _csrf } = req.body;
    const token = req.headers.authorization?.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        const sanitizedText = sanitizeHtml(text, sanitizeOptions);
        await db.ref(`blog_comments/${postId}`).push({
            user: decodedToken.email,
            text: sanitizedText,
            timestamp: new Date().toISOString()
        });
        await redisClient.del(`blog_comments_${postId}`);
        res.json({ message: 'Komentar berhasil dikirim' });
    } catch (error) {
        console.error('Error submitting comment:', error);
        res.status(500).json({ error: 'Gagal mengirim komentar' });
    }
});

// Endpoint untuk mengirim formulir kontak
app.post('/api/contact', async (req, res) => {
    const { name, email, message, recaptchaResponse, _csrf } = req.body;

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaResponse}`;
    try {
        const verifyResponse = await fetch(verifyUrl, { method: 'POST' });
        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
            return res.status(400).json({ error: 'Verifikasi reCAPTCHA gagal' });
        }

        const sanitizedMessage = sanitizeHtml(message, sanitizeOptions);
        await db.ref('contact_messages').push({
            name: sanitizeHtml(name),
            email: sanitizeHtml(email),
            message: sanitizedMessage,
            timestamp: new Date().toISOString()
        });

        res.json({ message: 'Pesan berhasil dikirim' });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ error: 'Gagal mengirim pesan' });
    }
});

// Endpoint untuk admin: tambah/edit tool
app.post('/api/admin/tools', async (req, res) => {
    const { id, name, description, category, tags, url, image, _csrf } = req.body;
    const token = req.headers.authorization?.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        if (decodedToken.email !== 'admin@aitoolsdirectory.com') {
            return res.status(403).json({ error: 'Akses ditolak' });
        }

        const toolData = {
            name: sanitizeHtml(name),
            description: sanitizeHtml(description, sanitizeOptions),
            category,
            tags,
            url,
            image: image || '/images/placeholder.webp'
        };
        if (id) {
            await db.ref(`tools/${id}`).update(toolData);
            await redisClient.del(`tool_${id}`);
        } else {
            await db.ref('tools').push(toolData);
        }

        await redisClient.del('tools_list');
        res.json({ message: 'Tool berhasil disimpan' });
    } catch (error) {
        console.error('Error saving tool:', error);
        res.status(500).json({ error: 'Gagal menyimpan tool' });
    }
});

// Endpoint untuk admin: hapus tool
app.delete('/api/admin/tools/:id', async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization?.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        if (decodedToken.email !== 'admin@aitoolsdirectory.com') {
            return res.status(403).json({ error: 'Akses ditolak' });
        }

        await db.ref(`tools/${id}`).remove();
        await redisClient.del(`tool_${id}`);
        await redisClient.del('tools_list');
        res.json({ message: 'Tool berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting tool:', error);
        res.status(500).json({ error: 'Gagal menghapus tool' });
    }
});

// Endpoint untuk admin: tambah artikel blog
app.post('/api/admin/blog-posts', async (req, res) => {
    const { id, title, description, body, tags, image, _csrf } = req.body;
    const token = req.headers.authorization?.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        if (decodedToken.email !== 'admin@aitoolsdirectory.com') {
            return res.status(403).json({ error: 'Akses ditolak' });
        }

        const postData = {
            title: sanitizeHtml(title),
            description: sanitizeHtml(description),
            body: sanitizeHtml(body, sanitizeOptions),
            tags,
            image: image || '/images/placeholder.webp',
            date: new Date().toISOString()
        };
        let postId;
        if (id) {
            await db.ref(`blog_posts/${id}`).update(postData);
            postId = id;
        } else {
            const newPostRef = await db.ref('blog_posts').push(postData);
            postId = newPostRef.key;
        }

        await redisClient.del('blog_posts');
        await redisClient.del(`blog_post_${postId}`);

        // Kirim notifikasi push
        const message = {
            notification: {
                title: 'Artikel Baru: ' + postData.title,
                body: postData.description.substring(0, 100) + '...',
                image: postData.image
            },
            data: { url: `https://your-domain.com/blog.html?id=${postId}` },
            topic: 'all'
        };
        await messaging.send(message);

        res.json({ message: 'Artikel berhasil disimpan', postId });
    } catch (error) {
        console.error('Error saving blog post:', error);
        res.status(500).json({ error: 'Gagal menyimpan artikel' });
    }
});

// Penanganan halaman offline
app.get('/offline.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'offline.html'));
});

// Penanganan rute SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Mulai server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
