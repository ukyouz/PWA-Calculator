/* 
 */
const CACHE_NAME = 'zpcc-v1.2.3';

// CODELAB: Add list of files to cache here.
const FILES_TO_CACHE = [
  './',
  './index.html',
  './sw.js',
  './app.js',
  './install.js',
  './app.css',
  './audios/tapping.wav',
  './images/icon-256x256.png',
  './fonts/EHSMB.ttf',
  './fonts/fa-solid-900.ttf',
  './fonts/fa-regular-400.ttf',
  'https://fonts.googleapis.com/css?family=PT+Sans:400,700&display=swap',
];

self.addEventListener('install', (evt) => {
  // CODELAB: Precache static resources here.
  console.log('[ServiceWorker] Install');
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  // CODELAB: Remove previous cached data from disk.
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );

  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  // CODELAB: Add fetch event handler here.
  console.log("[Fetch]");
  evt.respondWith(
      caches.open(CACHE_NAME).then( cache => {
        return cache.match(evt.request)
          .then((response) => {
            // console.log(response, fetch(evt.request));
            return response || fetch(evt.request);
          });
      })
  );
});
