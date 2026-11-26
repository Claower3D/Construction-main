
// Правила с числами (см. PATTERNS в dict.js): id правила → шаблон для String.replace или функция (m, tr)
const UNIT = { 'м³': 'm³', 'м²': 'm²', 'м': 'm', 'т': 't', 'кг': 'kg', 'л': 'L', 'км': 'km', 'шт': 'adet', 'меш.': 'torba', 'мм': 'mm' };
const MONTH = { января: 'Ocak', февраля: 'Şubat', марта: 'Mart', апреля: 'Nisan', мая: 'Mayıs', июня: 'Haziran', июля: 'Temmuz', августа: 'Ağustos', сентября: 'Eylül', октября: 'Ekim', ноября: 'Kasım', декабря: 'Aralık' };
export const PATTERNS = {
  loginLock: 'Çok fazla hatalı giriş denemesi. $1 dk sonra tekrar deneyin.',
  minAgo: '$1 dk önce',
  hoursAgo: '$1 sa önce',
  daysAgo: '$1 gün önce',
  fromPerUnit: (m) => `${m[1]} ₸/${UNIT[m[2]] || m[2]}'den`,
  perHour: '$1 ₸ / saat',
  perShift: '$1 ₸ / vardiya',
  qtyUnit: (m) => `${m[1]} ${UNIT[m[2]] || m[2]}`,
  items: '$1 kalem',
  reviews: '$1 yorum',
  found: 'Bulundu: $1',
  notifNew: 'Bildirimler, yeni: $1',
  wallet: 'Cüzdan: $1 tenge',
  balance: 'Bakiye: $1 ₸',
  ratesIn: '$1 kategoride 12 089 birim fiyat, 2026 yılı fiyatlarıyla.',
  noCategories: '«$1» için kategori bulunamadı. Başka bir kelime deneyin.',
  range: 'Aralık: $1 – $2 ₸',
  coefDays: (m, tr) => `${tr(m[1])}, katsayı ×${m[2]}. ${tr(m[3])}, yaklaşık ${m[4]} gün.`,
  coef: (m, tr) => `${tr(m[1])} — katsayı ×${m[2]}`,
  open: (m, tr) => `Aç: ${tr(m[1])}`,
  ask: (m, tr) => `Sor: ${tr(m[1])}`,
  showListings: '$1 ilanı göster',
  account: (m) => `Hesap: ${m[1]}.${m[2] ? ' Başka bir hesap oluşturmak için önce çıkış yapın.' : ''}`,
  revision: (m) => `${m[1]} ${MONTH[m[2]] || m[2]} ${m[3]} tarihli sürüm`,
};
