/**
 * QAZGOST AI - Integration Module
 * 
 * Integrates AI analysis with Estimate, Volume, and VIP modules.
 * Provides seamless data flow from photo analysis to estimates.
 * 
 * @version 1.0.0
 */

(function (global) {
    'use strict';

    // ============================================================
    // AI INTEGRATION
    // ============================================================

    const AIIntegration = {

        // Configuration
        config: {
            aiServiceUrl: 'http://localhost:8001',
            defaultRegion: 'almaty',
            autoCheckService: true
        },

        // State
        serviceAvailable: false,
        lastCheck: null,

        /**
         * Initialize AI integration
         */
        async init() {
            console.log('%c[AI] Initializing integration...', 'color: #8b5cf6');

            // Configure AI service URL
            if (window.AIService) {
                AIService.configure({
                    baseUrl: this.config.aiServiceUrl
                });
            }

            // Check service availability
            if (this.config.autoCheckService) {
                await this.checkService();
            }

            // Set up event listeners
            this._setupEventListeners();

            console.log('%c[AI] Integration initialized', 'color: #22c55e');
        },

        /**
         * Check if AI service is available
         */
        async checkService() {
            try {
                if (!window.AIService) {
                    console.warn('[AI] AIService not loaded');
                    this.serviceAvailable = false;
                    return false;
                }

                this.serviceAvailable = await AIService.isAvailable();
                this.lastCheck = new Date();

                if (this.serviceAvailable) {
                    console.log('%c[AI] Service is available ✓', 'color: #22c55e');
                } else {
                    console.warn('[AI] Service is not available. Check if ai-service is running.');
                }

                return this.serviceAvailable;

            } catch (error) {
                console.error('[AI] Service check failed:', error);
                this.serviceAvailable = false;
                return false;
            }
        },

        /**
         * Set up event listeners for integration points
         * @private
         */
        _setupEventListeners() {
            // Listen for estimate module photo upload
            document.addEventListener('estimate:photo-uploaded', (e) => {
                this.handleEstimatePhoto(e.detail);
            });

            // Listen for volume module photo upload
            document.addEventListener('volume:photo-uploaded', (e) => {
                this.handleVolumePhoto(e.detail);
            });

            // Listen for VIP module photo upload
            document.addEventListener('vip:photo-uploaded', (e) => {
                this.handleVipPhoto(e.detail);
            });
        },

        /**
         * Render AI analyzer in a container
         * @param {string} containerId - Container element ID
         * @param {Object} options - Configuration options
         */
        renderAnalyzer(containerId, options = {}) {
            if (!window.AIAnalyzerUI) {
                console.error('[AI] AIAnalyzerUI not loaded');
                return;
            }

            const defaults = {
                region: this.config.defaultRegion,
                showEstimate: true,
                onAnalysisComplete: (result) => this._handleAnalysisComplete(result, options.target),
                onError: (error) => console.error('[AI] Analysis error:', error)
            };

            AIAnalyzerUI.render(containerId, { ...defaults, ...options });
        },

        /**
         * Handle completed analysis
         * @private
         */
        _handleAnalysisComplete(result, target) {
            console.log('[AI] Analysis complete:', result);

            // Store result for later use
            this.lastResult = result;

            // Dispatch event for other modules
            document.dispatchEvent(new CustomEvent('ai:analysis-complete', {
                detail: { result, target }
            }));

            // Handle by target module
            if (target === 'estimate') {
                this.applyToEstimate(result);
            } else if (target === 'volume') {
                this.applyToVolume(result);
            } else if (target === 'vip') {
                this.applyToVip(result);
            }
        },

        /**
         * Apply AI results to Estimate module
         */
        applyToEstimate(result) {
            if (!result.hasEstimate) {
                console.warn('[AI] No estimate data in result');
                return;
            }

            // Get estimate form elements
            const workTypeSelect = document.getElementById('estimate-work-type');
            const objectTypeSelect = document.getElementById('estimate-object-type');
            const dimensionsInputs = document.querySelectorAll('.estimate-dimension');

            // Determine work type from detected objects
            const workType = this._determineWorkType(result);
            if (workTypeSelect && workType) {
                workTypeSelect.value = workType;
                workTypeSelect.dispatchEvent(new Event('change'));
            }

            // Apply auto-detected dimensions
            const summary = result.getSummary();
            for (const [className, data] of Object.entries(summary)) {
                // Find matching input fields and populate
                if (data.totalAreaM2 > 0) {
                    const areaInput = document.getElementById('estimate-area');
                    if (areaInput) {
                        areaInput.value = data.totalAreaM2.toFixed(2);
                    }
                }
                if (data.totalVolumeM3 > 0) {
                    const volumeInput = document.getElementById('estimate-volume');
                    if (volumeInput) {
                        volumeInput.value = data.totalVolumeM3.toFixed(2);
                    }
                }
            }

            // Show AI-generated estimate items
            if (result.estimateItems.length > 0) {
                this._showEstimateItemsModal(result);
            }

            // Notify user
            this._showNotification('AI-анализ применён к смете', 'success');
        },

        /**
         * Apply AI results to Volume module
         */
        applyToVolume(result) {
            if (!result.measurements) {
                console.warn('[AI] No measurements in result');
                return;
            }

            // Get volume calculation form
            const volumeForm = document.getElementById('volume-calculation-form');
            if (!volumeForm) return;

            // Find excavation/soil objects
            const excavations = result.objects.filter(obj =>
                ['trench', 'pit', 'foundation'].includes(obj.className)
            );

            if (excavations.length > 0) {
                const main = excavations[0];

                // Populate dimensions
                const lengthInput = document.getElementById('volume-length');
                const widthInput = document.getElementById('volume-width');
                const depthInput = document.getElementById('volume-depth');

                if (lengthInput && main.heightM) lengthInput.value = main.heightM.toFixed(2);
                if (widthInput && main.widthM) widthInput.value = main.widthM.toFixed(2);
                if (depthInput && main.depthM) depthInput.value = main.depthM.toFixed(2);

                // Determine object type
                const typeSelect = document.getElementById('volume-object-type');
                if (typeSelect) {
                    typeSelect.value = main.className;
                    typeSelect.dispatchEvent(new Event('change'));
                }
            }

            this._showNotification('Измерения применены к расчёту объёмов', 'success');
        },

        /**
         * Apply AI results to VIP module
         */
        applyToVip(result) {
            // Store analysis for current lot/project
            const currentLotId = this._getCurrentVipLotId();
            if (currentLotId) {
                this._storeLotAnalysis(currentLotId, result);
            }

            // Dispatch event for VIP module
            document.dispatchEvent(new CustomEvent('vip:ai-analysis', {
                detail: { result, lotId: currentLotId }
            }));

            this._showNotification('Анализ фото сохранён для лота', 'success');
        },

        /**
         * Determine work type from detected objects
         * @private
         */
        _determineWorkType(result) {
            if (!result.objects.length) return null;

            // Count by category
            const categories = {
                excavation: ['trench', 'pit', 'foundation'],
                pipes: ['pipe_pvc', 'pipe_metal', 'pipe_hdpe'],
                concrete: ['concrete_slab', 'formwork', 'rebar'],
                walls: ['wall_brick', 'wall_block'],
                waterproofing: ['waterproofing', 'insulation']
            };

            let maxCount = 0;
            let mainType = null;

            for (const [type, classes] of Object.entries(categories)) {
                const count = result.objects.filter(obj =>
                    classes.includes(obj.className)
                ).length;

                if (count > maxCount) {
                    maxCount = count;
                    mainType = type;
                }
            }

            return mainType;
        },

        /**
         * Show modal with AI estimate items
         * @private
         */
        _showEstimateItemsModal(result) {
            const modal = document.createElement('div');
            modal.className = 'ai-estimate-modal';
            modal.innerHTML = `
                <div class="ai-modal-overlay"></div>
                <div class="ai-modal-content">
                    <div class="ai-modal-header">
                        <h3>🤖 AI Смета</h3>
                        <button class="ai-modal-close">&times;</button>
                    </div>
                    <div class="ai-modal-body">
                        <p>На основе анализа фото обнаружено <strong>${result.objectCount}</strong> объектов.</p>
                        <p>Сгенерировано <strong>${result.estimateItems.length}</strong> позиций сметы.</p>
                        
                        <div class="ai-modal-items">
                            ${result.estimateItems.map(item => `
                                <div class="ai-modal-item">
                                    <span class="ai-modal-item-name">${item.work_name}</span>
                                    <span class="ai-modal-item-qty">${item.quantity} ${item.unit}</span>
                                    <span class="ai-modal-item-price">${item.total_price.toLocaleString('ru-RU')} ₸</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="ai-modal-total">
                            <span>ИТОГО:</span>
                            <span>${result.getFormattedTotal()}</span>
                        </div>
                        
                        <div class="ai-modal-confidence">
                            Уверенность: ${Math.round(result.estimateConfidence * 100)}%
                        </div>
                    </div>
                    <div class="ai-modal-footer">
                        <button class="ai-btn ai-btn-secondary ai-modal-cancel">Отмена</button>
                        <button class="ai-btn ai-btn-primary ai-modal-apply">Применить смету</button>
                    </div>
                </div>
            `;

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .ai-estimate-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .ai-modal-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                }
                .ai-modal-content {
                    position: relative;
                    background: #1e1e2e;
                    border-radius: 16px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                }
                .ai-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .ai-modal-header h3 { margin: 0; color: #fff; }
                .ai-modal-close {
                    background: none;
                    border: none;
                    color: #888;
                    font-size: 24px;
                    cursor: pointer;
                }
                .ai-modal-body {
                    padding: 20px;
                    overflow-y: auto;
                    color: #e5e5e5;
                }
                .ai-modal-items {
                    margin: 16px 0;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .ai-modal-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    font-size: 13px;
                }
                .ai-modal-item-name { flex: 1; }
                .ai-modal-item-qty { color: #888; margin: 0 12px; }
                .ai-modal-item-price { color: #22c55e; }
                .ai-modal-total {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-top: 2px solid rgba(255,255,255,0.1);
                    font-size: 16px;
                    font-weight: 600;
                    color: #22c55e;
                }
                .ai-modal-confidence {
                    text-align: center;
                    color: #888;
                    font-size: 12px;
                }
                .ai-modal-footer {
                    display: flex;
                    gap: 12px;
                    padding: 16px 20px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                }
                .ai-modal-footer .ai-btn { flex: 1; }
            `;
            modal.appendChild(style);

            document.body.appendChild(modal);

            // Event handlers
            modal.querySelector('.ai-modal-close').onclick = () => modal.remove();
            modal.querySelector('.ai-modal-cancel').onclick = () => modal.remove();
            modal.querySelector('.ai-modal-overlay').onclick = () => modal.remove();
            modal.querySelector('.ai-modal-apply').onclick = () => {
                this._applyEstimateItems(result.estimateItems);
                modal.remove();
            };
        },

        /**
         * Apply estimate items to current estimate
         * @private
         */
        _applyEstimateItems(items) {
            // Dispatch event for estimate module to handle
            document.dispatchEvent(new CustomEvent('estimate:apply-ai-items', {
                detail: { items }
            }));

            this._showNotification(`Добавлено ${items.length} позиций в смету`, 'success');
        },

        /**
         * Get current VIP lot ID
         * @private
         */
        _getCurrentVipLotId() {
            // Check for open lot modal or selected lot
            const lotModal = document.querySelector('.vip-lot-details-modal');
            if (lotModal) {
                return lotModal.dataset.lotId;
            }
            return null;
        },

        /**
         * Store analysis for lot
         * @private
         */
        _storeLotAnalysis(lotId, result) {
            const key = `vip_lot_analysis_${lotId}`;
            const data = {
                imageId: result.imageId,
                objectCount: result.objectCount,
                measurements: result.measurements,
                estimateItems: result.estimateItems,
                estimateTotal: result.estimateTotal,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify(data));
        },

        /**
         * Show notification
         * @private
         */
        _showNotification(message, type = 'info') {
            // Use existing notification system if available
            if (window.showNotification) {
                window.showNotification(message, type);
                return;
            }

            // Create simple notification
            const notification = document.createElement('div');
            notification.className = `ai-notification ai-notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#6366f1'};
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10001;
                animation: slideIn 0.3s ease;
            `;

            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        },

        /**
         * Handle photo from Estimate module
         */
        async handleEstimatePhoto(detail) {
            if (!this.serviceAvailable) {
                console.warn('[AI] Service not available');
                return;
            }

            const { file, containerId } = detail;

            // Render analyzer in the provided container
            this.renderAnalyzer(containerId, {
                target: 'estimate',
                region: this.config.defaultRegion
            });
        },

        /**
         * Handle photo from Volume module
         */
        async handleVolumePhoto(detail) {
            if (!this.serviceAvailable) return;

            const { file, containerId } = detail;

            this.renderAnalyzer(containerId, {
                target: 'volume',
                region: this.config.defaultRegion,
                showEstimate: false  // Volume module doesn't need estimate
            });
        },

        /**
         * Handle photo from VIP module
         */
        async handleVipPhoto(detail) {
            if (!this.serviceAvailable) return;

            const { file, containerId, lotId } = detail;

            this.renderAnalyzer(containerId, {
                target: 'vip',
                lotId: lotId,
                region: this.config.defaultRegion
            });
        }
    };

    // ============================================================
    // AUTO-INITIALIZE
    // ============================================================

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AIIntegration.init());
    } else {
        AIIntegration.init();
    }

    // Export
    global.AIIntegration = AIIntegration;

})(typeof window !== 'undefined' ? window : this);
