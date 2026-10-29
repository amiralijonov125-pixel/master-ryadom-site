/* «Мастер рядом» — код сайта. Настройки — в config.js */
(() => {
'use strict';

/* ---------- утилиты ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const ESC = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ESC[c]);
const plural = (n, f) => { n = Math.abs(Math.round(n)); const a = n % 100, b = n % 10; return f[(a > 10 && a < 20) ? 2 : b === 1 ? 0 : (b >= 2 && b <= 4) ? 1 : 2]; };
// Форматтеры создаются один раз: toLocaleString на каждое число заметно тормозит на телефонах
const NF = {}, nf = d => NF[d] || (NF[d] = new Intl.NumberFormat('ru-RU', {minimumFractionDigits: d === 'm1' ? 0 : d, maximumFractionDigits: d === 'm1' ? 1 : d}));
const fmt = n => nf(0).format(Math.round(Number(n) || 0));
const fmt1 = n => nf('m1').format(Math.round((Number(n) || 0) * 10) / 10);
const fmtN = (v, dec) => dec ? nf(dec).format(Number(v) || 0) : fmt(v);
const pl = (n, f) => fmt(n) + ' ' + plural(n, f);
const fmtR = n => n ? (Math.round(n * 10) / 10).toFixed(1).replace('.', ',') : '—';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const uid = p => (p || 'l') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const digits = s => String(s || '').replace(/\D/g, '');
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
/* Телефон или слабое устройство: без 3D-фона и тяжёлых эффектов, чтобы ничего не тормозило */
const LITE_DEVICE = (() => {
  const nav = navigator, conn = nav.connection || {};
  const phone = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820;
  return phone || conn.saveData === true || (nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2);
})();
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const sc = document.createElement('script');
    sc.src = src; sc.async = false;
    sc.onload = resolve; sc.onerror = () => reject(new Error('Не загрузился ' + src));
    document.head.appendChild(sc);
  });
}
const DAY = 864e5, NOW = Date.now();
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const fmtDate = ms => { if (!ms) return ''; const d = new Date(ms); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
const fmtDay = ms => { const d = new Date(ms); return WD[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; };
const ago = ms => { const s = (Date.now() - (ms || 0)) / 1000; if (s < 60) return 'только что'; const m = s / 60; if (m < 60) return Math.floor(m) + ' мин назад'; const h = m / 60; if (h < 24) return Math.floor(h) + ' ч назад'; const d = Math.floor(h / 24); if (d === 1) return 'вчера'; if (d < 30) return d + ' ' + plural(d, ['день', 'дня', 'дней']) + ' назад'; return fmtDate(ms); };
const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const initials = n => String(n || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
const validImg = s => (typeof s === 'string' && s.length < 400000 && /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(s)) ? s : null;
const norm = s => String(s || '').toLowerCase().replace(/ё/g, 'е');
const REV = ['отзыв', 'отзыва', 'отзывов'];
const RESP = ['отклик', 'отклика', 'откликов'];
const yrs = n => pl(n || 0, ['год', 'года', 'лет']);
const respText = r => !r ? '' : r <= 15 ? 'Отвечает за 15 мин' : r <= 60 ? 'Отвечает за час' : r <= 180 ? 'Отвечает за 3 часа' : 'Отвечает в течение дня';
const telHref = p => { const d = digits(p); return d ? 'tel:' + (String(p).trim().charAt(0) === '+' ? '+' : '') + d : '#'; };
const cssId = s => (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');

/* ---------- языки ----------
   Словарь: русская строка | English | тоҷикӣ. Надписи интерфейса переводятся прямо в странице,
   в том числе в окнах, которые появляются позже. Тексты людей (имена, отзывы, описания) не трогаем. */
const I18N_SRC = `Мастер рядом|Master Nearby|Усто наздик
Каталог|Catalog|Феҳрист
Биржа заказов|Job board|Биржаи фармоишҳо
Калькулятор|Calculator|Ҳисобкунак
Мастерам|For pros|Барои устоҳо
Вопросы|FAQ|Саволҳо
Войти|Sign in|Ворид шудан
Каталог мастеров|Catalog of pros|Феҳристи устоҳо
Калькулятор ремонта|Repair calculator|Ҳисобкунаки таъмир
Поиск|Search|Ҷустуҷӯ
Сообщения|Messages|Паёмҳо
Мой кабинет|My account|Кабинети ман
ИИ-помощник|AI assistant|Ёрдамчии ЗС
Зарегистрироваться как мастер|Sign up as a pro|Ҳамчун усто сабт шудан
Маркетплейс мастеров|Marketplace of pros|Бозори устоҳо
Мастера по ремонту, авто, технике, уборке, переездам и другим работам с рейтингом, отзывами и ценами. Выберите мастера за пять минут и договоритесь напрямую.|Pros for repairs, cars, appliances, cleaning, moving and more, with ratings, reviews and prices. Pick a pro in five minutes and agree directly.|Устоҳо барои таъмир, мошин, техника, тозакунӣ, кӯчонидан ва дигар корҳо бо рейтинг, шарҳ ва нарх. Дар панҷ дақиқа усто интихоб кунед ва мустақиман гуфтугӯ кунед.
Найти мастера|Find a pro|Ёфтани усто
Я мастер|I'm a pro|Ман усто ҳастам
мастеров в каталоге|pros in the catalog|усто дар феҳрист
отзывов клиентов|client reviews|шарҳи мизоҷон
средняя оценка|average rating|баҳои миёна
Цифры по каталогу, включая примеры|Catalog figures, including examples|Рақамҳои феҳрист, бо намунаҳо
Проблема|The problem|Мушкилот
Хорошего мастера до сих пор ищут по знакомым|People still find good pros through friends|Устои хубро то ҳол тавассути шиносҳо меҷӯянд
Объявления без отзывов и фото работ|Ads without reviews or work photos|Эълонҳо бе шарҳ ва акси корҳо
Цена становится известна только на месте|You only learn the price on site|Нарх танҳо дар ҷои кор маълум мешавад
Непонятно, кому доверить ключи от квартиры|Hard to know who to trust with your keys|Маълум нест, ки калиди хонаро ба кӣ бовар кунед
Решение|The solution|Роҳи ҳал
Всё важное о мастере на одной странице|Everything about a pro on one page|Ҳама чизи муҳим дар бораи усто дар як саҳифа
Рейтинг и отзывы клиентов после работы|Ratings and reviews after each job|Рейтинг ва шарҳи мизоҷон баъди кор
Цены за м², за точку или за выезд заранее|Prices per m², per point or per visit up front|Нарх барои м², нуқта ё омадан пешакӣ
Отметка о проверенных документах|Verified documents badge|Аломати ҳуҷҷатҳои санҷидашуда
Отзывы|Reviews|Шарҳҳо
Оценка складывается из реальных заказов|Ratings come from real jobs|Баҳо аз фармоишҳои воқеӣ ташкил мешавад
Клиент ставит звёзды и отмечает, что понравилось: пунктуальность, чистоту, честную цену. Рейтинг пересчитывается после каждого отзыва, а умная сортировка учитывает их число.|Clients give stars and note what they liked: punctuality, tidiness, a fair price. The rating updates after every review, and smart sorting also counts how many there are.|Мизоҷ ситора мегузорад ва қайд мекунад, ки чӣ писанд омад: саривақтӣ, тозагӣ, нархи ҳалол. Рейтинг баъди ҳар шарҳ аз нав ҳисоб мешавад ва тартиби оқилона шумораи онҳоро низ ба назар мегирад.
Для мастеров|For pros|Барои устоҳо
Клиенты сами находят мастера|Clients find you themselves|Мизоҷон худашон усторо меёбанд
Бесплатный профиль за три минуты|Free profile in three minutes|Профили ройгон дар се дақиқа
Заказы рядом с домом на бирже|Jobs near your home on the board|Фармоишҳо дар наздикии хона дар биржа
Хорошие отзывы поднимают профиль в поиске|Good reviews lift your profile in search|Шарҳҳои хуб профилро дар ҷустуҷӯ боло мебаранд
Начать|Get started|Оғоз
Найдите мастера рядом с домом|Find a pro near your home|Устоеро дар наздикии хона ёбед
Найти|Find|Ёфтан
К каталогу|To the catalog|Ба феҳрист
Мастера с рейтингом и отзывами|Pros with ratings and reviews|Устоҳо бо рейтинг ва шарҳ
Сравните цены и отзывы, сохраните понравившихся в избранное и запишитесь на удобное время. Умная сортировка учитывает и оценку, и число отзывов.|Compare prices and reviews, save favorites and book a convenient time. Smart sorting weighs both the rating and the number of reviews.|Нарх ва шарҳҳоро муқоиса кунед, писандидаҳоро ба интихобшудаҳо илова кунед ва ба вақти мувофиқ сабт шавед. Тартиби оқилона ҳам баҳо ва ҳам шумораи шарҳҳоро ба назар мегирад.
Фильтры|Filters|Филтрҳо
Сбросить|Reset|Бекор кардан
Район|District|Ноҳия
Цена от, не выше|Starting price up to|Нархи аввал, на зиёда аз
любая|any|ҳар кадом
Оценка|Rating|Баҳо
Любая|Any|Ҳар кадом
Проверенные|Verified|Санҷидашуда
Свободны сегодня|Free today|Имрӯз озод
Сортировка|Sort|Тартиб
Умная: рейтинг и отзывы|Smart: rating and reviews|Оқилона: рейтинг ва шарҳҳо
По оценке|By rating|Аз рӯи баҳо
По числу отзывов|By number of reviews|Аз рӯи шумораи шарҳҳо
Сначала дешевле|Cheapest first|Аввал арзонтар
Быстрее отвечают|Fastest reply|Зудтар ҷавоб медиҳанд
По опыту|By experience|Аз рӯи таҷриба
Показать ещё|Show more|Боз нишон додан
Опишите задачу, мастера предложат цену|Describe the job, pros will quote a price|Корро шарҳ диҳед, устоҳо нарх пешниҳод мекунанд
Разместите заказ за минуту. Мастера откликаются со своей ценой, а вы выбираете того, кто подходит по срокам и отзывам.|Post a job in a minute. Pros reply with their price, and you choose who fits your timing and reviews.|Фармоишро дар як дақиқа ҷойгир кунед. Устоҳо бо нархи худ ҷавоб медиҳанд ва шумо касеро интихоб мекунед, ки аз рӯи мӯҳлат ва шарҳҳо мувофиқ аст.
Разместить заказ|Post a job|Ҷойгир кардани фармоиш
Заказ по фото с ИИ|Job from a photo with AI|Фармоиш аз акс бо ЗС
Посчитайте материалы и стоимость работы|Estimate materials and labor cost|Масолеҳ ва арзиши корро ҳисоб кунед
Цена работы берётся из каталога: средняя по мастерам нужной специальности. Материалы считаются с запасом на подрезку.|Labor price comes from the catalog: the average for that trade. Materials include extra for cutting.|Нархи кор аз феҳрист гирифта мешавад: миёна барои устоҳои ҳамон касб. Масолеҳ бо захира барои буридан ҳисоб мешавад.
Плитка|Tiles|Сафол
Покраска|Painting|Рангубор
Электрика|Electrics|Барқ
Что облицовываем|What to tile|Чиро рӯйпӯш мекунем
Пол|Floor|Фарш
Стены|Walls|Деворҳо
Пол и стены|Floor and walls|Фарш ва деворҳо
Длина, м|Length, m|Дарозӣ, м
Ширина, м|Width, m|Бар, м
Высота, м|Height, m|Баландӣ, м
Двери и окна, м²|Doors and windows, m²|Дару тиреза, м²
Размер плитки, см|Tile size, cm|Андозаи сафол, см
Способ укладки|Layout|Тарзи гузоштан
Прямая +10%|Straight +10%|Рост +10%
Диагональ +15%|Diagonal +15%|Диагоналӣ +15%
Ёлочка +20%|Herringbone +20%|Арчамонанд +20%
Поверхность|Surface|Сатҳ
Гладкая, после шпаклёвки|Smooth, after skim coat|Ҳамвор, баъди шпаклёвка
Обычная штукатурка|Regular plaster|Андовани оддӣ
Фактурная или бетон|Textured or concrete|Фактурӣ ё бетон
Слоёв краски|Coats of paint|Қабатҳои ранг
Красить потолок|Paint the ceiling|Шифтро ранг кардан
Розетки и выключатели|Outlets and switches|Розеткаҳо ва калидҳо
Светильники|Light fixtures|Чароғҳо
Кабель, м|Cable, m|Кабел, м
Гипсокартон, кабель за панелями|Drywall, cable behind panels|Гипсокартон, кабел дар паси панелҳо
Кирпич, нужно штробить|Brick, needs chasing|Хишт, бояд шароф кард
Бетон, нужно штробить|Concrete, needs chasing|Бетон, бояд шароф кард
Собрать новый щиток|Build a new panel|Щитоки нав ҷамъ кардан
Результат|Result|Натиҷа
Площадь облицовки|Tiling area|Масоҳати рӯйпӯш
Плитка с запасом|Tiles with extra|Сафол бо захира
шт.|pcs|дона
кор.|boxes|қуттӣ
Плиточный клей|Tile adhesive|Ширеши сафол
меш. по 25 кг|bags of 25 kg|халта 25 кг
кг|kg|кг
Затирка, шов 2 мм|Grout, 2 mm joint|Затирка, дарзи 2 мм
Работа кафельщика|Tiler's labor|Кори сафолчӣ
Показать кафельщиков|Show tilers|Нишон додани сафолчиҳо
Расчёт ориентировочный. Точный объём мастер уточнит на замере.|This is an estimate. The pro will confirm exact amounts on site.|Ҳисоб тахминӣ аст. Ҳаҷми дақиқро усто ҳангоми ченкунӣ муайян мекунад.
Площадь покраски|Painting area|Масоҳати рангубор
Краска|Paint|Ранг
л|L|л
Грунтовка, один слой|Primer, one coat|Грунт, як қабат
Работа маляра|Painter's labor|Кори рангмол
Показать маляров|Show painters|Нишон додани рангмолҳо
Расход указан для водоэмульсионной краски. На банке бывает своя норма, сверьтесь с ней.|Usage is for water-based paint. The can may list its own rate, check it.|Сарф барои ранги обӣ нишон дода шудааст. Дар зарф меъёри худ мешавад, онро санҷед.
Точек подключения|Connection points|Нуқтаҳои пайвастшавӣ
Светильники, кабель, щиток|Fixtures, cable, panel|Чароғҳо, кабел, щиток
Работа электрика|Electrician's labor|Кори барқчӣ
Показать электриков|Show electricians|Нишон додани барқчиҳо
Материалы в расчёт не входят: кабель, автоматы и розетки мастер посчитает по вашему плану.|Materials are not included: the pro will count cable, breakers and outlets from your plan.|Масолеҳ ба ҳисоб дохил нестанд: кабел, автоматҳо ва розеткаҳоро усто аз рӯи нақшаи шумо ҳисоб мекунад.
Профиль мастера за три минуты|A pro profile in three minutes|Профили усто дар се дақиқа
Укажите специальность, цены и телефон. Профиль сразу появится в каталоге, а заказы рядом с вами ждут на бирже.|Add your trade, prices and phone. Your profile appears in the catalog right away, and nearby jobs wait on the board.|Касб, нарх ва телефонро нишон диҳед. Профил фавран дар феҳрист пайдо мешавад ва фармоишҳои наздик дар биржа интизоранд.
Бесплатный профиль|Free profile|Профили ройгон
Фото работ, услуги и цены, отметка «Свободен сегодня».|Work photos, services and prices, a "Free today" badge.|Акси корҳо, хизматрасониҳо ва нархҳо, аломати «Имрӯз озод».
Заказы рядом|Jobs nearby|Фармоишҳои наздик
Откликайтесь на заказы клиентов со своей ценой.|Reply to client jobs with your own price.|Ба фармоишҳои мизоҷон бо нархи худ ҷавоб диҳед.
Рейтинг работает на вас|Your rating works for you|Рейтинг ба фоидаи шумо кор мекунад
Чем больше хороших отзывов, тем выше вы в поиске.|The more good reviews, the higher you rank in search.|Ҳар қадар шарҳи хуб зиёд бошад, шумо дар ҷустуҷӯ ҳамон қадар болотаред.
Редактирование профиля|Editing profile|Таҳрири профил
Отменить|Cancel|Бекор кардан
О вас|About you|Дар бораи шумо
Услуги|Services|Хизматҳо
Фото|Photos|Аксҳо
График|Schedule|Ҷадвал
Шаг 1. О вас|Step 1. About you|Қадами 1. Дар бораи шумо
Имя и фамилия *|Full name *|Ном ва насаб *
Город, район|City, district|Шаҳр, ноҳия
Специальность *|Trade *|Касб *
Телефон *|Phone *|Телефон *
Номер станет вашим аккаунтом вместе с именем|Your number and name become your account|Рақам бо ном ҳисоби шумо мешавад
Опыт, лет|Experience, years|Таҷриба, сол
О себе|About me|Дар бораи худ
из 400 знаков|of 400 characters|аз 400 аломат
Написать с ИИ|Write with AI|Бо ЗС навиштан
Напишите пару слов о себе, ИИ сделает из них аккуратный текст и предложит услуги|Write a few words about yourself, AI will turn them into a neat text and suggest services|Якчанд сухан дар бораи худ нависед, ЗС аз онҳо матни мураттаб месозад ва хизматҳо пешниҳод мекунад
Шаг 2. Услуги и цены|Step 2. Services and prices|Қадами 2. Хизматҳо ва нархҳо
С какими машинами работаете|Which cars do you work on|Бо кадом мошинҳо кор мекунед
Если ничего не отметить, клиенты увидят «любые марки»|If you pick nothing, clients will see "any make"|Агар чизе қайд накунед, мизоҷон «ҳар гуна марка»-ро мебинанд
Цена от *|Price from *|Нарх аз *
За что|Per|Барои чӣ
Услуги и цены|Services and prices|Хизматҳо ва нархҳо
Своя услуга|Custom service|Хизмати худ
Шаг 3. Фото|Step 3. Photos|Қадами 3. Аксҳо
Фото профиля|Profile photo|Акси профил
Перетащите фото или нажмите, чтобы выбрать|Drag a photo here or tap to choose|Аксро кашед ё барои интихоб пахш кунед
Убрать фото|Remove photo|Акс хориҷ кардан
Фото работ, до трёх|Work photos, up to three|Акси корҳо, то се
Добавьте фото ванной, кухни или другой готовой работы|Add photos of a bathroom, kitchen or other finished work|Акси ҳаммом, ошхона ё кори дигари тайёрро илова кунед
Фото уменьшаются прямо в браузере, чтобы профиль быстро открывался.|Photos are shrunk in the browser so your profile loads fast.|Аксҳо дар браузер хурд карда мешаванд, то профил зуд кушода шавад.
Шаг 4. График работы|Step 4. Working hours|Қадами 4. Ҷадвали корӣ
Рабочие дни *|Working days *|Рӯзҳои корӣ *
Остальные дни будут выходными, на них клиенты не смогут записаться|Other days are days off; clients can't book them|Рӯзҳои дигар истироҳатӣ мешаванд, мизоҷон ба онҳо сабт шуда наметавонанд
Начало работы|Start time|Оғози кор
Конец работы|End time|Анҷоми кор
Перерыв на отдых|Rest break|Танаффус барои истироҳат
Перерыв с|Break from|Танаффус аз
До|Until|То
Отвечаю на заявки|I reply to requests|Ба дархостҳо ҷавоб медиҳам
В течение 15 минут|Within 15 minutes|Дар давоми 15 дақиқа
В течение часа|Within an hour|Дар давоми як соат
В течение 3 часов|Within 3 hours|Дар давоми 3 соат
В течение дня|Within a day|Дар давоми рӯз
Свободен сегодня|Free today|Имрӯз озод
Согласен, что телефон будет виден клиентам в профиле|I agree my phone is shown to clients in my profile|Розӣ ҳастам, ки телефон дар профил ба мизоҷон намоён бошад
Назад|Back|Бозгашт
Далее|Next|Минбаъд
Опубликовать профиль|Publish profile|Нашри профил
Так вас увидят клиенты|How clients will see you|Мизоҷон шуморо чунин мебинанд
Что помогает получать заказы|What helps you get jobs|Чӣ барои гирифтани фармоиш кӯмак мекунад
Фото готовых работ, а не инструмента|Photos of finished work, not tools|Акси корҳои тайёр, на асбобҳо
Цены за единицу: за м², за точку или за выезд|Unit prices: per m², per point or per visit|Нарх барои воҳид: барои м², нуқта ё омадан
Отметка «Свободен сегодня», когда есть время|The "Free today" badge when you have time|Аломати «Имрӯз озод», вақте ки вақт доред
Как всё устроено|How it works|Ҳамааш чӣ тавр кор мекунад
Сколько стоит пользоваться сервисом?|How much does the service cost?|Истифодаи хизмат чанд пул аст?
Для клиентов поиск, запись и биржа заказов бесплатны. Мастер тоже размещает профиль бесплатно. В будущем можно добавить платное продвижение профиля в начало списка.|Search, booking and the job board are free for clients. Pros also list their profile for free. Paid promotion to the top of the list may be added later.|Барои мизоҷон ҷустуҷӯ, сабт ва биржаи фармоишҳо ройгон аст. Усто низ профилро ройгон ҷойгир мекунад. Дар оянда пешбарии пулакии профил ба аввали рӯйхат илова шуданаш мумкин.
Как проверяются мастера?|How are pros verified?|Устоҳо чӣ тавр санҷида мешаванд?
Отметку «Документы проверены» ставит администратор после проверки паспорта и первых отзывов. Новые профили появляются без этой отметки.|An admin adds the "Documents verified" badge after checking the passport and first reviews. New profiles appear without it.|Аломати «Ҳуҷҷатҳо санҷида шуданд»-ро маъмур баъди санҷиши шиноснома ва шарҳҳои аввал мегузорад. Профилҳои нав бе ин аломат пайдо мешаванд.
Кто может оставить отзыв?|Who can leave a review?|Кӣ метавонад шарҳ гузорад?
В этой версии отзыв может оставить любой посетитель. В рабочей версии отзыв будет доступен только клиенту, который записался к мастеру через сайт.|In this version any visitor can leave a review. In the live version only clients who booked through the site can.|Дар ин версия ҳар меҳмон метавонад шарҳ гузорад. Дар версияи корӣ шарҳ танҳо барои мизоҷе дастрас мешавад, ки тавассути сайт ба усто сабт шудааст.
Как работает биржа заказов?|How does the job board work?|Биржаи фармоишҳо чӣ тавр кор мекунад?
Вы описываете задачу, район, сроки и бюджет. Мастера откликаются со своей ценой. Мастер, который откликнулся, видит ваш телефон и может позвонить. Когда мастер найден, закройте заказ в кабинете.|You describe the job, district, timing and budget. Pros reply with their price. A pro who replied sees your phone and can call. Once you've found someone, close the job in your account.|Шумо кор, ноҳия, мӯҳлат ва буҷаро шарҳ медиҳед. Устоҳо бо нархи худ ҷавоб медиҳанд. Устое, ки ҷавоб дод, телефони шуморо мебинад ва метавонад занг занад. Вақте ки усто ёфт шуд, фармоишро дар кабинет пӯшед.
Как считается рейтинг?|How is the rating calculated?|Рейтинг чӣ тавр ҳисоб мешавад?
Оценка мастера равна среднему всех отзывов. Умная сортировка дополнительно учитывает их число: мастер с двадцатью отзывами по 4,8 окажется выше мастера с одним отзывом на 5.|A pro's rating is the average of all reviews. Smart sorting also counts how many: a pro with twenty 4.8 reviews ranks above one with a single 5.|Баҳои усто миёнаи ҳамаи шарҳҳост. Тартиби оқилона шумораи онҳоро низ ба назар мегирад: устое бо бист шарҳи 4,8 аз устое бо як шарҳи 5 болотар меистад.
Как записаться к мастеру на время?|How do I book a time with a pro?|Чӣ тавр ба усто ба вақти муайян сабт шавам?
Мастер указывает в профиле рабочие дни, часы и перерыв на отдых. В профиле или в чате нажмите «Записаться», выберите свободный день и время. Запрос придёт мастеру в чат, он примет его или отклонит, и вы сразу увидите ответ. Занятое время другие клиенты выбрать уже не смогут.|Pros list working days, hours and rest breaks in their profile. In the profile or chat tap "Book", pick a free day and time. The request goes to the pro's chat, they accept or decline, and you see the answer right away. Booked times can't be picked by other clients.|Усто дар профил рӯзҳои корӣ, соатҳо ва танаффусро нишон медиҳад. Дар профил ё чат «Сабт шудан»-ро пахш кунед, рӯз ва вақти озодро интихоб кунед. Дархост ба чати усто меравад, ӯ қабул ё рад мекунад ва шумо ҷавобро фавран мебинед. Вақти бандро мизоҷони дигар интихоб карда наметавонанд.
Как написать мастеру в чат?|How do I message a pro?|Чӣ тавр ба усто дар чат навишт?
Откройте профиль мастера и нажмите «Написать». Все диалоги собраны за значком сообщений в шапке, новые ответы отмечены цифрой. В шапке диалога видно телефон мастера, можно сразу позвонить. В прототипе сообщения не шифруются, поэтому не пишите в чате пароли и данные карт.|Open a pro's profile and tap "Message". All chats are behind the messages icon in the header, new replies show a number. The chat header shows the pro's phone so you can call right away. In this prototype messages aren't encrypted, so don't send passwords or card details.|Профили усторо кушоед ва «Навиштан»-ро пахш кунед. Ҳамаи гуфтугӯҳо дар паси нишонаи паёмҳо дар сарлавҳа ҷамъ шудаанд, ҷавобҳои нав бо рақам қайд мешаванд. Дар сарлавҳаи гуфтугӯ телефони усто намоён аст, метавонед фавран занг занед. Дар прототип паёмҳо рамзгузорӣ намешаванд, аз ин рӯ паролҳо ва маълумоти кортро нанависед.
Где хранятся профили, отзывы и заказы?|Where are profiles, reviews and jobs stored?|Профилҳо, шарҳҳо ва фармоишҳо дар куҷо нигоҳ дошта мешаванд?
Когда подключена общая база, записи видят все, кто открывает эту страницу. В остальных случаях они сохраняются только в вашем браузере. Мастера и заказы с пометкой «пример» вымышлены и нужны для демонстрации.|When the shared database is connected, everyone who opens this page sees the entries. Otherwise they're saved only in your browser. Pros and jobs marked "example" are made up for demonstration.|Вақте ки пойгоҳи умумӣ пайваст аст, сабтҳоро ҳар касе, ки ин саҳифаро мекушояд, мебинад. Дар дигар ҳолатҳо онҳо танҳо дар браузери шумо нигоҳ дошта мешаванд. Устоҳо ва фармоишҳо бо қайди «намуна» сохтагӣ буда, барои намоиш лозиманд.
Маркетплейс мастеров: ремонт, авто, техника, уборка, переезды, красота и обучение. С рейтингом, отзывами и ценами.|A marketplace of pros: repairs, cars, appliances, cleaning, moving, beauty and tutoring. With ratings, reviews and prices.|Бозори устоҳо: таъмир, мошин, техника, тозакунӣ, кӯчонидан, зебоӣ ва таълим. Бо рейтинг, шарҳ ва нарх.
© 2026 Мастер рядом · прототип|© 2026 Master Nearby · prototype|© 2026 Усто наздик · прототип
Сравнить|Compare|Муқоиса
Мастер рядом, в начало|Master Nearby, to the top|Усто наздик, ба аввал
Разделы сайта|Site sections|Бахшҳои сайт
Поиск (клавиша /)|Search (key /)|Ҷустуҷӯ (тугмаи /)
Войти или создать аккаунт|Sign in or create an account|Ворид шудан ё ҳисоб сохтан
Открыть меню|Open menu|Кушодани меню
Меню|Menu|Меню
Презентация сервиса «Мастер рядом»|Master Nearby presentation|Муаррифии хизмати «Усто наздик»
Слайды презентации|Presentation slides|Слайдҳои муаррифӣ
Предыдущий слайд|Previous slide|Слайди қаблӣ
Пауза|Pause|Таваққуф
Следующий слайд|Next slide|Слайди навбатӣ
Показать на весь экран|Full screen|Дар тамоми экран
Что нужно сделать?|What needs doing?|Чӣ кор кардан лозим?
Что нужно сделать|What needs doing|Чӣ кор кардан лозим
Кто нужен или что сделать? Например: починить машину|Who do you need or what to do? E.g.: fix my car|Кӣ лозим ё чӣ кор кардан? Масалан: мошинро таъмир кардан
Поиск мастера или услуги|Search for a pro or service|Ҷустуҷӯи усто ё хизмат
Очистить поиск|Clear search|Тоза кардани ҷустуҷӯ
Специальности|Trades|Касбҳо
Минимальная оценка|Minimum rating|Баҳои ҳадди ақал
Фильтр заказов|Job filter|Филтри фармоишҳо
Вид работ|Type of work|Намуди кор
Например: Иван Петров|E.g.: John Smith|Масалан: Алӣ Раҳимов
Центр|Center|Марказ
Чем занимаетесь, с какими материалами работаете, есть ли свой инструмент|What you do, which materials you use, whether you have your own tools|Бо чӣ машғулед, бо кадом масолеҳ кор мекунед, асбоби худ доред ё не
Предпросмотр карточки|Card preview|Пешнамоиши корт
Очистить сравнение|Clear comparison|Тоза кардани муқоиса
янв|Jan|янв
фев|Feb|фев
мар|Mar|мар
апр|Apr|апр
мая|May|май
июн|Jun|июн
июл|Jul|июл
авг|Aug|авг
сен|Sep|сен
окт|Oct|окт
ноя|Nov|ноя
дек|Dec|дек
вс|Sun|якш
пн|Mon|дш
вт|Tue|сш
ср|Wed|чш
чт|Thu|пш
пт|Fri|ҷм
сб|Sat|шб
только что|just now|ҳозир
мин назад|min ago|дақ пеш
ч назад|h ago|соат пеш
вчера|yesterday|дирӯз
день|day|рӯз
дня|days|рӯз
дней|days|рӯз
назад|ago|пеш
отзыв|review|шарҳ
отзыва|reviews|шарҳ
отзывов|reviews|шарҳ
отклик|reply|ҷавоб
отклика|replies|ҷавоб
откликов|replies|ҷавоб
мастер|pro|усто
мастера|pros|усто
мастеров|pros|усто
год|year|сол
года|years|сол
лет|years|сол
Отвечает за 15 мин|Replies in 15 min|Дар 15 дақ ҷавоб медиҳад
Отвечает за час|Replies within an hour|Дар як соат ҷавоб медиҳад
Отвечает за 3 часа|Replies within 3 hours|Дар 3 соат ҷавоб медиҳад
Отвечает в течение дня|Replies within a day|Дар давоми рӯз ҷавоб медиҳад
из 5|out of 5|аз 5
Ремонт и стройка|Repair and construction|Таъмир ва сохтмон
Авто|Cars|Мошин
Техника и электроника|Appliances and electronics|Техника ва электроника
Дом и быт|Home and household|Хона ва рӯзгор
Красота|Beauty|Зебоӣ
Обучение и другое|Tutoring and more|Таълим ва дигар
Сантехник|Plumber|Сантехник
за выезд|per visit|барои омадан
Замена смесителя|Faucet replacement|Иваз кардани кран
Установка унитаза|Toilet installation|Насби унитаз
Прочистка засора|Drain unclogging|Тоза кардани басташавӣ
Подключение стиральной машины|Washing machine hookup|Пайваст кардани мошини ҷомашӯӣ
Кафельщик|Tiler|Сафолчӣ
за м²|per m²|барои м²
Укладка плитки на пол|Floor tiling|Гузоштани сафол ба фарш
Укладка настенной плитки|Wall tiling|Гузоштани сафоли деворӣ
Затирка швов|Grouting|Пур кардани дарзҳо
Демонтаж старой плитки|Old tile removal|Канда гирифтани сафоли кӯҳна
Электрик|Electrician|Барқчӣ
за точку|per point|барои нуқта
Установка розетки|Outlet installation|Насби розетка
Сборка щитка|Panel assembly|Ҷамъ кардани щиток
Прокладка кабеля|Cable laying|Кашидани кабел
Подключение светильника|Light fixture hookup|Пайваст кардани чароғ
Слесарь|Locksmith|Қулфсоз
Вскрытие замка|Lock opening|Кушодани қулф
Замена личинки|Lock cylinder replacement|Иваз кардани личинка
Регулировка двери|Door adjustment|Танзими дар
Установка доводчика|Door closer installation|Насби доводчик
Маляр|Painter|Рангмол
Покраска стен|Wall painting|Ранг кардани деворҳо
Шпаклёвка под покраску|Skim coat before painting|Шпаклёвка барои ранг
Поклейка обоев|Wallpapering|Часпонидани обой
Покраска потолка|Ceiling painting|Ранг кардани шифт
Плотник|Carpenter|Дуредгар
Установка межкомнатной двери|Interior door installation|Насби дари дохилӣ
Ремонт пола|Floor repair|Таъмири фарш
Изготовление полок|Shelf making|Сохтани рафҳо
Сварщик|Welder|Кафшергар
Ремонт ворот|Gate repair|Таъмири дарвоза
Сварка навеса|Canopy welding|Кафшери соябон
Решётки на окна|Window bars|Панҷара барои тиреза
Строитель|Builder|Бинокор
Кладка стен|Wall masonry|Девор чидан
Стяжка пола|Floor screed|Стяжкаи фарш
Перегородки из гипсокартона|Drywall partitions|Деворчаҳо аз гипсокартон
Ремонт квартиры под ключ|Turnkey apartment renovation|Таъмири пурраи хона
Окна и двери ПВХ|PVC windows and doors|Тиреза ва дарҳои ПВХ
за услугу|per service|барои хизмат
Установка пластикового окна|PVC window installation|Насби тирезаи пластикӣ
Регулировка окон|Window adjustment|Танзими тирезаҳо
Москитная сетка|Insect screen|Тӯри пашша
Откосы и подоконник|Reveals and window sill|Откосҳо ва тахтаи тиреза
Мастер на час|Handyman|Устои соатбай
за час|per hour|барои соат
Сборка мебели|Furniture assembly|Ҷамъ кардани мебел
Навеска полок|Shelf mounting|Овезон кардани рафҳо
Установка карниза|Curtain rod installation|Насби карниз
Навеска телевизора|TV mounting|Овезон кардани телевизор
Автомеханик|Car mechanic|Автомеханик
Обычные машины: бензин, дизель, газ|Regular cars: petrol, diesel, gas|Мошинҳои оддӣ: бензин, дизел, газ
Диагностика|Diagnostics|Ташхис
Замена масла|Oil change|Иваз кардани равған
Ремонт двигателя|Engine repair|Таъмири муҳаррик
Ремонт тормозов|Brake repair|Таъмири тормоз
Ремонт подвески|Suspension repair|Таъмири овезон
Мастер по электромобилям|EV specialist|Устои мошинҳои барқӣ
Электромобили и гибриды: BYD, Tesla, Zeekr и другие|EVs and hybrids: BYD, Tesla, Zeekr and more|Мошинҳои барқӣ ва гибридӣ: BYD, Tesla, Zeekr ва дигарон
Диагностика электромобиля|EV diagnostics|Ташхиси мошини барқӣ
Ремонт высоковольтной батареи|High-voltage battery repair|Таъмири батареяи баландшиддат
Прошивка и русификация|Firmware and localization|Прошивка ва русикунонӣ
Установка зарядной станции|Charging station installation|Насби истгоҳи пуркунӣ
Автоэлектрик|Auto electrician|Автоэлектрик
Электрика машины, аккумулятор, сигнализация|Car electrics, battery, alarm|Барқи мошин, аккумулятор, сигнализатсия
Диагностика электрики|Electrical diagnostics|Ташхиси барқ
Замена аккумулятора|Battery replacement|Иваз кардани аккумулятор
Ремонт генератора|Alternator repair|Таъмири генератор
Установка сигнализации|Alarm installation|Насби сигнализатсия
Шиномонтаж|Tire service|Шиномонтаж
Колёса, резина, диски|Wheels, tires, rims|Чархҳо, шина, дискҳо
за колесо|per wheel|барои чарх
Смена резины|Tire change|Иваз кардани шина
Балансировка|Wheel balancing|Балансировка
Ремонт прокола|Puncture repair|Таъмири сӯрохӣ
Правка дисков|Rim straightening|Рост кардани дискҳо
Кузовной ремонт|Body repair|Таъмири кузов
Вмятины, покраска, бампер|Dents, paint, bumper|Фурӯрафтагӣ, ранг, бампер
Удаление вмятин|Dent removal|Рост кардани фурӯрафтагӣ
Покраска детали|Panel painting|Ранг кардани қисм
Ремонт бампера|Bumper repair|Таъмири бампер
Полировка кузова|Body polishing|Сайқал додани кузов
Ремонт бытовой техники|Appliance repair|Таъмири техникаи маишӣ
Ремонт стиральной машины|Washing machine repair|Таъмири мошини ҷомашӯӣ
Ремонт холодильника|Fridge repair|Таъмири яхдон
Ремонт посудомойки|Dishwasher repair|Таъмири зарфшӯй
Ремонт микроволновки|Microwave repair|Таъмири микроволновка
Мастер по кондиционерам|AC technician|Устои кондитсионер
Установка кондиционера|AC installation|Насби кондитсионер
Чистка кондиционера|AC cleaning|Тоза кардани кондитсионер
Заправка фреоном|Freon refill|Пур кардани фреон
Ремонт вентиляции|Ventilation repair|Таъмири вентилятсия
Компьютерный мастер|Computer technician|Устои компютер
Установка Windows|Windows installation|Насби Windows
Чистка от вирусов|Virus removal|Тоза кардан аз вирусҳо
Настройка Wi-Fi|Wi-Fi setup|Танзими Wi-Fi
Ремонт ноутбука|Laptop repair|Таъмири ноутбук
Ремонт телефонов|Phone repair|Таъмири телефон
Замена экрана|Screen replacement|Иваз кардани экран
Ремонт разъёма зарядки|Charging port repair|Таъмири даромадгоҳи пуркунӣ
Прошивка|Firmware|Прошивка
Уборка|Cleaning|Тозакунӣ
Генеральная уборка|Deep cleaning|Тозакунии умумӣ
Уборка после ремонта|Post-renovation cleaning|Тозакунӣ баъди таъмир
Мытьё окон|Window cleaning|Шустани тиреза
Химчистка дивана|Sofa dry cleaning|Химчистки диван
Грузчики и переезд|Movers|Боркашон ва кӯчонидан
Квартирный переезд|Apartment move|Кӯчонидани хона
Грузчики|Movers|Боркашон
Вывоз мусора|Junk removal|Бурдани партов
Доставка мебели|Furniture delivery|Расонидани мебел
Садовник|Gardener|Боғбон
Покос травы|Grass mowing|Даравидани алаф
Обрезка деревьев|Tree pruning|Буридани дарахтон
Уход за газоном|Lawn care|Нигоҳубини газон
Посадка растений|Planting|Шинондани растаниҳо
Швея|Tailor|Дӯзанда
Подшить брюки|Hem trousers|Кӯтоҳ кардани шим
Замена молнии|Zipper replacement|Иваз кардани занҷирак
Ушить платье|Take in a dress|Танг кардани курта
Пошив штор|Curtain sewing|Дӯхтани парда
Парикмахер|Hairdresser|Сартарош
Мужская стрижка|Men's haircut|Мӯйгирии мардона
Женская стрижка|Women's haircut|Мӯйгирии занона
Окрашивание|Coloring|Ранг кардани мӯй
Укладка|Styling|Ороиши мӯй
Мастер маникюра|Nail artist|Устои маникюр
Маникюр|Manicure|Маникюр
Покрытие гель-лаком|Gel polish|Пӯшиши гел-лак
Педикюр|Pedicure|Педикюр
Наращивание|Extensions|Дароз кардан
Репетитор|Tutor|Омӯзгори хусусӣ
Математика|Math|Математика
Английский язык|English|Забони англисӣ
Подготовка к экзаменам|Exam prep|Омодагӣ ба имтиҳон
Русский язык|Russian|Забони русӣ
Фотограф|Photographer|Суратгир
Фотосессия|Photo shoot|Суратгирӣ
Свадебная съёмка|Wedding shoot|Суратгирии тӯй
Видеосъёмка|Video shoot|Наворбардорӣ
Съёмка товаров|Product photos|Суратгирии мол
Северный район|North district|Ноҳияи шимолӣ
Южный район|South district|Ноҳияи ҷанубӣ
Восточный район|East district|Ноҳияи шарқӣ
Западный район|West district|Ноҳияи ғарбӣ
Пунктуальный|Punctual|Саривақт
Аккуратно и чисто|Neat and clean|Бодиққат ва тоза
Цена как договорились|Price as agreed|Нарх мувофиқи созиш
Быстро|Fast|Зуд
Вежливый|Polite|Боодоб
Свой инструмент|Own tools|Асбоби худ
Даёт советы|Gives advice|Маслиҳат медиҳад
Срочно|Urgent|Фаврӣ
Сегодня|Today|Имрӯз
На этой неделе|This week|Дар ҳамин ҳафта
Не спешу|No rush|Шитоб надорам
машина BYD|BYD car|мошини BYD
починить машину|fix my car|таъмири мошин
заменить смеситель|replace a faucet|иваз кардани кран
ремонт стиральной машины|washing machine repair|таъмири мошини ҷомашӯӣ
поставить окна ПВХ|install PVC windows|насби тирезаҳои ПВХ
уборка квартиры|apartment cleaning|тозакунии хона
переезд|moving|кӯчонидан
установить кондиционер|install an AC|насби кондитсионер
собрать шкаф|assemble a wardrobe|ҷамъ кардани ҷевон
Электромобиль|Electric car|Мошини барқӣ
Бензин и дизель|Petrol and diesel|Бензин ва дизел
Бензин, дизель и гибриды|Petrol, diesel and hybrids|Бензин, дизел ва гибридҳо
Мастер|Pro|Усто
Подсказки|Suggestions|Пешниҳодҳо
Возможно, вы ищете|You may be looking for|Шояд шумо меҷӯед
Нет рабочих дней|No working days|Рӯзи корӣ нест
Сегодня выходной|Day off today|Имрӯз рӯзи истироҳат
Сегодня работает с|Today works from|Имрӯз кор мекунад аз
Сегодня уже закончил работу|Finished work for today|Имрӯз корро тамом кард
Перерыв на отдых до|On a break until|Танаффус то
Сейчас работает, до|Working now, until|Ҳоло кор мекунад, то
Гость|Guest|Меҳмон
Браузер не сохранил данные: закончилось место. Уберите часть фото.|The browser couldn't save data: out of space. Remove some photos.|Браузер маълумотро нигоҳ надошт: ҷой тамом шуд. Қисми аксҳоро хориҷ кунед.
Общая база заполнена. Запись сохранена в этом браузере.|The shared database is full. Saved in this browser.|Пойгоҳи умумӣ пур аст. Сабт дар ҳамин браузер нигоҳ дошта шуд.
Номер скопирован|Number copied|Рақам нусхабардорӣ шуд
Номер выделен, скопируйте его вручную|Number selected, copy it manually|Рақам ҷудо шуд, онро дастӣ нусха кунед
Документы проверены|Documents verified|Ҳуҷҷатҳо санҷида шуданд
Опыт|Experience|Таҷриба
Новый|New|Нав
пример|example|намуна
район не указан|no district|ноҳия нишон дода нашудааст
Убрать из избранного|Remove from favorites|Аз интихобшудаҳо хориҷ кардан
Добавить в избранное|Add to favorites|Ба интихобшудаҳо илова кардан
пока без отзывов|no reviews yet|ҳоло бе шарҳ
Марки:|Makes:|Маркаҳо:
любые|any|ҳар гуна
Хвалят:|Praised for:|Таъриф мекунанд:
Подробнее|Details|Муфассал
от|from|аз
Например: ванная 4 м², плитка куплена, нужен демонтаж старой|E.g.: 4 m² bathroom, tiles bought, old ones need removing|Масалан: ҳаммом 4 м², сафол харида шуд, кӯҳнаро кандан лозим
Например: течёт смеситель на кухне|E.g.: kitchen faucet is leaking|Масалан: крани ошхона мечакад
Например: перенести две розетки|E.g.: move two outlets|Масалан: ду розеткаро ҷойиваз кардан
Например: заменить личинку замка|E.g.: replace a lock cylinder|Масалан: иваз кардани личинкаи қулф
Например: покрасить комнату 18 м²|E.g.: paint an 18 m² room|Масалан: ранг кардани утоқи 18 м²
Например: поставить межкомнатную дверь|E.g.: install an interior door|Масалан: насби дари дохилӣ
Например: починить петлю ворот|E.g.: fix a gate hinge|Масалан: таъмири ошиқ-маъшуқи дарвоза
Например: собрать шкаф и повесить полку|E.g.: assemble a wardrobe and hang a shelf|Масалан: ҷевонро ҷамъ кардан ва раф овехтан
Опишите задачу|Describe the job|Корро шарҳ диҳед
Мастер сохранён в избранном|Pro saved to favorites|Усто ба интихобшудаҳо илова шуд
Сравнить можно до трёх мастеров|You can compare up to three pros|То се усторо муқоиса кардан мумкин
Выберите ещё одного мастера|Pick one more pro|Боз як усто интихоб кунед
Выбрано|Selected|Интихоб шуд
Выберите хотя бы двух мастеров|Pick at least two pros|Ақаллан ду усто интихоб кунед
Цена|Price|Нарх
Отвечает|Replies|Ҷавоб медиҳад
Документы|Documents|Ҳуҷҷатҳо
Проверены|Verified|Санҷида шуданд
Не проверены|Not verified|Санҷида нашудаанд
Да|Yes|Ҳа
Нет|No|Не
Чаще хвалят|Most praised for|Бештар таъриф мекунанд
Сравнение мастеров|Compare pros|Муқоисаи устоҳо
Лучшее значение в строке подсвечено.|The best value in each row is highlighted.|Беҳтарин қимат дар ҳар сатр ҷудо карда шудааст.
Цены указаны в разных единицах, поэтому их не сравниваем.|Prices are in different units, so we don't compare them.|Нархҳо дар воҳидҳои гуногун нишон дода шудаанд, бинобар ин муқоиса намекунем.
Профиль|Profile|Профил
Избранное хранится в кабинете. Создайте аккаунт: имя и номер телефона.|Favorites live in your account. Create one: name and phone number.|Интихобшудаҳо дар кабинет нигоҳ дошта мешаванд. Ҳисоб созед: ном ва рақами телефон.
Пока нет отзывов|No reviews yet|Ҳоло шарҳ нест
Чаще всего отмечают|Most often mentioned|Бештар қайд мекунанд
Отзывов пока нет. Станьте первым, кто оценит работу мастера.|No reviews yet. Be the first to rate this pro.|Ҳоло шарҳ нест. Аввалин шуда кори усторо баҳо диҳед.
Показать все|Show all|Ҳамаро нишон додан
Запрос на запись|Booking request|Дархости сабт
Работает:|Works:|Кор мекунад:
перерыв|break|танаффус
День|Day|Рӯз
выходной|day off|истироҳат
вых|off|ист
сегодня|today|имрӯз
завтра|tomorrow|фардо
Время|Time|Вақт
Сначала выберите день|Pick a day first|Аввал рӯзро интихоб кунед
Отправить запрос мастеру|Send request to the pro|Ба усто дархост фиристодан
Запрос придёт мастеру в чат. Он примет время или предложит другое.|The request goes to the pro's chat. They'll accept the time or suggest another.|Дархост ба чати усто меравад. Ӯ вақтро қабул мекунад ё дигарашро пешниҳод мекунад.
Выберите день.|Pick a day.|Рӯзро интихоб кунед.
Выберите время.|Pick a time.|Вақтро интихоб кунед.
Это время уже заняли. Выберите другое.|That time is taken. Pick another.|Ин вақт банд шуд. Дигарашро интихоб кунед.
Чтобы отправить запрос на запись, создайте аккаунт: имя и номер телефона.|To send a booking request, create an account: name and phone number.|Барои фиристодани дархости сабт ҳисоб созед: ном ва рақами телефон.
Нельзя записаться к самому себе|You can't book yourself|Ба худ сабт шудан мумкин нест
Запрос на запись:|Booking request:|Дархости сабт:
Запрос отправлен мастеру|Request sent to the pro|Дархост ба усто фиристода шуд
Ждём ответа мастера|Waiting for the pro|Ҷавоби усторо интизорем
Мастер подтвердил время|The pro confirmed the time|Усто вақтро тасдиқ кард
Мастер отклонил это время|The pro declined this time|Усто ин вақтро рад кард
Вы отменили запись|You canceled the booking|Шумо сабтро бекор кардед
Ждёт вашего ответа|Waiting for your reply|Ҷавоби шуморо интизор аст
Вы подтвердили время|You confirmed the time|Шумо вақтро тасдиқ кардед
Вы отклонили это время|You declined this time|Шумо ин вақтро рад кардед
Клиент отменил запись|The client canceled|Мизоҷ сабтро бекор кард
Принять|Accept|Қабул кардан
Отклонить|Decline|Рад кардан
Отменить запись|Cancel booking|Бекор кардани сабт
Подтверждаю запись:|Booking confirmed:|Сабтро тасдиқ мекунам:
До встречи!|See you then!|То дидор!
Не получится|Can't make it|Намешавад
Давайте подберём другое время.|Let's find another time.|Биёед вақти дигар ёбем.
Отменяю запись на|Canceling the booking for|Сабтро бекор мекунам барои
У мастера выходной в этот день.|The pro is off that day.|Усто дар ин рӯз истироҳат дорад.
занято|taken|банд
уже прошло|already passed|гузашт
Район не указан|No district|Ноҳия нишон дода нашудааст
опыт|experience|таҷриба
Телефон|Phone|Телефон
Позвонить|Call|Занг задан
График работы|Working hours|Ҷадвали корӣ
Выходные:|Days off:|Рӯзҳои истироҳат:
Записаться|Book|Сабт шудан
Написать|Message|Навиштан
В избранное|To favorites|Ба интихобшудаҳо
О мастере|About the pro|Дар бораи усто
Фото работ|Work photos|Акси корҳо
Открыть фото|Open photo|Кушодани акс
Фото работы|Work photo|Акси кор
Марки машин|Car makes|Маркаҳои мошин
электро|electric|барқӣ
и гибриды|and hybrids|ва гибридҳо
ДВС|Combustion|Муҳаррики оддӣ
Любые марки|Any make|Ҳар гуна марка
Оцените работу мастера|Rate the pro's work|Кори усторо баҳо диҳед
Ваше имя|Your name|Номи шумо
Как прошла работа|How did the job go|Кор чӣ тавр гузашт
Сроки, качество, чистота, совпала ли цена|Timing, quality, tidiness, did the price match|Мӯҳлат, сифат, тозагӣ, оё нарх мувофиқ омад
Опубликовать отзыв|Post review|Нашри шарҳ
Кратко об отзывах с ИИ|Review summary with AI|Хулосаи шарҳҳо бо ЗС
Отзывы|Reviews|Шарҳҳо
Порядок отзывов|Review order|Тартиби шарҳҳо
Сначала новые|Newest first|Аввал навҳо
Сначала высокие|Highest first|Аввал баландҳо
Сначала низкие|Lowest first|Аввал пастҳо
Профиль не найден|Profile not found|Профил ёфт нашуд
Чтобы написать мастеру, создайте аккаунт: имя и номер телефона.|To message a pro, create an account: name and phone number.|Барои навиштан ба усто ҳисоб созед: ном ва рақами телефон.
Выберите оценку от одной до пяти звёзд.|Pick a rating from one to five stars.|Баҳоро аз як то панҷ ситора интихоб кунед.
Укажите имя, чтобы отзыву доверяли.|Add your name so the review is trusted.|Номатонро нишон диҳед, то ба шарҳ бовар кунанд.
Отзыв опубликован|Review posted|Шарҳ нашр шуд
Что понравилось|What you liked|Чӣ писанд омад
Не получилось изменить профиль в общей базе.|Couldn't update the profile in the shared database.|Профилро дар пойгоҳи умумӣ тағйир додан нашуд.
Не получилось удалить профиль из общей базы.|Couldn't delete the profile from the shared database.|Профилро аз пойгоҳи умумӣ нест кардан нашуд.
Не получилось изменить заказ в общей базе.|Couldn't update the job in the shared database.|Фармоишро дар пойгоҳи умумӣ тағйир додан нашуд.
Найдено|Found|Ёфт шуд
Мастеров не найдено|No pros found|Усто ёфт нашуд
Похоже, вам нужен:|Looks like you need:|Ба назар, ба шумо лозим аст:
По такому запросу никого нет. Уберите часть фильтров или разместите заказ на бирже, и мастера откликнутся сами.|Nobody matches. Remove some filters or post a job on the board, and pros will reply themselves.|Аз рӯи ин дархост касе нест. Қисми филтрҳоро хориҷ кунед ё фармоишро дар биржа ҷойгир кунед, устоҳо худашон ҷавоб медиҳанд.
Все районы|All districts|Ҳамаи ноҳияҳо
Часто ищут:|Popular:|Бисёр меҷӯянд:
Договорная|Negotiable|Бо созиш
Телефон заказчика,|Client's phone,|Телефони фармоишгар,
клиент|client|мизоҷ
Скопировать|Copy|Нусха кардан
Пока без откликов|No replies yet|Ҳоло ҷавоб нест
Ваш заказ|Your job|Фармоиши шумо
Закрыть заказ|Close job|Пӯшидани фармоиш
Вы откликнулись|You replied|Шумо ҷавоб додед
Откликнуться|Reply|Ҷавоб додан
Все|All|Ҳама
Открытых заказов пока нет. Разместите первый, и мастера предложат цену.|No open jobs yet. Post the first one and pros will quote.|Ҳоло фармоиши кушода нест. Аввалинро ҷойгир кунед, устоҳо нарх пешниҳод мекунанд.
Новый заказ|New job|Фармоиши нав
ИИ заполнил заказ по вашему описанию. Проверьте и поправьте, если нужно.|AI filled in the job from your description. Check and edit if needed.|ЗС фармоишро аз рӯи шарҳи шумо пур кард. Санҷед ва агар лозим бошад, ислоҳ кунед.
Мастера увидят задачу и предложат цену. Телефон откроется только тем, кто откликнется.|Pros will see the job and quote. Your phone is shown only to those who reply.|Устоҳо корро мебинанд ва нарх пешниҳод мекунанд. Телефон танҳо ба онҳое кушода мешавад, ки ҷавоб медиҳанд.
Кто нужен|Who you need|Кӣ лозим
Коротко о задаче *|Job in brief *|Мухтасар дар бораи кор *
Например: положить плитку в ванной, 6 м²|E.g.: tile a bathroom, 6 m²|Масалан: дар ҳаммом сафол гузоштан, 6 м²
Подробности|Details|Тафсилот
Что уже есть, какие материалы, когда удобно|What's there already, which materials, when suits you|Чӣ аллакай ҳаст, кадом масолеҳ, кай қулай аст
Когда|When|Кай
Бюджет, необязательно|Budget, optional|Буҷа, ҳатмӣ нест
Ваше имя *|Your name *|Номи шумо *
Опубликовать заказ|Post job|Нашри фармоиш
Опишите задачу хотя бы в нескольких словах.|Describe the job in at least a few words.|Корро ақаллан бо якчанд калима шарҳ диҳед.
Укажите имя.|Enter your name.|Номро нишон диҳед.
Проверьте телефон: в нём должно быть не меньше 9 цифр.|Check the phone: it needs at least 9 digits.|Телефонро санҷед: дар он бояд на камтар аз 9 рақам бошад.
Заказ опубликован для всех посетителей|Job posted for all visitors|Фармоиш барои ҳамаи меҳмонон нашр шуд
Заказ опубликован|Job posted|Фармоиш нашр шуд
Отклик на заказ|Reply to job|Ҷавоб ба фармоиш
бюджет до|budget up to|буҷа то
Имя мастера *|Pro's name *|Номи усто *
Ваша цена *|Your price *|Нархи шумо *
Сообщение заказчику|Message to the client|Паём ба фармоишгар
Когда можете приехать, что входит в цену|When you can come, what the price includes|Кай омада метавонед, ба нарх чӣ дохил аст
Отправить отклик|Send reply|Фиристодани ҷавоб
Укажите цену за работу.|Enter your price for the job.|Нархи корро нишон диҳед.
Отклик добавлен. Телефон заказчика открыт|Reply added. Client's phone unlocked|Ҷавоб илова шуд. Телефони фармоишгар кушода шуд
Заказ закрыт|Job closed|Фармоиш пӯшида шуд
пол|floor|фарш
стены|walls|деворҳо
только пол|floor only|танҳо фарш
только стены, без дверей и окон|walls only, minus doors and windows|танҳо деворҳо, бе дару тиреза
По средней цене|At the average price of|Бо нархи миёнаи
у кафельщиков в каталоге. Разброс от|among tilers in the catalog. Range from|дар байни сафолчиҳои феҳрист. Фарқият аз
В каталоге пока нет кафельщиков с ценой за м².|No tilers with a per-m² price in the catalog yet.|Дар феҳрист ҳоло сафолчӣ бо нархи барои м² нест.
у маляров в каталоге. Разброс от|among painters in the catalog. Range from|дар байни рангмолҳои феҳрист. Фарқият аз
В каталоге пока нет маляров с ценой за м².|No painters with a per-m² price in the catalog yet.|Дар феҳрист ҳоло рангмол бо нархи барои м² нест.
Точка по|Point at|Нуқта ба
(средняя у электриков в каталоге)|(average among electricians in the catalog)|(миёна дар байни барқчиҳои феҳрист)
светильник|fixture|чароғ
кабель|cable|кабел
за м|per m|барои м
с учётом штробления|including chasing|бо назардошти шароф
щиток|panel|щиток
Разброс|Range|Фарқият
и потолок|and ceiling|ва шифт
и стены|and walls|ва деворҳо
Специальность|Trade|Касб
Название услуги|Service name|Номи хизмат
Цена услуги|Service price|Нархи хизмат
Удалить услугу|Remove service|Хориҷ кардани хизмат
Типовые услуги:|Typical services:|Хизматҳои маъмул:
Удалить фото|Delete photo|Хориҷ кардани акс
Укажите имя и фамилию.|Enter your full name.|Ном ва насабро нишон диҳед.
Укажите телефон: в нём должно быть не меньше 9 цифр.|Enter your phone: at least 9 digits.|Телефонро нишон диҳед: на камтар аз 9 рақам.
Выберите специальность.|Pick a trade.|Касбро интихоб кунед.
Укажите цену «от», чтобы клиенты понимали порядок цен.|Add a starting price so clients know the price range.|Нархи «аз»-ро нишон диҳед, то мизоҷон сатҳи нархро фаҳманд.
Отметьте хотя бы один рабочий день.|Pick at least one working day.|Ақаллан як рӯзи кориро қайд кунед.
Конец работы должен быть позже начала.|End time must be after start time.|Анҷоми кор бояд баъд аз оғоз бошад.
Конец перерыва должен быть позже начала.|Break end must be after its start.|Анҷоми танаффус бояд баъд аз оғоз бошад.
Перерыв должен быть внутри рабочего времени.|The break must be within working hours.|Танаффус бояд дар дохили вақти корӣ бошад.
Подтвердите, что телефон можно показывать клиентам.|Confirm your phone can be shown to clients.|Тасдиқ кунед, ки телефонро ба мизоҷон нишон додан мумкин.
Редактирование профиля:|Editing profile:|Таҳрири профил:
Сохранить изменения|Save changes|Нигоҳ доштани тағйирот
Не получилось открыть фото. Подойдут JPG, PNG или WebP.|Couldn't open the photo. Use JPG, PNG or WebP.|Аксро кушодан нашуд. JPG, PNG ё WebP мувофиқанд.
Можно добавить до трёх фото работ|You can add up to three work photos|То се акси кор илова кардан мумкин
Не получилось открыть одно из фото. Подойдут JPG, PNG или WebP.|Couldn't open one of the photos. Use JPG, PNG or WebP.|Яке аз аксҳоро кушодан нашуд. JPG, PNG ё WebP мувофиқанд.
Сохраняем…|Saving…|Нигоҳ медорем…
Профиль опубликован. Аккаунт создан на имя|Profile published. Account created for|Профил нашр шуд. Ҳисоб ба номи
Изменения сохранены|Changes saved|Тағйирот нигоҳ дошта шуд
Профиль опубликован для всех посетителей|Profile published for all visitors|Профил барои ҳамаи меҳмонон нашр шуд
Профиль опубликован|Profile published|Профил нашр шуд
Редактирование отменено|Editing canceled|Таҳрир бекор шуд
Создайте аккаунт: укажите имя и номер телефона. Потом загрузите фото и добавьте описание.|Create an account: enter your name and phone number. Then upload a photo and add a description.|Ҳисоб созед: ном ва рақами телефонро нишон диҳед. Баъд акс бор кунед ва тавсиф илова кунед.
Создать аккаунт|Create account|Сохтани ҳисоб
Ваше фото|Your photo|Акси шумо
Загрузить фото профиля|Upload profile photo|Бор кардани акси профил
Загрузить фото|Upload photo|Бор кардани акс
оценки появятся, когда вы станете мастером|ratings will appear once you become a pro|баҳоҳо вақте пайдо мешаванд, ки шумо усто шавед
Телефон не указан|No phone|Телефон нишон дода нашудааст
Нажмите на круг или перетащите фото|Tap the circle or drag a photo|Ба давра пахш кунед ё аксро кашед
Ваше имя|Your name|Номи шумо
Имя *|Name *|Ном *
Пара слов о себе: чем занимаетесь, какой ремонт планируете|A few words about you: what you do, what repairs you're planning|Чанд сухан дар бораи худ: бо чӣ машғулед, чӣ таъмир дар нақша доред
Сохранить профиль|Save profile|Нигоҳ доштани профил
Стать мастером|Become a pro|Усто шудан
Аккаунт создан|Account created|Ҳисоб сохта шуд
Клиент|Client|Мизоҷ
Имя, фото и телефон подставляются в заявки, заказы и чат.|Your name, photo and phone fill in requests, jobs and chat.|Ном, акс ва телефон ба дархостҳо, фармоишҳо ва чат худкор гузошта мешаванд.
Фото профиля обновлено|Profile photo updated|Акси профил нав шуд
Профиль сохранён|Profile saved|Профил нигоҳ дошта шуд
Мой профиль:|My profile:|Профили ман:
С возвращением,|Welcome back,|Хуш омадед,
Создайте аккаунт|Create an account|Ҳисоб созед
Аккаунт привязан к вашему имени и номеру телефона.|Your account is tied to your name and phone number.|Ҳисоб ба ном ва рақами телефони шумо вобаста аст.
Переписка с мастерами в чате|Chat with pros|Гуфтугӯ бо устоҳо дар чат
Заявки и заказы без повторного ввода данных|Requests and jobs without retyping your details|Дархостҳо ва фармоишҳо бе такрори маълумот
Отзывы и оценки от вашего имени|Reviews and ratings in your name|Шарҳҳо ва баҳоҳо аз номи шумо
Кто вы? *|Who are you? *|Шумо кистед? *
Ищу мастера|Looking for a pro|Усто меҷӯям
Найти мастера, записаться, разместить заказ|Find a pro, book, post a job|Усто ёфтан, сабт шудан, фармоиш ҷойгир кардан
Получать заказы и отзывы от клиентов|Get jobs and reviews from clients|Гирифтани фармоиш ва шарҳ аз мизоҷон
Номер телефона *|Phone number *|Рақами телефон *
Согласен, что имя и номер увидят мастера и клиенты, с которыми я общаюсь|I agree that pros and clients I talk to will see my name and number|Розӣ ҳастам, ки ном ва рақамро устоҳо ва мизоҷоне, ки бо онҳо гуфтугӯ мекунам, мебинанд
Создать аккаунт и заполнить анкету|Create account and fill in the profile|Ҳисоб сохтан ва анкетаро пур кардан
Выберите, кто вы: ищете мастера или вы мастер.|Choose who you are: looking for a pro, or a pro yourself.|Интихоб кунед, ки шумо кистед: усто меҷӯед ё худ усто ҳастед.
Укажите имя, по нему вас узнают мастера и клиенты.|Enter your name so pros and clients recognize you.|Номро нишон диҳед, то устоҳо ва мизоҷон шуморо шиносанд.
Проверьте номер: в нём должно быть не меньше 9 цифр.|Check the number: it needs at least 9 digits.|Рақамро санҷед: дар он бояд на камтар аз 9 рақам бошад.
Подтвердите, что номер можно показывать собеседникам.|Confirm your number can be shown to people you talk to.|Тасдиқ кунед, ки рақамро ба ҳамсуҳбатон нишон додан мумкин.
Аккаунт создан. Здравствуйте,|Account created. Hello,|Ҳисоб сохта шуд. Салом,
Осталось выбрать специальность и указать цены|Now pick your trade and set prices|Акнун касбро интихоб кунед ва нархҳоро нишон диҳед
Вы вышли из аккаунта|You signed out|Шумо аз ҳисоб баромадед
Мой профиль|My profile|Профили ман
Мои записи|My bookings|Сабтҳои ман
Мои заказы|My jobs|Фармоишҳои ман
Избранное|Favorites|Интихобшудаҳо
Настройки|Settings|Танзимот
Разделы кабинета|Account sections|Бахшҳои кабинет
Нажмите на сердечко на карточке мастера, и он появится здесь.|Tap the heart on a pro's card and they'll show up here.|Ба дилчаи корти усто пахш кунед, ӯ дар ин ҷо пайдо мешавад.
Открыть каталог|Open catalog|Кушодани феҳрист
Открыть|Open|Кушодан
Изменить|Edit|Тағйир додан
Удалить профиль|Delete profile|Нест кардани профил
У вас пока нет профиля мастера. Он появится здесь сразу после регистрации.|You don't have a pro profile yet. It'll appear here right after you sign up.|Шумо ҳоло профили усто надоред. Он фавран баъди сабтном дар ин ҷо пайдо мешавад.
Создать профиль|Create profile|Сохтани профил
Запросы на запись от клиентов|Booking requests from clients|Дархостҳои сабт аз мизоҷон
Заявки к вашим профилям|Requests to your profiles|Дархостҳо ба профилҳои шумо
Записей пока нет. Откройте профиль мастера и нажмите «Записаться на время».|No bookings yet. Open a pro's profile and tap "Book".|Ҳоло сабт нест. Профили усторо кушоед ва «Сабт шудан»-ро пахш кунед.
Закрыт|Closed|Пӯшида
Открыт|Open|Кушода
Открыть снова|Reopen|Боз кушодан
Вы ещё не размещали заказы. Опишите задачу, и мастера предложат цену.|You haven't posted any jobs yet. Describe a job and pros will quote.|Шумо ҳоло фармоиш ҷойгир накардаед. Корро шарҳ диҳед, устоҳо нарх пешниҳод мекунанд.
Телефон:|Phone:|Телефон:
Открыть чат|Open chat|Кушодани чат
Ожидает подтверждения|Awaiting confirmation|Интизори тасдиқ
Профиль мастера|Pro profile|Профили усто
Отменить заявку|Cancel request|Бекор кардани дархост
Удалить навсегда|Delete forever|Абадан нест кардан
Оставить|Keep|Монондан
Профиль удалён|Profile deleted|Профил нест карда шуд
Заявка отменена|Request canceled|Дархост бекор шуд
Общая база подключена: ваши профили и заказы видят другие посетители.|Shared database connected: other visitors see your profiles and jobs.|Пойгоҳи умумӣ пайваст аст: профилҳо ва фармоишҳои шуморо меҳмонони дигар мебинанд.
Записи сохраняются в этом браузере.|Entries are saved in this browser.|Сабтҳо дар ҳамин браузер нигоҳ дошта мешаванд.
Вид|Appearance|Намуди зоҳирӣ
Тема|Theme|Мавзӯъ
Светлая, тёмная или как в системе|Light, dark or match your system|Равшан, торик ё мисли система
Цветовые темы|Color themes|Мавзӯъҳои рангӣ
Авто|Auto|Худкор
Светлая|Light|Равшан
Тёмная|Dark|Торик
Чёрная|Black|Сиёҳ
Океан|Ocean|Уқёнус
Закат|Sunset|Ғуруб
Лаванда|Lavender|Лаванда
Анимации|Animations|Аниматсия
Спокойный режим убирает движение и ускоряет переходы|Calm mode removes motion and speeds up transitions|Ҳолати ором ҳаракатро хориҷ мекунад ва гузаришҳоро тез мекунад
Полные|Full|Пурра
Спокойные|Calm|Ором
Язык|Language|Забон
Язык интерфейса. Имена, отзывы и описания мастеров остаются на языке автора|Interface language. Names, reviews and pro descriptions stay in the author's language|Забони интерфейс. Номҳо, шарҳҳо ва тавсифи устоҳо бо забони муаллиф мемонанд
Мастера-примеры|Example pros|Устоҳои намунавӣ
Показывать вымышленных мастеров и заказы, чтобы познакомиться с сервисом|Show made-up pros and jobs to explore the service|Нишон додани устоҳо ва фармоишҳои сохтагӣ барои шинос шудан бо хизмат
Подключён|Connected|Пайваст аст
через Claude|via Claude|тавассути Claude
через ваш сервер|via your server|тавассути сервери шумо
Подбирает мастера по описанию или фото, переводит чат|Finds a pro from a description or photo, translates chat|Аз рӯи тавсиф ё акс усто меёбад, чатро тарҷума мекунад
Не подключён. На claude.ai заработает после вашего разрешения|Not connected. On claude.ai it works once you allow it|Пайваст нест. Дар claude.ai баъди иҷозати шумо кор мекунад
Данные и аккаунт|Data and account|Маълумот ва ҳисоб
Где хранятся данные|Where data is stored|Маълумот дар куҷо нигоҳ дошта мешавад
Очистить|Clear|Тоза кардан
Аккаунт|Account|Ҳисоб
Выйти|Sign out|Баромадан
Примеры показаны|Examples shown|Намунаҳо нишон дода шуданд
Примеры скрыты|Examples hidden|Намунаҳо пинҳон шуданд
Отмена|Cancel|Бекор
Удалить всё|Delete all|Ҳамаро нест кардан
Да, выйти|Yes, sign out|Ҳа, баромадан
Язык и тема|Language and theme|Забон ва мавзӯъ
Каталог|Catalog|Феҳрист
ИИ пока не подключён. На claude.ai он работает сразу, а на своём сайте заработает, когда вы подключите ключ.|AI isn't connected yet. On claude.ai it works right away; on your own site it works once you connect a key.|ЗС ҳоло пайваст нест. Дар claude.ai фавран кор мекунад, дар сайти худ баъди пайваст кардани калид кор мекунад.
Вы не разрешили этой странице использовать ИИ. Разрешение можно дать после перезагрузки страницы.|You didn't allow this page to use AI. You can allow it after reloading the page.|Шумо ба ин саҳифа истифодаи ЗС-ро иҷозат надодед. Баъди аз нав боркунии саҳифа иҷозат додан мумкин.
Слишком много запросов к ИИ. Подождите минуту и попробуйте снова.|Too many AI requests. Wait a minute and try again.|Дархостҳо ба ЗС хеле зиёданд. Як дақиқа интизор шавед ва боз кӯшиш кунед.
ИИ не стал отвечать на этот запрос. Опишите задачу по-другому.|AI declined this request. Describe the job differently.|ЗС ба ин дархост ҷавоб надод. Корро бо тарзи дигар шарҳ диҳед.
Фото сейчас нельзя отправить ИИ. Опишите проблему текстом.|Photos can't be sent to AI right now. Describe the problem in text.|Ҳоло аксро ба ЗС фиристодан мумкин нест. Мушкилро бо матн шарҳ диҳед.
Это фото не подошло. Попробуйте другое.|That photo didn't work. Try another.|Ин акс мувофиқ наомад. Дигарашро кӯшиш кунед.
ИИ ответил непонятно. Попробуйте ещё раз.|AI's answer was unclear. Try again.|ЗС норавшан ҷавоб дод. Боз кӯшиш кунед.
ИИ ничего не ответил. Попробуйте ещё раз.|AI didn't answer. Try again.|ЗС ҷавоб надод. Боз кӯшиш кунед.
Сессия истекла. Обновите страницу.|Session expired. Reload the page.|Сессия ба охир расид. Саҳифаро нав кунед.
ИИ отключён в настройках вашей организации.|AI is disabled in your organization's settings.|ЗС дар танзимоти ташкилоти шумо хомӯш аст.
Слишком длинный текст. Сократите описание.|The text is too long. Shorten the description.|Матн хеле дароз аст. Тавсифро кӯтоҳ кунед.
Не удалось связаться с ИИ. Проверьте интернет и попробуйте снова.|Couldn't reach AI. Check your internet and try again.|Бо ЗС пайваст шудан нашуд. Интернетро санҷед ва боз кӯшиш кунед.
Не получилось получить ответ ИИ. Попробуйте позже.|Couldn't get an AI answer. Try later.|Ҷавоби ЗС гирифта нашуд. Баъдтар кӯшиш кунед.
Опишите своими словами, что случилось, или сфотографируйте поломку. ИИ подскажет, какой мастер нужен, и заполнит заказ.|Describe what happened in your own words, or take a photo of the problem. AI will tell you which pro you need and fill in the job.|Бо суханони худ нависед, ки чӣ шуд, ё аз вайронӣ акс гиред. ЗС мегӯяд, ки кадом усто лозим аст ва фармоишро пур мекунад.
Что случилось?|What happened?|Чӣ шуд?
Например: из-под раковины капает и пахнет сыростью. Или: BYD Song не заряжается, на экране ошибка|E.g.: the sink is dripping and smells damp. Or: BYD Song won't charge, error on screen|Масалан: аз зери раковина мечакад ва бӯи намӣ меояд. Ё: BYD Song пур намешавад, дар экран хато
Фото, до трёх|Photos, up to three|Аксҳо, то се
Сфотографируйте поломку или выберите фото|Take a photo of the problem or choose one|Аз вайронӣ акс гиред ё аксро интихоб кунед
Подобрать мастера|Find the right pro|Интихоби усто
Остановить|Stop|Қатъ кардан
Опишите проблему или добавьте фото.|Describe the problem or add a photo.|Мушкилро шарҳ диҳед ё акс илова кунед.
ИИ разбирается в проблеме|AI is looking into it|ЗС мушкилро таҳлил мекунад
Вам нужен|You need|Ба шумо лозим аст
мастеров пока нет, разместите заказ|no pros yet, post a job|ҳоло усто нест, фармоиш ҷойгир кунед
срочность:|urgency:|фавриятнокӣ:
Не удалось точно определить мастера|Couldn't pin down the right pro|Устои мувофиқро дақиқ муайян кардан нашуд
Что, скорее всего, случилось|What most likely happened|Эҳтимолан чӣ шуд
Сделайте сейчас:|Do this now:|Ҳоло кунед:
Мастер, скорее всего, спросит|The pro will likely ask|Усто эҳтимолан мепурсад
Показать мастеров|Show pros|Нишон додани устоҳо
Разместить заказ, он уже заполнен|Post the job, it's already filled in|Фармоишро ҷойгир кунед, он аллакай пур шудааст
Это подсказка ИИ, она может ошибаться. Окончательно причину определит мастер.|This is an AI hint and may be wrong. The pro will determine the actual cause.|Ин маслиҳати ЗС аст ва метавонад хато бошад. Сабаби аслиро усто муайян мекунад.
Искать обычным поиском|Use regular search|Бо ҷустуҷӯи оддӣ ҷустан
Перевожу…|Translating…|Тарҷума мекунам…
Перевод|Translation|Тарҷума
Перевести|Translate|Тарҷума кардан
Сначала выберите специальность, тогда ИИ напишет точнее.|Pick a trade first so AI writes more accurately.|Аввал касбро интихоб кунед, он гоҳ ЗС дақиқтар менависад.
ИИ пишет…|AI is writing…|ЗС менависад…
Текст готов, услуги добавлены на шаге 2. Проверьте и поправьте|Text ready, services added in step 2. Check and edit|Матн тайёр аст, хизматҳо дар қадами 2 илова шуданд. Санҷед ва ислоҳ кунед
Текст готов. Проверьте и поправьте|Text ready. Check and edit|Матн тайёр аст. Санҷед ва ислоҳ кунед
ИИ читает отзывы|AI is reading reviews|ЗС шарҳҳоро мехонад
Итог по отзывам|Review summary|Хулосаи шарҳҳо
Сводку составил ИИ по отзывам на этой странице.|AI wrote this summary from the reviews on this page.|Хулосаро ЗС аз рӯи шарҳҳои ҳамин саҳифа тартиб дод.
Здравствуйте! Да, могу помочь. Когда вам удобно?|Hello! Yes, I can help. When suits you?|Ассалому алайкум! Ҳа, кӯмак карда метавонам. Кай барои шумо қулай аст?
Понял. Пришлите, пожалуйста, фото, чтобы я точнее назвал цену.|Got it. Please send a photo so I can quote more accurately.|Фаҳмидам. Лутфан акс фиристед, то нархро дақиқтар гӯям.
Могу подъехать завтра с утра. Напишите адрес.|I can come tomorrow morning. Send the address.|Фардо субҳ омада метавонам. Суроғаро нависед.
Договорились. Если что, звоните по номеру из профиля.|Deal. If anything, call the number in my profile.|Созиш кардем. Агар чизе бошад, ба рақами профил занг занед.
Вы:|You:|Шумо:
Новый диалог|New chat|Гуфтугӯи нав
новых|new|нав
Диалогов пока нет. Откройте профиль мастера и нажмите «Написать».|No chats yet. Open a pro's profile and tap "Message".|Ҳоло гуфтугӯ нест. Профили усторо кушоед ва «Навиштан»-ро пахш кунед.
Выберите диалог, чтобы читать и отвечать.|Pick a chat to read and reply.|Барои хондан ва ҷавоб додан гуфтугӯро интихоб кунед.
К списку диалогов|Back to chats|Ба рӯйхати гуфтугӯҳо
Записаться на время|Book a time|Ба вақт сабт шудан
Сообщение|Message|Паём
Отправить|Send|Фиристодан
Опишите задачу: что нужно сделать, район и когда удобно. Мастер ответит здесь.|Describe the job: what's needed, district and when suits you. The pro will reply here.|Корро шарҳ диҳед: чӣ кор лозим, ноҳия ва кай қулай аст. Усто дар ин ҷо ҷавоб медиҳад.
Сообщений пока нет.|No messages yet.|Ҳоло паём нест.
печатает…|typing…|менависад…
подтвердил запись|confirmed the booking|сабтро тасдиқ кард
ответил в чате|replied in chat|дар чат ҷавоб дод
Это ваш профиль. Сообщения клиентов появятся в чате|This is your profile. Client messages will appear in chat|Ин профили шумост. Паёмҳои мизоҷон дар чат пайдо мешаванд
Переписка с мастерами и клиентами.|Chats with pros and clients.|Гуфтугӯ бо устоҳо ва мизоҷон.
Все виды работ|All types of work|Ҳамаи намудҳои кор
Мастеров пока нет|No pros yet|Ҳоло усто нест
Я мастер, зарегистрироваться|I'm a pro, sign up|Ман усто ҳастам, сабт шудан
Поиск мастера|Find a pro|Ҷустуҷӯи усто
Напишите, кто нужен или что случилось. Например: «машина BYD», «сломалась стиральная машина», «поставить окна ПВХ». Подсказки появятся сразу.|Write who you need or what happened. E.g.: "BYD car", "washing machine broke", "install PVC windows". Suggestions appear right away.|Нависед, ки кӣ лозим ё чӣ шуд. Масалан: «мошини BYD», «мошини ҷомашӯӣ вайрон шуд», «насби тирезаҳои ПВХ». Пешниҳодҳо фавран пайдо мешаванд.
Кто нужен или что сделать?|Who do you need or what to do?|Кӣ лозим ё чӣ кор кардан?
Кто нужен или что сделать|Who do you need or what to do|Кӣ лозим ё чӣ кор кардан
Очистить|Clear|Тоза кардан
Не знаете, какой мастер нужен?|Not sure which pro you need?|Намедонед, кадом усто лозим?
Опишите проблему своими словами или пришлите фото, ИИ подскажет|Describe the problem in your words or send a photo, AI will help|Мушкилро бо суханони худ шарҳ диҳед ё акс фиристед, ЗС кӯмак мекунад
мастеров пока нет|no pros yet|ҳоло усто нест
Подходящие мастера|Matching pros|Устоҳои мувофиқ
И ещё|And|Ва боз
Показать всех в каталоге|Show all in the catalog|Ҳамаро дар феҳрист нишон додан
Не поняли запрос. Спросите ИИ-помощника, напишите по-другому или выберите вид работ из списка ниже.|We didn't understand. Ask the AI assistant, rephrase, or pick a type of work below.|Дархостро нафаҳмидем. Аз ёрдамчии ЗС пурсед, бо тарзи дигар нависед ё намуди корро аз рӯйхати поён интихоб кунед.
Спросить ИИ|Ask AI|Аз ЗС пурсидан
Продолжить показ|Resume|Идомаи намоиш
Браузер не разрешил полноэкранный режим|The browser didn't allow full screen|Браузер ҳолати пурраи экранро иҷозат надод
Выйти из полноэкранного режима|Exit full screen|Баромадан аз экрани пурра
Проверен|Verified|Санҷида шуд
о мастере|about the pro|дар бораи усто
Бюджет до|Budget up to|Буҷа то
Демо-режим: ваши записи сохраняются в этом браузере|Demo mode: your entries are saved in this browser|Ҳолати намоишӣ: сабтҳои шумо дар ҳамин браузер нигоҳ дошта мешаванд
Общая база подключена: новые записи видят другие посетители|Shared database connected: other visitors see new entries|Пойгоҳи умумӣ пайваст аст: сабтҳои навро меҳмонони дигар мебинанд
Общая база открыта для чтения, ваши записи сохраняются в этом браузере|Shared database is read-only, your entries are saved in this browser|Пойгоҳи умумӣ танҳо барои хондан кушода аст, сабтҳои шумо дар ҳамин браузер нигоҳ дошта мешаванд
Отзывы после работы|Reviews after the job|Шарҳҳо баъди кор
Цены заранее|Prices up front|Нархҳо пешакӣ
Проверенные документы|Verified documents|Ҳуҷҷатҳои санҷидашуда
Заявка за минуту|Request in a minute|Дархост дар як дақиқа
Чтобы переписываться с мастерами, создайте аккаунт: имя и номер телефона.|To chat with pros, create an account: name and phone number.|Барои гуфтугӯ бо устоҳо ҳисоб созед: ном ва рақами телефон.
Закрыть|Close|Пӯшидан
Подсказки|Suggestions|Пешниҳодҳо
Свободен сегодня|Free today|Имрӯз озод
Отметка «Свободен сегодня», когда есть время|The "Free today" badge when you have time|Аломати «Имрӯз озод», вақте ки вақт доред
Документы проверены|Documents verified|Ҳуҷҷатҳо санҷида шуданд
Цифры по каталогу, включая примеры|Catalog figures, including examples|Рақамҳои феҳрист, бо намунаҳо
Запросы на запись от клиентов|Booking requests from clients|Дархостҳои сабт аз мизоҷон
Слайд|Slide|Слайд
из|of|аз
Оценка|Rating|Баҳо
Ваш заказ|Your job|Фармоиши шумо
Фото профиля|Profile photo|Акси профил
Удалить фото|Delete photo|Хориҷ кардани акс
Фото|Photo|Акс
Подсказки|Suggestions|Пешниҳодҳо
Мастера-примеры|Example pros|Устоҳои намунавӣ
Кабинет|Account|Кабинет
в|at|соати
Мастеров пока нет. Разместите заказ: мастера увидят его на бирже и предложат цену.|No pros here yet. Post a job: pros will see it on the board and quote.|Ҳоло усто нест. Фармоиш ҷойгир кунед: устоҳо онро дар биржа мебинанд ва нарх пешниҳод мекунанд.
Мастеров пока нет. Разместите заказ, и мастера откликнутся сами.|No pros here yet. Post a job and pros will reply themselves.|Ҳоло усто нест. Фармоиш ҷойгир кунед, устоҳо худашон ҷавоб медиҳанд.
Вход по номеру телефона|Sign in with your phone number|Воридшавӣ бо рақами телефон
Вход|Sign in|Воридшавӣ
Пришлём код в СМС. Пароль не нужен.|We'll text you a code. No password needed.|Рамзро бо SMS мефиристем. Парол лозим нест.
Записи и заказы в одном месте|Bookings and jobs in one place|Навбатҳо ва фармоишҳо дар як ҷо
Номер подтверждён, поэтому вам доверяют|Your number is verified, so people trust you|Рақам тасдиқ шудааст, бинобар ин ба шумо бовар мекунанд
Получить код|Get code|Гирифтани рамз
Отправляем…|Sending…|Фиристода истодаем…
Код из СМС *|SMS code *|Рамз аз SMS *
Никому не сообщайте этот код. Сотрудники сервиса его никогда не спрашивают.|Never share this code. Our staff will never ask for it.|Ин рамзро ба касе нагӯед. Кормандони хизматрасонӣ ҳеҷ гоҳ онро намепурсанд.
Изменить номер|Change number|Тағйир додани рақам
Принимаю|I accept|Қабул мекунам
политику конфиденциальности|the privacy policy|сиёсати махфиятро
. Имя и номер увидят мастера и клиенты, с которыми я общаюсь|. Pros and clients I talk to will see my name and number|. Ному рақами маро устоҳо ва мизоҷоне, ки бо онҳо сӯҳбат мекунам, мебинанд
Политика конфиденциальности|Privacy policy|Сиёсати махфият
Введите шесть цифр из СМС.|Enter the six digits from the SMS.|Шаш рақамро аз SMS ворид кунед.
Подтвердите согласие с политикой конфиденциальности.|Please accept the privacy policy.|Розигӣ бо сиёсати махфиятро тасдиқ кунед.
Неверный код. Проверьте СМС и введите ещё раз.|Wrong code. Check the SMS and try again.|Рамз нодуруст аст. SMS-ро санҷед ва боз ворид кунед.
Код устарел. Запросите новый.|The code has expired. Request a new one.|Мӯҳлати рамз гузашт. Рамзи нав дархост кунед.
Слишком много попыток. Попробуйте позже.|Too many attempts. Try again later.|Кӯшишҳо аз ҳад зиёд. Баъдтар кӯшиш кунед.
Не получилось отправить СМС. Попробуйте позже.|Couldn't send the SMS. Try again later.|SMS фиристода нашуд. Баъдтар кӯшиш кунед.
Пожаловаться|Report|Шикоят кардан
Пожаловаться на мастера|Report this pro|Шикоят аз усто
Жалобу проверит модератор. Собеседник не узнает, кто её отправил.|A moderator will review it. The other person won't know who sent it.|Шикоятро модератор месанҷад. Ҳамсуҳбат намедонад, ки онро кӣ фиристод.
Причина *|Reason *|Сабаб *
Что случилось|What happened|Чӣ шуд
Коротко опишите ситуацию|Briefly describe what happened|Вазъиятро мухтасар нависед
Скрыть этот диалог у меня|Hide this chat for me|Ин гуфтугӯро аз ман пинҳон кунед
Отправить жалобу|Send report|Фиристодани шикоят
Просит предоплату или данные карты|Asks for prepayment or card details|Пешпардохт ё маълумоти корт мепурсад
Обман или некачественная работа|Fraud or poor work|Фиреб ё кори бесифат
Грубость или угрозы|Rudeness or threats|Дағалӣ ё таҳдид
Спам или реклама|Spam or ads|Спам ё реклама
Фальшивый профиль|Fake profile|Профили қалбакӣ
Спасибо! Жалоба отправлена модератору|Thank you! Your report was sent to a moderator|Ташаккур! Шикоят ба модератор фиристода шуд
Не переводите предоплату на карту и никому не называйте коды из СМС. Платите после работы.|Don't send prepayments to cards and never share SMS codes. Pay after the work is done.|Пешпардохтро ба корт нафиристед ва рамзҳои SMS-ро ба касе нагӯед. Пас аз анҷоми кор пардохт кунед.
Осторожно: похоже на просьбу о деньгах или данных карты. Не платите заранее.|Careful: this looks like a request for money or card details. Don't pay in advance.|Эҳтиёт: ба дархости пул ё маълумоти корт монанд аст. Пешакӣ пардохт накунед.
Показать номер|Show number|Нишон додани рақам
Номер видят только те, кто вошёл по СМС|Only people signed in by SMS can see the number|Рақамро танҳо онҳое мебинанд, ки бо SMS ворид шудаанд
Загружаем номер…|Loading the number…|Рақам бор шуда истодааст…
Мастер не указал номер. Напишите ему в чат|The pro hasn't added a number. Message them in chat|Усто рақам нагузоштааст. Ба ӯ дар чат нависед
Сервер подключён, данные защищены|Server connected, your data is protected|Сервер пайваст аст, маълумот ҳифз шудааст
Войдите по номеру телефона|Sign in with your phone number|Бо рақами телефон ворид шавед
Как не попасть на мошенников?|How do I avoid scammers?|Чӣ тавр ба доми фиребгарон наафтем?
Не переводите предоплату на карту незнакомым людям и никому не называйте коды из СМС: сотрудники сервиса их никогда не спрашивают. Платите после того, как работа сделана. Выбирайте мастеров с отметкой «Документы проверены» и отзывами. Если вас просят о предоплате или ведут себя подозрительно, нажмите «Пожаловаться» в профиле или в чате.|Don't send prepayments to strangers' cards and never share SMS codes: our staff never ask for them. Pay once the work is done. Choose pros marked "Documents verified" and with reviews. If someone asks for prepayment or acts suspiciously, tap "Report" in their profile or in the chat.|Ба корти одамони ношинос пешпардохт нафиристед ва рамзҳои SMS-ро ба касе нагӯед: кормандони хизматрасонӣ ҳеҷ гоҳ онҳоро намепурсанд. Пас аз анҷоми кор пардохт кунед. Устоҳоеро интихоб кунед, ки нишони «Ҳуҷҷатҳо санҷида шуданд» ва баҳо доранд. Агар пешпардохт талаб кунанд ё рафтори шубҳанок бошад, дар профил ё чат «Шикоят кардан»-ро пахш кунед.
Отзыв может оставить только клиент, у которого мастер подтвердил запись через сайт. Одна запись — один отзыв, поэтому накрутить рейтинг нельзя.|Only a client whose booking the pro confirmed on the site can leave a review. One booking, one review, so ratings can't be faked.|Баҳоро танҳо мизоҷе гузошта метавонад, ки навбаташро усто дар сайт тасдиқ кардааст. Як навбат — як баҳо, бинобар ин рейтингро сохтакорӣ кардан мумкин нест.
Отзыв можно оставить после того, как мастер подтвердит вашу запись. Так все отзывы на сайте настоящие.|You can leave a review once the pro confirms your booking. That keeps every review on the site genuine.|Баҳоро пас аз тасдиқи навбататон аз ҷониби усто гузоштан мумкин аст. Ҳамин тавр ҳамаи баҳоҳо дар сайт воқеӣ мемонанд.
Чтобы увидеть номер мастера, войдите по номеру телефона. Так мы защищаем мастеров от спама.|To see the pro's number, sign in with your phone. This protects pros from spam.|Барои дидани рақами усто бо рақами телефон ворид шавед. Ҳамин тавр мо устоҳоро аз спам ҳифз мекунем.
Чтобы разместить заказ, войдите по номеру телефона.|To post a job, sign in with your phone number.|Барои ҷойгир кардани фармоиш бо рақами телефон ворид шавед.
Чтобы откликнуться на заказ, войдите по номеру телефона.|To reply to a job, sign in with your phone number.|Барои ҷавоб додан ба фармоиш бо рақами телефон ворид шавед.
Чтобы опубликовать анкету, войдите по номеру телефона.|To publish your profile, sign in with your phone number.|Барои нашри анкета бо рақами телефон ворид шавед.
Чтобы отправить жалобу, войдите по номеру телефона.|To send a report, sign in with your phone number.|Барои фиристодани шикоят бо рақами телефон ворид шавед.
Чтобы пользоваться ИИ, войдите по номеру телефона. Так мы защищаем сервис от ботов.|To use AI, sign in with your phone number. This protects the service from bots.|Барои истифодаи ЗС бо рақами телефон ворид шавед. Ҳамин тавр мо хизматрасониро аз ботҳо ҳифз мекунем.
Сервер не принял изменения. Проверьте данные или войдите заново.|The server rejected the change. Check your details or sign in again.|Сервер тағйиротро қабул накард. Маълумотро санҷед ё аз нав ворид шавед.
Нет связи с сервером. Проверьте интернет и попробуйте снова.|Can't reach the server. Check your connection and try again.|Бо сервер алоқа нест. Интернетро санҷед ва боз кӯшиш кунед.
Установить приложение|Install the app|Насб кардани барнома
Скачать приложение|Get the app|Боргирии барнома
Приложение|App|Барнома
Установить|Install|Насб кардан
Установите на телефон или компьютер: откроется как обычное приложение, с иконкой и без адресной строки|Install it on your phone or computer: it opens like a regular app, with an icon and no address bar|Ба телефон ё компютер насб кунед: мисли барномаи оддӣ, бо нишона ва бе сатри суроға кушода мешавад
«Мастер рядом» появится на экране телефона с иконкой и будет открываться как обычное приложение.|Master Nearby will appear on your phone's home screen with an icon and open like a regular app.|«Усто наздик» дар экрани телефон бо нишона пайдо мешавад ва мисли барномаи оддӣ кушода мешавад.
iPhone и iPad (Safari)|iPhone and iPad (Safari)|iPhone ва iPad (Safari)
Откройте сайт в Safari.|Open the site in Safari.|Сайтро дар Safari кушоед.
Нажмите кнопку «Поделиться» внизу экрана.|Tap the Share button at the bottom of the screen.|Тугмаи «Мубодила»-ро дар поёни экран пахш кунед.
Выберите «На экран „Домой“» и нажмите «Добавить».|Choose "Add to Home Screen" and tap "Add".|«Ба экрани асосӣ»-ро интихоб кунед ва «Илова»-ро пахш кунед.
Android (Chrome)|Android (Chrome)|Android (Chrome)
Нажмите меню ⋮ в правом верхнем углу.|Tap the ⋮ menu in the top right corner.|Менюи ⋮-ро дар кунҷи болои рост пахш кунед.
Выберите «Установить приложение» или «Добавить на главный экран».|Choose "Install app" or "Add to Home screen".|«Насб кардани барнома» ё «Илова ба экрани асосӣ»-ро интихоб кунед.
Компьютер (Chrome, Edge)|Computer (Chrome, Edge)|Компютер (Chrome, Edge)
Нажмите значок установки справа в адресной строке.|Click the install icon on the right of the address bar.|Нишонаи насбро дар тарафи рости сатри суроға пахш кунед.
Приложение установлено. Ищите «Мастер рядом» среди приложений|App installed. Look for Master Nearby among your apps|Барнома насб шуд. «Усто наздик»-ро дар байни барномаҳо ҷӯед
3D-фон|3D background|Заминаи 3D
Объёмный фон красивый, но нагружает телефон. «Авто» включает его только на мощных устройствах|The 3D background looks great but loads your phone. "Auto" turns it on only on powerful devices|Заминаи ҳаҷмӣ зебо аст, вале телефонро бор мекунад. «Худкор» онро танҳо дар дастгоҳҳои пурқувват фаъол мекунад
Вкл|On|Фаъол
Выкл|Off|Хомӯш
Применяем…|Applying…|Татбиқ мешавад…
Мастера|Pros|Устоҳо
Заказы|Jobs|Фармоишҳо
ИИ|AI|ЗС
Чат|Chat|Чат
Сфотографируйте поломку или опишите задачу. Подскажу, что случилось, какой мастер нужен, и помогу разместить заказ.|Take a photo of the problem or describe it. I'll tell you what's wrong, which pro you need, and help you post a job.|Аз шикастагӣ акс гиред ё масъаларо тавсиф кунед. Мегӯям, ки чӣ шудааст, кадом усто лозим аст ва дар ҷойгир кардани фармоиш кӯмак мекунам.
Сфотографировать|Take a photo|Акс гирифтан
Наведите камеру на то, что сломалось|Point the camera at what's broken|Камераро ба чизи шикаста равона кунед
Выбрать фото|Choose a photo|Интихоби акс
Из галереи телефона|From your phone's gallery|Аз галереяи телефон
Посоветоваться|Ask for advice|Маслиҳат пурсидан
Опишите словами, что случилось|Describe in words what happened|Бо калимаҳо нависед, ки чӣ шуд
Например:|For example:|Масалан:
Течёт кран на кухне|Kitchen tap is leaking|Ҷӯмак дар ошхона мечакад
Не работает розетка|Socket doesn't work|Розетка кор намекунад
Машина не заводится|Car won't start|Мошин оғоз намешавад
Нужен ремонт ванной|Need a bathroom renovation|Таъмири ҳаммом лозим аст
Помощь|Help|Ёрӣ
Инструкция|Guide|Дастур
Как найти мастера, записаться, разместить заказ и не попасть на мошенников|How to find a pro, book, post a job and avoid scammers|Чӣ тавр усто ёфтан, навбат гирифтан, фармоиш ҷойгир кардан ва ба фиребгарон дучор нашудан
Как пользоваться|How to use|Тарзи истифода
Восемь шагов — и вы знаете всё.|Eight steps and you know it all.|Ҳашт қадам — ва шумо ҳама чизро медонед.
Частые вопросы|FAQ|Саволҳои маъмул
Найдите мастера|Find a pro|Усто ёбед
На экране «Мастера» напишите, что нужно сделать, или выберите вид работ. Сравните оценки, отзывы и цены.|On the Pros screen, type what you need or pick a type of work. Compare ratings, reviews and prices.|Дар экрани «Устоҳо» нависед, ки чӣ кор лозим аст, ё навъи корро интихоб кунед. Баҳоҳо, тақризҳо ва нархҳоро муқоиса кунед.
Не знаете, кто нужен?|Not sure who you need?|Намедонед, кӣ лозим аст?
Нажмите ИИ в центре нижнего меню. Сфотографируйте поломку или опишите её словами — помощник подскажет мастера и заполнит заказ.|Tap AI in the middle of the bottom menu. Take a photo of the problem or describe it — the assistant will suggest a pro and fill in the job.|Дар маркази менюи поён ЗС-ро пахш кунед. Аз шикастагӣ акс гиред ё онро тавсиф кунед — ёрдамчӣ усторо пешниҳод мекунад ва фармоишро пур мекунад.
Напишите и запишитесь|Message and book|Нависед ва навбат гиред
В профиле мастера нажмите «Написать» или «Записаться», выберите день и время. Мастер подтвердит запись в чате.|In a pro's profile tap Message or Book, pick a day and time. The pro will confirm in the chat.|Дар профили усто «Навиштан» ё «Навбат гирифтан»-ро пахш кунед, рӯз ва вақтро интихоб кунед. Усто навбатро дар чат тасдиқ мекунад.
Или разместите заказ|Or post a job|Ё фармоиш ҷойгир кунед
На экране «Заказы» опишите задачу. Мастера сами предложат цену, а вы выберете подходящего.|On the Jobs screen describe the task. Pros will quote a price and you choose the best one.|Дар экрани «Фармоишҳо» корро тавсиф кунед. Устоҳо худашон нарх пешниҳод мекунанд ва шумо мувофиқашро интихоб мекунед.
Включите уведомления|Turn on notifications|Огоҳиномаҳоро фаъол кунед
В настройках включите уведомления — вы узнаете о новом сообщении, даже когда приложение закрыто.|Turn on notifications in Settings — you'll know about new messages even when the app is closed.|Дар танзимот огоҳиномаҳоро фаъол кунед — дар бораи паёми нав ҳатто вақте ки барнома баста аст, хабар меёбед.
Оставьте отзыв|Leave a review|Тақриз гузоред
После работы оцените мастера. Отзыв можно оставить только после подтверждённой записи, поэтому все отзывы честные.|After the job, rate the pro. Reviews are only possible after a confirmed booking, so they're all genuine.|Пас аз кор ба усто баҳо диҳед. Тақризро танҳо пас аз навбати тасдиқшуда гузоштан мумкин аст, бинобар ин ҳамаи тақризҳо ростқавлона мебошанд.
Вы мастер?|Are you a pro?|Шумо усто ҳастед?
Нажмите «Стать мастером», заполните анкету и график. Свои работы с фото добавляйте в профиле кнопкой «Добавить работу».|Tap Become a pro, fill in your profile and schedule. Add your work with photos in your profile using Add work.|«Усто шудан»-ро пахш кунед, анкета ва ҷадвалро пур кунед. Корҳои худро бо акс дар профил тавассути «Илова кардани кор» илова кунед.
Безопасность|Safety|Бехатарӣ
Не переводите предоплату на карту и никому не называйте коды из СМС. Подозрительного собеседника — «Пожаловаться».|Don't send prepayments to cards and never share SMS codes. Report anyone suspicious.|Пешпардохтро ба корт нафиристед ва рамзҳои SMS-ро ба касе нагӯед. Ҳамсуҳбати шубҳанокро — «Шикоят кардан».
Уведомления|Notifications|Огоҳиномаҳо
Включить|Turn on|Фаъол кардан
Выключить|Turn off|Хомӯш кардан
Не сейчас|Not now|Ҳоло не
Включены: вы узнаете о новых сообщениях и откликах, даже когда приложение закрыто|On: you'll hear about new messages and replies even when the app is closed|Фаъол: дар бораи паёмҳо ва ҷавобҳои нав ҳатто вақте ки барнома баста аст, хабар меёбед
Узнавайте о новых сообщениях, даже когда приложение закрыто|Get notified about new messages even when the app is closed|Дар бораи паёмҳои нав ҳатто вақте ки барнома баста аст, хабар ёбед
Запрещены в настройках браузера. Разрешите уведомления для этого сайта в настройках телефона|Blocked in browser settings. Allow notifications for this site in your phone settings|Дар танзимоти браузер манъ шудаанд. Огоҳиномаҳоро барои ин сайт дар танзимоти телефон иҷозат диҳед
На iPhone уведомления работают, когда приложение установлено на экран «Домой»|On iPhone, notifications work once the app is added to the Home Screen|Дар iPhone огоҳиномаҳо вақте кор мекунанд, ки барнома ба экрани асосӣ насб шудааст
Заработают после подключения сервера (инструкция в README)|Will work once the server is connected (see README)|Пас аз пайваст кардани сервер кор мекунанд (дастур дар README)
Этот браузер не поддерживает уведомления|This browser doesn't support notifications|Ин браузер огоҳиномаҳоро дастгирӣ намекунад
Включите уведомления, чтобы узнать об ответе, даже когда приложение закрыто|Turn on notifications to know about replies even when the app is closed|Огоҳиномаҳоро фаъол кунед, то дар бораи ҷавоб ҳатто вақте ки барнома баста аст, хабар ёбед
Уведомления включены|Notifications on|Огоҳиномаҳо фаъоланд
Уведомления выключены|Notifications off|Огоҳиномаҳо хомӯшанд
Уведомления не разрешены|Notifications not allowed|Огоҳиномаҳо иҷозат дода нашудаанд
Конфиденциальность|Privacy|Махфият
Какие данные мы храним и кто их видит|What data we keep and who sees it|Мо кадом маълумотро нигоҳ медорем ва кӣ онро мебинад
Читать|Read|Хондан
Работы мастера|Pro's work|Корҳои усто
Добавить работу|Add work|Илова кардани кор
Новая работа|New work|Кори нав
Покажите клиентам, как вы работаете. Хорошо подходят фото «до» и «после».|Show clients how you work. Before-and-after photos work great.|Ба мизоҷон нишон диҳед, ки чӣ тавр кор мекунед. Аксҳои «пеш» ва «пас» хеле мувофиқанд.
Из галереи|From gallery|Аз галерея
Подпись|Caption|Тавзеҳ
Например: укладка плитки в ванной, 6 м², 2 дня|For example: bathroom tiling, 6 m², 2 days|Масалан: гузоштани кафел дар ҳаммом, 6 м², 2 рӯз
Опубликовать|Publish|Нашр кардан
Добавьте фото работы.|Add a photo of the work.|Акси корро илова кунед.
Работа опубликована|Work published|Кор нашр шуд`;
const LANGS = ['ru', 'en', 'tg'];
const LANG = {cur: 'ru'};
const I18 = {en: new Map(), tg: new Map()}, I18L = {en: new Map(), tg: new Map()}, I18C = {en: new Map(), tg: new Map()};
I18N_SRC.split('\n').forEach(line => {
  const p = line.split('|'); if (p.length !== 3) return;
  const k = p[0].trim();
  I18.en.set(k, p[1]); I18.tg.set(k, p[2]); I18L.en.set(k.toLowerCase(), p[1]); I18L.tg.set(k.toLowerCase(), p[2]);
});
const FRAG_RE = new RegExp('(?<![\\p{L}\\d])(' + Array.from(I18.en.keys()).filter(k => k.length >= 1).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\p{L}])', 'giu');
const CYR = /[а-яё]/gi;
/* Перевод строки: сначала целиком по словарю, потом по кусочкам, если почти вся строка знакома. */
function trText(ru, lang) {
  const t = ru.trim();
  if (!t || !/[а-яё]/i.test(t)) return ru;
  const cache = I18C[lang];
  let v = cache.get(t);
  if (v === undefined) {
    v = I18[lang].get(t);
    if (v === undefined) {
      const total = (t.match(CYR) || []).length;
      let hit = 0;
      const out = t.replace(FRAG_RE, w => {
        const x = I18L[lang].get(w.toLowerCase());
        if (x === undefined) return w;
        hit += (w.match(CYR) || []).length;
        return /^[А-ЯЁ]/.test(w) ? x.charAt(0).toUpperCase() + x.slice(1) : x;
      });
      v = hit && (total - hit) / total <= 0.34 ? out : null;
    }
    cache.set(t, v);
  }
  if (v === null) return ru;
  return ru.match(/^\s*/)[0] + v + ru.match(/\s*$/)[0];
}
const TRO = new WeakMap(), TRA = new WeakMap();
const TR_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const trSkip = el => !el || !!el.closest('script,style,textarea,[translate="no"]');
function trTextNode(n) {
  if (trSkip(n.parentElement)) return;
  const cur = n.nodeValue;
  let r = TRO.get(n);
  if (!r || cur !== r.out) { r = {ru: cur, out: cur}; TRO.set(n, r); }
  const out = LANG.cur === 'ru' ? r.ru : trText(r.ru, LANG.cur);
  r.out = out;
  if (cur !== out) n.nodeValue = out;
}
function trAttrs(el) {
  if (el.closest('[translate="no"]')) return;
  let rec = TRA.get(el);
  if (!rec) { rec = {}; TRA.set(el, rec); }
  TR_ATTRS.forEach(a => {
    if (!el.hasAttribute(a)) return;
    const cur = el.getAttribute(a);
    let r = rec[a];
    if (!r || cur !== r.out) r = rec[a] = {ru: cur, out: cur};
    const out = LANG.cur === 'ru' ? r.ru : trText(r.ru, LANG.cur);
    r.out = out;
    if (cur !== out) el.setAttribute(a, out);
  });
}
function trTree(root) {
  if (!root) return;
  if (root.nodeType === 3) { trTextNode(root); return; }
  if (root.nodeType !== 1 || root.closest('script,style')) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) trTextNode(n);
  if (TR_ATTRS.some(a => root.hasAttribute(a))) trAttrs(root);
  root.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach(trAttrs);
}
let trObs = null;
const trQueue = new Set();
function startTrObs() {
  if (trObs) return;
  let sched = false;
  trObs = new MutationObserver(recs => {
    recs.forEach(r => { if (r.type === 'childList') r.addedNodes.forEach(n => trQueue.add(n)); else trQueue.add(r.target); });
    if (!sched) { sched = true; queueMicrotask(() => { sched = false; const items = Array.from(trQueue); trQueue.clear(); items.forEach(n => { if (n.isConnected) trTree(n); }); }); }
  });
  trObs.observe(document.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: TR_ATTRS});
}
/* Заголовки презентации разбиты на слова для анимации: пересобираем их на новом языке. */
function trSplit() {
  $$('.split').forEach(el => {
    const ru = el.dataset.ru || (el.dataset.ru = el.getAttribute('aria-label') || el.textContent.trim());
    const txt = LANG.cur === 'ru' ? ru : trText(ru, LANG.cur);
    if (el.dataset.cur === txt) return;
    el.dataset.cur = txt;
    el.setAttribute('translate', 'no'); el.setAttribute('aria-label', txt);
    el.innerHTML = txt.split(/\s+/).map((w, i) => '<span class="w" aria-hidden="true" style="--i:' + i + '"><span>' + esc(w) + '</span></span>').join(' ');
  });
}
function setLang(l) {
  LANG.cur = LANGS.indexOf(l) >= 0 ? l : 'ru';
  document.documentElement.lang = LANG.cur;
  if (LANG.cur !== 'ru') startTrObs();
  trSplit();
  trTree(document.body);
}
const aiLangHint = () => LANG.cur === 'en' ? 'Отвечай на английском языке.' : LANG.cur === 'tg' ? 'Отвечай на таджикском языке (кириллица).' : '';

/* ---------- иконки ---------- */
const IC = {
  bell: '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4.5L17 13H5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/>',
  star: '<path d="M12 2.8l2.75 5.6 6.15.9-4.45 4.35 1.05 6.1L12 16.9l-5.5 2.85 1.05-6.1L3.1 9.3l6.15-.9z"/>',
  check: '<path d="M4.5 12.5l4.5 4.5L19.5 6.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  phone: '<path d="M5.2 3.8h3.3l1.6 4.1-2.1 1.3a11.5 11.5 0 0 0 6.8 6.8l1.3-2.1 4.1 1.6v3.3a1.6 1.6 0 0 1-1.7 1.6A16.9 16.9 0 0 1 3.6 5.5a1.6 1.6 0 0 1 1.6-1.7z"/>',
  copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2"/><path d="M15.5 8.5V5.6A1.6 1.6 0 0 0 13.9 4H5.6A1.6 1.6 0 0 0 4 5.6v8.3a1.6 1.6 0 0 0 1.6 1.6h2.9"/>',
  arrowL: '<path d="M15 5l-7 7 7 7"/>',
  arrowR: '<path d="M9 5l7 7-7 7"/>',
  arrowD: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  arrowUR: '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
  pause: '<path d="M9 5.5v13M15 5.5v13"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.2-3.8 4.1-5.8 7.5-5.8s6.3 2 7.5 5.8"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M6 12h12"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.9 12.5h9.2L17.5 7"/>',
  edit: '<path d="M4 20h4.2L19.4 8.8a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4 15.8z"/><path d="M13.5 6.5l4 4"/>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="2.2"/><circle cx="9" cy="10" r="1.7"/><path d="m20.5 16-5-5L5.5 19"/>',
  shield: '<path d="M12 3.2 19 6v5.4c0 4.4-3 8.1-7 9.4-4-1.3-7-5-7-9.4V6z"/><path d="m9 12 2.2 2.2L15.2 10"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.01"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  spark: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5h6v2M3.5 12.5h17"/>',
  faucet: '<path d="M3.5 7.5v6M3.5 10.5h8a4.5 4.5 0 0 1 4.5 4.5v1"/><path d="M8.5 10.5V7M6 7h5"/><path d="M16 19.5v.01M16 22v.01"/>',
  tiles: '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.2"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.2"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.2"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.2"/>',
  bolt: '<path d="M13.2 2.8 5.5 13.2h6l-1 8 7.8-10.6h-6z"/>',
  key: '<circle cx="7.8" cy="15.6" r="4.3"/><path d="M10.9 12.5 19.5 4M15.6 7.9l2.4 2.4M18 5.5l2.2 2.2"/>',
  roller: '<rect x="4" y="3.5" width="13" height="5" rx="1.5"/><path d="M17 6h2.5v5.2H11V14"/><rect x="9.6" y="14" width="2.8" height="6.5" rx="1"/>',
  hammer: '<path d="M13.6 3.8 20.2 10.4l-2.3 2.3-6.6-6.6z"/><path d="M12.4 9.3 4.3 17.4a1.9 1.9 0 0 0 2.7 2.7l8.1-8.1"/>',
  flame: '<path d="M12 21c-3.6 0-6.4-2.6-6.4-6.1 0-3.4 2.4-5.2 3.5-8.2.5 1.9 1.5 3 2.5 3.5-.2-2.9 1-5.3 3.3-6.9.2 3.5 3.5 5.6 3.5 10.5C18.4 18.3 15.6 21 12 21z"/>',
  toolbox: '<rect x="3" y="8" width="18" height="11.5" rx="2"/><path d="M8.5 8V5.5h7V8M3 13h18M10 13v2.2h4V13"/>',
  brick: '<path d="M3.5 5.5h17v13h-17zM3.5 9.8h17M3.5 14.2h17M9 5.5v4.3M15 9.8v4.4M9 14.2v4.3"/>',
  window: '<rect x="4.5" y="3.5" width="15" height="17" rx="1.2"/><path d="M12 3.5v17M4.5 11.5h15"/>',
  car: '<path d="M4 15.5V12l2-4.5h12l2 4.5v3.5a1 1 0 0 1-1 1h-1.4M6.4 16.5H5a1 1 0 0 1-1-1M10.1 16.5h3.8M4 12h16"/><circle cx="8.2" cy="16.5" r="1.8"/><circle cx="15.8" cy="16.5" r="1.8"/>',
  wheel: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.8"/><path d="M12 3.5v5.7M12 14.8v5.7M3.5 12h5.7M14.8 12h5.7"/>',
  washer: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="13.5" r="4"/><path d="M8 6.5h1.5M12.5 6.5h3.5"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 18.5h18"/>',
  mobile: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17.5h2"/>',
  broom: '<path d="M15 3.5l-3.2 7"/><path d="M8.6 10.2l6.2 2.8-2 7.5c-3-.4-6-2-8-4.3z"/><path d="M9 15.5l1.5-2"/>',
  truck: '<path d="M3 6.5h11v9.5H3zM14 9.5h4l3 3.2V16h-7z"/><circle cx="7" cy="17.3" r="1.8"/><circle cx="17" cy="17.3" r="1.8"/>',
  leaf: '<path d="M5 19.5C5 11 10 5 20 4.5c0 10-6 15-14.5 15"/><path d="M5 19.5c3-4.5 6.5-7.5 10.5-9.5"/>',
  needle: '<path d="M19.5 4.5 7 17"/><circle cx="17.6" cy="6.4" r="1.3"/><path d="M7 17c-2.2.8-3.5 2.3-2.6 3.2s2.4-.4 3.2-2.6"/>',
  scissors: '<circle cx="6.5" cy="7" r="2.6"/><circle cx="6.5" cy="17" r="2.6"/><path d="M8.7 8.5 20 17M8.7 15.5 20 7"/>',
  book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5zM12 4h6.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H12"/>',
  calc: '<rect x="5" y="2.8" width="14" height="18.4" rx="2"/><path d="M8.2 6.8h7.6M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5v3.6M8.5 18h.01M12 18h.01"/>',
  tools: '<path d="M14.6 3.4l6 6-2.6 2.6-6-6z"/><path d="M15.3 8.7 4 20"/><path d="M3.4 4.8 4.8 3.4l4.4 3.2.8 2.4-1.2 1.2-2.4-.8z"/><path d="M10.4 10.4l9.4 9.4"/>',
  help: '<path d="M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4.5 3.5v-3.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/><path d="M10 9.4a2 2 0 1 1 2.9 1.8c-.5.2-.9.6-.9 1.1v.3M12 14.4v.01"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.6 3.6 5.4 3.6 8.5s-1.2 5.9-3.6 8.5c-2.4-2.6-3.6-5.4-3.6-8.5S9.6 6.1 12 3.5z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  filter: '<path d="M4 6.5h16M7 12h10M10 17.5h4"/>',
  logout: '<path d="M14 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4M10 16.5 5.5 12 10 7.5M5.5 12H15"/>',
  plug: '<path d="M9 3v5M15 3v5M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0zM12 17v4"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7 10 4.5h4L15.5 7"/><circle cx="12" cy="13.5" r="3.5"/>',
  chat: '<path d="M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4.5 3.5v-3.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/><path d="M8 10h8M8 13h5"/>',
  send: '<path d="M4 11.6 20 4.5l-6.3 15.2-2.6-6.4z"/><path d="m11.1 13.3 4.6-4.6"/>'
};
const icon = (n, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (IC[n] || '') + '</svg>';
const STAR_D = 'M12 2.8l2.75 5.6 6.15.9-4.45 4.35 1.05 6.1L12 16.9l-5.5 2.85 1.05-6.1L3.1 9.3l6.15-.9z';
function starsHTML(v, size) {
  size = size || 15; let h = '';
  for (let i = 1; i <= 5; i++) { const cls = v >= i - 0.25 ? '' : v >= i - 0.75 ? 'half' : 'off'; h += '<svg class="' + cls + '" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true"><path d="' + STAR_D + '"/></svg>'; }
  return '<span class="stars" role="img" aria-label="Оценка ' + fmtR(v) + ' из 5">' + h + '</span>';
}

/* ---------- справочники ---------- */
/* Виды работ. re — слова, по которым поиск понимает, какой мастер нужен (слово начинается с основы); not — слова, при которых вид работ не подходит. */
const GROUPS = ['Ремонт и стройка', 'Авто', 'Техника и электроника', 'Дом и быт', 'Красота', 'Обучение и другое'];
const CATS = [
  {k: 'Сантехник', g: 0, ic: 'faucet', unit: 'за выезд', svc: ['Замена смесителя', 'Установка унитаза', 'Прочистка засора', 'Подключение стиральной машины'],
    re: /^(plumb|leak|pipe|faucet|toilet|sink|қубур|обгузар|ҳоҷатхона|сантех|смесит|унитаз|труб|засор|протеч|теч|кран|бойлер|водонагр|раковин|сифон|канализ|водопр|счетчик|душ|ванн|батаре|радиатор|отоплен)/},
  {k: 'Кафельщик', g: 0, ic: 'tiles', unit: 'за м²', svc: ['Укладка плитки на пол', 'Укладка настенной плитки', 'Затирка швов', 'Демонтаж старой плитки'],
    re: /^(tile|tiling|сафол|кафел|плитк|плитку|плиточ|керамогр|мозаик|затир|фартук)/},
  {k: 'Электрик', g: 0, ic: 'bolt', unit: 'за точку', svc: ['Установка розетки', 'Сборка щитка', 'Прокладка кабеля', 'Подключение светильника'],
    re: /^(electric|outlet|socket|wiring|switch|барқ|сим|электрик|электрич|электромонт|розет|выключ|щит|провод|свет|кабел|автомат|люстр|штроб|узо$)/},
  {k: 'Слесарь', g: 0, ic: 'key', unit: 'за выезд', svc: ['Вскрытие замка', 'Замена личинки', 'Регулировка двери', 'Установка доводчика'],
    re: /^(lock|key|қулф|калид|слесар|замо|замк|ключ|вскры|личин|захлоп|доводч)/},
  {k: 'Маляр', g: 0, ic: 'roller', unit: 'за м²', svc: ['Покраска стен', 'Шпаклёвка под покраску', 'Поклейка обоев', 'Покраска потолка'],
    re: /^(paint|wallpaper|ранг|обой|маляр|покрас|краск|кра[сш]ить|обо[иея]|обоев|шпакл|штукат|потол)/, not: /^(авто|машин|кузов|волос)/},
  {k: 'Плотник', g: 0, ic: 'hammer', unit: 'за выезд', svc: ['Установка межкомнатной двери', 'Ремонт пола', 'Изготовление полок'],
    re: /^(carpent|door|floor|wood|дуредгар|чӯб|плотн|столяр|двер|пол$|пола$|полы$|паркет|ламинат|плинтус|дерев|лестниц|беседк)/},
  {k: 'Сварщик', g: 0, ic: 'flame', unit: 'за выезд', svc: ['Ремонт ворот', 'Сварка навеса', 'Решётки на окна'],
    re: /^(weld|gate|кафшер|дарвоза|свар|ворот|навес$|навеса|решет|забор|металл)/},
  {k: 'Строитель', g: 0, ic: 'brick', unit: 'за м²', svc: ['Кладка стен', 'Стяжка пола', 'Перегородки из гипсокартона', 'Ремонт квартиры под ключ'],
    re: /^(build|construct|drywall|бино|сохтмон|строит|стройк|кладк|кирпич|блок|стяжк|гипсокарт|бетон|фундамент|перегород|отделк|кровл|крыш)/},
  {k: 'Окна и двери ПВХ', g: 0, ic: 'window', unit: 'за услугу', svc: ['Установка пластикового окна', 'Регулировка окон', 'Москитная сетка', 'Откосы и подоконник'],
    re: /^(window|тиреза|пвх|pvh|pvc|окн|окон|стеклопак|пластиков|москитн|подоконн|откос|балкон|лоджи)/, not: /^(мыть|помыть|мойк|убор|чист)/},
  {k: 'Мастер на час', g: 0, ic: 'toolbox', unit: 'за час', svc: ['Сборка мебели', 'Навеска полок', 'Установка карниза', 'Навеска телевизора'],
    re: /^(handyman|furniture|shelf|tv$|мебел|раф|шкаф|мебел|полк|карниз|телевизор|собрат|сборк|повес|навеси|мелк|муж$)/},
  {k: 'Автомеханик', g: 1, ic: 'car', d: 'Обычные машины: бензин, дизель, газ', unit: 'за услугу', svc: ['Диагностика', 'Замена масла', 'Ремонт двигателя', 'Ремонт тормозов', 'Ремонт подвески'],
    re: /^(мошин|муҳаррик|engine|mechanic|brake|oil|vehicle|авто|машин|автомоб|двигат|мотор|бензин|дизел|метан|пропан|тормоз|сцепл|масл|стартер|подвеск|ходов|кпп$|коробк|глушит|сто$|механик|диагност|грм$|ремен|car$)/, not: /^(автомат|стирал|посудомо|швейн|электромоб|электрокар)/},
  {k: 'Мастер по электромобилям', g: 1, ic: 'plug', d: 'Электромобили и гибриды: BYD, Tesla, Zeekr и другие', unit: 'за услугу', svc: ['Диагностика электромобиля', 'Ремонт высоковольтной батареи', 'Прошивка и русификация', 'Установка зарядной станции'],
    re: /^(ev$|electric car|барқӣ|электромоб|электрокар|электромаш|гибрид|зарядн|зарядк|ev$|высоковольт|русификац)/, not: /^(телефон|смартфон|айфон|iphone|планшет|ноут)/},
  {k: 'Автоэлектрик', g: 1, ic: 'bolt', d: 'Электрика машины, аккумулятор, сигнализация', unit: 'за услугу', svc: ['Диагностика электрики', 'Замена аккумулятора', 'Ремонт генератора', 'Установка сигнализации'],
    re: /^(battery|alternator|alarm|автоэлектр|аккумул|акб$|генератор|фар[аыу]?$|сигнализ|магнитол|парктроник)/},
  {k: 'Шиномонтаж', g: 1, ic: 'wheel', d: 'Колёса, резина, диски', unit: 'за колесо', svc: ['Смена резины', 'Балансировка', 'Ремонт прокола', 'Правка дисков'],
    re: /^(tire|tyre|wheel|чарх|шина|шин|колес|покрыш|балансир|резин|диск|прокол|шиномонт)/},
  {k: 'Кузовной ремонт', g: 1, ic: 'roller', d: 'Вмятины, покраска, бампер', unit: 'за услугу', svc: ['Удаление вмятин', 'Покраска детали', 'Ремонт бампера', 'Полировка кузова'],
    re: /^(dent|bumper|body|кузов|вмятин|царапин|бампер|рихтов|полировк|крыло$)/},
  {k: 'Ремонт бытовой техники', g: 2, ic: 'washer', unit: 'за выезд', svc: ['Ремонт стиральной машины', 'Ремонт холодильника', 'Ремонт посудомойки', 'Ремонт микроволновки'],
    re: /^(washing|fridge|dishwasher|oven|microwave|appliance|яхдон|ҷомашӯ|зарфшӯ|бытов|стиральн|холодил|морозил|посудомо|духов|микровол|пылесос|утюг|чайник|кофемаш|техник)/},
  {k: 'Мастер по кондиционерам', g: 2, ic: 'snow', unit: 'за услугу', svc: ['Установка кондиционера', 'Чистка кондиционера', 'Заправка фреоном', 'Ремонт вентиляции'],
    re: /^(кондитсион|air$|aircon|hvac|кондиц|сплит|вентиляц|фреон|климат)/},
  {k: 'Компьютерный мастер', g: 2, ic: 'laptop', unit: 'за услугу', svc: ['Установка Windows', 'Чистка от вирусов', 'Настройка Wi-Fi', 'Ремонт ноутбука'],
    re: /^(laptop|computer|virus|printer|router|компютер|компьют|ноут|пк$|windows|виндовс|винд|вирус|принтер|роутер|wifi|wi$|вайфай|интернет|программ|ssd$|комп$)/},
  {k: 'Ремонт телефонов', g: 2, ic: 'mobile', unit: 'за услугу', svc: ['Замена экрана', 'Замена аккумулятора', 'Ремонт разъёма зарядки', 'Прошивка'],
    re: /^(phone|screen|телефон|смартфон|айфон|iphone|samsung|самсунг|андроид|android|планшет|экран|дисплей|прошивк|сотов)/},
  {k: 'Уборка', g: 3, ic: 'broom', unit: 'за услугу', svc: ['Генеральная уборка', 'Уборка после ремонта', 'Мытьё окон', 'Химчистка дивана'],
    re: /^(clean|тоза|шуст|убор|клининг|мыть|помыть|мытье|мойк|отмыть|химчист|чистот|пыл)/, not: /^(авто|машин)/},
  {k: 'Грузчики и переезд', g: 3, ic: 'truck', unit: 'за час', svc: ['Квартирный переезд', 'Грузчики', 'Вывоз мусора', 'Доставка мебели'],
    re: /^(mov|deliver|junk|кӯч|бор|груз|переезд|перевез|перевоз|достав|вывоз|мусор|газел|такелаж|перенест)/},
  {k: 'Садовник', g: 3, ic: 'leaf', unit: 'за час', svc: ['Покос травы', 'Обрезка деревьев', 'Уход за газоном', 'Посадка растений'],
    re: /^(garden|lawn|grass|tree|боғ|дарахт|алаф|сад|газон|обрезк|огород|полив|покос|трав|ландшафт|цвет[ыо]|растен)/},
  {k: 'Швея', g: 3, ic: 'needle', unit: 'за услугу', svc: ['Подшить брюки', 'Замена молнии', 'Ушить платье', 'Пошив штор'],
    re: /^(sew|tailor|dress|дӯз|курта|шим|шве[яи]|швейн|шить|пошив|ушит|подшит|одежд|ателье|молни|штор|брюк|плать)/},
  {k: 'Парикмахер', g: 4, ic: 'scissors', unit: 'за услугу', svc: ['Мужская стрижка', 'Женская стрижка', 'Окрашивание', 'Укладка'],
    re: /^(hair|barber|мӯй|сартарош|парикмах|стриж|постри|подстри|волос|окраш|прическ|причес|барбер|бород)/},
  {k: 'Мастер маникюра', g: 4, ic: 'spark', unit: 'за услугу', svc: ['Маникюр', 'Покрытие гель-лаком', 'Педикюр', 'Наращивание'],
    re: /^(nail|manicur|маник|педик|ногт|гель|наращ|nail)/},
  {k: 'Репетитор', g: 5, ic: 'book', unit: 'за час', svc: ['Математика', 'Английский язык', 'Подготовка к экзаменам', 'Русский язык'],
    re: /^(tutor|lesson|english|math|exam|омӯзгор|дарс|забон|репет|урок|учеб|учит|англ|математ|физик|хими[яи]|школ|экзамен|егэ|огэ|ielts|язык|подготовк)/},
  {k: 'Фотограф', g: 5, ic: 'camera', unit: 'за час', svc: ['Фотосессия', 'Свадебная съёмка', 'Видеосъёмка', 'Съёмка товаров'],
    re: /^(photo|video|wedding|сурат|акс|тӯй|фото|съемк|сьемк|свадьб|видео|оператор)/}
];
const CAT = Object.fromEntries(CATS.map(c => [c.k, c]));
const catIndex = k => Math.max(0, CATS.findIndex(c => c.k === k));
const DISTRICTS = ['Центр', 'Северный район', 'Южный район', 'Восточный район', 'Западный район'];
const UNITS = ['за выезд', 'за м²', 'за точку', 'за час', 'за услугу'];
const TAGS = ['Пунктуальный', 'Аккуратно и чисто', 'Цена как договорились', 'Быстро', 'Вежливый', 'Свой инструмент', 'Даёт советы'];
const WHEN = ['Срочно', 'Сегодня', 'На этой неделе', 'Не спешу'];
const POPULAR = ['машина BYD', 'починить машину', 'заменить смеситель', 'ремонт стиральной машины', 'поставить окна ПВХ', 'уборка квартиры', 'переезд', 'установить кондиционер', 'собрать шкаф'];
const SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
const STOP = new Set(['i', 'a', 'an', 'the', 'my', 'me', 'to', 'for', 'need', 'fix', 'repair', 'please', 'find', 'want', 'help', 'someone', 'some', 'pro', 'ман', 'ба', 'барои', 'лозим', 'мехоҳам', 'ёфтан', 'усто', 'устои', 'ва', 'як', 'кӣ', 'чӣ', 'кардан', 'таъмир', 'таъмири', 'и', 'в', 'во', 'на', 'с', 'со', 'по', 'для', 'за', 'не', 'мне', 'нужно', 'надо', 'нужен', 'нужна', 'нужны', 'сделать', 'у', 'от', 'до', 'кв', 'м', 'м2', 'из', 'к', 'под', 'или', 'а',
  'мастер', 'мастера', 'мастеров', 'мастеру', 'ищу', 'найти', 'хочу', 'нибудь', 'какой', 'какого', 'какая', 'кто', 'который', 'можно', 'может', 'пожалуйста', 'помочь', 'помогите', 'помощь', 'услуги', 'услуга', 'срочно', 'мой', 'моя', 'мою', 'моей', 'моего', 'дома', 'дом', 'квартире', 'квартиры', 'квартиру', 'починить', 'почини', 'отремонтировать', 'поставить', 'установить', 'установка', 'замена', 'заменить', 'сломал', 'сломался', 'сломалась', 'сломалось', 'не', 'работает']);
const SYN = CATS.map(c => [c.re, c.k]);
const GENERIC = new Set(['ремонт', 'мастер', 'двери', 'по', 'и']);
const altWords = c => c.altW || (c.altW = [I18.en.get(c.k), I18.tg.get(c.k)].filter(Boolean).join(' ').toLowerCase().split(/[^a-zа-яёғӣқӯҳҷ]+/).filter(x => x.length > 3 && ['repair', 'technician', 'specialist', 'устои', 'таъмири'].indexOf(x) < 0));
const wordHitsCat = (w, c) => c.re.test(w) || norm(c.k).split(/\s+/).concat(altWords(c)).some(x => x.length > 3 && !GENERIC.has(x) && w.indexOf(x.slice(0, Math.max(4, x.length - 2))) === 0);
/* Какие виды работ подходят под запрос: те, где совпало больше всего слов, с учётом исключений. */
function detectCats(q) {
  const words = parseQuery(q); if (!words.length) return [];
  const hits = CATS.map(c => ({c, n: words.filter(w => wordHitsCat(w, c)).length}))
    .filter(x => x.n > 0 && !(x.c.not && words.some(w => x.c.not.test(w))))
    .sort((a, b) => b.n - a.n);
  return hits.filter(x => x.n === hits[0].n).map(x => x.c);
}
/* Марки машин: t — тип (ev электромобиль, ice бензин/дизель, both есть и те и другие); a — как марку пишут в поиске. */
const EV = 'Мастер по электромобилям';
const BRANDS = [
  {n: 'BYD', t: 'ev', a: /^(byd|быд|бид|биди|бвд|пвд|биуайди|байд)/},
  {n: 'Chevrolet', t: 'ice', a: /^(chevrolet|chevy|шевр|кобальт|cobalt|gentra|джентр|жентр|нексия|nexia|спарк|spark|малибу|malibu|дамас|damas|трекер|tracker|onix|оникс|captiva|каптив|lacetti|лачетт|equinox|эквинокс)/},
  {n: 'Toyota', t: 'both', a: /^(toyota|тойот|тоёт|камри|camry|прадо|prado|королл|corolla|rav4|рав4|лексус|lexus)/},
  {n: 'Tesla', t: 'ev', a: /^(tesla|тесл)/},
  {n: 'Zeekr', t: 'ev', a: /^(zeekr|зикр|зекр)/},
  {n: 'Li Auto', t: 'ev', a: /^(lixiang|li$|лисян|лисиан|лиауто)/},
  {n: 'Leapmotor', t: 'ev', a: /^(leapmotor|липмотор|лепмотор)/},
  {n: 'Chery', t: 'both', a: /^(chery|чери|tiggo|тигго)/},
  {n: 'Hyundai', t: 'ice', a: /^(hyundai|хенд|хюнд|хунд|хёнд|соляри|solaris|elantra|элантр|sonata|сонат|tucson|туссан)/},
  {n: 'Kia', t: 'ice', a: /^(kia|киа|рио$|rio$|sportage|спортейдж|k5$)/},
  {n: 'Haval', t: 'ice', a: /^(haval|хавал|хавейл)/},
  {n: 'Lada', t: 'ice', a: /^(lada|лада|ваз|жигул|приор|гранта|веста|нива)/},
  {n: 'Mercedes-Benz', t: 'both', a: /^(mercedes|мерс|мерседес|benz)/},
  {n: 'BMW', t: 'both', a: /^(bmw|бмв|бэха)/},
  {n: 'Volkswagen', t: 'ice', a: /^(volkswagen|vw$|фольксв|polo$|поло$|passat|пассат)/},
  {n: 'Nissan', t: 'ice', a: /^(nissan|ниссан)/}
];
const BRAND = Object.fromEntries(BRANDS.map(b => [b.n, b]));
const BRAND_T = {ev: 'Электромобиль', ice: 'Бензин и дизель', both: 'Бензин, дизель и гибриды'};
const stemsOf = re => ((re.source.match(/\((.*)\)/) || ['', ''])[1]).split('|').map(a => (a.match(/^[a-zа-яёғӣқӯҳҷ0-9]+/) || [''])[0]).filter(x => x.length >= 2);
CATS.forEach(c => { c.stems = stemsOf(c.re); });
BRANDS.forEach(b => { b.stems = stemsOf(b.a).concat([norm(b.n).replace(/[^a-zа-яғӣқӯҳҷ0-9]/g, '')]); });
function detectBrand(q) { const w = parseQuery(q); return BRANDS.find(b => w.some(x => b.a.test(x))) || null; }
/* Что ищет человек: виды работ и, если назвал, марку машины. */
function intent(q) {
  let cats = detectCats(q).map(c => c.k);
  const brand = detectBrand(q);
  if (brand) {
    const bc = brand.t === 'ev' ? [EV] : brand.t === 'both' ? ['Автомеханик', EV] : ['Автомеханик'];
    if (!cats.length || cats.every(k => k === 'Автомеханик' || k === EV)) cats = bc;
  }
  return {cats, brand};
}
const brandFits = (m, b) => !b || !(m.brands && m.brands.length) || m.brands.indexOf(b.n) >= 0;
/* Подсказки при вводе: виды работ, марки машин и услуги. */
function suggest(q) {
  const raw = norm(q).split(/[^a-zа-яғӣқӯҳҷ0-9]+/).filter(Boolean);
  if (!raw.length) return [];
  const last = raw[raw.length - 1], words = raw.filter(w => w.length >= 2 && !STOP.has(w));
  const it = intent(q), out = [];
  const partial = stems => last.length >= 2 && stems.some(st => st.indexOf(last) === 0 || (last.length >= st.length && last.indexOf(st) === 0));
  const pre = label => { const lw = norm(label).split(/[^a-zа-яғӣқӯҳҷ0-9]+/); return words.concat([last]).some(w => w.length >= 2 && lw.some(x => x.indexOf(w) === 0)); };
  const catS = {};
  CATS.forEach(c => { let s = 0; if (it.cats.indexOf(c.k) >= 0) s += 10; if (pre(c.k)) s += 6; if (last.length >= 3 && partial(c.stems)) s += 5; catS[c.k] = s; });
  const autoCtx = !!it.brand || CATS.some(c => c.g === 1 && (it.cats.indexOf(c.k) >= 0 || (last.length >= 3 && partial(c.stems))));
  CATS.forEach(c => { const s = catS[c.k] + (autoCtx && c.g === 1 ? 4 : 0); if (s) out.push({s, t: c.k, sub: c.d || GROUPS[c.g], ic: c.ic, cat: c.k}); });
  BRANDS.forEach((b, i) => {
    let s = 0;
    if (it.brand === b) s += 12;
    if (partial(b.stems)) s += 9;
    if (autoCtx && !it.brand) s += 3 - i * 0.05;
    if (s) out.push({s, t: 'Мастер ' + b.n, sub: BRAND_T[b.t], ic: b.t === 'ev' ? 'plug' : 'car', brand: b.n});
  });
  if (last.length >= 3) CATS.forEach(c => c.svc.forEach(v => { if (pre(v)) out.push({s: 3 + (it.cats.indexOf(c.k) >= 0 ? 4 : 0), t: v, sub: c.k, ic: c.ic, svc: v, cat: c.k}); }));
  const seen = new Set();
  return out.sort((a, b) => b.s - a.s).filter(x => !seen.has(x.t) && seen.add(x.t)).slice(0, 8);
}
function attachAC(inp, wrap, onPick) {
  const box = document.createElement('div'), id = inp.id + '-ac';
  box.className = 'ac'; box.id = id; box.setAttribute('role', 'listbox'); box.setAttribute('aria-label', 'Подсказки'); box.hidden = true;
  wrap.appendChild(box);
  inp.setAttribute('role', 'combobox'); inp.setAttribute('aria-autocomplete', 'list'); inp.setAttribute('aria-controls', id); inp.setAttribute('aria-expanded', 'false');
  let items = [], act = -1;
  const close = () => { box.hidden = true; act = -1; inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant'); };
  const mark = () => {
    $$('.ac-it', box).forEach((b, i) => b.setAttribute('aria-selected', String(i === act)));
    if (act >= 0) { inp.setAttribute('aria-activedescendant', id + '-' + act); const b = $('#' + id + '-' + act); if (b) b.scrollIntoView({block: 'nearest'}); }
  };
  const render = () => {
    items = inp.value.trim() ? suggest(inp.value) : []; act = -1;
    if (!items.length) { close(); return; }
    box.innerHTML = '<p class="ac-h">Возможно, вы ищете</p>' + items.map((x, i) => '<button type="button" class="ac-it" role="option" tabindex="-1" id="' + id + '-' + i + '" data-i="' + i + '" aria-selected="false">' + icon(x.ic) + '<span><b>' + esc(x.t) + '</b><small>' + esc(x.sub) + '</small></span></button>').join('');
    box.hidden = false; inp.setAttribute('aria-expanded', 'true');
  };
  const pick = x => { close(); onPick(x); };
  inp.addEventListener('input', render);
  inp.addEventListener('focus', () => { if (inp.value.trim()) render(); });
  inp.addEventListener('keydown', e => {
    if (box.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); act = (act + 1) % items.length; mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); act = (act - 1 + items.length) % items.length; mark(); }
    else if (e.key === 'Enter' && act >= 0) { e.preventDefault(); pick(items[act]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  });
  box.addEventListener('mousedown', e => e.preventDefault());
  box.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) pick(items[Number(b.dataset.i)]); });
  (inp.closest('.modal') || document).addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
  return {close};
}
const BOX = {'20x20': 1, '30x30': 0.99, '30x60': 1.44, '60x60': 1.44, '60x120': 1.44};

/* ---------- график работы ---------- */
const WD_MF = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const HOURS = Array.from({length: 19}, (_, i) => String(i + 5).padStart(2, '0') + ':00');
const H = s => parseInt(String(s).slice(0, 2), 10);
const isHour = s => typeof s === 'string' && /^\d\d:00$/.test(s) && H(s) >= 0 && H(s) <= 23;
function mkSched(mf, from, to, br) {
  const days = [false, false, false, false, false, false, false];
  mf.split('').forEach((c, i) => { days[(i + 1) % 7] = c === '1'; });
  return {days, from, to, brk: !!br, brFrom: br ? br[0] : '13:00', brTo: br ? br[1] : '14:00'};
}
const DEF_SCHED = mkSched('1111100', '09:00', '18:00', ['13:00', '14:00']);
const DEMO_SCHED = {
  d1: mkSched('1111110', '08:00', '19:00', ['13:00', '14:00']), d2: mkSched('1111111', '08:00', '20:00'), d3: mkSched('1111100', '09:00', '18:00', ['13:00', '14:00']),
  d4: mkSched('1111111', '07:00', '22:00'), d5: mkSched('1111110', '09:00', '17:00', ['12:00', '13:00']), d6: mkSched('1111100', '09:00', '18:00', ['13:00', '14:00']),
  d7: mkSched('0111111', '10:00', '18:00'), d8: mkSched('1111111', '09:00', '21:00', ['14:00', '15:00']), d9: mkSched('1111110', '10:00', '19:00'),
  d10: mkSched('1111100', '09:00', '18:00', ['13:00', '14:00']), d11: mkSched('1111110', '09:00', '19:00', ['13:00', '14:00']), d12: mkSched('1111111', '08:00', '18:00'),
  d13: mkSched('1111110', '09:00', '19:00', ['13:00', '14:00']), d14: mkSched('1111110', '09:00', '18:00'), d15: mkSched('1111111', '08:00', '20:00', ['13:00', '14:00']),
  d16: mkSched('0111111', '08:00', '17:00'), d17: mkSched('1111100', '09:00', '18:00', ['13:00', '14:00']),
  d18: mkSched('1111110', '10:00', '20:00', ['14:00', '15:00']), d19: mkSched('1111110', '08:00', '18:00', ['12:00', '13:00'])
};
function schedOf(m) {
  const s = m && m.schedule;
  if (!s || !Array.isArray(s.days) || s.days.length !== 7 || !isHour(s.from) || !isHour(s.to) || H(s.to) <= H(s.from)) return DEF_SCHED;
  const brk = !!s.brk && isHour(s.brFrom) && isHour(s.brTo) && H(s.brTo) > H(s.brFrom);
  return {days: s.days.map(Boolean), from: s.from, to: s.to, brk, brFrom: brk ? s.brFrom : '13:00', brTo: brk ? s.brTo : '14:00'};
}
function daySlots(m, dayMs) {
  const s = schedOf(m), d = new Date(dayMs), out = [];
  if (!s.days[d.getDay()]) return out;
  for (let h = H(s.from); h < H(s.to); h++) { if (s.brk && h >= H(s.brFrom) && h < H(s.brTo)) continue; out.push(String(h).padStart(2, '0') + ':00'); }
  return out;
}
function schedText(m) {
  const s = schedOf(m), on = WD_MF.map((_, i) => s.days[(i + 1) % 7]), runs = [];
  for (let i = 0; i < 7; i++) { if (!on[i]) continue; let j = i; while (j + 1 < 7 && on[j + 1]) j++; runs.push(j - i >= 2 ? WD_MF[i] + '–' + WD_MF[j] : WD_MF.slice(i, j + 1).join(', ')); i = j; }
  const days = runs.join(', ');
  return {days: days ? days.charAt(0).toUpperCase() + days.slice(1) : 'Нет рабочих дней', hours: s.from + '–' + s.to, brk: s.brk ? s.brFrom + '–' + s.brTo : '', off: WD_MF.filter((_, i) => !on[i]).join(', ')};
}
function nowStatus(m) {
  const s = schedOf(m), n = new Date(), h = n.getHours() + n.getMinutes() / 60;
  if (!s.days[n.getDay()]) return {on: false, t: 'Сегодня выходной'};
  if (h < H(s.from)) return {on: false, t: 'Сегодня работает с ' + s.from};
  if (h >= H(s.to)) return {on: false, t: 'Сегодня уже закончил работу'};
  if (s.brk && h >= H(s.brFrom) && h < H(s.brTo)) return {on: false, t: 'Перерыв на отдых до ' + s.brTo};
  return {on: true, t: 'Сейчас работает, до ' + s.to};
}

/* ---------- примеры ---------- */
const DEMO_MASTERS = [
  {id: 'd1', name: 'Рустам Каримов', prof: 'Кафельщик', district: 'Центр', exp: 12, price: 120, unit: 'за м²', phone: '+000 90 111 22 01', verified: true, today: true, resp: 15,
    about: 'Укладываю плитку и керамогранит, делаю ванные комнаты под ключ. Работаю с крупным форматом 60×120, запиливаю углы под 45°. Свой плиткорез и лазерный уровень.',
    services: [{n: 'Укладка настенной плитки', p: '120 за м²'}, {n: 'Керамогранит на пол', p: '140 за м²'}, {n: 'Эпоксидная затирка', p: '60 за м²'}, {n: 'Демонтаж старой плитки', p: '40 за м²'}, {n: 'Запил углов под 45°', p: '35 за м'}],
    reviews: [
      {a: 'Наталья', r: 5, tags: ['Пунктуальный', 'Аккуратно и чисто'], t: 'Сделал ванную за 6 дней. Швы ровные, раскладку согласовал заранее, мусор вывез сам.', d: '2026-10-02'},
      {a: 'Бахром', r: 5, tags: ['Даёт советы'], t: 'Аккуратно положил керамогранит на кухне, подрезку у стен почти не видно.', d: '2026-09-14'},
      {a: 'Ольга', r: 4, tags: ['Аккуратно и чисто'], t: 'Качество отличное, но задержался на день из-за другого объекта.', d: '2026-08-21'},
      {a: 'Тимур', r: 5, tags: ['Даёт советы', 'Цена как договорились'], t: 'Подсказал, сколько брать плитки с запасом. Лишней осталась одна коробка.', d: '2026-07-30'},
      {a: 'Севара', r: 5, tags: ['Пунктуальный', 'Цена как договорились'], t: 'Фартук на кухне сделал за один день, цена не изменилась.', d: '2026-06-18'}]},
  {id: 'd2', name: 'Алексей Ветров', prof: 'Сантехник', district: 'Северный район', exp: 8, price: 200, unit: 'за выезд', phone: '+000 90 111 22 02', verified: true, today: true, resp: 10,
    about: 'Меняю трубы, ставлю сантехнику, бойлеры и счётчики воды. Приезжаю со своим инструментом и расходниками, даю гарантию на работу один год.',
    services: [{n: 'Замена смесителя', p: '250'}, {n: 'Установка унитаза', p: '600'}, {n: 'Прочистка засора', p: '300'}, {n: 'Разводка труб ПП', p: '900 за точку'}, {n: 'Установка бойлера', p: '700'}],
    reviews: [
      {a: 'Сергей', r: 5, tags: ['Быстро', 'Свой инструмент'], t: 'Приехал через час после звонка и устранил протечку под раковиной.', d: '2026-10-11'},
      {a: 'Мадина', r: 5, tags: ['Аккуратно и чисто', 'Даёт советы'], t: 'Поменял все трубы в санузле, всё подписал и показал, где краны.', d: '2026-09-03'},
      {a: 'Ирина', r: 4, tags: ['Быстро'], t: 'Работа хорошая, но цена вышла чуть выше из-за фитингов.', d: '2026-08-12'},
      {a: 'Азиз', r: 5, tags: ['Пунктуальный', 'Цена как договорились'], t: 'Поставил бойлер, всё чисто и в срок.', d: '2026-07-05'}]},
  {id: 'd3', name: 'Фаррух Назаров', prof: 'Электрик', district: 'Южный район', exp: 6, price: 80, unit: 'за точку', phone: '+000 90 111 22 03', verified: true, today: false, resp: 30,
    about: 'Электромонтаж в квартирах и частных домах. Собираю щитки с УЗО, подключаю плиты и кондиционеры, нахожу причину, почему выбивает автоматы.',
    services: [{n: 'Установка розетки или выключателя', p: '80 за шт.'}, {n: 'Сборка щитка', p: '1 500'}, {n: 'Прокладка кабеля', p: '30 за м'}, {n: 'Подключение варочной панели', p: '400'}],
    reviews: [
      {a: 'Дмитрий', r: 5, tags: ['Даёт советы', 'Аккуратно и чисто'], t: 'Собрал щиток с УЗО и всё подписал. Объяснил, какой автомат за что отвечает.', d: '2026-09-27'},
      {a: 'Зарина', r: 5, tags: ['Быстро', 'Вежливый'], t: 'Быстро нашёл, почему выбивало автомат. Вежливый.', d: '2026-09-01'},
      {a: 'Анна', r: 5, tags: ['Аккуратно и чисто'], t: 'Перенёс розетки на кухне под новый гарнитур и заделал штробы.', d: '2026-07-18'}]},
  {id: 'd4', name: 'Игорь Ли', prof: 'Слесарь', district: 'Центр', exp: 15, price: 150, unit: 'за выезд', phone: '+000 90 111 22 04', verified: true, today: true, resp: 5,
    about: 'Вскрываю и меняю замки без повреждения двери, ремонтирую фурнитуру, ставлю доводчики. Выезд по городу за 30–40 минут.',
    services: [{n: 'Вскрытие замка', p: '400'}, {n: 'Замена личинки', p: '300'}, {n: 'Регулировка двери', p: '250'}, {n: 'Установка доводчика', p: '350'}],
    reviews: [
      {a: 'Евгений', r: 5, tags: ['Быстро'], t: 'Открыл дверь за 10 минут без повреждений и сразу поставил новую личинку.', d: '2026-10-15'},
      {a: 'Лола', r: 4, tags: ['Вежливый'], t: 'Всё сделал, но ждать пришлось около двух часов.', d: '2026-08-30'},
      {a: 'Руслан', r: 5, tags: ['Быстро', 'Цена как договорились'], t: 'Приехал ночью, цена та, что назвал по телефону.', d: '2026-07-11'}]},
  {id: 'd5', name: 'Дилшод Юсупов', prof: 'Кафельщик', district: 'Восточный район', exp: 4, price: 90, unit: 'за м²', phone: '+000 90 111 22 05', verified: false, today: true, resp: 60,
    about: 'Плитка в санузлах и на кухнях, фартуки, мозаика. Берусь за небольшие объёмы и замену отдельных плиток.',
    services: [{n: 'Кухонный фартук', p: '100 за м²'}, {n: 'Мозаика', p: '180 за м²'}, {n: 'Плитка на пол', p: '90 за м²'}, {n: 'Замена одной плитки', p: '150'}],
    reviews: [
      {a: 'Светлана', r: 4, tags: ['Цена как договорились'], t: 'Фартук сделал красиво, один ряд пришлось переложить.', d: '2026-09-19'},
      {a: 'Акмал', r: 3, tags: [], t: 'Работает медленно, но цена ниже, чем у других.', d: '2026-08-05'}]},
  {id: 'd6', name: 'Сергей Морозов', prof: 'Маляр', district: 'Западный район', exp: 10, price: 50, unit: 'за м²', phone: '+000 90 111 22 06', verified: true, today: false, resp: 30,
    about: 'Шпаклёвка, покраска стен и потолков, поклейка обоев. Перед работой укрываю мебель и полы плёнкой.',
    services: [{n: 'Покраска стен в 2 слоя', p: '50 за м²'}, {n: 'Шпаклёвка под покраску', p: '70 за м²'}, {n: 'Поклейка обоев', p: '45 за м²'}, {n: 'Покраска потолка', p: '60 за м²'}],
    reviews: [
      {a: 'Гульнара', r: 5, tags: ['Аккуратно и чисто', 'Пунктуальный'], t: 'Покрасил трёхкомнатную квартиру за неделю, ни одного развода.', d: '2026-10-07'},
      {a: 'Максим', r: 5, tags: ['Аккуратно и чисто'], t: 'Чисто и аккуратно, вынес весь мусор.', d: '2026-09-10'},
      {a: 'Нигора', r: 4, tags: ['Вежливый'], t: 'Хорошо, но краску пришлось докупать самим.', d: '2026-07-22'}]},
  {id: 'd7', name: 'Бахтиёр Рахимов', prof: 'Сварщик', district: 'Северный район', exp: 9, price: 300, unit: 'за выезд', phone: '+000 90 111 22 07', verified: false, today: false, resp: 180,
    about: 'Варю ворота, заборы, навесы и решётки. Есть свой генератор, работаю на выезде.',
    services: [{n: 'Ремонт ворот', p: 'от 500'}, {n: 'Навес из профтрубы', p: 'от 3 000'}, {n: 'Решётки на окна', p: 'от 800 за шт.'}],
    reviews: [
      {a: 'Шухрат', r: 5, tags: ['Свой инструмент'], t: 'Сварил навес над машиной за два дня и покрасил.', d: '2026-09-25'},
      {a: 'Владимир', r: 4, tags: [], t: 'Швы крепкие, но выглядят грубовато.', d: '2026-08-16'}]},
  {id: 'd8', name: 'Олег Ким', prof: 'Мастер на час', district: 'Центр', exp: 7, price: 150, unit: 'за час', phone: '+000 90 111 22 08', verified: true, today: true, resp: 15,
    about: 'Сборка мебели, навеска полок, карнизов и телевизоров, мелкий ремонт по дому. Беру с собой дрель, перфоратор и крепёж.',
    services: [{n: 'Сборка шкафа', p: 'от 400'}, {n: 'Навеска телевизора', p: '300'}, {n: 'Установка карниза', p: '200'}, {n: 'Навеска полки', p: '100'}],
    reviews: [
      {a: 'Елена', r: 5, tags: ['Быстро', 'Свой инструмент'], t: 'За два часа собрал шкаф и повесил все полки.', d: '2026-10-12'},
      {a: 'Рустам', r: 5, tags: ['Пунктуальный'], t: 'Приехал минута в минуту.', d: '2026-09-08'},
      {a: 'Кристина', r: 5, tags: ['Даёт советы'], t: 'Повесил телевизор на гипсокартон с правильными дюбелями.', d: '2026-08-02'}]},
  {id: 'd9', name: 'Шерзод Алиев', prof: 'Сантехник', district: 'Южный район', exp: 3, price: 150, unit: 'за выезд', phone: '+000 90 111 22 09', verified: false, today: true, resp: 20,
    about: 'Мелкий сантехнический ремонт: смесители, сифоны, подключение стиральных и посудомоечных машин.',
    services: [{n: 'Подключение стиральной машины', p: '300'}, {n: 'Замена сифона', p: '200'}, {n: 'Замена смесителя', p: '220'}],
    reviews: [{a: 'Марина', r: 4, tags: ['Вежливый'], t: 'Подключил стиральную машину, всё работает.', d: '2026-09-29'}]},
  {id: 'd10', name: 'Анвар Исмоилов', prof: 'Плотник', district: 'Восточный район', exp: 11, price: 200, unit: 'за выезд', phone: '+000 90 111 22 10', verified: true, today: false, resp: 60,
    about: 'Ставлю межкомнатные двери, ремонтирую деревянные полы, делаю лестницы и беседки на заказ.',
    services: [{n: 'Установка межкомнатной двери', p: '700'}, {n: 'Ремонт скрипучего пола', p: 'от 500'}, {n: 'Изготовление полок', p: 'от 400'}],
    reviews: [
      {a: 'Алишер', r: 5, tags: ['Аккуратно и чисто'], t: 'Поставил пять дверей, зазоры одинаковые, наличники ровные.', d: '2026-10-04'},
      {a: 'Татьяна', r: 5, tags: ['Даёт советы'], t: 'Убрал скрип пола в спальне без разборки всего покрытия.', d: '2026-08-26'}]},
  {id: 'd11', name: 'Дмитрий Орлов', prof: 'Электрик', district: 'Центр', exp: 14, price: 100, unit: 'за точку', phone: '+000 90 111 22 11', verified: true, today: true, resp: 20,
    about: 'Электрика под ключ в новостройках: проект, штробление, разводка, щиток. Работаю по ПУЭ и выдаю схему разводки.',
    services: [{n: 'Электрика под ключ', p: 'от 5 000'}, {n: 'Штробление', p: '25 за м'}, {n: 'Установка светильника', p: '150'}, {n: 'Розетка или выключатель', p: '100 за шт.'}],
    reviews: [
      {a: 'Кирилл', r: 5, tags: ['Даёт советы', 'Цена как договорились'], t: 'Сделал электрику в двушке, выдал схему, всё по смете.', d: '2026-10-09'},
      {a: 'Дильноза', r: 5, tags: ['Пунктуальный', 'Аккуратно и чисто'], t: 'Аккуратно и почти без пыли, пылесос у него свой.', d: '2026-09-17'},
      {a: 'Павел', r: 4, tags: ['Быстро'], t: 'Хорошо, но дороже других.', d: '2026-08-08'}]},
  {id: 'd12', name: 'Комил Саидов', prof: 'Маляр', district: 'Северный район', exp: 5, price: 45, unit: 'за м²', phone: '+000 90 111 22 12', verified: false, today: true, resp: 30,
    about: 'Покраска стен и фасадов, поклейка обоев и флизелина. Работаю с напарником, большие объёмы за пару дней.',
    services: [{n: 'Покраска стен', p: '45 за м²'}, {n: 'Поклейка флизелина', p: '50 за м²'}, {n: 'Покраска фасада', p: '70 за м²'}],
    reviews: [
      {a: 'Лейла', r: 5, tags: ['Быстро'], t: 'Поклеили обои в двух комнатах за один день.', d: '2026-10-01'},
      {a: 'Фарход', r: 4, tags: ['Цена как договорились'], t: 'Нормально, швы почти не видно.', d: '2026-09-06'}]}
,
  {id: 'd13', name: 'Сардор Турсунов', prof: 'Автомеханик', district: 'Западный район', exp: 13, price: 150, unit: 'за услугу', phone: '+000 90 111 22 13', verified: true, today: true, resp: 20, brands: ['Chevrolet', 'Toyota', 'Hyundai', 'Kia', 'Lada'],
    about: 'Ремонт легковых машин: диагностика, двигатель, тормоза, подвеска, замена масла. Свой гараж с подъёмником, могу приехать, если машина не заводится.',
    services: [{n: 'Компьютерная диагностика', p: '150'}, {n: 'Замена масла и фильтров', p: '200'}, {n: 'Замена тормозных колодок', p: '300'}, {n: 'Ремонт подвески', p: 'от 500'}],
    reviews: [
      {a: 'Жасур', r: 5, tags: ['Быстро', 'Цена как договорились'], t: 'Нашёл причину стука в подвеске за 20 минут, поменял стойку в тот же день.', d: '2026-10-10'},
      {a: 'Наргиза', r: 5, tags: ['Даёт советы'], t: 'Машина не заводилась, приехал во двор и заменил стартер.', d: '2026-09-21'},
      {a: 'Игорь', r: 4, tags: ['Свой инструмент'], t: 'Хорошо сделал тормоза, но пришлось ждать запчасть два дня.', d: '2026-08-14'}]},
  {id: 'd14', name: 'Виктор Пак', prof: 'Ремонт бытовой техники', district: 'Центр', exp: 16, price: 200, unit: 'за выезд', phone: '+000 90 111 22 14', verified: true, today: true, resp: 30,
    about: 'Ремонтирую стиральные и посудомоечные машины, холодильники, духовки. Оригинальные запчасти, гарантия на ремонт 6 месяцев.',
    services: [{n: 'Диагностика на дому', p: '200'}, {n: 'Замена подшипников стиральной машины', p: '900'}, {n: 'Заправка холодильника', p: '1 200'}, {n: 'Замена ТЭНа', p: '500'}],
    reviews: [
      {a: 'Малика', r: 5, tags: ['Пунктуальный', 'Даёт советы'], t: 'Стиральная машина перестала сливать воду. Починил за час, показал, что было в насосе.', d: '2026-10-08'},
      {a: 'Олег', r: 5, tags: ['Быстро'], t: 'Холодильник снова морозит, всё сделал за один визит.', d: '2026-09-12'}]},
  {id: 'd15', name: 'Азамат Хасанов', prof: 'Мастер по кондиционерам', district: 'Южный район', exp: 7, price: 400, unit: 'за услугу', phone: '+000 90 111 22 15', verified: false, today: true, resp: 15,
    about: 'Установка, чистка и заправка кондиционеров любых марок. Летом записывайтесь заранее.',
    services: [{n: 'Установка кондиционера', p: '1 500'}, {n: 'Чистка кондиционера', p: '400'}, {n: 'Заправка фреоном', p: '700'}],
    reviews: [{a: 'Дильшод', r: 5, tags: ['Аккуратно и чисто'], t: 'Поставил сплит-систему, трассу спрятал в короб, после себя убрал.', d: '2026-08-28'}]},
  {id: 'd16', name: 'Гульнора Ахмедова', prof: 'Уборка', district: 'Северный район', exp: 5, price: 80, unit: 'за час', phone: '+000 90 111 22 16', verified: true, today: false, resp: 60,
    about: 'Генеральная уборка квартир и домов, уборка после ремонта, мытьё окон. Работаем вдвоём, свои средства и инвентарь.',
    services: [{n: 'Генеральная уборка', p: 'от 800'}, {n: 'Уборка после ремонта', p: 'от 1 200'}, {n: 'Мытьё окон', p: '60 за окно'}],
    reviews: [
      {a: 'Светлана', r: 5, tags: ['Аккуратно и чисто', 'Пунктуальный'], t: 'После ремонта квартира сияет, отмыли даже затирку.', d: '2026-10-05'},
      {a: 'Бобур', r: 4, tags: ['Вежливый'], t: 'Хорошо, но закончили на час позже.', d: '2026-09-02'}]},
  {id: 'd17', name: 'Руслан Ибрагимов', prof: 'Окна и двери ПВХ', district: 'Восточный район', exp: 9, price: 300, unit: 'за услугу', phone: '+000 90 111 22 17', verified: true, today: true, resp: 30,
    about: 'Установка и ремонт пластиковых окон и дверей ПВХ, регулировка фурнитуры, москитные сетки, откосы и подоконники.',
    services: [{n: 'Регулировка окна', p: '300'}, {n: 'Установка окна ПВХ', p: 'от 1 500'}, {n: 'Москитная сетка', p: '400'}, {n: 'Откосы', p: '250 за м'}],
    reviews: [{a: 'Феруза', r: 5, tags: ['Быстро', 'Аккуратно и чисто'], t: 'Отрегулировал все окна, больше не дует.', d: '2026-10-03'}]},
  {id: 'd18', name: 'Тимур Юлдашев', prof: 'Мастер по электромобилям', district: 'Центр', exp: 6, price: 300, unit: 'за услугу', phone: '+000 90 111 22 18', verified: true, today: true, resp: 15, brands: ['BYD', 'Zeekr', 'Tesla', 'Li Auto', 'Leapmotor', 'Chery'],
    about: 'Обслуживаю электромобили и гибриды: BYD Song, Han, Chazor, Zeekr 001, Tesla Model 3 и Y, Li Auto. Диагностика батареи, прошивка, русификация, установка зарядных станций.',
    services: [{n: 'Диагностика электромобиля', p: '300'}, {n: 'Проверка высоковольтной батареи', p: '600'}, {n: 'Русификация и прошивка', p: 'от 800'}, {n: 'Установка домашней зарядки', p: 'от 1 500'}],
    reviews: [
      {a: 'Шерзод', r: 5, tags: ['Даёт советы', 'Пунктуальный'], t: 'BYD Song Plus выдавал ошибку батареи. Нашёл причину в датчике, починил за день.', d: '2026-10-14'},
      {a: 'Алина', r: 5, tags: ['Быстро'], t: 'Русифицировал Zeekr и поставил зарядку дома.', d: '2026-09-26'},
      {a: 'Рустам', r: 4, tags: ['Свой инструмент'], t: 'Хорошо разбирается в Tesla, но запись на неделю вперёд.', d: '2026-08-30'}]},
  {id: 'd19', name: 'Олим Рашидов', prof: 'Автомеханик', district: 'Северный район', exp: 18, price: 120, unit: 'за услугу', phone: '+000 90 111 22 19', verified: true, today: true, resp: 30, brands: ['Chevrolet'],
    about: 'Только Chevrolet: Cobalt, Gentra, Nexia, Spark, Malibu, Tracker, Onix. Двигатель, коробка, подвеска. Оригинальные запчасти GM.',
    services: [{n: 'Замена масла', p: '120'}, {n: 'Ремонт двигателя Cobalt/Gentra', p: 'от 2 000'}, {n: 'Замена ремня ГРМ', p: '600'}, {n: 'Ремонт подвески', p: 'от 400'}],
    reviews: [
      {a: 'Улугбек', r: 5, tags: ['Цена как договорились'], t: 'Cobalt как новый после ремонта двигателя.', d: '2026-10-06'},
      {a: 'Дилноза', r: 5, tags: ['Быстро', 'Даёт советы'], t: 'Поменял ГРМ на Gentra за полдня.', d: '2026-09-15'}]}
].map(m => Object.assign(m, {demo: true, source: 'demo', schedule: DEMO_SCHED[m.id], reviews: m.reviews.map(r => Object.assign(r, {createdAt: Date.parse(r.d + 'T12:00:00')}))}));

const DEMO_JOBS = [
  {id: 'j1', cat: 'Кафельщик', title: 'Положить плитку в ванной, 6 м²', desc: 'Стены и пол, плитка 30×60 уже куплена. Старую плитку сняли, стены выровнены.', district: 'Центр', budget: 900, when: 'На этой неделе', name: 'Мадина', phone: '+000 90 222 33 01', createdAt: NOW - 40 * 6e4,
    responses: [{name: 'Рустам К.', price: 850, msg: 'Могу начать в четверг, работа займёт два дня.', phone: '+000 90 111 22 01', at: NOW - 25 * 6e4}, {name: 'Дилшод Ю.', price: 700, msg: 'Свободен завтра с утра.', phone: '+000 90 111 22 05', at: NOW - 9 * 6e4}]},
  {id: 'j2', cat: 'Слесарь', title: 'Захлопнулась входная дверь', desc: 'Ключи остались внутри, замок цилиндровый. Нужно открыть без повреждений.', district: 'Восточный район', budget: 400, when: 'Срочно', name: 'Тимур', phone: '+000 90 222 33 03', createdAt: NOW - 12 * 6e4, responses: []},
  {id: 'j3', cat: 'Сантехник', title: 'Течёт смеситель на кухне', desc: 'Капает из-под гайки. Смеситель новый, нужно переустановить и проверить шланги.', district: 'Северный район', budget: 300, when: 'Сегодня', name: 'Ирина', phone: '+000 90 222 33 02', createdAt: NOW - 2.2 * 36e5,
    responses: [{name: 'Алексей В.', price: 250, msg: 'Буду через час, шланги привезу.', phone: '+000 90 111 22 02', at: NOW - 1.6 * 36e5}]},
  {id: 'j4', cat: 'Электрик', title: 'Перенести три розетки на кухне', desc: 'Под новый гарнитур. Стены бетонные, после работы нужно заделать штробы.', district: 'Южный район', budget: null, when: 'На этой неделе', name: 'Анна', phone: '+000 90 222 33 04', createdAt: NOW - 5 * 36e5, responses: []},
  {id: 'j5', cat: 'Мастер на час', title: 'Собрать шкаф-купе и повесить две полки', desc: 'Шкаф шириной два метра, инструкция есть. Полки вешать на гипсокартон.', district: 'Западный район', budget: 600, when: 'Не спешу', name: 'Олег', phone: '+000 90 222 33 05', createdAt: NOW - 26 * 36e5,
    responses: [{name: 'Олег К.', price: 550, msg: 'Могу в субботу утром, крепёж для гипсокартона привезу.', phone: '+000 90 111 22 08', at: NOW - 20 * 36e5}]}
].map(j => Object.assign(j, {demo: true, source: 'demo', status: 'open'}));

/* ---------- хранилище: браузер ---------- */
const LS = 'masterRyadom.v2';
function loadLocal() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { s = null; }
  if (!s || typeof s !== 'object') s = {};
  const out = Object.assign({masters: [], reviews: [], jobs: [], requests: [], favs: [], msgs: [], respExtra: {}, responded: {}, chatSeen: {}, bkOverride: {}, blocked: {}, clientId: null, showDemo: true, draft: null, me: null, migrated: false}, s);
  if (!out.blocked || typeof out.blocked !== 'object') out.blocked = {};
  if (!out.bkOverride || typeof out.bkOverride !== 'object') out.bkOverride = {};
  ['masters', 'reviews', 'jobs', 'requests', 'favs', 'msgs', 'works'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
  if (!out.chatSeen || typeof out.chatSeen !== 'object') out.chatSeen = {};
  if (!out.respExtra || typeof out.respExtra !== 'object') out.respExtra = {};
  if (!out.responded || typeof out.responded !== 'object') out.responded = {};
  if (!out.migrated) {
    try {
      const v1 = JSON.parse(localStorage.getItem('masterRyadom.v1') || 'null');
      if (v1 && Array.isArray(v1.added)) {
        v1.added.forEach(m => {
          if (!m || !m.id || out.masters.some(x => x.id === m.id)) return;
          out.masters.push({id: m.id, name: m.name, prof: m.prof, district: m.district || '', exp: m.exp || 0, price: m.price || 0, unit: m.unit || 'за выезд', phone: m.phone || '', about: m.about || '', verified: false, today: false, resp: 60,
            services: (m.services || []).map(x => Array.isArray(x) ? {n: x[0], p: x[1]} : x).filter(x => x && x.n), createdAt: Date.now()});
        });
      }
      if (v1 && v1.reviews && typeof v1.reviews === 'object') {
        Object.keys(v1.reviews).forEach(mid => (v1.reviews[mid] || []).forEach(r => { if (r && r.r) out.reviews.push({id: uid('r'), masterId: mid, a: r.a || 'Гость', r: r.r, t: r.t || '', tags: [], createdAt: Date.parse(r.d) || Date.now()}); }));
      }
    } catch (e) { /* старых данных нет */ }
    out.migrated = true;
  }
  return out;
}
const local = loadLocal();
const USE_3D = local.bg3d === 'on' || (local.bg3d !== 'off' && !LITE_DEVICE && !REDUCE);
document.documentElement.classList.toggle('lite', !USE_3D);
let warnedQuota = false;
function saveLocal() {
  try { localStorage.setItem(LS, JSON.stringify(local)); return true; }
  catch (e) { if (!warnedQuota) { warnedQuota = true; toast('Браузер не сохранил данные: закончилось место. Уберите часть фото.', 'warn'); } return false; }
}

/* ---------- хранилище: общая база ---------- */
const shared = {db: null, on: false, canWrite: false, uid: null, masters: [], reviews: [], jobs: [], messages: [], responses: [], works: []};

/* ---------- настоящая база (Firebase) ----------
   Включается, когда в config.js заполнен window.MR_CONFIG.firebase. Без него сайт работает в демо-режиме.
   Что можно читать и писать, решает сервер по правилам firestore.rules: код страницы можно подменить, правила — нет. */
const CFG = window.MR_CONFIG || {};
const FB = {on: false, auth: null, user: null, contacts: {}, loading: new Set(), unsub: [], rc: null, confirm: null};
const fsTime = v => v && typeof v.toMillis === 'function' ? v.toMillis() : v;
const TS = () => firebase.firestore.FieldValue.serverTimestamp();
const fbImg = v => { const x = validImg(v); return x && x.length < 290000 && /^data:image\/(jpeg|png|webp);/.test(x) ? x : null; };
function fromDoc(d) {
  const x = d.data({serverTimestamps: 'estimate'}) || {};
  ['at', 'createdAt', 'updatedAt', 'decidedAt'].forEach(k => { if (k in x) x[k] = fsTime(x[k]); });
  return Object.assign(x, {id: d.id, source: 'shared'});
}
function fbListen(name, q, map) {
  return q.onSnapshot(snap => { shared[name] = snap.docs.map(d => map ? map(fromDoc(d)) : fromDoc(d)); invalidate(); },
    err => console.warn('База:', name, err && err.code));
}
function fbErrText(e) {
  const c = e && e.code;
  if (c === 'permission-denied') return 'Сервер не принял изменения. Проверьте данные или войдите заново.';
  if (c === 'unavailable' || c === 'deadline-exceeded') return 'Нет связи с сервером. Проверьте интернет и попробуйте снова.';
  if (c === 'resource-exhausted') return 'Слишком много запросов. Подождите минуту.';
  if (c === 'unauthenticated') return 'Войдите по номеру телефона.';
  return 'Не получилось сохранить. Попробуйте ещё раз.';
}
async function initFirebase() {
  if (!window.firebase) {
    try { await Promise.all(['app', 'app-check', 'auth', 'firestore'].map(f => loadScript('firebase-' + f + '-compat.js'))); }
    catch (e) { console.warn(e.message); }
  }
  if (!window.firebase || typeof firebase.initializeApp !== 'function') { console.warn('Firebase SDK не загружен (папка vendor)'); renderStatus(); return; }
  try {
    firebase.initializeApp(CFG.firebase);
    if (CFG.appCheckSiteKey && firebase.appCheck) firebase.appCheck().activate(new firebase.appCheck.ReCaptchaV3Provider(CFG.appCheckSiteKey), true);
    FB.auth = firebase.auth();
    FB.auth.useDeviceLanguage();
    shared.db = firebase.firestore();
    // Для проверки на своём компьютере: firebase emulators:start (работает только на localhost)
    if (CFG.useEmulators && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { FB.auth.useEmulator('http://127.0.0.1:9099'); FB.auth.settings.appVerificationDisabledForTesting = true; shared.db.useEmulator('127.0.0.1', 8080); }
  } catch (e) { console.warn('Firebase:', e && e.message); renderStatus(); return; }
  FB.on = true; shared.on = true; shared.canWrite = false;
  if (CFG.showDemo === false) local.showDemo = false;
  const db = shared.db;
  fbListen('masters', db.collection('masters').limit(1000));
  fbListen('reviews', db.collection('reviews').limit(3000));
  fbListen('jobs', db.collection('jobs').where('status', '==', 'open').limit(300));
  fbListen('works', db.collection('works').limit(1000));
  FB.auth.onAuthStateChanged(onFbUser);
  renderStatus();
}
async function onFbUser(user) {
  FB.unsub.forEach(f => { try { f(); } catch (e) { /* уже отписаны */ } });
  FB.unsub = []; FB.contacts = {}; FB.loading.clear();
  FB.user = user || null; shared.uid = user ? user.uid : null;
  shared.canWrite = !!(user && user.phoneNumber);
  shared.messages = []; shared.responses = [];
  if (user) {
    const db = shared.db;
    FB.unsub.push(fbListen('messages', db.collection('messages').where('participants', 'array-contains', user.uid).limit(2000), x => Object.assign(x, {clientKey: x.clientUid})));
    FB.unsub.push(fbListen('responses', db.collection('responses').where('participants', 'array-contains', user.uid).limit(500)));
    try {
      const snap = await db.collection('users').doc(user.uid).get();
      const d = snap.exists ? snap.data() : null;
      if (d && typeof d.name === 'string') {
        local.me = Object.assign({}, local.me, {name: d.name.slice(0, 40), phone: user.phoneNumber || '', about: String(d.about || '').slice(0, 400), avatar: validImg(d.avatar), role: d.role === 'master' ? 'master' : 'client', createdAt: fsTime(d.createdAt) || Date.now(), registered: true});
        local.loggedOut = false;
      }
    } catch (e) { console.warn('Профиль:', e && e.code); }
  } else if (local.me) {
    local.me = null;
  }
  saveLocal(); updateMeBtn(); invalidate(); renderStatus();
  if (user) {
    syncPush();
    if (OPEN_CHAT) { const th = OPEN_CHAT; OPEN_CHAT = null; setTimeout(() => { if (isRegistered()) openChat(null, th); }, 600); }
  }
}
/* Нажали на уведомление: ./?chat=<id диалога> */
let OPEN_CHAT = (() => { try { const p = new URLSearchParams(location.search), c = p.get('chat'); if (c) { p.delete('chat'); history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '') + location.hash); } return c && /^[\w-]{1,200}$/.test(c) ? c : null; } catch (e) { return null; } })();
function fbFetchContact(coll, id, key, attempt) {
  if (!FB.user || FB.loading.has(key) || FB.contacts[key] !== undefined) return;
  FB.loading.add(key);
  const uidNow = FB.user.uid;
  shared.db.collection(coll).doc(id).get()
    .then(snap => { if (FB.user && FB.user.uid === uidNow) FB.contacts[key] = snap.exists ? String(snap.data().phone || '') : ''; }, e => {
      // Отклик мог ещё не дойти до сервера: пробуем ещё пару раз
      if (e && e.code === 'permission-denied' && (attempt || 0) < 3) { setTimeout(() => fbFetchContact(coll, id, key, (attempt || 0) + 1), 1200 * ((attempt || 0) + 1)); return; }
      FB.contacts[key] = ''; console.warn('Контакт:', e && e.code);
    })
    .then(() => { FB.loading.delete(key); invalidate(); });
}
/* Телефон мастера: в настоящей базе он лежит отдельно и виден только тем, кто вошёл по СМС */
function phoneOf(m) {
  if (!m) return '';
  if (!(FB.on && m.source === 'shared')) return m.phone || '';
  fbFetchContact('masterContacts', m.id, m.id);
  return FB.contacts[m.id] || '';
}
function jobPhone(j) {
  if (!(FB.on && j.source === 'shared')) return j.phone || '';
  fbFetchContact('jobContacts', j.id, 'job:' + j.id);
  return FB.contacts['job:' + j.id] || '';
}
const iResponded = j => !!local.responded[j.id] || (FB.on && shared.responses.some(r => r.jobId === j.id && r.responderUid === shared.uid));

async function initShared() {
  if (CFG.firebase) { initFirebase(); return; }
  if (!window.claude || typeof window.claude.use !== 'function') { renderStatus(); return; }
  let db = null, user = null;
  try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch (e) { db = null; }
  if (!db) { renderStatus(); return; }
  shared.db = db; shared.on = true;
  try { shared.uid = user ? await user.id() : null; } catch (e) { shared.uid = null; }
  let cw = null;
  try { cw = user ? await user.can('data.write') : null; } catch (e) { cw = null; }
  shared.canWrite = cw !== false;
  loadAccount();
  ['masters', 'reviews', 'jobs', 'messages'].forEach(name => {
    try {
      db.collection(name).onSnapshot(snap => {
        shared[name] = snap.docs.map(d => Object.assign({}, d.data(), {id: d.id, source: 'shared'}));
        invalidate();
      }, err => { console.warn('Общая база:', name, err && err.code); });
    } catch (e) { console.warn(e); }
  });
  renderStatus();
}
async function sharedWrite(fn) {
  if (FB.on) {
    if (!FB.user) { toast('Войдите по номеру телефона', 'warn'); return false; }
    try { await fn(shared.db); return true; }
    catch (e) { console.warn('Запись в базу:', e && e.code); toast(fbErrText(e), 'warn'); return false; }
  }
  if (!(shared.on && shared.canWrite)) return false;
  try { await fn(shared.db); return true; }
  catch (e) {
    const code = e && e.code;
    if (code === 'unavailable') {
      try { await new Promise(r => setTimeout(r, 400 + Math.random() * 500)); await fn(shared.db); return true; } catch (e2) { /* дальше сохраним в браузере */ }
    } else if (code === 'quota_exceeded') {
      toast('Общая база заполнена. Запись сохранена в этом браузере.', 'warn');
    } else {
      shared.canWrite = false; renderStatus();
    }
    return false;
  }
}

/* ---------- производные данные ---------- */
let _masters = null;
function enrich(m) {
  const ext = shared.reviews.concat(local.reviews).filter(r => r && r.masterId === m.id);
  const own = Array.isArray(m.reviews) ? m.reviews : [];
  const reviews = ext.concat(own).filter(r => r && r.r >= 1 && r.r <= 5).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const n = reviews.length;
  const avg = n ? reviews.reduce((s, r) => s + Number(r.r), 0) / n : 0;
  const tc = {};
  reviews.forEach(r => (Array.isArray(r.tags) ? r.tags : []).forEach(t => { tc[t] = (tc[t] || 0) + 1; }));
  const tags = Object.keys(tc).map(t => ({t, c: tc[t]})).sort((a, b) => b.c - a.c);
  const services = Array.isArray(m.services) ? m.services.filter(s => s && s.n) : [];
  const brands = Array.isArray(m.brands) ? m.brands.filter(b => BRAND[b]) : [];
  const hay = norm([m.name, m.prof, m.district, m.about].concat(services.map(s => s.n), brands).join(' '));
  return Object.assign({}, m, {services, brands, reviews, n, avg, tags, score: (avg * n + 4.3 * 2) / (n + 2), _hay: hay, price: Number(m.price) || 0, exp: Number(m.exp) || 0});
}
function masters() {
  if (_masters) return _masters;
  const base = shared.masters.concat(local.masters.map(m => Object.assign({}, m, {source: 'local'})), local.showDemo ? DEMO_MASTERS : []);
  const seen = new Set(), out = [];
  base.forEach(m => { if (!m || !m.id || !m.name || seen.has(m.id)) return; seen.add(m.id); out.push(enrich(m)); });
  _masters = out;
  return out;
}
const getMaster = id => masters().find(m => m.id === id) || null;
const isMine = m => m && (m.source === 'local' || (m.source === 'shared' && shared.uid && m.ownerUid === shared.uid));
function jobsAll() {
  const base = shared.jobs.concat(local.jobs.map(j => Object.assign({}, j, {source: 'local'})), local.showDemo ? DEMO_JOBS : []);
  return base.filter(j => j && j.id && j.title).map(j => Object.assign({}, j, {responses: (Array.isArray(j.responses) ? j.responses : []).concat(local.respExtra[j.id] || [], FB.on ? shared.responses.filter(r => r.jobId === j.id) : [])})).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
const isMineJob = j => j && (j.source === 'local' || (j.source === 'shared' && shared.uid && j.ownerUid === shared.uid));
function priceStats(prof, unit) {
  const ps = masters().filter(m => m.prof === prof && m.unit === unit && m.price > 0).map(m => m.price).sort((a, b) => a - b);
  if (!ps.length) return null;
  const mid = Math.floor(ps.length / 2);
  return {min: ps[0], max: ps[ps.length - 1], med: ps.length % 2 ? ps[mid] : (ps[mid - 1] + ps[mid]) / 2, n: ps.length};
}
let renderQueued = false;
function invalidate() {
  _masters = null;
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => { renderQueued = false; renderAll(); });
}

/* ---------- уведомления ---------- */
function toast(msg, kind) {
  const box = $('#toasts'); if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast' + (kind ? ' ' + kind : '');
  t.innerHTML = icon(kind === 'warn' ? 'info' : 'check') + '<span></span>';
  t.querySelector('span').textContent = msg;
  box.appendChild(t);
  while (box.children.length > 3) box.firstElementChild.remove();
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 3200);
}
async function copyText(text, el) {
  try { await navigator.clipboard.writeText(text); toast('Номер скопирован'); }
  catch (e) {
    if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    toast('Номер выделен, скопируйте его вручную', 'warn');
  }
}
function tween(el, to, dec) {
  if (!el) return;
  dec = dec || 0;
  const from = Number(el.dataset.v || 0);
  el.dataset.v = String(to);
  if (REDUCE || !isFinite(from) || Math.abs(from - to) < 1e-9) { el.textContent = fmtN(to, dec); return; }
  const t0 = performance.now(), id = (el._tw = (el._tw || 0) + 1), dur = 700;
  const step = now => {
    if (el._tw !== id) return;
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmtN(from + (to - from) * e, dec);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- модальные окна ---------- */
const Modal = (() => {
  const root = $('#modal-root');
  let lastFocus = null, kind = null, onClose = null, closeT = 0;
  const calm = () => REDUCE || document.documentElement.classList.contains('calm');
  function open(html, opts) {
    opts = opts || {};
    const swap = !root.hidden && !root.classList.contains('closing');
    const keepFocus = swap ? lastFocus : null;
    clearTimeout(closeT); root.classList.remove('closing');
    if (!root.hidden) finish(true);
    lastFocus = keepFocus || document.activeElement;
    kind = opts.kind || null; onClose = opts.onClose || null;
    root.innerHTML = '<div class="modal-ov' + (swap ? ' still' : '') + '" data-close></div><div class="modal' + (opts.wide ? ' wide' : '') + (swap ? ' swap' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.label || '') + '"><div class="modal-bar"><button class="icon-btn" type="button" data-close aria-label="Закрыть">' + icon('close') + '</button></div><div class="modal-body">' + html + '</div></div>';
    root.hidden = false;
    document.documentElement.classList.add('modal-open');
    const btn = root.querySelector('.modal-bar .icon-btn');
    if (btn) btn.focus({preventScroll: true});
    return root.querySelector('.modal');
  }
  /* Закрытие с анимацией: окно уезжает и тает, потом убирается из страницы. */
  function close(silent) {
    if (root.hidden) return;
    if (silent || calm()) { clearTimeout(closeT); root.classList.remove('closing'); finish(silent); return; }
    if (root.classList.contains('closing')) return;
    root.classList.add('closing');
    closeT = setTimeout(() => { root.classList.remove('closing'); finish(false); }, 240);
  }
  function finish(silent) {
    if (root.hidden) return;
    root.hidden = true; root.innerHTML = '';
    document.documentElement.classList.remove('modal-open');
    const oc = onClose; onClose = null; kind = null;
    if (oc) oc();
    if (!silent && lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus({preventScroll: true});
  }
  root.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) return;
    if (e.key === 'Escape') { const lb = $('.lb'); if (lb) { lb.remove(); return; } close(); return; }
    if (e.key === 'Tab') {
      const m = root.querySelector('.modal'); if (!m) return;
      const f = $$('a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled])', m).filter(el => el.getClientRects().length);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  return {open, close, get kind() { return kind; }, root};
})();

/* ---------- 3D-сцена: пол из плитки ---------- */
const BITMAPS = {
  star: ['......#......', '.....###.....', '.....###.....', '....#####....', '#############', '.###########.', '..#########..', '...#######...', '...#######...', '..####.####..', '..###...###..', '.###.....###.', '.#.........#.'],
  check: ['.............', '.............', '...........##', '..........###', '.........###.', '........###..', '##.....###...', '###...###....', '.###.###.....', '..#####......', '...###.......', '....#........', '.............'],
  pin: ['....#####....', '..#########..', '.###########.', '.####...####.', '####.....####', '####.....####', '.####...####.', '.###########.', '..#########..', '...#######...', '....#####....', '.....###.....', '......#......'],
  bars: ['.............', '..........##.', '..........##.', '..........##.', '.......##.##.', '.......##.##.', '.......##.##.', '....##.##.##.', '....##.##.##.', '.##.##.##.##.', '.##.##.##.##.', '.##.##.##.##.', '.##.##.##.##.']
};
const Scene = (() => {
  const api = {setMode() {}, setScroll() {}};
  const canvas = $('#bg3d');
  const fail = () => { document.documentElement.classList.add('no3d'); return api; };
  if (!canvas || !USE_3D) return fail();
  // Пока библиотека грузится, запоминаем последние команды
  const pend = {};
  api.setMode = n => { pend.mode = n; };
  api.setScroll = (y, h) => { pend.scroll = [y, h]; };
  loadScript('three.min.js').then(() => {
    build();
    if (pend.mode) api.setMode(pend.mode);
    if (pend.scroll) api.setScroll(pend.scroll[0], pend.scroll[1]);
  }, fail);
  return api;
  function build() {
  const T = window.THREE;
  if (!T) return fail();
  try {
    let renderer;
    try { renderer = new T.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'}); } catch (e) { return fail(); }
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(32, 1, 0.1, 300);
    const group = new T.Group(); scene.add(group);
    const TAN = Math.tan(16 * Math.PI / 180);
    const small = Math.min(innerWidth, innerHeight) < 700;

    const sh = new T.Shape(), hw = 0.4, rr = 0.12;
    sh.moveTo(-hw + rr, -hw); sh.lineTo(hw - rr, -hw); sh.quadraticCurveTo(hw, -hw, hw, -hw + rr);
    sh.lineTo(hw, hw - rr); sh.quadraticCurveTo(hw, hw, hw - rr, hw);
    sh.lineTo(-hw + rr, hw); sh.quadraticCurveTo(-hw, hw, -hw, hw - rr);
    sh.lineTo(-hw, -hw + rr); sh.quadraticCurveTo(-hw, -hw, -hw + rr, -hw);
    const geo = new T.ExtrudeGeometry(sh, {depth: 0.16, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: small ? 1 : 2, curveSegments: small ? 2 : 3});
    geo.center();

    const MAXC = 48, MAXR = 46, MAX = MAXC * MAXR;
    const mat = new T.MeshStandardMaterial({color: 0xffffff, roughness: 0.22, metalness: 0.02});
    const mesh = new T.InstancedMesh(geo, mat, MAX);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    const colArr = new Float32Array(MAX * 3).fill(1);
    mesh.instanceColor = new T.InstancedBufferAttribute(colArr, 3);
    if (mesh.instanceColor.setUsage) mesh.instanceColor.setUsage(T.DynamicDrawUsage);
    mesh.frustumCulled = false;
    group.add(mesh);
    const groutMat = new T.MeshStandardMaterial({color: 0x888888, roughness: 0.95, metalness: 0});
    const grout = new T.Mesh(new T.PlaneGeometry(MAXC + 70, MAXR + 70), groutMat);
    grout.position.z = -1.7; group.add(grout);

    const hemi = new T.HemisphereLight(0xffffff, 0x777777, 0.6); scene.add(hemi);
    const key = new T.DirectionalLight(0xffffff, 0.7); key.position.set(-8, 12, 16); scene.add(key);
    const torch = new T.PointLight(0xffc070, 1.4, 14, 2); scene.add(torch);
    const rim = new T.PointLight(0x40c0a0, 0.6, 46, 2); scene.add(rim);
    const pmrem = new T.PMREMGenerator(renderer);
    let envRT = null;

    const gx = new Float32Array(MAX), gy = new Float32Array(MAX), rnd = new Float32Array(MAX);
    const cz = new Float32Array(MAX), crx = new Float32Array(MAX), cry = new Float32Array(MAX), crz = new Float32Array(MAX);
    const rate = new Float32Array(MAX), sc = new Float32Array(MAX), vr = new Float32Array(MAX), acc = new Uint8Array(MAX);
    for (let i = 0; i < MAX; i++) {
      rnd[i] = Math.random(); cz[i] = 0.4 + Math.random() * 2.6;
      crx[i] = (Math.random() - 0.5) * 1.8; cry[i] = (Math.random() - 0.5) * 1.8; crz[i] = (Math.random() - 0.5) * 2.6;
      rate[i] = 1.6 + Math.random() * 2.6; vr[i] = Math.pow(Math.random(), 3);
      acc[i] = Math.random() < 0.035 ? (Math.random() < 0.5 ? 1 : 2) : 0;
    }
    const shapeArr = {}; Object.keys(BITMAPS).forEach(k => { shapeArr[k] = new Float32Array(MAX); });
    const zero = new Float32Array(MAX);
    let shapeT = zero, cols = 48, rows = 40, count = cols * rows, scl = 1;

    const SHAPE_ROT = -0.42;
    const MODES = {
      wave: {amp: 0.72, chaos: 0, rotX: -1.0, rotZ: 0.16, cam: 30, shape: null, mosaic: 1},
      chaos: {amp: 0.25, chaos: 1, rotX: -0.8, rotZ: 0.05, cam: 31, shape: null, mosaic: 0.7},
      check: {amp: 0.1, chaos: 0, rotX: SHAPE_ROT, rotZ: 0, cam: 's', shape: 'check', mosaic: 0.2},
      star: {amp: 0.1, chaos: 0, rotX: SHAPE_ROT, rotZ: 0, cam: 's', shape: 'star', mosaic: 0.2},
      bars: {amp: 0.1, chaos: 0, rotX: SHAPE_ROT, rotZ: 0, cam: 's', shape: 'bars', mosaic: 0.2},
      pin: {amp: 0.14, chaos: 0, rotX: SHAPE_ROT, rotZ: 0, cam: 's', shape: 'pin', mosaic: 0.2},
      ambient: {amp: 0.55, chaos: 0, rotX: -1.08, rotZ: 0.16, cam: 30, shape: null, mosaic: 1}
    };
    let target = MODES.wave;
    const st = {t: 0, amp: 0.72, chaos: 0, rotX: -1.0, rotZ: 0.16, cam: 30, mosaic: 1, scroll: 0, scrollT: 0, mode: 'wave', hov: 0};
    const C = {base: [1, 1, 1], vari: [1, 1, 1], shape: [0, 0.5, 0.4], acc1: [0, 0.5, 0.4], acc2: [0.6, 0.4, 0.1], hover: [0.6, 0.4, 0.1]};
    let minOpacity = 0.55;

    const isDark = () => { const t = document.documentElement.getAttribute('data-theme'); if (t) return ['dark', 'black', 'ocean'].indexOf(t) >= 0; return matchMedia('(prefers-color-scheme: dark)').matches; };
    const shapeCamD = () => { const a = innerWidth / Math.max(1, innerHeight); return Math.max(34, (6.5 * scl + 0.6) / (0.82 * TAN * a)); };
    function shapeCenter() {
      const side = innerWidth >= 900, a = innerWidth / Math.max(1, innerHeight);
      const nx = side ? 0.43 : 0, ny = side ? 0.04 : 0.44, th = SHAPE_ROT, D = shapeCamD(), k = scl;
      const y = ny * D * TAN / (k * (Math.cos(th) + ny * TAN * Math.sin(th)));
      const dist = D - k * y * Math.sin(th);
      return {x: nx * dist * TAN * a / k, y};
    }
    function computeShapes() {
      const c0 = shapeCenter();
      const fx = ((cols - 1) / 2) % 1, fy = ((rows - 1) / 2) % 1;
      const cx = Math.round(c0.x - fx) + fx, cy = Math.round(c0.y - fy) + fy;
      Object.keys(BITMAPS).forEach(k => {
        const bm = BITMAPS[k], bh = bm.length, bw = bm[0].length, arr = shapeArr[k];
        arr.fill(0);
        for (let i = 0; i < count; i++) {
          const c = Math.round(gx[i] - cx + (bw - 1) / 2), r = Math.round(cy - gy[i] + (bh - 1) / 2);
          if (r >= 0 && r < bh && c >= 0 && c < bw && bm[r].charAt(c) === '#') arr[i] = 1;
        }
      });
    }
    function layout() {
      const a = innerWidth / Math.max(1, innerHeight);
      if (a >= 1.15) { cols = 48; rows = 40; scl = 1; } else if (a >= 0.8) { cols = 40; rows = 44; scl = 0.8; } else { cols = 28; rows = 46; scl = 0.55; }
      count = cols * rows; mesh.count = count;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const i = r * cols + c; gx[i] = c - (cols - 1) / 2; gy[i] = r - (rows - 1) / 2; }
      computeShapes();
    }
    function buildEnv(dark, brassHex) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 256;
      const g = c.getContext('2d');
      const grd = g.createLinearGradient(0, 0, 0, 256);
      if (dark) { grd.addColorStop(0, '#2b3e3f'); grd.addColorStop(0.5, '#0c1516'); grd.addColorStop(1, '#030606'); }
      else { grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.5, '#e7efed'); grd.addColorStop(1, '#a3b4b0'); }
      g.fillStyle = grd; g.fillRect(0, 0, 512, 256);
      g.fillStyle = dark ? 'rgba(255,255,255,.5)' : '#ffffff';
      g.fillRect(60, 28, 120, 42); g.fillRect(300, 22, 150, 34);
      g.globalAlpha = dark ? 0.85 : 0.4; g.fillStyle = brassHex; g.fillRect(205, 78, 70, 32); g.globalAlpha = 1;
      const tex = new T.CanvasTexture(c);
      tex.encoding = T.sRGBEncoding;
      const rt = pmrem.fromEquirectangular(tex);
      tex.dispose();
      return rt;
    }
    function applyTheme() {
      const cs = getComputedStyle(document.documentElement);
      const get = n => (cs.getPropertyValue(n) || '').trim() || '#888888';
      const lin = hex => new T.Color(hex).convertSRGBToLinear();
      const dark = isDark();
      const bg = lin(get('--bg')), tile = lin(get('--tile')), vari = lin(get('--tile-var')), gr = lin(get('--grout')), ac = lin(get('--accent')), br = lin(get('--brass'));
      C.base = [tile.r, tile.g, tile.b]; C.vari = [vari.r, vari.g, vari.b];
      C.acc1 = [ac.r, ac.g, ac.b]; C.acc2 = [br.r, br.g, br.b];
      C.shape = dark ? [br.r * 1.35, br.g * 1.35, br.b * 1.35] : [ac.r, ac.g, ac.b];
      C.hover = dark ? [br.r * 1.2, br.g * 1.2, br.b * 1.2] : [br.r, br.g, br.b];
      groutMat.color.copy(gr);
      if (!scene.fog) scene.fog = new T.Fog(bg, 26, 48); else scene.fog.color.copy(bg);
      hemi.color.set(dark ? 0x5a7a78 : 0xffffff); hemi.groundColor.set(dark ? 0x020404 : 0x6f8682); hemi.intensity = dark ? 0.55 : 0.5;
      key.intensity = dark ? 0.35 : 0.85;
      key.position.set(dark ? -8 : -15, dark ? 12 : 7, dark ? 16 : 9);
      torch.color.set(get('--brass')); torch.intensity = dark ? 2.4 : 1.2;
      rim.color.set(get('--accent')); rim.intensity = dark ? 1.1 : 0.4;
      mat.roughness = dark ? 0.3 : 0.22; mat.envMapIntensity = dark ? 0.7 : 0.95;
      try { const nrt = buildEnv(dark, get('--brass')); if (envRT) envRT.dispose(); envRT = nrt; scene.environment = envRT.texture; } catch (e) { /* без отражений */ }
      minOpacity = dark ? 0.72 : 0.55;
      if (REDUCE) renderStatic();
    }

    const ptr = {nx: 0, ny: 0, has: false, last: -10, kick: false};
    const ndc = new T.Vector2(), ray = new T.Raycaster(), plane = new T.Plane(), nrm = new T.Vector3(), hit = new T.Vector3(), loc = new T.Vector3(), tv = new T.Vector3(), q = new T.Quaternion(), origin = new T.Vector3();
    const hp = {x: 0, y: 0};
    const ripples = [];
    const lastRip = {x: 1e9, y: 1e9, t: -1};
    const camPos = {x: 0, y: 0};
    addEventListener('pointermove', e => { ptr.nx = e.clientX / innerWidth * 2 - 1; ptr.ny = -(e.clientY / innerHeight * 2 - 1); ptr.has = true; ptr.last = st.t; }, {passive: true});
    addEventListener('pointerdown', e => { ptr.nx = e.clientX / innerWidth * 2 - 1; ptr.ny = -(e.clientY / innerHeight * 2 - 1); ptr.has = true; ptr.last = st.t; ptr.kick = true; }, {passive: true});
    function addRipple(x, y, a) { ripples.push({x, y, a, t: st.t}); if (ripples.length > 7) ripples.shift(); lastRip.x = x; lastRip.y = y; lastRip.t = st.t; }

    function writeM(te, o, x, y, z, ax, ay, az, s) {
      const a = Math.cos(ax), b = Math.sin(ax), c = Math.cos(ay), d = Math.sin(ay), e = Math.cos(az), f = Math.sin(az);
      const ae = a * e, af = a * f, be = b * e, bf = b * f;
      te[o] = c * e * s; te[o + 4] = -c * f * s; te[o + 8] = d * s;
      te[o + 1] = (af + be * d) * s; te[o + 5] = (ae - bf * d) * s; te[o + 9] = -b * c * s;
      te[o + 2] = (bf - ae * d) * s; te[o + 6] = (be + af * d) * s; te[o + 10] = a * c * s;
      te[o + 3] = 0; te[o + 7] = 0; te[o + 11] = 0;
      te[o + 12] = x; te[o + 13] = y; te[o + 14] = z; te[o + 15] = 1;
    }
    function updateHover(dt) {
      let active = ptr.has && (st.t - ptr.last) < 3, tx = 0, ty = 0;
      if (active) {
        ndc.set(ptr.nx, ptr.ny); ray.setFromCamera(ndc, camera);
        nrm.set(0, 0, 1).applyQuaternion(group.getWorldQuaternion(q));
        plane.setFromNormalAndCoplanarPoint(nrm, origin);
        if (ray.ray.intersectPlane(plane, hit)) { loc.copy(hit); group.worldToLocal(loc); tx = loc.x; ty = loc.y; } else active = false;
      }
      if (!active) { tx = Math.sin(st.t * 0.21) * cols * 0.28; ty = Math.cos(st.t * 0.17) * 6 + 2; }
      const kk = 1 - Math.exp(-dt * (active ? 10 : 1.5));
      hp.x += (tx - hp.x) * kk; hp.y += (ty - hp.y) * kk;
      st.hov += ((active ? 1 : 0.5) - st.hov) * (1 - Math.exp(-dt * 3));
      if (active) { const dx = hp.x - lastRip.x, dy = hp.y - lastRip.y; if (dx * dx + dy * dy > 2.6 && st.t - lastRip.t > 0.12) addRipple(hp.x, hp.y, 0.3); }
      if (ptr.kick) { ptr.kick = false; if (active) addRipple(hp.x, hp.y, 1.1); }
      tv.set(hp.x, hp.y, 2.4); group.localToWorld(tv); torch.position.copy(tv);
    }
    function updateTiles(dt) {
      const m = mesh.instanceMatrix.array, col = colArr;
      const t = st.t, amp = st.amp, ch = st.chaos, hov = st.hov, mos = st.mosaic;
      const H = rows, half = H / 2, off = st.scroll, hx = hp.x, hy = hp.y, nR = ripples.length;
      const B = C.base, V = C.vari, S = C.shape, A1 = C.acc1, A2 = C.acc2, HV = C.hover;
      for (let i = 0; i < count; i++) {
        const x = gx[i];
        let y = gy[i] + off; y -= H * Math.floor((y + half) / H);
        const p1 = x * 0.31 + t * 0.7, p2 = x * 0.17 + y * 0.43 + t * 1.0;
        const c1 = Math.cos(p1), c2 = Math.cos(p2);
        let z = amp * (0.55 * Math.sin(p1) + 0.45 * Math.sin(p2));
        let gxv = amp * (0.1705 * c1 + 0.0765 * c2), gyv = amp * 0.1935 * c2;
        for (let j = 0; j < nR; j++) {
          const R = ripples[j], dx = x - R.x, dy = y - R.y, d = Math.sqrt(dx * dx + dy * dy) + 1e-4, age = t - R.t;
          if (d > age * 8 + 1.5) continue;
          const env = R.a * Math.exp(-age * 1.25 - d * 0.16), ph = d * 1.2 - age * 7.2;
          z += env * Math.sin(ph);
          const dd = env * 1.2 * Math.cos(ph) / d; gxv += dd * dx; gyv += dd * dy;
        }
        const ddx = x - hx, ddy = y - hy, g = Math.exp(-(ddx * ddx + ddy * ddy) * 0.11) * hov;
        z += g * 0.6; gxv -= g * 0.132 * ddx; gyv -= g * 0.132 * ddy;
        const s = sc[i] + (shapeT[i] - sc[i]) * (1 - Math.exp(-dt * rate[i])); sc[i] = s;
        z += s * (1.25 + 0.12 * Math.sin(t * 2.2 + x * 0.6 + y * 0.4)) + ch * cz[i];
        writeM(m, i * 16, x, y, z, gyv * 0.7 + ch * crx[i], -gxv * 0.7 + ch * cry[i], ch * crz[i], 1 - ch * 0.2 * rnd[i]);
        const w = vr[i];
        let r = B[0] + (V[0] - B[0]) * w, gg = B[1] + (V[1] - B[1]) * w, b = B[2] + (V[2] - B[2]) * w;
        const ac = acc[i];
        if (ac) { const A = ac === 1 ? A1 : A2, k2 = 0.55 * mos; r += (A[0] - r) * k2; gg += (A[1] - gg) * k2; b += (A[2] - b) * k2; }
        if (s > 0.001) { r += (S[0] - r) * s; gg += (S[1] - gg) * s; b += (S[2] - b) * s; }
        const hg = g * 0.42;
        if (hg > 0.002) { r += (HV[0] - r) * hg; gg += (HV[1] - gg) * hg; b += (HV[2] - b) * hg; }
        const o = i * 3; col[o] = r; col[o + 1] = gg; col[o + 2] = b;
      }
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
      while (ripples.length && t - ripples[0].t > 3.2) ripples.shift();
    }
    function step(dt) {
      st.t += dt;
      const k = 1 - Math.exp(-dt * 2.0);
      st.amp += (target.amp - st.amp) * k; st.chaos += (target.chaos - st.chaos) * k;
      st.rotX += (target.rotX - st.rotX) * k; st.rotZ += (target.rotZ - st.rotZ) * k;
      const camT = target.cam === 's' ? shapeCamD() : target.cam;
      st.cam += (camT - st.cam) * k; st.mosaic += (target.mosaic - st.mosaic) * k;
      st.scroll += (st.scrollT - st.scroll) * (1 - Math.exp(-dt * 6));
      group.rotation.set(st.rotX, 0, st.rotZ); group.scale.setScalar(scl);
      const px = ptr.has ? ptr.nx : 0, py = ptr.has ? ptr.ny : 0;
      camPos.x += (px * 1.4 - camPos.x) * k; camPos.y += (py * 0.9 - camPos.y) * k;
      camera.position.set(camPos.x, camPos.y, st.cam); camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld(); group.updateMatrixWorld();
      updateHover(dt);
      updateTiles(dt);
      rim.position.set(Math.sin(st.t * 0.17) * 14, Math.cos(st.t * 0.13) * 8, 10);
      scene.fog.near = st.cam - 4; scene.fog.far = st.cam + 18;
    }
    function snap() {
      st.amp = target.amp; st.chaos = target.chaos; st.rotX = target.rotX; st.rotZ = target.rotZ;
      st.cam = target.cam === 's' ? shapeCamD() : target.cam; st.mosaic = target.mosaic; st.scroll = st.scrollT;
      sc.set(shapeT);
    }
    function renderStatic() { snap(); const t0 = st.t; step(0); st.t = t0; renderer.render(scene, camera); }

    let last = performance.now(), lastDraw = 0, throttle = false, rq = 0, lastW = 0, lastH = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden || (throttle && now - lastDraw < 32)) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)) || 0.016;
      last = now; lastDraw = now;
      step(dt);
      renderer.render(scene, camera);
    }
    function resize() {
      const W = innerWidth, H = innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 1.75));
      renderer.setSize(W, H, false);
      camera.aspect = W / Math.max(1, H); camera.updateProjectionMatrix();
      if (Math.abs(W - lastW) > 2 || Math.abs(H - lastH) > 140) { layout(); lastW = W; lastH = H; }
      if (REDUCE) renderStatic();
    }
    addEventListener('resize', () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(resize); });
    const mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', applyTheme); else if (mq.addListener) mq.addListener(applyTheme);
    new MutationObserver(applyTheme).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); document.documentElement.classList.add('no3d'); });

    api.setMode = name => {
      const m = MODES[name] || MODES.wave;
      if (st.mode === name) return;
      st.mode = name; target = m; shapeT = m.shape ? shapeArr[m.shape] : zero;
      if (REDUCE) renderStatic();
    };
    api.setScroll = (y, introH) => {
      const p = clamp(y / Math.max(1, introH * 0.85), 0, 1);
      canvas.style.opacity = String(1 - p * (1 - minOpacity));
      st.scrollT = Math.max(0, y - introH * 0.5) * 0.012;
      throttle = p >= 1;
      if (REDUCE) renderStatic();
    };

    applyTheme(); resize();
    if (REDUCE) renderStatic(); else requestAnimationFrame(frame);
    return api;
  } catch (e) {
    console.warn('3D недоступно:', e);
    return fail();
  }
  }
})();

/* ---------- общие куски разметки ---------- */
function avaHTML(m, size) {
  const glaze = ['var(--glaze-1)', 'var(--glaze-2)', 'var(--glaze-3)'][catIndex(m.prof) % 3];
  const img = validImg(m.avatar);
  return '<span class="ava' + (size ? ' ' + size : '') + '" style="--ava:' + glaze + '">' + (img ? '<img src="' + img + '" alt="">' : esc(initials(m.name))) + '</span>';
}
function badgesHTML(m, full) {
  const b = [];
  if (m.verified) b.push('<span class="bdg ok">' + icon('shield') + 'Документы проверены</span>');
  const offToday = !schedOf(m).days[new Date().getDay()];
  if (offToday) b.push('<span class="bdg">Сегодня выходной</span>');
  else if (m.today) b.push('<span class="bdg live">Свободен сегодня</span>');
  if (m.resp) b.push('<span class="bdg">' + icon('clock') + respText(m.resp) + '</span>');
  if (full) b.push('<span class="bdg">Опыт ' + yrs(m.exp) + '</span>');
  if (!m.demo && m.createdAt && Date.now() - m.createdAt < 14 * DAY) b.push('<span class="bdg new">Новый</span>');
  return b.join('');
}
function cardHTML(m, i, anim) {
  const fav = local.favs.indexOf(m.id) >= 0, c = cmp.has(m.id);
  return '<article class="card' + (anim ? ' enter' : '') + '" data-id="' + esc(m.id) + '" style="--i:' + (i || 0) + '">' +
    '<span class="card-glare" aria-hidden="true"></span>' +
    '<div class="card-top">' + avaHTML(m) + '<div class="who"><h3>' + esc(m.name) + '</h3><p>' + (m.demo ? '<span class="ex">пример</span>' : '') + esc(m.prof) + ' · ' + esc(m.district || 'район не указан') + '</p></div>' +
    '<button class="fav" type="button" data-act="fav" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Убрать из избранного' : 'Добавить в избранное') + '">' + icon('heart') + '</button></div>' +
    '<div class="rating">' + starsHTML(m.avg) + '<b>' + fmtR(m.avg) + '</b><span>' + (m.n ? pl(m.n, REV) : 'пока без отзывов') + '</span></div>' +
    '<div class="badges">' + badgesHTML(m) + '</div>' +
    (m.brands && m.brands.length ? '<p class="praise"><span>Марки:</span> ' + esc(m.brands.slice(0, 3).join(', ')) + (m.brands.length > 3 ? ' +' + (m.brands.length - 3) : '') + '</p>' : CAT[m.prof] && CAT[m.prof].g === 1 ? '<p class="praise"><span>Марки:</span> любые</p>' : '') +
    (m.tags && m.tags.length ? '<p class="praise"><span>Хвалят:</span> ' + esc(m.tags.slice(0, 2).map(x => x.t.toLowerCase()).join(', ')) + '</p>' : '') +
    '<div class="card-foot"><div class="price"><span class="from">от</span> <b>' + fmt(m.price) + '</b> <span class="unit">' + esc(m.unit) + '</span></div>' +
    '<div class="card-acts"><button class="cmp ic-only" type="button" data-act="cmp" aria-pressed="' + c + '" aria-label="Сравнить" title="Сравнить">' + icon(c ? 'check' : 'plus') + '</button><span class="card-more">Подробнее' + icon('arrowR') + '</span></div></div>' +
    '</article>';
}
function miniHTML(m, acts) {
  return '<div class="mini" data-id="' + esc(m.id) + '">' + avaHTML(m, 's') + '<div class="mini-info"><b>' + esc(m.name) + '</b><span>' + esc(m.prof) + ' · ' + fmtR(m.avg) + ' ★ · от ' + fmt(m.price) + ' ' + esc(m.unit) + '</span></div><div class="mini-acts">' + acts + '</div></div>';
}
function placeholderFor(prof) {
  return ({'Кафельщик': 'Например: ванная 4 м², плитка куплена, нужен демонтаж старой', 'Сантехник': 'Например: течёт смеситель на кухне', 'Электрик': 'Например: перенести две розетки', 'Слесарь': 'Например: заменить личинку замка', 'Маляр': 'Например: покрасить комнату 18 м²', 'Плотник': 'Например: поставить межкомнатную дверь', 'Сварщик': 'Например: починить петлю ворот', 'Мастер на час': 'Например: собрать шкаф и повесить полку'})[prof] || 'Опишите задачу';
}

/* ---------- избранное и сравнение ---------- */
const cmp = new Set();
function toggleFav(id) {
  const i = local.favs.indexOf(id), on = i < 0;
  if (on) local.favs.push(id); else local.favs.splice(i, 1);
  saveLocal();
  $$('.card[data-id="' + cssId(id) + '"] .fav, #pm-fav[data-id="' + cssId(id) + '"]').forEach(b => {
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Убрать из избранного' : 'Добавить в избранное');
    b.classList.remove('pop'); void b.offsetWidth; if (on) b.classList.add('pop');
  });
  updateFavBadge();
  if (on) toast('Мастер сохранён в избранном');
}
function favCount() { const ids = new Set(masters().map(m => m.id)); return local.favs.filter(id => ids.has(id)).length; }
function updateFavBadge() { /* счётчик избранного показывается в кабинете */ }
function toggleCompare(id) {
  if (cmp.has(id)) cmp.delete(id);
  else { if (cmp.size >= 3) { toast('Сравнить можно до трёх мастеров', 'warn'); return; } cmp.add(id); }
  const on = cmp.has(id);
  $$('.card[data-id="' + cssId(id) + '"] .cmp, #pm-cmp[data-id="' + cssId(id) + '"]').forEach(b => { b.setAttribute('aria-pressed', String(on)); b.innerHTML = icon(on ? 'check' : 'plus') + (b.classList.contains('ic-only') ? '' : 'Сравнить'); });
  renderTray();
}
function renderTray() {
  const tray = $('#tray');
  const list = Array.from(cmp).map(getMaster).filter(Boolean);
  Array.from(cmp).forEach(id => { if (!getMaster(id)) cmp.delete(id); });
  tray.hidden = !list.length;
  document.documentElement.classList.toggle('has-tray', !!list.length);
  if (!list.length) return;
  $('#tray-avas').innerHTML = list.map(m => avaHTML(m, 's')).join('');
  $('#tray-txt').textContent = list.length === 1 ? 'Выберите ещё одного мастера' : 'Выбрано ' + list.length + ' ' + plural(list.length, ['мастер', 'мастера', 'мастеров']);
  $('#tray-go').disabled = list.length < 2;
}
function openCompare() {
  const list = Array.from(cmp).map(getMaster).filter(Boolean);
  if (list.length < 2) { toast('Выберите хотя бы двух мастеров', 'warn'); return; }
  const rows = [
    ['Оценка', m => starsHTML(m.avg, 13) + ' <b>' + fmtR(m.avg) + '</b>', m => m.avg, 'max'],
    ['Отзывы', m => fmt(m.n), m => m.n, 'max'],
    ['Цена', m => 'от ' + fmt(m.price) + ' ' + esc(m.unit), m => m.price, 'min'],
    ['Опыт', m => yrs(m.exp), m => m.exp, 'max'],
    ['Отвечает', m => esc(respText(m.resp) || '—'), m => m.resp || 999, 'min'],
    ['Документы', m => m.verified ? 'Проверены' : 'Не проверены', m => m.verified ? 1 : 0, 'max'],
    ['Свободен сегодня', m => m.today ? 'Да' : 'Нет', m => m.today ? 1 : 0, 'max'],
    ['Район', m => esc(m.district || '—'), null],
    ['Чаще хвалят', m => esc(m.tags.slice(0, 2).map(x => x.t).join(', ') || '—'), null]
  ];
  const units = new Set(list.map(m => m.unit));
  const body = rows.map(([label, cell, val, dir]) => {
    let best = null;
    if (val && !(label === 'Цена' && units.size > 1)) {
      const vs = list.map(val), allEq = vs.every(v => v === vs[0]);
      if (!allEq) best = dir === 'max' ? Math.max.apply(null, vs) : Math.min.apply(null, vs);
    }
    return '<tr><th scope="row">' + label + '</th>' + list.map(m => '<td' + (best !== null && val(m) === best ? ' class="best"' : '') + '>' + cell(m) + '</td>').join('') + '</tr>';
  }).join('');
  const el = Modal.open('<h2 class="m-h">Сравнение мастеров</h2><p class="m-sub">Лучшее значение в строке подсвечено.' + (units.size > 1 ? ' Цены указаны в разных единицах, поэтому их не сравниваем.' : '') + '</p>' +
    '<div class="tbl-wrap"><table class="cmp-tbl"><thead><tr><th></th>' + list.map(m => '<th scope="col"><div class="cmp-head">' + avaHTML(m, 's') + '<b>' + esc(m.name) + '</b><span class="muted sm">' + esc(m.prof) + '</span><button class="btn btn-sm" type="button" data-open="' + esc(m.id) + '">Профиль</button></div></th>').join('') + '</tr></thead><tbody>' + body + '</tbody></table></div>',
  {wide: true, label: 'Сравнение мастеров', kind: 'compare'});
  el.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openProfile(b.dataset.open); });
}
function openFavs() { if (isRegistered()) openCabinet('favs'); else openAuth({reason: 'Избранное хранится в кабинете. Создайте аккаунт: имя и номер телефона.'}); }

/* ---------- профиль мастера ---------- */
const PM = {id: null, sort: 'new', all: false, day: null, slot: null};
function sumHTML(m) {
  const dist = [5, 4, 3, 2, 1].map(s => { const c = m.reviews.filter(r => Number(r.r) === s).length; return {s, c, p: m.n ? c / m.n * 100 : 0}; });
  return '<div class="score"><div class="score-l"><div class="score-num">' + fmtR(m.avg) + '</div>' + starsHTML(m.avg, 18) + '<span class="muted sm">' + (m.n ? pl(m.n, REV) : 'Пока нет отзывов') + '</span></div>' +
    '<div class="dist">' + dist.map(d => '<div class="dist-row"><span>' + d.s + '</span><span class="bar"><i style="--w:' + d.p.toFixed(1) + '%"></i></span><span>' + d.c + '</span></div>').join('') + '</div></div>' +
    (m.tags.length ? '<div class="block"><span class="lbl">Чаще всего отмечают</span><div class="tagcloud">' + m.tags.slice(0, 6).map(x => '<span class="tag">' + esc(x.t) + ' <em>' + x.c + '</em></span>').join('') + '</div></div>' : '');
}
function revsHTML(m) {
  const list = m.reviews.slice();
  if (PM.sort === 'high') list.sort((a, b) => b.r - a.r || (b.createdAt || 0) - (a.createdAt || 0));
  else if (PM.sort === 'low') list.sort((a, b) => a.r - b.r || (b.createdAt || 0) - (a.createdAt || 0));
  if (!list.length) return '<p class="empty-sm">Отзывов пока нет. Станьте первым, кто оценит работу мастера.</p>';
  const shown = PM.all ? list : list.slice(0, 4);
  return shown.map(r => '<article class="review"><header><span class="rv-ava">' + esc(initials(r.a).charAt(0)) + '</span><div><b>' + esc(r.a || 'Гость') + '</b><span class="muted sm">' + fmtDate(r.createdAt) + '</span></div>' + starsHTML(Number(r.r), 14) + '</header>' +
    (r.t ? '<p>' + esc(r.t) + '</p>' : '') + (Array.isArray(r.tags) && r.tags.length ? '<div class="rv-tags">' + r.tags.map(t => '<span>' + esc(t) + '</span>').join('') + '</div>' : '') + '</article>').join('') +
    (list.length > 4 && !PM.all ? '<button class="btn btn-ghost btn-sm" type="button" id="pm-more">Показать все ' + list.length + '</button>' : '');
}
function bookingHTML(m) {
  const now = new Date(), days = [];
  for (let i = 0; i < 14; i++) days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
  const s = schedOf(m), st = schedText(m);
  PM.day = null; PM.slot = null;
  return '<div class="book-in"><div><span class="lbl">Запрос на запись</span><p class="hint" style="margin-top:4px">Работает: ' + esc(st.days) + ', ' + esc(st.hours) + (st.brk ? ', перерыв ' + esc(st.brk) : '') + '</p></div>' +
    '<div class="fld"><span class="lab">День</span><div class="days" id="bk-days">' + days.map((d, i) => { const off = !s.days[d.getDay()]; return '<button type="button" class="daychip" data-day="' + d.getTime() + '" aria-pressed="false"' + (off ? ' disabled aria-label="' + esc(fmtDay(d.getTime())) + ', выходной"' : '') + '><small>' + (off ? 'вых' : i === 0 ? 'сегодня' : i === 1 ? 'завтра' : WD[d.getDay()]) + '</small><b>' + d.getDate() + '</b></button>'; }).join('') + '</div></div>' +
    '<div class="fld"><span class="lab">Время</span><div class="slots" id="bk-slots"><p class="hint">Сначала выберите день</p></div></div>' +
    '<div class="fld"><label for="bk-desc">Что нужно сделать</label><textarea class="inp" id="bk-desc" maxlength="500" placeholder="' + esc(placeholderFor(m.prof)) + '"></textarea></div>' +
    '<p class="err" id="bk-err" role="alert" hidden></p>' +
    '<div class="book-foot"><button class="btn" type="button" id="bk-send">' + icon('send') + 'Отправить запрос мастеру</button><p class="hint">Запрос придёт мастеру в чат. Он примет время или предложит другое.</p></div></div>';
}
function busySlots(mId, dayMs) {
  const ds = new Date(dayMs).toDateString();
  return new Set(messagesAll().filter(x => x.kind === 'booking' && x.masterId === mId && (x.status === 'pending' || x.status === 'accepted') && new Date(x.day).toDateString() === ds).map(x => x.slot));
}
function bookingClick(e, el, mId) {
  const t = e.target, m = getMaster(mId);
  if (!m) return false;
  const day = t.closest('.daychip');
  if (day) {
    if (day.disabled) return true;
    PM.day = Number(day.dataset.day); PM.slot = null;
    $$('.daychip', el).forEach(b => b.setAttribute('aria-pressed', String(b === day)));
    $('#bk-slots', el).innerHTML = slotsHTML(m, PM.day);
    return true;
  }
  const slot = t.closest('.slot');
  if (slot) { if (!slot.disabled) { PM.slot = slot.dataset.slot; $$('.slot', el).forEach(b => b.setAttribute('aria-pressed', String(b === slot))); } return true; }
  if (t.closest('#bk-send')) {
    const er = $('#bk-err', el), fail = msg => { er.textContent = msg; er.hidden = !msg; };
    if (!PM.day) return fail('Выберите день.'), true;
    if (!PM.slot) return fail('Выберите время.'), true;
    if (busySlots(m.id, PM.day).has(PM.slot)) return fail('Это время уже заняли. Выберите другое.'), true;
    fail('');
    const b = {day: PM.day, slot: PM.slot, desc: $('#bk-desc', el).value.trim().slice(0, 500)};
    requireAccount('Чтобы отправить запрос на запись, создайте аккаунт: имя и номер телефона.', () => createBooking(m, b));
    return true;
  }
  return false;
}
async function createBooking(m, b) {
  if (isMine(m)) { toast('Нельзя записаться к самому себе', 'warn'); return; }
  const ex = threads().find(t => t.masterId === m.id && t.role === 'client');
  const key = myKey();
  const t = ex || {id: m.id + '__' + key, masterId: m.id, masterName: m.name, clientKey: key, role: 'client', msgs: [], unread: 0, last: null};
  if (!ex) CH.pending = t;
  CH.thread = t.id;
  const ok = await sendMsg(t, 'Запрос на запись: ' + fmtDay(b.day) + ' в ' + b.slot, {kind: 'booking', day: b.day, slot: b.slot, desc: b.desc, status: 'pending'});
  if (ok === false) return;
  toast('Запрос отправлен мастеру');
  openChat(null, t.id);
}
const BK_TEXT = {
  client: {pending: 'Ждём ответа мастера', accepted: 'Мастер подтвердил время', declined: 'Мастер отклонил это время', cancelled: 'Вы отменили запись'},
  master: {pending: 'Ждёт вашего ответа', accepted: 'Вы подтвердили время', declined: 'Вы отклонили это время', cancelled: 'Клиент отменил запись'}
};
const bkStatus = x => ['pending', 'accepted', 'declined', 'cancelled'].indexOf(x.status) >= 0 ? x.status : 'pending';
function bkActs(x, role, attr) {
  const st = bkStatus(x), a = attr || 'data-bk';
  if (role === 'master' && st === 'pending') return '<button class="btn btn-sm" type="button" ' + a + '="accepted" data-mid="' + esc(x.id) + '">' + icon('check') + 'Принять</button><button class="btn btn-sm btn-ghost" type="button" ' + a + '="declined" data-mid="' + esc(x.id) + '">Отклонить</button>';
  if (role === 'client' && (st === 'pending' || st === 'accepted') && !(x.day && x.day + 864e5 < Date.now())) return '<button class="btn btn-sm btn-ghost" type="button" ' + a + '="cancelled" data-mid="' + esc(x.id) + '">Отменить запись</button>';
  return '';
}
async function decideBooking(msgId, status, asRole) {
  const x = messagesAll().find(y => y.id === msgId); if (!x) return;
  const t = threads().find(y => y.id === x.thread); if (!t) return;
  const lm = local.msgs.find(y => y.id === msgId);
  if (lm) lm.status = status;
  else {
    const ok = await sharedWrite(db => db.collection('messages').doc(msgId).update({status, decidedAt: Date.now()}));
    if (!ok) { if (FB.on) return; local.bkOverride[msgId] = status; }
  }
  saveLocal();
  const when = fmtDay(x.day) + ' в ' + x.slot;
  const text = status === 'accepted' ? 'Подтверждаю запись: ' + when + '. До встречи!' : status === 'declined' ? 'Не получится ' + when + '. Давайте подберём другое время.' : 'Отменяю запись на ' + when + '.';
  await sendMsg(t, text, {from: asRole || t.role});
}
function slotsHTML(m, dayMs) {
  const d = new Date(dayMs), now = new Date();
  const isToday = d.toDateString() === now.toDateString(), nowH = now.getHours() + now.getMinutes() / 60;
  const list = daySlots(m, dayMs), taken = busySlots(m.id, dayMs);
  if (!list.length) return '<p class="hint">У мастера выходной в этот день.</p>';
  const html = list.map(s => {
    const h = parseInt(s, 10), past = isToday && h <= nowH + 1, busy = taken.has(s) || (m.demo && hash(m.id + dayMs + s) % 5 === 0);
    return '<button type="button" class="slot" data-slot="' + s + '" aria-pressed="' + (PM.slot === s) + '"' + (past || busy ? ' disabled aria-label="' + s + ', ' + (busy ? 'занято' : 'уже прошло') + '"' : '') + '>' + s + '</button>';
  });
  return html.join('');
}
function profileHTML(m) {
  const fav = local.favs.indexOf(m.id) >= 0, c = cmp.has(m.id);
  const photos = (Array.isArray(m.photos) ? m.photos : []).map(validImg).filter(Boolean);
  return '<div class="pf"><div class="pf-l">' +
    '<div class="pf-head">' + avaHTML(m, 'xl') + '<div><p class="eyebrow">' + esc(m.prof) + (m.demo ? ' · пример' : '') + '</p><h2 class="pf-name">' + esc(m.name) + '</h2><p class="pf-sub">' + icon('pin') + esc(m.district || 'Район не указан') + ' · опыт ' + yrs(m.exp) + '</p></div></div>' +
    '<div class="badges">' + badgesHTML(m) + '</div>' +
    contactHTML(m) +
    (function () { const st = nowStatus(m), tx = schedText(m); return '<div class="block"><span class="lbl">График работы</span><div class="sched"><span class="sched-now ' + (st.on ? 'on' : 'off') + '">' + esc(st.t) + '</span><span>' + esc(tx.days) + ', ' + esc(tx.hours) + '</span>' + (tx.brk ? '<span class="muted sm">Перерыв на отдых ' + esc(tx.brk) + '</span>' : '') + (tx.off ? '<span class="muted sm">Выходные: ' + esc(tx.off) + '</span>' : '') + '</div></div>'; })() +
    '<div class="pf-acts">' + (isMine(m) ? '' : '<button class="btn btn-brass" type="button" id="pm-book-open">' + icon('clock') + 'Записаться</button><button class="btn" type="button" id="pm-chat">' + icon('chat') + 'Написать</button>') + '<button class="fav" type="button" id="pm-fav" data-id="' + esc(m.id) + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Убрать из избранного' : 'Добавить в избранное') + '" title="В избранное">' + icon('heart') + '</button><button class="cmp ic-only" type="button" id="pm-cmp" data-id="' + esc(m.id) + '" aria-pressed="' + c + '" aria-label="Сравнить" title="Сравнить">' + icon(c ? 'check' : 'plus') + '</button></div>' +
    '<div class="book" id="pm-book" hidden>' + bookingHTML(m) + '</div>' +
    (m.about ? '<div class="block"><span class="lbl">О мастере</span><p class="pf-about">' + esc(m.about) + '</p></div>' : '') +
    worksHTML(m) +
    (CAT[m.prof] && CAT[m.prof].g === 1 ? '<div class="block"><span class="lbl">Марки машин</span><div class="tagcloud">' + (m.brands.length ? m.brands.map(b => '<span class="tag">' + esc(b) + ' <em>' + (BRAND[b].t === 'ev' ? 'электро' : BRAND[b].t === 'both' ? 'и гибриды' : 'ДВС') + '</em></span>').join('') : '<span class="tag">Любые марки</span>') + '</div></div>' : '') +
    (m.services.length ? '<div class="block"><span class="lbl">Услуги и цены</span><table class="svc"><tbody>' + m.services.map(s => '<tr><td>' + esc(s.n) + '</td><td>' + esc(s.p || '—') + '</td></tr>').join('') + '</tbody></table></div>' : '') +
    '</div><div class="pf-r">' +
    '<div id="pm-sum">' + sumHTML(m) + '</div>' +
    '<form class="rv-form" id="pm-rv" novalidate><b class="rv-title">Оцените работу мастера</b>' +
    '<div class="starpick" role="radiogroup" aria-label="Оценка">' + [5, 4, 3, 2, 1].map(s => '<input type="radio" name="pm-r" id="pm-r' + s + '" value="' + s + '"><label for="pm-r' + s + '" title="' + s + ' из 5"><span class="sr">' + s + ' из 5</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + STAR_D + '"/></svg></label>').join('') + '</div>' +
    '<div class="tagpick" role="group" aria-label="Что понравилось">' + TAGS.map((t, i) => '<label class="tg" for="pm-t' + i + '"><input type="checkbox" id="pm-t' + i + '" value="' + esc(t) + '"><span>' + esc(t) + '</span></label>').join('') + '</div>' +
    '<div class="fld"><label for="pm-a">Ваше имя</label><input class="inp" id="pm-a" autocomplete="given-name" maxlength="40" value="' + esc((local.me && local.me.name) || '') + '"></div>' +
    '<div class="fld"><label for="pm-text">Как прошла работа</label><textarea class="inp" id="pm-text" maxlength="600" placeholder="Сроки, качество, чистота, совпала ли цена"></textarea></div>' +
    '<p class="err" id="pm-err" role="alert" hidden></p><button class="btn" type="submit" style="justify-self:start">Опубликовать отзыв</button></form>' +
    (m.n >= 3 && aiOn() ? '<button class="btn btn-ghost btn-sm" type="button" id="pm-ai-sum" style="justify-self:start">' + icon('spark') + 'Кратко об отзывах с ИИ</button><div id="pm-ai-out"></div>' : '') +
    '<div class="rv-head"><span class="lbl">Отзывы</span><select class="sel" id="pm-sort" aria-label="Порядок отзывов"><option value="new">Сначала новые</option><option value="high">Сначала высокие</option><option value="low">Сначала низкие</option></select></div>' +
    '<div id="pm-revs">' + revsHTML(m) + '</div>' +
    (m.demo || isMine(m) ? '' : '<button class="report-link" type="button" id="pm-report">' + icon('flag') + 'Пожаловаться на мастера</button>') +
    '</div></div>';
}
function contactHTML(m) {
  const ph = phoneOf(m);
  if (!ph && FB.on && m.source === 'shared') {
    return '<div class="contact" id="pm-contact"><div class="contact-num"><span class="lbl">Телефон</span><span class="muted sm">' + (FB.user ? (FB.contacts[m.id] === '' ? 'Мастер не указал номер. Напишите ему в чат' : 'Загружаем номер…') : 'Номер видят только те, кто вошёл по СМС') + '</span></div>' +
      (FB.user ? '' : '<div class="contact-acts"><button class="btn btn-sm btn-ghost" type="button" id="pm-reveal">' + icon('phone') + 'Показать номер</button></div>') + '</div>';
  }
  return '<div class="contact" id="pm-contact"><div class="contact-num"><span class="lbl">Телефон</span><button class="phone-copy" type="button" id="pm-phone" title="Нажмите, чтобы скопировать">' + esc(ph || '—') + '</button></div><div class="contact-acts"><a class="btn btn-sm btn-ghost" href="' + esc(telHref(ph)) + '">' + icon('phone') + 'Позвонить</a></div></div>';
}
function openProfile(id, opts) {
  const m = getMaster(id);
  if (!m) { toast('Профиль не найден', 'warn'); return; }
  PM.id = id; PM.sort = 'new'; PM.all = false; PM.day = null; PM.slot = null;
  const el = Modal.open(profileHTML(m), {wide: true, label: m.name, kind: 'profile', onClose: () => { PM.id = null; }});
  const err = (sel, msg) => { const e = $(sel, el); e.textContent = msg; e.hidden = !msg; };
  el.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('#pm-chat')) { requireAccount('Чтобы написать мастеру, создайте аккаунт: имя и номер телефона.', () => openChat(id)); return; }
    if (t.closest('#pm-phone')) { copyText($('#pm-phone', el).textContent, $('#pm-phone', el)); return; }
    if (t.closest('#pm-reveal')) { requireAccount('Чтобы увидеть номер мастера, войдите по номеру телефона. Так мы защищаем мастеров от спама.', () => { if (Modal.kind !== 'profile') openProfile(id); }); return; }
    if (t.closest('#pm-report')) { requireAccount('Чтобы отправить жалобу, войдите по номеру телефона.', () => openReport('master', id)); return; }
    if (t.closest('#pm-book-open')) { const b = $('#pm-book', el); b.hidden = !b.hidden; if (!b.hidden) b.scrollIntoView({behavior: REDUCE ? 'auto' : 'smooth', block: 'nearest'}); return; }
    if (t.closest('#pm-fav')) { toggleFav(id); return; }
    if (t.closest('#pm-cmp')) { toggleCompare(id); return; }
    if (t.closest('#pm-more')) { PM.all = true; $('#pm-revs', el).innerHTML = revsHTML(getMaster(id) || m); return; }
    const ph = t.closest('[data-ph], [data-wimg]');
    if (ph) { const img = ph.querySelector('img'); if (img) openLightbox(img.src); return; }
    const aw = t.closest('[data-addwork]'); if (aw) { openAddWork(aw.dataset.addwork); return; }
    const dw = t.closest('[data-delwork]');
    if (dw) { if (dw.dataset.armed) deleteWork(dw.dataset.delwork); else { dw.dataset.armed = '1'; dw.setAttribute('aria-label', 'Нажмите ещё раз, чтобы удалить'); toast('Нажмите на корзину ещё раз, чтобы удалить работу'); setTimeout(() => { delete dw.dataset.armed; }, 4000); } return; }
    bookingClick(e, el, id);
  });
  const aiSum = $('#pm-ai-sum', el);
  if (aiSum) aiSum.addEventListener('click', () => aiSummarizeReviews(getMaster(id) || m, $('#pm-ai-out', el), aiSum));
  $('#pm-sort', el).addEventListener('change', e => { PM.sort = e.target.value; $('#pm-revs', el).innerHTML = revsHTML(getMaster(id) || m); });
  $('#pm-rv', el).addEventListener('submit', async e => {
    e.preventDefault();
    const rEl = el.querySelector('input[name="pm-r"]:checked');
    const r = rEl ? Number(rEl.value) : 0, a = $('#pm-a', el).value.trim(), text = $('#pm-text', el).value.trim();
    const tags = $$('.tagpick input:checked', el).map(x => x.value);
    if (!r) return err('#pm-err', 'Выберите оценку от одной до пяти звёзд.');
    if (a.length < 2) return err('#pm-err', 'Укажите имя, чтобы отзыву доверяли.');
    err('#pm-err', '');
    const btn = e.target.querySelector('[type="submit"]'); btn.disabled = true;
    const mm = getMaster(id) || m;
    const res = await saveReview(mm, {a: a.slice(0, 40), r, t: text.slice(0, 600), tags});
    if (res && res.error) { btn.disabled = false; return err('#pm-err', res.error); }
    if (!FB.on) { local.me = Object.assign({}, local.me, {name: a}); saveLocal(); }
    btn.disabled = false; e.target.reset(); $('#pm-a', el).value = a;
    toast('Отзыв опубликован');
  });
}
function refreshProfile() {
  if (!PM.id || Modal.kind !== 'profile') return;
  const m = getMaster(PM.id);
  if (!m) { Modal.close(); return; }
  const s = $('#pm-sum'), r = $('#pm-revs');
  if (s) s.innerHTML = sumHTML(m);
  if (r) r.innerHTML = revsHTML(m);
  const c = $('#pm-contact');
  if (c) { const html = contactHTML(m); if (c.outerHTML !== html) c.outerHTML = html; }
  const wk = $('#pm-works');
  if (wk) { const html = worksHTML(m); if (wk.outerHTML !== html) wk.outerHTML = html; }
}
function openLightbox(src) {
  const lb = document.createElement('div');
  lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Фото работы');
  lb.innerHTML = '<img alt="Фото работы"><button class="icon-btn" type="button" aria-label="Закрыть фото">' + icon('close') + '</button>';
  lb.querySelector('img').src = src;
  lb.addEventListener('click', () => lb.remove());
  Modal.root.appendChild(lb);
  lb.querySelector('button').focus();
}

/* ---------- запись данных ---------- */
function fitsDoc(body) {
  let size = JSON.stringify(body).length;
  while (size > 245000 && body.photos && body.photos.length) { body.photos = body.photos.slice(0, -1); size = JSON.stringify(body).length; }
  if (size > 245000) body.avatar = null;
  return body;
}
const MASTER_KEYS = ['name', 'prof', 'district', 'exp', 'price', 'unit', 'about', 'services', 'brands', 'schedule', 'today', 'resp', 'avatar', 'photos'];
async function fbSaveMaster(data, editing) {
  const body = {};
  MASTER_KEYS.forEach(k => { if (data[k] !== undefined) body[k] = data[k]; });
  body.exp = clamp(parseInt(body.exp, 10) || 0, 0, 60);
  body.price = Math.max(0, Number(body.price) || 0);
  body.resp = clamp(parseInt(body.resp, 10) || 60, 0, 1440);
  body.avatar = fbImg(body.avatar);
  body.photos = (body.photos || []).map(fbImg).filter(Boolean).slice(0, 3);
  fitsDoc(body);
  const phone = String(data.phone || '').trim().slice(0, 24);
  const own = editing && editing.source === 'shared' && editing.ownerUid === shared.uid;
  const id = own ? editing.id : shared.db.collection('masters').doc().id;
  const ok = await sharedWrite(async db => {
    await db.collection('masters').doc(id).set(Object.assign(body, {ownerUid: shared.uid, verified: own ? !!editing.verified : false, createdAt: own ? (editing.createdAt || Date.now()) : Date.now(), updatedAt: Date.now()}));
    if (digits(phone).length >= 7) await db.collection('masterContacts').doc(id).set({ownerUid: shared.uid, phone});
  });
  if (!ok) return null;
  FB.contacts[id] = digits(phone).length >= 7 ? phone : '';
  invalidate();
  return {id, where: 'shared'};
}
async function saveMaster(data, editing) {
  if (FB.on) return fbSaveMaster(data, editing);
  const body = fitsDoc(Object.assign({}, data, {updatedAt: Date.now()}));
  if (editing && editing.source === 'shared') {
    const ok = await sharedWrite(db => db.collection('masters').doc(editing.id).set(Object.assign({}, body, {createdAt: editing.createdAt || Date.now(), ownerUid: editing.ownerUid || shared.uid || null})));
    if (ok) { invalidate(); return {id: editing.id, where: 'shared'}; }
    toast('Не получилось изменить профиль в общей базе.', 'warn');
    return null;
  }
  if (editing && editing.source === 'local') {
    const i = local.masters.findIndex(x => x.id === editing.id);
    if (i >= 0) { local.masters[i] = Object.assign({}, local.masters[i], body); saveLocal(); invalidate(); return {id: editing.id, where: 'local'}; }
  }
  let ref = null;
  const ok = await sharedWrite(async db => { ref = db.collection('masters').doc(); await ref.set(Object.assign({}, body, {createdAt: Date.now(), ownerUid: shared.uid || null})); });
  if (ok && ref) { invalidate(); return {id: ref.id, where: 'shared'}; }
  const id = uid('m');
  local.masters.unshift(Object.assign({}, body, {id, createdAt: Date.now()}));
  saveLocal(); invalidate();
  return {id, where: 'local'};
}
async function deleteMaster(m) {
  if (m.source === 'shared') {
    const ok = await sharedWrite(async db => {
      if (FB.on) await db.collection('masterContacts').doc(m.id).delete().catch(() => null);
      await db.collection('masters').doc(m.id).delete();
    });
    if (!ok) { if (!FB.on) toast('Не получилось удалить профиль из общей базы.', 'warn'); return false; }
  } else {
    local.masters = local.masters.filter(x => x.id !== m.id);
  }
  local.favs = local.favs.filter(x => x !== m.id); cmp.delete(m.id);
  saveLocal(); invalidate();
  return true;
}
async function saveReview(m, rv) {
  if (FB.on && m.source === 'shared') {
    if (!FB.user) return {error: 'Войдите по номеру телефона, чтобы оставить отзыв.'};
    const done = new Set(shared.reviews.map(r => r.id));
    const bk = messagesAll().filter(x => x.kind === 'booking' && x.masterId === m.id && x.clientUid === shared.uid && bkStatus(x) === 'accepted' && !done.has(x.id)).pop();
    if (!bk) return {error: 'Отзыв можно оставить после того, как мастер подтвердит вашу запись. Так все отзывы на сайте настоящие.'};
    const ok = await sharedWrite(db => db.collection('reviews').doc(bk.id).set({masterId: m.id, authorUid: shared.uid, a: rv.a, r: rv.r, t: rv.t || '', tags: (rv.tags || []).slice(0, 7), createdAt: TS()}));
    if (!ok) return {error: 'Не получилось опубликовать отзыв. Попробуйте ещё раз.'};
    invalidate();
    return 'shared';
  }
  const body = Object.assign({}, rv, {masterId: m.id, createdAt: Date.now()});
  if (m.source !== 'local') {
    const ok = await sharedWrite(db => db.collection('reviews').add(body));
    if (ok) { invalidate(); return 'shared'; }
  }
  local.reviews.unshift(Object.assign({}, body, {id: uid('r')}));
  saveLocal(); invalidate();
  return 'local';
}
async function saveJob(data) {
  if (FB.on) {
    const id = shared.db.collection('jobs').doc().id;
    const body = {ownerUid: shared.uid, cat: data.cat, title: data.title, desc: data.desc || '', district: data.district || '', budget: data.budget || null, when: data.when || 'Не спешу', name: data.name, status: 'open', createdAt: TS()};
    const ok = await sharedWrite(async db => {
      await db.collection('jobs').doc(id).set(body);
      await db.collection('jobContacts').doc(id).set({ownerUid: shared.uid, phone: data.phone});
    });
    if (!ok) return null;
    FB.contacts['job:' + id] = data.phone;
    invalidate();
    return {id, where: 'shared'};
  }
  const body = Object.assign({}, data, {createdAt: Date.now(), status: 'open', responses: []});
  let ref = null;
  const ok = await sharedWrite(async db => { ref = db.collection('jobs').doc(); await ref.set(Object.assign({}, body, {ownerUid: shared.uid || null})); });
  if (ok && ref) { invalidate(); return {id: ref.id, where: 'shared'}; }
  const id = uid('j');
  local.jobs.unshift(Object.assign({}, body, {id}));
  saveLocal(); invalidate();
  return {id, where: 'local'};
}
async function addResponse(j, resp) {
  if (FB.on && j.source === 'shared') {
    const body = {jobId: j.id, jobOwnerUid: j.ownerUid, responderUid: shared.uid, participants: [j.ownerUid, shared.uid], name: resp.name, phone: resp.phone, price: resp.price, msg: resp.msg || '', at: TS()};
    return sharedWrite(db => db.collection('responses').doc(j.id + '_' + shared.uid).set(body));
  }
  if (j.source === 'shared') {
    const orig = shared.jobs.find(x => x.id === j.id);
    const list = ((orig && Array.isArray(orig.responses)) ? orig.responses.slice() : []).concat([resp]);
    const ok = await sharedWrite(db => db.collection('jobs').doc(j.id).update({responses: list}));
    if (ok) { invalidate(); return; }
  } else if (j.source === 'local') {
    const lj = local.jobs.find(x => x.id === j.id);
    if (lj) { lj.responses = (lj.responses || []).concat([resp]); saveLocal(); invalidate(); return; }
  }
  (local.respExtra[j.id] = local.respExtra[j.id] || []).push(resp);
  saveLocal(); invalidate();
}
async function setJobStatus(j, status) {
  if (j.source === 'shared') {
    const ok = await sharedWrite(db => db.collection('jobs').doc(j.id).update({status}));
    if (!ok) { toast('Не получилось изменить заказ в общей базе.', 'warn'); return; }
  } else {
    const lj = local.jobs.find(x => x.id === j.id);
    if (lj) { lj.status = status; saveLocal(); }
  }
  invalidate();
}

/* ---------- каталог ---------- */
const F = {q: '', words: [], cat: null, district: '', priceMax: 0, minR: 0, verified: false, today: false, sort: 'smart', limit: 9};
const stem = w => w.length >= 7 ? w.slice(0, w.length - 3) : w.length >= 5 ? w.slice(0, w.length - 2) : w.length === 4 ? w.slice(0, 3) : w;
const parseQuery = q => norm(q).split(/[^a-zа-яғӣқӯҳҷ0-9]+/i).filter(w => w.length >= 2 && !STOP.has(w));
function matchScore(m, words) {
  let s = 0;
  const c = CAT[m.prof], skip = c && c.not && words.some(w => c.not.test(w));
  words.forEach(w => { const prof = !skip && c && wordHitsCat(w, c); if (prof || m._hay.indexOf(stem(w)) >= 0) s += prof ? 1.5 : 1; });
  return s;
}
function filtered() {
  const words = F.words, need = Math.max(1, Math.ceil(words.length / 2));
  const list = masters().map(m => ({m, s: words.length ? matchScore(m, words) : 1})).filter(x => {
    const m = x.m;
    if (words.length && x.s < need) return false;
    if (F.cat && m.prof !== F.cat) return false;
    if (F.district && m.district !== F.district) return false;
    if (F.priceMax && m.price > F.priceMax) return false;
    if (F.minR && (!m.n || m.avg < F.minR)) return false;
    if (F.verified && !m.verified) return false;
    if (F.today && !m.today) return false;
    return true;
  });
  const S = {
    smart: (a, b) => b.m.score - a.m.score,
    rating: (a, b) => b.m.avg - a.m.avg || b.m.n - a.m.n,
    reviews: (a, b) => b.m.n - a.m.n || b.m.avg - a.m.avg,
    price: (a, b) => a.m.price - b.m.price,
    fast: (a, b) => (a.m.resp || 999) - (b.m.resp || 999) || b.m.score - a.m.score,
    exp: (a, b) => b.m.exp - a.m.exp
  };
  list.sort((a, b) => (words.length ? b.s - a.s : 0) || S[F.sort](a, b));
  const it = words.length ? intent(F.q) : {cats: [], brand: null}, fk = F.cat ? [] : it.cats;
  return list.filter(x => (!fk.length || fk.indexOf(x.m.prof) >= 0) && brandFits(x.m, it.brand)).map(x => x.m);
}
const filtersActive = () => !!(F.words.length || F.cat || F.district || F.priceMax || F.minR || F.verified || F.today);
function renderCats() {
  const all = masters(), counts = {};
  all.forEach(m => { counts[m.prof] = (counts[m.prof] || 0) + 1; });
  $('#cats').innerHTML = CATS.map(c => '<button class="cat" type="button" data-cat="' + esc(c.k) + '" aria-pressed="' + (F.cat === c.k) + '">' + icon(c.ic) + '<span><b>' + esc(c.k) + '</b><small>' + pl(counts[c.k] || 0, ['мастер', 'мастера', 'мастеров']) + '</small></span></button>').join('');
}
function renderCatalog(anim) {
  const list = filtered();
  $('#res-count').textContent = list.length ? 'Найдено ' + pl(list.length, ['мастер', 'мастера', 'мастеров']) : 'Мастеров не найдено';
  $('#f-reset').hidden = !filtersActive();
  const fn = [F.district, F.priceMax, F.minR, F.verified, F.today, F.sort !== 'smart'].filter(Boolean).length, fe = $('#f-n');
  fe.textContent = String(fn); fe.hidden = !fn;
  const hit = F.q && !F.cat ? intent(F.q) : {cats: [], brand: null}, hint = $('#cat-hint');
  hint.hidden = !hit.cats.length;
  hint.innerHTML = hit.cats.length ? '<span class="muted" style="align-self:center">Похоже, вам нужен:</span>' + hit.cats.slice(0, 3).map(k => '<button class="sx-cat" type="button" data-hcat="' + esc(k) + '">' + icon(CAT[k].ic) + esc(k) + (hit.brand ? ' · ' + esc(hit.brand.n) : '') + '</button>').join('') : '';
  const grid = $('#grid');
  grid.innerHTML = list.length ? list.slice(0, F.limit).map((m, i) => cardHTML(m, i, anim)).join('')
    : '<div class="empty">' + icon('search') + '<p>По такому запросу никого нет. Уберите часть фильтров или разместите заказ на бирже, и мастера откликнутся сами.</p><button class="btn btn-sm" type="button" id="empty-post">Разместить заказ</button></div>';
  $('#more').hidden = list.length <= F.limit;
}
function renderDistricts() {
  const sel = $('#f-district'), cur = F.district;
  const set = new Set(DISTRICTS);
  masters().forEach(m => { if (m.district) set.add(m.district); });
  sel.innerHTML = '<option value="">Все районы</option>' + Array.from(set).map(d => '<option' + (d === cur ? ' selected' : '') + '>' + esc(d) + '</option>').join('');
  $('#dl-districts').innerHTML = Array.from(set).map(d => '<option value="' + esc(d) + '"></option>').join('');
}
function renderPriceRange() {
  const r = $('#f-price');
  const max = Math.max(100, Math.ceil(Math.max.apply(null, masters().map(m => m.price).concat([0])) / 50) * 50);
  r.max = String(max);
  if (!F.priceMax) r.value = String(max);
  $('#f-price-out').textContent = F.priceMax ? 'до ' + fmt(F.priceMax) : 'любая';
}
function setQuery(q, anim) {
  F.q = q; F.words = parseQuery(q); F.limit = 9;
  $('#q').value = q; $('#q-clear').hidden = !q;
  renderCatalog(anim);
}
function setCat(k) { F.cat = k; F.limit = 9; renderCats(); renderCatalog(true); }
function initCatalog() {
  $('#popular').innerHTML = '<span>Часто ищут:</span>' + POPULAR.map(p => '<button class="chip" type="button" data-q="' + esc(p) + '">' + esc(p) + '</button>').join('');
  $('#popular').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) setQuery(b.dataset.q, true); });
  $('#cat-hint').addEventListener('click', e => { const b = e.target.closest('[data-hcat]'); if (b) { const br = detectBrand(F.q); setQuery(br ? 'мастер ' + br.n : '', false); setCat(b.dataset.hcat); } });
  attachAC($('#q'), $('#cat-search'), x => {
    if (x.brand) setQuery('мастер ' + x.brand, true);
    else if (x.svc) setQuery(x.svc, true);
    else { setQuery('', false); setCat(x.cat); }
  });
  $('#cats').addEventListener('click', e => { const b = e.target.closest('.cat'); if (b) setCat(F.cat === b.dataset.cat ? null : b.dataset.cat); });
  let qt = 0;
  $('#q').addEventListener('input', e => { clearTimeout(qt); const v = e.target.value; $('#q-clear').hidden = !v; qt = setTimeout(() => setQuery(v, false), 180); });
  $('#cat-search').addEventListener('submit', e => { e.preventDefault(); setQuery($('#q').value, true); });
  $('#q-clear').addEventListener('click', () => { setQuery('', true); $('#q').focus(); });
  $('#f-district').addEventListener('change', e => { F.district = e.target.value; F.limit = 9; renderCatalog(true); });
  $('#f-price').addEventListener('input', e => { const v = Number(e.target.value); F.priceMax = v >= Number(e.target.max) ? 0 : v; $('#f-price-out').textContent = F.priceMax ? 'до ' + fmt(F.priceMax) : 'любая'; renderCatalog(false); });
  $$('input[name="f-r"]').forEach(r => r.addEventListener('change', () => { F.minR = Number(r.value); renderCatalog(true); }));
  $('#f-verified').addEventListener('change', e => { F.verified = e.target.checked; renderCatalog(true); });
  $('#f-today').addEventListener('change', e => { F.today = e.target.checked; renderCatalog(true); });
  $('#f-sort').addEventListener('change', e => { F.sort = e.target.value; renderCatalog(true); });
  $('#f-toggle').addEventListener('click', e => { const f = $('#filters'), b = e.currentTarget; f.hidden = !f.hidden; b.setAttribute('aria-expanded', String(!f.hidden)); });
  $('#f-reset').addEventListener('click', () => {
    Object.assign(F, {q: '', words: [], cat: null, district: '', priceMax: 0, minR: 0, verified: false, today: false, limit: 9});
    $('#q').value = ''; $('#q-clear').hidden = true; $('#f-district').value = ''; $('#f-r0').checked = true; $('#f-verified').checked = false; $('#f-today').checked = false;
    renderCats(); renderPriceRange(); renderCatalog(true);
  });
  $('#more').addEventListener('click', () => { F.limit += 9; renderCatalog(false); });
  const grid = $('#grid');
  grid.addEventListener('click', e => {
    if (e.target.closest('#empty-post')) { openPostJob(); return; }
    const card = e.target.closest('.card'); if (!card) return;
    const id = card.dataset.id, a = e.target.closest('[data-act]'), act = a && a.dataset.act;
    if (act === 'fav') { toggleFav(id); return; }
    if (act === 'cmp') { toggleCompare(id); return; }
    openProfile(id);
  });
  if (FINE && !REDUCE) {
    grid.addEventListener('pointermove', e => {
      const card = e.target.closest('.card'); if (!card) return;
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', ((px - 0.5) * 7).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - py) * 6).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      card.classList.add('tilting');
    });
    grid.addEventListener('pointerout', e => {
      const card = e.target.closest('.card');
      if (card && !card.contains(e.relatedTarget)) { card.classList.remove('tilting'); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); }
    });
  }
  $('#tray-go').addEventListener('click', openCompare);
  $('#tray-clear').addEventListener('click', () => { Array.from(cmp).forEach(id => toggleCompare(id)); });
}

/* ---------- биржа заказов ---------- */
const JF = {cat: null};
const openJobs = new Set();
function jobHTML(j) {
  const c = CAT[j.cat] || CATS[0], mine = isMineJob(j), responded = iResponded(j), n = j.responses.length, open = openJobs.has(j.id) && n;
  return '<article class="job" data-id="' + esc(j.id) + '"><span class="job-ic">' + icon(c.ic) + '</span><div class="job-main">' +
    '<div class="job-top"><h3>' + esc(j.title) + '</h3><span class="job-budget">' + (j.budget ? 'до ' + fmt(j.budget) : 'Договорная') + '</span></div>' +
    '<p class="job-meta">' + (j.demo ? '<span class="ex">пример</span>' : '') + '<span>' + esc(j.cat) + '</span><span>' + icon('pin') + esc(j.district || '—') + '</span><span class="' + (j.when === 'Срочно' ? 'hot' : '') + '">' + icon('clock') + esc(j.when || 'Не спешу') + '</span><span>' + ago(j.createdAt) + '</span></p>' +
    (j.desc ? '<p class="job-desc">' + esc(j.desc) + '</p>' : '') +
    (responded && !mine ? '<div class="job-phone"><span>Телефон заказчика, ' + esc(j.name || 'клиент') + ':</span><output>' + esc(jobPhone(j) || '—') + '</output><button class="link" type="button" data-act="copy">Скопировать</button></div>' : '') +
    '<div class="job-foot"><button class="resp-btn" type="button" data-act="resps" aria-expanded="' + !!open + '"' + (n ? '' : ' disabled') + '>' + (n ? pl(n, RESP) : 'Пока без откликов') + '</button>' +
    (mine ? '<span class="mine">Ваш заказ</span><button class="btn btn-sm btn-ghost" type="button" data-act="close">Закрыть заказ</button>'
      : responded ? '<span class="done-lbl">' + icon('check') + 'Вы откликнулись</span>' : '<button class="btn btn-sm" type="button" data-act="respond">Откликнуться</button>') +
    '</div>' +
    (open ? '<div class="resps">' + j.responses.map(r => '<div class="resp"><b>' + esc(r.name) + '</b><span class="resp-price">' + (r.price ? fmt(r.price) : '—') + '</span>' + (r.msg ? '<p>' + esc(r.msg) + '</p>' : '') + (mine && r.phone ? '<output>' + esc(r.phone) + '</output>' : '') + '<span class="muted sm">' + ago(r.at) + '</span></div>').join('') + '</div>' : '') +
    '</div></article>';
}
function renderJobs() {
  const all = jobsAll().filter(j => j.status !== 'closed');
  const counts = {}; all.forEach(j => { counts[j.cat] = (counts[j.cat] || 0) + 1; });
  const cats = CATS.filter(c => counts[c.k]);
  $('#job-cats').innerHTML = '<button class="chip" type="button" data-jc="" aria-pressed="' + !JF.cat + '">Все · ' + all.length + '</button>' + cats.map(c => '<button class="chip" type="button" data-jc="' + esc(c.k) + '" aria-pressed="' + (JF.cat === c.k) + '">' + esc(c.k) + ' · ' + counts[c.k] + '</button>').join('');
  const list = all.filter(j => !JF.cat || j.cat === JF.cat);
  $('#jobs-list').innerHTML = list.length ? list.map(jobHTML).join('') : '<div class="empty">' + icon('briefcase') + '<p>Открытых заказов пока нет. Разместите первый, и мастера предложат цену.</p></div>';
}
function findJob(id) { return jobsAll().find(j => j.id === id) || null; }
function openPostJob(preset) {
  if (FB.on && !isRegistered()) { openAuth({reason: 'Чтобы разместить заказ, войдите по номеру телефона.', then: () => openPostJob(preset)}); return; }
  const me = local.me || {}, pre = preset && typeof preset === 'object' && !(preset instanceof Event) ? preset : {}, pc = (typeof preset === 'string' && CAT[preset]) ? preset : CAT[pre.cat] ? pre.cat : F.cat, wi = WHEN.indexOf(pre.when) >= 0 ? WHEN.indexOf(pre.when) : 2;
  const el = Modal.open('<h2 class="m-h">Новый заказ</h2><p class="m-sub">' + (pre.title ? 'ИИ заполнил заказ по вашему описанию. Проверьте и поправьте, если нужно.' : 'Мастера увидят задачу и предложат цену. Телефон откроется только тем, кто откликнется.') + '</p>' +
    '<form class="mform" id="jp" novalidate>' +
    '<div class="row2"><div class="fld"><label for="jp-cat">Кто нужен</label><select class="inp sel" id="jp-cat">' + CATS.map(c => '<option' + (pc === c.k ? ' selected' : '') + '>' + esc(c.k) + '</option>').join('') + '</select></div>' +
    '<div class="fld"><label for="jp-district">Район</label><select class="inp sel" id="jp-district">' + DISTRICTS.map(d => '<option>' + esc(d) + '</option>').join('') + '</select></div></div>' +
    '<div class="fld"><label for="jp-title">Коротко о задаче *</label><input class="inp" id="jp-title" maxlength="80" placeholder="Например: положить плитку в ванной, 6 м²" value="' + esc(pre.title || '') + '"></div>' +
    '<div class="fld"><label for="jp-desc">Подробности</label><textarea class="inp" id="jp-desc" maxlength="600" placeholder="Что уже есть, какие материалы, когда удобно">' + esc(pre.desc || '') + '</textarea></div>' +
    '<div class="fld"><span class="lab">Когда</span><div class="seg">' + WHEN.map((w, i) => '<label><input type="radio" name="jp-when" id="jp-when-' + i + '" value="' + esc(w) + '"' + (i === wi ? ' checked' : '') + '><span>' + esc(w) + '</span></label>').join('') + '</div></div>' +
    '<div class="row2"><div class="fld"><label for="jp-budget">Бюджет, необязательно</label><input class="inp" id="jp-budget" type="number" min="0" inputmode="numeric" placeholder="Договорная"></div><div></div></div>' +
    '<div class="row2"><div class="fld"><label for="jp-name">Ваше имя *</label><input class="inp" id="jp-name" autocomplete="name" maxlength="40" value="' + esc(me.name || '') + '"></div>' +
    '<div class="fld"><label for="jp-phone">Телефон *</label><input class="inp" id="jp-phone" type="tel" autocomplete="tel" maxlength="24" placeholder="+___ __ ___ __ __" value="' + esc(me.phone || '') + '"></div></div>' +
    '<p class="err" id="jp-err" role="alert" hidden></p><button class="btn btn-brass" type="submit" style="justify-self:start">Опубликовать заказ</button></form>',
  {label: 'Новый заказ', kind: 'post'});
  $('#jp', el).addEventListener('submit', async e => {
    e.preventDefault();
    const v = id => $(id, el).value.trim(), er = $('#jp-err', el);
    const title = v('#jp-title'), name = v('#jp-name'), phone = v('#jp-phone');
    const fail = msg => { er.textContent = msg; er.hidden = false; };
    if (title.length < 5) return fail('Опишите задачу хотя бы в нескольких словах.');
    if (name.length < 2) return fail('Укажите имя.');
    if (digits(phone).length < 9) return fail('Проверьте телефон: в нём должно быть не меньше 9 цифр.');
    const w = el.querySelector('input[name="jp-when"]:checked');
    const btn = e.target.querySelector('[type="submit"]'); btn.disabled = true;
    const res = await saveJob({cat: v('#jp-cat'), title: title.slice(0, 80), desc: v('#jp-desc').slice(0, 600), district: v('#jp-district'), budget: Number(v('#jp-budget')) || null, when: w ? w.value : 'Не спешу', name: name.slice(0, 40), phone: phone.slice(0, 24)});
    if (!res) { btn.disabled = false; return; }
    if (!FB.on) { local.me = Object.assign({}, local.me, {name, phone}); saveLocal(); }
    Modal.close(true);
    JF.cat = null;
    toast(res.where === 'shared' ? 'Заказ опубликован для всех посетителей' : 'Заказ опубликован');
    goTo('jobs');
  });
}
function openRespond(id) {
  const j = findJob(id); if (!j) return;
  if (FB.on && !isRegistered()) { openAuth({reason: 'Чтобы откликнуться на заказ, войдите по номеру телефона.', then: () => openRespond(id)}); return; }
  const mine = masters().find(isMine), me = local.me || {};
  const el = Modal.open('<h2 class="m-h">Отклик на заказ</h2><p class="m-sub">' + esc(j.title) + ' · ' + esc(j.district || '') + (j.budget ? ' · бюджет до ' + fmt(j.budget) : '') + '</p>' +
    '<form class="mform" id="jr" novalidate>' +
    '<div class="row2"><div class="fld"><label for="jr-name">Имя мастера *</label><input class="inp" id="jr-name" maxlength="40" autocomplete="name" value="' + esc((mine && mine.name) || me.name || '') + '"></div>' +
    '<div class="fld"><label for="jr-phone">Телефон *</label><input class="inp" id="jr-phone" type="tel" maxlength="24" autocomplete="tel" placeholder="+___ __ ___ __ __" value="' + esc((mine && phoneOf(mine)) || me.phone || '') + '"></div></div>' +
    '<div class="row2"><div class="fld"><label for="jr-price">Ваша цена *</label><input class="inp" id="jr-price" type="number" min="1" inputmode="numeric" placeholder="' + (j.budget ? fmt(j.budget) : '500') + '"></div><div></div></div>' +
    '<div class="fld"><label for="jr-msg">Сообщение заказчику</label><textarea class="inp" id="jr-msg" maxlength="400" placeholder="Когда можете приехать, что входит в цену"></textarea></div>' +
    '<p class="err" id="jr-err" role="alert" hidden></p><button class="btn" type="submit" style="justify-self:start">Отправить отклик</button></form>',
  {label: 'Отклик на заказ', kind: 'respond'});
  $('#jr', el).addEventListener('submit', async e => {
    e.preventDefault();
    const v = s => $(s, el).value.trim(), er = $('#jr-err', el);
    const name = v('#jr-name'), phone = v('#jr-phone'), price = Number(v('#jr-price'));
    const fail = msg => { er.textContent = msg; er.hidden = false; };
    if (name.length < 2) return fail('Укажите имя.');
    if (digits(phone).length < 9) return fail('Проверьте телефон: в нём должно быть не меньше 9 цифр.');
    if (!(price > 0)) return fail('Укажите цену за работу.');
    const sb = e.target.querySelector('[type="submit"]'); sb.disabled = true;
    const ok = await addResponse(j, {name: name.slice(0, 40), phone: phone.slice(0, 24), price, msg: v('#jr-msg').slice(0, 400), at: Date.now()});
    if (ok === false) { sb.disabled = false; return; }
    local.responded[j.id] = true;
    if (!FB.on) local.me = Object.assign({}, local.me, {name, phone});
    saveLocal();
    Modal.close(true);
    renderJobs();
    toast('Отклик добавлен. Телефон заказчика открыт');
  });
}
function initJobs() {
  $('#btn-post-job').addEventListener('click', () => openPostJob());
  $('#btn-ai-job').addEventListener('click', () => openAIHelp(''));
  $('#job-cats').addEventListener('click', e => { const b = e.target.closest('[data-jc]'); if (b) { JF.cat = b.dataset.jc || null; renderJobs(); } });
  $('#jobs-list').addEventListener('click', e => {
    const card = e.target.closest('.job'); if (!card) return;
    const id = card.dataset.id, a = e.target.closest('[data-act]'), act = a && a.dataset.act;
    if (act === 'respond') openRespond(id);
    else if (act === 'resps') { if (openJobs.has(id)) openJobs.delete(id); else openJobs.add(id); renderJobs(); }
    else if (act === 'close') { const j = findJob(id); if (j) { setJobStatus(j, 'closed'); toast('Заказ закрыт'); } }
    else if (act === 'copy') { const o = card.querySelector('.job-phone output'); if (o) copyText(o.textContent, o); }
  });
}

/* ---------- калькулятор ---------- */
const num = sel => { const v = parseFloat(String($(sel).value).replace(',', '.')); return isFinite(v) && v > 0 ? v : 0; };
const radio = name => { const el = document.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; };
const setText = (sel, t) => { const el = $(sel); if (el) el.textContent = t; };

/* ---------- регистрация мастера ---------- */
const WZ = {step: 0, editing: null, avatar: null, photos: [], svc: []};
const wzVal = id => $(id).value.trim();
function syncBrandsFld() {
  const p = document.querySelector('input[name="w-prof"]:checked');
  $('#w-brands-fld').hidden = !(p && CAT[p.value] && CAT[p.value].g === 1);
}
function readWizard() {
  const p = document.querySelector('input[name="w-prof"]:checked');
  return {
    name: wzVal('#w-name').slice(0, 60), prof: p ? p.value : '', district: wzVal('#w-district').slice(0, 60),
    exp: clamp(parseInt($('#w-exp').value, 10) || 0, 0, 60), about: wzVal('#w-about').slice(0, 400),
    price: Math.max(0, parseInt($('#w-price').value, 10) || 0), unit: $('#w-unit').value,
    brands: (p && CAT[p.value] && CAT[p.value].g === 1) ? $$('#w-brands input:checked').map(x => x.value) : [],
    services: WZ.svc.filter(s => s.n.trim()).map(s => ({n: s.n.trim().slice(0, 80), p: s.p.trim().slice(0, 40)})).slice(0, 12),
    phone: wzVal('#w-phone').slice(0, 24), today: $('#w-today').checked, resp: parseInt($('#w-resp').value, 10) || 60,
    avatar: WZ.avatar || null, photos: WZ.photos.slice(0, 3),
    schedule: {days: [0, 1, 2, 3, 4, 5, 6].map(g => { const c = document.querySelector('[data-wd="' + g + '"]'); return !!(c && c.checked); }),
      from: $('#w-from').value, to: $('#w-to').value, brk: $('#w-brk').checked, brFrom: $('#w-br-from').value, brTo: $('#w-br-to').value}
  };
}
function renderPreview() {
  const d = readWizard();
  const m = enrich(Object.assign({}, d, {id: '__preview', name: d.name || 'Ваше имя', prof: d.prof || 'Специальность', source: 'preview', createdAt: Date.now()}));
  $('#wz-card').innerHTML = cardHTML(m, 0, false);
}
function renderSvc() {
  $('#w-svc').innerHTML = WZ.svc.map((s, i) => '<div class="svc-row"><input class="inp" id="w-svc-n' + i + '" data-i="' + i + '" data-k="n" value="' + esc(s.n) + '" placeholder="Название услуги" aria-label="Название услуги ' + (i + 1) + '" maxlength="80"><input class="inp" id="w-svc-p' + i + '" data-i="' + i + '" data-k="p" value="' + esc(s.p) + '" placeholder="Цена" aria-label="Цена услуги ' + (i + 1) + '" maxlength="40"><button class="icon-btn" type="button" data-del="' + i + '" aria-label="Удалить услугу">' + icon('trash') + '</button></div>').join('');
  renderSug();
}
function renderSug() {
  const p = document.querySelector('input[name="w-prof"]:checked'), c = p ? CAT[p.value] : null;
  const have = new Set(WZ.svc.map(s => norm(s.n)));
  const list = c ? c.svc.filter(s => !have.has(norm(s))) : [];
  $('#w-sug').innerHTML = list.length ? '<span class="hint" style="align-self:center">Типовые услуги:</span>' + list.map(s => '<button class="chip" type="button" data-sug="' + esc(s) + '">+ ' + esc(s) + '</button>').join('') : '';
}
function renderPhotos() {
  const ap = $('#w-ava-prev');
  ap.innerHTML = WZ.avatar ? '<img src="' + WZ.avatar + '" alt="Фото профиля">' : icon('user');
  $('#w-ava-del').hidden = !WZ.avatar;
  $('#w-thumbs').innerHTML = WZ.photos.map((p, i) => '<div class="thumb"><img src="' + p + '" alt="Фото работы ' + (i + 1) + '"><button type="button" data-delph="' + i + '" aria-label="Удалить фото ' + (i + 1) + '">' + icon('close') + '</button></div>').join('');
}
function setStep(n) {
  WZ.step = clamp(n, 0, 3);
  $$('.wz-step').forEach(f => { f.hidden = Number(f.dataset.step) !== WZ.step; });
  $$('#wz-steps button').forEach(b => { const s = Number(b.dataset.go); b.classList.toggle('cur', s === WZ.step); b.classList.toggle('done', s < WZ.step); b.setAttribute('aria-current', s === WZ.step ? 'step' : 'false'); });
  $('#wz-back').style.visibility = WZ.step === 0 ? 'hidden' : 'visible';
  $('#wz-next').hidden = WZ.step === 3;
  $('#wz-publish').hidden = WZ.step !== 3;
  wzErr('');
}
function wzErr(msg, field) {
  const e = $('#wz-err'); e.textContent = msg; e.hidden = !msg;
  $$('#wz [aria-invalid]').forEach(x => x.removeAttribute('aria-invalid'));
  if (field) { const f = $(field); if (f) { f.setAttribute('aria-invalid', 'true'); f.focus(); } }
}
function validateStep(s) {
  const d = readWizard();
  if (s === 0) {
    if (d.name.length < 2) { wzErr('Укажите имя и фамилию.', '#w-name'); return false; }
    if (digits(d.phone).length < 9) { wzErr('Укажите телефон: в нём должно быть не меньше 9 цифр.', '#w-phone'); return false; }
    if (!d.prof) { wzErr('Выберите специальность.'); return false; }
  }
  if (s === 1 && !(d.price > 0)) { wzErr('Укажите цену «от», чтобы клиенты понимали порядок цен.', '#w-price'); return false; }
  if (s === 3) {
    const sc = d.schedule;
    if (!sc.days.some(Boolean)) { wzErr('Отметьте хотя бы один рабочий день.'); return false; }
    if (H(sc.to) <= H(sc.from)) { wzErr('Конец работы должен быть позже начала.', '#w-to'); return false; }
    if (sc.brk && H(sc.brTo) <= H(sc.brFrom)) { wzErr('Конец перерыва должен быть позже начала.', '#w-br-to'); return false; }
    if (sc.brk && (H(sc.brFrom) <= H(sc.from) || H(sc.brTo) >= H(sc.to))) { wzErr('Перерыв должен быть внутри рабочего времени.', '#w-br-from'); return false; }
    if (!$('#w-agree').checked) { wzErr('Подтвердите, что телефон можно показывать клиентам.'); return false; }
  }
  return true;
}
let draftT = 0;
function onWzChange() {
  requestAnimationFrame(renderPreview);
  if (WZ.editing) return;
  clearTimeout(draftT);
  draftT = setTimeout(() => { const d = readWizard(); delete d.avatar; delete d.photos; local.draft = d; saveLocal(); }, 500);
}
function fillWizard(d) {
  $('#w-name').value = d.name || ''; $('#w-district').value = d.district || ''; $('#w-exp').value = d.exp || '';
  $('#w-about').value = d.about || ''; $('#w-about-n').textContent = String(($('#w-about').value || '').length);
  $('#w-price').value = d.price || ''; $('#w-unit').value = UNITS.indexOf(d.unit) >= 0 ? d.unit : (CAT[d.prof] ? CAT[d.prof].unit : UNITS[0]);
  $('#w-phone').value = d.phone || ''; $('#w-today').checked = !!d.today; $('#w-resp').value = String(d.resp || 60);
  $$('input[name="w-prof"]').forEach(r => { r.checked = r.value === d.prof; });
  const sc = schedOf(d);
  $$('[data-wd]').forEach(c => { c.checked = sc.days[Number(c.dataset.wd)]; });
  $('#w-from').value = sc.from; $('#w-to').value = sc.to; $('#w-brk').checked = sc.brk;
  $('#w-br-from').value = sc.brFrom; $('#w-br-to').value = sc.brTo; $('#w-br-row').hidden = !sc.brk;
  const bs = Array.isArray(d.brands) ? d.brands : [];
  $$('#w-brands input').forEach(x => { x.checked = bs.indexOf(x.value) >= 0; });
  syncBrandsFld();
  WZ.svc = (Array.isArray(d.services) ? d.services : []).map(s => ({n: s.n || '', p: s.p || ''}));
  if (!WZ.svc.length) WZ.svc = [{n: '', p: ''}];
}
function resetWizard() {
  WZ.editing = null; WZ.avatar = null; WZ.photos = [];
  fillWizard({}); $('#w-agree').checked = false;
  $('#wz-mode').hidden = true; $('#wz-publish').textContent = 'Опубликовать профиль';
  renderSvc(); renderPhotos(); setStep(0); renderPreview();
}
function startEdit(m) {
  resetWizard();
  WZ.editing = {id: m.id, source: m.source, createdAt: m.createdAt, ownerUid: m.ownerUid, verified: !!m.verified};
  fillWizard(m);
  WZ.avatar = validImg(m.avatar); WZ.photos = (Array.isArray(m.photos) ? m.photos : []).map(validImg).filter(Boolean);
  $('#w-agree').checked = true;
  $('#wz-mode').hidden = false; $('#wz-mode-txt').textContent = 'Редактирование профиля: ' + m.name;
  $('#wz-publish').textContent = 'Сохранить изменения';
  renderSvc(); renderPhotos(); setStep(0); renderPreview();
  Modal.close(true);
  goTo('join');
}
function compressImage(file, o) {
  o = o || {};
  const max = o.max || 560, square = !!o.square, quality = o.quality || 0.7;
  return new Promise((resolve, reject) => {
    if (!file || (file.type && !/^image\//.test(file.type))) { reject(new Error('type')); return; }
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error || new Error('read'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode'));
      img.onload = () => {
        let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
        if (!sw || !sh) { reject(new Error('size')); return; }
        if (square) { const s = Math.min(sw, sh); sx = (sw - s) / 2; sy = (sh - s) / 2; sw = sh = s; }
        const k = Math.min(1, max / Math.max(sw, sh)), w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
        g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
async function addAvatar(file) {
  try { WZ.avatar = await compressImage(file, {max: 240, square: true, quality: 0.78}); renderPhotos(); onWzChange(); }
  catch (e) { toast('Не получилось открыть фото. Подойдут JPG, PNG или WebP.', 'warn'); }
}
async function addPhotos(files) {
  const room = 3 - WZ.photos.length;
  if (room <= 0) { toast('Можно добавить до трёх фото работ', 'warn'); return; }
  const arr = Array.from(files || []).slice(0, room);
  for (const f of arr) {
    try { WZ.photos.push(await compressImage(f, {max: 560, quality: 0.66})); }
    catch (e) { toast('Не получилось открыть одно из фото. Подойдут JPG, PNG или WebP.', 'warn'); }
  }
  renderPhotos(); onWzChange();
}
function bindDrop(zone, onFiles) {
  ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('over'); }));
  zone.addEventListener('drop', e => { if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) onFiles(e.dataTransfer.files); });
}
async function publishWizard() {
  if (FB.on && !isRegistered()) { openAuth({reason: 'Чтобы опубликовать анкету, войдите по номеру телефона.', role: 'master', then: publishWizard}); return; }
  for (let s = 0; s <= 3; s++) { if (!validateStep(s)) { if (WZ.step !== s) { setStep(s); validateStep(s); } return; } }
  const d = readWizard();
  const btn = $('#wz-publish'), label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Сохраняем…';
  const data = Object.assign({}, d, {verified: WZ.editing ? WZ.editing.verified : false});
  const editing = WZ.editing;
  const res = await saveMaster(data, editing);
  btn.disabled = false; btn.textContent = label;
  if (!res) return;
  const newAcct = !isRegistered();
  if (newAcct) {
    const me = local.me || {};
    local.me = Object.assign({}, me, {name: d.name, phone: d.phone, registered: true, role: 'master', avatar: me.avatar || d.avatar || null, about: me.about || d.about, createdAt: me.createdAt || Date.now()});
    local.loggedOut = false;
  }
  toast(newAcct ? 'Профиль опубликован. Аккаунт создан на имя ' + d.name : editing ? 'Изменения сохранены' : res.where === 'shared' ? 'Профиль опубликован для всех посетителей' : 'Профиль опубликован');
  local.draft = null; saveLocal(); updateMeBtn(); syncAccount();
  resetWizard();
  let tries = 0;
  const tryOpen = () => { if (getMaster(res.id)) openProfile(res.id); else if (++tries < 20) setTimeout(tryOpen, 150); };
  tryOpen();
}
function initWizard() {
  $('#w-profs').innerHTML = CATS.map((c, i) => '<label class="prof-opt" for="w-prof-' + i + '"><input type="radio" name="w-prof" id="w-prof-' + i + '" value="' + esc(c.k) + '"><span>' + icon(c.ic) + esc(c.k) + '</span></label>').join('');
  $('#w-unit').innerHTML = UNITS.map(u => '<option>' + esc(u) + '</option>').join('');
  $('#w-brands').innerHTML = BRANDS.map((b, i) => '<label class="tg" for="w-br' + i + '"><input type="checkbox" id="w-br' + i + '" value="' + esc(b.n) + '"><span>' + esc(b.n) + (b.t === 'ev' ? ' ⚡' : '') + '</span></label>').join('');
  $('#w-days').innerHTML = WD_MF.map((d, i) => '<label class="dp" for="w-d' + i + '"><input type="checkbox" id="w-d' + i + '" data-wd="' + ((i + 1) % 7) + '"><span>' + d.charAt(0).toUpperCase() + d.slice(1) + '</span></label>').join('');
  ['#w-from', '#w-to', '#w-br-from', '#w-br-to'].forEach(s => { $(s).innerHTML = HOURS.map(h => '<option>' + h + '</option>').join(''); });
  $('#w-brk').addEventListener('change', e => { $('#w-br-row').hidden = !e.target.checked; });
  const form = $('#wz');
  form.addEventListener('input', e => {
    if (e.target.id === 'w-about') $('#w-about-n').textContent = String(e.target.value.length);
    if (e.target.dataset && e.target.dataset.k) { const i = Number(e.target.dataset.i); if (WZ.svc[i]) WZ.svc[i][e.target.dataset.k] = e.target.value; }
    if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid');
    onWzChange();
  });
  form.addEventListener('change', e => {
    if (e.target.name === 'w-prof') {
      syncBrandsFld();
      const c = CAT[e.target.value];
      if (c && !$('#w-price').value) $('#w-unit').value = c.unit;
      renderSug(); wzErr('');
    }
    onWzChange();
  });
  form.addEventListener('click', e => {
    const del = e.target.closest('[data-del]');
    if (del) { WZ.svc.splice(Number(del.dataset.del), 1); renderSvc(); onWzChange(); return; }
    const sug = e.target.closest('[data-sug]');
    if (sug) { const empty = WZ.svc.findIndex(s => !s.n.trim()); if (empty >= 0) WZ.svc[empty].n = sug.dataset.sug; else WZ.svc.push({n: sug.dataset.sug, p: ''}); renderSvc(); onWzChange(); const idx = WZ.svc.findIndex(s => s.n === sug.dataset.sug); const pi = $('#w-svc-p' + idx); if (pi) pi.focus(); return; }
    const ph = e.target.closest('[data-delph]');
    if (ph) { WZ.photos.splice(Number(ph.dataset.delph), 1); renderPhotos(); onWzChange(); return; }
    const go = e.target.closest('[data-go]');
    if (go) { const s = Number(go.dataset.go); if (s <= WZ.step) setStep(s); else { for (let i = WZ.step; i < s; i++) { if (!validateStep(i)) { setStep(i); validateStep(i); return; } } setStep(s); } }
  });
  $('#w-ai-about').addEventListener('click', e => aiWriteAbout(e.currentTarget));
  $('#w-svc-add').addEventListener('click', () => { WZ.svc.push({n: '', p: ''}); renderSvc(); const n = $('#w-svc-n' + (WZ.svc.length - 1)); if (n) n.focus(); });
  $('#w-ava').addEventListener('change', e => { if (e.target.files[0]) addAvatar(e.target.files[0]); e.target.value = ''; });
  $('#w-ph').addEventListener('change', e => { addPhotos(e.target.files); e.target.value = ''; });
  $('#w-ava-del').addEventListener('click', () => { WZ.avatar = null; renderPhotos(); onWzChange(); });
  bindDrop($('#w-ava-drop'), files => addAvatar(files[0]));
  bindDrop($('#w-ph-drop'), files => addPhotos(files));
  $('#wz-next').addEventListener('click', () => { if (validateStep(WZ.step)) { setStep(WZ.step + 1); $('#wz').scrollIntoView({behavior: REDUCE ? 'auto' : 'smooth', block: 'nearest'}); } });
  $('#wz-back').addEventListener('click', () => setStep(WZ.step - 1));
  $('#wz-cancel').addEventListener('click', () => { resetWizard(); restoreDraft(); toast('Редактирование отменено'); });
  form.addEventListener('submit', e => { e.preventDefault(); if (WZ.step < 3) { if (validateStep(WZ.step)) setStep(WZ.step + 1); } else publishWizard(); });
  resetWizard();
  restoreDraft();
  prefillWizard();
}
function prefillWizard() {
  if (WZ.editing) return;
  const me = local.me || {};
  if (!$('#w-name').value && me.name) $('#w-name').value = me.name;
  if (!$('#w-phone').value && me.phone) $('#w-phone').value = me.phone;
  if (!$('#w-about').value && me.about) { $('#w-about').value = me.about; $('#w-about-n').textContent = String(me.about.length); }
  if (!WZ.avatar && validImg(me.avatar)) { WZ.avatar = validImg(me.avatar); renderPhotos(); }
  renderPreview();
}
function restoreDraft() {
  if (local.draft && typeof local.draft === 'object') { fillWizard(local.draft); renderSvc(); renderPreview(); }
}

/* ---------- кабинет ---------- */
let cabTab = 'me';
function myRating() {
  const reviews = [].concat.apply([], masters().filter(isMine).map(m => m.reviews));
  const n = reviews.length, avg = n ? reviews.reduce((s, r) => s + Number(r.r), 0) / n : 0, tc = {};
  reviews.forEach(r => (Array.isArray(r.tags) ? r.tags : []).forEach(t => { tc[t] = (tc[t] || 0) + 1; }));
  return {reviews, n, avg, tags: Object.keys(tc).map(t => ({t, c: tc[t]})).sort((a, b) => b.c - a.c)};
}
function meHTML() {
  const me = local.me || {}, ava = validImg(me.avatar), r = myRating(), isMaster = masters().some(isMine);
  if (!isRegistered()) return '<div class="empty">' + icon('user') + '<p>Создайте аккаунт: укажите имя и номер телефона. Потом загрузите фото и добавьте описание.</p><button class="btn btn-brass btn-sm" type="button" data-auth>Создать аккаунт</button></div>';
  return '<form class="me-form" id="me-form" novalidate>' +
    '<div class="me-top"><div class="me-ava-wrap"><label class="me-ava" for="me-ava-in" id="me-ava-drop" title="Загрузить фото">' + (ava ? '<img src="' + ava + '" alt="Ваше фото">' : icon('user')) + '</label><span class="me-ava-edit" aria-hidden="true">' + icon('image') + '</span><input id="me-ava-in" type="file" accept="image/*" class="sr" aria-label="Загрузить фото профиля"></div>' +
    '<div class="me-id"><b>' + esc(me.name || 'Ваше имя') + '</b>' +
    '<div class="rating">' + starsHTML(r.avg, 18) + '<b>' + fmtR(r.avg) + '</b><span>' + (r.n ? pl(r.n, REV) : isMaster ? 'пока без отзывов' : 'оценки появятся, когда вы станете мастером') + '</span></div>' +
    '<span class="me-phone">' + icon('phone') + esc(me.phone || 'Телефон не указан') + '</span>' +
    (ava ? '<button class="link" type="button" id="me-ava-del">Убрать фото</button>' : '<span class="hint">Нажмите на круг или перетащите фото</span>') + '</div></div>' +
    (r.n ? sumHTML(r) : '') +
    '<div class="row2"><div class="fld"><label for="me-name">Имя *</label><input class="inp" id="me-name" autocomplete="name" maxlength="40" value="' + esc(me.name || '') + '"></div>' +
    '<div class="fld"><label for="me-phone">Телефон</label><input class="inp" id="me-phone" type="tel" autocomplete="tel" maxlength="24" placeholder="+___ __ ___ __ __" value="' + esc(me.phone || '') + '"' + (FB.on ? ' readonly title="Номер подтверждён по СМС"' : '') + '></div></div>' +
    '<div class="fld"><label for="me-about">О себе</label><textarea class="inp" id="me-about" maxlength="400" placeholder="Пара слов о себе: чем занимаетесь, какой ремонт планируете">' + esc(me.about || '') + '</textarea></div>' +
    '<p class="err" id="me-err" role="alert" hidden></p>' +
    '<div class="pf-acts"><button class="btn" type="submit">Сохранить профиль</button>' + (isMaster ? '' : '<button class="btn btn-ghost" type="button" data-go-join>Стать мастером</button>') + '</div>' +
    '<div class="acct-meta"><span>Аккаунт создан ' + esc(fmtDate(me.createdAt)) + '</span><span>' + (me.role === 'master' || isMaster ? 'Мастер' : 'Клиент') + '</span></div>' +
    '<p class="hint">Имя, фото и телефон подставляются в заявки, заказы и чат.</p></form>';
}
function bindMe(el) {
  const form = $('#me-form', el); if (!form) return;
  const setAva = async file => {
    try { local.me = Object.assign({}, local.me, {avatar: await compressImage(file, {max: 240, square: true, quality: 0.78})}); saveLocal(); updateMeBtn(); syncAccount(); toast('Фото профиля обновлено'); openCabinet('me'); }
    catch (e) { toast('Не получилось открыть фото. Подойдут JPG, PNG или WebP.', 'warn'); }
  };
  $('#me-ava-in', el).addEventListener('change', e => { if (e.target.files[0]) setAva(e.target.files[0]); });
  bindDrop($('#me-ava-drop', el), files => setAva(files[0]));
  const del = $('#me-ava-del', el);
  if (del) del.addEventListener('click', () => { local.me = Object.assign({}, local.me, {avatar: null}); saveLocal(); updateMeBtn(); syncAccount(); openCabinet('me'); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#me-name', el).value.trim(), phone = $('#me-phone', el).value.trim(), about = $('#me-about', el).value.trim(), er = $('#me-err', el);
    const fail = msg => { er.textContent = msg; er.hidden = false; };
    if (name.length < 2) return fail('Укажите имя.');
    if (phone && digits(phone).length < 9) return fail('Проверьте телефон: в нём должно быть не меньше 9 цифр.');
    local.me = Object.assign({}, local.me, {name: name.slice(0, 40), phone: FB.on && FB.user ? FB.user.phoneNumber : phone.slice(0, 24), about: about.slice(0, 400)});
    saveLocal(); updateMeBtn(); syncAccount(); toast('Профиль сохранён'); openCabinet('me');
  });
}
function updateMeBtn() {
  const b = $('#btn-cab'), me = local.me || {}, ava = validImg(me.avatar);
  if (isRegistered()) {
    b.innerHTML = '<span class="acct-ava">' + (ava ? '<img src="' + ava + '" alt="">' : esc(initials(me.name))) + '</span><span class="acct-name"></span>';
    b.querySelector('.acct-name').textContent = me.name;
    b.setAttribute('aria-label', 'Мой профиль: ' + me.name);
  } else {
    b.innerHTML = '<span class="acct-ava guest">' + icon('user') + '</span><span class="acct-name">Войти</span>';
    b.setAttribute('aria-label', 'Войти или создать аккаунт');
  }
}

/* ---------- аккаунт ---------- */
const isRegistered = () => !!(local.me && local.me.registered && local.me.name && local.me.phone) && (!FB.on || !!FB.user);
const acctDoc = () => (shared.db && shared.uid) ? shared.db.collection('data/users/' + shared.uid).doc('account') : null;
async function syncAccount() {
  if (FB.on) {
    if (!FB.user || !isRegistered()) return;
    const me = local.me;
    try { await shared.db.collection('users').doc(FB.user.uid).set({name: me.name.slice(0, 40), phone: FB.user.phoneNumber, about: String(me.about || '').slice(0, 400), avatar: fbImg(me.avatar), role: me.role === 'master' ? 'master' : 'client', createdAt: me.createdAt || Date.now(), updatedAt: Date.now()}); }
    catch (e) { console.warn('Аккаунт не сохранён:', e && e.code); toast(fbErrText(e), 'warn'); }
    return;
  }
  const ref = acctDoc(); if (!ref || !isRegistered()) return;
  const me = local.me;
  try { await ref.set({name: me.name, phone: me.phone, about: me.about || '', avatar: validImg(me.avatar), role: me.role || 'client', createdAt: me.createdAt || Date.now(), updatedAt: Date.now()}); }
  catch (e) { console.warn('Аккаунт не сохранён в базе:', e && e.code); }
}
async function loadAccount() {
  if (FB.on) return;
  const ref = acctDoc(); if (!ref) return;
  if (isRegistered()) { syncAccount(); return; }
  if (local.loggedOut) return;
  try {
    const snap = await ref.get();
    const d = snap && snap.exists ? snap.data() : null;
    if (!d || typeof d.name !== 'string' || typeof d.phone !== 'string' || isRegistered()) return;
    local.me = Object.assign({}, local.me, {name: d.name.slice(0, 40), phone: d.phone.slice(0, 24), about: String(d.about || '').slice(0, 400), avatar: validImg(d.avatar), role: d.role === 'master' ? 'master' : 'client', createdAt: Number(d.createdAt) || Date.now(), registered: true});
    saveLocal(); updateMeBtn(); invalidate();
    toast('С возвращением, ' + local.me.name + '!');
  } catch (e) { /* без синхронизации */ }
}
/* Номер в международном формате: +992 900 00 00 00 → +992900000000 */
function toE164(p) {
  const raw = String(p || '').trim(), d = digits(raw);
  if (raw.charAt(0) === '+') return '+' + d;
  if (raw.slice(0, 2) === '00') return '+' + d.slice(2);
  const cc = digits(CFG.defaultCountryCode || '+992');
  return d.length <= 10 && d.indexOf(cc) !== 0 ? '+' + cc + d.replace(/^0+/, '') : '+' + d;
}
const AUTH_ERR = {
  'auth/invalid-phone-number': 'Проверьте номер: начните с кода страны, например +992.',
  'auth/missing-phone-number': 'Введите номер телефона.',
  'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже.',
  'auth/quota-exceeded': 'Сейчас не получается отправить СМС. Попробуйте позже.',
  'auth/invalid-verification-code': 'Неверный код. Проверьте СМС и введите ещё раз.',
  'auth/code-expired': 'Код устарел. Запросите новый.',
  'auth/network-request-failed': 'Нет связи. Проверьте интернет.',
  'auth/captcha-check-failed': 'Проверка «я не робот» не прошла. Обновите страницу.',
  'auth/operation-not-allowed': 'Вход по СМС не включён в настройках Firebase.',
  'auth/unauthorized-domain': 'Этот адрес сайта не добавлен в Firebase (Authorized domains).'
};
function fbOpenAuth(opts) {
  opts = opts || {};
  const me = local.me || {};
  const clearRc = () => { if (FB.rc) { try { FB.rc.clear(); } catch (e) { /* уже очищено */ } FB.rc = null; } };
  const el = Modal.open('<h2 class="m-h">Вход по номеру телефона</h2><p class="m-sub">' + esc(opts.reason || 'Пришлём код в СМС. Пароль не нужен.') + '</p>' +
    '<ul class="auth-perks"><li>' + icon('chat') + 'Переписка с мастерами в чате</li><li>' + icon('clock') + 'Записи и заказы в одном месте</li><li>' + icon('shield') + 'Номер подтверждён, поэтому вам доверяют</li></ul>' +
    '<form class="mform" id="au-ph" novalidate>' +
    '<div class="fld"><label for="au-phone">Номер телефона *</label><input class="inp" id="au-phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="24" placeholder="' + esc(CFG.defaultCountryCode || '+992') + ' __ ___ __ __" value="' + esc(me.phone || '') + '"></div>' +
    '<label class="check" for="au-agree"><input type="checkbox" id="au-agree"><span>Принимаю <a href="privacy.html" target="_blank" rel="noopener">политику конфиденциальности</a>. Имя и номер увидят мастера и клиенты, с которыми я общаюсь</span></label>' +
    '<div id="au-rc"></div><p class="err" id="au-err" role="alert" hidden></p><button class="btn btn-brass" type="submit" id="au-send" style="justify-self:start">Получить код</button></form>' +
    '<form class="mform" id="au-code" novalidate hidden>' +
    '<div class="fld"><label for="au-otp">Код из СМС *</label><input class="inp otp" id="au-otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="······"></div>' +
    '<p class="hint" id="au-sent"></p><p class="hint">Никому не сообщайте этот код. Сотрудники сервиса его никогда не спрашивают.</p><p class="err" id="au-err2" role="alert" hidden></p>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-brass" type="submit" id="au-check">Войти</button><button class="btn btn-ghost" type="button" id="au-back">Изменить номер</button></div></form>' +
    '<form class="mform" id="au" novalidate hidden>' +
    '<div class="fld"><span class="lab" id="au-role-lab">Кто вы? *</span><div class="role-pick" id="au-roles" role="radiogroup" aria-labelledby="au-role-lab">' +
    '<label class="role-opt" for="au-role-c"><input type="radio" name="au-role" id="au-role-c" value="client"' + (opts.role === 'client' ? ' checked' : '') + '><span>' + icon('search') + '<b>Ищу мастера</b><small>Найти мастера, записаться, разместить заказ</small></span></label>' +
    '<label class="role-opt" for="au-role-m"><input type="radio" name="au-role" id="au-role-m" value="master"' + (opts.role === 'master' ? ' checked' : '') + '><span>' + icon('toolbox') + '<b>Я мастер</b><small>Получать заказы и отзывы от клиентов</small></span></label></div></div>' +
    '<div class="fld"><label for="au-name">Имя и фамилия *</label><input class="inp" id="au-name" autocomplete="name" maxlength="40" placeholder="Например: Иван Петров" value="' + esc(me.name || '') + '"></div>' +
    '<p class="err" id="au-err3" role="alert" hidden></p><button class="btn btn-brass" type="submit" style="justify-self:start">Готово</button></form>',
  {label: 'Вход', kind: 'auth', onClose: clearRc});
  const show = id => { ['#au-ph', '#au-code', '#au'].forEach(f => { $(f, el).hidden = f !== id; }); const i = $(id, el).querySelector('input:not([type=radio]):not([type=checkbox])'); if (i && FINE) i.focus(); };
  const fail = (sel, msg) => { const er = $(sel, el); er.textContent = msg; er.hidden = !msg; };
  const finish = (isNew) => {
    local.loggedOut = false;
    saveLocal(); updateMeBtn(); invalidate(); prefillWizard();
    Modal.close(true);
    toast(isNew ? 'Аккаунт создан. Здравствуйте, ' + local.me.name + '!' : 'С возвращением, ' + local.me.name + '!');
    if (opts.then) { opts.then(); return; }
    if (local.me.role === 'master' && !masters().some(isMine)) { goTo('join'); setTimeout(() => toast('Осталось выбрать специальность и указать цены'), 900); }
  };
  const afterLogin = async user => {
    try {
      const snap = await shared.db.collection('users').doc(user.uid).get();
      const d = snap.exists ? snap.data() : null;
      if (d && typeof d.name === 'string') {
        local.me = Object.assign({}, local.me, {name: d.name.slice(0, 40), phone: user.phoneNumber, about: String(d.about || '').slice(0, 400), avatar: validImg(d.avatar), role: d.role === 'master' ? 'master' : 'client', createdAt: fsTime(d.createdAt) || Date.now(), registered: true});
        finish(false); return;
      }
    } catch (e) { console.warn('Профиль:', e && e.code); }
    show('#au');
  };
  if (FB.user) { show('#au'); }
  $('#au-ph', el).addEventListener('submit', async e => {
    e.preventDefault();
    const phone = toE164($('#au-phone', el).value);
    if (!/^\+\d{9,15}$/.test(phone)) return fail('#au-err', 'Проверьте номер: в нём должно быть не меньше 9 цифр.');
    if (!$('#au-agree', el).checked) return fail('#au-err', 'Подтвердите согласие с политикой конфиденциальности.');
    fail('#au-err', '');
    const btn = $('#au-send', el); btn.disabled = true; btn.textContent = 'Отправляем…';
    try {
      if (!FB.rc) FB.rc = new firebase.auth.RecaptchaVerifier($('#au-rc', el), {size: 'invisible'});
      FB.confirm = await FB.auth.signInWithPhoneNumber(phone, FB.rc);
      $('#au-sent', el).textContent = 'Код отправлен на ' + phone;
      show('#au-code');
    } catch (err) {
      console.warn('СМС:', err && err.code);
      clearRc(); $('#au-rc', el).innerHTML = '';
      fail('#au-err', AUTH_ERR[err && err.code] || 'Не получилось отправить СМС. Попробуйте позже.');
    }
    btn.disabled = false; btn.textContent = 'Получить код';
  });
  $('#au-back', el).addEventListener('click', () => { FB.confirm = null; show('#au-ph'); });
  $('#au-code', el).addEventListener('submit', async e => {
    e.preventDefault();
    const code = digits($('#au-otp', el).value);
    if (code.length !== 6 || !FB.confirm) return fail('#au-err2', 'Введите шесть цифр из СМС.');
    fail('#au-err2', '');
    const btn = $('#au-check', el); btn.disabled = true;
    try {
      const cred = await FB.confirm.confirm(code);
      FB.confirm = null; clearRc();
      await afterLogin(cred.user);
    } catch (err) {
      console.warn('Код:', err && err.code);
      fail('#au-err2', AUTH_ERR[err && err.code] || 'Не получилось войти. Попробуйте ещё раз.');
    }
    btn.disabled = false;
  });
  $('#au', el).addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#au-name', el).value.trim(), r = el.querySelector('input[name="au-role"]:checked');
    if (!r) return fail('#au-err3', 'Выберите, кто вы: ищете мастера или вы мастер.');
    if (name.length < 2) return fail('#au-err3', 'Укажите имя, по нему вас узнают мастера и клиенты.');
    if (!FB.user) { show('#au-ph'); return; }
    local.me = Object.assign({}, local.me, {name: name.slice(0, 40), phone: FB.user.phoneNumber, role: r.value, registered: true, createdAt: Date.now()});
    await syncAccount();
    finish(true);
  });
}
function openAuth(opts) {
  if (FB.on) { fbOpenAuth(opts); return; }
  opts = opts || {};
  const me = local.me || {};
  const el = Modal.open('<h2 class="m-h">Создайте аккаунт</h2><p class="m-sub">' + esc(opts.reason || 'Аккаунт привязан к вашему имени и номеру телефона.') + '</p>' +
    '<ul class="auth-perks"><li>' + icon('chat') + 'Переписка с мастерами в чате</li><li>' + icon('clock') + 'Заявки и заказы без повторного ввода данных</li><li>' + icon('star') + 'Отзывы и оценки от вашего имени</li></ul>' +
    '<form class="mform" id="au" novalidate>' +
    '<div class="fld"><span class="lab" id="au-role-lab">Кто вы? *</span><div class="role-pick" id="au-roles" role="radiogroup" aria-labelledby="au-role-lab">' +
    '<label class="role-opt" for="au-role-c"><input type="radio" name="au-role" id="au-role-c" value="client"' + (opts.role === 'client' ? ' checked' : '') + '><span>' + icon('search') + '<b>Ищу мастера</b><small>Найти мастера, записаться, разместить заказ</small></span></label>' +
    '<label class="role-opt" for="au-role-m"><input type="radio" name="au-role" id="au-role-m" value="master"' + (opts.role === 'master' ? ' checked' : '') + '><span>' + icon('toolbox') + '<b>Я мастер</b><small>Получать заказы и отзывы от клиентов</small></span></label></div></div>' +
    '<div class="row2"><div class="fld"><label for="au-name">Имя и фамилия *</label><input class="inp" id="au-name" autocomplete="name" maxlength="40" placeholder="Например: Иван Петров" value="' + esc(me.name || '') + '"></div>' +
    '<div class="fld"><label for="au-phone">Номер телефона *</label><input class="inp" id="au-phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="24" placeholder="+___ __ ___ __ __" value="' + esc(me.phone || '') + '"></div></div>' +
    '<label class="check" for="au-agree"><input type="checkbox" id="au-agree"><span>Согласен, что имя и номер увидят мастера и клиенты, с которыми я общаюсь</span></label>' +
    '<p class="err" id="au-err" role="alert" hidden></p><button class="btn btn-brass" type="submit" id="au-go" style="justify-self:start">Создать аккаунт</button></form>',
  {label: 'Создать аккаунт', kind: 'auth'});
  const syncGo = () => {
    const r = el.querySelector('input[name="au-role"]:checked');
    $('#au-go', el).textContent = r && r.value === 'master' && !masters().some(isMine) ? 'Создать аккаунт и заполнить анкету' : 'Создать аккаунт';
    if (r) $('#au-roles', el).removeAttribute('aria-invalid');
  };
  $('#au-roles', el).addEventListener('change', syncGo); syncGo();
  $('#au', el).addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#au-name', el).value.trim(), phone = $('#au-phone', el).value.trim(), er = $('#au-err', el);
    const r = el.querySelector('input[name="au-role"]:checked'), role = r ? r.value : '';
    const fail = (msg, f) => { er.textContent = msg; er.hidden = false; $$('[aria-invalid]', el).forEach(x => x.removeAttribute('aria-invalid')); if (f) { $(f, el).setAttribute('aria-invalid', 'true'); $(f, el).focus(); } };
    if (!role) { fail('Выберите, кто вы: ищете мастера или вы мастер.', '#au-roles'); $('#au-role-c', el).focus(); return; }
    if (name.length < 2) return fail('Укажите имя, по нему вас узнают мастера и клиенты.', '#au-name');
    if (digits(phone).length < 9) return fail('Проверьте номер: в нём должно быть не меньше 9 цифр.', '#au-phone');
    if (!$('#au-agree', el).checked) return fail('Подтвердите, что номер можно показывать собеседникам.');
    local.me = Object.assign({}, local.me, {name: name.slice(0, 40), phone: phone.slice(0, 24), role, registered: true, createdAt: Date.now()});
    local.loggedOut = false;
    saveLocal(); updateMeBtn(); syncAccount(); invalidate(); prefillWizard();
    Modal.close(true);
    toast('Аккаунт создан. Здравствуйте, ' + local.me.name + '!');
    if (role === 'master' && !masters().some(isMine)) { goTo('join'); setTimeout(() => toast('Осталось выбрать специальность и указать цены'), 900); return; }
    if (opts.then) opts.then();
  });
}
function requireAccount(reason, then) { if (isRegistered()) then(); else openAuth({reason, then}); }
function logout() {
  if (FB.on && FB.auth) {
    const t = local.pushToken;
    local.pushOn = false; local.pushToken = null;
    (t && FB.user ? shared.db.collection('pushTokens').doc(t).delete().catch(() => null) : Promise.resolve())
      .then(() => FB.auth.signOut()).catch(e => console.warn('Выход:', e && e.code));
  }
  local.me = null; local.loggedOut = true; saveLocal();
  updateMeBtn(); invalidate(); Modal.close(true);
  toast('Вы вышли из аккаунта');
}
function cabHTML() {
  const mm = masters().filter(isMine), ids = new Set(mm.map(m => m.id));
  const sent = local.requests, incoming = local.requests.filter(r => ids.has(r.masterId)), jobs = jobsAll().filter(isMineJob);
  const bkAs = role => [].concat.apply([], threads().filter(t => t.role === role).map(t => t.msgs.filter(x => x.kind === 'booking').map(x => ({x, t})))).sort((a, b) => (b.x.at || 0) - (a.x.at || 0));
  const myBk = bkAs('client'), inBk = bkAs('master');
  const unread = threads().reduce((n, t) => n + t.unread, 0), inPending = inBk.filter(o => bkStatus(o.x) === 'pending').length;
  const tabs = [['me', 'Мой профиль', 'user', 0], ['requests', 'Мои записи', 'clock', myBk.length + sent.length], ['jobs', 'Мои заказы', 'briefcase', jobs.length], ['favs', 'Избранное', 'heart', favCount()], ['profiles', 'Я мастер', 'tools', inPending], ['settings', 'Настройки', 'gear', 0]];
  let body = '';
  if (cabTab === 'me') {
    body = meHTML();
  } else if (cabTab === 'settings') {
    body = settingsHTML();
  } else if (cabTab === 'favs') {
    const list = local.favs.map(getMaster).filter(Boolean);
    body = list.length ? list.map(m => miniHTML(m, '<button class="btn btn-sm" type="button" data-open="' + esc(m.id) + '">Профиль</button><button class="icon-btn" type="button" data-unfav="' + esc(m.id) + '" aria-label="Убрать из избранного">' + icon('trash') + '</button>')).join('')
      : '<div class="empty">' + icon('heart') + '<p>Нажмите на сердечко на карточке мастера, и он появится здесь.</p><button class="btn btn-sm" type="button" data-go-catalog>Открыть каталог</button></div>';
  } else if (cabTab === 'profiles') {
    body = mm.length ? mm.map(m => miniHTML(m, '<button class="btn btn-sm" type="button" data-addwork="' + esc(m.id) + '">' + icon('camera') + 'Добавить работу</button><button class="btn btn-sm btn-ghost" type="button" data-open="' + esc(m.id) + '">Открыть</button><button class="btn btn-sm btn-ghost" type="button" data-edit="' + esc(m.id) + '">' + icon('edit') + 'Изменить</button><span data-delwrap="' + esc(m.id) + '"><button class="icon-btn" type="button" data-del="' + esc(m.id) + '" aria-label="Удалить профиль">' + icon('trash') + '</button></span>')).join('')
      : '<div class="empty">' + icon('user') + '<p>У вас пока нет профиля мастера. Он появится здесь сразу после регистрации.</p><button class="btn btn-sm btn-brass" type="button" data-go-join>Создать профиль</button></div>';
    if (inBk.length) body += '<p class="cab-sub">Запросы на запись от клиентов</p>' + inBk.map(o => bkRowHTML(o, 'master')).join('');
    if (incoming.length) body += '<p class="cab-sub">Заявки к вашим профилям</p>' + incoming.map(r => reqHTML(r, true)).join('');
  } else if (cabTab === 'requests') {
    body = (myBk.length || sent.length) ? myBk.map(o => bkRowHTML(o, 'client')).join('') + sent.map(r => reqHTML(r, false)).join('') : '<div class="empty">' + icon('clock') + '<p>Записей пока нет. Откройте профиль мастера и нажмите «Записаться на время».</p></div>';
  } else {
    body = jobs.length ? jobs.map(j => '<div class="req"><div class="req-top"><b>' + esc(j.title) + '</b><span class="muted sm">' + (j.status === 'closed' ? 'Закрыт' : 'Открыт') + ' · ' + ago(j.createdAt) + '</span></div><div class="req-meta"><span>' + esc(j.cat) + '</span><span>' + esc(j.district || '') + '</span><span>' + (j.budget ? 'до ' + fmt(j.budget) : 'Договорная') + '</span><span>' + pl(j.responses.length, RESP) + '</span></div>' +
      (j.responses.length ? '<div class="resps">' + j.responses.map(r => '<div class="resp"><b>' + esc(r.name) + '</b><span class="resp-price">' + fmt(r.price) + '</span>' + (r.msg ? '<p>' + esc(r.msg) + '</p>' : '') + (r.phone ? '<output>' + esc(r.phone) + '</output>' : '') + '</div>').join('') + '</div>' : '') +
      '<div class="mini-acts" style="justify-content:flex-start"><button class="btn btn-sm btn-ghost" type="button" data-jstatus="' + esc(j.id) + '">' + (j.status === 'closed' ? 'Открыть снова' : 'Закрыть заказ') + '</button></div></div>').join('')
      : '<div class="empty">' + icon('briefcase') + '<p>Вы ещё не размещали заказы. Опишите задачу, и мастера предложат цену.</p><button class="btn btn-sm btn-brass" type="button" data-post>Разместить заказ</button></div>';
  }
  const navBtn = t => '<button type="button" data-ctab="' + t[0] + '" aria-current="' + (cabTab === t[0]) + '">' + icon(t[2]) + '<span>' + t[1] + '</span>' + (t[3] ? '<em>' + t[3] + '</em>' : '') + '</button>';
  return '<h2 class="m-h">Мой кабинет</h2><div class="hub"><nav class="hub-nav" aria-label="Разделы кабинета">' + tabs.slice(0, 5).map(navBtn).join('') +
    '<button type="button" data-chat>' + icon('chat') + '<span>Сообщения</span>' + (unread ? '<em class="hot">' + unread + '</em>' : '') + '</button>' + navBtn(tabs[5]) + '</nav>' +
    '<div class="hub-body" id="cab-body">' + body + '</div></div>';
}
function bkRowHTML(o, role) {
  const x = o.x, t = o.t, st = bkStatus(x);
  return '<div class="req"><div class="req-top"><b>' + esc(role === 'master' ? (t.clientName || 'Клиент') : (t.masterName || 'Мастер')) + '</b><span class="muted sm">' + esc(fmtDay(x.day)) + ' в ' + esc(x.slot) + '</span></div>' +
    (x.desc ? '<p>' + esc(x.desc) + '</p>' : '') +
    '<div class="req-meta"><span class="bk-st st-' + st + '">' + BK_TEXT[role][st] + '</span>' + (role === 'master' && t.clientPhone ? '<span>Телефон: ' + esc(t.clientPhone) + '</span>' : '') + '<span>' + ago(x.at) + '</span></div>' +
    '<div class="mini-acts" style="justify-content:flex-start">' + bkActs(x, role, 'data-cbk') + '<button class="btn btn-sm btn-ghost" type="button" data-cthread="' + esc(t.id) + '">' + icon('chat') + 'Открыть чат</button></div></div>';
}
function reqHTML(r, incoming) {
  return '<div class="req"><div class="req-top"><b>' + esc(incoming ? r.name : r.masterName) + '</b><span class="muted sm">' + esc(fmtDay(r.day)) + ' в ' + esc(r.slot) + '</span></div>' +
    (r.desc ? '<p>' + esc(r.desc) + '</p>' : '') +
    '<div class="req-meta"><span>' + esc(incoming ? 'Телефон: ' + r.phone : r.prof || '') + '</span><span>Ожидает подтверждения</span><span>' + ago(r.createdAt) + '</span></div>' +
    (incoming ? '' : '<div class="mini-acts" style="justify-content:flex-start"><button class="btn btn-sm btn-ghost" type="button" data-open="' + esc(r.masterId) + '">Профиль мастера</button><button class="btn btn-sm btn-ghost" type="button" data-cancel="' + esc(r.id) + '">Отменить заявку</button></div>') + '</div>';
}
/* Кабинет обновляется на месте: при смене раздела плавно меняется только содержимое. */
function openCabinet(tab) {
  const changed = !!tab && tab !== cabTab;
  if (tab) cabTab = tab;
  if (Modal.kind === 'cab' && !Modal.root.classList.contains('closing')) {
    const el = Modal.root.querySelector('.modal'), w = $('#cab-wrap', el), y = el.scrollTop;
    w.innerHTML = cabHTML();
    if (changed) { $('.hub-body', w).classList.add('tab-in'); el.scrollTop = 0; } else el.scrollTop = y;
    bindCab(el);
    return;
  }
  const el = Modal.open('<div id="cab-wrap">' + cabHTML() + '</div>', {wide: true, label: 'Мой кабинет', kind: 'cab'});
  bindCab(el);
  el.addEventListener('click', async e => {
    const t = e.target;
    if (t.closest('[data-chat]')) { openChat(); return; }
    if (t.closest('[data-auth]')) { openAuth(); return; }
    const cbk = t.closest('[data-cbk]'); if (cbk) { cbk.disabled = true; await decideBooking(cbk.dataset.mid, cbk.dataset.cbk); setTimeout(() => openCabinet(), 80); return; }
    const cth = t.closest('[data-cthread]'); if (cth) { openChat(null, cth.dataset.cthread); return; }
    const ct = t.closest('[data-ctab]'); if (ct) { openCabinet(ct.dataset.ctab); return; }
    const u = t.closest('[data-unfav]'); if (u) { toggleFav(u.dataset.unfav); renderCatalog(); openCabinet(); return; }
    if (t.closest('[data-go-catalog]')) { Modal.close(true); goTo('catalog'); return; }
    const o = t.closest('[data-open]'); if (o) { openProfile(o.dataset.open); return; }
    const ed = t.closest('[data-edit]'); if (ed) { const m = getMaster(ed.dataset.edit); if (m) startEdit(m); return; }
    const aw = t.closest('[data-addwork]'); if (aw) { openAddWork(aw.dataset.addwork); return; }
    const del = t.closest('[data-del]');
    if (del) { const w = el.querySelector('[data-delwrap="' + cssId(del.dataset.del) + '"]'); if (w) w.innerHTML = '<button class="btn btn-sm" type="button" data-delyes="' + esc(del.dataset.del) + '" style="background:var(--hot)">Удалить навсегда</button><button class="btn btn-sm btn-ghost" type="button" data-delno>Оставить</button>'; return; }
    const yes = t.closest('[data-delyes]'); if (yes) { const m = getMaster(yes.dataset.delyes); if (m && await deleteMaster(m)) { toast('Профиль удалён'); setTimeout(() => openCabinet(), 60); } return; }
    if (t.closest('[data-delno]')) { openCabinet(); return; }
    const cn = t.closest('[data-cancel]'); if (cn) { local.requests = local.requests.filter(r => r.id !== cn.dataset.cancel); saveLocal(); toast('Заявка отменена'); openCabinet(); return; }
    const js = t.closest('[data-jstatus]'); if (js) { const j = findJob(js.dataset.jstatus); if (j) { await setJobStatus(j, j.status === 'closed' ? 'open' : 'closed'); setTimeout(() => openCabinet(), 80); } return; }
    if (t.closest('[data-go-join]')) { Modal.close(true); goTo('join'); return; }
    if (t.closest('[data-post]')) { openPostJob(); }
  });
}

function bindCab(el) { if (cabTab === 'me') bindMe(el); if (cabTab === 'settings') bindSettings(el); }

/* ---------- настройки: всё в одном месте ---------- */
const setRow = (t, d, ctl) => '<div class="set-row"><div class="set-txt"><b>' + t + '</b><span>' + d + '</span></div>' + (ctl ? '<div class="set-ctl">' + ctl + '</div>' : '') + '</div>';
const setSeg = (name, label, opts, cur) => '<div class="seg" role="radiogroup" aria-label="' + label + '">' + opts.map(o => '<label><input type="radio" name="' + name + '" value="' + o[0] + '"' + (cur === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>').join('') + '</div>';
function settingsHTML() {
  const me = local.me || {};
  const data = shared.on && shared.canWrite ? 'Общая база подключена: ваши профили и заказы видят другие посетители.' : 'Записи сохраняются в этом браузере.';
  return '<div class="set-list">' +
    '<p class="cab-sub">Вид</p>' +
    '<div class="set-row set-col"><div class="set-txt"><b>Тема</b><span>Светлая, тёмная или как в системе</span></div><div class="theme-pick" role="radiogroup" aria-label="Тема">' +
      THEMES.map(t => '<label class="th-opt"><input type="radio" name="set-theme" value="' + t[0] + '"' + ((local.theme || 'auto') === t[0] ? ' checked' : '') + '><span class="th-sw" style="--a:' + t[2][0] + ';--b:' + t[2][1] + ';--c:' + t[2][2] + '">' + (t[0] === 'auto' ? icon('spark') : '') + '</span><span class="th-name">' + t[1] + '</span></label>').join('') + '</div></div>' +
    '<div class="set-row"><div class="set-txt"><b>Язык</b><span>Язык интерфейса. Имена, отзывы и описания мастеров остаются на языке автора</span></div><div class="set-ctl"><div class="seg" role="radiogroup" aria-label="Язык" translate="no">' +
      [['ru', 'Русский'], ['en', 'English'], ['tg', 'Тоҷикӣ']].map(o => '<label><input type="radio" name="set-lang" value="' + o[0] + '"' + (LANG.cur === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>').join('') + '</div></div></div>' +
    setRow('3D-фон', 'Объёмный фон красивый, но нагружает телефон. «Авто» включает его только на мощных устройствах', setSeg('set-3d', '3D-фон', [['auto', 'Авто'], ['on', 'Вкл'], ['off', 'Выкл']], local.bg3d === 'on' || local.bg3d === 'off' ? local.bg3d : 'auto')) +
    setRow('Анимации', 'Спокойный режим убирает движение и ускоряет переходы', setSeg('set-anim', 'Анимации', [['full', 'Полные'], ['calm', 'Спокойные']], local.calm ? 'calm' : 'full')) +
    '<p class="cab-sub">Помощь</p>' +
    setRow('Инструкция', 'Как найти мастера, записаться, разместить заказ и не попасть на мошенников', '<button class="btn btn-sm" type="button" id="set-guide">' + icon('help') + 'Открыть</button>') +
    setRow('Уведомления', pushText(), pushState() === 'on' ? '<button class="btn btn-sm btn-ghost" type="button" id="set-push-off">Выключить</button>' : pushState() === 'off' ? '<button class="btn btn-sm" type="button" id="set-push-on">' + icon('bell') + 'Включить</button>' : '') +
    setRow('Конфиденциальность', 'Какие данные мы храним и кто их видит', '<a class="btn btn-sm btn-ghost" href="privacy.html" target="_blank" rel="noopener">Читать</a>') +
    '<p class="cab-sub">Каталог</p>' +
    (canInstall() ? setRow('Приложение', 'Установите на телефон или компьютер: откроется как обычное приложение, с иконкой и без адресной строки', '<button class="btn btn-sm" type="button" id="set-install">' + icon('mobile') + 'Установить</button>') : '') +
    setRow('Мастера-примеры', 'Показывать вымышленных мастеров и заказы, чтобы познакомиться с сервисом', '<label class="sw" for="set-demo"><input type="checkbox" id="set-demo"' + (local.showDemo !== false ? ' checked' : '') + '><i></i><span class="sr">Мастера-примеры</span></label>') +
    setRow('ИИ-помощник', aiOn() ? 'Подключён' + (AI.sample ? ' через Claude' : ' через ваш сервер') + '. Подбирает мастера по описанию или фото, переводит чат' : 'Не подключён. На claude.ai заработает после вашего разрешения', '') +
    '<p class="cab-sub">Данные и аккаунт</p>' +
    setRow('Где хранятся данные', data, '<span id="set-wipe-wrap"><button class="btn btn-sm btn-ghost" type="button" id="set-wipe">Очистить</button></span>') +
    (isRegistered() ? setRow('Аккаунт', esc(me.name) + ' · ' + esc(me.phone), '<span id="set-out-wrap"><button class="btn btn-sm btn-ghost" type="button" id="set-out">' + icon('logout') + 'Выйти</button></span>') : '') +
    '</div>';
}
const THEMES = [['auto', 'Авто', ['#EAF0EF', '#0A6A5D', '#071011']], ['light', 'Светлая', ['#EAF0EF', '#0A6A5D', '#94621A']], ['dark', 'Тёмная', ['#071011', '#3FC4AB', '#DDAE5B']],
  ['black', 'Чёрная', ['#000000', '#3FD1B5', '#E8BE6A']], ['ocean', 'Океан', ['#06111F', '#4CC2F2', '#FFB86B']], ['sunset', 'Закат', ['#FBF0E8', '#C2410C', '#9D3E8F']], ['lavender', 'Лаванда', ['#F1EEFA', '#6246C9', '#B0561B']]];
function applyTheme(v) {
  const r = document.documentElement;
  if (THEMES.some(t => t[0] === v && v !== 'auto')) r.setAttribute('data-theme', v); else r.removeAttribute('data-theme');
}
function applyCalm() { document.documentElement.classList.toggle('calm', !!local.calm); }
/* Настройки открываются и без аккаунта: язык и тема нужны всем. */
function openSettings() {
  if (isRegistered()) { openCabinet('settings'); return; }
  const el = Modal.open('<h2 class="m-h">' + icon('gear') + ' Настройки</h2><div id="set-wrap">' + settingsHTML() + '</div>', {label: 'Настройки', kind: 'settings'});
  bindSettings(el);
}
function reopenSettings() {
  if (Modal.kind === 'cab') { openCabinet(); return; }
  const el = Modal.root.querySelector('.modal'); if (!el) return;
  $('#set-wrap', el).innerHTML = settingsHTML(); bindSettings(el);
}
function refreshSettings(el) {
  const w = $('#set-wrap', el) || $('#cab-body', el);
  if (w) { w.innerHTML = settingsHTML(); bindSettings(el); }
}
function bindSettings(el) {
  $$('input[name="set-theme"]', el).forEach(r => r.addEventListener('change', () => { local.theme = r.value; saveLocal(); applyTheme(r.value); }));
  $$('input[name="set-lang"]', el).forEach(r => r.addEventListener('change', () => { local.lang = r.value; saveLocal(); setLang(r.value); toast({ru: 'Язык: русский', en: 'Language: English', tg: 'Забон: тоҷикӣ'}[r.value]); }));
  $$('input[name="set-3d"]', el).forEach(r => r.addEventListener('change', () => { local.bg3d = r.value; saveLocal(); toast('Применяем…'); setTimeout(() => location.reload(), 400); }));
  $$('input[name="set-anim"]', el).forEach(r => r.addEventListener('change', () => { local.calm = r.value === 'calm'; saveLocal(); applyCalm(); }));
  const si = $('#set-install', el); if (si) si.addEventListener('click', installApp);
  $('#set-guide', el).addEventListener('click', openGuide);
  const pOn = $('#set-push-on', el); if (pOn) pOn.addEventListener('click', async () => { pOn.disabled = true; await enablePush(); refreshSettings(el); });
  const pOff = $('#set-push-off', el); if (pOff) pOff.addEventListener('click', async () => { pOff.disabled = true; await disablePush(); refreshSettings(el); });
  $('#set-demo', el).addEventListener('change', e => { local.showDemo = e.target.checked; saveLocal(); invalidate(); toast(e.target.checked ? 'Примеры показаны' : 'Примеры скрыты'); });
  const confirmIn = (wrapSel, label, yes) => {
    const w = $(wrapSel, el);
    w.innerHTML = '<button class="btn btn-sm btn-no" type="button" data-yes>' + label + '</button> <button class="btn btn-sm btn-ghost" type="button" data-no>Отмена</button>';
    $('[data-yes]', w).addEventListener('click', yes);
    $('[data-no]', w).addEventListener('click', reopenSettings);
  };
  $('#set-wipe', el).addEventListener('click', () => confirmIn('#set-wipe-wrap', 'Удалить всё', () => { try { localStorage.removeItem(LS); } catch (e) { /* нет доступа */ } location.reload(); }));
  const out = $('#set-out', el);
  if (out) out.addEventListener('click', () => confirmIn('#set-out-wrap', 'Да, выйти', logout));
}

/* ---------- ИИ ----------
   На claude.ai ИИ работает через Claude без ключа: каждый посетитель тратит свой лимит и сначала разрешает это.
   Свой ключ (Gemini, OpenAI и т. п.) НЕ вставляйте в эту страницу: его увидит любой посетитель.
   Ключ хранится на сервере-посреднике (шаблон: ai-proxy-worker.js), а сюда пишется только его адрес. */
const AI_CONFIG = {endpoint: CFG.aiEndpoint || ''};
const AI = {sample: null, images: false, denied: false};
async function initAI() {
  try { if (window.claude && typeof window.claude.use === 'function') AI.sample = await window.claude.use('sample'); } catch (e) { AI.sample = null; }
  if (AI.sample) { try { const l = await AI.sample.limits(); AI.images = !!(l && l.images); } catch (e) { AI.images = false; } }
  invalidate();
}
const aiOn = () => !AI.denied && !!(AI.sample || AI_CONFIG.endpoint);
const AI_ERR = {
  no_ai: 'ИИ пока не подключён. На claude.ai он работает сразу, а на своём сайте заработает, когда вы подключите ключ.',
  not_granted: 'Вы не разрешили этой странице использовать ИИ. Разрешение можно дать после перезагрузки страницы.',
  rate_limited: 'Слишком много запросов к ИИ. Подождите минуту и попробуйте снова.',
  refused: 'ИИ не стал отвечать на этот запрос. Опишите задачу по-другому.',
  images_unavailable: 'Фото сейчас нельзя отправить ИИ. Опишите проблему текстом.',
  image_rejected: 'Это фото не подошло. Попробуйте другое.',
  invalid_json: 'ИИ ответил непонятно. Попробуйте ещё раз.',
  empty_completion: 'ИИ ничего не ответил. Попробуйте ещё раз.',
  session_expired: 'Сессия истекла. Обновите страницу.',
  sampling_disabled: 'ИИ отключён в настройках вашей организации.',
  prompt_too_large: 'Слишком длинный текст. Сократите описание.',
  network: 'Не удалось связаться с ИИ. Проверьте интернет и попробуйте снова.',
  need_login: 'Чтобы пользоваться ИИ, войдите по номеру телефона. Так мы защищаем сервис от ботов.'
};
const aiErrText = e => AI_ERR[e && e.code] || 'Не получилось получить ответ ИИ. Попробуйте позже.';
function parseJSONText(t) {
  const s = String(t || '').replace(/```(json)?/gi, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw {code: 'invalid_json'};
  try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { throw {code: 'invalid_json'}; }
}
/* Один вход для всех функций ИИ: задание, текст запроса, фото. Возвращает объект из JSON-ответа. */
async function aiAsk(task, prompt, opts) {
  opts = opts || {};
  const images = (opts.images || []).filter(Boolean);
  if (AI.denied) throw {code: 'not_granted'};
  if (AI.sample) {
    try { return await AI.sample.json(prompt, Object.assign({modelTier: 'quick', signal: opts.signal}, images.length ? {images} : {})); }
    catch (e) { if (e && e.code === 'not_granted') { AI.denied = true; invalidate(); } throw e; }
  }
  if (AI_CONFIG.endpoint) {
    const imgs = [];
    for (const f of images) { try { imgs.push(await compressImage(f, {max: 1024, quality: 0.8})); } catch (e) { /* пропускаем фото */ } }
    let r;
    const headers = {'Content-Type': 'application/json'};
    if (FB.on) {
      if (!FB.user) throw {code: 'need_login'};
      try { headers.Authorization = 'Bearer ' + await FB.user.getIdToken(); } catch (e) { throw {code: 'need_login'}; }
    }
    try { r = await fetch(AI_CONFIG.endpoint, {method: 'POST', headers, body: JSON.stringify({task, prompt, images: imgs}), signal: opts.signal}); }
    catch (e) { throw {code: e && e.name === 'AbortError' ? 'cancelled' : 'network'}; }
    if (r.status === 401 || r.status === 403) throw {code: 'need_login'};
    if (r.status === 413) throw {code: 'prompt_too_large'};
    if (r.status === 429) throw {code: 'rate_limited'};
    if (!r.ok) throw {code: 'network'};
    const d = await r.json().catch(() => null);
    if (!d) throw {code: 'invalid_json'};
    return d.json && typeof d.json === 'object' ? d.json : parseJSONText(d.text);
  }
  throw {code: 'no_ai'};
}
const CAT_LIST = () => CATS.map(c => c.k).join(', ');
function aiHelpPrompt(text, nPhotos) {
  return 'Ты помощник сервиса «Мастер рядом», где клиенты ищут мастеров. Клиент описал проблему' + (nPhotos ? ' и приложил ' + nPhotos + ' фото' : '') + '. Определи, какой мастер нужен, и подготовь заказ.\n\n' +
    'Виды работ (поле cat — строго одно из списка или пустая строка): ' + CAT_LIST() + '.\n' +
    'Марки машин (поле brand — только если речь о машине, строго из списка или пустая строка): ' + BRANDS.map(b => b.n).join(', ') + '. Если машина — электромобиль или гибрид (например BYD, Tesla, Zeekr), выбери вид работ «' + EV + '».\n\n' +
    (aiLangHint() || 'Отвечай на языке клиента (русский или узбекский).') + ' Ответь ТОЛЬКО JSON без пояснений:\n' +
    '{"cat":"","brand":"","problem":"что, скорее всего, случилось, 1–2 предложения","urgency":"Срочно|Сегодня|На этой неделе|Не спешу","title":"заголовок заказа до 70 знаков","description":"описание задачи для мастера, 2–4 предложения","safety":"что сделать прямо сейчас для безопасности, или пустая строка","questions":["что мастер, скорее всего, уточнит"]}\n\n' +
    'Описание клиента: """' + (text || '(только фото)') + '"""';
}

/* ---------- ИИ-помощник: описание или фото → мастер и заказ ---------- */
function initAIScreen() {
  const fromInput = inp => inp.addEventListener('change', () => { const f = Array.from(inp.files || []); inp.value = ''; if (f.length) openAIHelp('', {files: f, auto: true}); });
  fromInput($('#ai-cam')); fromInput($('#ai-gal'));
  $('#ai-ask').addEventListener('click', () => openAIHelp(''));
  $('#ai-try').addEventListener('click', e => { const b = e.target.closest('button'); if (b) openAIHelp(b.textContent.trim(), {auto: true}); });
}
function openAIHelp(text, opts) {
  opts = opts || {};
  const el = Modal.open('<h2 class="m-h">' + icon('spark') + ' ИИ-помощник</h2><p class="m-sub">Опишите своими словами, что случилось, или сфотографируйте поломку. ИИ подскажет, какой мастер нужен, и заполнит заказ.</p>' +
    '<form class="mform" id="ai-f" novalidate>' +
    '<div class="fld"><label for="ai-text">Что случилось?</label><textarea class="inp" id="ai-text" maxlength="1000" placeholder="Например: из-под раковины капает и пахнет сыростью. Или: BYD Song не заряжается, на экране ошибка">' + esc(text || '') + '</textarea></div>' +
    '<div class="fld" id="ai-ph-fld"><span class="lab">Фото, до трёх</span><label class="drop" id="ai-drop" for="ai-ph" style="min-height:96px">' + icon('image') + '<span>Сфотографируйте поломку или выберите фото</span></label><input id="ai-ph" type="file" accept="image/*" multiple class="sr"><div class="thumbs" id="ai-thumbs"></div></div>' +
    '<div class="pf-acts"><button class="btn btn-brass" type="submit" id="ai-go">' + icon('spark') + 'Подобрать мастера</button><button class="btn btn-ghost" type="button" id="ai-stop" hidden>Остановить</button></div>' +
    '<div id="ai-out" aria-live="polite"></div></form>',
  {label: 'ИИ-помощник', kind: 'ai'});
  const files = [], thumbs = $('#ai-thumbs', el), out = $('#ai-out', el);
  let ctl = null, last = null;
  if (AI.sample && !AI.images && !AI_CONFIG.endpoint) $('#ai-ph-fld', el).hidden = true;
  const showThumbs = () => { thumbs.innerHTML = files.map((f, i) => '<div class="thumb"><img alt="Фото ' + (i + 1) + '" data-i="' + i + '"><button type="button" data-delai="' + i + '" aria-label="Удалить фото ' + (i + 1) + '">' + icon('close') + '</button></div>').join(''); $$('img', thumbs).forEach(img => { img.src = URL.createObjectURL(files[Number(img.dataset.i)]); }); };
  const addFiles = list => { Array.from(list || []).filter(f => /^image\//.test(f.type)).forEach(f => { if (files.length < 3) files.push(f); }); showThumbs(); };
  $('#ai-ph', el).addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
  bindDrop($('#ai-drop', el), addFiles);
  thumbs.addEventListener('click', e => { const b = e.target.closest('[data-delai]'); if (b) { files.splice(Number(b.dataset.delai), 1); showThumbs(); } });
  $('#ai-stop', el).addEventListener('click', () => { if (ctl) ctl.abort(); });
  $('#ai-f', el).addEventListener('submit', async e => {
    e.preventDefault();
    const txt = $('#ai-text', el).value.trim();
    if (txt.length < 3 && !files.length) { out.innerHTML = '<p class="err">Опишите проблему или добавьте фото.</p>'; return; }
    if (!aiOn()) { out.innerHTML = '<div class="ai-box warn">' + icon('info') + '<p>' + esc(AI_ERR.no_ai) + '</p></div>' + aiFallbackHTML(txt); return; }
    ctl = new AbortController();
    $('#ai-go', el).disabled = true; $('#ai-stop', el).hidden = false;
    out.innerHTML = '<div class="ai-thinking">' + icon('spark') + '<span>ИИ разбирается в проблеме</span><i></i><i></i><i></i></div>';
    try {
      const r = await aiAsk('help', aiHelpPrompt(txt, files.length), {images: files, signal: ctl.signal});
      last = {cat: CAT[r.cat] ? r.cat : '', brand: BRAND[r.brand] ? r.brand : '', problem: String(r.problem || '').slice(0, 400), urgency: WHEN.indexOf(r.urgency) >= 0 ? r.urgency : 'На этой неделе',
        title: String(r.title || txt).slice(0, 80), description: String(r.description || txt).slice(0, 600), safety: String(r.safety || '').slice(0, 300), questions: (Array.isArray(r.questions) ? r.questions : []).slice(0, 3).map(q => String(q).slice(0, 160))};
      out.innerHTML = aiResultHTML(last);
    } catch (err) {
      out.innerHTML = err && err.code === 'cancelled' ? '' : '<div class="ai-box warn">' + icon('info') + '<p>' + esc(aiErrText(err)) + '</p></div>' + aiFallbackHTML(txt);
    } finally { ctl = null; $('#ai-go', el).disabled = false; $('#ai-stop', el).hidden = true; }
  });
  if (text) $('#ai-text', el).value = text;
  if (opts.files) addFiles(opts.files);
  if (opts.auto && (text || files.length)) $('#ai-f', el).requestSubmit();
  else if (!opts.files && FINE) $('#ai-text', el).focus();
  el.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-ai-masters]')) { if (last && last.cat) openSearch('', last.cat, last.brand || null); else openSearch($('#ai-text', el).value); return; }
    if (t.closest('[data-ai-post]')) { if (last) openPostJob({cat: last.cat, title: last.title, desc: last.description, when: last.urgency}); else openPostJob(); return; }
    if (t.closest('[data-ai-search]')) openSearch($('#ai-text', el).value);
  });
}
function aiResultHTML(r) {
  const c = CAT[r.cat], cnt = c ? masters().filter(m => m.prof === r.cat && brandFits(m, r.brand ? BRAND[r.brand] : null)).length : 0;
  return '<div class="ai-res">' +
    (c ? '<p class="sx-sub">Вам нужен</p><div class="sx-big as-head">' + icon(c.ic) + '<div><b>' + esc(r.cat + (r.brand ? ' · ' + r.brand : '')) + '</b><span>' + (cnt ? pl(cnt, MASTERS_W) : 'мастеров пока нет, разместите заказ') + ' · срочность: ' + esc(r.urgency.toLowerCase()) + '</span></div></div>' : '<p class="sx-sub">Не удалось точно определить мастера</p>') +
    (r.problem ? '<div class="block"><span class="lbl">Что, скорее всего, случилось</span><p class="pf-about">' + esc(r.problem) + '</p></div>' : '') +
    (r.safety ? '<div class="ai-box warn">' + icon('shield') + '<p><b>Сделайте сейчас:</b> ' + esc(r.safety) + '</p></div>' : '') +
    (r.questions.length ? '<div class="block"><span class="lbl">Мастер, скорее всего, спросит</span><ul class="ai-list">' + r.questions.map(q => '<li>' + esc(q) + '</li>').join('') + '</ul></div>' : '') +
    '<div class="pf-acts">' + (cnt ? '<button class="btn" type="button" data-ai-masters>' + icon('search') + 'Показать мастеров</button>' : '') + '<button class="btn btn-brass" type="button" data-ai-post>' + icon('plus') + 'Разместить заказ, он уже заполнен</button></div>' +
    '<p class="hint">Это подсказка ИИ, она может ошибаться. Окончательно причину определит мастер.</p></div>';
}
function aiFallbackHTML(txt) {
  return txt ? '<div class="pf-acts" style="margin-top:12px"><button class="btn btn-ghost" type="button" data-ai-search>' + icon('search') + 'Искать обычным поиском</button></div>' : '';
}

/* ---------- ИИ: перевод в чате, анкета мастера, сводка отзывов ---------- */
const TR = {};
const isUzText = t => /[ўқғҳ]|o['‘’ʻ]|g['‘’ʻ]|\b(va|uchun|bilan|qachon|kerak|bormi|yoq|yo'q|rahmat|assalomu|salom|ertaga|bugun|narxi|qancha)\b/i.test(t);
async function translateMsg(id) {
  const x = messagesAll().find(y => y.id === id); if (!x) return;
  const toUz = !isUzText(x.text);
  TR[id] = {loading: true}; refreshChat();
  try {
    const target = LANG.cur === 'en' ? 'на английский язык' : LANG.cur === 'tg' ? 'на таджикский язык (кириллица)' : toUz ? 'на узбекский язык (латиница)' : 'на русский язык';
    const r = await aiAsk('translate', 'Переведи сообщение из чата клиента и мастера ' + target + '. Сохрани смысл, время, цены и имена. Ответь ТОЛЬКО JSON: {"text":"перевод"}\n\nСообщение: """' + x.text + '"""');
    TR[id] = {text: String(r.text || '').slice(0, 1200), to: LANG.cur === 'ru' && toUz ? 'uz' : LANG.cur};
  } catch (e) { TR[id] = {err: aiErrText(e)}; }
  refreshChat();
}
function trHTML(x) {
  const t = TR[x.id];
  if (t && t.loading) return '<span class="tr">Перевожу…</span>';
  if (t && t.text) return '<span class="tr"><em>' + (t.to === 'uz' ? 'O‘zbekcha' : 'Перевод') + ':</em> ' + esc(t.text) + '</span>';
  if (t && t.err) return '<span class="tr">' + esc(t.err) + '</span>';
  return aiOn() ? '<button class="msg-tr" type="button" data-tr="' + esc(x.id) + '">' + icon('spark') + 'Перевести</button>' : '';
}
async function aiWriteAbout(btn) {
  const d = readWizard();
  if (!d.prof) { wzErr('Сначала выберите специальность, тогда ИИ напишет точнее.'); return; }
  if (!aiOn()) { toast(AI_ERR.no_ai, 'warn'); return; }
  const label = btn.innerHTML; btn.disabled = true; btn.innerHTML = icon('spark') + 'ИИ пишет…';
  try {
    const r = await aiAsk('about', 'Помоги мастеру заполнить анкету в сервисе «Мастер рядом». Специальность: ' + d.prof + '. Опыт: ' + (d.exp || 'не указан') + ' лет. Район: ' + (d.district || 'не указан') + '.' + (d.brands && d.brands.length ? ' Марки машин: ' + d.brands.join(', ') + '.' : '') +
      ' Заметки мастера: """' + (d.about || 'нет') + '""".\nНапиши текст «О себе» от первого лица: просто, по делу, без восклицаний и выдуманных фактов, до 350 знаков. Предложи до 5 типичных услуг этой специальности без цен. Язык — как в заметках мастера, по умолчанию русский.\nОтветь ТОЛЬКО JSON: {"about":"...","services":["...", "..."]}');
    const about = String(r.about || '').slice(0, 400);
    if (about) { $('#w-about').value = about; $('#w-about-n').textContent = String(about.length); }
    const svc = (Array.isArray(r.services) ? r.services : []).map(x => String(x).slice(0, 80)).filter(Boolean).slice(0, 5);
    if (svc.length && !WZ.svc.some(x => x.n.trim())) { WZ.svc = svc.map(n => ({n, p: ''})); renderSvc(); }
    onWzChange();
    toast(svc.length ? 'Текст готов, услуги добавлены на шаге 2. Проверьте и поправьте' : 'Текст готов. Проверьте и поправьте');
  } catch (e) { toast(aiErrText(e), 'warn'); }
  finally { btn.disabled = false; btn.innerHTML = label; }
}
async function aiSummarizeReviews(m, box, btn) {
  if (!aiOn()) { toast(AI_ERR.no_ai, 'warn'); return; }
  btn.disabled = true;
  box.innerHTML = '<div class="ai-thinking">' + icon('spark') + '<span>ИИ читает отзывы</span><i></i><i></i><i></i></div>';
  try {
    const list = m.reviews.slice(0, 40).map(r => '- ' + r.r + '★: ' + (r.t || '') + (r.tags && r.tags.length ? ' [' + r.tags.join(', ') + ']' : '')).join('\n');
    const r = await aiAsk('reviews', 'Кратко подведи итог отзывов о мастере (' + m.prof + ') для клиента, честно и без преувеличений. ' + aiLangHint() + ' Ответь ТОЛЬКО JSON: {"summary":"1–2 предложения","plus":["до 3 сильных сторон"],"minus":["до 2 замечаний или пустой список"]}\n\nОтзывы:\n' + list);
    const plus = (Array.isArray(r.plus) ? r.plus : []).slice(0, 3), minus = (Array.isArray(r.minus) ? r.minus : []).slice(0, 2);
    box.innerHTML = '<div class="ai-box">' + icon('spark') + '<div><p><b>Итог по отзывам (' + m.n + '):</b> ' + esc(String(r.summary || '').slice(0, 400)) + '</p>' +
      (plus.length ? '<p class="ai-pm ok">+ ' + plus.map(x => esc(String(x).slice(0, 120))).join(' · ') + '</p>' : '') + (minus.length ? '<p class="ai-pm no">− ' + minus.map(x => esc(String(x).slice(0, 120))).join(' · ') + '</p>' : '') +
      '<p class="hint">Сводку составил ИИ по отзывам на этой странице.</p></div></div>';
    btn.hidden = true;
  } catch (e) { box.innerHTML = '<div class="ai-box warn">' + icon('info') + '<p>' + esc(aiErrText(e)) + '</p></div>'; btn.disabled = false; }
}

/* ---------- чат ---------- */
const REPLIES = ['Здравствуйте! Да, могу помочь. Когда вам удобно?', 'Понял. Пришлите, пожалуйста, фото, чтобы я точнее назвал цену.', 'Могу подъехать завтра с утра. Напишите адрес.', 'Договорились. Если что, звоните по номеру из профиля.'];
const CH = {thread: null, pending: null, typing: null};
function myKey() {
  if (shared.uid) return shared.uid;
  if (!local.clientId) { local.clientId = uid('c'); saveLocal(); }
  return local.clientId;
}
const myKeys = () => new Set([shared.uid, local.clientId].filter(Boolean));
function messagesAll() {
  const seen = new Set();
  return shared.messages.concat(local.msgs).filter(m => {
    if (!m || !m.id || !m.thread || typeof m.text !== 'string' || seen.has(m.id)) return false;
    seen.add(m.id); return true;
  }).map(m => local.bkOverride[m.id] ? Object.assign({}, m, {status: local.bkOverride[m.id]}) : m).sort((a, b) => (a.at || 0) - (b.at || 0));
}
function threads() {
  const keys = myKeys(), mine = new Set(masters().filter(isMine).map(m => m.id)), map = new Map();
  messagesAll().forEach(m => {
    if (local.blocked[m.thread]) return;
    const asClient = keys.has(m.clientKey), asMaster = mine.has(m.masterId);
    if (!asClient && !asMaster) return;
    let t = map.get(m.thread);
    if (!t) { t = {id: m.thread, masterId: m.masterId, masterName: m.masterName, clientKey: m.clientKey, role: asClient ? 'client' : 'master', msgs: []}; map.set(m.thread, t); }
    if (m.clientName) t.clientName = m.clientName;
    if (m.clientPhone) t.clientPhone = m.clientPhone;
    t.msgs.push(m);
  });
  return Array.from(map.values()).map(t => {
    const seenAt = local.chatSeen[t.id] || 0;
    t.last = t.msgs[t.msgs.length - 1];
    t.unread = t.msgs.filter(m => m.from !== t.role && (m.at || 0) > seenAt).length;
    return t;
  }).sort((a, b) => (b.last.at || 0) - (a.last.at || 0));
}
function chatThreads() {
  const ts = threads();
  if (CH.pending) { if (ts.some(t => t.id === CH.pending.id)) CH.pending = null; else ts.unshift(CH.pending); }
  return ts;
}
function updateChatBadge() {
  const n = threads().reduce((s, t) => s + t.unread, 0);
  ['#chat-count', '#tab-chat-count'].forEach(sel => { const b = $(sel); if (b) { b.textContent = String(n); b.hidden = n === 0; } });
}
const timeShort = ms => { const d = new Date(ms || 0); return d.toDateString() === new Date().toDateString() ? String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : d.getDate() + ' ' + MONTHS[d.getMonth()]; };
const thName = t => t.role === 'client' ? (t.masterName || 'Мастер') : (t.clientName || 'Клиент');
function thAva(t) {
  if (t.role === 'client') return avaHTML(getMaster(t.masterId) || {name: t.masterName, prof: ''}, 's');
  return '<span class="ava s" style="--ava:var(--glaze-3)">' + esc(initials(t.clientName || 'Клиент')) + '</span>';
}
function renderChatList(el, ts) {
  $('#ch-list', el).innerHTML = ts.length ? ts.map(t => '<button type="button" class="th" data-th="' + esc(t.id) + '" aria-current="' + (t.id === CH.thread) + '">' + thAva(t) +
    '<span class="th-info"><b>' + esc(thName(t)) + '</b><span>' + (t.last ? (t.last.from === t.role ? 'Вы: ' : '') + esc(t.last.text) : 'Новый диалог') + '</span></span>' +
    (t.unread ? '<span class="th-n" aria-label="' + t.unread + ' новых">' + t.unread + '</span>' : t.last ? '<span class="th-t">' + timeShort(t.last.at) + '</span>' : '') + '</button>').join('')
    : '<div class="chat-empty">' + icon('chat') + '<p>Диалогов пока нет. Откройте профиль мастера и нажмите «Написать».</p></div>';
}
function renderChatMain(el, t, force) {
  const main = $('#ch-main', el);
  if (!t) { main.dataset.cur = ''; main.innerHTML = '<div class="chat-empty">' + icon('chat') + '<p>Выберите диалог, чтобы читать и отвечать.</p></div>'; return; }
  const m = getMaster(t.masterId);
  const phone = t.role === 'client' ? phoneOf(m) : t.clientPhone;
  const sub = (t.role === 'client' ? ((m && m.prof) || 'Мастер') : 'Клиент') + (phone ? ' · ' + phone : '');
  if (main.dataset.cur !== t.id) {
    main.dataset.cur = t.id;
    main.classList.remove('th-in'); void main.offsetWidth; main.classList.add('th-in');
    main.innerHTML = '<div class="chat-head"><button class="icon-btn chat-back" type="button" data-chback aria-label="К списку диалогов">' + icon('arrowL') + '</button>' + thAva(t) +
      '<div class="th-info"><b>' + esc(thName(t)) + '</b><span id="ch-sub"></span></div><div class="chat-acts">' +
      (phone ? '<a class="icon-btn" href="' + esc(telHref(phone)) + '" aria-label="Позвонить" title="Позвонить">' + icon('phone') + '</a>' : '') +
      (m && !m.demo ? '<button class="icon-btn" type="button" data-chreport aria-label="Пожаловаться" title="Пожаловаться">' + icon('flag') + '</button>' : '') +
      (t.role === 'client' && m ? '<button class="btn btn-sm btn-brass" type="button" data-chbook aria-label="Записаться на время">' + icon('clock') + '<span class="btn-txt">Записаться</span></button><button class="btn btn-sm btn-ghost hide-sm" type="button" data-open="' + esc(m.id) + '">Профиль</button>' : '') + '</div></div>' +
      '<div class="msgs" id="ch-msgs" aria-live="polite"></div>' +
      '<div class="chat-book" id="ch-book" hidden></div>' +
      pushAskHTML() +
      '<p class="chat-safe">' + icon('shield') + '<span>Не переводите предоплату на карту и никому не называйте коды из СМС. Платите после работы.</span></p>' +
      '<form class="chat-form" id="ch-form"><input class="inp" id="ch-in" maxlength="1000" placeholder="Сообщение" autocomplete="off" aria-label="Сообщение"><button class="btn" type="submit" aria-label="Отправить">' + icon('send') + '</button></form>';
    force = true;
  }
  $('#ch-sub', main).textContent = sub;
  const box = $('#ch-msgs', main), near = box.scrollHeight - box.scrollTop - box.clientHeight < 90;
  let lastDay = '';
  box.innerHTML = (t.msgs.length ? t.msgs.map(x => {
    const day = new Date(x.at || 0).toDateString(), sep = day !== lastDay ? '<span class="chat-day">' + esc(fmtDate(x.at)) + '</span>' : '';
    lastDay = day;
    if (x.kind === 'booking') {
      const st = bkStatus(x), acts = bkActs(x, t.role);
      return sep + '<div class="bk-card' + (x.from === t.role ? ' me' : '') + '"><span class="lbl">Запрос на запись</span><span class="bk-when">' + esc(fmtDay(x.day)) + ' · ' + esc(x.slot) + '</span>' +
        (x.desc ? '<p>' + esc(x.desc) + '</p>' : '') + '<span class="bk-st st-' + st + '">' + BK_TEXT[t.role][st] + '</span>' + (acts ? '<div class="bk-acts">' + acts + '</div>' : '') + '<time>' + timeShort(x.at) + '</time></div>';
    }
    return sep + '<div class="msg' + (x.from === t.role ? ' me' : '') + '">' + esc(x.text) + (x.from !== t.role ? trHTML(x) + fraudHTML(x.text) : '') + '<time>' + timeShort(x.at) + '</time></div>';
  }).join('') : '<div class="chat-empty"><p>' + (t.role === 'client' ? 'Опишите задачу: что нужно сделать, район и когда удобно. Мастер ответит здесь.' : 'Сообщений пока нет.') + '</p></div>') +
    (CH.typing === t.id ? '<div class="msg typing">печатает…</div>' : '');
  if (near || force) box.scrollTop = box.scrollHeight;
}
function refreshChat(force) {
  if (Modal.kind !== 'chat') return;
  const el = Modal.root.querySelector('.modal'); if (!el) return;
  const ts = chatThreads();
  if (CH.thread && !ts.some(t => t.id === CH.thread)) CH.thread = null;
  const t = ts.find(x => x.id === CH.thread) || null;
  if (t && t.unread) { local.chatSeen[t.id] = Date.now(); saveLocal(); t.unread = 0; updateChatBadge(); }
  renderChatList(el, ts);
  renderChatMain(el, t, force);
  $('#chat', el).classList.toggle('in-thread', !!t);
}
/* Подсказка о мошенничестве: номер карты, просьба о предоплате или коде из СМС */
const FRAUD_RE = /(?:\d[ -]?){16}|предоплат|аванс|переведи|переведите|скинь(те)? на карту|код из смс|код из sms|номер карты|cvv|cvc/i;
const fraudHTML = text => FRAUD_RE.test(String(text || '')) ? '<span class="msg-warn">Осторожно: похоже на просьбу о деньгах или данных карты. Не платите заранее.</span>' : '';
async function sendMsg(t, text, extra) {
  extra = extra || {};
  const me = local.me || {}, m = getMaster(t.masterId), from = extra.from || t.role;
  if (FB.on && m && m.source === 'shared') {
    if (!FB.user) { toast('Войдите по номеру телефона', 'warn'); return false; }
    const clientUid = t.clientKey, masterUid = m.ownerUid;
    const body = {thread: m.id + '__' + clientUid, masterId: m.id, masterName: String(t.masterName || m.name || '').slice(0, 60), clientUid, masterUid, participants: [clientUid, masterUid],
      clientName: String(t.role === 'client' ? (me.name || 'Клиент') : (t.clientName || '')).slice(0, 40), clientPhone: String(t.role === 'client' ? (FB.user.phoneNumber || '') : (t.clientPhone || '')).slice(0, 24),
      from, senderUid: shared.uid, text: text.slice(0, 1000), at: TS()};
    if (extra.kind === 'booking') Object.assign(body, {kind: 'booking', day: Math.round(Number(extra.day) || 0), slot: String(extra.slot || ''), desc: String(extra.desc || '').slice(0, 500), status: 'pending'});
    const ok = await sharedWrite(db => db.collection('messages').add(body));
    local.chatSeen[t.id] = Date.now(); saveLocal(); invalidate();
    return ok;
  }
  const body = Object.assign({thread: t.id, masterId: t.masterId, masterName: t.masterName || (m && m.name) || '', clientKey: t.clientKey,
    clientName: t.role === 'client' ? (me.name || 'Клиент') : (t.clientName || ''), clientPhone: t.role === 'client' ? (me.phone || '') : (t.clientPhone || ''),
    text: text.slice(0, 1000), at: Date.now()}, extra, {from});
  let ok = false, localMsg = null;
  if (m && m.source === 'shared') ok = await sharedWrite(db => db.collection('messages').add(body));
  if (ok && CH.pending && CH.pending.id === t.id) CH.pending.msgs.push(Object.assign({id: uid('p')}, body));
  if (!ok) { localMsg = Object.assign({id: uid('x')}, body); local.msgs.push(localMsg); }
  local.chatSeen[t.id] = Date.now();
  saveLocal(); invalidate();
  if (m && m.demo && from === 'client' && body.kind === 'booking' && localMsg) {
    setTimeout(() => { CH.typing = t.id; refreshChat(); }, 900);
    setTimeout(async () => {
      CH.typing = null;
      await decideBooking(localMsg.id, 'accepted', 'master');
      if (Modal.kind !== 'chat' || CH.thread !== t.id) toast(m.name + ' подтвердил запись');
    }, 2600 + Math.random() * 1200);
    return;
  }
  if (m && m.demo && from === 'client' && !body.kind && t.role === 'client') {
    const n = t.msgs.filter(x => x.from === 'master').length;
    setTimeout(() => { CH.typing = t.id; refreshChat(); }, 600);
    setTimeout(() => {
      CH.typing = null;
      local.msgs.push(Object.assign({}, body, {id: uid('x'), from: 'master', kind: null, text: REPLIES[n % REPLIES.length], at: Date.now()}));
      saveLocal(); invalidate();
      if (Modal.kind !== 'chat' || CH.thread !== t.id) toast(m.name + ' ответил в чате');
    }, 1800 + Math.random() * 1200);
  }
}
function openChat(masterId, threadId) {
  if (threadId) CH.thread = threadId;
  else if (masterId) {
    const m = getMaster(masterId); if (!m) return;
    if (isMine(m)) { toast('Это ваш профиль. Сообщения клиентов появятся в чате', 'warn'); return; }
    const ex = threads().find(t => t.masterId === m.id && t.role === 'client');
    if (ex) CH.thread = ex.id;
    else { const key = myKey(); CH.thread = m.id + '__' + key; CH.pending = {id: CH.thread, masterId: m.id, masterName: m.name, clientKey: key, role: 'client', msgs: [], unread: 0, last: null}; }
  } else if (!CH.thread && innerWidth > 700) {
    const f = threads()[0]; CH.thread = f ? f.id : null;
  }
  const el = Modal.open('<h2 class="m-h">Сообщения</h2><p class="m-sub">Переписка с мастерами и клиентами.</p><div class="chat" id="chat"><div class="chat-list" id="ch-list"></div><div class="chat-main" id="ch-main"></div></div>',
    {wide: true, label: 'Сообщения', kind: 'chat', onClose: () => { CH.pending = null; }});
  refreshChat(true);
  const inp = $('#ch-in', el); if (inp && FINE) inp.focus();
  el.addEventListener('click', e => {
    const th = e.target.closest('[data-th]');
    if (th) { CH.thread = th.dataset.th; refreshChat(true); const i = $('#ch-in', el); if (i && FINE) i.focus(); return; }
    if (e.target.closest('[data-chback]')) { CH.thread = null; refreshChat(); return; }
    const trb = e.target.closest('[data-tr]'); if (trb) { translateMsg(trb.dataset.tr); return; }
    const bk = e.target.closest('[data-bk]');
    if (bk) { bk.disabled = true; decideBooking(bk.dataset.mid, bk.dataset.bk); return; }
    if (e.target.closest('[data-push-on]')) { local.pushAsked = true; saveLocal(); const pa = $('#push-ask', el); if (pa) pa.remove(); enablePush(); return; }
    if (e.target.closest('[data-push-no]')) { local.pushAsked = true; saveLocal(); const pa = $('#push-ask', el); if (pa) pa.remove(); return; }
    const t = chatThreads().find(x => x.id === CH.thread);
    if (e.target.closest('[data-chreport]') && t) { openReport('message', t.id, t.id); return; }
    if (e.target.closest('[data-chbook]') && t) {
      const p = $('#ch-book', el), m = getMaster(t.masterId);
      if (!m) return;
      p.hidden = !p.hidden;
      if (!p.hidden) { p.innerHTML = bookingHTML(m); p.scrollTop = 0; }
      return;
    }
    const book = $('#ch-book', el);
    if (t && book && book.contains(e.target) && bookingClick(e, book, t.masterId)) return;
    const o = e.target.closest('[data-open]'); if (o) openProfile(o.dataset.open);
  });
  el.addEventListener('submit', async e => {
    if (e.target.id !== 'ch-form') return;
    e.preventDefault();
    const i = $('#ch-in', el), text = i.value.trim();
    const t = chatThreads().find(x => x.id === CH.thread);
    if (!text || !t) return;
    i.value = '';
    await sendMsg(t, text);
    i.focus();
  });
}

/* ---------- инструкция ---------- */
const GUIDE = [
  ['Найдите мастера', 'На экране «Мастера» напишите, что нужно сделать, или выберите вид работ. Сравните оценки, отзывы и цены.'],
  ['Не знаете, кто нужен?', 'Нажмите ИИ в центре нижнего меню. Сфотографируйте поломку или опишите её словами — помощник подскажет мастера и заполнит заказ.'],
  ['Напишите и запишитесь', 'В профиле мастера нажмите «Написать» или «Записаться», выберите день и время. Мастер подтвердит запись в чате.'],
  ['Или разместите заказ', 'На экране «Заказы» опишите задачу. Мастера сами предложат цену, а вы выберете подходящего.'],
  ['Включите уведомления', 'В настройках включите уведомления — вы узнаете о новом сообщении, даже когда приложение закрыто.'],
  ['Оставьте отзыв', 'После работы оцените мастера. Отзыв можно оставить только после подтверждённой записи, поэтому все отзывы честные.'],
  ['Вы мастер?', 'Нажмите «Стать мастером», заполните анкету и график. Свои работы с фото добавляйте в профиле кнопкой «Добавить работу».'],
  ['Безопасность', 'Не переводите предоплату на карту и никому не называйте коды из СМС. Подозрительного собеседника — «Пожаловаться».']
];
function openGuide() {
  const faq = $('#faq .faq');
  Modal.open('<h2 class="m-h">' + icon('help') + ' Как пользоваться</h2><p class="m-sub">Восемь шагов — и вы знаете всё.</p>' +
    '<ol class="guide">' + GUIDE.map(g => '<li><div><b>' + esc(g[0]) + '</b><p>' + esc(g[1]) + '</p></div></li>').join('') + '</ol>' +
    (canInstall() ? '<div class="pf-acts" style="margin-top:16px"><button class="btn btn-brass" type="button" data-mact="install">' + icon('mobile') + 'Установить приложение</button></div>' : '') +
    (faq ? '<p class="cab-sub" style="margin-top:22px">Частые вопросы</p><div class="faq">' + faq.innerHTML + '</div>' : ''),
  {wide: true, label: 'Инструкция', kind: 'guide'});
}

/* ---------- уведомления о сообщениях (Firebase Cloud Messaging) ----------
   Приходят, даже когда сайт или приложение закрыты. На iPhone — только если приложение установлено на экран «Домой». */
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
function pushState() {
  if (!pushSupported()) return isIOS() && !isStandalone() ? 'ios-install' : 'unsupported';
  if (!FB.on || !CFG.vapidKey) return 'not-configured';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.permission === 'granted' && local.pushOn ? 'on' : 'off';
}
function pushText() {
  return ({on: 'Включены: вы узнаете о новых сообщениях и откликах, даже когда приложение закрыто',
    off: 'Узнавайте о новых сообщениях, даже когда приложение закрыто',
    denied: 'Запрещены в настройках браузера. Разрешите уведомления для этого сайта в настройках телефона',
    'ios-install': 'На iPhone уведомления работают, когда приложение установлено на экран «Домой»',
    'not-configured': 'Заработают после подключения сервера (инструкция в README)',
    unsupported: 'Этот браузер не поддерживает уведомления'})[pushState()];
}
async function pushToken() {
  if (!(window.firebase && firebase.messaging)) await loadScript('firebase-messaging-compat.js');
  const reg = await navigator.serviceWorker.register('sw.js');
  await navigator.serviceWorker.ready;
  return firebase.messaging().getToken({vapidKey: CFG.vapidKey, serviceWorkerRegistration: reg});
}
async function savePushToken(token) {
  await shared.db.collection('pushTokens').doc(token).set({uid: FB.user.uid, ua: navigator.userAgent.slice(0, 200), createdAt: TS()});
  local.pushToken = token; local.pushOn = true; saveLocal();
}
async function enablePush() {
  const st = pushState();
  if (st !== 'off' && st !== 'on') { toast(pushText(), 'warn'); return false; }
  if (!FB.user) { openAuth({reason: 'Чтобы получать уведомления о сообщениях, войдите по номеру телефона.'}); return false; }
  let perm = Notification.permission;
  if (perm !== 'granted') perm = await Notification.requestPermission();
  if (perm !== 'granted') { toast('Уведомления не разрешены', 'warn'); return false; }
  try { await savePushToken(await pushToken()); toast('Уведомления включены'); return true; }
  catch (e) { console.warn('Уведомления:', e && (e.code || e.message)); toast('Не получилось включить уведомления. Попробуйте позже.', 'warn'); return false; }
}
async function disablePush() {
  const t = local.pushToken;
  local.pushOn = false; local.pushToken = null; saveLocal();
  try { if (t && FB.user) await shared.db.collection('pushTokens').doc(t).delete(); } catch (e) { console.warn('Уведомления:', e && e.code); }
  try { if (window.firebase && firebase.messaging) await firebase.messaging().deleteToken(); } catch (e) { /* уже удалён */ }
  toast('Уведомления выключены');
}
/* После входа обновляем токен: браузер иногда меняет его */
function syncPush() {
  if (pushState() !== 'on' || !FB.user) return;
  pushToken().then(t => savePushToken(t)).catch(e => console.warn('Уведомления:', e && (e.code || e.message)));
}
const pushAskHTML = () => pushState() === 'off' && !local.pushAsked ? '<div class="push-ask" id="push-ask">' + icon('bell') + '<span>Включите уведомления, чтобы узнать об ответе, даже когда приложение закрыто</span><button class="btn btn-sm" type="button" data-push-on>Включить</button><button class="btn btn-sm btn-ghost" type="button" data-push-no>Не сейчас</button></div>' : '';

/* ---------- работы мастера ---------- */
function worksOf(masterId) {
  const seen = new Set();
  return shared.works.concat(local.works).filter(w => w && w.masterId === masterId && fbImg(w.photo) && !seen.has(w.id) && seen.add(w.id)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
function worksHTML(m) {
  const own = isMine(m), list = worksOf(m.id), old = (Array.isArray(m.photos) ? m.photos : []).map(validImg).filter(Boolean);
  if (!own && !list.length && !old.length) return '<div id="pm-works"></div>';
  return '<div class="block" id="pm-works"><span class="lbl">Работы мастера' + (list.length + old.length ? ' · ' + (list.length + old.length) : '') + '</span><div class="works">' +
    (own ? '<button class="work-add" type="button" data-addwork="' + esc(m.id) + '">' + icon('camera') + '<span>Добавить работу</span></button>' : '') +
    list.map(w => '<figure class="work"><button class="work-img" type="button" data-wimg aria-label="Открыть фото"><img src="' + w.photo + '" alt="' + esc(w.text || 'Работа мастера') + '" loading="lazy"></button>' +
      (w.text ? '<figcaption>' + esc(w.text) + '</figcaption>' : '') +
      (own ? '<button class="icon-btn work-del" type="button" data-delwork="' + esc(w.id) + '" aria-label="Удалить работу">' + icon('trash') + '</button>' : '') + '</figure>').join('') +
    old.map((p, i) => '<figure class="work"><button class="work-img" type="button" data-wimg aria-label="Открыть фото ' + (i + 1) + '"><img src="' + p + '" alt="Фото работы ' + (i + 1) + '" loading="lazy"></button></figure>').join('') +
    '</div></div>';
}
async function workPhoto(file) {
  let q = 0.78, max = 1000, out = null;
  for (let i = 0; i < 4; i++) {
    out = await compressImage(file, {max, quality: q});
    if (out.length < 280000) return out;
    q -= 0.12; max = Math.round(max * 0.8);
  }
  return out.length < 280000 ? out : null;
}
function openAddWork(masterId) {
  const m = getMaster(masterId); if (!m || !isMine(m)) return;
  let photo = null;
  const el = Modal.open('<h2 class="m-h">' + icon('camera') + ' Новая работа</h2><p class="m-sub">Покажите клиентам, как вы работаете. Хорошо подходят фото «до» и «после».</p>' +
    '<form class="mform" id="wk" novalidate>' +
    '<div class="ai-tiles" style="margin:0"><label class="ai-tile" for="wk-cam"><span class="ai-tile-ic">' + icon('camera') + '</span><b>Сфотографировать</b><input id="wk-cam" type="file" accept="image/*" capture="environment" class="sr"></label>' +
    '<label class="ai-tile" for="wk-gal"><span class="ai-tile-ic">' + icon('image') + '</span><b>Из галереи</b><input id="wk-gal" type="file" accept="image/*" class="sr"></label></div>' +
    '<div id="wk-prev"></div>' +
    '<div class="fld"><label for="wk-text">Подпись</label><input class="inp" id="wk-text" maxlength="300" placeholder="Например: укладка плитки в ванной, 6 м², 2 дня"></div>' +
    '<p class="err" id="wk-err" role="alert" hidden></p><button class="btn btn-brass" type="submit" style="justify-self:start">Опубликовать</button></form>',
  {label: 'Новая работа', kind: 'work'});
  const err = msg => { const e = $('#wk-err', el); e.textContent = msg; e.hidden = !msg; };
  const pick = async inp => {
    const f = inp.files && inp.files[0]; inp.value = ''; if (!f) return;
    err('');
    try { photo = await workPhoto(f); } catch (e) { photo = null; }
    if (!photo) { err('Не получилось открыть фото. Подойдут JPG, PNG или WebP.'); return; }
    $('#wk-prev', el).innerHTML = '<div class="works" style="grid-template-columns:minmax(0,220px)"><figure class="work"><img src="' + photo + '" alt="Выбранное фото"></figure></div>';
  };
  $('#wk-cam', el).addEventListener('change', e => pick(e.target));
  $('#wk-gal', el).addEventListener('change', e => pick(e.target));
  $('#wk', el).addEventListener('submit', async e => {
    e.preventDefault();
    if (!photo) return err('Добавьте фото работы.');
    const btn = e.target.querySelector('[type="submit"]'); btn.disabled = true;
    const text = $('#wk-text', el).value.trim().slice(0, 300);
    if (FB.on && m.source === 'shared') {
      const ok = await sharedWrite(db => db.collection('works').add({ownerUid: shared.uid, masterId: m.id, photo, text, createdAt: TS()}));
      if (!ok) { btn.disabled = false; return; }
    } else {
      local.works.unshift({id: uid('w'), masterId: m.id, photo, text, createdAt: Date.now()});
      if (!saveLocal()) { local.works.shift(); btn.disabled = false; return; }
    }
    invalidate();
    toast('Работа опубликована');
    openProfile(m.id);
  });
}
async function deleteWork(id) {
  const lw = local.works.find(w => w.id === id);
  if (lw) { local.works = local.works.filter(w => w.id !== id); saveLocal(); invalidate(); return; }
  if (await sharedWrite(db => db.collection('works').doc(id).delete())) invalidate();
}

/* ---------- жалобы ---------- */
const REPORT_REASONS = ['Просит предоплату или данные карты', 'Обман или некачественная работа', 'Грубость или угрозы', 'Спам или реклама', 'Фальшивый профиль', 'Другое'];
function openReport(type, targetId, threadId) {
  const el = Modal.open('<h2 class="m-h">' + icon('flag') + ' Пожаловаться</h2><p class="m-sub">Жалобу проверит модератор. Собеседник не узнает, кто её отправил.</p>' +
    '<form class="mform" id="rp" novalidate>' +
    '<div class="fld"><label for="rp-reason">Причина *</label><select class="inp sel" id="rp-reason">' + REPORT_REASONS.map(r => '<option>' + esc(r) + '</option>').join('') + '</select></div>' +
    '<div class="fld"><label for="rp-text">Что случилось</label><textarea class="inp" id="rp-text" maxlength="500" placeholder="Коротко опишите ситуацию"></textarea></div>' +
    (threadId ? '<label class="check" for="rp-block"><input type="checkbox" id="rp-block" checked><span>Скрыть этот диалог у меня</span></label>' : '') +
    '<p class="err" id="rp-err" role="alert" hidden></p><button class="btn" type="submit" style="justify-self:start">Отправить жалобу</button></form>',
  {label: 'Пожаловаться', kind: 'report'});
  $('#rp', el).addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type="submit"]'); btn.disabled = true;
    const body = {reason: $('#rp-reason', el).value.slice(0, 60), text: $('#rp-text', el).value.trim().slice(0, 500)};
    if (FB.on) {
      const ok = await sharedWrite(db => db.collection('reports').add(Object.assign(body, {reporterUid: shared.uid, targetType: type, targetId: String(targetId).slice(0, 200), createdAt: TS()})));
      if (!ok) { btn.disabled = false; return; }
    }
    const bl = $('#rp-block', el);
    if (bl && bl.checked) { local.blocked[threadId] = true; if (CH.thread === threadId) CH.thread = null; saveLocal(); invalidate(); }
    Modal.close(true);
    toast('Спасибо! Жалоба отправлена модератору');
  });
}

/* ---------- быстрый поиск ---------- */
function catCounts() { const c = {}; masters().forEach(m => { c[m.prof] = (c[m.prof] || 0) + 1; }); return c; }
const MASTERS_W = ['мастер', 'мастера', 'мастеров'];
function catsBrowseHTML() {
  const cnt = catCounts();
  return GROUPS.map((g, gi) => '<div class="sx-group"><h3>' + esc(g) + '</h3><div class="sx-cats">' + CATS.filter(c => c.g === gi).map(c => '<button class="sx-cat" type="button" data-sxcat="' + esc(c.k) + '">' + icon(c.ic) + esc(c.k) + ' <em>' + (cnt[c.k] || 0) + '</em></button>').join('') + '</div></div>').join('');
}
function catMastersHTML(k, bn) {
  const c = CAT[k], br = bn ? BRAND[bn] : null;
  const list = masters().filter(m => m.prof === k && brandFits(m, br)).sort((a, b) => (br ? (b.brands.indexOf(br.n) >= 0) - (a.brands.indexOf(br.n) >= 0) : 0) || b.score - a.score);
  const title = k + (br ? ' · ' + br.n : '');
  return '<div class="sx-head"><button class="link" type="button" data-sxall>' + icon('arrowL') + 'Все виды работ</button></div>' +
    '<div class="sx-big as-head">' + icon(c.ic) + '<div><b>' + esc(title) + '</b><span>' + (list.length ? pl(list.length, MASTERS_W) : 'Мастеров пока нет') + ' · ' + esc(c.d || c.svc.slice(0, 3).join(', ').toLowerCase()) + '</span></div></div>' +
    (list.length ? list.map(m => miniHTML(m, '<button class="btn btn-sm" type="button" data-open="' + esc(m.id) + '">Профиль</button>')).join('')
      : '<div class="empty">' + icon(c.ic) + '<p><b>' + esc(title) + '</b><br>Мастеров пока нет. Разместите заказ: мастера увидят его на бирже и предложат цену.</p><div class="pf-acts" style="justify-content:center"><button class="btn btn-sm btn-brass" type="button" data-post="' + esc(k) + '">Разместить заказ</button><button class="btn btn-sm btn-ghost" type="button" data-go-join>Я мастер, зарегистрироваться</button></div></div>');
}
function openSearch(preset, presetCat, presetBrand) {
  const el = Modal.open('<h2 class="m-h">Поиск мастера</h2><p class="m-sub">Напишите, кто нужен или что случилось. Например: «машина BYD», «сломалась стиральная машина», «поставить окна ПВХ». Подсказки появятся сразу.</p>' +
    '<form class="search" id="sx-form" role="search">' + icon('search') + '<input id="sx-q" type="search" placeholder="Кто нужен или что сделать?" aria-label="Кто нужен или что сделать" autocomplete="off"><button class="clear" type="button" id="sx-clear" aria-label="Очистить" hidden>' + icon('close') + '</button></form>' +
    '<div class="popular" id="sx-pop"><span>Часто ищут:</span>' + POPULAR.map(p => '<button class="chip" type="button" data-q="' + esc(p) + '">' + esc(p) + '</button>').join('') + '</div><button class="ai-banner" type="button" data-ai>' + icon('spark') + '<span><b>Не знаете, какой мастер нужен?</b><small>Опишите проблему своими словами или пришлите фото, ИИ подскажет</small></span>' + icon('arrowR') + '</button><div id="sx-res" aria-live="polite"></div>',
  {label: 'Поиск мастера', kind: 'search'});
  const inp = $('#sx-q', el), res = $('#sx-res', el);
  let cat = null, catBrand = null;
  const run = () => {
    $('#sx-clear', el).hidden = !inp.value;
    if (cat) { res.innerHTML = catMastersHTML(cat, catBrand); return; }
    const words = parseQuery(inp.value);
    if (!words.length) { res.innerHTML = '<p class="sx-sub">Все виды работ</p>' + catsBrowseHTML(); return; }
    const it = intent(inp.value), fk = it.cats, br = it.brand, need = Math.max(1, Math.ceil(words.length / 2));
    const list = masters().map(m => ({m, s: matchScore(m, words)})).filter(x => (fk.length ? fk.indexOf(x.m.prof) >= 0 : x.s >= need) && brandFits(x.m, br))
      .sort((a, b) => (br ? (b.m.brands.indexOf(br.n) >= 0) - (a.m.brands.indexOf(br.n) >= 0) : 0) || b.s - a.s || b.m.score - a.m.score).map(x => x.m);
    const cntFor = k => masters().filter(m => m.prof === k && brandFits(m, br)).length;
    let h = '';
    if (fk.length) h += '<p class="sx-sub">Вам нужен</p><div class="sx-need">' + fk.slice(0, 3).map(k => { const c = CAT[k], n = cntFor(k); return '<button class="sx-big" type="button" data-sxcat="' + esc(k) + '"' + (br ? ' data-sxbrand="' + esc(br.n) + '"' : '') + '>' + icon(c.ic) + '<div><b>' + esc(k + (br ? ' · ' + br.n : '')) + '</b><span>' + esc(c.d || GROUPS[c.g]) + ' · ' + (n ? pl(n, MASTERS_W) : 'мастеров пока нет') + '</span></div>' + icon('arrowR') + '</button>'; }).join('') + '</div>';
    if (list.length) h += '<p class="sx-sub">Подходящие мастера</p>' + list.slice(0, 8).map(m => miniHTML(m, '<button class="btn btn-sm" type="button" data-open="' + esc(m.id) + '">Профиль</button>')).join('') + (list.length > 8 ? '<p class="hint" style="margin-top:12px">И ещё ' + pl(list.length - 8, MASTERS_W) + '. <button class="link" type="button" data-sxgo>Показать всех в каталоге</button></p>' : '');
    else if (fk.length) h += '<div class="empty">' + icon(CAT[fk[0]].ic) + '<p><b>' + esc(fk[0] + (br ? ' · ' + br.n : '')) + '</b><br>Мастеров пока нет. Разместите заказ, и мастера откликнутся сами.</p><button class="btn btn-sm btn-brass" type="button" data-post="' + esc(fk[0]) + '">Разместить заказ</button></div>';
    else h += '<div class="empty">' + icon('search') + '<p>Не поняли запрос. Спросите ИИ-помощника, напишите по-другому или выберите вид работ из списка ниже.</p><div class="pf-acts" style="justify-content:center"><button class="btn btn-sm btn-brass" type="button" data-ai>' + icon('spark') + 'Спросить ИИ</button><button class="btn btn-sm btn-ghost" type="button" data-post>Разместить заказ</button></div></div><p class="sx-sub">Все виды работ</p>' + catsBrowseHTML();
    res.innerHTML = h;
  };
  const ac = attachAC(inp, $('#sx-form', el), x => {
    if (x.brand) { cat = null; inp.value = 'Мастер ' + x.brand; }
    else if (x.svc) { cat = null; inp.value = x.svc; }
    else { cat = x.cat; catBrand = null; }
    run(); el.scrollTop = 0;
  });
  inp.value = typeof preset === 'string' ? preset : F.q;
  if (presetCat && CAT[presetCat]) { cat = presetCat; catBrand = presetBrand || null; }
  run();
  setTimeout(() => inp.focus(), 60);
  let qt = 0;
  inp.addEventListener('input', () => { cat = null; clearTimeout(qt); qt = setTimeout(run, 120); });
  $('#sx-form', el).addEventListener('submit', e => { e.preventDefault(); ac.close(); const it = intent(inp.value); if (it.cats.length === 1) { cat = it.cats[0]; catBrand = it.brand ? it.brand.n : null; } run(); });
  el.addEventListener('click', e => {
    const c = e.target.closest('[data-q]'); if (c) { cat = null; inp.value = c.dataset.q; run(); return; }
    if (e.target.closest('[data-ai]')) { openAIHelp(inp.value); return; }
    if (e.target.closest('#sx-clear')) { cat = null; inp.value = ''; run(); ac.close(); inp.focus(); return; }
    const sc = e.target.closest('[data-sxcat]'); if (sc) { cat = sc.dataset.sxcat; catBrand = sc.dataset.sxbrand || null; run(); el.scrollTop = 0; return; }
    if (e.target.closest('[data-sxall]')) { cat = null; inp.value = ''; run(); return; }
    if (e.target.closest('[data-sxgo]')) { setQuery(inp.value, true); goTo('catalog'); return; }
    const o = e.target.closest('[data-open]'); if (o) { openProfile(o.dataset.open); return; }
    if (e.target.closest('[data-go-join]')) { Modal.close(true); goTo('join'); return; }
    const pj = e.target.closest('[data-post]'); if (pj) openPostJob(pj.dataset.post || '');
  });
}

/* ---------- презентация ---------- */
const Intro = (() => {
  const root = $('#intro'), slides = $$('.slide', root), stories = $$('.story', root), N = slides.length;
  let cur = 0, userPaused = false, inView = true, kpiShown = false;
  const auto = !REDUCE;
  const playing = () => auto && !userPaused && inView && !document.hidden && Modal.root.hidden && cur < N - 1;
  function sync() {
    root.classList.toggle('is-paused', !playing());
    const b = $('#intro-pause');
    b.innerHTML = icon(userPaused ? 'play' : 'pause');
    b.setAttribute('aria-label', userPaused ? 'Продолжить показ' : 'Пауза');
    b.hidden = !auto;
  }
  function go(i) {
    i = clamp(i, 0, N - 1);
    slides.forEach((s, j) => { const on = j === i; s.classList.toggle('is-active', on); s.setAttribute('aria-hidden', on ? 'false' : 'true'); s.inert = !on; });
    stories.forEach((b, j) => { b.classList.remove('run'); b.classList.toggle('done', j < i || (!auto && j === i)); b.setAttribute('aria-current', j === i ? 'step' : 'false'); });
    if (auto) { const b = stories[i]; void b.offsetWidth; b.classList.add('run'); }
    cur = i;
    $('#intro-count').innerHTML = '<b>' + String(i + 1).padStart(2, '0') + '</b> / ' + String(N).padStart(2, '0');
    if (inView) Scene.setMode(slides[i].dataset.mode);
    if (i === 0) renderKpis(true);
    sync();
  }
  function renderKpis(force) {
    if (!force && kpiShown && cur !== 0) return;
    kpiShown = true;
    const ms = masters(), rated = ms.filter(m => m.n);
    tween($('[data-kpi="masters"]'), ms.length);
    tween($('[data-kpi="reviews"]'), ms.reduce((s, m) => s + m.n, 0));
    tween($('[data-kpi="avg"]'), rated.length ? rated.reduce((s, m) => s + m.avg, 0) / rated.length : 0, 1);
    $('#kpi-note').hidden = !local.showDemo;
  }
  function init() {
    $$('.split', root).forEach(el => {
      const words = el.textContent.trim().split(/\s+/);
      el.setAttribute('aria-label', el.textContent.trim());
      el.innerHTML = words.map((w, i) => '<span class="w" aria-hidden="true" style="--i:' + i + '"><span>' + esc(w) + '</span></span>').join(' ');
    });
    stories.forEach((b, j) => b.addEventListener('click', () => go(j)));
    root.addEventListener('animationend', e => {
      if (e.animationName !== 'storyFill') return;
      const b = e.target.closest('.story'), j = stories.indexOf(b);
      if (j !== cur) return;
      b.classList.remove('run'); b.classList.add('done');
      if (cur < N - 1) go(cur + 1); else sync();
    });
    $('#intro-prev').addEventListener('click', () => go(cur - 1));
    $('#intro-next').addEventListener('click', () => go(cur + 1));
    $('#intro-pause').addEventListener('click', () => { userPaused = !userPaused; if (!userPaused && cur === N - 1) go(0); else sync(); });
    document.addEventListener('keydown', e => {
      if (!inView || !Modal.root.hidden) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    });
    let sx = null, sy = null;
    const sl = $('#slides');
    sl.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; sx = e.clientX; sy = e.clientY; }, {passive: true});
    sl.addEventListener('pointerup', e => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(cur + (dx < 0 ? 1 : -1));
    }, {passive: true});
    const fs = $('#intro-fs'), de = document.documentElement;
    if (de.requestFullscreen && document.fullscreenEnabled !== false) {
      fs.hidden = false;
      fs.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else { await de.requestFullscreen(); window.scrollTo({top: 0}); go(0); }
        } catch (err) { fs.hidden = true; toast('Браузер не разрешил полноэкранный режим', 'warn'); }
      });
      document.addEventListener('fullscreenchange', () => { fs.setAttribute('aria-label', document.fullscreenElement ? 'Выйти из полноэкранного режима' : 'Показать на весь экран'); });
    }
    $('#intro-search').addEventListener('submit', e => { e.preventDefault(); openSearch($('#iq').value); });
    $('#hero-search').addEventListener('click', () => openSearch(''));
    $('#intro-cats').innerHTML = CATS.slice(0, 5).map(c => '<button class="chip" type="button" data-icat="' + esc(c.k) + '">' + esc(c.k) + '</button>').join('');
    $('#intro-cats').addEventListener('click', e => { const b = e.target.closest('[data-icat]'); if (b) { setCat(b.dataset.icat); goTo('catalog'); } });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => {
        es.forEach(en => {
          inView = en.intersectionRatio > 0.45;
          Scene.setMode(inView ? slides[cur].dataset.mode : 'ambient');
          sync();
        });
      }, {threshold: [0, 0.45, 0.6]}).observe(root);
    }
    document.addEventListener('visibilitychange', sync);
    go(0);
  }
  return {init, renderKpis, sync};
})();
function fillIntroCards() {
  const d1 = enrich(DEMO_MASTERS[0]);
  $('#fc-master').innerHTML = '<div class="fc-top">' + avaHTML(d1) + '<div class="fc-who"><b>' + esc(d1.name) + '</b><span>' + esc(d1.prof) + ' · ' + esc(d1.district) + '</span></div><span class="bdg ok">' + icon('shield') + 'Проверен</span></div>' +
    '<div class="rating">' + starsHTML(d1.avg) + '<b>' + fmtR(d1.avg) + '</b><span>' + pl(d1.n, REV) + '</span></div>' +
    '<table class="fc-svc"><tbody>' + d1.services.slice(0, 3).map(s => '<tr><td>' + esc(s.n) + '</td><td>' + esc(s.p) + '</td></tr>').join('') + '</tbody></table>';
  const r = d1.reviews[0];
  $('#fc-review').innerHTML = '<div class="fc-top"><span class="rv-ava">' + esc(r.a.charAt(0)) + '</span><div class="fc-who"><b>' + esc(r.a) + '</b><span>о мастере ' + esc(d1.name) + '</span></div></div>' + starsHTML(r.r, 20) + '<p class="fc-q">' + esc(r.t) + '</p><div class="rv-tags">' + r.tags.map(t => '<span>' + esc(t) + '</span>').join('') + '</div>';
  const j = DEMO_JOBS[0];
  $('#fc-job').innerHTML = '<div class="fc-top"><span class="job-ic sm">' + icon('tiles') + '</span><div class="fc-who"><b>' + esc(j.title) + '</b><span>' + esc(j.district) + ' · ' + esc(j.when) + '</span></div></div>' +
    '<div class="fc-row"><span>Бюджет до ' + fmt(j.budget) + '</span><span class="bdg live">' + pl(j.responses.length, RESP) + '</span></div>' +
    '<div class="fc-resp">' + j.responses.map(x => '<div><b>' + esc(x.name) + '</b><span>' + fmt(x.price) + '</span></div>').join('') + '</div>';
}

/* ---------- навигация ---------- */
/* Приложение показывает один экран за раз: мастера, заказы, ИИ или анкета мастера */
const VIEWS = ['catalog', 'jobs', 'ai', 'join'];
const VIEW_ALIAS = {intro: 'catalog', calc: 'catalog'};
function setView(id, push) {
  id = VIEW_ALIAS[id] || id;
  if (VIEWS.indexOf(id) < 0) id = 'catalog';
  const r = document.documentElement, changed = r.dataset.view !== id;
  r.dataset.view = id;
  $$('.nav a[data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === id ? 'true' : 'false'));
  $$('#tabbar [data-tab]').forEach(b => b.setAttribute('aria-current', b.dataset.tab === id ? 'true' : 'false'));
  if (changed) {
    window.scrollTo(0, 0);
    const url = location.pathname + location.search + (id === 'catalog' ? '' : '#' + id);
    try { if (push) history.pushState({view: id}, '', url); else history.replaceState({view: id}, '', url); } catch (e) { /* без истории */ }
  }
}
function goTo(id) {
  closeMenu();
  if (!Modal.root.hidden) Modal.close(true);
  if (id === 'faq') { openGuide(); return; }
  setView(id, true);
}
function closeMenu() { const m = $('#mnav'); if (!m.hidden) { m.hidden = true; $('#btn-menu').setAttribute('aria-expanded', 'false'); } }
function renderStatus() {
  let cls = '', txt = 'Демо-режим: ваши записи сохраняются в этом браузере';
  if (FB.on) {
    ['#data-status', '#foot-status'].forEach(s => { const el = $(s); if (el) { el.className = 'status live'; el.textContent = 'Сервер подключён, данные защищены'; } });
    return;
  }
  if (shared.on && shared.canWrite) { cls = 'live'; txt = 'Общая база подключена: новые записи видят другие посетители'; }
  else if (shared.on) { txt = 'Общая база открыта для чтения, ваши записи сохраняются в этом браузере'; }
  ['#data-status', '#foot-status'].forEach(s => { const el = $(s); if (el) { el.className = 'status' + (cls ? ' ' + cls : ''); el.textContent = txt; } });
}
function renderAll() {
  renderCats(); renderDistricts(); renderPriceRange(); renderCatalog(false); renderJobs(); renderTray(); updateFavBadge(); updateChatBadge(); refreshProfile(); refreshChat(); Intro.renderKpis(false); renderStatus();
}

/* ---------- приложение на телефон (PWA) ---------- */
const INSTALL = {evt: null};
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const canInstall = () => !isStandalone() && !window.claude;
function updateInstallUI() { $$('[data-install]').forEach(el => { el.hidden = !canInstall(); }); }
function initInstall() {
  const local_ = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || local_) && !window.claude) navigator.serviceWorker.register('sw.js').catch(e => console.warn('Офлайн-режим:', e && e.message));
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); INSTALL.evt = e; updateInstallUI(); });
  addEventListener('appinstalled', () => { INSTALL.evt = null; updateInstallUI(); toast('Приложение установлено. Ищите «Мастер рядом» среди приложений'); });
  updateInstallUI();
}
async function installApp() {
  if (INSTALL.evt) {
    const e = INSTALL.evt; INSTALL.evt = null;
    try { await e.prompt(); await e.userChoice; } catch (err) { /* окно закрыли */ }
    updateInstallUI();
    return;
  }
  const iosB = '<div class="block"><span class="lbl">iPhone и iPad (Safari)</span><ol class="steps"><li>Откройте сайт в Safari.</li><li>Нажмите кнопку «Поделиться» внизу экрана.</li><li>Выберите «На экран „Домой“» и нажмите «Добавить».</li></ol></div>';
  const andB = '<div class="block"><span class="lbl">Android (Chrome)</span><ol class="steps"><li>Нажмите меню ⋮ в правом верхнем углу.</li><li>Выберите «Установить приложение» или «Добавить на главный экран».</li></ol></div>';
  const pcB = '<div class="block"><span class="lbl">Компьютер (Chrome, Edge)</span><ol class="steps"><li>Нажмите значок установки справа в адресной строке.</li></ol></div>';
  Modal.open('<h2 class="m-h">' + icon('mobile') + ' Установить приложение</h2><p class="m-sub">«Мастер рядом» появится на экране телефона с иконкой и будет открываться как обычное приложение.</p>' +
    (isIOS() ? iosB + andB : andB + iosB) + pcB,
  {label: 'Установить приложение', kind: 'install'});
}

/* ---------- запуск ---------- */
function init() {
  $$('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon, el.className); });
  document.addEventListener('click', e => {
    const ma = e.target.closest('[data-mact]');
    if (ma) { e.preventDefault(); closeMenu(); ({search: openSearch, chat: () => $('#btn-chat').click(), me: () => $('#btn-cab').click(), favs: openFavs, ai: () => goTo('ai'), settings: openSettings, install: installApp})[ma.dataset.mact](); return; }
    const a = e.target.closest('[data-nav]');
    if (a) { e.preventDefault(); goTo(a.dataset.nav); return; }
    const mn = $('#mnav');
    if (!mn.hidden && !e.target.closest('#mnav') && !e.target.closest('#btn-menu')) closeMenu();
  });
  $('#btn-menu').addEventListener('click', () => { const m = $('#mnav'); m.hidden = !m.hidden; $('#btn-menu').setAttribute('aria-expanded', String(!m.hidden)); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  $('#btn-cab').addEventListener('click', () => { if (isRegistered()) openCabinet('me'); else openAuth(); });
  $('#btn-search').addEventListener('click', openSearch);
  $('#btn-gear').addEventListener('click', openSettings);
  $('#tabbar').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    const tab = b.dataset.tab;
    if (tab === 'chat') { $('#btn-chat').click(); return; }
    if (tab === 'me') { $('#btn-cab').click(); return; }
    goTo(tab);
  });
  addEventListener('popstate', () => { if (!Modal.root.hidden) Modal.close(true); setView((location.hash || '').slice(1), false); });
  setView((location.hash || '').slice(1), false);
  $('#btn-chat').addEventListener('click', () => requireAccount('Чтобы переписываться с мастерами, создайте аккаунт: имя и номер телефона.', () => openChat()));
  document.addEventListener('keydown', e => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || !Modal.root.hidden) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    e.preventDefault(); openSearch();
  });
  updateMeBtn();
  applyTheme(local.theme); applyCalm();
  if (FINE && !REDUCE) {
    $$('.magnet').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px'); b.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px'); });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--tx', '0px'); b.style.setProperty('--ty', '0px'); });
    });
  }
  fillIntroCards();
  initCatalog(); initJobs(); initWizard(); initAIScreen();
  Intro.init();
  if (!local.lang) { const nl = String(navigator.language || '').slice(0, 2).toLowerCase(); local.lang = nl === 'en' ? 'en' : nl === 'tg' ? 'tg' : 'ru'; }
  renderAll();
  const introEl = $('#intro'), hdr = $('#hdr');
  let introH = introEl.offsetHeight, sq = false;
  const onScroll = () => { const y = window.scrollY || document.documentElement.scrollTop || 0; hdr.classList.toggle('is-solid', y > 24); Scene.setScroll(y, introH); };
  addEventListener('scroll', () => { if (sq) return; sq = true; requestAnimationFrame(() => { sq = false; onScroll(); }); }, {passive: true});
  addEventListener('resize', () => { introH = introEl.offsetHeight; onScroll(); });
  onScroll();
  setInterval(() => { if (document.hidden) return; renderJobs(); }, 60000);
  setLang(local.lang);
  /* Разделы мягко появляются при прокрутке. */
  if ('IntersectionObserver' in window && !REDUCE) {
    const items = $$('.res-bar, .jobs, .perks, .wizard');
    $$('.faq details').forEach((d, i) => d.style.setProperty('--rd', (i * 70) + 'ms'));
    const ro = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('shown'); ro.unobserve(en.target); } }), {rootMargin: '0px 0px -8% 0px', threshold: 0.08});
    items.forEach(x => { x.classList.add('reveal'); ro.observe(x); });
  }
  initShared();
  initAI();
  initInstall();
}
init();
})();
