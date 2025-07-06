// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDq2AiS90quxL8Ck3HmwQ18PwspxS9iqeQ",
    authDomain: "vinai-607a6.firebaseapp.com",
    projectId: "vinai-607a6",
    storageBucket: "vinai-607a6.appspot.com",
    messagingSenderId: "3770054102",
    appId: "1:3770054102:web:eaa4509fc7eae627286077",
    measurementId: "G-QMYLYSBC03"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics();

// AI Tools Data
const aiTools = [
    { id: 1, name: "ChatGPT", category: "research", link: "https://chat.openai.com", description: "AI chatbot untuk penelitian dan percakapan alami.", rating: 4.8, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2023-11-01" },
    { id: 2, name: "Gemini AI", category: "research", link: "https://gemini.google.com", description: "AI dari Google untuk analisis dan pencarian cerdas.", rating: 4.6, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2023-12-15" },
    { id: 3, name: "Perplexity", category: "research", link: "https://perplexity.ai", description: "Mesin pencari AI yang memberikan jawaban mendalam.", rating: 4.7, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2024-01-10" },
    { id: 4, name: "Claude AI", category: "research", link: "https://www.anthropic.com/claude", description: "AI untuk tugas penelitian dengan pemahaman kontekstual.", rating: 4.5, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2024-02-05" },
    { id: 5, name: "Midjourney", category: "image", link: "https://www.midjourney.com", description: "Generator gambar AI dengan kualitas seni tinggi.", rating: 4.9, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2024-03-20" },
    { id: 6, name: "DALL-E 3", category: "image", link: "https://labs.openai.com", description: "AI untuk membuat gambar dari teks dengan detail luar biasa.", rating: 4.7, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2024-04-01" },
    { id: 7, name: "Stability AI", category: "image", link: "https://stability.ai", description: "Platform untuk generasi gambar dan model AI terbuka.", rating: 4.6, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2024-05-10" },
    { id: 8, name: "Rytr", category: "copywriting", link: "https://rytr.me", description: "Alat penulisan AI untuk konten pemasaran dan blog.", rating: 4.4, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2024-06-15" },
    { id: 9, name: "Jasper AI", category: "copywriting", link: "https://www.jasper.ai", description: "AI untuk membuat konten berkualitas tinggi dengan cepat.", rating: 4.8, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2024-07-01" },
    { id: 10, name: "CopyAI", category: "copywriting", link: "https://www.copy.ai", description: "Generator teks AI untuk iklan dan salinan pemasaran.", rating: 4.5, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2024-08-10" },
    { id: 11, name: "Writesonic", category: "copywriting", link: "https://writesonic.com", description: "Alat AI untuk optimasi SEO dan penulisan artikel.", rating: 4.6, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2024-09-05" },
    { id: 12, name: "Synthesia", category: "video", link: "https://www.synthesia.io", description: "AI untuk membuat video dengan avatar digital.", rating: 4.7, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2024-10-01" },
    { id: 13, name: "Runway ML", category: "video", link: "https://runwayml.com", description: "Platform untuk edit video dan generasi AI.", rating: 4.6, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2024-11-15" },
    { id: 14, name: "ElevenLabs", category: "video", link: "https://elevenlabs.io", description: "AI untuk suara sintetis realistis dalam video.", rating: 4.8, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2025-01-01" },
    { id: 15, name: "Llama AI", category: "research", link: "https://ai.meta.com/llama", description: "Model AI terbuka untuk penelitian dan pengembangan.", rating: 4.5, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2025-02-10" },
    { id: 16, name: "DeepSeek R1", category: "research", link: "https://www.deepseek.com", description: "AI untuk analisis data dan penelitian mendalam.", rating: 4.4, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2025-03-01" },
    { id: 17, name: "Flux", category: "image", link: "https://www.flux.ai", description: "Generator gambar AI dengan efek visual modern.", rating: 4.6, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2025-04-15" },
    { id: 18, name: "Adcreative AI", category: "copywriting", link: "https://www.adcreative.ai", description: "AI untuk membuat iklan kreatif berkinerja tinggi.", rating: 4.7, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2025-05-01" },
    { id: 19, name: "Otio", category: "copywriting", link: "https://otio.app", description: "Alat AI untuk mengelola dan menulis konten dengan efisien.", rating: 4.5, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2025-06-01" },
    { id: 20, name: "Fotor", category: "image", link: "https://www.fotor.com", description: "Editor gambar AI dengan fitur pengeditan canggih.", rating: 4.6, image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=600&q=80&fm=webp", releaseDate: "2025-07-01" },
];

// App State
let currentPage = 1;
const toolsPerPage = 6;
let toolsData = aiTools;
let darkMode = true;
let freeMode = false;
let showNotification = false;

// Alpine.js Init
document.addEventListener('alpine:init', () => {
    Alpine.data('app', () => ({
        darkMode,
        freeMode,
        showNotification: false,
        open: false,
        init() {
            this.darkMode = localStorage.getItem('darkMode') === 'true' || true;
            document.body.classList.toggle('dark', this.darkMode);
            this.freeMode = localStorage.getItem('freeMode') === 'true' || false;
        },
        toggleDarkMode() {
            this.darkMode = !this.darkMode;
            document.body.classList.toggle('dark', this.darkMode);
            localStorage.setItem('darkMode', this.darkMode);
            this.showNotification = true;
            setTimeout(() => this.showNotification = false, 3000);
            showNotification(this.darkMode ? 'Dark Mode Aktif!' : 'Light Mode Aktif!');
        },
        toggleFreeMode() {
            this.freeMode = !this.freeMode;
            localStorage.setItem('freeMode', this.freeMode);
            this.showNotification = true;
            setTimeout(() => this.showNotification = false, 3000);
            showNotification(this.freeMode ? 'Free Mode Aktif!' : 'Free Mode Nonaktif!');
        }
    }));
});

// Auto Dark Mode
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
}

// Firebase Auth State
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

// Email Login
function loginWithEmail() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => window.location.href = 'index.html')
        .catch((error) => {
            document.getElementById('loginError').textContent = error.message;
        });
}

// Google Login
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => window.location.href = 'index.html')
        .catch((error) => {
            document.getElementById('loginError').textContent = error.message;
        });
}

document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    loginWithEmail();
});

// Load Tools
function loadTools() {
    displayTools(toolsData);
    displayRecommendedTools();
    displayJustReleasedTools();
}

// Recommended Tools
function displayRecommendedTools() {
    const recommendedGrid = document.getElementById('recommendedGrid');
    recommendedGrid.innerHTML = '';
    const shuffledTools = toolsData.sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffledTools.forEach(tool => {
        const toolCard = document.createElement('div');
        toolCard.className = 'tool-card bg-gray-800 p-4 rounded-lg shadow-lg';
        toolCard.innerHTML = `
            <img src="${tool.image}" alt="${tool.name}" class="w-full h-40 object-cover rounded-md mb-2" loading="lazy">
            <h3 class="text-xl font-semibold mb-1">${tool.name}</h3>
            <p class="text-sm mb-2">${tool.description}</p>
            <span class="rating text-yellow-400 mb-2">${'★'.repeat(Math.round(tool.rating)).padEnd(5, '☆')} (${tool.rating})</span>
            <a href="${tool.link}" target="_blank" class="login-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full inline-block">Kunjungi</a>
        `;
        recommendedGrid.appendChild(toolCard);
    });
}

// Display Tools
function displayTools(tools) {
    const toolsGrid = document.getElementById('toolsGrid');
    toolsGrid.innerHTML = '';
    const start = (currentPage - 1) * toolsPerPage;
    const end = start + toolsPerPage;
    tools.slice(start, end).forEach(tool => {
        const toolCard = document.createElement('div');
        toolCard.className = 'tool-card bg-gray-800 p-4 rounded-lg shadow-lg';
        toolCard.innerHTML = `
            <img src="${tool.image}" alt="${tool.name}" class="w-full h-40 object-cover rounded-md mb-2" loading="lazy">
            <h3 class="text-xl font-semibold mb-1">${tool.name}</h3>
            <p class="text-sm mb-2">${tool.description}</p>
            <span class="rating text-yellow-400 mb-2">${'★'.repeat(Math.round(tool.rating)).padEnd(5, '☆')} (${tool.rating})</span>
            <a href="${tool.link}" target="_blank" class="login-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full inline-block">Kunjungi</a>
            <button class="login-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full mt-2" onclick="addBookmark('${tool.id}')">Tambah ke Bookmark</button>
        `;
        toolsGrid.appendChild(toolCard);
    });
    updatePagination(tools.length);
}

// Just Released Tools
function displayJustReleasedTools() {
    const justReleasedGrid = document.getElementById('justReleasedGrid');
    justReleasedGrid.innerHTML = '';
    const recentTools = aiTools.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate)).slice(0, 6);
    recentTools.forEach(tool => {
        const toolCard = document.createElement('div');
        toolCard.className = 'tool-card bg-gray-800 p-4 rounded-lg shadow-lg';
        toolCard.innerHTML = `
            <img src="${tool.image}" alt="${tool.name}" class="w-full h-32 object-cover rounded-md mb-2" loading="lazy">
            <h3 class="text-lg font-semibold mb-1">${tool.name}</h3>
            <p class="text-xs mb-1 text-gray-400">Released: ${new Date(tool.releaseDate).toLocaleDateString()}</p>
            <span class="rating text-yellow-400">${'★'.repeat(Math.round(tool.rating)).padEnd(5, '☆')} (${tool.rating})</span>
        `;
        justReleasedGrid.appendChild(toolCard);
    });
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

// Search Tools
function searchTools() {
    const query = document.getElementById('searchInput').value.toLowerCase().split(' ');
    toolsData = aiTools.filter(tool =>
        query.some(keyword => tool.name.toLowerCase().includes(keyword) || tool.description.toLowerCase().includes(keyword))
    );
    currentPage = 1;
    displayTools(toolsData);
    displayRecommendedTools();
}

// Filter by Tabs
function filterByTab(tab) {
    let filteredTools = [...aiTools];
    if (tab === 'latest') {
        filteredTools.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    } else if (tab === 'trending') {
        filteredTools.sort((a, b) => b.rating - a.rating);
    } else if (tab === 'forYou') {
        filteredTools.sort(() => 0.5 - Math.random());
    }
    toolsData = filteredTools;
    currentPage = 1;
    displayTools(toolsData);
    displayRecommendedTools();
}

// Filter by Category
function filterByCategory(category) {
    toolsData = category === 'all' ? [...aiTools] : aiTools.filter(tool => tool.category === category);
    currentPage = 1;
    displayTools(toolsData);
    displayRecommendedTools();
}

// Bookmark
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

// Notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification fixed top-4 right-4 bg-${type === 'error' ? 'red' : 'green'}-800 text-white p-3 rounded-lg shadow-lg z-50`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Contact Form
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
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
            showNotification('Pesan berhasil dikirim!');
            contactForm.reset();
        }).catch((error) => {
            showNotification('Terjadi kesalahan: ' + error.message, 'error');
        });
    });
}

// On Page Load
window.onload = () => {
    loadTools();
    auth.onAuthStateChanged(user => {
        if (window.location.pathname.includes('admin.html') && !user) {
            window.location.href = 'admin-login.html';
        }
    });
};
