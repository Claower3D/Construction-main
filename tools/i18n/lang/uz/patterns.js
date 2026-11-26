
// Правила с числами (см. PATTERNS в dict.js): id правила → шаблон для String.replace или функция (m, tr)
const UNIT = { 'м³': 'm³', 'м²': 'm²', 'м': 'm', 'т': 't', 'кг': 'kg', 'л': 'L', 'км': 'km', 'шт': 'dona', 'меш.': 'qop', 'мм': 'mm' };
const MONTH = { января: 'yanvar', февраля: 'fevral', марта: 'mart', апреля: 'aprel', мая: 'may', июня: 'iyun', июля: 'iyul', августа: 'avgust', сентября: 'sentabr', октября: 'oktabr', ноября: 'noyabr', декабря: 'dekabr' };
export const PATTERNS = {
  loginLock: 'Kirishga notoʻgʻri urinishlar juda koʻp. $1 daqiqadan soʻng urinib koʻring.',
  minAgo: '$1 daqiqa oldin',
  hoursAgo: '$1 soat oldin',
  daysAgo: '$1 kun oldin',
  fromPerUnit: (m) => `${m[1]} ₸/${UNIT[m[2]] || m[2]} dan`,
  perHour: '$1 ₸ / soat',
  perShift: '$1 ₸ / smena',
  qtyUnit: (m) => `${m[1]} ${UNIT[m[2]] || m[2]}`,
  items: '$1 ta pozitsiya',
  reviews: '$1 ta sharh',
  found: 'Topildi: $1',
  notifNew: 'Bildirishnomalar, yangi: $1',
  wallet: 'Hamyon: $1 tenge',
  balance: 'Balans: $1 ₸',
  ratesIn: '$1 ta toifada 12 089 ta narx, 2026-yil narxlari boʻyicha.',
  noCategories: '«$1» boʻyicha toifalar topilmadi. Boshqa soʻzni sinab koʻring.',
  range: 'Oraliq: $1 – $2 ₸',
  coefDays: (m, tr) => `${tr(m[1])}, koeffitsiyent ×${m[2]}. ${tr(m[3])}, taxminan ${m[4]} kun.`,
  coef: (m, tr) => `${tr(m[1])} — koeffitsiyent ×${m[2]}`,
  open: (m, tr) => `Ochish: ${tr(m[1])}`,
  ask: (m, tr) => `Soʻrash: ${tr(m[1])}`,
  showListings: '$1 ta eʼlonni koʻrsatish',
  account: (m) => `Akkaunt: ${m[1]}.${m[2] ? ' Boshqasini yaratish uchun avval bundan chiqing.' : ''}`,
  revision: (m) => `${m[3]}-yil ${m[1]}-${MONTH[m[2]] || m[2]}dagi tahrir`,
};
