// EngineerData v6.0 - Technical Supervision & Inspection Task Management

const ENGINEER_TASKS_KEY = 'qazgost_engineer_tasks_store';

const initialEngineerTasks = [
  { id: 'ENG-101', objectName: 'ЖК «Grand Almaty» (Блок Б)', taskType: 'Приёмка бетонирования перекрытия 4 этажа', date: '08.08.2026 14:00', inspector: 'Ерлан Сатов (Главный ИТН)', status: 'scheduled', urgency: 'high' },
  { id: 'ENG-102', objectName: 'Бизнес-центр «Esentai Tower 2»', taskType: 'Проверка армирования монолитных колонн', date: '09.08.2026 10:30', inspector: 'Арман Сериков (Инженер)', status: 'in_progress', urgency: 'normal' },
  { id: 'ENG-103', objectName: 'Школа на 1200 мест (Астана)', taskType: 'Акт освидетельствования скрытых работ (Гидроизоляция)', date: '10.08.2026 11:00', inspector: 'Бауыржан Токтаров', status: 'completed', urgency: 'normal' },
];

export function getEngineerTasks() {
  try {
    const saved = localStorage.getItem(ENGINEER_TASKS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('EngineerData getEngineerTasks error:', e);
  }
  return initialEngineerTasks;
}

export function saveEngineerTask(newTask) {
  const current = getEngineerTasks();
  const taskObj = {
    id: `ENG-${Math.floor(100 + Math.random() * 900)}`,
    status: 'scheduled',
    urgency: 'normal',
    ...newTask,
  };
  const updated = [taskObj, ...current];
  try {
    localStorage.setItem(ENGINEER_TASKS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('EngineerData saveEngineerTask error:', e);
  }
  return updated;
}

export function updateEngineerTaskStatus(id, newStatus) {
  const current = getEngineerTasks();
  const updated = current.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
  try {
    localStorage.setItem(ENGINEER_TASKS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('EngineerData updateEngineerTaskStatus error:', e);
  }
  return updated;
}
