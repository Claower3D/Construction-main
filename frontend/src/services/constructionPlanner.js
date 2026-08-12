// ConstructionPlanner v1.0 - Timeline & Stage Milestone Planner

export function calculateConstructionTimeline(areaSqM = 100, workType = 'ремонт') {
  const baseDays = Math.max(7, Math.round(areaSqM * 0.75));

  return {
    totalDays: baseDays,
    stages: [
      { stage: 1, name: 'Геодезия, демонтаж и подготовительные работы', days: Math.round(baseDays * 0.15), dependencies: [] },
      { stage: 2, name: 'Монтаж инженерных сетей (электрика, ХВС/ГВС, HVAC)', days: Math.round(baseDays * 0.30), dependencies: [1] },
      { stage: 3, name: 'Черновая отделка (штукатурка стен, стяжка пола)', days: Math.round(baseDays * 0.30), dependencies: [2] },
      { stage: 4, name: 'Чистовая отделка и финишная установка приборов', days: Math.round(baseDays * 0.25), dependencies: [3] },
    ],
  };
}
