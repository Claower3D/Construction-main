const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const PROD_URL = 'https://construction-main-production.up.railway.app';
const OLD_URL = 'https://qazgost-backend.up.railway.app';

// 1. Update crmApi.js
const crmApiPath = path.join(rootDir, 'src/api/crmApi.js');
let crmApi = fs.readFileSync(crmApiPath, 'utf8');
crmApi = crmApi.split(OLD_URL).join(PROD_URL);

// Update getStoredSettings to automatically migrate legacy URL
const oldSettingsFunc = `export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    serverUrl: 'https://construction-main-production.up.railway.app',
    offlineMode: true,
    lastSyncTime: null,
    autoSyncInterval: 30
  };
};`;

const newSettingsFunc = `export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.serverUrl || parsed.serverUrl.includes('qazgost-backend')) {
        parsed.serverUrl = 'https://construction-main-production.up.railway.app';
        saveStoredSettings(parsed);
      }
      return parsed;
    }
  } catch (e) {}
  return {
    serverUrl: 'https://construction-main-production.up.railway.app',
    offlineMode: true,
    lastSyncTime: null,
    autoSyncInterval: 30
  };
};`;

// Also check without semicolon
if (crmApi.includes(oldSettingsFunc)) {
  crmApi = crmApi.replace(oldSettingsFunc, newSettingsFunc);
} else {
  // Replace generic getStoredSettings block
  crmApi = crmApi.replace(
    /export function getStoredSettings\(\) \{[\s\S]*?return \{[\s\S]*?\};?\s*\}/,
    `export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.serverUrl || parsed.serverUrl.includes('qazgost-backend')) {
        parsed.serverUrl = 'https://construction-main-production.up.railway.app';
        saveStoredSettings(parsed);
      }
      return parsed;
    }
  } catch (e) {}
  return {
    serverUrl: 'https://construction-main-production.up.railway.app',
    offlineMode: true,
    lastSyncTime: null,
    autoSyncInterval: 30
  };
}`
  );
}

fs.writeFileSync(crmApiPath, crmApi, 'utf8');
console.log('✓ crmApi.js updated with production Railway URL.');

// 2. Update LoginScreen.jsx
const loginPath = path.join(rootDir, 'src/components/LoginScreen.jsx');
let loginScreen = fs.readFileSync(loginPath, 'utf8');
loginScreen = loginScreen.split(OLD_URL).join(PROD_URL);
loginScreen = loginScreen.replace(
  /const \[customServerUrl, setCustomServerUrl\] = useState\([^)]+\);/,
  `const [customServerUrl, setCustomServerUrl] = useState((serverUrl && !serverUrl.includes('qazgost-backend')) ? serverUrl : 'https://construction-main-production.up.railway.app');`
);
loginScreen = loginScreen.replace('CRM v1.1', 'CRM v1.2');
fs.writeFileSync(loginPath, loginScreen, 'utf8');
console.log('✓ LoginScreen.jsx updated with production Railway URL.');

// 3. Update SettingsModal.jsx
const settingsPath = path.join(rootDir, 'src/components/SettingsModal.jsx');
let settingsModal = fs.readFileSync(settingsPath, 'utf8');
settingsModal = settingsModal.split(OLD_URL).join(PROD_URL);
settingsModal = settingsModal.replace(
  /const \[serverUrl, setServerUrl\] = useState\([^)]+\);/,
  `const [serverUrl, setServerUrl] = useState((settings.serverUrl && !settings.serverUrl.includes('qazgost-backend')) ? settings.serverUrl : 'https://construction-main-production.up.railway.app');`
);
fs.writeFileSync(settingsPath, settingsModal, 'utf8');
console.log('✓ SettingsModal.jsx updated with production Railway URL.');

// 4. Update build.gradle
const gradlePath = path.join(rootDir, 'android/app/build.gradle');
let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace('versionCode 2', 'versionCode 3');
gradle = gradle.replace('versionName "1.1"', 'versionName "1.2"');
fs.writeFileSync(gradlePath, gradle, 'utf8');
console.log('✓ build.gradle bumped to versionCode 3 / versionName 1.2.');
