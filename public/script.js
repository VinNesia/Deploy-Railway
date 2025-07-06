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

// State
let currentPage = 1;
const toolsPerPage = 6;
let toolsData = [];

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

// Muat Tools dengan AJAX
async function loadTools() {
    try {
        const snapshot = await db.collection('tools').get();
        toolsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayTools(toolsData);
        displayRecommendedTools();
    } catch (error) {
        console.error('Error loading tools:', error);
    }
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
            <img src="${tool.image || 'https://via.placeholder.com/250x150'}" alt="${tool.name}">
            <h3>${tool.name}</h3>
            <p>${tool.description}</p>
            <span class="rating">${'★'.repeat(Math.round(tool.rating || 0)).padEnd(5, '☆')} (${tool.rating || 0})</span>
            <a href="tool.html?id=${tool.id}" class="login-btn">Lihat Detail</a>
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
            <img src="${tool.image || 'https://via.placeholder.com/250x150'}" alt="${tool.name}">
            <h3>${tool.name}</h3>
            <p>${tool.description}</p>
            <span class="rating">${'★'.repeat(Math.round(tool.rating || 0)).padEnd(5, '☆')} (${tool.rating || 0})</span>
            <a href="tool.html?id=${tool.id}" class="login-btn">Lihat Detail</a>
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
    let filteredTools = toolsData;
    if (category) {
        filteredTools = filteredTools.filter(tool => tool.category === category);
    }
    currentPage = 1;
    displayTools(filteredTools);
}

// Bookmark Cloud (Firebase)
function addBookmark(toolId) {
    const user = auth.currentUser;
    if (user) {
        db.collection('bookmarks').doc(user.uid).collection('userBookmarks').doc(toolId).set({
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
