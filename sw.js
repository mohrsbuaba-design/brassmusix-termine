// Service Worker: Offline-Grundgerüst + Push-Nachrichten
const CACHE = "bmx-v4";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./setlisten.html", "./jszip.min.js", "./logo.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Seiten immer zuerst frisch aus dem Netz, offline aus dem Cache
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data.json(); } catch { d = { titel: "Brassmusix", text: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titel || "Brassmusix", {
    body: d.text || "", icon: "icon-192.png", badge: "icon-192.png", data: { url: d.url || "#/" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const ziel = new URL("./" + (e.notification.data?.url || "#/"), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ("focus" in c) { c.navigate(ziel); return c.focus(); } }
    return self.clients.openWindow(ziel);
  }));
});
