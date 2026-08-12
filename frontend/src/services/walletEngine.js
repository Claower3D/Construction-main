// WalletEngine v2.0 - Escrow Financial Engine & Transactions

const BALANCE_KEY = 'qazgost_wallet_balance_kzt';
const TRANSACTIONS_KEY = 'qazgost_wallet_transactions';

const EXCHANGE_RATES = {
  KZT: 1,
  USD: 0.0021,
  RUB: 0.175,
};

const initialTransactions = [
  { id: 'TX-901', date: '08.08.2026 10:15', type: 'topup', title: 'Пополнение баланса (Kaspi Pay)', amount: 150000, status: 'completed' },
  { id: 'TX-902', date: '07.08.2026 16:40', type: 'escrow_hold', title: 'Заморозка по Сделке № 402/2026 (Капитальный ремонт)', amount: -85000, status: 'escrow' },
  { id: 'TX-903', date: '05.08.2026 12:20', type: 'payout', title: 'Вывод средств на IBAN (Халык Банк)', amount: -50000, status: 'completed' },
];

export function getBalanceKZT() {
  try {
    const saved = localStorage.getItem(BALANCE_KEY);
    if (saved !== null) return parseFloat(saved);
  } catch (e) {
    console.error('WalletEngine getBalance error:', e);
  }
  return 485000;
}

export function getTransactions() {
  try {
    const saved = localStorage.getItem(TRANSACTIONS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('WalletEngine getTransactions error:', e);
  }
  return initialTransactions;
}

export function topupBalance(amountKZT, method = 'Kaspi Pay') {
  const current = getBalanceKZT();
  const next = current + amountKZT;
  try {
    localStorage.setItem(BALANCE_KEY, next.toString());
    const txs = getTransactions();
    const newTx = {
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleString(),
      type: 'topup',
      title: `Пополнение через ${method}`,
      amount: amountKZT,
      status: 'completed',
    };
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([newTx, ...txs]));
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
