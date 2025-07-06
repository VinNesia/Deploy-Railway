const express = require('express');
const cors = require('cors');
const redis = require('redis');
const firebase = require('firebase-admin');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());
app.use(cors());

// Konfigurasi Redis
const redisClient = redis.createClient({
    url: 'redis://localhost:6379'
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Konfigurasi Firebase
const serviceAccount = require('./serviceAccountKey.json');
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://your-project-id.firebaseio.com'
});
const db = firebase.database();

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100 // Batas 100 request per IP
});
app.use(limiter);

// API Tools
app.get('/api/tools', (req, res) => {
    const cacheKey = 'tools';
    redisClient.get(cacheKey, (err, cachedData) => {
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        } else {
            db.ref('tools').once('value', (snapshot) => {
                const tools = snapshot.val();
                redisClient.setEx(cacheKey, 3600, JSON.stringify(tools)); // Cache 1 jam
                res.json(tools);
            });
        }
    });
});

// API Kontak
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
    }
    db.ref('contacts').push({ name, email, message, timestamp: new Date().toISOString() })
        .then(() => res.status(200).json({ message: 'Pesan berhasil dikirim' }))
        .catch((error) => res.status(500).json({ error: error.message }));
});

// Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
