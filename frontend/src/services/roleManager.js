// RoleManager v1.0 - Single Source of Truth for Platform Roles

const ROLE_STORAGE_KEY = 'qazgost_user_role';

export const ROLES = {
  CUSTOMER: { id: 'customer', title: 'Заказчик', icon: '📋', color: '#10b981' },
  EXECUTOR: { id: 'executor', title: 'Исполнитель', icon: '🔧', color: '#ddd6fe' },
  ENGINEER: { id: 'engineer', title: 'Инженер', icon: '👷', color: '#b9a4ff' },
  ADMIN: { id: 'admin', title: 'Администратор', icon: '👑', color: '#f59e0b' },
  MANAGER: { id: 'manager', title: 'Менеджер', icon: '💼', color: '#b9a4ff' },
};

export function getCurrentRole() {
  try {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    if (saved && ROLES[saved.toUpperCase()]) return saved;
  } catch (e) {
    console.error('RoleManager load error:', e);
  }
  return 'executor';
}

export function setCurrentRole(roleId) {
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, roleId);
    window.dispatchEvent(new CustomEvent('role_changed', { detail: { role: roleId } }));
  } catch (e) {
    console.error('RoleManager save error:', e);
  }
  return roleId;
}

export function getRoleMeta(roleId) {
  const key = (roleId || getCurrentRole()).toUpperCase();
  return ROLES[key] || ROLES.CUSTOMER;
}

export function getAllRoles() {
  return Object.values(ROLES);
}
