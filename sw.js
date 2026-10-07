const V = "pk-1791371340332";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(V).then((c) => c.addAll(["/", "/ja/", "/assets/base.css", "/assets/site.js", "/favicon.svg"]))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (u.origin === location.origin) {
    e.respondWith(fetch(r).then((res) => { if (res.ok) { const c = res.clone(); caches.open(V).then((ca) => ca.put(r, c)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then((m) => m || (r.mode === "navigate" ? caches.match(u.pathname.startsWith("/ja/") ? "/ja/" : "/") : undefined))));
  } else if (/fonts.(googleapis|gstatic).com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => { const c = res.clone(); caches.open(V).then((ca) => ca.put(r, c)); return res; })));
  }
});
