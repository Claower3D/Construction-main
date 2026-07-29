// ========== VIP SERVICE v2.0 ==========
// Бизнес-логика модуля "Строительство зданий и сооружений"

(function () {
    'use strict';

    const {
        VipProject, VipProjectStatus,
        WBSNode, WBSNodeStatus,
        Lot, LotStatus, LotType,
        Bid, BidStatus,
        Assignment, AssignmentStatus,
        Report, Acceptance,
        VipAuditLog,
        getRequirementsForTags
    } = window.VipModels || {};

    const { generateWBS20, generateWBS120, generateWBS1000 } = window.WBSGenerator || {};

    // ===== PROJECT SERVICE =====
    const ProjectService = {
        create(data) {
            const proj = new VipProject(data);
            const err = proj.validate();
            if (err.length) return { success: false, errors: err };
            proj.save();
            VipAuditLog.log('PROJECT', proj.id, 'created');
            return { success: true, project: proj };
        },

        update(id, data) {
            const proj = VipProject.find(id);
            if (!proj) return { success: false, error: 'Проект не найден' };
            Object.assign(proj, data);
            proj.save();
            VipAuditLog.log('PROJECT', proj.id, 'updated');
            return { success: true, project: proj };
        },

        delete(id) {
            const proj = VipProject.find(id);
            if (!proj) return { success: false, error: 'Проект не найден' };
            proj.delete();
            VipAuditLog.log('PROJECT', id, 'deleted');
            return { success: true };
        },

        list(customerId) {
            return VipProject.getAll().filter(p => !customerId || p.customerId === customerId);
        },

        get(id) { return VipProject.find(id); },

        activate(id) {
            const proj = VipProject.find(id);
            if (!proj) return { success: false, error: 'Проект не найден' };
            proj.status = VipProjectStatus.ACTIVE;
            proj.save();
            VipAuditLog.log('PROJECT', id, 'activated');
            return { success: true, project: proj };
        }
    };

    // ===== WBS SERVICE =====
    const WBSService = {
        generate(projectId, type, options = {}) {
            let nodes = [];
            const proj = VipProject.find(projectId);
            if (!proj) return { success: false, error: 'Проект не найден' };

            // Проверяем доступность генераторов
            if (!window.WBSGenerator) {
                return { success: false, error: 'Генератор WBS не загружен' };
            }

            try {
                switch (type) {
                    case 'WBS20':
                        if (typeof generateWBS20 !== 'function') {
                            return { success: false, error: 'Генератор WBS20 недоступен' };
                        }
                        nodes = generateWBS20(projectId);
                        proj.wbsType = 'WBS20';
                        break;
                    case 'WBS120':
                        if (typeof generateWBS120 !== 'function') {
                            return { success: false, error: 'Генератор WBS120 недоступен' };
                        }
                        nodes = generateWBS120(projectId);
                        proj.wbsType = 'WBS120';
                        break;
                    case 'WBS1000':
                        if (typeof generateWBS1000 !== 'function') {
                            return { success: false, error: 'Генератор WBS1000 недоступен' };
                        }
                        const sections = Math.max(1, Math.min(20, options.sections || 1));
                        const floors = Math.max(1, Math.min(50, options.floors || 1));
                        nodes = generateWBS1000(projectId, sections, floors);
                        proj.wbsType = 'WBS1000';
                        proj.sectionsCount = sections;
                        proj.floorsCount = floors;
                        break;
                    default:
                        return { success: false, error: 'Неизвестный тип WBS: ' + type };
                }

                // Проверка результата генерации
                if (!Array.isArray(nodes) || nodes.length === 0) {
                    return { success: false, error: 'Генерация WBS не вернула узлов' };
                }

                proj.status = VipProjectStatus.ACTIVE;
                proj.save();

                VipAuditLog.log('WBS', projectId, 'generated', { type, count: nodes.length });
                return { success: true, nodes, count: nodes.length };
            } catch (e) {
                console.error('WBS generation error:', e);
                return { success: false, error: 'Ошибка генерации WBS: ' + e.message };
            }
        },

        getTree(projectId) {
            if (!window.WBSGenerator) return [];
            return window.WBSGenerator.getWBSTree(projectId);
        },

        getFlatList(projectId, expandedIds) {
            if (!window.WBSGenerator) return [];
            return window.WBSGenerator.getFlatWBSList(projectId, expandedIds);
        },

        search(projectId, query) {
            return WBSNode.search(projectId, query);
        },

        updateStatus(nodeId, status) {
            const node = WBSNode.find(nodeId);
            if (!node) return { success: false, error: 'Узел не найден' };
            const oldStatus = node.status;
            node.status = status;
            node.save();
            VipAuditLog.log('WBS_NODE', nodeId, 'status_changed', { from: oldStatus, to: status });
            return { success: true, node };
        },

        recalcProgress(nodeId) {
            const node = WBSNode.find(nodeId);
            if (!node || !node.lotId) return { success: false };

            const assignment = Assignment.findByLot(node.lotId);
            if (assignment) {
                node.progressPercent = assignment.progressPercent;
                node.save();
            }
            return { success: true, node };
        },

        /**
         * Генерация WBS из AI-оценки (Multi-Pass Engine)
         * @param {string} projectId
         * @param {object} estimateReport — EstimateReport из MultiPassEstimateEngine
         * @returns {{ success, nodes, count }}
         */
        generateFromEstimate(projectId, estimateReport) {
            if (!window.EstimateWbsGenerator) {
                return { success: false, error: 'EstimateWbsGenerator не загружен' };
            }

            const proj = VipProject.find(projectId);
            if (!proj) return { success: false, error: 'Проект не найден' };

            try {
                const nodes = window.EstimateWbsGenerator.generateFromEstimate(projectId, estimateReport);

                if (!Array.isArray(nodes) || nodes.length === 0) {
                    return { success: false, error: 'AI-оценка не содержит позиций для WBS' };
                }

                proj.wbsType = 'AI_ESTIMATE';
                proj.status = VipProjectStatus.ACTIVE;
                proj.save();

                VipAuditLog.log('WBS', projectId, 'generated_from_estimate', {
                    type: 'AI_ESTIMATE',
                    count: nodes.length,
                    sessionId: estimateReport.sessionId || null,
                    mode: estimateReport.analysisMode || 'unknown',
                });

                console.log(`[WBSService] ✅ Generated ${nodes.length} WBS nodes from AI estimate for project ${projectId}`);
                return { success: true, nodes, count: nodes.length };
            } catch (e) {
                console.error('[WBSService] AI→WBS generation error:', e);
                return { success: false, error: 'Ошибка генерации WBS из AI-оценки: ' + e.message };
            }
        }
    };

    // ===== LOT SERVICE =====
    const LotService = {
        createFromWBS(projectId, nodeIds, type, data) {
            if (!nodeIds || nodeIds.length === 0) {
                return { success: false, error: 'Выберите работы из WBS' };
            }

            const proj = VipProject.find(projectId);
            if (!proj) return { success: false, error: 'Проект не найден' };

            // Проверяем, что все узлы существуют и не привязаны к другому лоту
            const allTags = new Set();
            const alreadyInLot = [];
            const invalidNodes = [];

            for (const nodeId of nodeIds) {
                const node = WBSNode.find(nodeId);
                if (!node) {
                    invalidNodes.push(nodeId);
                    continue;
                }
                if (node.lotId) {
                    alreadyInLot.push(node.code || nodeId);
                    continue;
                }
                if (node.tags) {
                    node.tags.forEach(t => allTags.add(t));
                }
            }

            if (invalidNodes.length > 0) {
                return { success: false, error: `Узлы не найдены: ${invalidNodes.length} шт.` };
            }

            if (alreadyInLot.length > 0) {
                return { success: false, error: `Работы уже в другом лоте: ${alreadyInLot.join(', ')}` };
            }

            const tags = Array.from(allTags);

            // Get photo requirements based on tags
            const requirementsJson = typeof getRequirementsForTags === 'function'
                ? getRequirementsForTags(tags)
                : null;

            const lot = new Lot({
                projectId,
                wbsNodeIds: nodeIds,
                title: data.title || 'Новый лот',
                description: data.description || '',
                type: type || LotType.FIX,
                budget: Math.max(0, parseInt(data.budget) || 0),
                deadlineStart: data.deadlineStart || new Date().toISOString().split('T')[0],
                deadlineEnd: data.deadlineEnd || null,
                city: proj.city,
                tags,
                requirementsJson
            });

            const errors = lot.validate();
            if (errors.length) return { success: false, errors };

            lot.save();

            // Link WBS nodes to lot
            for (const nodeId of nodeIds) {
                const node = WBSNode.find(nodeId);
                if (node) {
                    node.lotId = lot.id;
                    node.save();
                }
            }

            // Update project stats
            proj.recalcProgress();

            VipAuditLog.log('LOT', lot.id, 'created', { projectId, nodeIds: nodeIds.length });
            return { success: true, lot };
        },

        update(lotId, data) {
            const lot = Lot.find(lotId);
            if (!lot) return { success: false, error: 'Лот не найден' };

            Object.assign(lot, data);
            lot.save();
            VipAuditLog.log('LOT', lotId, 'updated');
            return { success: true, lot };
        },

        publish(lotId) {
            const lot = Lot.find(lotId);
            if (!lot) return { success: false, error: 'Лот не найден' };
            if (lot.status !== LotStatus.DRAFT) {
                return { success: false, error: 'Можно публиковать только черновики' };
            }

            const errors = lot.validate();
            if (errors.length) return { success: false, errors };

            lot.status = LotStatus.PUBLISHED;
            lot.publishedAt = new Date().toISOString();
            lot.save();

            // Update WBS nodes status
            for (const nodeId of lot.wbsNodeIds) {
                const node = WBSNode.find(nodeId);
                if (node) {
                    node.status = WBSNodeStatus.IN_PROGRESS;
                    node.save();
                }
            }

            VipAuditLog.log('LOT', lotId, 'published');
            return { success: true, lot };
        },

        cancel(lotId, reason) {
            const lot = Lot.find(lotId);
            if (!lot) return { success: false, error: 'Лот не найден' };
            if (lot.status === LotStatus.IN_PROGRESS || lot.status === LotStatus.SUBMITTED) {
                return { success: false, error: 'Нельзя отменить лот в работе' };
            }

            // Освобождаем привязанные WBS-узлы
            if (lot.wbsNodeIds && lot.wbsNodeIds.length > 0) {
                for (const nodeId of lot.wbsNodeIds) {
                    const node = WBSNode.find(nodeId);
                    if (node && node.lotId === lotId) {
                        node.lotId = null;
                        node.status = WBSNodeStatus.NEW;
                        node.save();
                    }
                }
            }

            lot.status = LotStatus.CANCELLED;
            lot.save();

            // Обновляем статистику проекта
            const proj = VipProject.find(lot.projectId);
            if (proj) proj.recalcProgress();

            VipAuditLog.log('LOT', lotId, 'cancelled', { reason });
            return { success: true };
        },

        getPublished(filters = {}) {
            return Lot.findPublished(filters);
        },

        getByProject(projectId) {
            return Lot.findByProject(projectId);
        },

        get(id) {
            return Lot.find(id);
        }
    };

    // ===== BID SERVICE =====
    const BidService = {
        create(lotId, executorId, data) {
            const lot = Lot.find(lotId);
            if (!lot) return { success: false, error: 'Лот не найден' };
            if (lot.type !== LotType.TENDER) {
                return { success: false, error: 'Отклики только для тендерных лотов' };
            }
            if (lot.status !== LotStatus.PUBLISHED) {
                return { success: false, error: 'Лот не опубликован' };
            }
            if (Bid.existsForLot(lotId, executorId)) {
                return { success: false, error: 'Вы уже откликнулись на этот лот' };
            }

            const bid = new Bid({
                lotId,
                executorId,
                executorName: data.executorName || '',
                price: data.price || lot.budget,
                duration: data.duration || 30,
                comment: data.comment || ''
            });
            bid.save();

            VipAuditLog.log('BID', bid.id, 'created', { lotId, executorId });
            return { success: true, bid };
        },

        accept(bidId) {
            const bid = Bid.find(bidId);
            if (!bid) return { success: false, error: 'Отклик не найден' };

            const lot = Lot.find(bid.lotId);
            if (!lot) return { success: false, error: 'Лот не найден' };

            // Reject all other bids
            const allBids = Bid.findByLot(bid.lotId);
            for (const b of allBids) {
                if (b.id !== bidId) {
                    b.status = BidStatus.REJECTED;
                    b.rejectionReason = 'Выбран другой исполнитель';
                    b.save();
                }
            }

            bid.status = BidStatus.ACCEPTED;
            bid.save();

            // Create assignment
            const assignResult = AssignmentService.createFromBid(bidId);
            if (!assignResult.success) return assignResult;

            VipAuditLog.log('BID', bidId, 'accepted');
            return { success: true, bid, assignment: assignResult.assignment };
        },

        reject(bidId, reason) {
            const bid = Bid.find(bidId);
            if (!bid) return { success: false, error: 'Отклик не найден' };

            bid.status = BidStatus.REJECTED;
            bid.rejectionReason = reason || '';
            bid.save();

            VipAuditLog.log('BID', bidId, 'rejected', { reason });
            return { success: true };
        },

        getByLot(lotId) {
            return Bid.findByLot(lotId);
        },

        getByExecutor(executorId) {
            return Bid.findByExecutor(executorId);
        }
    };

    // ===== ASSIGNMENT SERVICE =====
    const AssignmentService = {
        /**
         * Take a fix-price lot (first come, first served)
         */
        take(lotId, executorId, executorName) {
            // First check - fast path
            let lot = Lot.find(lotId);
            if (!lot) return { success: false, error: 'Лот не найден' };
            if (lot.type !== LotType.FIX) {
                return { success: false, error: 'Это тендерный лот, нужно откликаться' };
            }
            if (lot.status !== LotStatus.PUBLISHED) {
                return { success: false, error: 'Лот уже занят или недоступен' };
            }

            // Store original updatedAt for optimistic locking
            const originalUpdatedAt = lot.updatedAt;

            // Atomically reserve the lot
            lot.status = LotStatus.RESERVED;
            lot.assignedExecutorId = executorId;
            lot.save();

            // RACE CONDITION PROTECTION: Re-fetch and verify
            // Another executor might have taken the lot between our check and save
            const verifyLot = Lot.find(lotId);
            if (!verifyLot) {
                return { success: false, error: 'Лот был удалён' };
            }

            // Check if someone else took it (different executor or unexpected status change)
            if (verifyLot.assignedExecutorId !== executorId) {
                // Someone else won the race - revert our change
                VipAuditLog.log('ASSIGNMENT', lotId, 'race_condition_detected', {
                    executorId,
                    winnerId: verifyLot.assignedExecutorId
                });
                return { success: false, error: 'Лот уже занят другим исполнителем', code: 'RACE_LOST' };
            }

            // Optimistic lock check - if updatedAt changed unexpectedly, someone modified it
            if (verifyLot.updatedAt !== lot.updatedAt && originalUpdatedAt === verifyLot.updatedAt) {
                // Our save didn't go through properly
                return { success: false, error: 'Ошибка сохранения, попробуйте ещё раз', code: 'SAVE_CONFLICT' };
            }

            // Create assignment
            const assignment = new Assignment({
                lotId,
                executorId,
                executorName: executorName || '',
                agreedPrice: lot.budget,
                agreedDuration: 30 // default
            });
            assignment.save();

            // Update lot status to in progress (use verifyLot to ensure we have latest)
            verifyLot.status = LotStatus.IN_PROGRESS;
            verifyLot.save();

            // Update WBS nodes
            for (const nodeId of verifyLot.wbsNodeIds || lot.wbsNodeIds) {
                WBSService.updateStatus(nodeId, WBSNodeStatus.IN_PROGRESS);
            }

            VipAuditLog.log('ASSIGNMENT', assignment.id, 'created', { lotId, executorId, type: 'fix' });
            return { success: true, assignment };
        },

        /**
         * Create assignment from accepted bid (tender)
         */
        createFromBid(bidId) {
            const bid = Bid.find(bidId);
            if (!bid) return { success: false, error: 'Отклик не найден' };
            if (bid.status !== BidStatus.ACCEPTED) {
                return { success: false, error: 'Отклик не принят' };
            }

            const lot = Lot.find(bid.lotId);
            if (!lot) return { success: false, error: 'Лот не найден' };

            lot.status = LotStatus.IN_PROGRESS;
            lot.assignedExecutorId = bid.executorId;
            lot.save();

            const assignment = new Assignment({
                lotId: bid.lotId,
                executorId: bid.executorId,
                executorName: bid.executorName,
                bidId,
                agreedPrice: bid.price,
                agreedDuration: bid.duration
            });
            assignment.save();

            // Update WBS nodes
            for (const nodeId of lot.wbsNodeIds) {
                WBSService.updateStatus(nodeId, WBSNodeStatus.IN_PROGRESS);
            }

            VipAuditLog.log('ASSIGNMENT', assignment.id, 'created', {
                lotId: bid.lotId,
                executorId: bid.executorId,
                type: 'tender',
                bidId
            });

            return { success: true, assignment };
        },

        getByExecutor(executorId) {
            return Assignment.findByExecutor(executorId);
        },

        getByLot(lotId) {
            return Assignment.findByLot(lotId);
        },

        get(id) {
            return Assignment.find(id);
        },

        /**
         * Submit work for review
         */
        submit(assignmentId) {
            const assignment = Assignment.find(assignmentId);
            if (!assignment) return { success: false, error: 'Назначение не найдено' };
            if (assignment.status !== AssignmentStatus.ACTIVE &&
                assignment.status !== AssignmentStatus.REWORK) {
                return { success: false, error: 'Работа не может быть сдана' };
            }

            // Validate requirements
            const lot = Lot.find(assignment.lotId);
            if (lot && lot.requirementsJson) {
                const validation = ReportService.validateRequirements(assignmentId);
                if (!validation.valid) {
                    return { success: false, error: 'Не выполнены требования', details: validation.errors };
                }
            }

            assignment.status = AssignmentStatus.SUBMITTED;
            assignment.submittedAt = new Date().toISOString();
            assignment.save();

            // Update lot status
            if (lot) {
                lot.status = LotStatus.SUBMITTED;
                lot.save();
            }

            // Update WBS nodes
            if (lot) {
                for (const nodeId of lot.wbsNodeIds) {
                    WBSService.updateStatus(nodeId, WBSNodeStatus.SUBMITTED);
                }
            }

            VipAuditLog.log('ASSIGNMENT', assignmentId, 'submitted');
            return { success: true, assignment };
        }
    };

    // ===== REPORT SERVICE =====
    const ReportService = {
        create(assignmentId, checkpoint, photos, proofTypes = [], comment = '') {
            const assignment = Assignment.find(assignmentId);
            if (!assignment) return { success: false, error: 'Назначение не найдено' };
            if (assignment.status !== AssignmentStatus.ACTIVE &&
                assignment.status !== AssignmentStatus.REWORK) {
                return { success: false, error: 'Нельзя загружать отчёты' };
            }

            // Check if report for this checkpoint already exists
            const existing = Report.findByCheckpoint(assignmentId, checkpoint);
            if (existing) {
                // Update existing report
                existing.photos = [...existing.photos, ...photos];
                existing.proofTypes = [...new Set([...existing.proofTypes, ...proofTypes])];
                if (comment) existing.comment = comment;
                existing.save();
                return { success: true, report: existing };
            }

            const report = new Report({
                assignmentId,
                checkpoint,
                photos,
                proofTypes,
                comment
            });
            report.save();

            VipAuditLog.log('REPORT', report.id, 'created', { assignmentId, checkpoint });
            return { success: true, report };
        },

        validateRequirements(assignmentId) {
            const assignment = Assignment.find(assignmentId);
            if (!assignment) return { valid: false, errors: ['Назначение не найдено'] };

            const lot = Lot.find(assignment.lotId);
            if (!lot || !lot.requirementsJson) {
                return { valid: true, errors: [] };
            }

            const req = lot.requirementsJson;
            const reports = Report.findByAssignment(assignmentId);
            const errors = [];

            // Check each checkpoint
            for (const checkpoint of req.checkpoints) {
                const report = reports.find(r => r.checkpoint === checkpoint);

                if (!report) {
                    errors.push(`Отсутствует отчёт за ${checkpoint}%`);
                    continue;
                }

                // Check min photos
                const minPhotos = req.minPhotos[checkpoint] || 0;
                if (report.photos.length < minPhotos) {
                    errors.push(`Чекпоинт ${checkpoint}%: нужно минимум ${minPhotos} фото, загружено ${report.photos.length}`);
                }

                // Check required proof types
                const requiredProofs = req.requiredProofs[checkpoint] || [];
                for (const proofType of requiredProofs) {
                    if (!report.proofTypes.includes(proofType)) {
                        errors.push(`Чекпоинт ${checkpoint}%: требуется фото типа "${proofType}"`);
                    }
                }
            }

            return { valid: errors.length === 0, errors };
        },

        getByAssignment(assignmentId) {
            return Report.findByAssignment(assignmentId);
        }
    };

    // ===== ACCEPTANCE SERVICE =====
    const AcceptanceService = {
        accept(assignmentId, comment = '') {
            const assignment = Assignment.find(assignmentId);
            if (!assignment) return { success: false, error: 'Назначение не найдено' };
            if (assignment.status !== AssignmentStatus.SUBMITTED) {
                return { success: false, error: 'Работа не сдана на проверку' };
            }

            const lot = Lot.find(assignment.lotId);

            // Update assignment
            assignment.status = AssignmentStatus.ACCEPTED;
            assignment.acceptedAt = new Date().toISOString();
            assignment.progressPercent = 100;
            assignment.save();

            // Update lot
            if (lot) {
                lot.status = LotStatus.CLOSED;
                lot.save();

                // Update WBS nodes
                for (const nodeId of lot.wbsNodeIds) {
                    const node = WBSNode.find(nodeId);
                    if (node) {
                        node.status = WBSNodeStatus.CLOSED;
                        node.progressPercent = 100;
                        node.save();
                    }
                }

                // Update project progress
                const proj = VipProject.find(lot.projectId);
                if (proj) proj.recalcProgress();
            }

            // Create acceptance record
            const acceptance = new Acceptance({
                assignmentId,
                lotId: lot ? lot.id : '',
                decision: 'accepted',
                comment
            });
            acceptance.save();

            VipAuditLog.log('ACCEPTANCE', acceptance.id, 'accepted', { assignmentId });
            return { success: true, acceptance };
        },

        rework(assignmentId, comment) {
            if (!comment) {
                return { success: false, error: 'Укажите причину доработки' };
            }

            const assignment = Assignment.find(assignmentId);
            if (!assignment) return { success: false, error: 'Назначение не найдено' };
            if (assignment.status !== AssignmentStatus.SUBMITTED) {
                return { success: false, error: 'Работа не сдана на проверку' };
            }

            const lot = Lot.find(assignment.lotId);

            // Update assignment
            assignment.status = AssignmentStatus.REWORK;
            assignment.reworkCount++;
            assignment.save();

            // Update lot
            if (lot) {
                lot.status = LotStatus.REWORK;
                lot.save();

                // Update WBS nodes
                for (const nodeId of lot.wbsNodeIds) {
                    WBSService.updateStatus(nodeId, WBSNodeStatus.REWORK);
                }
            }

            // Create acceptance record
            const acceptance = new Acceptance({
                assignmentId,
                lotId: lot ? lot.id : '',
                decision: 'rework',
                comment
            });
            acceptance.save();

            VipAuditLog.log('ACCEPTANCE', acceptance.id, 'rework', { assignmentId, comment });
            return { success: true, acceptance };
        },

        getHistory(assignmentId) {
            return Acceptance.findByAssignment(assignmentId);
        }
    };

    // ===== EXPORT =====
    window.VipService = {
        Project: ProjectService,
        WBS: WBSService,
        Lot: LotService,
        Bid: BidService,
        Assignment: AssignmentService,
        Report: ReportService,
        Acceptance: AcceptanceService
    };

    console.log('✅ VIP Service v2.0 loaded');
})();
