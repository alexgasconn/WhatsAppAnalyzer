// Service Worker para WhatsApp Chat Analyzer Pro
const CACHE_NAME = 'wachat-analyzer-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/main.js',
    '/js/overview.js',
    '/js/activity.js',
    '/js/users.js',
    '/js/timeline.js',
    '/js/relationships.js',
    '/js/predictions.js',
    '/js/content.js',
    '/js/game.js',
    '/manifest.json'
];

// Instalar el Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })))
                .catch(err => {
                    console.log('Cache addAll error:', err);
                    // No fallar si no se pueden cachear todos los archivos
                    return Promise.resolve();
                });
        })
    );
    self.skipWaiting();
});

// Activar el Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch del Service Worker - Estrategia Cache First, luego Network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const { url } = request;

    // No cachear requests POST o de API externas complejas
    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }

    // Estrategia Cache First para archivos estáticos
    if (url.includes('/css/') || url.includes('/js/') || url.includes('/manifest.json')) {
        event.respondWith(
            caches.match(request).then((response) => {
                if (response) return response;
                return fetch(request)
                    .then(response => {
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseToCache);
                        });
                        return response;
                    })
                    .catch(err => {
                        console.log('Fetch error:', err);
                        // Retornar página offline si es HTML
                        if (request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
        );
        return;
    }

    // Para el resto, Network First con Cache Fallback
    event.respondWith(
        fetch(request)
            .then(response => {
                if (!response || response.status !== 200) {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseToCache);
                });
                return response;
            })
            .catch(err => {
                console.log('Network request failed, trying cache:', err);
                return caches.match(request).then(response => {
                    return response || new Response('Offline', { status: 503 });
                });
            })
    );
});

// Manejar mensajes desde el cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            event.ports[0].postMessage({ cleared: true });
        });
    }
});

// Sincronización en background (cuando vuelve online)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Aquí se podría sincronizar datos si es necesario
            Promise.resolve()
        );
    }
});

// Push notifications (opcional para futuro)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Notificación de Chat Analyzer',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%2325D366" width="192" height="192"/><text x="50%" y="50%" font-size="100" fill="white" text-anchor="middle" dy=".3em">💬</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%2325D366" width="96" height="96"/><text x="48" y="48" font-size="50" fill="white" text-anchor="middle" dy=".3em">💬</text></svg>',
        tag: 'chat-analyzer-notification'
    };

    event.waitUntil(
        self.registration.showNotification('WhatsApp Chat Analyzer', options)
    );
});
