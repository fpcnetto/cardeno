/* Mesa de Ferro · service worker
   Guarda o app no aparelho para abrir sem internet. Os registros de comida e
   peso NÃO passam por aqui: ficam no localStorage do navegador.
   Ao publicar uma versão nova do index.html, troque o número do CACHE. */
const CACHE = "mdf-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

// Apaga só caches antigos da própria Mesa; o Caderno, no mesmo site, tem os seus.
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("mdf-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(resp => { const copia = resp.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return resp; }))
    );
  }
});
