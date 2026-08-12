// Global Audit Log Store for Admin Actions

const AUDIT_STORAGE_KEY = 'qazgost_admin_audit_logs';

const initialLogs = [
  {
    id: 'LOG-1001',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    formattedTime: new Date(Date.now() - 5 * 60000).toLocaleTimeString(),
    actionType: 'update',
    user: 'Администратор (Система)',
    details: 'Обновлен региональный коэффициент для Атырау (×1.25)',
    module: 'Регионы',
  },
  {
    id: 'LOG-1002',
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
    formattedTime: new Date(Date.now() - 18 * 60000).toLocaleTimeString(),
    actionType: 'approve',
    user: 'Модератор Айнур',
    details: 'Одобрена заявка на верификацию ИП «СтройМастер» (ИИН 880412300451)',
    module: 'Модерация',
  },
  {
    id: 'LOG-1003',
    timestamp: new Date(Date.now() - 42 * 60000).toISOString(),
    formattedTime: new Date(Date.now() - 42 * 60000).toLocaleTimeString(),
    actionType: 'create',
    user: 'Администратор (Система)',
    details: 'Добавлена новая позиция расценки: E15-01-008 «Выравнивание стен бетоноконтактом»',
    module: 'Прайсы',
  },
  {
    id: 'LOG-1004',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    formattedTime: new Date(Date.now() - 120 * 60000).toLocaleTimeString(),
    actionType: 'update',
    user: 'Администратор',
    details: 'Изменена роль пользователя Бауыржан Токтаров (executor ➔ engineer)',
    module: 'Пользователи',
  },
];

export function getAuditLogs() {
  try {
    const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load audit logs:', e);
  }
  return initialLogs;
}

export function logAuditAction(actionType, details, module = 'Система', user = 'Администратор') {
  const current = getAuditLogs();
  const newLog = {
    id: `LOG-${Date.now().toString().slice(-5)}`,
    timestamp: new Date().toISOString(),
    formattedTime: new Date().toLocaleTimeString(),
    actionType, // 'create' | 'update' | 'delete' | 'approve' | 'reject'
    user,
    details,
    module,
  };
  const updated = [newLog, ...current];
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save audit log:', e);
  }
  return updated;
}

export function exportAuditLogTxt() {
  const logs = getAuditLogs();
  const dateStr = new Date().toISOString().split('T')[0];
  let content = `=======================================================\n`;
  content += `   QAZGOST AI 2.0 - ЖУРНАЛ АУДИТА ДЕЙСТВИЙ АДМИНИСТРАЦИИ\n`;
  content += `   Дата экспорта: ${new Date().toLocaleString()}\n`;
  content += `=======================================================\n\n`;

  logs.forEach((log, idx) => {
    content += `[${idx + 1}] ID: ${log.id} | Время: ${log.formattedTime} | Модуль: ${log.module}\n`;
    content += `    Тип: ${log.actionType.toUpperCase()} | Исполнитель: ${log.user}\n`;
    content += `    Детали: ${log.details}\n`;
    content += `-------------------------------------------------------\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `admin_audit_${dateStr}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
