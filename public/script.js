// Inisialisasi i18next
i18next.init({
    lng: localStorage.getItem('language') || 'id',
    resources: {
        id: { translation: await fetch('/locales/id.json').then(res => res.json()) },
        en: { translation: await fetch('/locales/en.json').then(res => res.json()) }
    }
}, function(err, t) {
    updateContent();
});

// Fungsi untuk memperbarui konten multibahasa
function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = i18next.t(key);
    });
    document.querySelectorAll('[data-i18n\\[placeholder\\]]').forEach(element => {
        const key = element.getAttribute('data-i18n[placeholder]');
        element.placeholder = i18next.t(key);
    });
}

// Inisialisasi Firebase
const firebaseConfig = {
    // Ganti dengan konfigurasi Firebase Anda
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
const analytics = firebase.analytics();

// Variabel global
let currentPage = 1;
const itemsPerPage = 6;
let currentBlogPage = 1;
let allTools = [];
let allPosts = [];

// Inisialisasi Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(error => {
        console.error('Service Worker registration failed:', error);
    });
}

// Inisialisasi Push Notifications
function initPushNotifications() {
    const messaging = firebase.messaging();
    messaging.requestPermission().then(() => {
        return messaging.getToken();
    }).then(token => {
        console.log('Push token:', token);
        // Kirim token ke server jika diperlukan
    }).catch(error => {
        console.error('Error getting push token:', error);
    });
}

// Tema Gelap/Terang
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// Ganti Bahasa
const languageSelect = document.getElementById('languageSelect');
if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
        i18next.changeLanguage(e.target.value, () => {
            localStorage.setItem('language', e.target.value);
            updateContent();
        });
    });
}

// Navigasi Hamburger
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('nav');
if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
    });
}

// Autentikasi
auth.onAuthStateChanged(user => {
    const loginLink = document.getElementById('loginLink');
    const adminLink = document.getElementById('adminLink');
    const logoutButton = document.getElementById('logoutButton');
    if (user) {
        loginLink.style.display = 'none';
        logoutButton.style.display = 'block';
        if (user.email === 'admin@aitoolsdirectory.com') {
            adminLink.style.display = 'block';
        }
        loadBookmarks();
        initPushNotifications();
    } else {
        loginLink.style.display = 'block';
        logoutButton.style.display = 'none';
        adminLink.style.display = 'none';
    }
});

// Login
document.getElementById('loginButton')?.addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            Swal.fire(i18next.t('loginSuccess'), '', 'success');
            setTimeout(() => location.href = 'index.html', 1000);
        })
        .catch(error => {
            document.getElementById('authError').style.display = 'block';
            document.getElementById('authError').textContent = i18next.t('loginError') + ': ' + error.message;
        });
});

// Register
document.getElementById('registerButton')?.addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            Swal.fire(i18next.t('registerSuccess'), '', 'success');
            setTimeout(() => location.href = 'index.html', 1000);
        })
        .catch(error => {
            document.getElementById('authError').style.display = 'block';
            document.getElementById('authError').textContent = i18next.t('registerError') + ': ' + error.message;
        });
});

// Logout
document.getElementById('logoutButton')?.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            Swal.fire(i18next.t('logoutSuccess'), '', 'success');
            setTimeout(() => location.href = 'index.html', 1000);
        })
        .catch(error => {
            Swal.fire(i18next.t('logoutError'), error.message, 'error');
        });
});

// Load Tools
async function loadTools() {
    document.getElementById('loading').style.display = 'block';
    try {
        const response = await fetch('/api/tools');
        allTools = await response.json();
        renderTools(allTools);
    } catch (error) {
        Swal.fire(i18next.t('errorLoading'), error.message, 'error');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Render Tools
function renderTools(tools) {
    const toolsGrid = document.getElementById('toolsGrid');
    if (!toolsGrid) return;
    toolsGrid.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedTools = tools.slice(start, end);

    paginatedTools.forEach(tool => {
        const card = document.createElement('div');
        card.className = 'tool-card';
        card.innerHTML = `
            <img src="${tool.image || '/images/placeholder.webp'}" alt="${tool.name}" loading="lazy">
            <h3>${tool.name}</h3>
            <p>${tool.description.substring(0, 100)}...</p>
            <p class="tag">${tool.category}</p>
            <a href="tool.html?id=${tool.id}" class="btn" data-i18n="viewDetails">Lihat Detail</a>
        `;
        toolsGrid.appendChild(card);
    });

    updatePagination(tools.length);
}

// Update Pagination
function updatePagination(totalItems) {
    const pageInfo = document.getElementById('pageInfo');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
}

// Change Page
function changePage(direction) {
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    renderTools(allTools);
}

// Load Blog Posts
async function loadBlogPosts() {
    document.getElementById('loading').style.display = 'block';
    try {
        const response = await fetch('/api/blog-posts');
        allPosts = await response.json();
        renderBlogPosts(allPosts);
    } catch (error) {
        Swal.fire(i18next.t('errorLoading'), error.message, 'error');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Render Blog Posts
function renderBlogPosts(posts) {
    const blogGrid = document.getElementById('blogGrid');
    const blogContent = document.getElementById('blogContent');
    if (!blogGrid || !blogContent) return;

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        const post = allPosts.find(p => p.id === postId);
        if (post) {
            blogGrid.style.display = 'none';
            blogContent.style.display = 'block';
            document.getElementById('blogTitle').textContent = post.title;
            document.getElementById('blogImage').src = post.image || '/images/placeholder.webp';
            document.getElementById('blogImage').alt = post.title;
            document.getElementById('blogDate').textContent = new Date(post.date).toLocaleDateString();
            document.getElementById('blogBody').innerHTML = post.body;

            // Update SEO
            document.querySelector('meta[name="description"]').content = post.description.substring(0, 160);
            document.querySelector('meta[name="keywords"]').content = post.tags.join(', ');
            document.querySelector('meta[property="og:title"]').content = post.title;
            document.querySelector('meta[property="og:description"]').content = post.description.substring(0, 160);
            document.querySelector('meta[property="og:image"]').content = post.image || '/images/og-image.webp';
            document.querySelector('meta[property="og:url"]').content = window.location.href;
            document.title = `${post.title} - AI Tools Directory`;

            loadComments(postId);
        } else {
            blogContent.innerHTML = `<p data-i18n="postNotFound">Artikel tidak ditemukan</p>`;
        }
    } else {
        blogGrid.style.display = 'grid';
        blogContent.style.display = 'none';
        blogGrid.innerHTML = '';
        const start = (currentBlogPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedPosts = posts.slice(start, end);

        paginatedPosts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'blog-card';
            card.innerHTML = `
                <img src="${post.image || '/images/placeholder.webp'}" alt="${post.title}" loading="lazy">
                <h3>${post.title}</h3>
                <p>${post.description.substring(0, 100)}...</p>
                <p class="tag">${post.tags.join(', ')}</p>
                <a href="blog.html?id=${post.id}" class="btn" data-i18n="viewDetails">Lihat Detail</a>
            `;
            blogGrid.appendChild(card);
        });

        updateBlogPagination(posts.length);
    }
}

// Update Blog Pagination
function updateBlogPagination(totalItems) {
    const pageInfo = document.getElementById('pageInfo');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    pageInfo.textContent = `Halaman ${currentBlogPage} dari ${totalPages}`;
    prevPage.disabled = currentBlogPage === 1;
    nextPage.disabled = currentBlogPage === totalPages;
}

// Change Blog Page
function changeBlogPage(direction) {
    currentBlogPage += direction;
    if (currentBlogPage < 1) currentBlogPage = 1;
    renderBlogPosts(allPosts);
}

// Load Comments
async function loadComments(postId) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    commentsList.innerHTML = '';
    try {
        const snapshot = await database.ref(`blog_comments/${postId}`).once('value');
        snapshot.forEach(child => {
            const comment = child.val();
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment';
            commentDiv.innerHTML = `
                <p><strong>${comment.user}</strong></p>
                <p>${comment.text}</p>
                <p class="comment-date">${new Date(comment.timestamp).toLocaleString()}</p>
            `;
            commentsList.appendChild(commentDiv);
        });
    } catch (error) {
        Swal.fire(i18next.t('errorLoading'), error.message, 'error');
    }
}

// Submit Comment
document.getElementById('commentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        Swal.fire(i18next.t('loginRequired'), '', 'warning');
        return;
    }
    const comment = document.getElementById('comment').value;
    const postId = new URLSearchParams(window.location.search).get('id');
    try {
        await database.ref(`blog_comments/${postId}`).push({
            user: user.email,
            text: comment,
            timestamp: new Date().toISOString()
        });
        document.getElementById('commentForm').reset();
        Swal.fire(i18next.t('commentSubmitted'), '', 'success');
        loadComments(postId);
    } catch (error) {
        document.getElementById('commentError').style.display = 'block';
        document.getElementById('commentError').textContent = i18next.t('commentError') + ': ' + error.message;
    }
});

// Search Blog
function searchBlog() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) || 
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    currentBlogPage = 1;
    renderBlogPosts(filteredPosts);
}

// Share Blog
function shareBlog(platform) {
    const url = window.location.href;
    const title = document.getElementById('blogTitle').textContent;
    let shareUrl;
    switch (platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
            break;
    }
    window.open(shareUrl, '_blank');
}

// Load Tool Details
async function loadToolDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const toolId = urlParams.get('id');
    if (!toolId) return;
    document.getElementById('loading').style.display = 'block';
    try {
        const response = await fetch(`/api/tools/${toolId}`);
        const tool = await response.json();
        document.getElementById('toolName').textContent = tool.name;
        document.getElementById('toolImage').src = tool.image || '/images/placeholder.webp';
        document.getElementById('toolImage').alt = tool.name;
        document.getElementById('toolDescription').textContent = tool.description;
        document.getElementById('toolCategory').textContent = tool.category;
        document.getElementById('toolRating').textContent = tool.rating ? `Rating: ${tool.rating}/5` : i18next.t('noRating');
        document.getElementById('toolLink').href = tool.url;

        // Update SEO
        document.querySelector('meta[name="description"]').content = tool.description.substring(0, 160);
        document.querySelector('meta[name="keywords"]').content = tool.tags.join(', ');
        document.querySelector('meta[property="og:title"]').content = tool.name;
        document.querySelector('meta[property="og:description"]').content = tool.description.substring(0, 160);
        document.querySelector('meta[property="og:image"]').content = tool.image || '/images/og-image.webp';
        document.querySelector('meta[property="og:url"]').content = window.location.href;
        document.title = `${tool.name} - AI Tools Directory`;

        loadReviews(toolId);
    } catch (error) {
        Swal.fire(i18next.t('toolNotFound'), error.message, 'error');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Load Reviews
async function loadReviews(toolId) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    reviewsList.innerHTML = '';
    try {
        const snapshot = await database.ref(`tools/${toolId}/reviews`).once('value');
        snapshot.forEach(child => {
            const review = child.val();
            const reviewDiv = document.createElement('div');
            reviewDiv.className = 'review';
            reviewDiv.innerHTML = `
                <p><strong>${review.user}</strong>: ${review.rating}/5</p>
                <p>${review.comment}</p>
            `;
            reviewsList.appendChild(reviewDiv);
        });
    } catch (error) {
        Swal.fire(i18next.t('errorLoading'), error.message, 'error');
    }
}

// Submit Review
document.getElementById('reviewForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        Swal.fire(i18next.t('loginRequired'), '', 'warning');
        return;
    }
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;
    const toolId = new URLSearchParams(window.location.search).get('id');
    try {
        await database.ref(`tools/${toolId}/reviews`).push({
            user: user.email,
            rating: parseInt(rating),
            comment,
            timestamp: new Date().toISOString()
        });
        document.getElementById('reviewForm').reset();
        Swal.fire(i18next.t('reviewSubmitted'), '', 'success');
        loadReviews(toolId);
    } catch (error) {
        document.getElementById('reviewError').style.display = 'block';
        document.getElementById('reviewError').textContent = i18next.t('reviewError') + ': ' + error.message;
    }
});

// Load Bookmarks
async function loadBookmarks() {
    const bookmarksGrid = document.getElementById('bookmarksGrid');
    if (!bookmarksGrid) return;
    bookmarksGrid.innerHTML = '';
    const user = auth.currentUser;
    if (!user) {
        bookmarksGrid.innerHTML = `<p data-i18n="loginRequired">${i18next.t('loginRequired')}</p>`;
        return;
    }
    try {
        const snapshot = await database.ref(`users/${user.uid}/bookmarks`).once('value');
        const bookmarks = [];
        snapshot.forEach(child => {
            bookmarks.push(child.val());
        });
        if (bookmarks.length === 0) {
            bookmarksGrid.innerHTML = `<p data-i18n="noBookmarks">${i18next.t('noBookmarks')}</p>`;
            return;
        }
        bookmarks.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'tool-card';
            card.innerHTML = `
                <img src="${tool.image || '/images/placeholder.webp'}" alt="${tool.name}" loading="lazy">
                <h3>${tool.name}</h3>
                <p>${tool.description.substring(0, 100)}...</p>
                <p class="tag">${tool.category}</p>
                <a href="tool.html?id=${tool.id}" class="btn" data-i18n="viewDetails">Lihat Detail</a>
                <button class="btn" onclick="removeBookmark('${tool.id}')" data-i18n="removeBookmark">Hapus</button>
            `;
            bookmarksGrid.appendChild(card);
        });
    } catch (error) {
        Swal.fire(i18next.t('errorBookmarks'), error.message, 'error');
    }
}

// Bookmark Tool
document.getElementById('bookmarkTool')?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        Swal.fire(i18next.t('loginRequired'), '', 'warning');
        return;
    }
    const toolId = new URLSearchParams(window.location.search).get('id');
    try {
        const response = await fetch(`/api/tools/${toolId}`);
        const tool = await response.json();
        await database.ref(`users/${user.uid}/bookmarks/${toolId}`).set(tool);
        Swal.fire(i18next.t('bookmarkSaved'), '', 'success');
    } catch (error) {
        Swal.fire(i18next.t('bookmarkError'), error.message, 'error');
    }
});

// Remove Bookmark
async function removeBookmark(toolId) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await database.ref(`users/${user.uid}/bookmarks/${toolId}`).remove();
        Swal.fire(i18next.t('bookmarkRemoved'), '', 'success');
        loadBookmarks();
    } catch (error) {
        Swal.fire(i18next.t('bookmarkError'), error.message, 'error');
    }
}

// Search Tools
function searchTools() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredTools = allTools.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm) || 
        tool.description.toLowerCase().includes(searchTerm) || 
        tool.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    currentPage = 1;
    renderTools(filteredTools);
}

// Filter Tools
document.getElementById('categoryFilter')?.addEventListener('change', filterTools);
document.getElementById('tagFilter')?.addEventListener('input', filterTools);
document.getElementById('sortFilter')?.addEventListener('change', filterTools);

function filterTools() {
    const category = document.getElementById('categoryFilter')?.value;
    const tag = document.getElementById('tagFilter')?.value.toLowerCase();
    const sort = document.getElementById('sortFilter')?.value;

    let filteredTools = allTools;
    if (category && category !== 'all') {
        filteredTools = filteredTools.filter(tool => tool.category === category);
    }
    if (tag) {
        filteredTools = filteredTools.filter(tool => 
            tool.tags.some(t => t.toLowerCase().includes(tag))
        );
    }
    if (sort) {
        filteredTools.sort((a, b) => {
            if (sort === 'name') return a.name.localeCompare(b.name);
            if (sort === 'category') return a.category.localeCompare(b.category);
            if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
        });
    }
    currentPage = 1;
    renderTools(filteredTools);
}

// Submit Contact Form
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    const recaptchaResponse = grecaptcha.getResponse();

    if (!recaptchaResponse) {
        document.getElementById('formError').style.display = 'block';
        document.getElementById('formError').textContent = i18next.t('recaptchaRequired');
        return;
    }

    try {
        const response = await fetch('/api/csrf-token');
        const { csrfToken } = await response.json();
        document.getElementById('csrfToken').value = csrfToken;

        const formData = { name, email, message, recaptchaResponse, _csrf: csrfToken };
        const submitResponse = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await submitResponse.json();
        if (submitResponse.ok) {
            Swal.fire(i18next.t('messageSent'), '', 'success');
            document.getElementById('contactForm').reset();
            grecaptcha.reset();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        document.getElementById('formError').style.display = 'block';
        document.getElementById('formError').textContent = i18next.t('formError') + ': ' + error.message;
    }
});

// Admin: Load Tools
async function loadAdminTools() {
    const adminContent = document.getElementById('adminContent');
    const authMessage = document.getElementById('authMessage');
    if (auth.currentUser?.email !== 'admin@aitoolsdirectory.com') {
        authMessage.style.display = 'block';
        return;
    }
    adminContent.style.display = 'block';
    const toolsList = document.getElementById('toolsList');
    try {
        const response = await fetch('/api/tools');
        const tools = await response.json();
        toolsList.innerHTML = '';
        tools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'tool-card';
            card.innerHTML = `
                <h3>${tool.name}</h3>
                <p>${tool.description.substring(0, 100)}...</p>
                <button class="btn" onclick="editTool('${tool.id}')" data-i18n="editTool">Edit</button>
                <button class="btn" onclick="deleteTool('${tool.id}')" data-i18n="deleteTool">Hapus</button>
            `;
            toolsList.appendChild(card);
        });
    } catch (error) {
        Swal.fire(i18next.t('errorLoading'), error.message, 'error');
    }
}

// Admin: Edit Tool
async function editTool(toolId) {
    try {
        const response = await fetch(`/api/tools/${toolId}`);
        const tool = await response.json();
        document.getElementById('toolId').value = tool.id;
        document.getElementById('toolName').value = tool.name;
        document.getElementById('toolDescription').value = tool.description;
        document.getElementById('toolCategory').value = tool.category;
        document.getElementById('toolTags').value = tool.tags.join(', ');
        document.getElementById('toolUrl').value = tool.url;
        document.getElementById('toolImage').value = tool.image;
    } catch (error) {
        Swal.fire(i18next.t('errorLoading'), error.message, 'error');
    }
}

// Admin: Delete Tool
async function deleteTool(toolId) {
    Swal.fire({
        title: i18next.t('confirmDelete'),
        text: i18next.t('confirmDeleteText'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: i18next.t('deleteTool'),
        cancelButtonText: i18next.t('cancel')
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/admin/tools/${toolId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${await auth.currentUser.getIdToken()}` }
                });
                if (response.ok) {
                    Swal.fire(i18next.t('toolDeleted'), '', 'success');
                    loadAdminTools();
                } else {
                    throw new Error((await response.json()).error);
                }
            } catch (error) {
                Swal.fire(i18next.t('errorDeleting'), error.message, 'error');
            }
        }
    });
}

// Admin: Submit Tool
document.getElementById('toolForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('toolId').value;
    const name = document.getElementById('toolName').value;
    const description = document.getElementById('toolDescription').value;
    const category = document.getElementById('toolCategory').value;
    const tags = document.getElementById('toolTags').value.split(',').map(tag => tag.trim());
    const url = document.getElementById('toolUrl').value;
    const image = document.getElementById('toolImage').value;

    if (!name || !description || !category || !url) {
        Swal.fire(i18next.t('fillAllFields'), '', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/admin/tools', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
            },
            body: JSON.stringify({ id, name, description, category, tags, url, image })
        });
        if (response.ok) {
            Swal.fire(id ? i18next.t('toolUpdated') : i18next.t('toolAdded'), '', 'success');
            document.getElementById('toolForm').reset();
            loadAdminTools();
        } else {
            throw new Error((await response.json()).error);
        }
    } catch (error) {
        Swal.fire(i18next.t('errorSaving'), error.message, 'error');
    }
});

// Inisialisasi halaman
if (document.getElementById('toolsGrid')) loadTools();
if (document.getElementById('blogGrid')) loadBlogPosts();
if (document.getElementById('toolName')) loadToolDetails();
if (document.getElementById('bookmarksGrid')) loadBookmarks();
if (document.getElementById('adminContent')) loadAdminTools();
