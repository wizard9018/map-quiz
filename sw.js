const CACHE_NAME = "map-quiz-v7";
const ASSETS = [
  "./",
  "index.html",
  "app.js",
  "style.css",
  "typing.html",
  "data/africa.json",
  "data/americas.json",
  "data/asia.json",
  "data/europe.json",
  "data/body.json",
  "data/us.json",
  "data/cn.json",
  "data/ca.json",
  "data/jp.json",
  "data/de.json",
  "data/oc.json",
  "data/rv.json",
  "maps/africa.svg",
  "maps/americas.svg",
  "maps/asia.svg",
  "maps/europe.svg",
  "maps/body.svg",
  "maps/us.svg",
  "maps/cn.svg",
  "maps/ca.svg",
  "maps/jp.svg",
  "maps/de.svg",
  "maps/oc.svg",
  "maps/rv.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always serve the latest deployed version when online, so a
// push shows up immediately instead of waiting for a stale cache entry to
// expire. Cache is only a fallback for when the network request fails
// (offline), which is the actual point of this service worker.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
