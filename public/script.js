// Inisialisasi i18next untuk multibahasa
i18next.init({
    lng: localStorage.getItem('language') || 'id',
    resources: {
        id: { translation: fetch('/locales/id.json').then(res => res.json()) },
        en: { translation: fetch('/locales/en.json').then(res => res.json()) }
    }
}).then(() => updateContent());

function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.innerHTML = i18next.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = i18next.t(key);
    });
}

// Inisialisasi EmailJS
emailjs.init("your-emailjs-user-id"); // Ganti dengan User ID EmailJS Anda

// Variabel global
let currentPage = 1;
const toolsPerPage = 9;
let toolsData = [];

// Fungsi untuk log analitik
function logEvent(eventName, params) {
    gtag('event', eventName, params);
}

// Fungsi untuk log navigasi halaman
function logPageNavigation(page) {
    logEvent('page_view', { page_name: page });
}

// Fungsi untuk log pencarian
function logSearch(query) {
    logEvent('search', { search_term: query });
}

// Fungsi untuk log bookmark
function logBookmarkAdded(toolId) {
    logEvent('bookmark_added', { tool_id: toolId });
}

// Fungsi untuk log ulasan
function logReviewSubmitted(toolId) {
    logEvent('review_submitted', { tool_id: toolId });
}

// Fungsi untuk log perubahan tema
function logThemeChanged(theme) {
    logEvent('theme_changed', { theme: theme });
}

// Fungsi untuk log waktu interaksi
function logInteractionTime(page, duration) {
    logEvent('interaction_time', { page_name: page, duration: duration });
}

// Fungsi untuk memperbarui meta tag dinamis
function updateToolMeta(tool) {
    document.querySelector('meta[name="description"]').setAttribute('content', tool.description);
    document.querySelector('meta[property="og:title"]').setAttribute('content', tool.name);
    document.querySelector('meta[property="og:description"]').setAttribute('content', tool.description);
    document.querySelector('meta[property="og:image"]').setAttribute('content', tool.image || 'https://your-domain.com/images/og-image.webp');
    document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href);
    document.title = `${tool.name} - AI Tools Directory`;
}

// Fungsi untuk mengambil data tools
async function fetchTools() {
    const toolsGrid = document.getElementById('toolsGrid');
    const loading = document.getElementById('loading');
    if (!toolsGrid || !loading) return;

    loading.style.display = 'block';
    try {
        const snapshot = await firebase.database().ref('tools').once('value');
        toolsData = [];
        snapshot.forEach(child => {
            toolsData.push({ id: child.key, ...child.val() });
        });
        filterAndSortTools();
    } catch (error) {
        console.error('Error fetching tools:', error);
        toolsGrid.innerHTML = `<p data-i18n="errorLoading">${i18next.t('errorLoading')}</p>`;
    } finally {
        loading.style.display = 'none';
    }
}

// Fungsi untuk filter dan sort tools
function filterAndSortTools() {
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const sort = document.getElementById('sortFilter')?.value || 'name';
    let filteredTools = [...toolsData];

    if (category !== 'all') {
        filteredTools = filteredTools.filter(tool => tool.category === category);
    }

    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (searchQuery) {
        filteredTools = filteredTools.filter(tool =>
            tool.name.toLowerCase().includes(searchQuery) ||
            tool.description.toLowerCase().includes(searchQuery)
        );
        logSearch(searchQuery);
    }

    filteredTools.sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'category') return a.category.localeCompare(b.category);
        if (sort === 'rating') {
            const ratingA = a.rating || 0;
            const ratingB = b.rating || 0;
            return ratingB - ratingA;
        }
        return 0;
    });

    displayTools(filteredTools);
}

// Fungsi untuk menampilkan tools
function displayTools(tools) {
    const toolsGrid = document.getElementById('toolsGrid');
    if (!toolsGrid) return;

    const start = (currentPage - 1) * toolsPerPage;
    const end = start + toolsPerPage;
    const paginatedTools = tools.slice(start, end);

    toolsGrid.innerHTML = '';
    paginatedTools.forEach(tool => {
        const toolCard = document.createElement('div');
        toolCard.className = 'tool-card';
        toolCard.innerHTML = `
            <img src="${tool.image || '/images/placeholder.webp'}" alt="${tool.name}" loading="lazy">
            <h3>${tool.name}</h3>
            <p>${tool.description.slice(0, 100)}...</p>
            <span class="tag" data-i18n="${tool.category}">${i18next.t(tool.category)}</span>
            <p data-i18n="rating">Rating: ${tool.rating || i18next.t('noRating')}</p>
            <a href="tool.html?id=${tool.id}" class="btn" data-i18n="viewDetails">Lihat Detail</a>
        `;
        toolsGrid.appendChild(toolCard);
    });

    updatePagination(tools.length);
}

// Fungsi untuk memperbarui pagination
function updatePagination(totalTools) {
    const totalPages = Math.ceil(totalTools / toolsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');

    if (pageInfo) {
        pageInfo.textContent = `${i18next.t('page')} ${currentPage} ${i18next.t('of')} ${totalPages}`;
    }

    if (prevPage) prevPage.disabled = currentPage === 1;
    if (nextPage) nextPage.disabled = currentPage === totalPages || totalPages === 0;
}

// Fungsi untuk mengubah halaman
function changePage(direction) {
    currentPage += direction;
    filterAndSortTools();
}

// Fungsi untuk pencarian
function searchTools() {
    currentPage = 1;
    filterAndSortTools();
}

// Fungsi untuk memuat detail tool
async function loadToolDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const toolId = urlParams.get('id');
    const toolName = document.getElementById('toolName');
    const toolImage = document.getElementById('toolImage');
    const toolDescription = document.getElementById('toolDescription');
    const toolCategory = document.getElementById('toolCategory');
    const toolRating = document.getElementById('toolRating');
    const toolLink = document.getElementById('toolLink');
    const reviewsList = document.getElementById('reviewsList');

    if (!toolId || !toolName || !toolImage || !toolDescription || !toolCategory || !toolRating || !toolLink || !reviewsList) return;

    try {
        const snapshot = await firebase.database().ref(`tools/${toolId}`).once('value');
        if (snapshot.exists()) {
            const tool = snapshot.val();
            toolName.textContent = tool.name;
            toolImage.src = tool.image || '/images/placeholder.webp';
            toolImage.alt = tool.name;
            toolDescription.textContent = tool.description;
            toolCategory.textContent = i18next.t(tool.category);
            toolCategory.className = 'tag';
            toolRating.textContent = `${i18next.t('rating')}: ${tool.rating || i18next.t('noRating')}`;
            toolLink.href = tool.url;
            updateToolMeta({ ...tool, id: toolId });

            // Load ulasan
            const reviewsSnapshot = await firebase.database().ref(`tools/${toolId}/reviews`).once('value');
            reviewsList.innerHTML = '';
            reviewsSnapshot.forEach(review => {
                const reviewData = review.val();
                const reviewItem = document.createElement('div');
                reviewItem.className = 'review-item';
                reviewItem.innerHTML = `
                    <p><strong>${i18next.t('rating')}:</strong> ${reviewData.rating}/5</p>
                    <p>${reviewData.comment}</p>
                    <p><small>${new Date(reviewData.timestamp).toLocaleString()}</small></p>
                `;
                reviewsList.appendChild(reviewItem);
            });
        } else {
            toolName.textContent = i18next.t('toolNotFound');
        }
    } catch (error) {
        console.error('Error loading tool details:', error);
        toolName.textContent = i18next.t('errorLoading');
    }
}

// Fungsi untuk menyimpan bookmark
async function saveBookmark(toolId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert(i18next.t('loginRequired'));
        window.location.href = 'login.html';
        return;
    }
    try {
        const bookmarkRef = firebase.firestore().collection('bookmarks').doc(user.uid);
        const doc = await bookmarkRef.get();
        let tools = doc.exists ? doc.data().tools || [] : [];
        if (!tools.includes(toolId)) {
            tools.push(toolId);
            await bookmarkRef.set({ tools }, { merge: true });
            alert(i18next.t('bookmarkSaved'));
            logBookmarkAdded(toolId);
        }
    } catch (error) {
        console.error('Error saving bookmark:', error);
        alert(i18next.t('bookmarkError'));
    }
}

// Fungsi untuk memuat bookmark
async function loadBookmarks() {
    const user = firebase.auth().currentUser;
    const bookmarksGrid = document.getElementById('bookmarksGrid');
    if (!user || !bookmarksGrid) {
        bookmarksGrid.innerHTML = `<p data-i18n="loginRequired">${i18next.t('loginRequired')}</p>`;
        return;
    }

    try {
        const doc = await firebase.firestore().collection('bookmarks').doc(user.uid).get();
        if (doc.exists) {
            const bookmarkedToolIds = doc.data().tools || [];
            const bookmarkedTools = [];

            for (const toolId of bookmarkedToolIds) {
                const toolRef = firebase.database().ref(`tools/${toolId}`);
                const snapshot = await toolRef.once('value');
                if (snapshot.exists()) {
                    bookmarkedTools.push({ id: toolId, ...snapshot.val() });
                }
            }

            displayTools(bookmarkedTools);
        } else {
            bookmarksGrid.innerHTML = `<p data-i18n="noBookmarks">${i18next.t('noBookmarks')}</p>`;
        }
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        bookmarksGrid.innerHTML = `<p data-i18n="errorBookmarks">${i18next.t('errorBookmarks')}</p>`;
    }
}

// Fungsi untuk mengirim ulasan
async function submitReview(toolId, rating, comment) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert(i18next.t('loginRequired'));
        window.location.href = 'login.html';
        return;
    }
    try {
        await firebase.database().ref(`tools/${toolId}/reviews`).push({
            userId: user.uid,
            rating: parseInt(rating),
            comment: comment,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        document.getElementById('reviewError').style.display = 'none';
        alert(i18next.t('reviewSubmitted'));
        logReviewSubmitted(toolId);
        loadToolDetails();
    } catch (error) {
        console.error('Error submitting review:', error);
        document.getElementById('reviewError').style.display = 'block';
        document.getElementById('reviewError').textContent = i18next.t('reviewError');
    }
}

// Fungsi untuk mengirim formulir kontak
async function submitContactForm(name, email, message) {
    const recaptchaResponse = grecaptcha.getResponse();
    if (!recaptchaResponse) {
        document.getElementById('formError').style.display = 'block';
        document.getElementById('formError').textContent = i18next.t('recaptchaRequired');
        return;
    }

    try {
        // Kirim ke backend
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message, recaptchaResponse })
        });
        const result = await response.json();
        if (response.ok) {
            // Kirim email via EmailJS
            await emailjs.send('service_zrumu1h', 'template_b3ayww4', {
                from_name: name,
                from_email: email,
                message: message
            });
            document.getElementById('formError').style.display = 'none';
            alert(i18next.t('messageSent'));
            logEvent('contact_form_submitted', { email: email });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error submitting contact form:', error);
        document.getElementById('formError').style.display = 'block';
        document.getElementById('formError').textContent = `${i18next.t('formError')} ${error.message}`;
    }
}

// Fungsi untuk autentikasi
async function login(email, password) {
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        document.getElementById('authError').style.display = 'none';
        alert(i18next.t('loginSuccess'));
        window.location.href = 'index.html';
        logEvent('login', { method: 'email' });
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('authError').style.display = 'block';
        document.getElementById('authError').textContent = i18next.t('loginError') + ': ' + error.message;
    }
}

async function register(email, password) {
    try {
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        document.getElementById('authError').style.display = 'none';
        alert(i18next.t('registerSuccess'));
        window.location.href = 'index.html';
        logEvent('sign_up', { method: 'email' });
    } catch (error) {
        console.error('Register error:', error);
        document.getElementById('authError').style.display = 'block';
        document.getElementById('authError').textContent = i18next.t('registerError') + ': ' + error.message;
    }
}

function logout() {
    firebase.auth().signOut().then(() => {
        alert(i18next.t('logoutSuccess'));
        window.location.href = 'index.html';
        logEvent('logout', {});
    }).catch(error => {
        console.error('Logout error:', error);
        alert(i18next.t('logoutError'));
    });
}

// Fungsi untuk inisialisasi notifikasi push
function initPushNotifications() {
    const messaging = firebase.messaging();
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            messaging.getToken({ vapidKey: 'your-vapid-key' }).then(token => {
                console.log('Push token:', token);
                // Simpan token ke Firestore untuk mengirim notifikasi nanti
                const user = firebase.auth().currentUser;
                if (user) {
                    firebase.firestore().collection('users').doc(user.uid).set({
                        pushToken: token
                    }, { merge: true });
                }
            }).catch(error => console.error('Error getting push token:', error));
        }
    });
}

// Fungsi untuk menampilkan PWA install prompt
let deferredPrompt;
function showInstallPrompt() {
    if (deferredPrompt) {
        const installPrompt = document.createElement('div');
        installPrompt.className = 'install-prompt';
        installPrompt.innerHTML = `
            <p data-i18n="installPrompt">Install aplikasi AI Tools Directory untuk akses lebih cepat!</p>
            <button onclick="installApp()">Install</button>
        `;
        document.body.appendChild(installPrompt);
    }
}

function installApp() {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
        if (choice.outcome === 'accepted') {
            logEvent('pwa_installed', {});
        }
        document.querySelector('.install-prompt').remove();
        deferredPrompt = null;
    });
}

// Event listener untuk PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
});

// Event listener untuk perubahan autentikasi
firebase.auth().onAuthStateChanged(user => {
    const loginLink = document.getElementById('loginLink');
    const logoutButton = document.getElementById('logoutButton');
    if (user) {
        loginLink.textContent = i18next.t('logout');
        loginLink.href = '#';
        loginLink.onclick = logout;
        if (logoutButton) logoutButton.style.display = 'block';
        initPushNotifications();
    } else {
        loginLink.textContent = i18next.t('login');
        loginLink.href = 'login.html';
        loginLink.onclick = null;
        if (logoutButton) logoutButton.style.display = 'none';
    }
});

// Event listener untuk perubahan bahasa
document.getElementById('languageSelect')?.addEventListener('change', (e) => {
    i18next.changeLanguage(e.target.value, () => {
        localStorage.setItem('language', e.target.value);
        updateContent();
        if (window.location.pathname.includes('index.html')) {
            fetchTools();
        } else if (window.location.pathname.includes('tool.html')) {
            loadToolDetails();
        } else if (window.location.pathname.includes('bookmarks.html')) {
            loadBookmarks();
        } else if (window.location.pathname.includes('login.html')) {
            updateContent();
        }
    });
});

// Event listener untuk toggle tema
document.getElementById('themeToggle')?.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    logThemeChanged(theme);
});

// Event listener untuk filter dan sort
document.getElementById('categoryFilter')?.addEventListener('change', () => {
    currentPage = 1;
    filterAndSortTools();
});
document.getElementById('sortFilter')?.addEventListener('change', () => {
    filterAndSortTools();
});

// Event listener untuk form kontak
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    await submitContactForm(name, email, message);
    document.getElementById('contactForm').reset();
    grecaptcha.reset();
});

// Event listener untuk form ulasan
document.getElementById('reviewForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const toolId = urlParams.get('id');
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;
    await submitReview(toolId, rating, comment);
    document.getElementById('reviewForm').reset();
});

// Event listener untuk tombol bookmark
document.getElementById('bookmarkTool')?.addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const toolId = urlParams.get('id');
    saveBookmark(toolId);
});

// Event listener untuk autentikasi
document.getElementById('loginButton')?.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login(email, password);
});

document.getElementById('registerButton')?.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await register(email, password);
});

document.getElementById('logoutButton')?.addEventListener('click', logout);

// Event listener untuk navigasi responsif
document.querySelector('.nav-toggle')?.addEventListener('click', () => {
    document.querySelector('nav').classList.toggle('active');
});

// Event listener untuk log navigasi halaman
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
        const page = link.getAttribute('href').split('/').pop().split('.')[0] || 'index';
        logPageNavigation(page);
    });
});

// Event listener untuk log waktu interaksi
let pageStartTime = Date.now();
window.addEventListener('beforeunload', () => {
    const page = window.location.pathname.split('/').pop().split('.')[0] || 'index';
    const duration = (Date.now() - pageStartTime) / 1000;
    logInteractionTime(page, duration);
});

// Inisialisasi tema dari localStorage
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // Muat konten berdasarkan halaman
    if (window.location.pathname.includes('index.html')) {
        fetchTools();
    } else if (window.location.pathname.includes('tool.html')) {
        loadToolDetails();
    } else if (window.location.pathname.includes('bookmarks.html')) {
        loadBookmarks();
    } else if (window.location.pathname.includes('login.html')) {
        updateContent();
    }

    // Inisialisasi bahasa dari localStorage
    const savedLang = localStorage.getItem('language') || 'id';
    document.getElementById('languageSelect').value = savedLang;
    i18next.changeLanguage(savedLang, updateContent);
});

// Service Worker untuk caching
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('Service Worker registered:', registration))
            .catch(error => console.error('Service Worker registration failed:', error));
    });
}
