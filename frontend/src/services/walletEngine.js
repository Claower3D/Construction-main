// WalletEngine v4.0 — кошелёк и эскроу пользователя (демо-хранилище в localStorage).
// ВНИМАНИЕ: это клиентская симуляция. Реальные деньги должны проводиться только сервером.

import { getStoredCurrentUser, userKeyOf, genId } from './platformUtils';

const EXCHANGE_RATES = {
  KZT: 1,
  USD: 0.0021,
  RUB: 0.175,
};

const START_BALANCE_KZT = 150000; // стартовый демо-баланс нового кошелька

// Если user не передан — используется текущий вошедший пользователь (а не общий «guest»).
function resolveUser(user) {
  return user || getStoredCurrentUser();
}

function getUserKey(user) {
  return userKeyOf(resolveUser(user)) || 'guest';
}

function balanceKey(user) { return `qazgost_balance_${getUserKey(user)}`; }
function txKey(user) { return `qazgost_transactions_${getUserKey(user)}`; }

/** Сумма > 0 в тенге (число) или NaN. Строки «5 000» / «5000,5» допускаются. */
export function toAmountKZT(value) {
  const n = typeof value === 'number'
    ? value
    : Number(String(value ?? '').replace(/[\s  ]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : NaN;
}

export function getBalanceKZT(user) {
  try {
    const saved = localStorage.getItem(balanceKey(user));
    if (saved !== null) {
      const n = Number(saved);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  } catch (e) {
    console.error('WalletEngine getBalance error:', e);
  }
  return START_BALANCE_KZT;
}

function normalizeTx(tx) {
  if (!tx || typeof tx !== 'object') return null;
  const amount = Number(tx.amount);
  return {
    ...tx,
    id: String(tx.id || genId('TX')),
    amount: Number.isFinite(amount) ? amount : 0,
    title: String(tx.title || tx.desc || 'Операция'),
    status: tx.status || 'completed',
  };
}

export function getTransactions(user) {
  try {
    const saved = localStorage.getItem(txKey(user));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.map(normalizeTx).filter(Boolean);
    }
  } catch (e) {
    console.error('WalletEngine getTransactions error:', e);
  }
  return [];
}

function writeWallet(user, nextBalance, txs) {
  localStorage.setItem(balanceKey(user), String(nextBalance));
  localStorage.setItem(txKey(user), JSON.stringify(txs));
}

function makeTx(type, title, amount, status, extra = {}) {
  return {
    id: genId(type === 'escrow_freeze' ? 'ESC' : 'TX'),
    date: new Date().toLocaleString('ru-RU'),
    createdAt: new Date().toISOString(),
    type,
    title,
    amount,
    status,
    ...extra,
  };
}

/**
 * Пополнение. Возвращает новый баланс. Некорректная сумма (≤0, NaN, строка-мусор) → Error.
 */
export function topupBalance(amountKZT, method = 'Kaspi Pay', user = null) {
  const amount = toAmountKZT(amountKZT);
  if (Number.isNaN(amount)) throw new Error('Некорректная сумма пополнения');
  const current = getBalanceKZT(user);
  const next = current + amount;
  const tx = makeTx('topup', `Пополнение через ${method}`, amount, 'completed');
  writeWallet(user, next, [tx, ...getTransactions(user)]);
  return next;
}

/**
 * Списание. Возвращает { ok, newBalance, txId, error }. При нехватке средств ничего не списывает.
 */
export function spendBalance(amountKZT, title = 'Оплата услуг', user = null, type = 'payment') {
  const amount = toAmountKZT(amountKZT);
  const current = getBalanceKZT(user);
  if (Number.isNaN(amount)) return { ok: false, error: 'invalid_amount', newBalance: current, txId: null };
  if (amount > current) return { ok: false, error: 'insufficient_funds', newBalance: current, txId: null };
  const next = current - amount;
  const tx = makeTx(type, title, -amount, 'completed');
  try {
    writeWallet(user, next, [tx, ...getTransactions(user)]);
  } catch (e) {
    return { ok: false, error: 'storage_error', newBalance: current, txId: null };
  }
  return { ok: true, newBalance: next, txId: tx.id };
}

/**
 * Заморозка эскроу. Возвращает { ok, newBalance, txId, error }.
 * При нехватке средств — ok:false, баланс не меняется (раньше баланс обнулялся, а заказ считался оплаченным).
 */
export function freezeEscrow(amountKZT, title = 'Заморозка эскроу-транша', user = null, meta = {}) {
  const amount = toAmountKZT(amountKZT);
  const current = getBalanceKZT(user);
  if (Number.isNaN(amount)) return { ok: false, error: 'invalid_amount', newBalance: current, txId: null };
  if (amount > current) return { ok: false, error: 'insufficient_funds', newBalance: current, txId: null, shortfall: amount - current };
  const next = current - amount;
  const tx = makeTx('escrow_freeze', `🔒 ${title}`, -amount, 'held_in_escrow', {
    escrowAmount: amount,
    releasedAmount: 0,
    orderId: meta.orderId || null,
  });
  try {
    writeWallet(user, next, [tx, ...getTransactions(user)]);
  } catch (e) {
    return { ok: false, error: 'storage_error', newBalance: current, txId: null };
  }
  return { ok: true, newBalance: next, txId: tx.id };
}

/** Привязать ранее замороженный транш к заказу (если ID заказа появился после заморозки). */
export function linkEscrowToOrder(txId, orderId, user = null) {
  if (!txId || !orderId) return false;
  const txs = getTransactions(user);
  const tx = txs.find((t) => t.id === txId);
  if (!tx) return false;
  tx.orderId = orderId;
  localStorage.setItem(txKey(user), JSON.stringify(txs));
  return true;
}

function remainingOf(tx) {
  const total = Number(tx.escrowAmount ?? Math.abs(tx.amount)) || 0;
  const released = Number(tx.releasedAmount) || 0;
  return Math.max(0, total - released);
}

/** Сколько средств пользователя сейчас удерживается в эскроу. */
export function getEscrowHeld(user = null, orderId = null) {
  return getTransactions(user)
    .filter((t) => t.type === 'escrow_freeze' && (!orderId || t.orderId === orderId))
    .reduce((s, t) => s + remainingOf(t), 0);
}

/**
 * Разморозка эскроу и выплата исполнителю (по завершении этапа).
 * fromUser — плательщик (по умолчанию текущий пользователь), toUser — получатель ({email|name}).
 * Ищет транш по escrowTxId или orderId. amount не указан → выплачивается весь остаток.
 * Возвращает { ok, released, remaining, payoutTxId, error }.
 */
export function releaseEscrow({ amount, title = 'Выплата по этапу', fromUser = null, toUser = null, escrowTxId = null, orderId = null } = {}) {
  const txs = getTransactions(fromUser);
  const candidates = txs.filter((t) => t.type === 'escrow_freeze'
    && remainingOf(t) > 0
    && ((escrowTxId && t.id === escrowTxId) || (orderId && t.orderId === orderId)));
  const available = candidates.reduce((s, t) => s + remainingOf(t), 0);
  if (available <= 0) return { ok: false, error: 'no_escrow', released: 0, remaining: 0, payoutTxId: null };

  let toRelease = amount === undefined || amount === null ? available : toAmountKZT(amount);
  if (Number.isNaN(toRelease)) return { ok: false, error: 'invalid_amount', released: 0, remaining: available, payoutTxId: null };
  toRelease = Math.min(toRelease, available);

  let left = toRelease;
  for (const t of candidates) {
    if (left <= 0) break;
    const part = Math.min(left, remainingOf(t));
    t.releasedAmount = (Number(t.releasedAmount) || 0) + part;
    t.status = remainingOf(t) === 0 ? 'released' : 'partially_released';
    left -= part;
  }

  const payerKey = getUserKey(fromUser);
  const receiver = toUser && (toUser.email || toUser.login || toUser.name) ? toUser : null;
  const receiverKey = receiver ? userKeyOf(receiver) : null;
  const releaseNote = makeTx('escrow_release', `🔓 ${title}${receiver ? ` → ${receiver.name || receiverKey}` : ''}`, 0, 'completed', {
    releasedAmount: toRelease, orderId: orderId || null,
  });

  try {
    localStorage.setItem(txKey(fromUser), JSON.stringify([releaseNote, ...txs]));
    let payoutTxId = null;
    if (receiverKey && receiverKey !== payerKey) {
      const recvBalance = getBalanceKZT(receiver);
      const payout = makeTx('escrow_payout', `💸 ${title}`, toRelease, 'completed', { orderId: orderId || null });
      writeWallet(receiver, recvBalance + toRelease, [payout, ...getTransactions(receiver)]);
      payoutTxId = payout.id;
    }
    return { ok: true, released: toRelease, remaining: available - toRelease, payoutTxId };
  } catch (e) {
    console.error('WalletEngine release error:', e);
    return { ok: false, error: 'storage_error', released: 0, remaining: available, payoutTxId: null };
  }
}

export function convertCurrency(amountKZT, targetCurrency = 'USD') {
  const rate = EXCHANGE_RATES[targetCurrency.toUpperCase()] || 1;
  return amountKZT * rate;
}

export function getExchangeRates() {
  return EXCHANGE_RATES;
}
