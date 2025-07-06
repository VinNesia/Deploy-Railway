// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics();

// Data AI Tools (minimal 20 tools)
const aiTools = [
    { id: 1, name: "ChatGPT", category: "research", link: "https://chat.openai.com", description: "AI chatbot untuk penelitian dan percakapan alami.", rating: 4.8, image: "https://via.placeholder.com/250x150?text=ChatGPT" },
    { id: 2, name: "Gemini AI", category: "research", link: "https://gemini.google.com", description: "AI dari Google untuk analisis dan pencarian cerdas.", rating: 4.6, image: "https://via.placeholder.com/250x150?text=Gemini+AI" },
    { id: 3, name: "Perplexity", category: "research", link: "https://perplexity.ai", description: "Mesin pencari AI yang memberikan jawaban mendalam.", rating: 4.7, image: "https://via.placeholder.com/250x150?text=Perplexity" },
    { id: 4, name: "Claude AI", category: "research", link: "https://www.anthropic.com/claude", description: "AI untuk tugas penelitian dengan pemahaman kontekstual.", rating: 4.5, image: "https://via.placeholder.com/250x150?text=Claude+AI" },
    { id: 5, name: "Midjourney", category: "image", link: "https://www.midjourney.com", description: "Generator gambar AI dengan kualitas seni tinggi.", rating: 4.9, image: "https://via.placeholder.com/250x150?text=Midjourney" },
    { id: 6, name: "DALL-E 3", category: "image", link: "https://labs.openai.com", description: "AI untuk membuat gambar dari teks dengan detail luar biasa.", rating: 4.7, image: "https://via.placeholder.com/250x150?text=DALL-E+3" },
    { id: 7, name: "Stability AI", category: "image", link: "https://stability.ai", description: "Platform untuk generasi gambar dan model AI terbuka.", rating: 4.6, image: "https://via.placeholder.com/250x150?text=Stability+AI" },
    { id: 8, name: "Rytr", category: "copywriting", link: "https://rytr.me", description: "Alat penulisan AI untuk konten pemasaran dan blog.", rating: 4.4, image: "https://via.placeholder.com/250x150?text=Rytr" },
    { id: 9, name: "Jasper AI", category: "copywriting", link: "https://www.jasper.ai", description: "AI untuk membuat konten berkualitas tinggi dengan cepat.", rating: 4.8, image: "https://via.placeholder.com/250x150?text=Jasper+AI" },
    { id: 10, name: "CopyAI", category: "copywriting", link: "https://www.copy.ai", description: "Generator teks AI untuk iklan dan salinan pemasaran.", rating: 4.5, image: "https://via.placeholder.com/250x150?text=CopyAI" },
    { id: 11, name: "Writesonic", category: "copywriting", link: "https://writesonic.com", description: "Alat AI untuk optimasi SEO dan penulisan artikel.", rating: 4.6, image: "https://via.placeholder.com/250x150?text=Writesonic" },
    { id: 12, name: "Synthesia", category: "video", link: "https://www.synthesia.io", description: "AI untuk membuat video dengan avatar digital.", rating: 4.7, image: "https://via.placeholder.com/250x150?text=Synthesia" },
    { id: 13, name: "Runway ML", category: "video", link: "https://runwayml.com", description: "Platform untuk edit video dan generasi AI.", rating: 4.6, image: "https://via.placeholder.com/250x150?text=Runway+ML" },
    { id: 14, name: "ElevenLabs", category: "video", link: "https://elevenlabs.io", description: "AI untuk suara sintetis realistis dalam video.", rating: 4.8, image: "https://via.placeholder.com/250x150?text=ElevenLabs" },
    { id: 15, name: "Llama AI", category: "research", link: "https://ai.meta.com/llama", description: "Model AI terbuka untuk penelitian dan pengembangan.", rating: 4.5, image: "https://via.placeholder.com/250x150?text=Llama+AI" },
    { id: 16, name: "DeepSeek R1", category: "research", link: "https://www.deepseek.com", description: "AI untuk analisis data dan penelitian mendalam.", rating: 4.4, image: "https://via.placeholder.com/250x150?text=DeepSeek+R1" },
    { id: 17, name: "Flux", category: "image", link: "https://www.flux.ai", description: "Generator gambar AI dengan efek visual modern.", rating: 4.6, image: "https://via.placeholder.com/250x150?text=Flux" },
    { id: 18, name: "Adcreative AI", category: "copywriting", link: "https://www.adcreative.ai", description: "AI untuk membuat iklan kreatif berkinerja tinggi.", rating: 4.7, image: "https://via.placeholder.com/250x150?text=Adcreative+AI" },
    { id: 19, name: "Otio", category: "copywriting", link: "https://otio.app", description: "Alat AI untuk mengelola dan menulis konten dengan efisien.", rating: 4.5, image: "https://via.placeholder.com/250x150?text=Otio" },
    { id: 20, name: "Fotor", category: "image", link: "https://www.fotor.com", description: "Editor gambar AI dengan fitur pengeditan canggih.", rating: 4.6, image: "https://via.placeholder.com/250x150?text=Fotor" },
];

// State
let currentPage = 1;
const toolsPerPage = 6;
let toolsData = aiTools;

// Dark Mode
const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

document.addEventListener('DOMContentLoaded', () => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
});

// Autentikasi
auth.onAuthStateChanged((user) => {
    const loginBtn = document.getElementById('loginBtn');
    const bookmarksBtn = document.getElementById('bookmarksBtn');
    if (user) {
        loginBtn.style.display = 'none';
        bookmarksBtn.style.display = 'inline-block';
        showNotification('Login berhasil!');
    } else {
        loginBtn.style.display = 'inline-block';
        bookmarksBtn.style.display = 'none';
    }
});

function loginWithEmail() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            document.getElementById('loginError').textContent = error.message;
        });
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            document.getElementById('loginError').textContent = error.message;
        });
}

document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    loginWithEmail();
});

// Muat Tools
function loadTools() {
    displayTools(toolsData);
    displayRecommendedTools();
}

// Rekomendasi Tools (Random)
function displayRecommendedTools() {
    const recommendedGrid = document.getElementById('recommendedGrid');
    recommendedGrid.innerHTML = '';
    const shuffledTools = toolsData.sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffledTools.forEach(tool => {
        const toolCard = document.createElement('div');
        toolCard.className = 'tool-card';
        toolCard.innerHTML = `
            <img src="${tool.image}" alt="${tool.name}">
            <h3>${tool.name}</h3>
            <p>${tool.description}</p>
            <span class="rating">${'★'.repeat(Math.round(tool.rating)).padEnd(5, '☆')} (${tool.rating})</span>
            <a href="${tool.link}" target="_blank" class="login-btn">Kunjungi</a>
        `;
        recommendedGrid.appendChild(toolCard);
    });
}

// Tampilkan Tools
function displayTools(tools) {
    const toolsGrid = document.getElementById('toolsGrid');
    toolsGrid.innerHTML = '';
    const start = (currentPage - 1) * toolsPerPage;
    const end = start + toolsPerPage;
    const paginatedTools = tools.slice(start, end);

    paginatedTools.forEach(tool => {
        const toolCard = document.createElement('div');
        toolCard.className = 'tool-card';
        toolCard.innerHTML = `
            <img src="${tool.image}" alt="${tool.name}">
            <h3>${tool.name}</h3>
            <p>${tool.description}</p>
            <span class="rating">${'★'.repeat(Math.round(tool.rating)).padEnd(5, '☆')} (${tool.rating})</span>
            <a href="${tool.link}" target="_blank" class="login-btn">Kunjungi</a>
            <button class="login-btn bookmark-btn" onclick="addBookmark('${tool.id}')">Tambah ke Bookmark</button>
        `;
        toolsGrid.appendChild(toolCard);
    });
    updatePagination(tools.length);
}

// Pagination
function updatePagination(totalTools) {
    const pageInfo = document.getElementById('pageInfo');
    pageInfo.textContent = `Halaman ${currentPage} dari ${Math.ceil(totalTools / toolsPerPage)}`;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayTools(toolsData);
    }
}

function nextPage() {
    if (currentPage < Math.ceil(toolsData.length / toolsPerPage)) {
        currentPage++;
        displayTools(toolsData);
    }
}

// Pencarian Multi-Keyword & Kategori
function searchTools() {
    const query = document.getElementById('searchInput').value.toLowerCase().split(' ');
    const category = document.getElementById('categoryFilter').value;
    let filteredTools = toolsData;

    if (query.length > 0 && query[0]) {
        filteredTools = filteredTools.filter(tool =>
            query.some(keyword => tool.name.toLowerCase().includes(keyword) || tool.description.toLowerCase().includes(keyword))
        );
    }
    if (category) {
        filteredTools = filteredTools.filter(tool => tool.category === category);
    }
    currentPage = 1;
    displayTools(filteredTools);
    displayRecommendedTools();
}

function filterTools() {
    const category = document.getElementById('categoryFilterTools').value;
    toolsData = aiTools.filter(tool => !category || tool.category === category);
    currentPage = 1;
    displayTools(toolsData);
    displayRecommendedTools();
}

// Bookmark Cloud (Firebase)
function addBookmark(toolId) {
    const user = auth.currentUser;
    if (user) {
        db.collection('bookmarks').doc(user.uid).collection('userBookmarks').doc(toolId.toString()).set({
            toolId,
            timestamp: new Date().toISOString()
        }).then(() => {
            showNotification('Tool ditambahkan ke bookmark!');
        }).catch(error => {
            console.error('Error adding bookmark:', error);
        });
    } else {
        showNotification('Silakan login terlebih dahulu!', 'error');
    }
}

// Notifikasi Pop-up
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type === 'error' ? 'error' : 'success'} show`;
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3500);
}

// Kontak Form
document.getElementById('contactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    db.collection('contacts').add({
        name,
        email,
        message,
        timestamp: new Date().toISOString()
    }).then(() => {
        document.getElementById('contactSuccess').textContent = '';
        showNotification('Pesan berhasil dikirim!');
        document.getElementById('contactForm').reset();
    }).catch((error) => {
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
    });
}

// Muat saat halaman dimuat
window.onload = () => {
    loadTools();
    auth.onAuthStateChanged(user => {
        if (window.location.pathname.includes('admin.html') && !user) {
            window.location.href = 'admin-login.html';
        }
    });
};
