const CACHE_NAME = 'eduflow-v2';
const STATIC_ASSETS = [
  '/EduFlow/',
  '/EduFlow/index.html',
  '/EduFlow/login.html',
  '/EduFlow/subjects.html',
  '/EduFlow/tasks.html',
  '/EduFlow/attendance.html',
  '/EduFlow/calendar.html',
  '/EduFlow/notes.html',
  '/EduFlow/settings.html',
  '/EduFlow/manifest.json',
  '/EduFlow/assets/css/main.css',
  '/EduFlow/assets/css/components.css',
  '/EduFlow/assets/css/dashboard.css',
  '/EduFlow/assets/css/subjects.css',
  '/EduFlow/assets/css/tasks.css',
  '/EduFlow/assets/css/attendance.css',
  '/EduFlow/assets/css/calendar.css',
  '/EduFlow/assets/css/responsive.css',
  '/EduFlow/assets/js/app.js',
  '/EduFlow/assets/js/config/config.js',
  '/EduFlow/assets/js/utils/constants.js',
  '/EduFlow/assets/js/utils/helper.js',
  '/EduFlow/assets/js/utils/formatter.js',
  '/EduFlow/assets/js/utils/validator.js',
  '/EduFlow/assets/js/services/storage.js',
  '/EduFlow/assets/js/services/database.js',
  '/EduFlow/assets/js/services/auth.js',
  '/EduFlow/assets/js/services/notification.js',
  '/EduFlow/assets/js/data/dummyData.js',
  '/EduFlow/assets/js/components/toast.js',
  '/EduFlow/assets/js/components/modal.js',
  '/EduFlow/assets/js/components/dialog.js',
  '/EduFlow/assets/js/components/card.js',
  '/EduFlow/assets/js/components/chart.js',
  '/EduFlow/assets/js/components/sidebar.js',
  '/EduFlow/assets/js/components/navbar.js',
  '/EduFlow/assets/js/modules/dashboard.js',
  '/EduFlow/assets/js/modules/subjects.js',
  '/EduFlow/assets/js/modules/tasks.js',
  '/EduFlow/assets/js/modules/attendance.js',
  '/EduFlow/assets/js/modules/calendar.js',
  '/EduFlow/assets/js/modules/notes.js',
  '/EduFlow/assets/js/modules/settings.js',
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
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/EduFlow/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
