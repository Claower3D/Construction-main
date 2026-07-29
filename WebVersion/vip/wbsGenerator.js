// ========== WBS GENERATOR v1.0 ==========
// Генератор структуры работ для строительных проектов

(function () {
    'use strict';

    const { WBSNode, WBSNodeStatus, VipAuditLog } = window.VipModels || {};

    // Safe audit log helper - prevents errors if VipAuditLog is not available
    function safeAuditLog(entity, id, action, meta = {}) {
        if (VipAuditLog && typeof VipAuditLog.log === 'function') {
            VipAuditLog.log(entity, id, action, meta);
        } else {
            console.log(`[AUDIT] ${entity}:${id} - ${action}`, meta);
        }
    }

    // ===== WBS-20 CATALOG (20 основных этапов) =====
    const WBS_CATALOG_20 = [
        { code: '0.0', title: 'Подготовительные работы', tags: ['prep'], unit: 'комплект' },
        { code: '1.0', title: 'Земляные работы', tags: ['earthwork'], unit: 'м³' },
        { code: '2.0', title: 'Фундамент', tags: ['foundation'], unit: 'м³' },
        { code: '3.0', title: 'Каркас / Несущие конструкции', tags: ['structure'], unit: 'м²' },
        { code: '4.0', title: 'Кровля', tags: ['roofing'], unit: 'м²' },
        { code: '5.0', title: 'Наружные стены', tags: ['walls', 'exterior'], unit: 'м²' },
        { code: '6.0', title: 'Окна и двери', tags: ['openings'], unit: 'шт' },
        { code: '7.0', title: 'Внутренние перегородки', tags: ['walls', 'interior'], unit: 'м²' },
        { code: '8.0', title: 'Электрика', tags: ['electrical'], unit: 'точка' },
        { code: '9.0', title: 'Водоснабжение', tags: ['plumbing'], unit: 'точка' },
        { code: '10.0', title: 'Канализация', tags: ['plumbing', 'sewage'], unit: 'точка' },
        { code: '11.0', title: 'Отопление', tags: ['hvac', 'heating'], unit: 'м.п.' },
        { code: '12.0', title: 'Вентиляция и кондиционирование', tags: ['hvac'], unit: 'м²' },
        { code: '13.0', title: 'Черновая отделка', tags: ['finish', 'rough'], unit: 'м²' },
        { code: '14.0', title: 'Чистовая отделка', tags: ['finish', 'final'], unit: 'м²' },
        { code: '15.0', title: 'Полы', tags: ['flooring'], unit: 'м²' },
        { code: '16.0', title: 'Потолки', tags: ['ceiling'], unit: 'м²' },
        { code: '17.0', title: 'Сантехника (приборы)', tags: ['plumbing', 'fixtures'], unit: 'шт' },
        { code: '18.0', title: 'Слаботочные системы', tags: ['low_voltage'], unit: 'точка' },
        { code: '19.0', title: 'Благоустройство', tags: ['landscaping'], unit: 'м²' },
        { code: '20.0', title: 'Ввод в эксплуатацию', tags: ['commissioning'], unit: 'комплект' }
    ];

    // ===== WBS-120 CATALOG (детализация операций) =====
    const WBS_CATALOG_120 = {
        '0.0': [
            { code: '0.1', title: 'Ограждение территории', tags: ['prep'], unit: 'м.п.' },
            { code: '0.2', title: 'Временные сооружения', tags: ['prep'], unit: 'шт' },
            { code: '0.3', title: 'Геодезическая разбивка', tags: ['prep'], unit: 'комплект' },
            { code: '0.4', title: 'Подготовка площадки', tags: ['prep'], unit: 'м²' }
        ],
        '1.0': [
            { code: '1.1', title: 'Планировка территории', tags: ['earthwork'], unit: 'м²' },
            { code: '1.2', title: 'Разработка котлована', tags: ['earthwork'], unit: 'м³' },
            { code: '1.3', title: 'Устройство траншей', tags: ['earthwork'], unit: 'м³' },
            { code: '1.4', title: 'Обратная засыпка', tags: ['earthwork'], unit: 'м³' },
            { code: '1.5', title: 'Вывоз грунта', tags: ['earthwork'], unit: 'м³' }
        ],
        '2.0': [
            { code: '2.1', title: 'Подготовка основания', tags: ['foundation'], unit: 'м²' },
            { code: '2.2', title: 'Песчаная подушка', tags: ['foundation'], unit: 'м³' },
            { code: '2.3', title: 'Опалубочные работы', tags: ['foundation'], unit: 'м²' },
            { code: '2.4', title: 'Армирование', tags: ['foundation'], unit: 'т' },
            { code: '2.5', title: 'Бетонирование', tags: ['foundation'], unit: 'м³' },
            { code: '2.6', title: 'Гидроизоляция', tags: ['foundation'], unit: 'м²' },
            { code: '2.7', title: 'Утепление цоколя', tags: ['foundation'], unit: 'м²' }
        ],
        '3.0': [
            { code: '3.1', title: 'Монтаж колонн', tags: ['structure'], unit: 'шт' },
            { code: '3.2', title: 'Монтаж балок', tags: ['structure'], unit: 'шт' },
            { code: '3.3', title: 'Устройство перекрытий', tags: ['structure'], unit: 'м²' },
            { code: '3.4', title: 'Монтаж лестниц', tags: ['structure'], unit: 'шт' },
            { code: '3.5', title: 'Закладные детали', tags: ['structure'], unit: 'шт' }
        ],
        '4.0': [
            { code: '4.1', title: 'Стропильная система', tags: ['roofing'], unit: 'м²' },
            { code: '4.2', title: 'Пароизоляция', tags: ['roofing'], unit: 'м²' },
            { code: '4.3', title: 'Утепление кровли', tags: ['roofing'], unit: 'м²' },
            { code: '4.4', title: 'Гидроизоляция кровли', tags: ['roofing'], unit: 'м²' },
            { code: '4.5', title: 'Кровельное покрытие', tags: ['roofing'], unit: 'м²' },
            { code: '4.6', title: 'Водосточная система', tags: ['roofing'], unit: 'м.п.' }
        ],
        '5.0': [
            { code: '5.1', title: 'Кладка стен', tags: ['walls', 'exterior'], unit: 'м³' },
            { code: '5.2', title: 'Утепление фасада', tags: ['walls', 'exterior'], unit: 'м²' },
            { code: '5.3', title: 'Облицовка фасада', tags: ['walls', 'exterior'], unit: 'м²' },
            { code: '5.4', title: 'Декоративные элементы', tags: ['walls', 'exterior'], unit: 'шт' }
        ],
        '6.0': [
            { code: '6.1', title: 'Установка окон', tags: ['openings'], unit: 'шт' },
            { code: '6.2', title: 'Установка дверей', tags: ['openings'], unit: 'шт' },
            { code: '6.3', title: 'Монтаж откосов', tags: ['openings'], unit: 'м.п.' },
            { code: '6.4', title: 'Монтаж подоконников', tags: ['openings'], unit: 'шт' }
        ],
        '7.0': [
            { code: '7.1', title: 'Кирпичные перегородки', tags: ['walls', 'interior'], unit: 'м²' },
            { code: '7.2', title: 'ГКЛ перегородки', tags: ['walls', 'interior'], unit: 'м²' },
            { code: '7.3', title: 'Звукоизоляция', tags: ['walls', 'interior'], unit: 'м²' }
        ],
        '8.0': [
            { code: '8.1', title: 'Прокладка кабельных трасс', tags: ['electrical'], unit: 'м.п.' },
            { code: '8.2', title: 'Монтаж щитов', tags: ['electrical'], unit: 'шт' },
            { code: '8.3', title: 'Установка розеток', tags: ['electrical'], unit: 'шт' },
            { code: '8.4', title: 'Установка выключателей', tags: ['electrical'], unit: 'шт' },
            { code: '8.5', title: 'Монтаж светильников', tags: ['electrical'], unit: 'шт' },
            { code: '8.6', title: 'Заземление', tags: ['electrical'], unit: 'комплект' }
        ],
        '9.0': [
            { code: '9.1', title: 'Монтаж стояков', tags: ['plumbing'], unit: 'м.п.' },
            { code: '9.2', title: 'Разводка труб ХВС', tags: ['plumbing'], unit: 'м.п.' },
            { code: '9.3', title: 'Разводка труб ГВС', tags: ['plumbing'], unit: 'м.п.' },
            { code: '9.4', title: 'Установка запорной арматуры', tags: ['plumbing'], unit: 'шт' }
        ],
        '10.0': [
            { code: '10.1', title: 'Монтаж стояков', tags: ['plumbing', 'sewage'], unit: 'м.п.' },
            { code: '10.2', title: 'Горизонтальная разводка', tags: ['plumbing', 'sewage'], unit: 'м.п.' },
            { code: '10.3', title: 'Выпуски', tags: ['plumbing', 'sewage'], unit: 'шт' }
        ],
        '11.0': [
            { code: '11.1', title: 'Монтаж котельной', tags: ['hvac', 'heating'], unit: 'комплект' },
            { code: '11.2', title: 'Разводка труб отопления', tags: ['hvac', 'heating'], unit: 'м.п.' },
            { code: '11.3', title: 'Установка радиаторов', tags: ['hvac', 'heating'], unit: 'шт' },
            { code: '11.4', title: 'Тёплые полы', tags: ['hvac', 'heating'], unit: 'м²' }
        ],
        '12.0': [
            { code: '12.1', title: 'Монтаж воздуховодов', tags: ['hvac'], unit: 'м²' },
            { code: '12.2', title: 'Установка вентиляторов', tags: ['hvac'], unit: 'шт' },
            { code: '12.3', title: 'Монтаж кондиционеров', tags: ['hvac'], unit: 'шт' },
            { code: '12.4', title: 'Диффузоры и решётки', tags: ['hvac'], unit: 'шт' }
        ],
        '13.0': [
            { code: '13.1', title: 'Штукатурка стен', tags: ['finish', 'rough'], unit: 'м²' },
            { code: '13.2', title: 'Стяжка пола', tags: ['finish', 'rough'], unit: 'м²' },
            { code: '13.3', title: 'Шпаклёвка', tags: ['finish', 'rough'], unit: 'м²' },
            { code: '13.4', title: 'Грунтовка', tags: ['finish', 'rough'], unit: 'м²' }
        ],
        '14.0': [
            { code: '14.1', title: 'Покраска стен', tags: ['finish', 'final'], unit: 'м²' },
            { code: '14.2', title: 'Обои', tags: ['finish', 'final'], unit: 'м²' },
            { code: '14.3', title: 'Декоративная штукатурка', tags: ['finish', 'final'], unit: 'м²' },
            { code: '14.4', title: 'Плитка', tags: ['finish', 'final'], unit: 'м²' }
        ],
        '15.0': [
            { code: '15.1', title: 'Ламинат', tags: ['flooring'], unit: 'м²' },
            { code: '15.2', title: 'Паркет', tags: ['flooring'], unit: 'м²' },
            { code: '15.3', title: 'Керамогранит', tags: ['flooring'], unit: 'м²' },
            { code: '15.4', title: 'Линолеум', tags: ['flooring'], unit: 'м²' },
            { code: '15.5', title: 'Плинтус', tags: ['flooring'], unit: 'м.п.' }
        ],
        '16.0': [
            { code: '16.1', title: 'Натяжной потолок', tags: ['ceiling'], unit: 'м²' },
            { code: '16.2', title: 'ГКЛ потолок', tags: ['ceiling'], unit: 'м²' },
            { code: '16.3', title: 'Покраска потолка', tags: ['ceiling'], unit: 'м²' }
        ],
        '17.0': [
            { code: '17.1', title: 'Установка ванн', tags: ['plumbing', 'fixtures'], unit: 'шт' },
            { code: '17.2', title: 'Установка душевых', tags: ['plumbing', 'fixtures'], unit: 'шт' },
            { code: '17.3', title: 'Установка унитазов', tags: ['plumbing', 'fixtures'], unit: 'шт' },
            { code: '17.4', title: 'Установка раковин', tags: ['plumbing', 'fixtures'], unit: 'шт' },
            { code: '17.5', title: 'Установка смесителей', tags: ['plumbing', 'fixtures'], unit: 'шт' }
        ],
        '18.0': [
            { code: '18.1', title: 'СКС (структурированные сети)', tags: ['low_voltage'], unit: 'точка' },
            { code: '18.2', title: 'Видеонаблюдение', tags: ['low_voltage'], unit: 'шт' },
            { code: '18.3', title: 'Охранная сигнализация', tags: ['low_voltage'], unit: 'шт' },
            { code: '18.4', title: 'Домофон', tags: ['low_voltage'], unit: 'шт' }
        ],
        '19.0': [
            { code: '19.1', title: 'Отмостка', tags: ['landscaping'], unit: 'м²' },
            { code: '19.2', title: 'Дорожки', tags: ['landscaping'], unit: 'м²' },
            { code: '19.3', title: 'Озеленение', tags: ['landscaping'], unit: 'м²' },
            { code: '19.4', title: 'Ограждение', tags: ['landscaping'], unit: 'м.п.' }
        ],
        '20.0': [
            { code: '20.1', title: 'Пусконаладка инженерных систем', tags: ['commissioning'], unit: 'комплект' },
            { code: '20.2', title: 'Оформление документации', tags: ['commissioning'], unit: 'комплект' },
            { code: '20.3', title: 'Сдача объекта', tags: ['commissioning'], unit: 'комплект' }
        ]
    };

    // ===== GENERATOR FUNCTIONS =====

    /**
     * Generate WBS-20 (20 main stages)
     */
    function generateWBS20(projectId) {
        if (!WBSNode) {
            console.error('WBSNode model not loaded');
            return [];
        }

        // Clear existing WBS
        WBSNode.deleteByProject(projectId);

        const nodes = [];
        WBS_CATALOG_20.forEach((item, idx) => {
            const node = new WBSNode({
                projectId,
                parentId: null,
                code: item.code,
                title: item.title,
                level: 0,
                order: idx,
                unit: item.unit,
                tags: item.tags,
                status: WBSNodeStatus.NEW
            });
            node.save();
            nodes.push(node);
        });

        safeAuditLog('PROJECT', projectId, 'wbs_generated', { type: 'WBS20', count: nodes.length });
        console.log(`✅ WBS-20 generated: ${nodes.length} nodes`);
        return nodes;
    }

    /**
     * Generate WBS-120 (20 stages + operations)
     */
    function generateWBS120(projectId) {
        if (!WBSNode) {
            console.error('WBSNode model not loaded');
            return [];
        }

        // Clear existing WBS
        WBSNode.deleteByProject(projectId);

        const nodes = [];
        let globalOrder = 0;

        WBS_CATALOG_20.forEach((stage, stageIdx) => {
            // Create parent stage
            const parentNode = new WBSNode({
                projectId,
                parentId: null,
                code: stage.code,
                title: stage.title,
                level: 0,
                order: globalOrder++,
                unit: stage.unit,
                tags: stage.tags,
                status: WBSNodeStatus.NEW
            });
            parentNode.save();
            nodes.push(parentNode);

            // Create child operations
            const operations = WBS_CATALOG_120[stage.code] || [];
            operations.forEach((op, opIdx) => {
                const childNode = new WBSNode({
                    projectId,
                    parentId: parentNode.id,
                    code: op.code,
                    title: op.title,
                    level: 1,
                    order: globalOrder++,
                    unit: op.unit,
                    tags: op.tags,
                    status: WBSNodeStatus.NEW
                });
                childNode.save();
                nodes.push(childNode);
            });
        });

        safeAuditLog('PROJECT', projectId, 'wbs_generated', { type: 'WBS120', count: nodes.length });
        console.log(`✅ WBS-120 generated: ${nodes.length} nodes`);
        return nodes;
    }

    /**
     * Generate WBS-1000 (cloned by sections and floors)
     */
    function generateWBS1000(projectId, sectionsCount = 1, floorsCount = 1) {
        if (!WBSNode) {
            console.error('WBSNode model not loaded');
            return [];
        }

        // Clear existing WBS
        WBSNode.deleteByProject(projectId);

        const nodes = [];
        let globalOrder = 0;

        for (let section = 1; section <= sectionsCount; section++) {
            // Section root node
            const sectionNode = new WBSNode({
                projectId,
                parentId: null,
                code: `С${section}`,
                title: `Секция ${section}`,
                level: 0,
                order: globalOrder++,
                unit: 'секция',
                tags: ['section'],
                sectionIndex: section,
                status: WBSNodeStatus.NEW
            });
            sectionNode.save();
            nodes.push(sectionNode);

            for (let floor = 1; floor <= floorsCount; floor++) {
                // Floor node
                const floorNode = new WBSNode({
                    projectId,
                    parentId: sectionNode.id,
                    code: `С${section}.Э${floor}`,
                    title: `Этаж ${floor}`,
                    level: 1,
                    order: globalOrder++,
                    unit: 'этаж',
                    tags: ['floor'],
                    sectionIndex: section,
                    floorIndex: floor,
                    status: WBSNodeStatus.NEW
                });
                floorNode.save();
                nodes.push(floorNode);

                // Add WBS-20 stages under each floor
                WBS_CATALOG_20.forEach((stage, stageIdx) => {
                    const stageNode = new WBSNode({
                        projectId,
                        parentId: floorNode.id,
                        code: `С${section}.Э${floor}.${stage.code}`,
                        title: stage.title,
                        level: 2,
                        order: globalOrder++,
                        unit: stage.unit,
                        tags: stage.tags,
                        sectionIndex: section,
                        floorIndex: floor,
                        status: WBSNodeStatus.NEW
                    });
                    stageNode.save();
                    nodes.push(stageNode);
                });
            }
        }

        safeAuditLog('PROJECT', projectId, 'wbs_generated', {
            type: 'WBS1000',
            sections: sectionsCount,
            floors: floorsCount,
            count: nodes.length
        });
        console.log(`✅ WBS-1000 generated: ${nodes.length} nodes (${sectionsCount} sections × ${floorsCount} floors)`);
        return nodes;
    }

    /**
     * Get WBS tree structure for UI rendering
     */
    function getWBSTree(projectId) {
        const allNodes = WBSNode.findByProject(projectId);
        const rootNodes = allNodes.filter(n => !n.parentId);

        function buildTree(node) {
            const children = allNodes.filter(n => n.parentId === node.id);
            return {
                ...node,
                children: children.map(buildTree)
            };
        }

        return rootNodes.map(buildTree);
    }

    /**
     * Search WBS nodes
     */
    function searchWBS(projectId, query) {
        return WBSNode.search(projectId, query);
    }

    /**
     * Get flat list with indentation info for virtualized rendering
     */
    function getFlatWBSList(projectId, expandedIds = new Set()) {
        const tree = getWBSTree(projectId);
        const result = [];

        function flatten(nodes, level = 0) {
            for (const node of nodes) {
                const hasChildren = node.children && node.children.length > 0;
                const isExpanded = expandedIds.has(node.id);

                result.push({
                    ...node,
                    level,
                    hasChildren,
                    isExpanded,
                    children: undefined // Remove for flat list
                });

                if (hasChildren && isExpanded) {
                    flatten(node.children, level + 1);
                }
            }
        }

        flatten(tree);
        return result;
    }

    // ===== EXPORT =====
    window.WBSGenerator = {
        // Catalogs
        WBS_CATALOG_20,
        WBS_CATALOG_120,

        // Generators
        generateWBS20,
        generateWBS120,
        generateWBS1000,

        // Tree operations
        getWBSTree,
        searchWBS,
        getFlatWBSList
    };

    console.log('✅ WBS Generator loaded');
})();
