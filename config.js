/* Настройки сайта «Мастер рядом».
   Здесь нет секретов: эти значения видит любой посетитель, и это нормально.
   Защиту данных обеспечивают правила firestore.rules на сервере Firebase.
   НИКОГДА не вставляйте сюда ключ Gemini: он хранится в Cloudflare Worker (см. README). */
window.MR_CONFIG = {
  // 1. Скопируйте из Firebase Console → Настройки проекта → Ваши приложения → SDK setup and configuration → Config.
  //    Пока здесь null, сайт работает в демо-режиме: всё хранится только в браузере.
  firebase: null,
  // Пример:
  // firebase: {
  //   apiKey: 'AIza...',
  //   authDomain: 'master-ryadom.firebaseapp.com',
  //   projectId: 'master-ryadom',
  //   storageBucket: 'master-ryadom.appspot.com',
  //   messagingSenderId: '1234567890',
  //   appId: '1:1234567890:web:abcdef'
  // },

  // 2. Ключ сайта reCAPTCHA v3 для App Check (защита от ботов). Необязательно, но очень желательно.
  appCheckSiteKey: '',

  // 3. Адрес вашего Cloudflare Worker с Gemini, например 'https://master-ryadom-ai.ваше-имя.workers.dev'.
  aiEndpoint: '',

  // 4. Ключ для уведомлений (Web Push): Firebase Console → Настройки проекта → Cloud Messaging →
  //    Web configuration → Web Push certificates → Generate key pair. Это открытый ключ, он не секретный.
  vapidKey: '',

  // 5. Карта мастеров. По умолчанию — бесплатные карты OpenStreetMap (подходят для старта, не для большого трафика).
  //    Когда посетителей станет много, возьмите ключ у MapTiler, Stadia Maps или другого сервиса и впишите сюда его адрес плиток,
  //    а его домен добавьте в img-src в firebase.json и index.html. Пример:
  //    map: {tiles: 'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=ВАШ_КЛЮЧ', attribution: '© MapTiler © OpenStreetMap'},
  //    Спутник по умолчанию — Esri World Imagery; свой адрес снимков: map.satellite и map.satelliteAttribution.
  map: {center: [38.5598, 68.787], zoom: 12},

  // Код страны, если человек ввёл номер без «+»
  defaultCountryCode: '+992',

  // Мастера-примеры. В демо-режиме (без Firebase) они видны всегда, на настоящем сайте — только если поставить true.
  // Вымышленных мастеров нельзя показывать настоящим клиентам.
  showDemo: false
};
