// ========== VIP PDF SERVICE v1.0 ==========
// Генерация PDF-документов для VIP-проектов

(function () {
    'use strict';

    // ========== HELPERS ==========
    function formatDate(isoDate) {
        if (!isoDate) return '-';
        return new Date(isoDate).toLocaleDateString('ru-RU');
    }

    function formatMoney(amount) {
        return (amount || 0).toLocaleString('ru-RU') + ' ₸';
    }

    function formatPercent(value) {
        return Math.round(value || 0) + '%';
    }

    // Status labels
    const LOT_STATUS_LABELS = {
        draft: 'Черновик',
        published: 'Опубликован',
        bidding: 'Приём заявок',
        assigned: 'Назначен',
        in_progress: 'В работе',
        review: 'На проверке',
        completed: 'Завершён',
        cancelled: 'Отменён'
    };

    const ASSIGNMENT_STATUS_LABELS = {
        active: 'Активно',
        paused: 'Приостановлено',
        review: 'На проверке',
        rework: 'Доработка',
        completed: 'Завершено',
        cancelled: 'Отменено'
    };

    // ========== VIP PDF SERVICE ==========
    const VipPDF = {
        // Проверка доступности jsPDF
        isAvailable() {
            return typeof jspdf !== 'undefined' || typeof window.jspdf !== 'undefined';
        },

        // Получить экземпляр jsPDF
        _getDoc() {
            if (!this.isAvailable()) {
                console.error('jsPDF not loaded');
                return null;
            }
            const { jsPDF } = window.jspdf || jspdf;
            return new jsPDF();
        },

        // Добавить заголовок документа
        _addHeader(doc, title, subtitle) {
            // Logo/Title
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text(title, 105, 20, { align: 'center' });

            if (subtitle) {
                doc.setFontSize(12);
                doc.setFont(undefined, 'normal');
                doc.text(subtitle, 105, 28, { align: 'center' });
            }

            // Line
            doc.setDrawColor(59, 130, 246); // Blue
            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);

            return 45; // Return Y position after header
        },

        // Добавить подвал документа
        _addFooter(doc, projectId, pageNumber, totalPages) {
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(128, 128, 128);

            doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, 285);
            doc.text(`Страница ${pageNumber} из ${totalPages}`, 105, 285, { align: 'center' });
            doc.text('QazGost AI — buildestimate.pro', 190, 285, { align: 'right' });

            if (projectId) {
                doc.text(`ID: ${projectId.slice(-8)}`, 20, 280);
            }

            doc.setTextColor(0, 0, 0);
        },

        // ========== PDF СМЕТЫ ==========
        generateEstimate(projectId) {
            const doc = this._getDoc();
            if (!doc) return { success: false, error: 'PDF библиотека не загружена' };

            const project = window.VipModels?.VipProject?.find(projectId);
            if (!project) return { success: false, error: 'Проект не найден' };

            const nodes = window.VipModels?.WBSNode?.findByProject(projectId) || [];
            const lots = window.VipModels?.Lot?.findByProject(projectId) || [];

            // Header
            let y = this._addHeader(doc, 'СМЕТА ПРОЕКТА', project.title);

            // Project info
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('ИНФОРМАЦИЯ О ПРОЕКТЕ', 20, y);
            doc.setFont(undefined, 'normal');
            y += 8;

            doc.setFontSize(10);
            doc.text(`Название: ${project.title}`, 20, y); y += 6;
            doc.text(`Город: ${project.city || '-'}`, 20, y); y += 6;
            doc.text(`Адрес: ${project.addressText || '-'}`, 20, y); y += 6;
            doc.text(`Тип: ${project.buildingType || '-'}`, 20, y); y += 6;
            doc.text(`Дата создания: ${formatDate(project.createdAt)}`, 20, y); y += 6;
            if (project.totalBudgetKZT) {
                doc.text(`Общий бюджет: ${formatMoney(project.totalBudgetKZT)}`, 20, y); y += 6;
            }

            // WBS Structure
            y += 10;
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('СТРУКТУРА РАБОТ (WBS)', 20, y);
            y += 8;

            // Table header
            doc.setFontSize(9);
            doc.setFillColor(240, 240, 240);
            doc.rect(20, y - 4, 170, 7, 'F');
            doc.text('№', 22, y);
            doc.text('Наименование', 30, y);
            doc.text('Объём', 120, y);
            doc.text('Ед.', 140, y);
            doc.text('Бюджет', 160, y);
            y += 8;

            doc.setFont(undefined, 'normal');

            // Recursive function to render WBS tree
            let totalBudget = 0;
            let itemNum = 0;

            const renderNode = (node, level = 0) => {
                if (y > 260) {
                    doc.addPage();
                    y = 20;
                }

                const indent = level * 5;
                const prefix = level === 0 ? '■' : level === 1 ? '●' : '○';

                itemNum++;
                const name = node.name.length > 40 ? node.name.substring(0, 40) + '...' : node.name;

                if (level === 0) {
                    doc.setFont(undefined, 'bold');
                } else {
                    doc.setFont(undefined, 'normal');
                }

                doc.text(String(itemNum), 22, y);
                doc.text(prefix + ' ' + name, 30 + indent, y);

                if (node.quantity) {
                    doc.text(String(node.quantity), 120, y);
                    doc.text(node.unit || 'ед.', 140, y);
                }

                if (node.budgetKZT) {
                    doc.text(formatMoney(node.budgetKZT), 160, y);
                    totalBudget += node.budgetKZT;
                }

                y += 6;

                // Render children
                const children = nodes.filter(n => n.parentId === node.id);
                children.forEach(child => renderNode(child, level + 1));
            };

            // Render root nodes
            const rootNodes = nodes.filter(n => !n.parentId);
            rootNodes.forEach(node => renderNode(node));

            // Lots section
            if (lots.length > 0) {
                y += 10;
                if (y > 240) {
                    doc.addPage();
                    y = 20;
                }

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text('ЛОТЫ', 20, y);
                y += 8;

                doc.setFontSize(9);
                doc.setFillColor(240, 240, 240);
                doc.rect(20, y - 4, 170, 7, 'F');
                doc.text('№', 22, y);
                doc.text('Название лота', 30, y);
                doc.text('Статус', 120, y);
                doc.text('Бюджет', 160, y);
                y += 8;

                doc.setFont(undefined, 'normal');

                lots.forEach((lot, idx) => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }

                    const lotName = lot.title?.length > 50 ? lot.title.substring(0, 50) + '...' : (lot.title || 'Лот');
                    const status = LOT_STATUS_LABELS[lot.status] || lot.status;
                    const budget = lot.budgetKZT ? formatMoney(lot.budgetKZT) : '-';

                    doc.text(String(idx + 1), 22, y);
                    doc.text(lotName, 30, y);
                    doc.text(status, 120, y);
                    doc.text(budget, 160, y);
                    y += 6;
                });
            }

            // Totals
            y += 10;
            doc.setDrawColor(0, 0, 0);
            doc.line(20, y, 190, y);
            y += 8;

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`ИТОГО: ${formatMoney(totalBudget || project.totalBudgetKZT)}`, 160, y, { align: 'right' });

            // Footer
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                this._addFooter(doc, projectId, i, totalPages);
            }

            // Save
            const fileName = `Смета_${project.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            // Audit
            window.VipModels?.VipAuditLog?.log('vip_project', projectId, 'pdf_estimate_generated', { fileName });

            return { success: true, fileName };
        },

        // ========== PDF ПРОГРЕССА ==========
        generateProgress(projectId) {
            const doc = this._getDoc();
            if (!doc) return { success: false, error: 'PDF библиотека не загружена' };

            const project = window.VipModels?.VipProject?.find(projectId);
            if (!project) return { success: false, error: 'Проект не найден' };

            const stats = window.VipService?.Project?.getStats(projectId);
            const lots = window.VipModels?.Lot?.findByProject(projectId) || [];

            // Header
            let y = this._addHeader(doc, 'ОТЧЁТ О ПРОГРЕССЕ', project.title);

            // Project info
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('ОБЩАЯ ИНФОРМАЦИЯ', 20, y);
            doc.setFont(undefined, 'normal');
            y += 8;

            doc.setFontSize(10);
            doc.text(`Проект: ${project.title}`, 20, y); y += 6;
            doc.text(`Город: ${project.city || '-'}`, 20, y); y += 6;
            doc.text(`Статус: ${project.status}`, 20, y); y += 6;
            doc.text(`Дата отчёта: ${formatDate(new Date().toISOString())}`, 20, y);
            y += 15;

            // Progress bar
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('ОБЩИЙ ПРОГРЕСС', 20, y);
            y += 10;

            const progress = stats?.projectProgress || 0;

            // Draw progress bar
            doc.setFillColor(229, 231, 235); // Gray background
            doc.rect(20, y, 170, 12, 'F');

            // Progress fill
            const progressColor = progress >= 75 ? [34, 197, 94] : progress >= 50 ? [250, 204, 21] : progress >= 25 ? [249, 115, 22] : [239, 68, 68];
            doc.setFillColor(...progressColor);
            doc.rect(20, y, 170 * (progress / 100), 12, 'F');

            // Progress text
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`${formatPercent(progress)}`, 105, y + 8, { align: 'center' });
            y += 20;

            // Statistics
            if (stats) {
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text('СТАТИСТИКА', 20, y);
                y += 10;

                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');

                const statsData = [
                    ['Всего лотов:', stats.totalLots || 0],
                    ['Опубликовано:', stats.publishedLots || 0],
                    ['В работе:', stats.inProgressLots || 0],
                    ['Завершено:', stats.completedLots || 0],
                    ['Получено заявок:', stats.totalBids || 0],
                    ['Активных назначений:', stats.activeAssignments || 0]
                ];

                statsData.forEach(([label, value]) => {
                    doc.text(label, 30, y);
                    doc.text(String(value), 100, y);
                    y += 6;
                });
            }

            // Lots progress table
            if (lots.length > 0) {
                y += 10;
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text('ПРОГРЕСС ПО ЛОТАМ', 20, y);
                y += 8;

                // Table header
                doc.setFontSize(9);
                doc.setFillColor(240, 240, 240);
                doc.rect(20, y - 4, 170, 7, 'F');
                doc.text('№', 22, y);
                doc.text('Лот', 30, y);
                doc.text('Статус', 100, y);
                doc.text('Прогресс', 135, y);
                doc.text('Исполнитель', 160, y);
                y += 8;

                doc.setFont(undefined, 'normal');

                lots.forEach((lot, idx) => {
                    if (y > 260) {
                        doc.addPage();
                        y = 20;
                    }

                    const assignment = window.VipService?.Assignment?.getByLot(lot.id);
                    const lotProgress = assignment?.progressPercent || 0;
                    const status = LOT_STATUS_LABELS[lot.status] || lot.status;
                    const execName = assignment ? 'Назначен' : '-';

                    const lotTitle = lot.title?.length > 35 ? lot.title.substring(0, 35) + '...' : (lot.title || 'Лот');

                    doc.text(String(idx + 1), 22, y);
                    doc.text(lotTitle, 30, y);
                    doc.text(status, 100, y);
                    doc.text(formatPercent(lotProgress), 135, y);
                    doc.text(execName, 160, y);
                    y += 6;
                });
            }

            // Timeline (if dates available)
            y += 15;
            if (y > 250) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('СРОКИ', 20, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Начало проекта: ${formatDate(project.createdAt)}`, 30, y); y += 6;
            if (project.plannedEndDate) {
                doc.text(`Планируемое завершение: ${formatDate(project.plannedEndDate)}`, 30, y); y += 6;
            }
            if (project.status === 'completed' && project.completedAt) {
                doc.text(`Фактическое завершение: ${formatDate(project.completedAt)}`, 30, y); y += 6;
            }

            // Footer
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                this._addFooter(doc, projectId, i, totalPages);
            }

            // Save
            const fileName = `Прогресс_${project.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            // Audit
            window.VipModels?.VipAuditLog?.log('vip_project', projectId, 'pdf_progress_generated', { fileName });

            return { success: true, fileName };
        },

        // ========== PDF АКТА ПРИЁМКИ ==========
        generateAcceptanceAct(assignmentId) {
            const doc = this._getDoc();
            if (!doc) return { success: false, error: 'PDF библиотека не загружена' };

            const assignment = window.VipModels?.Assignment?.find(assignmentId);
            if (!assignment) return { success: false, error: 'Назначение не найдено' };

            const lot = window.VipModels?.Lot?.find(assignment.lotId);
            const project = lot ? window.VipModels?.VipProject?.find(lot.projectId) : null;
            const reports = window.VipModels?.Report?.findByAssignment(assignmentId) || [];
            const acceptances = window.VipModels?.Acceptance?.findByAssignment(assignmentId) || [];

            // Header
            let y = this._addHeader(doc, 'АКТ ПРИЁМКИ РАБОТ', lot?.title || 'Работы по лоту');

            // Document info
            doc.setFontSize(10);
            doc.text(`Акт № ${assignmentId.slice(-8).toUpperCase()}`, 20, y);
            doc.text(`от ${formatDate(new Date().toISOString())}`, 80, y);
            y += 15;

            // Parties
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('СТОРОНЫ', 20, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text('Заказчик: ________________________', 20, y); y += 8;
            doc.text('Исполнитель: ________________________', 20, y); y += 8;
            if (assignment.executorId) {
                doc.text(`(ID: ${assignment.executorId.slice(-8)})`, 80, y - 8);
            }
            y += 10;

            // Project and lot info
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('ОБЪЕКТ И РАБОТЫ', 20, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Проект: ${project?.title || '-'}`, 20, y); y += 6;
            doc.text(`Лот: ${lot?.title || '-'}`, 20, y); y += 6;
            doc.text(`Тип лота: ${lot?.type || '-'}`, 20, y); y += 6;

            if (lot?.budgetKZT || assignment.contractAmountKZT) {
                doc.text(`Сумма контракта: ${formatMoney(assignment.contractAmountKZT || lot?.budgetKZT)}`, 20, y);
                y += 6;
            }
            y += 10;

            // Work completion
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('ВЫПОЛНЕННЫЕ РАБОТЫ', 20, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Прогресс выполнения: ${formatPercent(assignment.progressPercent)}`, 20, y); y += 6;
            doc.text(`Статус назначения: ${ASSIGNMENT_STATUS_LABELS[assignment.status] || assignment.status}`, 20, y); y += 6;
            doc.text(`Дата начала: ${formatDate(assignment.startedAt || assignment.createdAt)}`, 20, y); y += 6;
            if (assignment.completedAt) {
                doc.text(`Дата завершения: ${formatDate(assignment.completedAt)}`, 20, y); y += 6;
            }
            y += 10;

            // Reports summary
            if (reports.length > 0) {
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text('ПРЕДСТАВЛЕННЫЕ ОТЧЁТЫ', 20, y);
                y += 8;

                doc.setFontSize(9);
                doc.setFillColor(240, 240, 240);
                doc.rect(20, y - 4, 170, 7, 'F');
                doc.text('№', 22, y);
                doc.text('Чекпоинт', 35, y);
                doc.text('Дата', 70, y);
                doc.text('Фото', 110, y);
                doc.text('Комментарий', 135, y);
                y += 8;

                doc.setFont(undefined, 'normal');

                reports.forEach((report, idx) => {
                    if (y > 250) {
                        doc.addPage();
                        y = 20;
                    }

                    doc.text(String(idx + 1), 22, y);
                    doc.text(`${report.checkpoint}%`, 35, y);
                    doc.text(formatDate(report.createdAt), 70, y);
                    doc.text(String(report.photos?.length || 0), 110, y);
                    const comment = report.comment?.length > 20 ? report.comment.substring(0, 20) + '...' : (report.comment || '-');
                    doc.text(comment, 135, y);
                    y += 6;
                });
                y += 5;
            }

            // Acceptance history
            if (acceptances.length > 0) {
                y += 5;
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text('ИСТОРИЯ ПРИЁМКИ', 20, y);
                y += 8;

                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');

                acceptances.forEach((acc, idx) => {
                    if (y > 260) {
                        doc.addPage();
                        y = 20;
                    }

                    const decision = acc.decision === 'accepted' ? '✓ Принято' : '✗ На доработку';
                    doc.text(`${idx + 1}. ${formatDate(acc.createdAt)} — ${decision}`, 20, y);
                    y += 5;
                    if (acc.comment) {
                        const commentLines = doc.splitTextToSize(`Комментарий: ${acc.comment}`, 160);
                        doc.text(commentLines, 25, y);
                        y += commentLines.length * 4 + 2;
                    }
                    y += 3;
                });
            }

            // Conclusion
            y += 10;
            if (y > 230) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('ЗАКЛЮЧЕНИЕ', 20, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');

            const isCompleted = assignment.status === 'completed';
            if (isCompleted) {
                doc.text('Работы выполнены в полном объёме и приняты Заказчиком.', 20, y);
                y += 6;
                doc.text('Претензий по качеству и срокам выполнения нет.', 20, y);
            } else {
                doc.text('Работы находятся в процессе выполнения.', 20, y);
                y += 6;
                doc.text(`Текущий прогресс: ${formatPercent(assignment.progressPercent)}`, 20, y);
            }
            y += 20;

            // Signatures
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('ПОДПИСИ СТОРОН', 20, y);
            y += 15;

            doc.setFont(undefined, 'normal');
            doc.text('Заказчик:', 20, y);
            doc.text('Исполнитель:', 110, y);
            y += 15;

            doc.text('_________________________', 20, y);
            doc.text('_________________________', 110, y);
            y += 6;

            doc.setFontSize(8);
            doc.text('(подпись / дата)', 35, y);
            doc.text('(подпись / дата)', 125, y);

            // Footer
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                this._addFooter(doc, assignmentId, i, totalPages);
            }

            // Save
            const fileName = `Акт_приёмки_${(lot?.title || 'Лот').replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            // Audit
            window.VipModels?.VipAuditLog?.log('assignment', assignmentId, 'pdf_acceptance_act_generated', { fileName });

            return { success: true, fileName };
        }
    };

    // ========== EXPORT ==========
    window.VipPDF = VipPDF;

    console.log('✅ VIP PDF Service v1.0 loaded');
})();
