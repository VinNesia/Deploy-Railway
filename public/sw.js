// Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('v1').then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/styles.css',
                '/script.js',
                '/firebase-config.js',
                '/manifest.json',
                '/offline.html'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((networkResponse) => {
                const clonedResponse = networkResponse.clone();
                caches.open('v1').then((cache) => {
                    cache.put(event.request, clonedResponse);
                });
                return networkResponse;
            }).catch(() => {
                return caches.match('/offline.html');
            });
        })
    );
});
