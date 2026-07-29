// ========== VIP MODELS v2.0 ==========
// Core data models for VIP (Building Construction) module.
// Uses localStorage with prefix "VIP_" and supports schema migration.

(function () {
    'use strict';

    // ---- Schema version ----
    const VIP_SCHEMA_VERSION = 2;
    const STORAGE_KEYS = {
        PROJECTS: 'VIP_PROJECTS',
        WBS_NODES: 'VIP_WBS_NODES',
        LOTS: 'VIP_LOTS',
        BIDS: 'VIP_BIDS',
        ASSIGNMENTS: 'VIP_ASSIGNMENTS',
        REPORTS: 'VIP_REPORTS',
        ACCEPTANCES: 'VIP_ACCEPTANCES',
        AUDIT: 'VIP_AUDIT',
        SCHEMA: 'VIP_SCHEMA_VERSION'
    };

    // ===== ENUMS =====
    const VipProjectStatus = Object.freeze({
        DRAFT: 'DRAFT',
        ACTIVE: 'ACTIVE',
        COMPLETED: 'COMPLETED',
        ARCHIVED: 'ARCHIVED'
    });

    const WBSNodeStatus = Object.freeze({
        NEW: 'NEW',
        IN_PROGRESS: 'IN_PROGRESS',
        SUBMITTED: 'SUBMITTED',
        REWORK: 'REWORK',
        ACCEPTED: 'ACCEPTED',
        CLOSED: 'CLOSED'
    });

    const LotStatus = Object.freeze({
        DRAFT: 'DRAFT',
        PUBLISHED: 'PUBLISHED',
        RESERVED: 'RESERVED',
        IN_PROGRESS: 'IN_PROGRESS',
        SUBMITTED: 'SUBMITTED',
        REWORK: 'REWORK',
        ACCEPTED: 'ACCEPTED',
        CLOSED: 'CLOSED',
        CANCELLED: 'CANCELLED',
        EXPIRED: 'EXPIRED'
    });

    const LotType = Object.freeze({
        FIX: 'FIX',       // Фикс-цена, первый взял
        TENDER: 'TENDER'  // Тендер, выбор из откликов
    });

    const BidStatus = Object.freeze({
        PENDING: 'PENDING',
        ACCEPTED: 'ACCEPTED',
        REJECTED: 'REJECTED',
        WITHDRAWN: 'WITHDRAWN'
    });

    const AssignmentStatus = Object.freeze({
        ACTIVE: 'ACTIVE',
        SUBMITTED: 'SUBMITTED',
        REWORK: 'REWORK',
        ACCEPTED: 'ACCEPTED',
        TERMINATED: 'TERMINATED'
    });

    const ProofType = Object.freeze({
        MEASUREMENT: 'measurement',
        LEVEL: 'level',
        MATERIAL_LABEL: 'material_label',
        HIDDEN_WORK: 'hidden_work',
        PRESSURE_TEST: 'pressure_test',
        GENERAL: 'general'
    });

    // ===== STORAGE HELPER =====
    const VipStorage = {
        get(key) {
            try {
                return JSON.parse(localStorage.getItem(key) || '[]');
            } catch {
                return [];
            }
        },
        set(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('VIP storage error', e);
                return false;
            }
        },
        generateId(prefix = 'vip_') {
            return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        },
        checkSchema() {
            const cur = parseInt(localStorage.getItem(STORAGE_KEYS.SCHEMA) || '0');
            if (cur < VIP_SCHEMA_VERSION) {
                // Migration logic if needed
                localStorage.setItem(STORAGE_KEYS.SCHEMA, VIP_SCHEMA_VERSION.toString());
                console.log(`VIP schema migrated ${cur} → ${VIP_SCHEMA_VERSION}`);
            }
        }
    };
    VipStorage.checkSchema();

    // ===== MODEL: VipProject =====
    class VipProject {
        constructor(data = {}) {
            this.id = data.id || VipStorage.generateId('proj_');
            this.customerId = data.customerId || '';
            this.title = data.title || '';
            this.city = data.city || '';
            this.address = data.address || '';
            this.photo = data.photo || '';
            this.status = data.status || VipProjectStatus.DRAFT;
            this.wbsType = data.wbsType || null; // 'WBS20', 'WBS120', 'WBS1000'
            this.sectionsCount = data.sectionsCount || 1;
            this.floorsCount = data.floorsCount || 1;
            this.progressPercent = data.progressPercent || 0;
            this.lotsCount = data.lotsCount || 0;
            this.completedLotsCount = data.completedLotsCount || 0;
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        validate() {
            const err = [];
            if (!this.title) err.push('title');
            if (!this.city) err.push('city');
            return err;
        }

        save() {
            this.updatedAt = new Date().toISOString();
            const col = VipStorage.get(STORAGE_KEYS.PROJECTS);
            const idx = col.findIndex(p => p.id === this.id);
            if (idx >= 0) col[idx] = this;
            else col.push(this);
            VipStorage.set(STORAGE_KEYS.PROJECTS, col);
            return this;
        }

        delete() {
            const col = VipStorage.get(STORAGE_KEYS.PROJECTS);
            VipStorage.set(STORAGE_KEYS.PROJECTS, col.filter(p => p.id !== this.id));
            // Cascade delete WBS nodes, Lots, etc
            WBSNode.deleteByProject(this.id);
            Lot.deleteByProject(this.id);
        }

        recalcProgress() {
            const lots = Lot.findByProject(this.id);
            if (lots.length === 0) {
                this.progressPercent = 0;
                this.lotsCount = 0;
                this.completedLotsCount = 0;
            } else {
                this.lotsCount = lots.length;
                this.completedLotsCount = lots.filter(l => l.status === LotStatus.CLOSED).length;
                const progressSum = lots.reduce((sum, l) => {
                    const assignment = Assignment.findByLot(l.id);
                    return sum + (assignment ? assignment.progressPercent : 0);
                }, 0);
                this.progressPercent = Math.round(progressSum / lots.length);
            }
            this.save();
            return this;
        }

        static find(id) {
            const col = VipStorage.get(STORAGE_KEYS.PROJECTS);
            const data = col.find(p => p.id === id);
            return data ? new VipProject(data) : null;
        }

        static getAll() {
            return VipStorage.get(STORAGE_KEYS.PROJECTS).map(p => new VipProject(p));
        }

        static findByCustomer(customerId) {
            return VipStorage.get(STORAGE_KEYS.PROJECTS)
                .filter(p => p.customerId === customerId)
                .map(p => new VipProject(p));
        }
    }

    // ===== MODEL: WBSNode =====
    class WBSNode {
        constructor(data = {}) {
            this.id = data.id || VipStorage.generateId('wbs_');
            this.projectId = data.projectId || '';
            this.parentId = data.parentId || null;
            this.code = data.code || '';
            this.title = data.title || '';
            this.level = data.level || 0;
            this.order = data.order || 0;
            this.plannedQty = data.plannedQty || 0;
            this.unit = data.unit || '';
            this.tags = data.tags || [];
            this.status = data.status || WBSNodeStatus.NEW;
            this.progressPercent = data.progressPercent || 0;
            this.lotId = data.lotId || null; // Связанный лот
            this.sectionIndex = data.sectionIndex || null; // Для WBS-1000
            this.floorIndex = data.floorIndex || null; // Для WBS-1000
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        save() {
            const col = VipStorage.get(STORAGE_KEYS.WBS_NODES);
            const idx = col.findIndex(n => n.id === this.id);
            if (idx >= 0) col[idx] = this;
            else col.push(this);
            VipStorage.set(STORAGE_KEYS.WBS_NODES, col);
            return this;
        }

        delete() {
            const col = VipStorage.get(STORAGE_KEYS.WBS_NODES);
            VipStorage.set(STORAGE_KEYS.WBS_NODES, col.filter(n => n.id !== this.id));
        }

        getChildren() {
            return WBSNode.findByParent(this.id);
        }

        static find(id) {
            const col = VipStorage.get(STORAGE_KEYS.WBS_NODES);
            const data = col.find(n => n.id === id);
            return data ? new WBSNode(data) : null;
        }

        static findByProject(projectId) {
            return VipStorage.get(STORAGE_KEYS.WBS_NODES)
                .filter(n => n.projectId === projectId)
                .map(n => new WBSNode(n))
                .sort((a, b) => a.order - b.order);
        }

        static findByParent(parentId) {
            return VipStorage.get(STORAGE_KEYS.WBS_NODES)
                .filter(n => n.parentId === parentId)
                .map(n => new WBSNode(n))
                .sort((a, b) => a.order - b.order);
        }

        static findRoots(projectId) {
            return VipStorage.get(STORAGE_KEYS.WBS_NODES)
                .filter(n => n.projectId === projectId && !n.parentId)
                .map(n => new WBSNode(n))
                .sort((a, b) => a.order - b.order);
        }

        static deleteByProject(projectId) {
            const col = VipStorage.get(STORAGE_KEYS.WBS_NODES);
            VipStorage.set(STORAGE_KEYS.WBS_NODES, col.filter(n => n.projectId !== projectId));
        }

        static search(projectId, query) {
            const q = query.toLowerCase();
            return WBSNode.findByProject(projectId)
                .filter(n => n.code.toLowerCase().includes(q) || n.title.toLowerCase().includes(q));
        }
    }

    // ===== MODEL: Lot =====
    class Lot {
        constructor(data = {}) {
            this.id = data.id || VipStorage.generateId('lot_');
            this.projectId = data.projectId || '';
            this.wbsNodeIds = data.wbsNodeIds || [];
            this.title = data.title || '';
            this.description = data.description || '';
            this.type = data.type || LotType.FIX;
            this.status = data.status || LotStatus.DRAFT;
            this.budget = data.budget || 0;
            this.deadlineStart = data.deadlineStart || null;
            this.deadlineEnd = data.deadlineEnd || null;
            this.city = data.city || '';
            this.tags = data.tags || [];
            this.requirementsJson = data.requirementsJson || null;
            this.assignedExecutorId = data.assignedExecutorId || null;
            this.bidsCount = data.bidsCount || 0;
            this.viewsCount = data.viewsCount || 0;
            this.publishedAt = data.publishedAt || null;
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        validate() {
            const errors = [];
            if (!this.title) errors.push('Укажите название лота');
            if (!this.budget || this.budget <= 0) errors.push('Укажите бюджет');
            if (!this.deadlineEnd) errors.push('Укажите срок завершения');
            if (this.wbsNodeIds.length === 0) errors.push('Выберите работы из WBS');

            // Validate dates
            if (this.deadlineStart && this.deadlineEnd) {
                const startDate = new Date(this.deadlineStart);
                const endDate = new Date(this.deadlineEnd);

                if (isNaN(startDate.getTime())) {
                    errors.push('Некорректная дата начала');
                }
                if (isNaN(endDate.getTime())) {
                    errors.push('Некорректная дата завершения');
                }

                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                    if (endDate <= startDate) {
                        errors.push('Дата завершения должна быть позже даты начала');
                    }
                }
            }

            // Check if deadline is in the past (only for new lots in DRAFT status)
            if (this.deadlineEnd && this.status === 'DRAFT') {
                const endDate = new Date(this.deadlineEnd);
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Reset time to start of day

                if (!isNaN(endDate.getTime()) && endDate < today) {
                    errors.push('Дата завершения не может быть в прошлом');
                }
            }

            return errors;
        }

        save() {
            this.updatedAt = new Date().toISOString();
            const col = VipStorage.get(STORAGE_KEYS.LOTS);
            const idx = col.findIndex(l => l.id === this.id);
            if (idx >= 0) col[idx] = this;
            else col.push(this);
            VipStorage.set(STORAGE_KEYS.LOTS, col);
            return this;
        }

        delete() {
            // Освобождаем привязанные WBS-узлы
            if (this.wbsNodeIds && this.wbsNodeIds.length > 0) {
                const nodesCol = VipStorage.get(STORAGE_KEYS.WBS_NODES);
                let changed = false;
                nodesCol.forEach(n => {
                    if (n.lotId === this.id) {
                        n.lotId = null;
                        n.status = WBSNodeStatus.NEW;
                        changed = true;
                    }
                });
                if (changed) {
                    VipStorage.set(STORAGE_KEYS.WBS_NODES, nodesCol);
                }
            }

            // Удаляем связанные отклики и назначения
            Bid.deleteByLot(this.id);
            Assignment.deleteByLot(this.id);

            // Удаляем сам лот
            const col = VipStorage.get(STORAGE_KEYS.LOTS);
            VipStorage.set(STORAGE_KEYS.LOTS, col.filter(l => l.id !== this.id));
        }

        static find(id) {
            const col = VipStorage.get(STORAGE_KEYS.LOTS);
            const data = col.find(l => l.id === id);
            return data ? new Lot(data) : null;
        }

        static findByProject(projectId) {
            return VipStorage.get(STORAGE_KEYS.LOTS)
                .filter(l => l.projectId === projectId)
                .map(l => new Lot(l))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findPublished(filters = {}) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const allLots = VipStorage.get(STORAGE_KEYS.LOTS);
            const publishedLots = [];

            for (const l of allLots) {
                if (l.status !== LotStatus.PUBLISHED) continue;

                // Проверяем истёк ли дедлайн
                if (l.deadlineEnd) {
                    const deadline = new Date(l.deadlineEnd);
                    if (!isNaN(deadline.getTime()) && deadline < today) {
                        // Автоматически помечаем как истёкший
                        l.status = LotStatus.EXPIRED;
                        continue;
                    }
                }

                // Применяем фильтры
                if (filters.city && l.city !== filters.city) continue;
                if (filters.tag && (!l.tags || !l.tags.includes(filters.tag))) continue;
                if (filters.budgetMax && l.budget > filters.budgetMax) continue;
                if (filters.budgetMin && l.budget < filters.budgetMin) continue;

                publishedLots.push(new Lot(l));
            }

            // Сохраняем изменения (истёкшие лоты)
            VipStorage.set(STORAGE_KEYS.LOTS, allLots);

            return publishedLots.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        }

        static deleteByProject(projectId) {
            const col = VipStorage.get(STORAGE_KEYS.LOTS);
            const lotsToDelete = col.filter(l => l.projectId === projectId);
            lotsToDelete.forEach(l => {
                Bid.deleteByLot(l.id);
                Assignment.deleteByLot(l.id);
            });
            VipStorage.set(STORAGE_KEYS.LOTS, col.filter(l => l.projectId !== projectId));
        }

        static getAll() {
            return VipStorage.get(STORAGE_KEYS.LOTS).map(l => new Lot(l));
        }
    }

    // ===== MODEL: Bid =====
    class Bid {
        constructor(data = {}) {
            this.id = data.id || VipStorage.generateId('bid_');
            this.lotId = data.lotId || '';
            this.executorId = data.executorId || '';
            this.executorName = data.executorName || '';
            this.price = data.price || 0;
            this.duration = data.duration || 0; // days
            this.comment = data.comment || '';
            this.status = data.status || BidStatus.PENDING;
            this.rejectionReason = data.rejectionReason || '';
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        save() {
            const col = VipStorage.get(STORAGE_KEYS.BIDS);
            const idx = col.findIndex(b => b.id === this.id);
            const isNew = idx < 0;

            if (idx >= 0) {
                col[idx] = this;
            } else {
                col.push(this);
            }
            VipStorage.set(STORAGE_KEYS.BIDS, col);

            // Update lot bids count - count directly from the saved collection
            // This ensures accuracy regardless of timing
            const lot = Lot.find(this.lotId);
            if (lot) {
                // Count bids for this lot directly from the collection we just saved
                const bidsForLot = col.filter(b => b.lotId === this.lotId);
                lot.bidsCount = bidsForLot.length;
                lot.save();
            }
            return this;
        }

        static find(id) {
            const col = VipStorage.get(STORAGE_KEYS.BIDS);
            const data = col.find(b => b.id === id);
            return data ? new Bid(data) : null;
        }

        static findByLot(lotId) {
            return VipStorage.get(STORAGE_KEYS.BIDS)
                .filter(b => b.lotId === lotId)
                .map(b => new Bid(b))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findByExecutor(executorId) {
            return VipStorage.get(STORAGE_KEYS.BIDS)
                .filter(b => b.executorId === executorId)
                .map(b => new Bid(b));
        }

        static existsForLot(lotId, executorId) {
            return VipStorage.get(STORAGE_KEYS.BIDS)
                .some(b => b.lotId === lotId && b.executorId === executorId);
        }

        static deleteByLot(lotId) {
            const col = VipStorage.get(STORAGE_KEYS.BIDS);
            VipStorage.set(STORAGE_KEYS.BIDS, col.filter(b => b.lotId !== lotId));
        }
    }

    // ===== MODEL: Assignment =====
    class Assignment {
        constructor(data = {}) {
            this.id = data.id || VipStorage.generateId('asgn_');
            this.lotId = data.lotId || '';
            this.executorId = data.executorId || '';
            this.executorName = data.executorName || '';
            this.bidId = data.bidId || null; // If from tender
            this.agreedPrice = data.agreedPrice || 0;
            this.agreedDuration = data.agreedDuration || 0;
            this.status = data.status || AssignmentStatus.ACTIVE;
            this.progressPercent = data.progressPercent || 0;
            this.startedAt = data.startedAt || new Date().toISOString();
            this.submittedAt = data.submittedAt || null;
            this.acceptedAt = data.acceptedAt || null;
            this.reworkCount = data.reworkCount || 0;
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        save() {
            const col = VipStorage.get(STORAGE_KEYS.ASSIGNMENTS);
            const idx = col.findIndex(a => a.id === this.id);

            // Проверка на дубли - нельзя иметь более одного назначения на лот
            if (idx < 0) { // Новое назначение
                const existingForLot = col.find(a => a.lotId === this.lotId);
                if (existingForLot) {
                    console.warn(`Assignment already exists for lot ${this.lotId}`);
                    // Возвращаем существующее назначение вместо создания нового
                    return new Assignment(existingForLot);
                }
            }

            if (idx >= 0) col[idx] = this;
            else col.push(this);
            VipStorage.set(STORAGE_KEYS.ASSIGNMENTS, col);
            return this;
        }

        recalcProgress() {
            const reports = Report.findByAssignment(this.id);
            if (!reports || reports.length === 0) {
                this.progressPercent = 0;
            } else {
                // Progress = max checkpoint completed
                // Filter out null/undefined checkpoints and ensure valid numbers
                const validCheckpoints = reports
                    .map(r => r.checkpoint)
                    .filter(c => typeof c === 'number' && !isNaN(c) && c >= 0);

                if (validCheckpoints.length === 0) {
                    this.progressPercent = 0;
                } else {
                    const maxCheckpoint = Math.max(...validCheckpoints);
                    // Ensure result is within 0-100 range
                    this.progressPercent = Math.min(100, Math.max(0, maxCheckpoint));
                }
            }
            this.save();
            return this;
        }

        static find(id) {
            const col = VipStorage.get(STORAGE_KEYS.ASSIGNMENTS);
            const data = col.find(a => a.id === id);
            return data ? new Assignment(data) : null;
        }

        static findByLot(lotId) {
            const col = VipStorage.get(STORAGE_KEYS.ASSIGNMENTS);
            const data = col.find(a => a.lotId === lotId);
            return data ? new Assignment(data) : null;
        }

        static findByExecutor(executorId) {
            return VipStorage.get(STORAGE_KEYS.ASSIGNMENTS)
                .filter(a => a.executorId === executorId)
                .map(a => new Assignment(a))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static deleteByLot(lotId) {
            const col = VipStorage.get(STORAGE_KEYS.ASSIGNMENTS);
            const toDelete = col.filter(a => a.lotId === lotId);
            toDelete.forEach(a => Report.deleteByAssignment(a.id));
            VipStorage.set(STORAGE_KEYS.ASSIGNMENTS, col.filter(a => a.lotId !== lotId));
        }
    }

    // ===== MODEL: Report =====
    class Report {
        constructor(data = {}) {
            this.id = data.id || VipStorage.generateId('rpt_');
            this.assignmentId = data.assignmentId || '';
            this.checkpoint = data.checkpoint || 0; // 0, 25, 50, 75, 100
            this.photos = data.photos || []; // Array of { url, proofType, comment }
            this.comment = data.comment || '';
            this.proofTypes = data.proofTypes || []; // ['measurement', 'level', etc]
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        save() {
            const col = VipStorage.get(STORAGE_KEYS.REPORTS);
            const idx = col.findIndex(r => r.id === this.id);
            if (idx >= 0) col[idx] = this;
            else col.push(this);
            VipStorage.set(STORAGE_KEYS.REPORTS, col);
            // Recalc assignment progress
            const assignment = Assignment.find(this.assignmentId);
            if (assignment) assignment.recalcProgress();
            return this;
        }

        static find(id) {
            const col = VipStorage.get(STORAGE_KEYS.REPORTS);
            const data = col.find(r => r.id === id);
            return data ? new Report(data) : null;
        }

        static findByAssignment(assignmentId) {
            return VipStorage.get(STORAGE_KEYS.REPORTS)
                .filter(r => r.assignmentId === assignmentId)
                .map(r => new Report(r))
                .sort((a, b) => a.checkpoint - b.checkpoint);
        }

        static findByCheckpoint(assignmentId, checkpoint) {
            const col = VipStorage.get(STORAGE_KEYS.REPORTS);
            const data = col.find(r => r.assignmentId === assignmentId && r.checkpoint === checkpoint);
            return data ? new Report(data) : null;
        }

        static deleteByAssignment(assignmentId) {
            const col = VipStorage.get(STORAGE_KEYS.REPORTS);
            VipStorage.set(STORAGE_KEYS.REPORTS, col.filter(r => r.assignmentId !== assignmentId));
        }
    }

    // ===== MODEL: Acceptance =====
    class Acceptance {
        constructor(data = {}) {
            this.id = data.id || VipStorage.generateId('acc_');
            this.assignmentId = data.assignmentId || '';
            this.lotId = data.lotId || '';
            this.decision = data.decision || ''; // 'accepted' | 'rework'
            this.comment = data.comment || '';
            this.createdBy = data.createdBy || '';
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        save() {
            const col = VipStorage.get(STORAGE_KEYS.ACCEPTANCES);
            col.push(this);
            VipStorage.set(STORAGE_KEYS.ACCEPTANCES, col);
            return this;
        }

        static findByAssignment(assignmentId) {
            return VipStorage.get(STORAGE_KEYS.ACCEPTANCES)
                .filter(a => a.assignmentId === assignmentId)
                .map(a => new Acceptance(a))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    }

    // ===== PHOTO REQUIREMENTS TEMPLATES =====
    const PHOTO_REQUIREMENTS = {
        foundation: {
            checkpoints: [0, 25, 50, 75, 100],
            minPhotos: { 0: 3, 25: 2, 50: 2, 75: 2, 100: 5 },
            proofTypes: [ProofType.MEASUREMENT, ProofType.LEVEL, ProofType.MATERIAL_LABEL, ProofType.HIDDEN_WORK],
            requiredProofs: {
                25: [ProofType.HIDDEN_WORK],
                100: [ProofType.LEVEL, ProofType.MEASUREMENT]
            }
        },
        electrical: {
            checkpoints: [0, 50, 100],
            minPhotos: { 0: 2, 50: 3, 100: 4 },
            proofTypes: [ProofType.HIDDEN_WORK, ProofType.MEASUREMENT],
            requiredProofs: {
                50: [ProofType.HIDDEN_WORK]
            }
        },
        plumbing: {
            checkpoints: [0, 50, 100],
            minPhotos: { 0: 2, 50: 3, 100: 3 },
            proofTypes: [ProofType.HIDDEN_WORK, ProofType.PRESSURE_TEST],
            requiredProofs: {
                50: [ProofType.HIDDEN_WORK, ProofType.PRESSURE_TEST]
            }
        },
        hvac: {
            checkpoints: [0, 50, 100],
            minPhotos: { 0: 2, 50: 2, 100: 4 },
            proofTypes: [ProofType.HIDDEN_WORK],
            requiredProofs: {}
        },
        finish: {
            checkpoints: [0, 50, 100],
            minPhotos: { 0: 2, 50: 2, 100: 4 },
            proofTypes: [ProofType.MATERIAL_LABEL],
            requiredProofs: {}
        },
        structure: {
            checkpoints: [0, 25, 50, 75, 100],
            minPhotos: { 0: 3, 25: 3, 50: 3, 75: 2, 100: 5 },
            proofTypes: [ProofType.MEASUREMENT, ProofType.LEVEL, ProofType.HIDDEN_WORK],
            requiredProofs: {
                25: [ProofType.HIDDEN_WORK],
                50: [ProofType.LEVEL]
            }
        },
        default: {
            checkpoints: [0, 50, 100],
            minPhotos: { 0: 2, 50: 2, 100: 3 },
            proofTypes: [ProofType.GENERAL],
            requiredProofs: {}
        }
    };

    // Helper to get requirements by tags
    function getRequirementsForTags(tags) {
        if (!tags || tags.length === 0) return PHOTO_REQUIREMENTS.default;

        // Find first matching template
        for (const tag of tags) {
            if (PHOTO_REQUIREMENTS[tag]) {
                return PHOTO_REQUIREMENTS[tag];
            }
        }
        return PHOTO_REQUIREMENTS.default;
    }

    // ===== AUDIT LOG =====
    class VipAuditLog {
        static log(entity, id, action, meta = {}) {
            const entry = {
                id: VipStorage.generateId('audit_'),
                entity,
                entityId: id,
                action,
                meta,
                createdAt: new Date().toISOString()
            };
            const logs = VipStorage.get(STORAGE_KEYS.AUDIT);
            logs.push(entry);
            if (logs.length > 1000) logs.splice(0, logs.length - 1000);
            VipStorage.set(STORAGE_KEYS.AUDIT, logs);
        }

        static getByEntity(entity, entityId) {
            return VipStorage.get(STORAGE_KEYS.AUDIT)
                .filter(l => l.entity === entity && l.entityId === entityId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    }

    // ===== EXPORT =====
    window.VipModels = {
        // Enums
        VipProjectStatus,
        WBSNodeStatus,
        LotStatus,
        LotType,
        BidStatus,
        AssignmentStatus,
        ProofType,

        // Models
        VipProject,
        WBSNode,
        Lot,
        Bid,
        Assignment,
        Report,
        Acceptance,
        VipAuditLog,

        // Photo requirements
        PHOTO_REQUIREMENTS,
        getRequirementsForTags,

        // Storage
        VipStorage,
        STORAGE_KEYS
    };

    console.log('✅ VIP Models v2.0 loaded');
})();
