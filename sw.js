const CACHE_NAME = 'mgrs-v4';
const ASSETS = [
    './',
'./index.html',
'./manifest.json',
'./sw.js',
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
    // Ensure the updated service worker takes control of pages immediately
    self.clients.claim();
});

// 3. Fetch Event: Smart dynamic routing strategy
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Strategy A: Network-First for HTML entries (Ensures UI updates instantly if online)
    if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
        e.respondWith(
            fetch(e.request)
            .then((networkResponse) => {
                // Update cache dynamically with the fresh file
                if (networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
                }
                return networkResponse;
            })
            .catch(() => caches.match(e.request)) // Fallback to cache if offline
        );
        return;
    }

    // Strategy B: Stale-While-Revalidate for sub-assets (JS, Manifest, Icons)
    // Serves instantly from cache while pulling a fresh version in the background
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            const fetchPromise = fetch(e.request).then((networkResponse) => {
                if (networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
                }
                return networkResponse;
            }).catch(() => {
                // Ignore network errors (e.g., when completely offline)
            });

            // Return cached resource immediately if available, otherwise wait for network
            return cachedResponse || fetchPromise;
        })
    );
});
