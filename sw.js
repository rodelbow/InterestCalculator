/*
================================================================================
  INTEREST CALCULATOR — SERVICE WORKER
  File    : sw.js
  Author  : Uncle Rodney (built with Claude — Anthropic)
  Version : 1.0
================================================================================

  PURPOSE
  -------
  Caches all app assets on first load so the calculator works completely
  offline on subsequent visits. Uses a cache-first strategy — serves from
  cache instantly, updates in background when online.

  CACHE STRATEGY
  --------------
  Cache name is versioned (CACHE_VERSION below). To force all users to
  get a fresh copy after an update, increment the version number.
================================================================================
*/

var CACHE_VERSION = 'interest-calc-v1';
var ASSETS = [
  '/InterestCalculator/',
  '/InterestCalculator/index.html',
  '/InterestCalculator/manifest.json',
  '/InterestCalculator/icon.png'
];

/* ── Install: cache all assets ── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      console.log('SW: caching app assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

/* ── Activate: clean up old caches ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_VERSION; })
            .map(function(key) {
              console.log('SW: removing old cache', key);
              return caches.delete(key);
            })
      );
    })
  );
  self.clients.claim();
});

/* ── Fetch: serve from cache, fall back to network ── */
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        /* Serve from cache immediately */
        /* Also fetch fresh copy in background for next visit */
        fetch(event.request).then(function(fresh) {
          caches.open(CACHE_VERSION).then(function(cache) {
            cache.put(event.request, fresh);
          });
        }).catch(function() { /* offline — no background update */ });
        return cached;
      }
      /* Not in cache — fetch from network */
      return fetch(event.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_VERSION).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
