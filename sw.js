/* ساحر موفيز — service worker
   بيخلي التطبيق يشتغل كتطبيق متثبت، وبيحفظ الواجهة عشان يفتح بسرعة.
   بيانات الأفلام بتيجي من TMDB مباشرة، ولو مفيش نت بيستخدم آخر نسخة محفوظة. */

const SHELL = 'saher-shell-v2';
const DATA = 'saher-data-v1';
const SHELL_FILES = ['./', './index.html', './app.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // بيانات TMDB وأرشيف الإنترنت: نجرب النت الأول، ولو فشل نرجع للنسخة المحفوظة
  if (url.hostname.endsWith('api.themoviedb.org') || url.hostname.endsWith('archive.org')) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(DATA).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // صور الأغلفة: كاش الأول (أسرع وبتحوش نت)
  if (url.hostname.endsWith('image.tmdb.org') || url.hostname.endsWith('services/img')) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(DATA).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // ملفات التطبيق نفسها: من النت الأول (عشان أي تحديث يوصلك فورًا)، ولو مفيش نت من الكاش
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(SHELL).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(hit =>
        hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
      ))
    );
    return;
  }

  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
