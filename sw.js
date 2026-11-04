// Gantera merge și fără internet: fișierele aplicației se păstrează în telefon.
// Generat de scripts/build-www.mjs --pwa. VERSION se schimbă când se schimbă orice fișier, iar telefonul ia versiunea nouă.
const VERSION = "gantera-66009d6d0e1b";
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
/* amintirile (notificări trimise de serverul de amintiri): arată notificarea; apăsarea deschide aplicația în Azi */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Gantera', { body: d.body || 'N-ai notat nimic azi.', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: d.tag || 'gantera', data: { url: d.url || './#azi' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) { if (c.navigate) c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
