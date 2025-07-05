const CACHE_NAME = 'ai-tools-directory-v2';
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
    '/styles.css',
    '/script.js',
    '/firebase-config.js',
    '/manifest.json',
    '/images/placeholder.webp',
    '/images/icon-192x192.png',
    '/images/icon-512x512.png',
    '/images/og-image.webp',
    '/locales/id.json',
    '/locales/en.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            )
        )
    );
});
