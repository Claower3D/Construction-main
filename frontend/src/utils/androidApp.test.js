// Где показывается окно «Остаться на сайте / Скачать приложение». Запуск: npm run test:android
import test from 'node:test';
import assert from 'node:assert/strict';
import { isAndroidBrowser, ANDROID_APK_URL, ANDROID_APK_FILE, ANDROID_APP_VERSION } from './androidApp.js';

const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const TABLET_ANDROID = 'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const SAMSUNG = 'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const GOOGLEBOT = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

test('окно показывается в браузере на Android', () => {
  for (const ua of [CHROME_ANDROID, TABLET_ANDROID, SAMSUNG]) assert.equal(isAndroidBrowser(ua, {}), true, ua);
});

test('на iPhone и компьютере окна нет', () => {
  for (const ua of [IPHONE, WINDOWS, '', undefined]) assert.equal(isAndroidBrowser(ua, {}), false, String(ua));
});

test('внутри самого приложения и для поисковых роботов окна нет', () => {
  assert.equal(isAndroidBrowser(CHROME_ANDROID, { Capacitor: { isNativePlatform: () => true } }), false);
  assert.equal(isAndroidBrowser(CHROME_ANDROID, { Capacitor: { isNativePlatform: () => false } }), true);
  assert.equal(isAndroidBrowser(GOOGLEBOT, {}), false);
});

test('адрес файла содержит номер версии', () => {
  assert.equal(ANDROID_APK_URL, `/downloads/QazGost-${ANDROID_APP_VERSION}.apk`);
  assert.equal(ANDROID_APK_FILE, `QazGost-${ANDROID_APP_VERSION}.apk`);
});
