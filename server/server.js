const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const validator = require('validator');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Koneksi ke MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Terhubung ke MongoDB'))
  .catch(err => console.error('Gagal terhubung ke MongoDB:', err));

// Schema untuk data kontak
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// Endpoint untuk menyimpan data kontak
app.post('/api/contact', async (req, res) => {
    const { name, email, message, recaptchaResponse } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Email tidak valid' });
    }
    // Validasi reCAPTCHA (opsional, perlu integrasi dengan Google reCAPTCHA API)
    try {
        const newContact = new Contact({ name, email, message });
        await newContact.save();
        res.status(200).json({ message: 'Pesan tersimpan' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint untuk admin
app.get('/api/contacts', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const contacts = await Contact.find();
        res.status(200).json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
