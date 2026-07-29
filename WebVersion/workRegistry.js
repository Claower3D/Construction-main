// ================================================================
// WORK REGISTRY — Единый справочник работ из AI_WRK_*
// Заменяет WBSCatalog. Агрегирует 12 754+ позиций из всех AI_WRK_*
// ================================================================
(function () {
    'use strict';

    // ════════════════════════════════════════════════════════════
    // UI-ГРУППЫ: 234 сырых category → ~20 понятных групп
    // ════════════════════════════════════════════════════════════
    const GROUP_MAP = {
        // 1. Земляные работы
        earthwork: 'earthworks', earthwork_full: 'earthworks', earthwork_ext2: 'earthworks',
        earth_ext: 'earthworks', geodetic: 'earthworks', geotech: 'earthworks',

        // 2. Фундамент
        foundation: 'foundation', foundation_full: 'foundation', foundation_ext: 'foundation',
        piling_full: 'foundation',

        // 3. Бетонные / монолитные
        concrete: 'concrete', concrete_full: 'concrete', concrete_ext: 'concrete',
        concrete_ext2: 'concrete', monolith_full: 'concrete', formwork: 'concrete',
        rebar: 'concrete', reinforce: 'concrete', precast: 'concrete',
        precast_full: 'concrete', jbi: 'concrete',

        // 4. Кладка
        masonry: 'masonry', masonry_full: 'masonry', masonry_ext: 'masonry',
        masonry_full2: 'masonry',

        // 5. Металлоконструкции
        metalwork: 'metalwork', metalwork_full: 'metalwork', metalwork2: 'metalwork',
        metalwork_full2: 'metalwork', steelworks: 'metalwork', craneworks: 'metalwork',

        // 6. Кровля
        roofing: 'roofing', roofing_full: 'roofing', roofing_ext: 'roofing',
        roofing_full2: 'roofing', roof_ext: 'roofing', rooffull: 'roofing',

        // 7. Фасад
        facade: 'facade', facade_full: 'facade', facade_full2: 'facade',
        facade_ext: 'facade', facade_ext2: 'facade', facadesys: 'facade',

        // 8. Окна, двери, проёмы
        windows: 'openings', windows_ext: 'openings', doors: 'openings',
        doors_ext: 'openings', doors_windows_full: 'openings', openings_full: 'openings',
        openings_ext2: 'openings', glass: 'openings', glass2: 'openings',
        auto_door: 'openings', gates_fence: 'openings',

        // 9. Штукатурка, покраска, ГКЛ, декор
        plaster: 'finishing_walls', plaster_ext: 'finishing_walls',
        plaster_paint_full: 'finishing_walls', plastering_full: 'finishing_walls',
        painting: 'finishing_walls', painting_full: 'finishing_walls', paint_ext: 'finishing_walls',
        drywall: 'finishing_walls', drywall_full: 'finishing_walls', drywall_ext2: 'finishing_walls',
        gkl_full: 'finishing_walls', gkl_ext: 'finishing_walls',
        decorative: 'finishing_walls', decorative_ext: 'finishing_walls',
        decorelem: 'finishing_walls', interior_decor: 'finishing_walls',
        textiles: 'finishing_walls',

        // 10. Полы
        flooring: 'flooring', flooring_full: 'flooring', flooring_ext: 'flooring',
        tiling: 'flooring', tiling_full: 'flooring', tiling_floor: 'flooring',
        tile_ext: 'flooring', screed_leveling: 'flooring',
        ind_floors: 'flooring', indfloor: 'flooring', indfloors: 'flooring',

        // 11. Потолки
        ceiling: 'ceiling', ceiling_ext: 'ceiling',

        // 12. Электрика
        electrical: 'electrical', electrical_full: 'electrical', electrical_full2: 'electrical',
        electrical_ext2: 'electrical', electric_ext: 'electrical',
        power_supply: 'electrical', powerlines: 'electrical',
        low_voltage: 'electrical', low_voltage_full: 'electrical',
        lowvoltage: 'electrical', lowcurrent_full: 'electrical',

        // 13. Сантехника и водоснабжение
        plumbing: 'plumbing', plumbing_full: 'plumbing', plumbing_full2: 'plumbing',
        plumbing_ext: 'plumbing', waterproof: 'plumbing', waterproofing: 'plumbing',
        waterproofing_full: 'plumbing', hydro: 'plumbing',
        water_treatment: 'plumbing', watertreat: 'plumbing', water_ext2: 'plumbing',
        sanitary: 'plumbing',

        // 14. Отопление
        heating: 'heating', heating_full: 'heating', heat_ext: 'heating',
        heatfloor: 'heating', fireplaces: 'heating',

        // 15. Вентиляция и кондиционирование
        hvac: 'hvac', hvac_full: 'hvac', hvac_ext2: 'hvac',
        ventilation_full: 'hvac', vent_ext: 'hvac', cooling: 'hvac',
        climate: 'hvac', refrigeration: 'hvac', indvent: 'hvac', ac_ext: 'hvac',

        // 16. Газоснабжение
        gas: 'gas', gas_full: 'gas', gassupply: 'gas',

        // 17. Слаботочные / автоматизация
        bms: 'automation', bms2: 'automation', smart_home: 'automation',
        smarthome: 'automation', security: 'automation', cctv: 'automation',
        telecom: 'automation', telecom2: 'automation', telecom3: 'automation',
        automation: 'automation', datacenter: 'automation',
        low_voltage_full: 'automation',

        // 18. Пожарная безопасность
        fire: 'fire_safety', fire_safety: 'fire_safety', fire_safety_full: 'fire_safety',
        firesafety: 'fire_safety', firesuppress: 'fire_safety',

        // 19. Наружные сети
        ext_networks: 'ext_networks', extnet_full: 'ext_networks',
        ext_utilities: 'ext_networks', networks: 'ext_networks',

        // 20. Благоустройство
        landscape: 'landscape', landscape_full: 'landscape', landscape_full2: 'landscape',
        greenery: 'landscape', irrigation: 'landscape', fences: 'landscape',
        fence: 'landscape', outdoorlight: 'landscape', parking: 'landscape',

        // 21. Дороги и мосты
        road: 'roads', road_full: 'roads', roads: 'roads', roads2: 'roads',
        bridges: 'roads', tunnels: 'roads', railway: 'roads',

        // 22. Демонтаж
        demolition: 'demolition', demolition_full: 'demolition', demolition_ext2: 'demolition',
        cleaning: 'demolition',

        // 23. Утепление и изоляция
        insulation: 'insulation', insulation_full: 'insulation', insulation_full2: 'insulation',
        acoustics: 'insulation',

        // 24. Деревянное строительство
        woodwork: 'woodwork', woodworks: 'woodwork', woodhouse: 'woodwork',
        wood_construction: 'woodwork',

        // 25. Лестницы и балконы
        stairs: 'stairs', stairs2: 'stairs', balcony: 'stairs',

        // 26. Мебель и оборудование
        furniture: 'equipment', furniture2: 'equipment', appliances: 'equipment',
        kitchen: 'equipment', techequip: 'equipment', industrialequip: 'equipment',
        elevators: 'equipment', elevators2: 'equipment', elevators_full: 'equipment',

        // 27. Специальные работы
        pool: 'special', pools: 'special', sauna: 'special', sports: 'special',
        sports2: 'special', special: 'special', special_rooms: 'special',
        special_ext2: 'special', specworks: 'special', commercial: 'special',
        commercial_ext2: 'special', commercial_interiors: 'special',
        medical: 'special', cleanroom: 'special', warehouse: 'special',
        modular: 'special', modular2: 'special', industrial: 'special',
        industrial2: 'special', industrial_spec: 'special', industrial_ext2: 'special',
        oilgas: 'special', waterfront: 'special', underground: 'special',
        turnkey: 'special', emergency: 'special', restoration: 'special',
        restoration2: 'special', reconstruction: 'special', reconstruction2: 'special',

        // 28. Проектирование
        design: 'design', design_ext: 'design', design_services: 'design',

        // Прочие
        prep: 'other', misc_ext: 'other', temp: 'other', access: 'other',
        engineering: 'other', maintenance: 'other', mechanization: 'other',
        protection: 'other', energy: 'other', energy_ext: 'other',
        renewable_energy: 'other', finishing_full: 'other', finishing_ext: 'other',
        amenities_full: 'other', piping_full: 'other', indpipes: 'other',
    };

    // ════════════════════════════════════════════════════════════
    // МЕТА-ДАННЫЕ для UI-групп
    // ════════════════════════════════════════════════════════════
    const CATEGORY_META = {
        earthworks: { icon: '⛏️', label: 'Земляные работы', color: '#854d0e', order: 1 },
        foundation: { icon: '🏗️', label: 'Фундамент', color: '#78716c', order: 2 },
        concrete: { icon: '🧱', label: 'Бетон и монолит', color: '#64748b', order: 3 },
        masonry: { icon: '🧱', label: 'Кладка', color: '#b45309', order: 4 },
        metalwork: { icon: '🔩', label: 'Металлоконструкции', color: '#ef4444', order: 5 },
        roofing: { icon: '🏠', label: 'Кровля', color: '#dc2626', order: 6 },
        facade: { icon: '🏢', label: 'Фасад', color: '#0891b2', order: 7 },
        openings: { icon: '🚪', label: 'Окна и двери', color: '#0284c7', order: 8 },
        insulation: { icon: '🧤', label: 'Утепление и изоляция', color: '#d97706', order: 9 },
        demolition: { icon: '💥', label: 'Демонтаж', color: '#9f1239', order: 10 },
        finishing_walls: { icon: '🎨', label: 'Отделка стен', color: '#c026d3', order: 11 },
        flooring: { icon: '🟫', label: 'Полы и плитка', color: '#a16207', order: 12 },
        ceiling: { icon: '💡', label: 'Потолки', color: '#7c3aed', order: 13 },
        stairs: { icon: '🪜', label: 'Лестницы и балконы', color: '#6d28d9', order: 14 },
        electrical: { icon: '⚡', label: 'Электрика', color: '#f59e0b', order: 15 },
        plumbing: { icon: '🚿', label: 'Сантехника и водоснабжение', color: '#3b82f6', order: 16 },
        heating: { icon: '🔥', label: 'Отопление', color: '#ea580c', order: 17 },
        hvac: { icon: '❄️', label: 'Вентиляция и кондиц.', color: '#06b6d4', order: 18 },
        gas: { icon: '🔵', label: 'Газоснабжение', color: '#2563eb', order: 19 },
        automation: { icon: '📡', label: 'Автоматизация и слабот.', color: '#8b5cf6', order: 20 },
        fire_safety: { icon: '🧯', label: 'Пожарная безопасность', color: '#b91c1c', order: 21 },
        ext_networks: { icon: '🔌', label: 'Наружные сети', color: '#4f46e5', order: 22 },
        landscape: { icon: '🌳', label: 'Благоустройство', color: '#16a34a', order: 23 },
        roads: { icon: '🛣️', label: 'Дороги и мосты', color: '#57534e', order: 24 },
        woodwork: { icon: '🪵', label: 'Деревянные конструкции', color: '#92400e', order: 25 },
        equipment: { icon: '🛗', label: 'Мебель и оборудование', color: '#0d9488', order: 26 },
        design: { icon: '📐', label: 'Проектирование', color: '#6366f1', order: 27 },
        special: { icon: '🏭', label: 'Специальные работы', color: '#ec4899', order: 28 },
        other: { icon: '📦', label: 'Прочие работы', color: '#71717a', order: 29 },
    };

    // ════════════════════════════════════════════════════════════
    // СКАНИРОВАНИЕ window.AI_WRK_* → works[]
    // ════════════════════════════════════════════════════════════
    let _cache = null;

    function scan() {
        if (_cache) return _cache;

        const works = [];
        const prefixes = ['AI_WRK_', 'AI_WORK_'];
        let scanned = 0;

        for (const key of Object.keys(window)) {
            if (!prefixes.some(p => key.startsWith(p))) continue;
            const catalog = window[key];
            if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) continue;

            for (const [id, item] of Object.entries(catalog)) {
                if (!item || typeof item !== 'object' || !item.name) continue;
                scanned++;
                const rawCat = (item.category || '').toLowerCase().trim();
                const group = GROUP_MAP[rawCat] || 'other';

                works.push({
                    id: id,
                    name: item.name,
                    unit: item.unit || null,
                    price: item.price || 0,
                    rawCategory: rawCat,
                    group: group,
                    labor: item.labor || null,
                    source: key,
                });
            }
        }

        _cache = works;
        return works;
    }

    function invalidateCache() {
        _cache = null;
    }

    // ════════════════════════════════════════════════════════════
    // PUBLIC API (совместим с WBSCatalog)
    // ════════════════════════════════════════════════════════════

    function getCategories() {
        const works = scan();
        const counts = {};
        for (const w of works) {
            counts[w.group] = (counts[w.group] || 0) + 1;
        }

        return Object.entries(CATEGORY_META)
            .filter(([key]) => (counts[key] || 0) > 0)
            .map(([key, meta]) => ({
                name: meta.label,
                key: key,
                icon: meta.icon,
                color: meta.color,
                order: meta.order,
                workCount: counts[key] || 0,
                sectionCount: 0, // не используется
            }))
            .sort((a, b) => a.order - b.order);
    }

    function getWorksByGroup(groupKey) {
        return scan().filter(w => w.group === groupKey);
    }

    function getAllWorksForCategory(categoryLabel) {
        const entry = Object.entries(CATEGORY_META).find(([, m]) => m.label === categoryLabel);
        if (!entry) return [];
        return getWorksByGroup(entry[0]);
    }

    function search(query) {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();
        return scan().filter(w => w.name.toLowerCase().includes(q)).slice(0, 100);
    }

    function getCategoryKeyByLabel(label) {
        const entry = Object.entries(CATEGORY_META).find(([, m]) => m.label === label);
        return entry ? entry[0] : null;
    }

    function getStats() {
        const works = scan();
        const groups = new Set(works.map(w => w.group));
        return {
            categories: groups.size,
            works: works.length,
            sections: 0,
        };
    }

    // ════════════════════════════════════════════════════════════
    // EXPORT (совместимость с window.WBSCatalog)
    // ════════════════════════════════════════════════════════════

    const WorkRegistry = {
        getCategories,
        getWorksByGroup,
        getAllWorksForCategory,
        search,
        getStats,
        getCategoryKeyByLabel,
        invalidateCache,
        CATEGORY_META,
        GROUP_MAP,
    };

    window.WorkRegistry = WorkRegistry;

    // Обратная совместимость — чтобы старый код не ломался
    window.WBSCatalog = {
        getCategories,
        getSections: () => [],
        getWorks: () => [],
        getAllWorksForCategory,
        search,
        getStats,
        setPrice: () => { },
        removePrice: () => { },
        CATEGORY_META: (function () {
            // Маппинг label → meta для обратной совместимости
            const m = {};
            for (const [, meta] of Object.entries(CATEGORY_META)) {
                m[meta.label] = { icon: meta.icon, color: meta.color };
            }
            return m;
        })(),
    };

    // Отложенная инициализация — AI_WRK_* загружаются позже
    function init() {
        const stats = getStats();
        console.log(`✅ [WorkRegistry] ${stats.categories} категорий, ${stats.works} работ (из AI_WRK_*)`);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
    } else {
        setTimeout(init, 200);
    }
})();
