// Gantera merge și fără internet: fișierele aplicației se păstrează în telefon.
// Generat de scripts/build-www.mjs --pwa. VERSION se schimbă când se schimbă orice fișier, iar telefonul ia versiunea nouă.
const VERSION = "gantera-f8cd11ba206a";
const FILES = ["fonts/archivo-latin-400-normal.woff2","fonts/archivo-latin-500-normal.woff2","fonts/archivo-latin-600-normal.woff2","fonts/archivo-latin-700-normal.woff2","fonts/archivo-latin-ext-400-normal.woff2","fonts/archivo-latin-ext-500-normal.woff2","fonts/archivo-latin-ext-600-normal.woff2","fonts/archivo-latin-ext-700-normal.woff2","fonts/big-shoulders-display-latin-600-normal.woff2","fonts/big-shoulders-display-latin-800-normal.woff2","fonts/big-shoulders-display-latin-900-normal.woff2","fonts/big-shoulders-display-latin-ext-600-normal.woff2","fonts/big-shoulders-display-latin-ext-800-normal.woff2","fonts/big-shoulders-display-latin-ext-900-normal.woff2","fonts/permanent-marker-latin-400-normal.woff2","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","licenses/archivo.txt","licenses/big-shoulders-display.txt","licenses/canvas-confetti.txt","licenses/capacitor.txt","licenses/firebase.txt","licenses/lucide.txt","licenses/permanent-marker.txt","licenses/zxing.txt","manifest.webmanifest","vendor/confetti.browser.js","vendor/firebase.js","vendor/zxing.min.js"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('gantera-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
const OWN = new Set(FILES);
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url), base = new URL(self.registration.scope);
  /* doar fișierele aplicației; Open Food Facts, linkurile externe și alte pagini de pe aceeași adresă merg direct pe internet */
  if (u.origin !== base.origin || !u.pathname.startsWith(base.pathname)) return;
  const rel = u.pathname.slice(base.pathname.length);
  if (r.mode === 'navigate') {
    if (rel !== '' && rel !== 'index.html') return;
    const page = new URL('index.html', base).href;
    e.respondWith(caches.open(VERSION).then(c => c.match(page)).then(hit => hit || fetch(r)));
    return;
  }
  if (!OWN.has(rel)) return;
  e.respondWith(caches.open(VERSION).then(c => c.match(r, { ignoreSearch: true })).then(hit => hit || fetch(r)));
});
