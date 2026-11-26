
// Règles avec nombres (voir PATTERNS dans dict.js) : id → modèle pour String.replace ou fonction (m, tr)
const UNIT = { 'м³': 'm³', 'м²': 'm²', 'м': 'm', 'т': 't', 'кг': 'kg', 'л': 'L', 'км': 'km', 'шт': 'u.', 'меш.': 'sac', 'мм': 'mm' };
const MONTH = { января: 'janvier', февраля: 'février', марта: 'mars', апреля: 'avril', мая: 'mai', июня: 'juin', июля: 'juillet', августа: 'août', сентября: 'septembre', октября: 'octobre', ноября: 'novembre', декабря: 'décembre' };
export const PATTERNS = {
  loginLock: 'Trop de tentatives de connexion échouées. Réessayez dans $1 min.',
  minAgo: 'il y a $1 min',
  hoursAgo: (m) => (m[1] === '1' ? 'il y a 1 heure' : `il y a ${m[1]} heures`),
  daysAgo: (m) => (m[1] === '1' ? 'il y a 1 jour' : `il y a ${m[1]} jours`),
  fromPerUnit: (m) => `à partir de ${m[1]} ₸/${UNIT[m[2]] || m[2]}`,
  perHour: '$1 ₸ / heure',
  perShift: '$1 ₸ / poste',
  qtyUnit: (m) => `${m[1]} ${UNIT[m[2]] || m[2]}`,
  items: '$1 postes',
  reviews: (m) => (m[1] === '1' ? '1 avis' : `${m[1]} avis`),
  found: 'Trouvé : $1',
  notifNew: 'Notifications, nouvelles : $1',
  wallet: 'Portefeuille : $1 tenge',
  balance: 'Solde : $1 ₸',
  ratesIn: '12 089 prix unitaires dans $1 catégories, aux prix de 2026.',
  noCategories: 'Aucune catégorie pour « $1 ». Essayez un autre mot.',
  range: 'Fourchette : $1 – $2 ₸',
  coefDays: (m, tr) => `${tr(m[1])}, coefficient ×${m[2]}. ${tr(m[3])}, environ ${m[4]} jours.`,
  coef: (m, tr) => `${tr(m[1])} — coefficient ×${m[2]}`,
  open: (m, tr) => `Ouvrir : ${tr(m[1])}`,
  ask: (m, tr) => `Demander : ${tr(m[1])}`,
  showListings: 'Afficher $1 annonces',
  account: (m) => `Compte : ${m[1]}.${m[2] ? ' Pour en créer un autre, déconnectez-vous d’abord de celui-ci.' : ''}`,
  revision: (m) => `Version du ${m[1]} ${MONTH[m[2]] || m[2]} ${m[3]}`,
};
