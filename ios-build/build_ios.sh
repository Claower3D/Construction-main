#!/bin/bash
# Сборка iOS-приложений QazGost на Mac.
#   ./build_ios.sh                    — подготовить все три и открыть Xcode
#   ./build_ios.sh mobile-engineer    — только одно приложение
#   TEAM_ID=ABCDE12345 ./build_ios.sh archive   — собрать .ipa всех трёх (нужен Apple Developer)
set -e
cd "$(dirname "$0")/.."

MODE=""
APPS=()
for a in "$@"; do
  if [ "$a" = "archive" ]; then MODE=archive; else APPS+=("$a"); fi
done
[ ${#APPS[@]} -eq 0 ] && APPS=(mobile-manager mobile-engineer mobile-executor)

command -v xcodebuild >/dev/null || { echo "Установите Xcode из App Store и запустите его один раз."; exit 1; }
command -v node >/dev/null || { echo "Нужен Node.js 18+: https://nodejs.org или brew install node"; exit 1; }
if ! command -v pod >/dev/null; then
  echo "Ставлю CocoaPods…"
  if command -v brew >/dev/null; then brew install cocoapods; else sudo gem install cocoapods; fi
fi

for app in "${APPS[@]}"; do
  echo "══════ $app ══════"
  (
    cd "$app"
    if [ -f package-lock.json ]; then npm ci; else npm install; fi
    npm run build
    npx cap sync ios
    if [ "$MODE" = "archive" ]; then
      [ -z "$TEAM_ID" ] && { echo "Укажите TEAM_ID=<Team ID из developer.apple.com>"; exit 1; }
      cd ios/App
      xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \
        -destination 'generic/platform=iOS' -archivePath "../../../build/$app.xcarchive" \
        -allowProvisioningUpdates DEVELOPMENT_TEAM="$TEAM_ID" CODE_SIGN_STYLE=Automatic archive
      sed "s/TEAM_ID_PLACEHOLDER/$TEAM_ID/" ../../../ios-build/ExportOptions.plist > /tmp/qg_export.plist
      xcodebuild -exportArchive -archivePath "../../../build/$app.xcarchive" \
        -exportPath "../../../build/$app" -exportOptionsPlist /tmp/qg_export.plist -allowProvisioningUpdates
    fi
  )
done

if [ "$MODE" = "archive" ]; then
  echo "Готово: файлы .ipa в папке build/"
  open build
else
  open "${APPS[0]}/ios/App/App.xcworkspace"
fi
