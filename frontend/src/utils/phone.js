// Телефон Казахстана: в поле — 10 цифр номера, «+7» стоит слева постоянно.
// Вставка полного номера (+7 701…, 8 701…) распознаётся: лишняя первая цифра отбрасывается.
export function localPhoneDigits(raw, prevDigits = '') {
  let d = String(raw || '').replace(/\D/g, '');
  const prev = String(prevDigits || '');
  // 11+ цифр с 7/8 в начале — это полный номер, если его вставили или заменили им поле целиком
  // (а не дописали лишнюю цифру в конец уже набранного номера)
  const looksFull = d.length >= 11 && (d[0] === '7' || d[0] === '8');
  const replaced = !prev || d.length - prev.length > 1 || !d.startsWith(prev);
  if (looksFull && replaced) d = d.slice(1);
  return d.slice(0, 10);
}

// «7015554433» → «(701) 555-44-33»; скобка и дефисы появляются только когда за ними есть цифры,
// чтобы стирание не «застревало» на разделителях
export function formatLocalPhone(d) {
  if (!d) return '';
  if (d.length <= 3) return '(' + d;
  let out = '(' + d.slice(0, 3) + ') ' + d.slice(3, 6);
  if (d.length > 6) out += '-' + d.slice(6, 8);
  if (d.length > 8) out += '-' + d.slice(8, 10);
  return out;
}

export const isFullKzPhone = (digits) => String(digits || '').length === 10;
export const normalizedPhone = (digits) => (isFullKzPhone(digits) ? '+7' + digits : '');
