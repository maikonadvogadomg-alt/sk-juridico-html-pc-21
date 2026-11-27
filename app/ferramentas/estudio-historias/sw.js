const CACHE = 'estudio-historias-27-11-e';
const ARQS = ['./', './index.html', './css/estilo.css', './manifest.json', './icones/icone.svg',
  './js/00-base.js', './js/10-ia.js', './js/20-caso.js', './js/30-roteiro.js', './js/40-voz.js', './js/42-som.js', './js/44-voz-ia.js', './js/46-musica.js', './js/52-imagens-ia.js', './js/50-imagens.js', './js/60-video.js', './js/70-config.js', './js/90-inicio.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((k) => k.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
