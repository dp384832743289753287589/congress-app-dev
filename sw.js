// Network-first so updates show up; falls back to cache so the app still opens offline.
const CACHE = "handtracker-v3";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "models/gesture_recognizer.task",
               "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const url = e.request.url;
  if (e.request.method !== "GET") return;
  if (url.includes("supabase.co")) return;   // never cache login traffic
  const isModel = url.endsWith(".task");
  const fromCache = caches.match(e.request);
  const fromNet = () => fetch(e.request).then(res => {
    if (res.ok && (url.includes("jsdelivr") || url.startsWith(self.location.origin))) {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return res;
  });
  e.respondWith(isModel ? fromCache.then(h => h || fromNet()) : fromNet().catch(() => fromCache));
});
