const CACHE = 'navegador-sk-27-11-a';
const ARQS = ['./', './index.html', './css/estilo.css', './manifest.json', './icones/icone.svg', './js/00-base.js', './js/10-busca.js', './js/20-traducao.js', './js/30-leitura.js', './js/40-pagina.js', './js/50-guardar.js', './js/90-inicio.js'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQS)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((k) => k.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
