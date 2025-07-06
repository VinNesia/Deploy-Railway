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

// Admin: Edit Blog Post
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

// Admin: Delete Blog Post
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

// Admin: Submit Blog Post
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
            body: JSON.stringify({ id, title, description, body, tags, image })
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

// Inisialisasi halaman
if (document.getElementById('toolsGrid')) loadTools();
if (document.getElementById('blogGrid')) loadBlogPosts();
if (document.getElementById('toolName')) loadToolDetails();
if (document.getElementById('bookmarksGrid')) loadBookmarks();
if (document.getElementById('adminContent')) {
    loadAdminTools();
    loadAdminBlogPosts();
}
