// Inisialisasi Firebase (sesuaikan dengan firebase-config.js)
firebase.initializeApp(firebaseConfig);

// Autentikasi
function loginWithEmail() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            document.getElementById('loginError').textContent = error.message;
        });
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
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

// Pencarian dan Filter Tools
let currentPage = 1;
const toolsPerPage = 6;

function loadTools() {
    const toolsRef = firebase.database().ref('tools');
    toolsRef.on('value', (snapshot) => {
        const tools = snapshot.val();
        displayTools(tools);
    });
}

function searchTools() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const toolsRef = firebase.database().ref('tools');
    toolsRef.orderByChild('name').startAt(query).endAt(query + '\uf8ff').on('value', (snapshot) => {
        const tools = snapshot.val();
        displayTools(tools);
    });
}

function filterTools() {
    const category = document.getElementById('categoryFilter').value;
    const toolsRef = firebase.database().ref('tools');
    toolsRef.orderByChild('category').equalTo(category || null).on('value', (snapshot) => {
        const tools = snapshot.val();
        displayTools(tools);
    });
}

function displayTools(tools) {
    const toolsGrid = document.getElementById('toolsGrid');
    toolsGrid.innerHTML = '';
    if (tools) {
        const toolArray = Object.values(tools);
        const start = (currentPage - 1) * toolsPerPage;
        const end = start + toolsPerPage;
        const paginatedTools = toolArray.slice(start, end);

        paginatedTools.forEach(tool => {
            const toolCard = document.createElement('div');
            toolCard.className = 'tool-card';
            toolCard.innerHTML = `
                <img src="${tool.image || 'https://via.placeholder.com/250x150'}" alt="${tool.name}">
                <h3>${tool.name}</h3>
                <p>${tool.description}</p>
                <span class="rating">${'★'.repeat(Math.round(tool.rating || 0)).padEnd(5, '☆')} (${tool.rating || 0})</span>
                <a href="#" class="login-btn bookmark-btn" onclick="addBookmark('${tool.id}')">Tambah ke Bookmark</a>
            `;
            toolsGrid.appendChild(toolCard);
        });
        updatePagination(toolArray.length);
    }
}

function addBookmark(toolId) {
    const user = firebase.auth().currentUser;
    if (user) {
        firebase.database().ref(`bookmarks/${user.uid}/${toolId}`).set(true);
        alert('Tool ditambahkan ke bookmark!');
    } else {
        alert('Silakan login terlebih dahulu!');
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadTools();
    }
}

function nextPage() {
    const toolsRef = firebase.database().ref('tools');
    toolsRef.once('value', (snapshot) => {
        const totalTools = snapshot.numChildren();
        if (currentPage < Math.ceil(totalTools / toolsPerPage)) {
            currentPage++;
            loadTools();
        }
    });
}

function updatePagination(totalTools) {
    const pageInfo = document.getElementById('pageInfo');
    pageInfo.textContent = `Halaman ${currentPage} dari ${Math.ceil(totalTools / toolsPerPage)}`;
}

// Kontak Form
document.getElementById('contactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    firebase.database().ref('contacts').push({
        name,
        email,
        message,
        timestamp: new Date().toISOString()
    }).then(() => {
        document.getElementById('contactSuccess').textContent = 'Pesan berhasil dikirim!';
        document.getElementById('contactForm').reset();
    }).catch((error) => {
        document.getElementById('contactSuccess').textContent = 'Terjadi kesalahan: ' + error.message;
    });
});

// Muat tools saat halaman dimuat
window.onload = loadTools;
