const CACHE_NAME = 'eduflow-v3';
const ROOT = self.location.pathname.replace(/\/service-worker\.js$/, '') || '';
const STATIC_ASSETS = [
  ROOT + '/',
  ROOT + '/index.html',
  ROOT + '/login.html',
  ROOT + '/subjects.html',
  ROOT + '/tasks.html',
  ROOT + '/attendance.html',
  ROOT + '/calendar.html',
  ROOT + '/notes.html',
  ROOT + '/settings.html',
  ROOT + '/manifest.json',
  ROOT + '/assets/css/main.css',
  ROOT + '/assets/css/components.css',
  ROOT + '/assets/css/dashboard.css',
  ROOT + '/assets/css/subjects.css',
  ROOT + '/assets/css/tasks.css',
  ROOT + '/assets/css/attendance.css',
  ROOT + '/assets/css/calendar.css',
  ROOT + '/assets/css/responsive.css',
  ROOT + '/assets/js/app.js',
  ROOT + '/assets/js/config/config.js',
  ROOT + '/assets/js/utils/constants.js',
  ROOT + '/assets/js/utils/helper.js',
  ROOT + '/assets/js/utils/formatter.js',
  ROOT + '/assets/js/utils/validator.js',
  ROOT + '/assets/js/services/storage.js',
  ROOT + '/assets/js/services/database.js',
  ROOT + '/assets/js/services/auth.js',
  ROOT + '/assets/js/services/supabase.js',
  ROOT + '/assets/js/services/notification.js',
  ROOT + '/assets/js/data/dummyData.js',
  ROOT + '/assets/js/components/toast.js',
  ROOT + '/assets/js/components/modal.js',
  ROOT + '/assets/js/components/dialog.js',
  ROOT + '/assets/js/components/card.js',
  ROOT + '/assets/js/components/chart.js',
  ROOT + '/assets/js/components/sidebar.js',
  ROOT + '/assets/js/components/navbar.js',
  ROOT + '/assets/js/modules/dashboard.js',
  ROOT + '/assets/js/modules/subjects.js',
  ROOT + '/assets/js/modules/tasks.js',
  ROOT + '/assets/js/modules/attendance.js',
  ROOT + '/assets/js/modules/calendar.js',
  ROOT + '/assets/js/modules/notes.js',
  ROOT + '/assets/js/modules/settings.js',
  ROOT + '/assets/js/modules/timetable.js',
  ROOT + '/assets/js/modules/gpa.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(ROOT + '/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
