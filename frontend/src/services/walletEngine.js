// WalletEngine v3.0 - Per-User Escrow Financial Engine & Transactions

const EXCHANGE_RATES = {
  KZT: 1,
  USD: 0.0021,
  RUB: 0.175,
};

// Генерируем уникальный ключ пользователя
function getUserKey(user) {
  if (!user) return 'guest';
  return user.login || user.email || user.name || 'guest';
}

export function getBalanceKZT(user) {
  const key = `qazgost_balance_${getUserKey(user)}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) return parseFloat(saved);
  } catch (e) {
    console.error('WalletEngine getBalance error:', e);
  }
  return 0; // Новый пользователь — баланс 0
}

export function getTransactions(user) {
  const key = `qazgost_transactions_${getUserKey(user)}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('WalletEngine getTransactions error:', e);
  }
  return []; // Новый пользователь — пустая история
}

export function topupBalance(amountKZT, method = 'Kaspi Pay', user = null) {
  const userKey = getUserKey(user);
  const balanceKey = `qazgost_balance_${userKey}`;
  const txKey = `qazgost_transactions_${userKey}`;

  const current = getBalanceKZT(user);
  const next = current + amountKZT;
  try {
    localStorage.setItem(balanceKey, next.toString());
    const txs = getTransactions(user);
    const newTx = {
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleString(),
      type: 'topup',
      title: `Пополнение через ${method}`,
      amount: amountKZT,
      status: 'completed',
    };
    localStorage.setItem(txKey, JSON.stringify([newTx, ...txs]));
  } catch (e) {
    console.error('WalletEngine topup error:', e);
  }
  return next;
}

export function convertCurrency(amountKZT, targetCurrency = 'USD') {
  const rate = EXCHANGE_RATES[targetCurrency.toUpperCase()] || 1;
  return amountKZT * rate;
}

export function getExchangeRates() {
  return EXCHANGE_RATES;
}
