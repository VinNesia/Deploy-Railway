const CACHE_NAME = 'ai-tools-directory-v1';
const urlsToCache = [
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
    '/images/icon-192x192.png',
    '/images/icon-512x512.png',
    '/images/placeholder.webp',
    '/images/hero-bg.webp'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => {
                return caches.match('/offline.html');
            });
        })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
