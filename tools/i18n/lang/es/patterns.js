
// Reglas con números (ver PATTERNS en dict.js): id → plantilla para String.replace o función (m, tr)
const UNIT = { 'м³': 'm³', 'м²': 'm²', 'м': 'm', 'т': 't', 'кг': 'kg', 'л': 'L', 'км': 'km', 'шт': 'pza', 'меш.': 'bultos', 'мм': 'mm' };
const MONTH = { января: 'enero', февраля: 'febrero', марта: 'marzo', апреля: 'abril', мая: 'mayo', июня: 'junio', июля: 'julio', августа: 'agosto', сентября: 'septiembre', октября: 'octubre', ноября: 'noviembre', декабря: 'diciembre' };
export const PATTERNS = {
  loginLock: 'Demasiados intentos fallidos de inicio de sesión. Inténtalo de nuevo en $1 min.',
  minAgo: 'hace $1 min',
  hoursAgo: (m) => (m[1] === '1' ? 'hace 1 hora' : `hace ${m[1]} horas`),
  daysAgo: (m) => (m[1] === '1' ? 'hace 1 día' : `hace ${m[1]} días`),
  fromPerUnit: (m) => `desde ${m[1]} ₸/${UNIT[m[2]] || m[2]}`,
  perHour: '$1 ₸ / hora',
  perShift: '$1 ₸ / turno',
  qtyUnit: (m) => `${m[1]} ${UNIT[m[2]] || m[2]}`,
  items: '$1 partidas',
  reviews: (m) => (m[1] === '1' ? '1 reseña' : `${m[1]} reseñas`),
  found: 'Encontrados: $1',
  notifNew: 'Notificaciones, nuevas: $1',
  wallet: 'Billetera: $1 tenge',
  balance: 'Saldo: $1 ₸',
  ratesIn: '12 089 precios unitarios en $1 categorías, a precios de 2026.',
  noCategories: 'No hay categorías para «$1». Prueba con otra palabra.',
  range: 'Rango: $1 – $2 ₸',
  coefDays: (m, tr) => `${tr(m[1])}, coeficiente ×${m[2]}. ${tr(m[3])}, unos ${m[4]} días.`,
  coef: (m, tr) => `${tr(m[1])} — coeficiente ×${m[2]}`,
  open: (m, tr) => `Abrir: ${tr(m[1])}`,
  ask: (m, tr) => `Preguntar: ${tr(m[1])}`,
  showListings: 'Mostrar $1 anuncios',
  account: (m) => `Cuenta: ${m[1]}.${m[2] ? ' Para crear otra, primero cierra sesión en esta.' : ''}`,
  revision: (m) => `Versión del ${m[1]} de ${MONTH[m[2]] || m[2]} de ${m[3]}`,
};
