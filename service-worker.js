importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_NAME = 'planning-hub-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './rutinas.html',
    './widgets.html',
    './mercado.html',
    './css/style.css',
    './js/app.js',
    './js/routines.js',
    './js/widgets.js',
    './js/storage.js',
    './js/ui.js',
    './js/supabase.js',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/aos@2.3.4/dist/aos.css',
    'https://unpkg.com/aos@2.3.4/dist/aos.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Ignorar solicitudes que no sean GET
    if (event.request.method !== 'GET') return;

    // 2. Network Only para APIs (Supabase, Clima, etc.)
    if (url.protocol.startsWith('http') && (
        url.hostname.includes('supabase.co') ||
        url.hostname.includes('meteosource.com') ||
        url.hostname.includes('alphavantage.co')
    )) {
        return; // Deja que el navegador maneje la red por defecto without cache
    }

    // 3. Estrategia híbrida
    event.respondWith(
        (async () => {
            // A. Para navegación (HTML): Network First (busca contenido fresco, fallback cache)
            if (event.request.mode === 'navigate') {
                try {
                    const networkResponse = await fetch(event.request);
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                } catch (error) {
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) return cachedResponse;
                    // Fallback a index.html si todo falla (SPA feel)
                    return caches.match('./index.html');
                }
            }

            // B. Para recursos estáticos (CSS, JS, Fonts): Cache First (prioriza velocidad/offline)
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }

            try {
                const networkResponse = await fetch(event.request);
                // Solo cachear respuestas válidas y de nuestro propio origen (o CDNs específicas)
                if (networkResponse && networkResponse.status === 200 && (url.origin === location.origin || ASSETS_TO_CACHE.some(a => a.includes(url.hostname)))) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            } catch (e) {
                // Si falla red y no hay caché, retornar nada (browser error) o una imagen placeholder si fuera imagen
                return new Response('Offline', { status: 503, statusText: 'Offline' });
            }
        })()
    );
});

// --- Push Notifications Logic (Preserved) ---

self.addEventListener('notificationclick', (event) => {
    const url = './index.html';
    event.notification.close();
    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
            if (client.url.includes('index.html') && 'focus' in client) {
                return client.focus();
            }
        }
        return self.clients.openWindow(url);
    }));
});

self.addEventListener('push', (event) => {
    const data = (() => { try { return event.data ? event.data.json() : {}; } catch { return {}; } })();
    
    // ⚠️ CRITICAL: Ignore OneSignal notifications to avoid duplicates
    // OneSignal SDK handles its own payloads (checked via 'custom' or internal IDs)
    if (data.custom?.i || data._os_notification_id) {
        console.log('SW: OneSignal push detected, ignoring in custom handler');
        return;
    }

    const title = data.title || 'PlanningHub';
    const options = {
        body: data.body || 'Tienes una nueva notificación',
        icon: './assets/icons/icon-192.png', // Updated path
        badge: './assets/icons/icon-192.png', // Updated path
        data: data.data || {},
        vibrate: [100, 50, 100]
    };
    event.waitUntil(self.registration.showNotification(title, options));
});
