// Inisialisasi Firebase
const firebaseConfig = firebaseConfigFromFile; // Dari firebase-config.js
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const messaging = firebase.messaging();

// Inisialisasi i18next
i18next.init({
    lng: localStorage.getItem('language') || 'id',
    resources: {
        id: { translation: fetch('/locales/id.json').then(res => res.json()) },
        en: { translation: fetch('/locales/en.json').then(res => res.json()) }
    }
}).then(() => {
    updateContent();
});

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

document.getElementById('languageSelect')?.addEventListener('change', (e) => {
    i18next.changeLanguage(e.target.value).then(() => {
        localStorage.setItem('language', e.target.value);
        updateContent();
    });
});

document.getElementById('themeToggle')?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

// Navigasi Mobile
document.querySelector('.nav-toggle')?.addEventListener('click', () => {
    document.querySelector('nav').classList.toggle('active');
});

// Autentikasi
auth.onAuthStateChanged(user => {
    const loginLink = document.getElementById('loginLink');
    const logoutButton = document.getElementById('logoutButton');
    const adminLink = document.getElementById('adminLink');
    if (user) {
        loginLink.style.display = 'none';
        logoutButton.style.display = 'inline-block';
        if (user.email === 'admin@aitoolsdirectory.com') {
            adminLink.style.display = 'inline-block';
        }
    } else {
        loginLink.style.display = 'inline-block';
        logoutButton.style.display = 'none';
        adminLink.style.display = 'none';
        if (document.getElementById('adminContent')) {
            document.getElementById('authMessage').style.display = 'block';
            document.getElementById('adminContent').style.display = 'none';
        }
    }
});

// Logout
document.getElementById('logoutButton')?.addEventListener('click', () => {
    auth.signOut().then(() => {
        Swal.fire(i18next.t('logoutSuccess'), '', 'success');
    }).catch(error => {
        Swal.fire(i18next.t('logoutError'), error.message, 'error');
    });
});

// Login/Registrasi
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password).then(() => {
        Swal.fire(i18next.t('loginSuccess'), '', 'success').then(() => {
            window.location.href = 'index.html';
        });
    }).catch(error => {
        document.getElementById('authError').textContent = i18next.t('loginError') + ': ' + error.message;
        document.getElementById('authError').style.display = 'block';
    });
});

document.getElementById('registerButton')?.addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password).then(() => {
        Swal.fire(i18next.t('registerSuccess'), '', 'success').then(() => {
            window.location.href = 'index.html';
        });
    }).catch(error => {
        document.getElementById('authError').textContent = i18next.t('registerError') + ': ' + error.message;
        document.getElementById('authError').style.display = 'block';
    });
});

// Load Tools
let currentPage = 1;
const toolsPerPage = 9;
let allTools = [];

async function loadTools() {
    document.getElementById('loading').style.display = 'block';
    try {
        const response = await fetch('/api/tools');
        allTools = await response.json();
        displayTools();
    } catch (error) {
        Swal.fire(i18next.t('errorLoading'), error.message, 'error');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function displayTools() {
    const toolsGrid = document.getElementById('toolsGrid');
    if (!toolsGrid) return;
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const tag = document.getElementById('tagFilter')?.value.toLowerCase();
    const sort = document.getElementById('sortFilter')?.value || 'name';
    let filteredTools = allTools;

    if (category !== 'all') {
        filteredTools = filteredTools.filter(tool => tool.category === category);
    }
    if (tag) {
        filteredTools = filteredTools.filter(tool => tool.tags.some(t => t.toLowerCase().includes(tag)));
    }
    filteredTools.sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'category') return a.category.localeCompare(b.category);
        if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
        return 0;
    });

    const start = (currentPage - 1) * toolsPerPage;
    const end = start + toolsPerPage;
    const paginatedTools = filteredTools.slice(start, end);

    toolsGrid.innerHTML = '';
    if (paginatedTools.length === 0) {
        toolsGrid.innerHTML = `<p data-i18n="noTools">Tidak ada tools ditemukan.</p>`;
    } else {
        paginatedTools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'tool-card';
            card.innerHTML = `
                <img src="${tool.image || '/images/placeholder.webp'}" alt="${tool.name}" loading="lazy">
                <h3>${tool.name}</h3>
                <p>${tool.description.substring(0, 100)}...</p>
                <p>${i18next.t('category')}: ${tool.category}</p>
                <p>${i18next.t('rating')}: ${tool.rating || i18next.t('noRating')}</p>
                <a href="tool.html?id=${tool.id}" class="btn" data-i18n="viewDetails">Lihat Detail</a>
            `;
            toolsGrid.appendChild(card);
        });
    }

    updatePagination(filteredTools.length);
}

function updatePagination(totalItems) {
    const pageInfo = document.getElementById('pageInfo');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const totalPages = Math.ceil(totalItems / toolsPerPage);
    pageInfo.textContent = `${i18next.t('page')} ${currentPage} ${i18next.t('of')} ${totalPages}`;
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
}

function changePage(delta) {
    currentPage += delta;
    displayTools();
}

function searchTools() {
    const query = document.getElementById('searchInput')?.value.toLowerCase();
    if (query) {
        allTools = allTools.filter(tool => tool.name.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query));
        currentPage = 1;
        displayTools();
    } else {
        loadTools();
    }
}

// Load Blog Posts
let currentBlogPage = 1;
const postsPerPage = 6;
let allPosts = [];

async function loadBlogPosts() {
    document.getElementById('loading').style.display = 'block';
    const postId = new URLSearchParams(window.location.search).get('id');
    if (postId) {
        loadBlogPost(postId);
    } else {
        try {
            const response = await fetch('/api/blog-posts');
            allPosts = await response.json();
            displayBlogPosts();
        } catch (error) {
            Swal.fire(i18next.t('errorLoading'), error.message, 'error');
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }
}

function displayBlogPosts() {
    const blogGrid = document.getElementById('blogGrid');
    if (!blogGrid) return;
    const tag = document.getElementById('tagFilter')?.value.toLowerCase();
    let filteredPosts = allPosts;

    if (tag) {
        filteredPosts = filteredPosts.filter(post => post.tags.some(t => t.toLowerCase().includes(tag)));
    }

    const start = (currentBlogPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const paginatedPosts = filteredPosts.slice(start, end);

    blogGrid.innerHTML = '';
    if (paginatedPosts.length === 0) {
        blogGrid.innerHTML = `<p data-i18n="noPosts">Tidak ada artikel ditemukan.</p>`;
    } else {
        paginatedPosts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'blog-card';
            card.innerHTML = `
                <img src="${post.image || '/images/placeholder.webp'}" alt="${post.title}" loading="lazy">
                <h3>${post.title}</h3>
                <p>${post.description.substring(0, 100)}...</p>
                <p>${new Date(post.date).toLocaleDateString()}</p>
                <a href="blog.html?id=${post.id}" class="btn" data-i18n="readMore">Baca Selengkapnya</a>
            `;
            blogGrid.appendChild(card);
        });
    }

    updateBlogPagination(filteredPosts.length);
}

function updateBlogPagination(totalItems) {
    const pageInfo = document.getElementById('pageInfo');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const totalPages = Math.ceil(totalItems / postsPerPage);
    pageInfo.textContent = `${i18next.t('page')} ${currentBlogPage} ${i18next.t('of')} ${totalPages}`;
    prevPage.disabled = currentBlogPage === 1;
    nextPage.disabled = currentBlogPage === totalPages;
}

function changeBlogPage(delta) {
    currentBlogPage += delta;
    displayBlogPosts();
}

async function searchBlog() {
    const query = document.getElementById('searchInput')?.value.toLowerCase();
    if (query) {
        allPosts = allPosts.filter(post => post.title.toLowerCase().includes(query) || post.description.toLowerCase().includes(query));
        currentBlogPage = 1;
        displayBlogPosts();
    } else {
        loadBlogPosts();
    }
}

async function loadBlogPost(postId) {
    try {
        const response = await fetch(`/api/blog-posts/${postId}`);
        const post = await response.json();
        if (!post) {
            Swal.fire(i18next.t('postNotFound'), '', 'error');
            return;
        }
        document.getElementById('blogGrid').style.display = 'none';
        document.getElementById('blogContent').style.display = 'block';
        document.getElementById('blogTitle').textContent = post.title;
        document.getElementById('blogImage').src = post.image || '/images/placeholder.webp';
        document.getElementById('blogImage').alt = post.title;
        document.getElementById('blogDate').textContent = new Date(post.date).toLocaleDateString();
        document.getElementById('blogBody').innerHTML = post.body;

        // Update SEO meta tags
        document.querySelector('meta[name="description"]').setAttribute('content', post.description);
        document.querySelector('meta[property="og:title"]').setAttribute('content', post.title);
        document.querySelector('meta[property="og:description"]').setAttribute('content', post.description);
        document.querySelector('meta[property="og:image"]').setAttribute('content', post.image || '/images/og-image.webp');
        document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href);
        document.title = `${post.title} - AI Tools Directory`;

        loadComments(postId);
    } catch (error) {
        Swal.fire(i18next.t('errorLoading'), error.message, 'error');
    }
}

async function loadComments(postId) {
    try {
        const response = await fetch(`/api/blog-comments/${postId}`);
        const comments = await response.json();
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = '';
        comments.forEach(comment => {
            const div = document.createElement('div');
            div.className = 'comment';
            div.innerHTML = `
                <p><strong>${comment.user}</strong> (${new Date(comment.timestamp).toLocaleString()}):</p>
                <p>${comment.text}</p>
            `;
            commentsList.appendChild(div);
        });
    } catch (error) {
        Swal.fire(i18next.t('commentError'), error.message, 'error');
    }
}

document.getElementById('commentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const postId = new URLSearchParams(window.location.search).get('id');
    const comment = document.getElementById('comment').value;
    if (!auth.currentUser) {
        Swal.fire(i18next.t('loginRequired'), '', 'warning').then(() => {
            window.location.href = 'login.html';
        });
        return;
    }
    try {
        const response = await fetch(`/api/blog-comments/${postId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
            },
            body: JSON.stringify({ text: comment, _csrf: await getCsrfToken() })
        });
        if (response.ok) {
            Swal.fire(i18next.t('commentSubmitted'), '', 'success');
            document.getElementById('commentForm').reset();
            loadComments(postId);
        } else {
            throw new Error((await response.json()).error);
        }
    } catch (error) {
        document.getElementById('commentError').textContent = i18next.t('commentError') + ': ' + error.message;
        document.getElementById('commentError').style.display = 'block';
    }
});

function shareBlog(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.getElementById('blogTitle').textContent);
    let shareUrl;
    if (platform === 'twitter') {
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    } else if (platform === 'facebook') {
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === 'linkedin') {
        shareUrl = `https://www.linkedin.com/shareArticle?url=${url}&title=${title}`;
    }
    window.open(shareUrl, '_blank');
}

// Load Tool Details
async function loadToolDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const toolId = urlParams.get('id');
    if (!toolId) {
        Swal.fire(i18next.t('toolNotFound'), '', 'error');
        return;
    }
    try {
        const response = await fetch(`/api/tools/${toolId}`);
        const tool = await response.json();
        if (!tool) {
            Swal.fire(i18next.t('toolNotFound'), '', 'error');
            return;
        }
        document.getElementById('toolName').textContent = tool.name;
        document.getElementById('toolImage').src = tool.image || '/images/placeholder.webp';
        document.getElementById('toolImage').alt = tool.name;
        document.getElementById('toolDescription').textContent = tool.description;
        document.getElementById('toolCategory').textContent = `${i18next.t('category')}: ${tool.category}`;
        document.getElementById('toolRating').textContent = `${i18next.t('rating')}: ${tool.rating || i18next.t('noRating')}`;
        document.getElementById('toolLink').href = tool.url;
        document.title = `${tool.name} - AI Tools Directory`;
        document.querySelector('meta[name="description"]').setAttribute('content', tool.description);
        document.querySelector('meta[property="og:title"]').setAttribute('content', tool.name);
        document.querySelector('meta[property="og:description"]').setAttribute('content', tool.description);
        document.querySelector('meta[property="og:image"]').setAttribute('content', tool.image || '/images/og-image.webp');
        document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href);
    } catch (error) {
        Swal.fire(i18next.t('errorLoading'), error.message, 'error');
    }
}

document.getElementById('bookmarkTool')?.addEventListener('click', async () => {
    if (!auth.currentUser) {
        Swal.fire(i18next.t('loginRequired'), '', 'warning').then(() => {
            window.location.href = 'login.html';
        });
        return;
    }
    const toolId = new URLSearchParams(window.location.search).get('id');
    try {
        const userId = auth.currentUser.uid;
        const toolRef = db.ref(`users/${userId}/bookmarks/${toolId}`);
        const snapshot = await toolRef.once('value');
        if (snapshot.exists()) {
            await toolRef.remove();
            Swal.fire(i18next.t('bookmarkRemoved'), '', 'success');
        } else {
            const response = await fetch(`/api/tools/${toolId}`);
            const tool = await response.json();
            await toolRef.set(tool);
            Swal.fire(i18next.t('bookmarkSaved'), '', 'success');
        }
    } catch (error) {
        Swal.fire(i18next.t('bookmarkError'), error.message, 'error');
    }
});

async function loadBookmarks() {
    if (!auth.currentUser) {
        Swal.fire(i18next.t('loginRequired'), '', 'warning').then(() => {
            window.location.href = 'login.html';
        });
        return;
    }
    document.getElementById('loading').style.display = 'block';
    try {
        const userId = auth.currentUser.uid;
        const snapshot = await db.ref(`users/${userId}/bookmarks`).once('value');
        const bookmarks = [];
        snapshot.forEach(child => {
            bookmarks.push({ id: child.key, ...child.val() });
        });
        const bookmarksGrid = document.getElementById('bookmarksGrid');
        bookmarksGrid.innerHTML = '';
        if (bookmarks.length === 0) {
            bookmarksGrid.innerHTML = `<p data-i18n="noBookmarks">Tidak ada bookmark ditemukan.</p>`;
        } else {
            bookmarks.forEach(tool => {
                const card = document.createElement('div');
                card.className = 'tool-card';
                card.innerHTML = `
                    <img src="${tool.image || '/images/placeholder.webp'}" alt="${tool.name}" loading="lazy">
                    <h3>${tool.name}</h3>
                    <p>${tool.description.substring(0, 100)}...</p>
                    <p>${i18next.t('category')}: ${tool.category}</p>
                    <a href="tool.html?id=${tool.id}" class="btn" data-i18n="viewDetails">Lihat Detail</a>
                    <button class="btn" onclick="removeBookmark('${tool.id}')" data-i18n="removeBookmark">Hapus Bookmark</button>
                `;
                bookmarksGrid.appendChild(card);
            });
        }
    } catch (error) {
        Swal.fire(i18next.t('errorLoading'), error.message, 'error');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

async function removeBookmark(toolId) {
    try {
        const userId = auth.currentUser.uid;
        await db.ref(`users/${userId}/bookmarks/${toolId}`).remove();
        Swal.fire(i18next.t('bookmarkRemoved'), '', 'success');
        loadBookmarks();
    } catch (error) {
        Swal.fire(i18next.t('bookmarkError'), error.message, 'error');
    }
}

async function getCsrfToken() {
    const response = await fetch('/api/csrf-token');
    const data = await response.json();
    return data.csrfToken;
}

document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    const recaptchaResponse = grecaptcha.getResponse();
    if (!name || !email || !message) {
        document.getElementById('formError').textContent = i18next.t('fillAllFields');
        document.getElementById('formError').style.display = 'block';
        return;
    }
    if (!recaptchaResponse) {
        document.getElementById('formError').textContent = i18next.t('recaptchaRequired');
        document.getElementById('formError').style.display = 'block';
        return;
    }
    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message, recaptchaResponse, _csrf: await getCsrfToken() })
        });
        if (response.ok) {
            Swal.fire(i18next.t('messageSent'), '', 'success');
            document.getElementById('contactForm').reset();
            grecaptcha.reset();
        } else {
            throw new Error((await response.json()).error);
        }
    } catch (error) {
        document.getElementById('formError').textContent = i18next.t('formError') + ': ' + error.message;
        document.getElementById('formError').style.display = 'block';
    }
});

// Admin: Load Tools
async function loadAdminTools() {
    const toolsList = document.getElementById('toolsList');
    if (!toolsList) return;
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

document.getElementById('toolForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('toolId').value;
    const name = document.getElementById('toolName').value;
    const description = document.getElementById('toolDescription').value;
    const category = document.getElementById('toolCategory').value;
    const tags = document.getElementById('toolTags').value.split(',').map(tag => tag.trim());
    const url = document.getElementById('toolUrl').value;
    const image = document.getElementById('toolImage').value;
    try {
        const response = await fetch('/api/admin/tools', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
            },
            body: JSON.stringify({ id, name, description, category, tags, url, image, _csrf: await getCsrfToken() })
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

// Admin: Load Blog Posts
async function loadAdminBlogPosts() {
    const blogPostsList = document.getElementById('blogPostsList');
    if (!blogPostsList) return;
    try {
        const response = await fetch('/api/blog-posts');
        const posts = await response.json();
        blogPostsList.innerHTML = '';
        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'blog-card';
            card.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.description.substring(0, 100)}...</p>
                <button class="btn" onclick="editBlogPost('${post.id}')" data-i18n="editBlog">Edit</button>
                <button class="btn" onclick="deleteBlogPost('${post.id}')" data-i18n="deleteBlog">Hapus</button>
            `;
            blogPostsList.appendChild(card);
        });
    } catch (error) {
        Swal.fire(i18next.t('errorLoading'), error.message, 'error');
    }
}

async function editBlogPost(postId) {
    try {
        const response = await fetch(`/api/blog-posts/${postId}`);
        const post = await response.json();
        document.getElementById('blogId').value = post.id;
        document.getElementById('blogTitleInput').value = post.title;
        document.getElementById('blogDescription').value = post.description;
        document.getElementById('blogBody').value = post.body;
        document.getElementById('blogTags').value = post.tags.join(', ');
        document.getElementById('blogImage').value = post.image;
    } catch (error) {
        Swal.fire(i18next.t('errorLoading'), error.message, 'error');
    }
}

async function deleteBlogPost(postId) {
    Swal.fire({
        title: i18next.t('confirmDelete'),
        text: i18next.t('confirmDeleteText'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: i18next.t('deleteBlog'),
        cancelButtonText: i18next.t('cancel')
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/admin/blog-posts/${postId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${await auth.currentUser.getIdToken()}` }
                });
                if (response.ok) {
                    Swal.fire(i18next.t('postDeleted'), '', 'success');
                    loadAdminBlogPosts();
                } else {
                    throw new Error((await response.json()).error);
                }
            } catch (error) {
                Swal.fire(i18next.t('errorDeleting'), error.message, 'error');
            }
        }
    });
}

document.getElementById('blogForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('blogId').value;
    const title = document.getElementById('blogTitleInput').value;
    const description = document.getElementById('blogDescription').value;
    const body = document.getElementById('blogBody').value;
    const tags = document.getElementById('blogTags').value.split(',').map(tag => tag.trim());
    const image = document.getElementById('blogImage').value;

    if (!title || !description || !body) {
        Swal.fire(i18next.t('fillAllFields'), '', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/admin/blog-posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
            },
            body: JSON.stringify({ id, title, description, body, tags, image, _csrf: await getCsrfToken() })
        });
        if (response.ok) {
            Swal.fire(id ? i18next.t('postUpdated') : i18next.t('postAdded'), '', 'success');
            document.getElementById('blogForm').reset();
            loadAdminBlogPosts();
        } else {
            throw new Error((await response.json()).error);
        }
    } catch (error) {
        Swal.fire(i18next.t('errorSaving'), error.message, 'error');
    }
});

// Notifikasi Push
messaging.requestPermission().then(() => {
    return messaging.getToken({ vapidKey: 'your-vapid-key' });
}).then(token => {
    console.log('FCM Token:', token);
}).catch(error => {
    console.error('Error getting FCM token:', error);
});

messaging.onMessage(payload => {
    Swal.fire({
        title: payload.notification.title,
        text: payload.notification.body,
        imageUrl: payload.notification.image,
        confirmButtonText: 'Lihat Artikel'
    }).then(result => {
        if (result.isConfirmed) {
            window.location.href = payload.data.url;
        }
    });
});

// Inisialisasi halaman
if (document.getElementById('toolsGrid')) loadTools();
if (document.getElementById('blogGrid')) loadBlogPosts();
if (document.getElementById('toolName')) loadToolDetails();
if (document.getElementById('bookmarksGrid')) loadBookmarks();
if (document.getElementById('adminContent')) {
    loadAdminTools();
    loadAdminBlogPosts();
}
