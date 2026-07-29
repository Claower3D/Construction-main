// ================================================================
// ENGINEER EXCEL I/O — Экспорт данных инженера (Объекты, Бригады)
// Формат: .xlsx (SheetJS/xlsx)
// ================================================================
(function () {
    'use strict';

    function exportObjects() {
        if (typeof XLSX === 'undefined') {
            alert('⚠️ Библиотека XLSX не загружена. Пожалуйста, перезагрузите страницу.');
            return;
        }

        if (!window.ED || !ED.objects || ED.objects.length === 0) {
            alert('⚠️ Нет объектов для экспорта.');
            return;
        }

        const headers = ['ID', 'Клиент', 'Телефон', 'Адрес', 'Тип работ', 'Статус', 'Бюджет (₸)', 'Факт. расходы (₸)', 'Прогресс (%)', 'AI-просчёт', 'Бригада'];
        
        const rows = ED.objects.map(o => [
            o.id || '',
            o.client || '',
            o.phone || '',
            o.address || '',
            o.type || '',
            ED.STATUSES[o.status] || o.status,
            o.budget || 0,
            o.factCost || 0,
            o.progress || 0,
            o.aiDone ? 'Готов' : 'Нет',
            o.brigade ? o.brigade.name : 'Не назначена'
        ]);

        const data = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Настройка ширины колонок
        ws['!cols'] = [
            { wch: 15 }, // ID
            { wch: 25 }, // Клиент
            { wch: 15 }, // Телефон
            { wch: 35 }, // Адрес
            { wch: 20 }, // Тип работ
            { wch: 15 }, // Статус
            { wch: 15 }, // Бюджет
            { wch: 20 }, // Факт. расходы
            { wch: 15 }, // Прогресс
            { wch: 15 }, // AI-просчёт
            { wch: 25 }, // Бригада
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Объекты');

        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `QazGost_Объекты_${date}.xlsx`);
        
        if (window.showToast) {
            showToast('✅ Объекты успешно выгружены в Excel!');
        } else if (window.QazUI && QazUI.toast) {
            QazUI.toast('✅ Объекты успешно выгружены в Excel!');
        }
    }

    function exportBrigades() {
        if (typeof XLSX === 'undefined') {
            alert('⚠️ Библиотека XLSX не загружена. Пожалуйста, перезагрузите страницу.');
            return;
        }

        if (!window.ED) {
            alert('⚠️ Модуль данных не загружен.');
            return;
        }

        const brigades = ED.getAllBrigades();
        if (!brigades || brigades.length === 0) {
            alert('⚠️ Нет бригад для экспорта.');
            return;
        }

        const headers = ['ID', 'Название', 'Специализация', 'Кол-во человек', 'Статус', 'Стоимость/день (₸)'];
        
        const rows = brigades.map(b => [
            b.id || '',
            b.name || '',
            b.spec || '',
            b.workers || 0,
            b.status === 'free' ? 'Свободна' : 'В работе',
            b.pricePerDay || 0
        ]);

        const data = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Настройка ширины колонок
        ws['!cols'] = [
            { wch: 25 }, // ID
            { wch: 25 }, // Название
            { wch: 25 }, // Специализация
            { wch: 18 }, // Кол-во человек
            { wch: 15 }, // Статус
            { wch: 20 }, // Стоимость/день
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Бригады');

        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `QazGost_Бригады_${date}.xlsx`);

        if (window.showToast) {
            showToast('✅ Бригады успешно выгружены в Excel!');
        } else if (window.QazUI && QazUI.toast) {
            QazUI.toast('✅ Бригады успешно выгружены в Excel!');
        }
    }

    window.EngineerExcelIO = {
        exportObjects,
        exportBrigades
    };

    console.log('✅ [EngineerExcelIO] Module loaded');
})();
