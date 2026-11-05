/* Страница модератора «Мастер рядом».
   Открывается по адресу /admin.html. Работать могут только люди с правами администратора
   (npm run admin -- +992…). Права проверяет сервер (firestore.rules), а не эта страница. */
(() => {
'use strict';
const CFG = window.MR_CONFIG || {};
const $ = (s, el) => (el || document).querySelector(s);
const ESC = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ESC[c]);
const app = $('#app');
const IMG = /^(https:\/\/firebasestorage\.googleapis\.com|http:\/\/127\.0\.0\.1:9199)\/v0\/b\//;
const when = v => { const ms = v && v.toMillis ? v.toMillis() : Number(v) || 0; return ms ? new Date(ms).toLocaleString('ru-RU') : ''; };

if (!CFG.firebase || !window.firebase) { app.innerHTML = '<div class="empty">Сначала подключите Firebase в config.js (README, шаги 1–2).</div>'; return; }
firebase.initializeApp(CFG.firebase);
const auth = firebase.auth(), db = firebase.firestore(), storage = firebase.storage();
if (CFG.useEmulators && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  auth.useEmulator('http://127.0.0.1:9099'); auth.settings.appVerificationDisabledForTesting = true;
  db.useEmulator('127.0.0.1', 8080); storage.useEmulator('127.0.0.1', 9199);
}

/* ---------- вход по СМС ---------- */
let rc = null, confirmRes = null;
function loginView(msg) {
  app.innerHTML = '<form class="login" id="lf"><label for="ph">Номер телефона модератора</label><input id="ph" type="tel" autocomplete="tel" placeholder="+992 ..." required>' +
    '<div id="rc"></div><button class="btn" type="submit" id="send">Получить код</button>' +
    '<label for="code" hidden id="code-l">Код из СМС</label><input id="code" inputmode="numeric" maxlength="6" hidden>' +
    '<button class="btn" type="button" id="check" hidden>Войти</button><p class="err" id="er">' + esc(msg || '') + '</p></form>';
  $('#lf').addEventListener('submit', async e => {
    e.preventDefault();
    const raw = $('#ph').value.trim(), d = raw.replace(/\D/g, '');
    const phone = raw.charAt(0) === '+' ? '+' + d : '+' + (d.length <= 10 ? String(CFG.defaultCountryCode || '+992').replace(/\D/g, '') : '') + d;
    $('#send').disabled = true; $('#er').textContent = '';
    try {
      if (!rc) rc = new firebase.auth.RecaptchaVerifier($('#rc'), {size: 'invisible'});
      confirmRes = await auth.signInWithPhoneNumber(phone, rc);
      ['#code', '#code-l', '#check'].forEach(s => { $(s).hidden = false; });
      $('#code').focus();
    } catch (err) { $('#er').textContent = 'Не получилось отправить СМС: ' + (err.code || err.message); try { rc.clear(); } catch (x) { /* */ } rc = null; }
    $('#send').disabled = false;
  });
  $('#check').addEventListener('click', async () => {
    try { await confirmRes.confirm($('#code').value.replace(/\D/g, '')); } catch (err) { $('#er').textContent = 'Неверный код'; }
  });
}

/* ---------- очереди ---------- */
const TABS = [['reports', 'Жалобы'], ['verify', 'Проверка мастеров'], ['works', 'Новые фото'], ['reviews', 'Новые отзывы'], ['photos', 'Удалённые фото']];
let tab = 'reports';
async function load() {
  if (tab === 'reports') return (await db.collection('reports').orderBy('createdAt', 'desc').limit(100).get()).docs;
  if (tab === 'verify') return (await db.collection('masters').where('verified', '==', false).limit(100).get()).docs;
  if (tab === 'works') return (await db.collection('works').orderBy('createdAt', 'desc').limit(60).get()).docs;
  if (tab === 'reviews') return (await db.collection('reviews').orderBy('createdAt', 'desc').limit(60).get()).docs;
  return (await db.collection('moderation').orderBy('at', 'desc').limit(60).get()).docs;
}
async function deleteMaster(id) {
  const ws = await db.collection('works').where('masterId', '==', id).get();
  for (const w of ws.docs) await w.ref.delete();
  await db.collection('masterContacts').doc(id).delete().catch(() => null);
  await db.collection('masters').doc(id).delete();
}
async function deleteJob(id) {
  await db.collection('jobContacts').doc(id).delete().catch(() => null);
  await db.collection('jobs').doc(id).delete();
}
async function phoneOf(masterId) {
  try { const s = await db.collection('masterContacts').doc(masterId).get(); return s.exists ? s.get('phone') : ''; } catch (e) { return ''; }
}
function itemHTML(d) {
  const x = d.data(), id = esc(d.id);
  if (tab === 'reports') {
    const del = {master: 'Удалить мастера', job: 'Удалить заказ', review: 'Удалить отзыв', work: 'Удалить фото'}[x.targetType];
    return '<article class="item"><header><b>' + esc(x.reason) + '</b><span class="tag">' + esc(x.targetType) + '</span><span class="meta">' + esc(when(x.createdAt)) + '</span></header>' +
      (x.text ? '<p>' + esc(x.text) + '</p>' : '') + '<span class="meta">Цель: ' + esc(x.targetId) + ' · от ' + esc(x.reporterUid) + '</span>' +
      '<div class="acts">' + (del ? '<button class="btn danger" data-act="del-target" data-type="' + esc(x.targetType) + '" data-target="' + esc(x.targetId) + '" data-id="' + id + '">' + del + '</button>' : '') +
      '<button class="btn ghost" data-act="close-report" data-id="' + id + '">Закрыть жалобу</button></div></article>';
  }
  if (tab === 'verify') {
    return '<article class="item"><header><b>' + esc(x.name) + '</b><span class="meta">' + esc(x.prof) + ' · ' + esc(x.district || '') + '</span></header>' +
      (x.about ? '<p>' + esc(x.about) + '</p>' : '') + '<span class="meta" data-phone="' + id + '">Телефон: загрузка…</span>' +
      '<div class="acts"><button class="btn" data-act="verify" data-id="' + id + '">Документы проверены</button><button class="btn danger" data-act="del-master" data-id="' + id + '">Удалить профиль</button></div></article>';
  }
  if (tab === 'works') {
    return '<article class="item">' + (IMG.test(x.photo || '') ? '<img src="' + esc(x.photo) + '" alt="" loading="lazy">' : '') + '<p>' + esc(x.text || '') + '</p><span class="meta">мастер ' + esc(x.masterId) + '</span>' +
      '<div class="acts"><button class="btn danger" data-act="del-work" data-id="' + id + '">Удалить</button></div></article>';
  }
  if (tab === 'reviews') {
    return '<article class="item"><header><b>' + esc(x.a) + ' · ' + '★'.repeat(Math.max(0, Math.min(5, x.r))) + '</b><span class="meta">' + esc(when(x.createdAt)) + '</span></header>' +
      (x.t ? '<p>' + esc(x.t) + '</p>' : '') + '<span class="meta">мастер ' + esc(x.masterId) + ' · автор ' + esc(x.authorUid) + '</span>' +
      '<div class="acts"><button class="btn danger" data-act="del-review" data-id="' + id + '">Удалить отзыв</button></div></article>';
  }
  return '<article class="item"><header><b>' + esc(x.reason) + '</b><span class="meta">' + esc(when(x.at)) + '</span></header><span class="meta">' + esc(x.path) + ' · ' + esc(x.uid) + '</span>' +
    '<div class="acts"><button class="btn ghost" data-act="del-mod" data-id="' + id + '">Убрать из списка</button></div></article>';
}
async function render() {
  app.innerHTML = '<nav class="tabs">' + TABS.map(t => '<button type="button" data-tab="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>').join('') + '</nav><div id="body" class="list"><div class="empty">Загрузка…</div></div>';
  let docs;
  try { docs = await load(); } catch (e) { $('#body').innerHTML = '<div class="empty">Нет доступа: ' + esc(e.code || e.message) + '</div>'; return; }
  const body = $('#body');
  body.className = tab === 'works' ? 'grid' : 'list';
  body.innerHTML = docs.length ? docs.map(itemHTML).join('') : '<div class="empty">Очередь пуста</div>';
  if (tab === 'verify') docs.forEach(async d => { const el = body.querySelector('[data-phone="' + CSS.escape(d.id) + '"]'); if (el) el.textContent = 'Телефон: ' + ((await phoneOf(d.id)) || 'не указан'); });
}
app.addEventListener('click', async e => {
  const t = e.target.closest('[data-tab]');
  if (t) { tab = t.dataset.tab; render(); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  // Удаление — в два нажатия
  if (b.classList.contains('danger') && !b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Точно? Нажмите ещё раз'; return; }
  b.disabled = true;
  const id = b.dataset.id;
  try {
    if (b.dataset.act === 'verify') await db.collection('masters').doc(id).update({verified: true});
    else if (b.dataset.act === 'del-master') await deleteMaster(id);
    else if (b.dataset.act === 'del-work') await db.collection('works').doc(id).delete();
    else if (b.dataset.act === 'del-review') await db.collection('reviews').doc(id).delete();
    else if (b.dataset.act === 'del-mod') await db.collection('moderation').doc(id).delete();
    else if (b.dataset.act === 'close-report') await db.collection('reports').doc(id).delete();
    else if (b.dataset.act === 'del-target') {
      const ty = b.dataset.type, tg = b.dataset.target;
      if (ty === 'master') await deleteMaster(tg);
      else if (ty === 'job') await deleteJob(tg);
      else if (ty === 'review') await db.collection('reviews').doc(tg).delete();
      else if (ty === 'work') await db.collection('works').doc(tg).delete();
      await db.collection('reports').doc(id).delete();
    }
    b.closest('.item').remove();
  } catch (err) { b.disabled = false; alert('Не получилось: ' + (err.code || err.message)); }
});

auth.onAuthStateChanged(async user => {
  if (!user) { $('#who').textContent = 'Вход для модераторов «Мастер рядом»'; loginView(); return; }
  const tok = await user.getIdTokenResult(true);
  if (!tok.claims.admin) {
    $('#who').textContent = user.phoneNumber + ' — нет прав модератора';
    app.innerHTML = '<div class="empty">У этого номера нет прав модератора. Их выдаёт владелец сайта: npm run admin -- ' + esc(user.phoneNumber) + '</div><p><button class="btn ghost" id="out">Выйти</button></p>';
    $('#out').addEventListener('click', () => auth.signOut());
    return;
  }
  $('#who').innerHTML = esc(user.phoneNumber) + ' · модератор · <button class="btn ghost" id="out" type="button">Выйти</button>';
  $('#out').addEventListener('click', () => auth.signOut());
  render();
});
})();
