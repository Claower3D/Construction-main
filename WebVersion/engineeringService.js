// ========== ENGINEERING SERVICE ==========
// Модуль B: API для "Комплексные инженерные решения"

(function () {
    'use strict';

    if (!window.Models) {
        console.error('[EngineeringService] window.Models is not loaded. Ensure models.js is included before engineeringService.js.');
        return;
    }
    const { AuditLog, Attachment } = window.Models;

    if (!window.EngineeringModels) {
        console.error('[EngineeringService] window.EngineeringModels is not loaded. Ensure engineeringModels.js is included before engineeringService.js.');
        return;
    }
    const {
        EngineeringSolution, EngineeringRequest, EngineeringSelectedSolution,
        EngineeringStage, Deliverable, EngineeringRequestStatus,
        SolutionCategoryLabels, UrgencyLabels, RequestStatusLabels, StageStatusLabels,
        generateStages
    } = window.EngineeringModels;

    // ========== CURRENT USER HELPER ==========
    function getCurrentUser() {
        return window.DataService?.getCurrentUser() || null;
    }

    // ========== SOLUTIONS CATALOG API ==========
    const SolutionsAPI = {
        // GET /engineering/solutions - получить каталог
        getAll(category = null) {
            const solutions = EngineeringSolution.getAll(category);
            return { success: true, data: solutions };
        },

        // GET /engineering/solutions/by-category
        getByCategory() {
            const byCategory = EngineeringSolution.getByCategory();
            return { success: true, data: byCategory };
        },

        // GET /engineering/solutions/:id
        get(solutionId) {
            const solution = EngineeringSolution.find(solutionId);
            if (!solution) return { success: false, error: 'Решение не найдено' };
            return { success: true, data: solution };
        },

        // GET /engineering/categories
        getCategories() {
            return {
                success: true,
                data: Object.entries(SolutionCategoryLabels).map(([key, label]) => ({ key, label }))
            };
        }
    };

    // ========== ENGINEERING REQUEST API ==========
    const RequestAPI = {
        // POST /customer/engineering-requests - создать заявку
        create(data = {}) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const request = new EngineeringRequest({
                customerId: user.id,
                status: EngineeringRequestStatus.NEW,
                objectInfo: data.objectInfo || {},
                urgency: data.urgency || 'normal'
            });

            request.save();

            AuditLog.log('engineering_request', request.id, 'created', {});

            return { success: true, data: request };
        },

        // GET /customer/engineering-requests - список заявок
        getList(filters = {}) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            let requests = EngineeringRequest.findByCustomer(user.id);

            if (filters.status) {
                requests = requests.filter(r => r.status === filters.status);
            }

            // Enrich with solutions count
            const enriched = requests.map(req => {
                const selected = EngineeringSelectedSolution.findByRequest(req.id);
                return {
                    ...req,
                    solutionsCount: selected.length,
                    statusLabel: RequestStatusLabels[req.status] || { label: req.status }
                };
            });

            return { success: true, data: enriched };
        },

        // GET /customer/engineering-requests/:id - получить заявку
        get(requestId) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const request = EngineeringRequest.find(requestId);
            if (!request) return { success: false, error: 'Заявка не найдена' };
            if (request.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            const selectedSolutions = EngineeringSelectedSolution.findByRequest(requestId);
            const stages = EngineeringStage.findByRequest(requestId);
            const deliverables = Deliverable.findByRequest(requestId);
            const files = Attachment.findByEntity('engineering_request', requestId);

            // Enrich selected solutions with full data
            const enrichedSolutions = selectedSolutions.map(sel => {
                const solution = EngineeringSolution.find(sel.solutionId);
                return {
                    ...sel,
                    solution: solution || { title: 'Решение' }
                };
            });

            // Enrich stages with status labels
            const enrichedStages = stages.map(stage => ({
                ...stage,
                statusLabel: StageStatusLabels[stage.status] || { label: stage.status },
                isOverdue: stage.isOverdue ? stage.isOverdue() : false,
                solutionTitle: stage.solutionId
                    ? EngineeringSolution.find(stage.solutionId)?.title
                    : null
            }));

            return {
                success: true,
                data: {
                    request,
                    selectedSolutions: enrichedSolutions,
                    stages: enrichedStages,
                    deliverables,
                    files,
                    statusLabel: RequestStatusLabels[request.status]
                }
            };
        },

        // PATCH /customer/engineering-requests/:id - обновить заявку
        update(requestId, data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const request = EngineeringRequest.find(requestId);
            if (!request) return { success: false, error: 'Заявка не найдена' };
            if (request.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            // Only allow updates in certain statuses
            if (![EngineeringRequestStatus.NEW, EngineeringRequestStatus.IN_REVIEW].includes(request.status)) {
                return { success: false, error: 'Нельзя редактировать заявку в текущем статусе' };
            }

            if (data.objectInfo) Object.assign(request.objectInfo, data.objectInfo);
            if (data.urgency) request.urgency = data.urgency;

            // Recalculate totals
            request.recalculateTotals();
            request.save();

            AuditLog.log('engineering_request', request.id, 'updated', {
                meta: { fields: Object.keys(data) }
            });

            return { success: true, data: request };
        },

        // DELETE /customer/engineering-requests/:id
        delete(requestId) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const request = EngineeringRequest.find(requestId);
            if (!request) return { success: false, error: 'Заявка не найдена' };
            if (request.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            // Only allow deletion in NEW status
            if (request.status !== EngineeringRequestStatus.NEW) {
                return { success: false, error: 'Можно удалить только новую заявку' };
            }

            request.delete();

            AuditLog.log('engineering_request', requestId, 'deleted', {});

            return { success: true };
        },

        // POST /customer/engineering-requests/:id/solutions - добавить решение
        addSolution(requestId, solutionId, option = 'standard') {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const request = EngineeringRequest.find(requestId);
            if (!request) return { success: false, error: 'Заявка не найдена' };
            if (request.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            const solution = EngineeringSolution.find(solutionId);
            if (!solution) return { success: false, error: 'Решение не найдено' };

            // Check if already added
            const existing = EngineeringSelectedSolution.findByRequestAndSolution(requestId, solutionId);
            if (existing) {
                return { success: false, error: 'Это решение уже добавлено' };
            }

            const selected = new EngineeringSelectedSolution({
                requestId,
                solutionId,
                option
            });

            // Calculate price and duration
            selected.calculatePriceAndDuration(request.objectInfo);
            selected.save();

            // Update request
            request.selectedSolutionIds.push(solutionId);
            request.recalculateTotals();
            request.stagesGenerated = false; // Need to regenerate stages
            request.save();

            AuditLog.log('engineering_request', request.id, 'solution_added', {
                meta: { solutionId, solutionTitle: solution.title }
            });

            return {
                success: true,
                data: {
                    selected,
                    solution,
                    request
                }
            };
        },

        // DELETE /customer/engineering-requests/:id/solutions/:solutionId - удалить решение
        removeSolution(requestId, solutionId) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const request = EngineeringRequest.find(requestId);
            if (!request) return { success: false, error: 'Заявка не найдена' };
            if (request.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            const selected = EngineeringSelectedSolution.findByRequestAndSolution(requestId, solutionId);
            if (!selected) {
                return { success: false, error: 'Решение не найдено в заявке' };
            }

            selected.delete();

            // Update request
            request.selectedSolutionIds = request.selectedSolutionIds.filter(id => id !== solutionId);
            request.recalculateTotals();
            request.stagesGenerated = false;
            request.save();

            AuditLog.log('engineering_request', request.id, 'solution_removed', {
                meta: { solutionId }
            });

            return { success: true, data: request };
        },

        // PATCH /customer/engineering-requests/:id/solutions/:solutionId - обновить опцию
        updateSolution(requestId, solutionId, data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const request = EngineeringRequest.find(requestId);
            if (!request) return { success: false, error: 'Заявка не найдена' };
            if (request.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            const selected = EngineeringSelectedSolution.findByRequestAndSolution(requestId, solutionId);
            if (!selected) {
                return { success: false, error: 'Решение не найдено в заявке' };
            }

            if (data.option) selected.option = data.option;
            if (data.params) Object.assign(selected.params, data.params);

            selected.calculatePriceAndDuration(request.objectInfo);
            selected.save();

            request.recalculateTotals();
            request.stagesGenerated = false;
            request.save();

            return { success: true, data: { selected, request } };
        },

        // POST /customer/engineering-requests/:id/generate-stages - сгенерировать этапы
        generateStages(requestId) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const request = EngineeringRequest.find(requestId);
            if (!request) return { success: false, error: 'Заявка не найдена' };
            if (request.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            const errors = request.validate();
            if (errors.length > 0) {
                return { success: false, error: errors.join(', ') };
            }

            const stages = generateStages(request);

            return { success: true, data: stages };
        },

        // PATCH /engineering-stages/:stageId - редактировать этап (до старта)
        updateStage(stageId, data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const stage = EngineeringStage.find(stageId);
            if (!stage) return { success: false, error: 'Этап не найден' };

            const request = EngineeringRequest.find(stage.requestId);
            if (!request || request.customerId !== user.id) {
                return { success: false, error: 'Нет доступа' };
            }

            // Only allow editing in PLAN status
            if (stage.status !== 'PLAN') {
                return { success: false, error: 'Можно редактировать только запланированные этапы' };
            }

            if (data.plannedStart) stage.plannedStart = data.plannedStart;
            if (data.plannedEnd) stage.plannedEnd = data.plannedEnd;
            if (data.comment !== undefined) stage.comment = data.comment;

            stage.save();

            return { success: true, data: stage };
        },

        // POST /customer/engineering-requests/:id/files - загрузить файл
        async uploadFile(requestId, file) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const request = EngineeringRequest.find(requestId);
            if (!request) return { success: false, error: 'Заявка не найдена' };
            if (request.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            // Upload via DataService
            const result = await window.DataService.Files.upload(file, 'engineering_request', requestId);

            if (result.success) {
                request.fileIds.push(result.data.id);
                request.save();

                AuditLog.log('engineering_request', request.id, 'file_uploaded', {
                    meta: { fileName: file.name }
                });
            }

            return result;
        },

        // POST /customer/engineering-requests/:id/submit - отправить на рассмотрение
        submit(requestId) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const request = EngineeringRequest.find(requestId);
            if (!request) return { success: false, error: 'Заявка не найдена' };
            if (request.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            if (request.status !== EngineeringRequestStatus.NEW) {
                return { success: false, error: 'Заявка уже отправлена' };
            }

            const errors = request.validate();
            if (errors.length > 0) {
                return { success: false, error: errors.join(', ') };
            }

            if (!request.stagesGenerated) {
                return { success: false, error: 'Сначала сгенерируйте этапы' };
            }

            request.status = EngineeringRequestStatus.IN_REVIEW;
            request.save();

            AuditLog.log('engineering_request', request.id, 'submitted', {});

            return { success: true, data: request };
        }
    };

    // ========== PDF GENERATION ==========
    const EngineeringPDF = {
        // Generate Brief / ТЗ PDF
        generateBrief(requestId) {
            const user = getCurrentUser();
            const request = EngineeringRequest.find(requestId);
            if (!request) return { success: false, error: 'Заявка не найдена' };

            const selectedSolutions = EngineeringSelectedSolution.findByRequest(requestId);

            // Check if jsPDF is available
            if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
                return { success: false, error: 'PDF библиотека не загружена' };
            }

            const { jsPDF } = window.jspdf || jspdf;
            const doc = new jsPDF();

            // Title
            doc.setFontSize(18);
            doc.text('ТЕХНИЧЕСКОЕ ЗАДАНИЕ', 105, 20, { align: 'center' });
            doc.setFontSize(12);
            doc.text('на выполнение инженерных работ', 105, 28, { align: 'center' });

            // Object info
            let y = 45;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('ОБЪЕКТ', 20, y);
            doc.setFont(undefined, 'normal');
            y += 10;
            doc.setFontSize(10);
            doc.text(`Название: ${request.objectInfo.name || '-'}`, 20, y);
            y += 7;
            doc.text(`Площадь: ${request.objectInfo.area ? request.objectInfo.area + ' м²' : '-'}`, 20, y);
            y += 7;
            doc.text(`Этажность: ${request.objectInfo.floors || '-'}`, 20, y);
            y += 7;
            doc.text(`Город: ${request.objectInfo.city || '-'}`, 20, y);
            y += 7;
            doc.text(`Адрес: ${request.objectInfo.address || '-'}`, 20, y);
            y += 7;
            doc.text(`Наличие чертежей: ${request.objectInfo.hasDrawings ? 'Да' : 'Нет'}`, 20, y);
            y += 7;
            doc.text(`Срочность: ${UrgencyLabels[request.urgency] || request.urgency}`, 20, y);

            // Selected solutions
            y += 15;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('ВЫБРАННЫЕ РЕШЕНИЯ', 20, y);
            doc.setFont(undefined, 'normal');
            y += 10;

            selectedSolutions.forEach((sel, index) => {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }

                const solution = EngineeringSolution.find(sel.solutionId);
                if (!solution) return;

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text(`${index + 1}. ${solution.title}`, 20, y);
                doc.setFont(undefined, 'normal');
                y += 7;

                doc.setFontSize(9);
                doc.text(`Опция: ${sel.option === 'vip' ? 'VIP' : 'Стандарт'}`, 25, y);
                y += 5;
                doc.text(`Стоимость: ${sel.calculatedPrice.toLocaleString()} ₸`, 25, y);
                y += 5;
                doc.text(`Срок: ${sel.calculatedDurationDays} дней`, 25, y);
                y += 5;

                // What included
                if (solution.whatIncluded && solution.whatIncluded.length > 0) {
                    doc.text('Что входит:', 25, y);
                    y += 5;
                    solution.whatIncluded.forEach(item => {
                        doc.text(`• ${item}`, 30, y);
                        y += 4;
                    });
                }

                y += 5;
            });

            // Totals
            y += 10;
            if (y > 260) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('ИТОГО', 20, y);
            y += 8;
            doc.setFontSize(11);
            doc.text(`Ориентировочная стоимость: ${request.totalEstimate.toLocaleString()} ₸`, 20, y);
            y += 6;
            doc.text(`Ориентировочный срок: ${request.totalDurationDays} дней`, 20, y);
            doc.setFont(undefined, 'normal');

            // Comment
            if (request.objectInfo.comment) {
                y += 15;
                doc.setFontSize(10);
                doc.text('Комментарий:', 20, y);
                y += 6;
                const lines = doc.splitTextToSize(request.objectInfo.comment, 170);
                doc.text(lines, 20, y);
            }

            // Footer
            doc.setFontSize(8);
            doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, 285);
            doc.text('QazGost AI — buildestimate.pro', 190, 285, { align: 'right' });

            // Save
            const fileName = `ТЗ_${request.objectInfo.name || 'Проект'}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            AuditLog.log('engineering_request', request.id, 'pdf_brief_downloaded', {
                meta: { fileName }
            });

            return { success: true, fileName };
        },

        // Generate Stages PDF
        generateStages(requestId) {
            const request = EngineeringRequest.find(requestId);
            if (!request) return { success: false, error: 'Заявка не найдена' };

            const stages = EngineeringStage.findByRequest(requestId);
            if (stages.length === 0) {
                return { success: false, error: 'Сначала сгенерируйте этапы' };
            }

            // Check if jsPDF is available
            if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
                return { success: false, error: 'PDF библиотека не загружена' };
            }

            const { jsPDF } = window.jspdf || jspdf;
            const doc = new jsPDF();

            // Title
            doc.setFontSize(18);
            doc.text('ПЛАН-ГРАФИК РАБОТ', 105, 20, { align: 'center' });

            // Object info
            let y = 35;
            doc.setFontSize(10);
            doc.text(`Объект: ${request.objectInfo.name || '-'}`, 20, y);
            y += 6;
            doc.text(`Срочность: ${UrgencyLabels[request.urgency]}`, 20, y);
            y += 6;
            doc.text(`Общий срок: ${request.totalDurationDays} дней`, 20, y);

            // Table header
            y += 15;
            doc.setFontSize(8);
            doc.setFillColor(240, 240, 240);
            doc.rect(20, y - 4, 170, 8, 'F');
            doc.setFont(undefined, 'bold');
            doc.text('№', 22, y);
            doc.text('Этап', 30, y);
            doc.text('Начало', 120, y);
            doc.text('Окончание', 145, y);
            doc.text('Статус', 175, y);
            doc.setFont(undefined, 'normal');
            y += 8;

            // Stages
            stages.forEach((stage, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }

                const startDate = stage.plannedStart
                    ? new Date(stage.plannedStart).toLocaleDateString('ru-RU')
                    : '-';
                const endDate = stage.plannedEnd
                    ? new Date(stage.plannedEnd).toLocaleDateString('ru-RU')
                    : '-';

                const title = stage.title.length > 50
                    ? stage.title.substring(0, 50) + '...'
                    : stage.title;

                // Highlight general stages
                if (!stage.solutionId) {
                    doc.setFont(undefined, 'bold');
                }

                doc.text(String(index + 1), 22, y);
                doc.text(title, 30, y);
                doc.text(startDate, 120, y);
                doc.text(endDate, 145, y);
                doc.text(StageStatusLabels[stage.status]?.label || stage.status, 175, y);

                doc.setFont(undefined, 'normal');
                y += 6;
            });

            // Footer
            doc.setFontSize(8);
            doc.text(`Сформировано: ${new Date().toLocaleString('ru-RU')}`, 20, 285);
            doc.text('QazGost AI — buildestimate.pro', 190, 285, { align: 'right' });

            // Save
            const fileName = `Этапы_${request.objectInfo.name || 'Проект'}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            AuditLog.log('engineering_request', request.id, 'pdf_stages_downloaded', {
                meta: { fileName }
            });

            return { success: true, fileName };
        }
    };

    // ========== EXPORT ==========
    window.EngineeringService = {
        Solutions: SolutionsAPI,
        Request: RequestAPI,
        PDF: EngineeringPDF
    };

    console.log('✅ EngineeringService loaded');

})();
