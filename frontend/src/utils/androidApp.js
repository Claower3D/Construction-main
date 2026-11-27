// Приложение QazGost для Android: одно приложение со всеми ролями (заказчик, исполнитель, инженер,
// менеджер, застройщик, администратор). В магазинах его пока нет, поэтому файл APK лежит на самом сайте:
// frontend/public/downloads/. При выпуске новой версии положите новый файл рядом и поменяйте
// три значения ниже — имя файла с номером версии нужно, чтобы телефон не взял старый файл из кэша.
export const ANDROID_APP_VERSION = '1.5';
export const ANDROID_APK_SIZE_MB = 20;
export const ANDROID_APK_URL = `/downloads/QazGost-${ANDROID_APP_VERSION}.apk`;
export const ANDROID_APK_FILE = `QazGost-${ANDROID_APP_VERSION}.apk`;

/**
 * Сайт открыт в браузере на Android (телефон или планшет), а не внутри самого приложения.
 * Поисковых роботов с «телефонным» адресом пропускаем: окно не должно заслонять им страницу.
 */
export function isAndroidBrowser(userAgent, win) {
  const ua = String(userAgent || '');
  if (!/Android/i.test(ua)) return false;
  if (/bot\b|crawl|spider|lighthouse|pagespeed|headlesschrome/i.test(ua)) return false;
  try {
    const cap = win && win.Capacitor;
    if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) return false;
  } catch (e) { /* нет доступа к объекту приложения — считаем, что это браузер */ }
  return true;
}
