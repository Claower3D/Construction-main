
// Правила с числами (см. PATTERNS в dict.js): id правила → шаблон для String.replace или функция (m, tr)
const UNIT = { 'м³': 'm³', 'м²': 'm²', 'м': 'm', 'т': 't', 'кг': 'kg', 'л': 'L', 'км': 'km', 'шт': '件', 'меш.': '袋', 'мм': 'mm' };
const MONTH = { января: 1, февраля: 2, марта: 3, апреля: 4, мая: 5, июня: 6, июля: 7, августа: 8, сентября: 9, октября: 10, ноября: 11, декабря: 12 };
export const PATTERNS = {
  loginLock: '错误登录尝试次数过多。请 $1 分钟后重试。',
  minAgo: '$1 分钟前',
  hoursAgo: '$1 小时前',
  daysAgo: '$1 天前',
  fromPerUnit: (m) => `${m[1]} ₸/${UNIT[m[2]] || m[2]} 起`,
  perHour: '$1 ₸ / 小时',
  perShift: '$1 ₸ / 台班',
  qtyUnit: (m) => `${m[1]} ${UNIT[m[2]] || m[2]}`,
  items: '$1 项',
  reviews: '$1 条评价',
  found: '找到：$1',
  notifNew: '通知，新消息：$1',
  wallet: '钱包：$1 坚戈',
  balance: '余额：$1 ₸',
  ratesIn: '$1 个类别共 12 089 项单价，按 2026 年价格。',
  noCategories: '未找到与「$1」相关的类别。请换一个词试试。',
  range: '范围：$1 – $2 ₸',
  coefDays: (m, tr) => `${tr(m[1])}，系数 ×${m[2]}。${tr(m[3])}，约 ${m[4]} 天。`,
  coef: (m, tr) => `${tr(m[1])} — 系数 ×${m[2]}`,
  open: (m, tr) => `打开：${tr(m[1])}`,
  ask: (m, tr) => `提问：${tr(m[1])}`,
  showListings: '显示 $1 条信息',
  account: (m) => `账户：${m[1]}。${m[2] ? '要创建其他账户，请先退出当前账户。' : ''}`,
  revision: (m) => `${m[3]} 年 ${MONTH[m[2]] || m[2]} 月 ${m[1]} 日版`,
};
