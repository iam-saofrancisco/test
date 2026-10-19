/* Service worker do álbum — deixa o app rápido e funcionando offline.
   (Só é ativado quando o site está publicado; não roda em arquivo local.) */

const CACHE = "album-vitor-larica-v1";
const ESSENCIAIS = [
  "./",
  "index.html",
  "css/estilo.css",
  "js/app.js",
  "js/dados.js",
  "manifest.webmanifest",
  "icones/icon-192.png",
  "icones/icon-512.png",
  "icones/icon-180.png"
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ESSENCIAIS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Rede primeiro (para pegar fotos novas), cache como reserva (offline) */
self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  if (req.method !== "GET") return;

  ev.respondWith(
    fetch(req)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cacheado) => {
        if (cacheado) return cacheado;
        if (req.mode === "navigate") return caches.match("index.html");
        return Response.error();
      }))
  );
});
