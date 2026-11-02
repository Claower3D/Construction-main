# QazGost — сборка iOS на MacBook

В архиве три готовых Xcode-проекта (Capacitor 6):

| Папка | Приложение | Bundle ID | Версия |
|---|---|---|---|
| `mobile-manager` | QazGost CRM | `kz.qazgost.manager` | 2.1 (21) |
| `mobile-engineer` | QazGost Инженер | `kz.qazgost.engineer` | 2.1 (21) |
| `mobile-executor` | QazGost Исполнитель | `kz.qazgost.executor` | 2.1 (21) |

Уже настроено: иконки 1024 px, заставка, русский язык, только портретная ориентация,
iPhone, iOS 14+, тексты разрешений для камеры, фото, микрофона, распознавания речи и геопозиции.

## Что нужно на Mac
1. **Xcode** из App Store (запустить один раз, принять лицензию).
2. **Node.js 18+** — https://nodejs.org (или `brew install node`).
3. **CocoaPods** — скрипт поставит сам (`brew install cocoapods`).
4. **Apple ID**. Для установки на свой iPhone хватит бесплатного; для TestFlight и App Store нужен Apple Developer Program (99 $/год).

## Быстрый путь: запустить на своём iPhone
```bash
cd ~/Downloads/QazGost-iOS          # куда распаковали архив
chmod +x build_ios.sh
./build_ios.sh mobile-engineer        # или mobile-manager / mobile-executor
```
Откроется Xcode. Дальше:
1. Слева выберите проект **App** → вкладка **Signing & Capabilities**.
2. **Team** — выберите свой Apple ID (Xcode → Settings → Accounts → «+», если его нет).
3. Если Xcode пишет, что Bundle ID занят, поменяйте его, например на `kz.qazgost.engineer.dev`.
4. Подключите iPhone кабелем, выберите его вверху и нажмите **▶ Run**.
5. На iPhone: Настройки → Основные → VPN и управление устройством → доверять разработчику.
   Для iOS 16+ включите «Режим разработчика» (Настройки → Конфиденциальность).

## Сборка .ipa для TestFlight / App Store
```bash
TEAM_ID=ABCDE12345 ./build_ios.sh archive
```
`TEAM_ID` — на https://developer.apple.com/account → Membership.
Готовые `.ipa` появятся в папке `build/`. Загрузить их в App Store Connect можно приложением
**Transporter** (бесплатно в Mac App Store) или в Xcode: Window → Organizer → Distribute App.

Перед первой загрузкой создайте приложения в App Store Connect с теми же Bundle ID.

## Если что-то пошло не так
- `pod: command not found` → `brew install cocoapods`, затем снова `./build_ios.sh`.
- «No such module Capacitor» → закройте Xcode, выполните `cd mobile-xxx/ios/App && pod install`,
  откройте **App.xcworkspace** (не .xcodeproj).
- Изменили код приложения (папка `src`) → снова `./build_ios.sh mobile-xxx`: он пересоберёт сайт приложения и перенесёт его в Xcode.
