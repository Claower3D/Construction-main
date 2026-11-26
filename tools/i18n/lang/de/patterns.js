
// Правила с числами (см. PATTERNS в dict.js): id правила → шаблон для String.replace или функция (m, tr)
const UNIT = { 'м³': 'm³', 'м²': 'm²', 'м': 'm', 'т': 't', 'кг': 'kg', 'л': 'L', 'км': 'km', 'шт': 'Stk.', 'меш.': 'Sack', 'мм': 'mm' };
const MONTH = { января: 'Januar', февраля: 'Februar', марта: 'März', апреля: 'April', мая: 'Mai', июня: 'Juni', июля: 'Juli', августа: 'August', сентября: 'September', октября: 'Oktober', ноября: 'November', декабря: 'Dezember' };
export const PATTERNS = {
  loginLock: 'Zu viele falsche Anmeldeversuche. Versuchen Sie es in $1 Min. erneut.',
  minAgo: 'vor $1 Min.',
  hoursAgo: 'vor $1 Std.',
  daysAgo: 'vor $1 Tagen',
  fromPerUnit: (m) => `ab ${m[1]} ₸/${UNIT[m[2]] || m[2]}`,
  perHour: '$1 ₸ / Stunde',
  perShift: '$1 ₸ / Schicht',
  qtyUnit: (m) => `${m[1]} ${UNIT[m[2]] || m[2]}`,
  items: '$1 Pos.',
  reviews: '$1 Bewertungen',
  found: 'Gefunden: $1',
  notifNew: 'Benachrichtigungen, neu: $1',
  wallet: 'Wallet: $1 Tenge',
  balance: 'Guthaben: $1 ₸',
  ratesIn: '12 089 Preise in $1 Kategorien nach Preisen des Jahres 2026.',
  noCategories: 'Zu „$1“ wurden keine Kategorien gefunden. Versuchen Sie ein anderes Wort.',
  range: 'Spanne: $1 – $2 ₸',
  coefDays: (m, tr) => `${tr(m[1])}, Koeffizient ×${m[2]}. ${tr(m[3])}, etwa ${m[4]} Tg.`,
  coef: (m, tr) => `${tr(m[1])} — Koeffizient ×${m[2]}`,
  open: (m, tr) => `Öffnen: ${tr(m[1])}`,
  ask: (m, tr) => `Fragen: ${tr(m[1])}`,
  showListings: '$1 Anzeigen zeigen',
  account: (m) => `Konto: ${m[1]}.${m[2] ? ' Um ein anderes zu erstellen, melden Sie sich zuerst von diesem ab.' : ''}`,
  revision: (m) => `Fassung vom ${m[1]}. ${MONTH[m[2]] || m[2]} ${m[3]}`,
};
