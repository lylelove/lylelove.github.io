const CACHE_NAME = 'lylelove-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/404.html',
    '/css/h.9c69ed6c.css',
    '/css/nekotora.99cf6f8c.css',
    '/js/page.3a0791a3.js',
    '/js/stats.js',
    '/manifest.json',
    'https://lylelove.github.io/picx-images-hosting/lyle.png',
    'https://cdn.jsdelivr.net/gh/lylelove/Course/img/logo.png'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
    console.log('Service Worker: Install event');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .catch(function(error) {
                console.log('Service Worker: Cache failed', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
    console.log('Service Worker: Activate event');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', function(event) {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external requests
    if (!event.request.url.startsWith(self.location.origin) && 
        !event.request.url.includes('cdn.jsdelivr.net') &&
        !event.request.url.includes('lylelove.github.io')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Return cached version or fetch from network
                if (response) {
                    console.log('Service Worker: Serving from cache', event.request.url);
                    return response;
                }

                console.log('Service Worker: Fetching from network', event.request.url);
                return fetch(event.request).then(function(response) {
                    // Don't cache if not a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(function() {
                    // Fallback to offline page for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/404.html');
                    }
                });
            })
    );
});

// Background sync event (for future use)
self.addEventListener('sync', function(event) {
    console.log('Service Worker: Background sync', event.tag);
    if (event.tag === 'background-sync') {
        // Perform background sync operations
        event.waitUntil(doBackgroundSync());
    }
});

// Push notification event (for future use)
self.addEventListener('push', function(event) {
    console.log('Service Worker: Push received');
    
    const title = '竟何的网站';
    const options = {
        body: event.data ? event.data.text() : '您有新的消息',
        icon: 'https://cdn.jsdelivr.net/gh/lylelove/Course/img/logo.png',
        badge: 'https://cdn.jsdelivr.net/gh/lylelove/Course/img/logo.png',
        tag: 'lylelove-notification',
        requireInteraction: true,
        actions: [
            {
                action: 'open',
                title: '查看',
                icon: 'https://cdn.jsdelivr.net/gh/lylelove/Course/img/logo.png'
            },
            {
                action: 'close',
                title: '关闭'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Helper function for background sync
function doBackgroundSync() {
    return new Promise(function(resolve) {
        // Implement background sync logic here
        console.log('Service Worker: Performing background sync');
        resolve();
    });
}

// Handle skip waiting message
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Update available event
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        console.log('Service Worker: Update available');
        // Notify the client about the update
        self.clients.matchAll().then(function(clients) {
            clients.forEach(function(client) {
                client.postMessage({
                    type: 'UPDATE_AVAILABLE',
                    message: '网站有新版本可用，请刷新页面获取最新内容。'
                });
            });
        });
    }
}); 