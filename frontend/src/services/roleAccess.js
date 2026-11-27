// Роли, которые сайт показывает как другую роль.
// engineer_nocrm — инженер без доступа к CRM: кабинет инженера, но без сделок CRM и календаря команды.
// Чужие сделки ему не отдаёт сервер (go-backend/pkg/handlers/crm_access.go); здесь — только интерфейс.

export const ROLE_ENGINEER_NO_CRM = 'engineer_nocrm';

/** Пользователь для интерфейса: роль, по которой открываются кабинет и меню, и доступ к CRM. */
export function toUiUser(user) {
  if (!user || typeof user !== 'object') return user;
  const accessRole = user.accessRole || user.role;
  if (accessRole === ROLE_ENGINEER_NO_CRM) return { ...user, role: 'engineer', accessRole, crmAccess: false };
  return user;
}

/** Видит ли пользователь CRM (сделки, календарь команды). */
export function canSeeCrm(user) {
  return !!user && user.crmAccess !== false;
}
