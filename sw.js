/* Офлайн-режим приложения «Мастер рядом».
   Кэшируются только файлы самого сайта. Запросы к базе и ИИ идут напрямую и не сохраняются.
   После изменения файлов сайта увеличьте VERSION, чтобы у всех обновилось. */
const VERSION = 'mr-v4';
// Библиотеки из vendor/ не скачиваются заранее: телефону 3D не нужен, а Firebase сохранится при первом запуске
const SHELL = ['./', 'index.html', 'app.js', 'config.js', 'privacy.html', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'maskable-512.png', 'apple-touch-icon.png', 'favicon-48.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // Библиотеки и иконки меняются редко: сначала из кэша
  if (/\.(png)$|-compat\.js$|three\.min\.js$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) caches.open(VERSION).then(c => c.put(req, res.clone())); return res; })));
    return;
  }
  // Страница и код: сначала из сети (чтобы обновления приходили сразу), без сети — из кэша
  e.respondWith(fetch(req).then(res => {
    if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, {ignoreSearch: true}).then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});

/* Уведомления о новых сообщениях и откликах.
   Сервер (functions/index.js) присылает {title, body, url, tag}. Если приложение открыто на экране, уведомление не показываем. */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = {body: e.data ? e.data.text() : ''}; }
  const m = Object.assign({}, d.notification || {}, d.data || {}, d.title ? d : {});
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => {
    if (list.some(c => c.visibilityState === 'visible' && c.focused)) return;
    return self.registration.showNotification(String(m.title || 'Мастер рядом').slice(0, 80), {
      body: String(m.body || 'Новое сообщение').slice(0, 200),
      icon: 'icon-192.png',
      badge: 'favicon-48.png',
      tag: String(m.tag || 'mr'),
      renotify: true,
      data: {url: String(m.url || './')}
    });
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope);
  if (url.origin !== location.origin) return;
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => {
    for (const c of list) { if ('focus' in c) { if ('navigate' in c) c.navigate(url.href).catch(() => null); return c.focus(); } }
    return self.clients.openWindow(url.href);
  }));
});
