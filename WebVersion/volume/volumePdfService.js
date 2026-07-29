// ========== VOLUME PDF SERVICE v2.0 ==========
// Генерация PDF-акта для модуля "Расчёт объёмов"
// Использует jsPDF

(function () {
    'use strict';

    const VolumePDF = {

        /**
         * Генерация PDF-акта расчёта объёмов
         */
        async generate(calculation) {
            if (!calculation || !calculation.results) {
                throw new Error('Нет данных для генерации PDF');
            }

            // Проверяем jsPDF
            const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
            if (!jsPDF) {
                console.error('jsPDF не загружен');
                throw new Error('PDF-библиотека недоступна');
            }

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const r = calculation.results;
            const pageWidth = 210;
            const margin = 20;
            let y = 20;

            // ===== HEADER =====
            doc.setFillColor(139, 92, 246); // #8b5cf6
            doc.rect(0, 0, pageWidth, 35, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text('АКТ РАСЧЁТА ОБЪЁМОВ', pageWidth / 2, 18, { align: 'center' });

            doc.setFontSize(10);
            doc.text('QazGost AI • Фото-объёмы', pageWidth / 2, 28, { align: 'center' });

            y = 45;

            // ===== МЕТА-ИНФОРМАЦИЯ =====
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(9);
            doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, margin, y);
            doc.text(`№ ${calculation.id.slice(-8).toUpperCase()}`, pageWidth - margin, y, { align: 'right' });

            y += 10;

            // ===== ТИП ОБЪЕКТА =====
            const typeNames = {
                pile: '🏔️ Куча / Насыпь',
                pit: '🕳️ Котлован',
                quarry: '⛏️ Карьер'
            };

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text(`Тип объекта: ${typeNames[calculation.type] || 'Не указан'}`, margin, y);

            y += 15;

            // ===== ОСНОВНЫЕ РЕЗУЛЬТАТЫ =====
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(margin, y, pageWidth - margin * 2, 45, 3, 3, 'F');

            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text('РЕЗУЛЬТАТЫ РАСЧЁТА', margin + 5, y + 8);

            doc.setFontSize(24);
            doc.setTextColor(139, 92, 246);
            doc.text(`${r.deltaVolume.toLocaleString('ru-RU')} м³`, margin + 5, y + 25);

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            const resultsText = [
                `Масса: ${r.mass.toLocaleString('ru-RU')} тонн`,
                `Рейсов: ${r.trips}`,
                `Время: ${r.hours} ч (${r.shifts} смен)`
            ];
            doc.text(resultsText.join('  |  '), margin + 5, y + 38);

            y += 55;

            // ===== ДЕТАЛИ РАСЧЁТА =====
            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text('ДЕТАЛИ', margin, y);
            y += 8;

            doc.setDrawColor(230, 230, 230);
            doc.line(margin, y, pageWidth - margin, y);
            y += 8;

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);

            const details = [
                ['Объём ДО:', `${r.volumeBefore.toLocaleString('ru-RU')} м³`],
                ['Объём ПОСЛЕ:', `${r.volumeAfter.toLocaleString('ru-RU')} м³`],
                ['Разница (дельта):', `${r.deltaVolume.toLocaleString('ru-RU')} м³`],
                ['Плотность материала:', `${r.material?.density || 1.6} т/м³`],
                ['Масса грунта:', `${r.mass.toLocaleString('ru-RU')} тонн`],
                ['Количество рейсов:', `${r.trips}`],
                ['Количество ковшей:', `${r.buckets || '-'}`],
                ['Расчётное время:', `${r.hours} часов`],
                ['Количество смен:', `${r.shifts}`]
            ];

            details.forEach(([label, value]) => {
                doc.setTextColor(100, 100, 100);
                doc.text(label, margin, y);
                doc.setTextColor(0, 0, 0);
                doc.text(value, pageWidth - margin, y, { align: 'right' });
                y += 7;
            });

            y += 5;

            // ===== ТЕХНИКА =====
            if (r.equipment) {
                doc.setFontSize(11);
                doc.setTextColor(100, 100, 100);
                doc.text('ТЕХНИКА', margin, y);
                y += 8;

                doc.setDrawColor(230, 230, 230);
                doc.line(margin, y, pageWidth - margin, y);
                y += 8;

                doc.setFontSize(10);

                if (r.equipment.excavator) {
                    const exc = r.equipment.excavator;
                    doc.setTextColor(100, 100, 100);
                    doc.text('Экскаватор:', margin, y);
                    doc.setTextColor(0, 0, 0);
                    doc.text(`${exc.name || 'Средний'} × ${exc.count || 1}`, pageWidth - margin, y, { align: 'right' });
                    y += 7;
                }

                if (r.equipment.truck) {
                    const truck = r.equipment.truck;
                    doc.setTextColor(100, 100, 100);
                    doc.text('Самосвал:', margin, y);
                    doc.setTextColor(0, 0, 0);
                    doc.text(`${truck.name || 'КамАЗ 20т'} × ${truck.count || 2}`, pageWidth - margin, y, { align: 'right' });
                    y += 7;
                }

                y += 5;
            }

            // ===== УСЛОВИЯ =====
            if (r.conditions) {
                doc.setFontSize(11);
                doc.setTextColor(100, 100, 100);
                doc.text('УСЛОВИЯ', margin, y);
                y += 8;

                doc.setDrawColor(230, 230, 230);
                doc.line(margin, y, pageWidth - margin, y);
                y += 8;

                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text('Расстояние вывоза:', margin, y);
                doc.setTextColor(0, 0, 0);
                doc.text(`${r.conditions.distanceKm || 10} км`, pageWidth - margin, y, { align: 'right' });
                y += 10;
            }

            // ===== КОММЕНТАРИЙ =====
            if (calculation.comment) {
                doc.setFontSize(11);
                doc.setTextColor(100, 100, 100);
                doc.text('ПРИМЕЧАНИЕ', margin, y);
                y += 8;

                doc.setDrawColor(230, 230, 230);
                doc.line(margin, y, pageWidth - margin, y);
                y += 8;

                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);

                // Разбиваем длинный текст
                const lines = doc.splitTextToSize(calculation.comment, pageWidth - margin * 2);
                doc.text(lines.slice(0, 4), margin, y); // Макс 4 строки
                y += lines.slice(0, 4).length * 5 + 10;
            }

            // ===== FOOTER =====
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 270, pageWidth, 30, 'F');

            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Документ сформирован автоматически системой QazGost AI', pageWidth / 2, 280, { align: 'center' });
            doc.text(`Уровень достоверности: ${r.confidence || 50}%`, pageWidth / 2, 286, { align: 'center' });
            doc.text('Данный расчёт носит оценочный характер и требует верификации специалистом', pageWidth / 2, 292, { align: 'center' });

            // ===== СОХРАНЕНИЕ =====
            const filename = `Акт_объёмов_${calculation.id.slice(-6)}_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(filename);

            return `local://${filename}`;
        },

        /**
         * Генерация превью (без сохранения)
         */
        preview(calculation) {
            // Возвращает base64 PDF для превью
            // TODO: реализовать при необходимости
            return null;
        }
    };

    // ===== EXPORT =====
    window.VolumePDF = VolumePDF;

    console.log('✅ VolumePDF v2.0 loaded');
})();
