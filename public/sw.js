// Service Worker for MathMentor - Ultra-fast caching for slow networks
const CACHE_NAME = 'mathmentor-v1.0.0';
const STATIC_CACHE = 'mathmentor-static-v1.0.0';
const API_CACHE = 'mathmentor-api-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Will be populated by build process with actual asset paths
];

// API endpoints to cache (GET requests only)
const API_ENDPOINTS = [
  '/api/health',
  '/api/auth/status',
  // Add more API endpoints as needed
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE).then(cache => {
        console.log('API cache initialized');
      })
    ]).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline, update cache when online
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle static assets
  if (request.method === 'GET' && (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$/i) ||
    STATIC_ASSETS.includes(url.pathname)
  )) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          // Return cached version, but also update cache in background
          fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              caches.open(STATIC_CACHE).then(cache => {
                cache.put(request, networkResponse.clone());
              });
            }
          }).catch(() => {
            // Network failed, serve from cache
          });
          return response;
        }

        // Not in cache, fetch from network and cache
        return fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Network failed and not in cache
          return new Response('Offline - Asset not available', { status: 503 });
        });
      })
    );
    return;
  }

  // Handle API requests (GET only)
  if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          // Return cached version for API calls
          return response;
        }

        // Fetch from network and cache successful responses
        return fetch(request).then(networkResponse => {
          if (networkResponse.ok && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(API_CACHE).then(cache => {
              // Cache with expiration (simple implementation)
              const cacheEntry = {
                response: responseClone,
                timestamp: Date.now()
              };
              cache.put(request, new Response(JSON.stringify(cacheEntry), {
                headers: { 'Content-Type': 'application/json' }
              }));
            });
          }
          return networkResponse;
        }).catch(() => {
          // Network failed, try cache with stale-while-revalidate
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(JSON.stringify({
              error: 'Offline - API not available',
              offline: true
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        });
      })
    );
    return;
  }

  // For all other requests, try network first, then cache
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then(response => {
        return response || new Response('Offline - Content not available', { status: 503 });
      });
    })
  );
});

// Background sync for failed requests (when back online)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here if needed
  console.log('Background sync triggered');
}

// Push notifications (optional enhancement)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: data.url
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
