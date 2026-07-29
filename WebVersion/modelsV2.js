// ========== MODELS V2 — Extended Entities ==========
// Дополнительные модели: Bid, Contract, Dispute, EngineerTask, QualityCheck
// Работают поверх существующего models.js

(function () {
    'use strict';

    if (!window.Models) {
        console.error('[ModelsV2] window.Models not loaded. Ensure models.js is included first.');
        return;
    }

    const { Storage, generateId } = window.Models._internal || {};
    
    // Fallback storage helpers if _internal not exposed
    const _Storage = Storage || {
        get: (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } },
        set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error('Storage error:', e); } },
        getAll: (prefix) => {
            const result = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    try { result.push(JSON.parse(localStorage.getItem(key))); } catch {}
                }
            }
            return result;
        },
        remove: (key) => { localStorage.removeItem(key); }
    };

    function _genId(prefix = '') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // ========== ENUMS ==========

    const BidStatus = Object.freeze({
        PENDING: 'pending',
        VIEWED: 'viewed',
        SHORTLISTED: 'shortlisted',
        ACCEPTED: 'accepted',
        REJECTED: 'rejected',
        WITHDRAWN: 'withdrawn'
    });

    const ContractStatus = Object.freeze({
        DRAFT: 'draft',
        SENT: 'sent',
        CUSTOMER_SIGNED: 'customer_signed',
        EXECUTOR_SIGNED: 'executor_signed',
        ACTIVE: 'active',
        COMPLETED: 'completed',
        DISPUTED: 'disputed',
        CANCELLED: 'cancelled'
    });

    const EscrowStatus = Object.freeze({
        PENDING: 'pending',
        FROZEN: 'frozen',
        RELEASED: 'released',
        REFUNDED: 'refunded',
        DISPUTED: 'disputed',
        PARTIAL_RELEASE: 'partial_release'
    });

    const EngineerTaskStatus = Object.freeze({
        PENDING: 'pending',
        ASSIGNED: 'assigned',
        IN_REVIEW: 'in_review',
        APPROVED: 'approved',
        NEEDS_REVISION: 'needs_revision',
        REJECTED: 'rejected',
        COMPLETED: 'completed'
    });

    const EngineerTaskType = Object.freeze({
        ESTIMATE_REVIEW: 'estimate_review',
        SITE_INSPECTION: 'site_inspection',
        DESIGN_REVIEW: 'design_review',
        PROGRESS_CHECK: 'progress_check',
        FINAL_INSPECTION: 'final_inspection'
    });

    const QualityCheckStatus = Object.freeze({
        PENDING: 'pending',
        IN_PROGRESS: 'in_progress',
        ACCEPTED: 'accepted',
        WITH_COMMENTS: 'with_comments',
        REWORK_REQUIRED: 'rework_required',
        DISPUTE_OPENED: 'dispute_opened',
        COMPLETED: 'completed'
    });

    const QualityCheckType = Object.freeze({
        INTERIM: 'interim',
        MILESTONE: 'milestone',
        FINAL: 'final',
        DEFECT_RECHECK: 'defect_recheck'
    });

    const DisputeStatus = Object.freeze({
        OPEN: 'open',
        UNDER_REVIEW: 'under_review',
        EVIDENCE_REQUESTED: 'evidence_requested',
        MEDIATION: 'mediation',
        RESOLVED_FOR_CUSTOMER: 'resolved_for_customer',
        RESOLVED_FOR_EXECUTOR: 'resolved_for_executor',
        RESOLVED_COMPROMISE: 'resolved_compromise',
        ESCALATED: 'escalated',
        CLOSED: 'closed'
    });

    const DisputeCategory = Object.freeze({
        QUALITY: 'quality',
        DEADLINE: 'deadline',
        PAYMENT: 'payment',
        SCOPE_CHANGE: 'scope_change',
        COMMUNICATION: 'communication',
        MATERIALS: 'materials',
        OTHER: 'other'
    });

    // ========== MODEL: BID (Отклик исполнителя) ==========

    class Bid {
        constructor(data = {}) {
            this.id = data.id || _genId('bid_');
            this.orderId = data.orderId || '';
            this.executorId = data.executorId || '';
            this.status = data.status || BidStatus.PENDING;
            this.price = data.price || 0;
            this.priceType = data.priceType || 'fixed';
            this.durationDays = data.durationDays || null;
            this.startDate = data.startDate || null;
            this.comment = data.comment || '';
            this.attachments = data.attachments || [];
            this.rejectionReason = data.rejectionReason || '';
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        validate() {
            const errors = [];
            if (!this.orderId) errors.push('Не указан заказ');
            if (!this.executorId) errors.push('Не указан исполнитель');
            if (!this.price || this.price <= 0) errors.push('Укажите цену (больше 0)');
            if (!this.durationDays || this.durationDays <= 0) errors.push('Укажите срок выполнения');
            return errors;
        }

        save() {
            this.updatedAt = new Date().toISOString();
            _Storage.set(`bid_${this.id}`, this);
            return this;
        }

        delete() { _Storage.remove(`bid_${this.id}`); }

        static find(id) {
            const data = _Storage.get(`bid_${id}`);
            return data ? new Bid(data) : null;
        }

        static findByOrder(orderId) {
            return _Storage.getAll('bid_')
                .filter(b => b.orderId === orderId)
                .map(b => new Bid(b))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findByExecutor(executorId, status = null) {
            return _Storage.getAll('bid_')
                .filter(b => b.executorId === executorId && (!status || b.status === status))
                .map(b => new Bid(b))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static existsForOrder(orderId, executorId) {
            return _Storage.getAll('bid_')
                .some(b => b.orderId === orderId && b.executorId === executorId);
        }

        static countByOrder(orderId) {
            return _Storage.getAll('bid_').filter(b => b.orderId === orderId).length;
        }
    }

    // ========== MODEL: CONTRACT (Договор) ==========

    class Contract {
        constructor(data = {}) {
            this.id = data.id || _genId('contract_');
            this.orderId = data.orderId || '';
            this.customerId = data.customerId || '';
            this.executorId = data.executorId || '';
            this.bidId = data.bidId || null;
            this.status = data.status || ContractStatus.DRAFT;
            this.title = data.title || '';
            this.description = data.description || '';
            this.totalAmount = data.totalAmount || 0;
            this.currency = data.currency || 'KZT';
            this.commissionRate = data.commissionRate || 0.03;
            this.commissionAmount = data.commissionAmount || 0;
            this.startDate = data.startDate || null;
            this.endDate = data.endDate || null;
            this.terms = data.terms || {}; // milestones, penalties, etc.
            this.signedByCustomerAt = data.signedByCustomerAt || null;
            this.signedByExecutorAt = data.signedByExecutorAt || null;
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
            this.completedAt = data.completedAt || null;
            this.cancelledAt = data.cancelledAt || null;
        }

        validate() {
            const errors = [];
            if (!this.orderId) errors.push('Не указан заказ');
            if (!this.customerId) errors.push('Не указан заказчик');
            if (!this.executorId) errors.push('Не указан исполнитель');
            if (!this.totalAmount || this.totalAmount <= 0) errors.push('Укажите сумму договора');
            if (!this.title || this.title.length < 5) errors.push('Укажите название договора');
            return errors;
        }

        calculateCommission() {
            this.commissionAmount = Math.round(this.totalAmount * this.commissionRate);
            return this.commissionAmount;
        }

        signByCustomer() {
            this.signedByCustomerAt = new Date().toISOString();
            if (this.status === ContractStatus.DRAFT || this.status === ContractStatus.SENT) {
                this.status = ContractStatus.CUSTOMER_SIGNED;
            }
            if (this.signedByExecutorAt) {
                this.status = ContractStatus.ACTIVE;
            }
            return this;
        }

        signByExecutor() {
            this.signedByExecutorAt = new Date().toISOString();
            if (this.status === ContractStatus.DRAFT || this.status === ContractStatus.SENT || 
                this.status === ContractStatus.CUSTOMER_SIGNED) {
                this.status = ContractStatus.EXECUTOR_SIGNED;
            }
            if (this.signedByCustomerAt) {
                this.status = ContractStatus.ACTIVE;
            }
            return this;
        }

        save() {
            this.updatedAt = new Date().toISOString();
            _Storage.set(`contract_${this.id}`, this);
            return this;
        }

        delete() { _Storage.remove(`contract_${this.id}`); }

        static find(id) {
            const data = _Storage.get(`contract_${id}`);
            return data ? new Contract(data) : null;
        }

        static findByOrder(orderId) {
            return _Storage.getAll('contract_')
                .filter(c => c.orderId === orderId)
                .map(c => new Contract(c));
        }

        static findByUser(userId) {
            return _Storage.getAll('contract_')
                .filter(c => c.customerId === userId || c.executorId === userId)
                .map(c => new Contract(c))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findActive() {
            return _Storage.getAll('contract_')
                .filter(c => c.status === ContractStatus.ACTIVE)
                .map(c => new Contract(c));
        }

        /**
         * Create contract from accepted bid
         */
        static createFromBid(order, bid) {
            const contract = new Contract({
                orderId: order.id,
                customerId: order.customerId,
                executorId: bid.executorId,
                bidId: bid.id,
                title: `Договор: ${order.title}`,
                description: order.description,
                totalAmount: bid.price,
                startDate: bid.startDate || new Date().toISOString(),
            });

            if (bid.durationDays) {
                const end = new Date(contract.startDate);
                end.setDate(end.getDate() + bid.durationDays);
                contract.endDate = end.toISOString();
            }

            contract.calculateCommission();
            contract.status = ContractStatus.SENT;
            return contract.save();
        }
    }

    // ========== MODEL: ESCROW ==========

    class Escrow {
        constructor(data = {}) {
            this.id = data.id || _genId('escrow_');
            this.contractId = data.contractId || '';
            this.orderId = data.orderId || '';
            this.payerId = data.payerId || '';
            this.payeeId = data.payeeId || '';
            this.amount = data.amount || 0;
            this.currency = data.currency || 'KZT';
            this.status = data.status || EscrowStatus.PENDING;
            this.milestoneName = data.milestoneName || null;
            this.frozenAt = data.frozenAt || null;
            this.releasedAt = data.releasedAt || null;
            this.refundedAt = data.refundedAt || null;
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        freeze() {
            this.status = EscrowStatus.FROZEN;
            this.frozenAt = new Date().toISOString();
            return this;
        }

        release() {
            if (this.status !== EscrowStatus.FROZEN) return false;
            this.status = EscrowStatus.RELEASED;
            this.releasedAt = new Date().toISOString();
            return this;
        }

        refund() {
            if (this.status !== EscrowStatus.FROZEN) return false;
            this.status = EscrowStatus.REFUNDED;
            this.refundedAt = new Date().toISOString();
            return this;
        }

        save() {
            this.updatedAt = new Date().toISOString();
            _Storage.set(`escrow_${this.id}`, this);
            return this;
        }

        static find(id) {
            const data = _Storage.get(`escrow_${id}`);
            return data ? new Escrow(data) : null;
        }

        static findByContract(contractId) {
            return _Storage.getAll('escrow_')
                .filter(e => e.contractId === contractId)
                .map(e => new Escrow(e));
        }

        static findByOrder(orderId) {
            return _Storage.getAll('escrow_')
                .filter(e => e.orderId === orderId)
                .map(e => new Escrow(e));
        }
    }

    // ========== MODEL: ENGINEER TASK ==========

    class EngineerTask {
        constructor(data = {}) {
            this.id = data.id || _genId('engtask_');
            this.orderId = data.orderId || '';
            this.engineerId = data.engineerId || null;
            this.estimateId = data.estimateId || null;
            this.status = data.status || EngineerTaskStatus.PENDING;
            this.taskType = data.taskType || EngineerTaskType.ESTIMATE_REVIEW;
            this.priority = data.priority || 'normal';
            this.title = data.title || '';
            this.description = data.description || '';
            this.originalData = data.originalData || null; // JSON
            this.revisedData = data.revisedData || null; // JSON
            this.comments = data.comments || []; // [{text, author, authorRole, createdAt}]
            this.conclusion = data.conclusion || '';
            this.attachments = data.attachments || [];
            this.assignedAt = data.assignedAt || null;
            this.startedAt = data.startedAt || null;
            this.completedAt = data.completedAt || null;
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        addComment(text, author, authorRole) {
            this.comments.push({
                text,
                author,
                authorRole,
                createdAt: new Date().toISOString()
            });
            return this;
        }

        approve(conclusion) {
            this.status = EngineerTaskStatus.APPROVED;
            this.conclusion = conclusion || 'Утверждено';
            this.completedAt = new Date().toISOString();
            return this;
        }

        requestRevision(reason) {
            this.status = EngineerTaskStatus.NEEDS_REVISION;
            this.addComment(reason, 'Инженер', 'engineer');
            return this;
        }

        reject(reason) {
            this.status = EngineerTaskStatus.REJECTED;
            this.conclusion = reason || 'Отклонено';
            this.completedAt = new Date().toISOString();
            return this;
        }

        validate() {
            const errors = [];
            if (!this.orderId) errors.push('Не указан заказ');
            if (!this.title || this.title.length < 3) errors.push('Укажите название задачи');
            return errors;
        }

        save() {
            this.updatedAt = new Date().toISOString();
            _Storage.set(`engtask_${this.id}`, this);
            return this;
        }

        delete() { _Storage.remove(`engtask_${this.id}`); }

        static find(id) {
            const data = _Storage.get(`engtask_${id}`);
            return data ? new EngineerTask(data) : null;
        }

        static findByOrder(orderId) {
            return _Storage.getAll('engtask_')
                .filter(t => t.orderId === orderId)
                .map(t => new EngineerTask(t))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findByEngineer(engineerId, status = null) {
            return _Storage.getAll('engtask_')
                .filter(t => t.engineerId === engineerId && (!status || t.status === status))
                .map(t => new EngineerTask(t))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findPending() {
            return _Storage.getAll('engtask_')
                .filter(t => t.status === EngineerTaskStatus.PENDING)
                .map(t => new EngineerTask(t));
        }
    }

    // ========== MODEL: QUALITY CHECK ==========

    class QualityCheck {
        constructor(data = {}) {
            this.id = data.id || _genId('qc_');
            this.orderId = data.orderId || '';
            this.workId = data.workId || null;
            this.controllerId = data.controllerId || null;
            this.status = data.status || QualityCheckStatus.PENDING;
            this.checkType = data.checkType || QualityCheckType.FINAL;
            this.photosBefore = data.photosBefore || [];
            this.photosAfter = data.photosAfter || [];
            this.defectsFound = data.defectsFound || []; // [{title, description, severity, photos}]
            this.defectsCount = data.defectsCount || 0;
            this.defectsResolved = data.defectsResolved || 0;
            this.comments = data.comments || []; // [{text, author, authorRole, createdAt}]
            this.conclusion = data.conclusion || '';
            this.rating = data.rating || null; // 1-5
            this.assignedAt = data.assignedAt || null;
            this.startedAt = data.startedAt || null;
            this.completedAt = data.completedAt || null;
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        addDefect(defect) {
            this.defectsFound.push({
                id: _genId('qcdef_'),
                title: defect.title || '',
                description: defect.description || '',
                severity: defect.severity || 'medium',
                photos: defect.photos || [],
                status: 'new',
                createdAt: new Date().toISOString()
            });
            this.defectsCount = this.defectsFound.length;
            return this;
        }

        addComment(text, author, authorRole) {
            this.comments.push({
                text,
                author,
                authorRole,
                createdAt: new Date().toISOString()
            });
            return this;
        }

        accept(conclusion, rating) {
            this.status = QualityCheckStatus.ACCEPTED;
            this.conclusion = conclusion || 'Работа принята';
            this.rating = rating || 5;
            this.completedAt = new Date().toISOString();
            return this;
        }

        requireRework(reason) {
            this.status = QualityCheckStatus.REWORK_REQUIRED;
            this.addComment(reason, 'Контролёр', 'controller');
            return this;
        }

        openDispute(reason) {
            this.status = QualityCheckStatus.DISPUTE_OPENED;
            this.addComment(reason, 'Контролёр', 'controller');
            return this;
        }

        validate() {
            const errors = [];
            if (!this.orderId) errors.push('Не указан заказ');
            return errors;
        }

        save() {
            this.updatedAt = new Date().toISOString();
            _Storage.set(`qc_${this.id}`, this);
            return this;
        }

        delete() { _Storage.remove(`qc_${this.id}`); }

        static find(id) {
            const data = _Storage.get(`qc_${id}`);
            return data ? new QualityCheck(data) : null;
        }

        static findByOrder(orderId) {
            return _Storage.getAll('qc_')
                .filter(q => q.orderId === orderId)
                .map(q => new QualityCheck(q))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findByController(controllerId, status = null) {
            return _Storage.getAll('qc_')
                .filter(q => q.controllerId === controllerId && (!status || q.status === status))
                .map(q => new QualityCheck(q))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findPending() {
            return _Storage.getAll('qc_')
                .filter(q => q.status === QualityCheckStatus.PENDING)
                .map(q => new QualityCheck(q));
        }
    }

    // ========== MODEL: DISPUTE ==========

    class Dispute {
        constructor(data = {}) {
            this.id = data.id || _genId('dispute_');
            this.orderId = data.orderId || '';
            this.contractId = data.contractId || null;
            this.initiatorId = data.initiatorId || '';
            this.respondentId = data.respondentId || '';
            this.moderatorId = data.moderatorId || null;
            this.status = data.status || DisputeStatus.OPEN;
            this.category = data.category || DisputeCategory.OTHER;
            this.title = data.title || '';
            this.description = data.description || '';
            this.evidence = data.evidence || []; // [{type, url, description, uploadedBy, uploadedAt}]
            this.initiatorAmount = data.initiatorAmount || null;
            this.resolvedAmount = data.resolvedAmount || null;
            this.resolutionText = data.resolutionText || '';
            this.priority = data.priority || 'normal';
            this.deadline = data.deadline || null;
            this.openedAt = data.openedAt || new Date().toISOString();
            this.resolvedAt = data.resolvedAt || null;
            this.closedAt = data.closedAt || null;
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        addEvidence(evidence) {
            this.evidence.push({
                id: _genId('ev_'),
                type: evidence.type || 'document', // photo | document | text | video
                url: evidence.url || '',
                description: evidence.description || '',
                uploadedBy: evidence.uploadedBy || '',
                uploadedAt: new Date().toISOString()
            });
            return this;
        }

        resolveForCustomer(resolution, amount) {
            this.status = DisputeStatus.RESOLVED_FOR_CUSTOMER;
            this.resolutionText = resolution;
            this.resolvedAmount = amount;
            this.resolvedAt = new Date().toISOString();
            return this;
        }

        resolveForExecutor(resolution) {
            this.status = DisputeStatus.RESOLVED_FOR_EXECUTOR;
            this.resolutionText = resolution;
            this.resolvedAt = new Date().toISOString();
            return this;
        }

        resolveCompromise(resolution, amount) {
            this.status = DisputeStatus.RESOLVED_COMPROMISE;
            this.resolutionText = resolution;
            this.resolvedAmount = amount;
            this.resolvedAt = new Date().toISOString();
            return this;
        }

        validate() {
            const errors = [];
            if (!this.orderId) errors.push('Не указан заказ');
            if (!this.initiatorId) errors.push('Не указан инициатор');
            if (!this.respondentId) errors.push('Не указан ответчик');
            if (!this.title || this.title.length < 5) errors.push('Укажите тему спора');
            if (!this.description || this.description.length < 20) errors.push('Опишите суть спора (минимум 20 символов)');
            return errors;
        }

        save() {
            this.updatedAt = new Date().toISOString();
            _Storage.set(`dispute_${this.id}`, this);
            return this;
        }

        delete() { _Storage.remove(`dispute_${this.id}`); }

        static find(id) {
            const data = _Storage.get(`dispute_${id}`);
            return data ? new Dispute(data) : null;
        }

        static findByOrder(orderId) {
            return _Storage.getAll('dispute_')
                .filter(d => d.orderId === orderId)
                .map(d => new Dispute(d));
        }

        static findByUser(userId) {
            return _Storage.getAll('dispute_')
                .filter(d => d.initiatorId === userId || d.respondentId === userId)
                .map(d => new Dispute(d))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findOpen() {
            return _Storage.getAll('dispute_')
                .filter(d => [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, 
                              DisputeStatus.EVIDENCE_REQUESTED, DisputeStatus.MEDIATION].includes(d.status))
                .map(d => new Dispute(d))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findByModerator(moderatorId) {
            return _Storage.getAll('dispute_')
                .filter(d => d.moderatorId === moderatorId)
                .map(d => new Dispute(d));
        }
    }

    // ========== EXPORT ==========

    const ModelsV2 = {
        // Enums
        BidStatus,
        ContractStatus,
        EscrowStatus,
        EngineerTaskStatus,
        EngineerTaskType,
        QualityCheckStatus,
        QualityCheckType,
        DisputeStatus,
        DisputeCategory,

        // Classes
        Bid,
        Contract,
        Escrow,
        EngineerTask,
        QualityCheck,
        Dispute
    };

    // Merge into window.Models
    Object.assign(window.Models, ModelsV2);

    // Also expose as window.ModelsV2 for explicit access
    window.ModelsV2 = ModelsV2;

    console.log('✅ ModelsV2 loaded: Bid, Contract, Escrow, EngineerTask, QualityCheck, Dispute');
})();
