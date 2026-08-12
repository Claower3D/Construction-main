// ContractGenerator v1.0 - Auto Construction Contract & KS-2/KS-3 Act Generator

export function generateContractDoc({ customerName, executorName, amountKZT, workType, city = 'Алматы' }) {
  const contractNum = `ДГ-${Math.floor(1000 + Math.random() * 9000)}/2026`;
  const dateStr = new Date().toLocaleDateString();

  return {
    contractNumber: contractNum,
    date: dateStr,
    title: `ДОГОВОР СТРОИТЕЛЬНОГО ПОДРЯДА № ${contractNum}`,
    customer: customerName || 'Заказчик',
    executor: executorName || 'Исполнитель',
    amountKZT,
    city,
    content: `
======================================================
   ДОГОВОР СТРОИТЕЛЬНОГО ПОДРЯДА № ${contractNum}
   г. ${city}                                 ${dateStr} г.
======================================================

1. ПРЕДМЕТ ДОГОВОРА
1.1. Подрядчик обязуется выполнить строительно-монтажные работы: ${workType},
     а Заказчик обязуется принять и оплатить работы на сумму ${amountKZT.toLocaleString()} ₸.

2. СРОКИ И ПОРЯДОК РАСЧЕТОВ
2.1. Оплата производится через безопасный Эскроу-кошелёк QazGost AI.
2.2. Расчёты и акты выполненных работ (Форма КС-2, КС-3) подписываются ЭЦП E-Gov.

3. ПОДПИСИ СТОРОН И ЭЦП:
Заказчик: ${customerName} [Подписано ЭЦП E-Gov ✅]
Подрядчик: ${executorName} [Подписано ЭЦП E-Gov ✅]
======================================================
`,
  };
}

export function generateActKS2(contractNum, items = []) {
  return {
    actNumber: `КС2-${Math.floor(100 + Math.random() * 900)}`,
    contractNumber: contractNum,
    date: new Date().toLocaleDateString(),
    title: 'Акт о приемке выполненных работ (Форма КС-2)',
    status: 'signed_egov',
  };
}
