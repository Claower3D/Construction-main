
// Regole con numeri (vedi PATTERNS in dict.js): id → modello per String.replace o funzione (m, tr)
const UNIT = { 'м³': 'm³', 'м²': 'm²', 'м': 'm', 'т': 't', 'кг': 'kg', 'л': 'L', 'км': 'km', 'шт': 'pz', 'меш.': 'sacchi', 'мм': 'mm' };
const MONTH = { января: 'gennaio', февраля: 'febbraio', марта: 'marzo', апреля: 'aprile', мая: 'maggio', июня: 'giugno', июля: 'luglio', августа: 'agosto', сентября: 'settembre', октября: 'ottobre', ноября: 'novembre', декабря: 'dicembre' };
export const PATTERNS = {
  loginLock: 'Troppi tentativi di accesso non riusciti. Riprova tra $1 min.',
  minAgo: '$1 min fa',
  hoursAgo: (m) => (m[1] === '1' ? '1 ora fa' : `${m[1]} ore fa`),
  daysAgo: (m) => (m[1] === '1' ? '1 giorno fa' : `${m[1]} giorni fa`),
  fromPerUnit: (m) => `da ${m[1]} ₸/${UNIT[m[2]] || m[2]}`,
  perHour: '$1 ₸ / ora',
  perShift: '$1 ₸ / turno',
  qtyUnit: (m) => `${m[1]} ${UNIT[m[2]] || m[2]}`,
  items: '$1 voci',
  reviews: (m) => (m[1] === '1' ? '1 recensione' : `${m[1]} recensioni`),
  found: 'Trovati: $1',
  notifNew: 'Notifiche, nuove: $1',
  wallet: 'Portafoglio: $1 tenge',
  balance: 'Saldo: $1 ₸',
  ratesIn: '12 089 prezzi unitari in $1 categorie, ai prezzi del 2026.',
  noCategories: 'Nessuna categoria per «$1». Prova con un’altra parola.',
  range: 'Intervallo: $1 – $2 ₸',
  coefDays: (m, tr) => `${tr(m[1])}, coefficiente ×${m[2]}. ${tr(m[3])}, circa ${m[4]} giorni.`,
  coef: (m, tr) => `${tr(m[1])} — coefficiente ×${m[2]}`,
  open: (m, tr) => `Apri: ${tr(m[1])}`,
  ask: (m, tr) => `Chiedi: ${tr(m[1])}`,
  showListings: 'Mostra $1 annunci',
  account: (m) => `Account: ${m[1]}.${m[2] ? ' Per crearne un altro, esci prima da questo.' : ''}`,
  revision: (m) => `Versione del ${m[1]} ${MONTH[m[2]] || m[2]} ${m[3]}`,
};
