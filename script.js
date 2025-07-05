// Inisialisasi EmailJS
emailjs.init("template_b3ayww4"); // Public Key EmailJS

// State untuk pagination
let currentPage = 1;
const toolsPerPage = 6; // Ubah di sini untuk menyesuaikan jumlah tools per halaman
let allTools = [];

// Fungsi untuk mengambil data tools dari Firebase
async function fetchTools() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'block';
    const dbRef = firebase.database().ref('tools').limitToFirst(toolsPerPage * currentPage);
    try {
        const snapshot = await dbRef.once('value');
        allTools = [];
        snapshot.forEach(childSnapshot => {
            allTools.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        filterAndSortTools();
    } catch (error) {
        console.error('Error fetching tools:', error);
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// Fungsi untuk menampilkan tools
function displayTools(tools) {
    const toolsGrid = document.getElementById('toolsGrid');
    if (!toolsGrid) return;
    toolsGrid.innerHTML = '';

    // Hitung indeks untuk pagination
    const startIndex = (currentPage - 1) * toolsPerPage;
    const endIndex = startIndex + toolsPerPage;
    const paginatedTools = tools.slice(startIndex, endIndex);

    // Tampilkan tools
    paginatedTools.forEach(tool => {
        const toolCard = document.createElement('div');
        toolCard.classList.add('tool-card');
        toolCard.innerHTML = `
            <img src="${tool.image || 'images/placeholder.jpg'}" alt="${tool.name}" loading="lazy" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;">
            <h3><a href="tool.html?id=${tool.id}" aria-label="Lihat detail ${tool.name}">${tool.name}</a></h3>
            <p>${tool.description}</p>
            <span class="tag">${tool.category.charAt(0).toUpperCase() + tool.category.slice(1)}</span>
            <a href="${tool.link}" target="_blank" class="btn" onclick="logToolClick('${tool.name}')" aria-label="Kunjungi ${tool.name}">Kunjungi</a>
            <button class="btn" onclick="saveBookmark('${tool.id}')" aria-label="Simpan ${tool.name} ke Bookmark">Simpan</button>
        `;
        toolsGrid.appendChild(toolCard);
    });

    // Update info halaman
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Halaman ${currentPage} dari ${Math.ceil(tools.length / toolsPerPage)}`;
    }

    // Aktifkan/nonaktifkan tombol pagination
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = endIndex >= tools.length;
}

// Fungsi untuk log event ke Google Analytics
function logToolClick(toolName) {
    firebase.analytics().logEvent('tool_click', { tool_name: toolName });
}

function logSearchPerformed(searchTerm) {
    firebase.analytics().logEvent('search_performed', { search_term: searchTerm });
}

function logCategoryFilter(category) {
    firebase.analytics().logEvent('category_filter_applied', { category: category });
}

function logSortOption(sortOption) {
    firebase.analytics().logEvent('sort_option_selected', { sort_option: sortOption });
}

function logPageNavigation(page) {
    firebase.analytics().logEvent('page_navigation', { page_name: page });
}

function logPaginationClick(direction) {
    firebase.analytics().logEvent('pagination_click', { direction: direction });
}

function logThemeChanged(theme) {
    firebase.analytics().logEvent('theme_changed', { theme: theme });
}

// Fungsi pencarian tools
function searchTools() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredTools = allTools.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm) || 
        tool.description.toLowerCase().includes(searchTerm) ||
        (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
    currentPage = 1; // Reset ke halaman 1 saat pencarian
    displayTools(filteredTools);
    if (searchTerm) logSearchPerformed(searchTerm);
}

// Fungsi filter dan sort
function filterAndSortTools() {
    const category = document.getElementById('categoryFilter')?.value;
    const sort = document.getElementById('sortFilter')?.value;
    let filteredTools = allTools;

    // Filter berdasarkan kategori
    if (category && category !== 'all') {
        filteredTools = allTools.filter(tool => tool.category === category);
        logCategoryFilter(category);
    }

    // Urutkan berdasarkan pilihan
    if (sort) {
        if (sort === 'name') {
            filteredTools.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'category') {
            filteredTools.sort((a, b) => a.category.localeCompare(b.category));
        }
        logSortOption(sort);
    }

    displayTools(filteredTools);
}

// Fungsi untuk mengganti halaman
function changePage(direction) {
    currentPage += direction;
    logPaginationClick(direction === 1 ? 'next' : 'previous');
    filterAndSortTools();
}

// Fungsi untuk menyimpan bookmark
async function saveBookmark(toolId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Silakan login untuk menyimpan bookmark');
        return;
    }
    try {
        await firebase.firestore().collection('bookmarks').doc(user.uid).set({
            tools: firebase.firestore.FieldValue.arrayUnion(toolId)
        }, { merge: true });
        alert('Tool disimpan ke bookmark!');
    } catch (error) {
        console.error('Error saving bookmark:', error);
        alert('Gagal menyimpan bookmark');
    }
}

// Fungsi untuk mengirim data formulir ke MongoDB dan EmailJS
async function submitContactForm(name, email, message) {
    const recaptchaResponse = grecaptcha.getResponse();
    if (!recaptchaResponse) {
        alert('Silakan verifikasi reCAPTCHA');
        return;
    }
    try {
        // Simpan ke MongoDB
        const mongoResponse = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message, recaptchaResponse })
        });
        const mongoResult = await mongoResponse.json();
        if (!mongoResponse.ok) throw new Error(mongoResult.error);

        // Kirim email via EmailJS
        await emailjs.send('service_zrumu1h', 'template_b3ayww4', {
            from_name: name,
            from_email: email,
            message: message,
            reply_to: email
        });

        alert('Pesan Anda telah dikirim!');
        firebase.analytics().logEvent('contact_form_submit');
    } catch (error) {
        alert('Terjadi kesalahan: ' + error.message);
    }
}

// Fungsi untuk memuat detail tool
async function loadToolDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const toolId = urlParams.get('id');
    if (toolId) {
        const dbRef = firebase.database().ref(`tools/${toolId}`);
        try {
            const snapshot = await dbRef.once('value');
            const tool = snapshot.val();
            if (tool) {
                document.getElementById('toolName').textContent = tool.name;
                document.getElementById('toolImage').src = tool.image || 'images/placeholder.jpg';
                document.getElementById('toolImage').alt = tool.name;
                document.getElementById('toolDescription').textContent = tool.description;
                document.getElementById('toolCategory').textContent = tool.category.charAt(0).toUpperCase() + tool.category.slice(1);
                document.getElementById('toolLink').href = tool.link;
                document.getElementById('bookmarkTool').onclick = () => saveBookmark(toolId);
            }
        } catch (error) {
            console.error('Error loading tool details:', error);
        }
    }
}

// Event listener
document.addEventListener('DOMContentLoaded', () => {
    // Ambil data dari Firebase untuk halaman beranda
    if (document.getElementById('toolsGrid')) {
        fetchTools();
    }

    // Muat detail tool untuk halaman tool.html
    if (document.getElementById('toolName')) {
        loadToolDetails();
    }

    // Tambahkan event listener untuk filter, sort, dan pencarian
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchInput = document.getElementById('searchInput');
    if (categoryFilter) categoryFilter.addEventListener('change', filterAndSortTools);
    if (sortFilter) sortFilter.addEventListener('change', filterAndSortTools);
    if (searchInput) searchInput.addEventListener('input', searchTools);

    // Formulir kontak
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            await submitContactForm(name, email, message);
            contactForm.reset();
            grecaptcha.reset();
        });
    }

    // Event listener untuk navigasi
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const pageName = link.textContent.trim();
            logPageNavigation(pageName);
        });
    });

    // Event listener untuk toggle tema
    document.getElementById('themeToggle')?.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        logThemeChanged(theme);
    });

    // Terapkan tema yang disimpan
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-theme');

    // Event listener untuk menu hamburger
    document.querySelector('.nav-toggle')?.addEventListener('click', () => {
        document.querySelector('nav').classList.toggle('active');
    });

    // Inisialisasi Firebase Authentication
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log('User logged in:', user.uid);
        } else {
            console.log('No user logged in');
        }
    });
});
