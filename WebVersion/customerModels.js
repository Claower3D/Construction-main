// ========== CUSTOMER CABINET MODELS ==========
// Модели данных кабинета заказчика — QazGost AI

(function () {
    'use strict';

    // === Helpers ===
    function genId(prefix) {
        return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    const Storage = {
        get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
        set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
        remove(key) { localStorage.removeItem(key); }
    };

    // ============================================================
    //  PROJECT (Объект заказчика)
    // ============================================================
    class Project {
        constructor(d = {}) {
            this.id = d.id || genId('prj_');
            this.customerId = d.customerId || '';
            this.title = d.title || '';
            this.objectType = d.objectType || '';        // house|apartment|office|warehouse|foundation|roof|renovation|landscape|fence|pool|road|other
            this.city = d.city || '';
            this.address = d.address || '';
            this.area = d.area || '';                     // м²
            this.floors = d.floors || '';
            this.status = d.status || 'active';           // active|paused|completed
            this.progress = d.progress ?? 0;              // 0-100
            this.isDefault = d.isDefault || false;
            this.budget = d.budget || '';
            this.description = d.description || '';
            this.photos = d.photos || [];                 // base64 strings (thumbnails)
            this.documents = d.documents || [];           // [{id, type, title, createdAt, data}]
            this.estimates = d.estimates || [];           // [{id, title, amount, createdAt, items}]
            this.createdAt = d.createdAt || new Date().toISOString();
            this.updatedAt = d.updatedAt || new Date().toISOString();
        }

        save(userId) {
            this.updatedAt = new Date().toISOString();
            const all = Project.findAll(userId);
            const idx = all.findIndex(p => p.id === this.id);
            if (idx > -1) all[idx] = this; else all.push(this);
            Storage.set(`projects_${userId}`, all);
            return this;
        }

        delete(userId) {
            const all = Project.findAll(userId).filter(p => p.id !== this.id);
            Storage.set(`projects_${userId}`, all);
        }

        static findAll(userId) {
            return (Storage.get(`projects_${userId}`) || []).map(d => new Project(d));
        }

        static findById(userId, id) {
            return Project.findAll(userId).find(p => p.id === id) || null;
        }

        static getDefault(userId) {
            return Project.findAll(userId).find(p => p.isDefault) || null;
        }

        static count(userId) {
            return Project.findAll(userId).length;
        }
    }

    // ============================================================
    //  EQUIPMENT (Техника заказчика — VIP)
    // ============================================================
    class Equipment {
        constructor(d = {}) {
            this.id = d.id || genId('eq_');
            this.ownerCustomerId = d.ownerCustomerId || '';
            this.title = d.title || '';
            this.category = d.category || 'tool';         // transport|tool|heavy|equipment
            this.qty = d.qty ?? 1;
            this.status = d.status || 'free';              // free|on_site|repair
            this.note = d.note || '';
            this.createdAt = d.createdAt || new Date().toISOString();
        }

        save(userId) {
            const all = Equipment.findAll(userId);
            const idx = all.findIndex(e => e.id === this.id);
            if (idx > -1) all[idx] = this; else all.push(this);
            Storage.set(`equipment_${userId}`, all);
            return this;
        }

        delete(userId) {
            const all = Equipment.findAll(userId).filter(e => e.id !== this.id);
            Storage.set(`equipment_${userId}`, all);
            // Clean links
            ProjectEquipment.unlinkAll(userId, this.id, 'equipment');
        }

        static findAll(userId) {
            return (Storage.get(`equipment_${userId}`) || []).map(d => new Equipment(d));
        }

        static findById(userId, id) {
            return Equipment.findAll(userId).find(e => e.id === id) || null;
        }

        static count(userId) {
            return Equipment.findAll(userId).length;
        }
    }

    // ============================================================
    //  PARTNER / CREW (Бригады заказчика — VIP)
    // ============================================================
    class Partner {
        constructor(d = {}) {
            this.id = d.id || genId('ptr_');
            this.ownerCustomerId = d.ownerCustomerId || '';
            this.kind = d.kind || 'crew';                  // crew|master|company
            this.title = d.title || '';
            this.phone = d.phone || '';
            this.tags = d.tags || [];
            this.note = d.note || '';
            this.createdAt = d.createdAt || new Date().toISOString();
        }

        save(userId) {
            const all = Partner.findAll(userId);
            const idx = all.findIndex(p => p.id === this.id);
            if (idx > -1) all[idx] = this; else all.push(this);
            Storage.set(`partners_${userId}`, all);
            return this;
        }

        delete(userId) {
            const all = Partner.findAll(userId).filter(p => p.id !== this.id);
            Storage.set(`partners_${userId}`, all);
            ProjectPartner.unlinkAll(userId, this.id, 'partner');
        }

        static findAll(userId) {
            return (Storage.get(`partners_${userId}`) || []).map(d => new Partner(d));
        }

        static count(userId) {
            return Partner.findAll(userId).length;
        }
    }

    // ============================================================
    //  PROJECT ↔ EQUIPMENT  Link
    // ============================================================
    class ProjectEquipment {
        static _key(userId) { return `projEquip_${userId}`; }

        static link(userId, projectId, equipmentId) {
            const all = Storage.get(this._key(userId)) || [];
            if (!all.find(l => l.projectId === projectId && l.equipmentId === equipmentId)) {
                all.push({ id: genId('pe_'), projectId, equipmentId });
                Storage.set(this._key(userId), all);
            }
        }

        static unlink(userId, projectId, equipmentId) {
            const all = (Storage.get(this._key(userId)) || [])
                .filter(l => !(l.projectId === projectId && l.equipmentId === equipmentId));
            Storage.set(this._key(userId), all);
        }

        static unlinkAll(userId, entityId, type) {
            const key = type === 'equipment' ? 'equipmentId' : 'projectId';
            const all = (Storage.get(this._key(userId)) || []).filter(l => l[key] !== entityId);
            Storage.set(this._key(userId), all);
        }

        static findByProject(userId, projectId) {
            return (Storage.get(this._key(userId)) || []).filter(l => l.projectId === projectId);
        }

        static findByEquipment(userId, equipmentId) {
            return (Storage.get(this._key(userId)) || []).filter(l => l.equipmentId === equipmentId);
        }
    }

    // ============================================================
    //  PROJECT ↔ PARTNER  Link
    // ============================================================
    class ProjectPartner {
        static _key(userId) { return `projPartner_${userId}`; }

        static link(userId, projectId, partnerId) {
            const all = Storage.get(this._key(userId)) || [];
            if (!all.find(l => l.projectId === projectId && l.partnerId === partnerId)) {
                all.push({ id: genId('pp_'), projectId, partnerId });
                Storage.set(this._key(userId), all);
            }
        }

        static unlink(userId, projectId, partnerId) {
            const all = (Storage.get(this._key(userId)) || [])
                .filter(l => !(l.projectId === projectId && l.partnerId === partnerId));
            Storage.set(this._key(userId), all);
        }

        static unlinkAll(userId, entityId, type) {
            const key = type === 'partner' ? 'partnerId' : 'projectId';
            const all = (Storage.get(this._key(userId)) || []).filter(l => l[key] !== entityId);
            Storage.set(this._key(userId), all);
        }

        static findByProject(userId, projectId) {
            return (Storage.get(this._key(userId)) || []).filter(l => l.projectId === projectId);
        }
    }

    // ============================================================
    //  FEED EVENT (Лента заказов)
    // ============================================================
    class FeedEvent {
        constructor(d = {}) {
            this.id = d.id || genId('fe_');
            this.customerId = d.customerId || '';
            this.projectId = d.projectId || null;
            this.type = d.type || 'info';                  // estimate|document|status_change|action_required|photo|system|info
            this.title = d.title || '';
            this.text = d.text || '';
            this.status = d.status || null;                // pending|done|dismissed
            this.actionUrl = d.actionUrl || null;          // page to navigate
            this.actionLabel = d.actionLabel || null;
            this.icon = d.icon || '📌';
            this.createdAt = d.createdAt || new Date().toISOString();
        }

        save(userId) {
            const all = FeedEvent.findAll(userId);
            all.unshift(this); // newest first
            // Keep max 200 events
            if (all.length > 200) all.length = 200;
            Storage.set(`feedEvents_${userId}`, all);
            return this;
        }

        dismiss(userId) {
            this.status = 'dismissed';
            const all = FeedEvent.findAll(userId);
            const idx = all.findIndex(e => e.id === this.id);
            if (idx > -1) { all[idx] = this; Storage.set(`feedEvents_${userId}`, all); }
        }

        static findAll(userId) {
            return (Storage.get(`feedEvents_${userId}`) || []).map(d => new FeedEvent(d));
        }

        static findByProject(userId, projectId) {
            return FeedEvent.findAll(userId).filter(e => e.projectId === projectId);
        }

        static findActionRequired(userId) {
            return FeedEvent.findAll(userId).filter(e => e.type === 'action_required' && e.status !== 'dismissed' && e.status !== 'done');
        }

        static countActionRequired(userId) {
            return FeedEvent.findActionRequired(userId).length;
        }

        // Factory: create & save in one call
        static emit(userId, data) {
            const ev = new FeedEvent({ customerId: userId, ...data });
            ev.save(userId);
            return ev;
        }
    }

    // ============================================================
    //  VIP ACCESS CONTROL
    // ============================================================
    const VipLimits = {
        FREE_PROJECTS: 2,
        FREE_EQUIPMENT: 1,
        FREE_PARTNERS: 1,

        isVip(userId) {
            try {
                const q = Storage.get(`customerQuestionnaire_${userId}`);
                if (q && q.isVip) return true;
            } catch { /* ignore */ }
            return localStorage.getItem(`isVip_${userId}`) === 'true'
                || localStorage.getItem('isVip') === 'true';
        },

        canAddProject(userId) {
            if (this.isVip(userId)) return true;
            return Project.count(userId) < this.FREE_PROJECTS;
        },

        canAddEquipment(userId) {
            if (this.isVip(userId)) return true;
            return Equipment.count(userId) < this.FREE_EQUIPMENT;
        },

        canAddPartner(userId) {
            if (this.isVip(userId)) return true;
            return Partner.count(userId) < this.FREE_PARTNERS;
        }
    };

    // ============================================================
    //  EXPORT
    // ============================================================
    window.CabinetModels = {
        Project,
        Equipment,
        Partner,
        ProjectEquipment,
        ProjectPartner,
        FeedEvent,
        VipLimits
    };

    console.log('✅ CabinetModels loaded');
})();
