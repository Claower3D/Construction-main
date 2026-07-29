// ========== CATALOG SERVICE v1.0 ==========
// Сервис каталога подрядчиков — CRUD, поиск, фильтрация, рейтинги
(function () {
    'use strict';

    const STORAGE_KEYS = {
        ENTRIES: 'catalog_entries',
        REVIEWS: 'catalog_reviews',
        INVITES: 'catalog_invites',
        FAVORITES: 'catalog_favorites'
    };

    // ─── STORAGE HELPERS ───
    function _get(key) {
        try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
    }
    function _set(key, data) {
        try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.warn('[CatalogService] save error', e); }
    }

    // ─── CATALOG ENTRIES ───
    const Entries = {
        getAll() {
            let entries = _get(STORAGE_KEYS.ENTRIES);
            if (entries.length === 0) {
                // Seed demo data on first use
                entries = window.CatalogModels.generateSeedData();
                _set(STORAGE_KEYS.ENTRIES, entries);
            }
            return entries;
        },

        getById(id) {
            return this.getAll().find(e => e.id === id) || null;
        },

        search(filters) {
            let entries = this.getAll();
            const f = filters || {};

            // Text search (name, about, categories, synonyms)
            if (f.search && f.search.trim()) {
                const q = f.search.trim().toLowerCase();
                const cats = window.CatalogModels.BUILDER_CATEGORIES;
                entries = entries.filter(e => {
                    if (e.name.toLowerCase().includes(q)) return true;
                    if (e.companyName && e.companyName.toLowerCase().includes(q)) return true;
                    if (e.about && e.about.toLowerCase().includes(q)) return true;
                    if (e.city && e.city.toLowerCase().includes(q)) return true;
                    // Search by category synonyms
                    for (const catId of e.categories) {
                        const cat = cats.find(c => c.id === catId);
                        if (cat) {
                            if (cat.label.toLowerCase().includes(q)) return true;
                            if (cat.synonyms.some(s => s.toLowerCase().includes(q))) return true;
                        }
                    }
                    // Search by custom tags
                    if (e.customTags && e.customTags.some(t => t.toLowerCase().includes(q))) return true;
                    return false;
                });
            }

            // Category filter
            if (f.categories && f.categories.length > 0) {
                entries = entries.filter(e =>
                    f.categories.some(c => e.categories.includes(c))
                );
            }

            // City filter
            if (f.city) {
                entries = entries.filter(e => e.city === f.city || e.serviceZones.includes(f.city));
            }

            // Executor type filter
            if (f.executorType) {
                entries = entries.filter(e => e.executorType === f.executorType);
            }

            // Price level filter
            if (f.priceLevel) {
                entries = entries.filter(e => e.priceLevel === f.priceLevel);
            }

            // Only available
            if (f.isAvailable) {
                entries = entries.filter(e => e.isAvailable && e.status !== 'busy');
            }

            // Has reviews
            if (f.hasReviews) {
                entries = entries.filter(e => e.reviewsCount > 0);
            }

            // Min rating
            if (f.minRating > 0) {
                entries = entries.filter(e => (e.rating || 0) >= f.minRating);
            }

            // Sorting
            const sort = f.sortBy || 'rating_desc';
            switch (sort) {
                case 'rating_desc': entries.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
                case 'rating_asc': entries.sort((a, b) => (a.rating || 0) - (b.rating || 0)); break;
                case 'price_asc': entries.sort((a, b) => (a.minOrder || 0) - (b.minOrder || 0)); break;
                case 'price_desc': entries.sort((a, b) => (b.minOrder || 0) - (a.minOrder || 0)); break;
                case 'reviews_desc': entries.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0)); break;
                case 'newest': entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
            }

            return entries;
        },

        upsert(entry) {
            const entries = this.getAll();
            const idx = entries.findIndex(e => e.id === entry.id);
            if (idx >= 0) {
                entries[idx] = { ...entries[idx], ...entry, updatedAt: new Date().toISOString() };
            } else {
                entries.push(entry);
            }
            _set(STORAGE_KEYS.ENTRIES, entries);
            return entry;
        },

        remove(id) {
            const entries = this.getAll().filter(e => e.id !== id);
            _set(STORAGE_KEYS.ENTRIES, entries);
        },

        // Sync from executor profile
        syncFromProfile(profile) {
            const entry = window.CatalogModels.createCatalogEntry(profile);
            return this.upsert(entry);
        },

        // Get stats
        getStats() {
            const all = this.getAll();
            return {
                total: all.length,
                active: all.filter(e => e.isAvailable).length,
                companies: all.filter(e => e.executorType === 'company').length,
                masters: all.filter(e => e.executorType === 'master').length,
                avgRating: all.length ? +(all.reduce((s, e) => s + (e.rating || 0), 0) / all.length).toFixed(1) : 0
            };
        }
    };

    // ─── REVIEWS ───
    const Reviews = {
        getAll() { return _get(STORAGE_KEYS.REVIEWS); },

        getByExecutor(executorId) {
            return this.getAll()
                .filter(r => r.executorId === executorId || r.catalogEntryId === executorId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },

        add(data) {
            const review = window.CatalogModels.createReview(data);
            const reviews = this.getAll();
            reviews.push(review);
            _set(STORAGE_KEYS.REVIEWS, reviews);
            // Update rating on entry
            this._updateRating(data.catalogEntryId || data.executorId);
            return review;
        },

        addReply(reviewId, replyText) {
            const reviews = this.getAll();
            const idx = reviews.findIndex(r => r.id === reviewId);
            if (idx >= 0) {
                reviews[idx].reply = {
                    text: replyText,
                    createdAt: new Date().toISOString()
                };
                _set(STORAGE_KEYS.REVIEWS, reviews);
            }
        },

        _updateRating(entryId) {
            const reviews = this.getByExecutor(entryId);
            if (reviews.length === 0) return;
            const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
            const entry = Entries.getById(entryId);
            if (entry) {
                Entries.upsert({
                    ...entry,
                    rating: +(avg.toFixed(1)),
                    reviewsCount: reviews.length
                });
            }
        },

        getStats(entryId) {
            const reviews = this.getByExecutor(entryId);
            if (reviews.length === 0) return { avg: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
            const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
            const dist = [0, 0, 0, 0, 0];
            reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++; });
            return { avg: +(avg.toFixed(1)), count: reviews.length, distribution: dist };
        }
    };

    // ─── INVITES ───
    const Invites = {
        getAll() { return _get(STORAGE_KEYS.INVITES); },

        send(data) {
            const invite = window.CatalogModels.createInvite(data);
            const invites = this.getAll();
            invites.push(invite);
            _set(STORAGE_KEYS.INVITES, invites);
            return invite;
        },

        respond(inviteId, accept) {
            const invites = this.getAll();
            const idx = invites.findIndex(i => i.id === inviteId);
            if (idx >= 0) {
                invites[idx].status = accept ? 'accepted' : 'declined';
                invites[idx].respondedAt = new Date().toISOString();
                _set(STORAGE_KEYS.INVITES, invites);
                return invites[idx];
            }
            return null;
        },

        getByExecutor(executorId) {
            return this.getAll().filter(i => i.toExecutorId === executorId);
        },

        getByCustomer(customerId) {
            return this.getAll().filter(i => i.fromUserId === customerId);
        }
    };

    // ─── FAVORITES ───
    const Favorites = {
        getAll() { return _get(STORAGE_KEYS.FAVORITES); },

        toggle(entryId) {
            let favs = this.getAll();
            const idx = favs.indexOf(entryId);
            if (idx >= 0) {
                favs.splice(idx, 1);
            } else {
                favs.push(entryId);
            }
            _set(STORAGE_KEYS.FAVORITES, favs);
            return idx < 0; // true if added, false if removed
        },

        isFavorite(entryId) {
            return this.getAll().includes(entryId);
        }
    };

    // ─── RATING CALCULATION ───
    function calculateTruthfulness(entryId) {
        // % правдивости: based on completed orders vs total orders
        // MVP: return random-ish value based on rating
        const entry = Entries.getById(entryId);
        if (!entry) return 0;
        const base = Math.min(100, (entry.completedOrders || 0) * 10 + (entry.rating || 0) * 15);
        return Math.max(0, Math.min(100, Math.round(base)));
    }

    // ─── EXPORT ───
    window.CatalogService = {
        Entries,
        Reviews,
        Invites,
        Favorites,
        calculateTruthfulness
    };

    console.log('✅ [CatalogService] v1.0 loaded');
})();
