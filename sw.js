const CACHE_NAME = 'gps-live-v4'; // Incremented to forcefully refresh old caches
const ASSETS = [
    './',
'./index.html',
'./manifest.json',
'./sw.js',
'./mgrs.js',
'./icons/icon-any.svg' // Pre-caches your local app icon asset
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); })
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            return cachedResponse || fetch(e.request);
        })
    );
});
