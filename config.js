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

  // Код страны, если человек ввёл номер без «+»
  defaultCountryCode: '+992',

  // Показывать мастеров-примеров. На настоящем сайте выключите (false), когда появятся настоящие мастера.
  showDemo: true
};
