// Service worker de Envíos Flex (se sube a GitHub junto con index.html vía publicar.py).
// v2 (06-11-2026): el v1 servía la copia GUARDADA de la app y de los datos de Cloudflare
// (stale-while-revalidate) → el celu mostraba siempre lo anterior aunque refrescaras.
// Ahora: la app se pide SIEMPRE a internet (la copia guardada solo se usa sin conexión)
// y los datos (Cloudflare / Mercado Libre) nunca pasan por la caché.
const CACHE_NAME = 'mikra-flex-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Solo los archivos de la propia app (GitHub Pages). Todo lo demás (workers, ML, mapas) va directo.
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req.url, { cache: 'no-store' })   // por URL: un pedido de navegación no se puede copiar con opciones
      .then(res => {
        if (res.ok) { const copia = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copia)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(c => c || caches.match('./index.html')))
  );
});
