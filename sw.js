const CACHE_NAME = 'mgrs-v8';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './mgrs.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
    './icons/icon-monochrome-512.png'
    ];

// 1. Install Event: Pre-cache all essential assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
    });

// 2. Activate Event: Clean up old versions of caches safely
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

// 3. Fetch Event: Smart dynamic routing
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Network-First for HTML entries (Ensures UI updates instantly if online)
    if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
        e.respondWith(
            fetch(e.request)
            .then((networkResponse) => {
                if (networkResponse.ok) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
                }
                return networkResponse;
            })
            .catch(() => caches.match(e.request)) // Fallback to cache if offline
        );
        return;
    }

    // Corrected Stale-While-Revalidate for local sub-assets
    if (url.origin === self.location.origin) {
        e.respondWith(
            caches.match(e.request).then((cachedResponse) => {
                // Set up the network fetch to update the cache in the background
                const fetchPromise = fetch(e.request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
                    }
                    return networkResponse;
                }).catch(() => {
                    // Fail silently if offline
                });

                // Return cached response if it exists.
                // If it doesn't exist, return the network promise so the browser gets a valid Response object.
                return cachedResponse || fetchPromise;
            })
        );
    }
});
