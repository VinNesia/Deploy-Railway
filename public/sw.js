const CACHE_NAME = 'ai-tools-directory-v5';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/about.html',
    '/privacy.html',
    '/terms.html',
    '/contact.html',
    '/tool.html',
    '/bookmarks.html',
    '/login.html',
    '/admin.html',
    '/blog.html',
    '/offline.html',
    '/styles.css',
    '/script.js',
    '/firebase-config.js',
    '/manifest.json',
    '/images/icon-192x192.png',
    '/images/icon-512x512.png',
    '/images/placeholder.webp',
    '/images/hero-bg.webp',
    '/locales/id.json',
    '/locales/en.json'
];

const DYNAMIC_CACHE = 'dynamic-cache-v5';
const OFFLINE_PAGE = '/offline.html';

// Instalasi Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Aktivasi Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Penanganan Fetch
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Cache-First untuk aset statis
    if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
        event.respondWith(
            caches.match(request).then(response => {
                return response || fetch(request).then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            }).catch(() => caches.match(OFFLINE_PAGE))
        );
    }
    // Network-First untuk API, tools, blog posts, dan komentar
    else if (url.pathname.startsWith('/api/') || url.pathname.includes('tools') || url.pathname.includes('blog-posts') || url.pathname.includes('blog_comments')) {
        event.respondWith(
            fetch(request).then(networkResponse => {
                return caches.open(DYNAMIC_CACHE).then(cache => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                });
            }).catch(() => {
                return caches.match(request).then(response => {
                    return response || caches.match(OFFLINE_PAGE);
                });
            })
        );
    }
    // Cache-First untuk sumber daya lainnya
    else {
        event.respondWith(
            caches.match(request).then(response => {
                return response || fetch(request).then(networkResponse => {
                    return caches.open(DYNAMIC_CACHE).then(cache => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            }).catch(() => caches.match(OFFLINE_PAGE))
        );
    }
});

// Penanganan Push Notification
self.addEventListener('push', event => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/images/icon-192x192.png',
        badge: '/images/icon-192x192.png',
        data: { url: data.url }
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Penanganan Klik Notifikasi
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});
