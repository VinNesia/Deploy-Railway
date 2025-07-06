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
const winston = require('winston');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Inisialisasi Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console()
    ]
});

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
redisClient.connect().catch(err => logger.error('Redis connection error:', err));

// Middleware
app.use(bodyParser.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(csurf({ cookie: { secure: process.env.NODE_ENV === 'production' } }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100, // Maksimum 100 request per IP
    message: { error: 'Terlalu banyak permintaan, silakan coba lagi nanti.' }
});
app.use('/api/', limiter);

// Sanitasi Input
const sanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'a']),
    allowedAttributes: {
        img: ['src', 'alt'],
        a: ['href', 'title']
    }
};

// Middleware untuk logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url} - IP: ${req.ip}`);
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
            logger.info('Serving tools from cache');
            return res.json(JSON.parse(cachedTools));
        }

        const snapshot = await db.ref('tools').once('value');
        const tools = [];
        snapshot.forEach(child => {
            tools.push({ id: child.key, ...child.val() });
        });

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(tools));
        logger.info('Tools cached in Redis');
        res.json(tools);
    } catch (error) {
        logger.error('Error fetching tools:', error);
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
            logger.info(`Serving tool ${id} from cache`);
            return res.json(JSON.parse(cachedTool));
        }

        const snapshot = await db.ref(`tools/${id}`).once('value');
        const tool = snapshot.val();
        if (!tool) {
            return res.status(404).json({ error: 'Tool tidak ditemukan' });
        }

        await redisClient.setEx(cacheKey, 3600, JSON.stringify({ id, ...tool }));
        logger.info(`Tool ${id} cached in Redis`);
        res.json({ id, ...tool });
    } catch (error) {
        logger.error('Error fetching tool:', error);
        res.status(500).json({ error: 'Gagal memuat tool' });
    }
});

// Endpoint untuk mengambil daftar artikel blog
app.get('/api/blog-posts', async (req, res) => {
    const cacheKey = 'blog_posts';
    try {
        const cachedPosts = await redisClient.get(cacheKey);
        if (cachedPosts) {
            logger.info('Serving blog posts from cache');
            return res.json(JSON.parse(cachedPosts));
        }

        const snapshot = await db.ref('blog_posts').once('value');
        const posts = [];
        snapshot.forEach(child => {
            posts.push({ id: child.key, ...child.val() });
        });

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(posts));
        logger.info('Blog posts cached in Redis');
        res.json(posts);
    } catch (error) {
        logger.error('Error fetching blog posts:', error);
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
            logger.info(`Serving blog post ${id} from cache`);
            return res.json(JSON.parse(cachedPost));
        }

        const snapshot = await db.ref(`blog_posts/${id}`).once('value');
        const post = snapshot.val();
        if (!post) {
            return res.status(404).json({ error: 'Artikel tidak ditemukan' });
        }

        await redisClient.setEx(cacheKey, 3600, JSON.stringify({ id, ...post }));
        logger.info(`Blog post ${id} cached in Redis`);
        res.json({ id, ...post });
    } catch (error) {
        logger.error('Error fetching blog post:', error);
        res.status(500).json({ error: 'Gagal memuat artikel' });
    }
});

// Endpoint untuk mengirim komentar blog
app.post('/api/blog-comments/:postId', async (req, res) => {
    const { postId } = req.params;
    const { text, _csrf } = req.body;
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!text) {
        return res.status(400).json({ error: 'Komentar tidak boleh kosong' });
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        const sanitizedText = sanitizeHtml(text, sanitizeOptions);
        await db.ref(`blog_comments/${postId}`).push({
            user: decodedToken.email,
            text: sanitizedText,
            timestamp: new Date().toISOString()
        });
        await redisClient.del(`blog_comments_${postId}`);
        logger.info(`Comment added for post ${postId} by ${decodedToken.email}`);
        res.json({ message: 'Komentar berhasil dikirim' });
    } catch (error) {
        logger.error('Error submitting comment:', error);
        res.status(500).json({ error: 'Gagal mengirim komentar' });
    }
});

// Endpoint untuk mengambil komentar blog
app.get('/api/blog-comments/:postId', async (req, res) => {
    const { postId } = req.params;
    const cacheKey = `blog_comments_${postId}`;
    try {
        const cachedComments = await redisClient.get(cacheKey);
        if (cachedComments) {
            logger.info(`Serving comments for post ${postId} from cache`);
            return res.json(JSON.parse(cachedComments));
        }

        const snapshot = await db.ref(`blog_comments/${postId}`).once('value');
        const comments = [];
        snapshot.forEach(child => {
            comments.push({ id: child.key, ...child.val() });
        });

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(comments));
        logger.info(`Comments for post ${postId} cached in Redis`);
        res.json(comments);
    } catch (error) {
        logger.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Gagal memuat komentar' });
    }
});

// Endpoint untuk mengirim formulir kontak
app.post('/api/contact', async (req, res) => {
    const { name, email, message, recaptchaResponse, _csrf } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Semua kolom harus diisi' });
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaResponse}`;
    try {
        const verifyResponse = await fetch(verifyUrl, { method: 'POST' });
        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
            return res.status(400).json({ error: 'Verifikasi reCAPTCHA gagal' });
        }

        const sanitizedData = {
            name: sanitizeHtml(name),
            email: sanitizeHtml(email),
            message: sanitizeHtml(message, sanitizeOptions),
            timestamp: new Date().toISOString()
        };
        await db.ref('contact_messages').push(sanitizedData);
        logger.info(`Contact form submitted by ${sanitizedData.email}`);
        res.json({ message: 'Pesan berhasil dikirim' });
    } catch (error) {
        logger.error('Error submitting contact form:', error);
        res.status(500).json({ error: 'Gagal mengirim pesan' });
    }
});

// Endpoint untuk admin: tambah/edit tool
app.post('/api/admin/tools', async (req, res) => {
    const { id, name, description, category, tags, url, image, _csrf } = req.body;
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!name || !description || !category || !url) {
        return res.status(400).json({ error: 'Semua kolom wajib diisi' });
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        if (decodedToken.email !== 'admin@aitoolsdirectory.com') {
            return res.status(403).json({ error: 'Akses ditolak' });
        }

        const toolData = {
            name: sanitizeHtml(name),
            description: sanitizeHtml(description, sanitizeOptions),
            category,
            tags: tags.map(tag => sanitizeHtml(tag)),
            url,
            image: image || '/images/placeholder.webp'
        };
        if (id) {
            await db.ref(`tools/${id}`).update(toolData);
            await redisClient.del(`tool_${id}`);
            logger.info(`Tool ${id} updated by admin`);
        } else {
            await db.ref('tools').push(toolData);
            logger.info('New tool added by admin');
        }

        await redisClient.del('tools_list');
        res.json({ message: 'Tool berhasil disimpan' });
    } catch (error) {
        logger.error('Error saving tool:', error);
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
        logger.info(`Tool ${id} deleted by admin`);
        res.json({ message: 'Tool berhasil dihapus' });
    } catch (error) {
        logger.error('Error deleting tool:', error);
        res.status(500).json({ error: 'Gagal menghapus tool' });
    }
});

// Endpoint untuk admin: tambah/edit artikel blog
app.post('/api/admin/blog-posts', async (req, res) => {
    const { id, title, description, body, tags, image, _csrf } = req.body;
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!title || !description || !body) {
        return res.status(400).json({ error: 'Semua kolom wajib diisi' });
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        if (decodedToken.email !== 'admin@aitoolsdirectory.com') {
            return res.status(403).json({ error: 'Akses ditolak' });
        }

        const postData = {
            title: sanitizeHtml(title),
            description: sanitizeHtml(description),
            body: sanitizeHtml(body, sanitizeOptions),
            tags: tags.map(tag => sanitizeHtml(tag)),
            image: image || '/images/placeholder.webp',
            date: new Date().toISOString()
        };
        let postId;
        if (id) {
            await db.ref(`blog_posts/${id}`).update(postData);
            postId = id;
            logger.info(`Blog post ${id} updated by admin`);
        } else {
            const newPostRef = await db.ref('blog_posts').push(postData);
            postId = newPostRef.key;
            logger.info('New blog post added by admin');
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
        logger.info(`Push notification sent for blog post ${postId}`);

        res.json({ message: 'Artikel berhasil disimpan', postId });
    } catch (error) {
        logger.error('Error saving blog post:', error);
        res.status(500).json({ error: 'Gagal menyimpan artikel' });
    }
});

// Endpoint untuk admin: hapus artikel blog
app.delete('/api/admin/blog-posts/:id', async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization?.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        if (decodedToken.email !== 'admin@aitoolsdirectory.com') {
            return res.status(403).json({ error: 'Akses ditolak' });
        }

        await db.ref(`blog_posts/${id}`).remove();
        await db.ref(`blog_comments/${id}`).remove();
        await redisClient.del(`blog_post_${id}`);
        await redisClient.del(`blog_comments_${id}`);
        await redisClient.del('blog_posts');
        logger.info(`Blog post ${id} deleted by admin`);
        res.json({ message: 'Artikel berhasil dihapus' });
    } catch (error) {
        logger.error('Error deleting blog post:', error);
        res.status(500).json({ error: 'Gagal menghapus artikel' });
    }
});

// Penanganan halaman offline
app.get('/offline.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'offline.html'));
});

// Penanganan r
