// ========== VIP EXECUTOR UI v1.0 ==========
// UI для исполнителей: лента VIP-лотов, мои работы, отчёты

(function () {
    'use strict';

    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));

    // ===== Render VIP Lots in Feed =====
    function renderVipLotsInFeed(container) {
        if (!container) return;

        const lots = window.VipService?.Lot?.getPublished() || [];
        if (lots.length === 0) return '';

        return lots.map(lot => renderVipLotCard(lot)).join('');
    }

    function renderVipLotCard(lot) {
        const project = window.VipModels?.VipProject?.find(lot.projectId);
        const req = lot.requirementsJson || {};
        const checkpoints = req.checkpoints || [0, 50, 100];

        return `
            <div class="order-card vip-lot" onclick="VipExecutorUI.openLotDetails('${lot.id}')"
                style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.5rem;cursor:pointer;position:relative;overflow:hidden;transition:all 0.3s">
                
                <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#f59e0b,#eab308)"></div>
                
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
                    <div style="flex:1">
                        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
                            <span style="padding:0.2rem 0.6rem;background:linear-gradient(135deg,#f59e0b,#eab308);border-radius:100px;font-size:0.7rem;font-weight:700;color:#000">🏗️ VIP</span>
                            <span style="padding:0.2rem 0.6rem;background:${lot.type === 'FIX' ? 'rgba(34,197,94,0.2)' : 'rgba(139,92,246,0.2)'};color:${lot.type === 'FIX' ? '#22c55e' : '#8b5cf6'};border-radius:100px;font-size:0.7rem;font-weight:600">
                                ${lot.type === 'FIX' ? '💰 Фикс' : '📊 Тендер'}
                            </span>
                        </div>
                        <h3 style="margin:0 0 0.25rem;font-size:1.1rem">${lot.title}</h3>
                        <p style="margin:0;color:var(--text-muted);font-size:0.85rem">📍 ${project?.title || 'Объект'} • ${lot.city}</p>
                    </div>
                    <div style="text-align:right">
                        <div style="font-size:1.25rem;font-weight:700;color:var(--primary)">${lot.budget.toLocaleString()} ₸</div>
                    </div>
                </div>

                ${lot.description ? `
                    <p style="margin:0 0 1rem;color:var(--text-muted);font-size:0.9rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
                        ${lot.description}
                    </p>
                ` : ''}

                <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem">
                    ${lot.tags.slice(0, 4).map(tag => `
                        <span style="padding:0.25rem 0.5rem;background:rgba(139,92,246,0.1);border-radius:6px;font-size:0.75rem;color:var(--primary)">#${tag}</span>
                    `).join('')}
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;padding-top:1rem;border-top:1px solid var(--border)">
                    <div style="display:flex;gap:1rem;color:var(--text-muted);font-size:0.85rem">
                        <span>📅 до ${lot.deadlineEnd || 'не указано'}</span>
                        <span>📷 ${checkpoints.length} чекпоинтов</span>
                    </div>
                    ${lot.type === 'FIX' ? `
                        <button onclick="event.stopPropagation();VipExecutorUI.takeLot('${lot.id}')"
                            style="padding:0.5rem 1rem;background:linear-gradient(135deg,var(--primary),var(--accent));border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:600">
                            ⚡ Взять
                        </button>
                    ` : `
                        <button onclick="event.stopPropagation();VipExecutorUI.showBidModal('${lot.id}')"
                            style="padding:0.5rem 1rem;background:var(--card);border:1px solid var(--primary);border-radius:8px;color:var(--primary);cursor:pointer;font-weight:600">
                            📨 Откликнуться
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    // ===== Open Lot Details =====
    function openLotDetails(lotId) {
        const lot = window.VipModels?.Lot?.find(lotId);
        if (!lot) return;

        const project = window.VipModels?.VipProject?.find(lot.projectId);
        const req = lot.requirementsJson || {};
        const nodes = lot.wbsNodeIds.map(id => window.VipModels?.WBSNode?.find(id)).filter(Boolean);

        const modal = document.createElement('div');
        modal.id = 'lotDetailsModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;overflow-y:auto';
        modal.innerHTML = `
            <div style="background:var(--card);border-radius:16px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;margin:auto">
                <div style="padding:1.5rem;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--card);z-index:1">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start">
                        <div>
                            <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem">
                                <span style="padding:0.2rem 0.6rem;background:linear-gradient(135deg,#f59e0b,#eab308);border-radius:100px;font-size:0.7rem;font-weight:700;color:#000">🏗️ VIP</span>
                                <span style="padding:0.2rem 0.6rem;background:${lot.type === 'FIX' ? 'rgba(34,197,94,0.2)' : 'rgba(139,92,246,0.2)'};color:${lot.type === 'FIX' ? '#22c55e' : '#8b5cf6'};border-radius:100px;font-size:0.7rem;font-weight:600">
                                    ${lot.type === 'FIX' ? '💰 Фикс-цена' : '📊 Тендер'}
                                </span>
                            </div>
                            <h2 style="margin:0">${lot.title}</h2>
                        </div>
                        <button onclick="document.getElementById('lotDetailsModal').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text)">✕</button>
                    </div>
                </div>

                <div style="padding:1.5rem">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
                        <div style="background:var(--bg);padding:1rem;border-radius:12px">
                            <div style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.25rem">Бюджет</div>
                            <div style="font-size:1.5rem;font-weight:700;color:var(--primary)">${lot.budget.toLocaleString()} ₸</div>
                        </div>
                        <div style="background:var(--bg);padding:1rem;border-radius:12px">
                            <div style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.25rem">Сроки</div>
                            <div style="font-weight:600">${lot.deadlineStart || 'Сейчас'} — ${lot.deadlineEnd || 'Не указано'}</div>
                        </div>
                    </div>

                    <div style="margin-bottom:1.5rem">
                        <h4 style="margin:0 0 0.5rem">📍 Объект</h4>
                        <p style="margin:0;color:var(--text-muted)">${project?.title || 'Не указан'} • ${lot.city}</p>
                    </div>

                    ${lot.description ? `
                        <div style="margin-bottom:1.5rem">
                            <h4 style="margin:0 0 0.5rem">📝 Описание</h4>
                            <p style="margin:0;color:var(--text-muted)">${lot.description}</p>
                        </div>
                    ` : ''}

                    <div style="margin-bottom:1.5rem">
                        <h4 style="margin:0 0 0.75rem">📋 Работы (${nodes.length})</h4>
                        <div style="max-height:150px;overflow-y:auto;background:var(--bg);border-radius:8px;padding:0.5rem">
                            ${nodes.map(n => `
                                <div style="padding:0.5rem;border-bottom:1px solid var(--border)">
                                    <span style="color:var(--primary);font-weight:600">${n.code}</span> ${n.title}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div style="margin-bottom:1.5rem">
                        <h4 style="margin:0 0 0.75rem">📷 Требования к фото-отчётам</h4>
                        <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:1rem">
                            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem">
                                ${(req.checkpoints || [0, 50, 100]).map(cp => `
                                    <span style="padding:0.25rem 0.75rem;background:var(--primary);border-radius:100px;font-size:0.85rem;color:#fff">${cp}%</span>
                                `).join('')}
                            </div>
                            <p style="margin:0;color:var(--text-muted);font-size:0.85rem">
                                Минимум фото на чекпоинт: ${Object.entries(req.minPhotos || {}).map(([k, v]) => `${k}%: ${v}`).join(', ') || 'стандартно'}
                            </p>
                            ${req.proofTypes?.length ? `
                                <p style="margin:0.5rem 0 0;color:var(--text-muted);font-size:0.85rem">
                                    Типы фото: ${req.proofTypes.join(', ')}
                                </p>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div style="padding:1.5rem;border-top:1px solid var(--border);display:flex;gap:1rem">
                    ${lot.type === 'FIX' ? `
                        <button onclick="document.getElementById('lotDetailsModal').remove();VipExecutorUI.takeLot('${lot.id}')"
                            style="flex:1;padding:0.75rem;background:linear-gradient(135deg,var(--primary),var(--accent));border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:600;font-size:1rem">
                            ⚡ Взять работу
                        </button>
                    ` : `
                        <button onclick="document.getElementById('lotDetailsModal').remove();VipExecutorUI.showBidModal('${lot.id}')"
                            style="flex:1;padding:0.75rem;background:linear-gradient(135deg,var(--primary),var(--accent));border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:600;font-size:1rem">
                            📨 Откликнуться
                        </button>
                    `}
                    <button onclick="document.getElementById('lotDetailsModal').remove()"
                        style="padding:0.75rem 1.5rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);cursor:pointer">
                        Закрыть
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.onclick = e => { if (e.target === modal) modal.remove(); };
    }

    // ===== Take Lot =====
    function takeLot(lotId) {
        const executorId = localStorage.getItem('currentUserId') || 'executor_default';
        const executorName = localStorage.getItem('executorName') || 'Исполнитель';

        const result = window.VipService?.Assignment?.take(lotId, executorId, executorName);
        if (result?.success) {
            window.showToast?.('✅ Работа взята! Перейдите в "Мои работы"');
            // Refresh feed if on orders page
            if (typeof window.loadOrders === 'function') {
                window.loadOrders();
            }
        } else {
            window.showToast?.('❌ ' + (result?.error || 'Ошибка'));
        }
    }

    // ===== Show Bid Modal =====
    function showBidModal(lotId) {
        const lot = window.VipModels?.Lot?.find(lotId);
        if (!lot) return;

        const modal = document.createElement('div');
        modal.id = 'bidModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem';
        modal.innerHTML = `
            <div style="background:var(--card);border-radius:16px;padding:2rem;max-width:500px;width:100%">
                <h2 style="margin:0 0 1rem">📨 Отклик на лот</h2>
                <p style="color:var(--text-muted);margin:0 0 1.5rem">${lot.title}</p>
                
                <div style="display:flex;flex-direction:column;gap:1rem">
                    <div>
                        <label style="display:block;margin-bottom:0.5rem;font-weight:600">Ваша цена (₸)</label>
                        <input type="number" id="bidPrice" value="${lot.budget}" 
                            style="width:100%;padding:0.75rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text)">
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:0.5rem;font-weight:600">Срок выполнения (дней)</label>
                        <input type="number" id="bidDuration" value="30" min="1"
                            style="width:100%;padding:0.75rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text)">
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:0.5rem;font-weight:600">Комментарий</label>
                        <textarea id="bidComment" rows="3" placeholder="Расскажите о вашем опыте..."
                            style="width:100%;padding:0.75rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);resize:vertical"></textarea>
                    </div>
                </div>

                <div style="display:flex;gap:1rem;margin-top:1.5rem">
                    <button onclick="VipExecutorUI.submitBid('${lotId}')"
                        style="flex:1;padding:0.75rem;background:var(--primary);border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:600">
                        Отправить отклик
                    </button>
                    <button onclick="document.getElementById('bidModal').remove()"
                        style="padding:0.75rem 1.5rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);cursor:pointer">
                        Отмена
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.onclick = e => { if (e.target === modal) modal.remove(); };
    }

    function submitBid(lotId) {
        const price = parseInt($('#bidPrice')?.value) || 0;
        const duration = parseInt($('#bidDuration')?.value) || 30;
        const comment = $('#bidComment')?.value?.trim() || '';
        const executorId = localStorage.getItem('currentUserId') || 'executor_default';
        const executorName = localStorage.getItem('executorName') || 'Исполнитель';

        const result = window.VipService?.Bid?.create(lotId, executorId, {
            executorName,
            price,
            duration,
            comment
        });

        if (result?.success) {
            $('#bidModal')?.remove();
            window.showToast?.('✅ Отклик отправлен!');
        } else {
            window.showToast?.('❌ ' + (result?.error || 'Ошибка'));
        }
    }

    // ===== Render My VIP Works =====
    function renderMyVipWorks(container) {
        if (!container) return;

        const executorId = localStorage.getItem('currentUserId') || 'executor_default';
        const assignments = window.VipService?.Assignment?.getByExecutor(executorId) || [];

        if (assignments.length === 0) {
            return `
                <div style="text-align:center;padding:2rem;background:var(--card);border:1px solid var(--border);border-radius:16px;margin-bottom:1rem">
                    <div style="font-size:3rem;margin-bottom:1rem">🏗️</div>
                    <h3 style="margin:0 0 0.5rem">Нет VIP-работ</h3>
                    <p style="color:var(--text-muted);margin:0">Найдите лоты в "Ленте заказов" с меткой VIP</p>
                </div>
            `;
        }

        return assignments.map(a => renderMyWorkCard(a)).join('');
    }

    function renderMyWorkCard(assignment) {
        const lot = window.VipModels?.Lot?.find(assignment.lotId);
        const project = lot ? window.VipModels?.VipProject?.find(lot.projectId) : null;
        const req = lot?.requirementsJson || {};
        const checkpoints = req.checkpoints || [0, 50, 100];
        const reports = window.VipModels?.Report?.findByAssignment(assignment.id) || [];
        const completedCheckpoints = reports.map(r => r.checkpoint);

        const statusLabels = {
            ACTIVE: { label: 'В работе', color: '#3b82f6', bg: 'rgba(59,130,246,0.2)' },
            SUBMITTED: { label: 'На проверке', color: '#8b5cf6', bg: 'rgba(139,92,246,0.2)' },
            REWORK: { label: 'Доработка', color: '#ef4444', bg: 'rgba(239,68,68,0.2)' },
            ACCEPTED: { label: 'Принято', color: '#22c55e', bg: 'rgba(34,197,94,0.2)' },
            TERMINATED: { label: 'Прекращено', color: '#6b7280', bg: 'rgba(107,114,128,0.2)' }
        };
        const st = statusLabels[assignment.status] || statusLabels.ACTIVE;

        return `
            <div class="vip-work-card" style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.5rem;margin-bottom:1rem;position:relative;overflow:hidden">
                <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#f59e0b,#eab308)"></div>
                
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
                    <div>
                        <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem">
                            <span style="padding:0.2rem 0.6rem;background:linear-gradient(135deg,#f59e0b,#eab308);border-radius:100px;font-size:0.7rem;font-weight:700;color:#000">🏗️ VIP</span>
                            <span style="padding:0.2rem 0.6rem;background:${st.bg};color:${st.color};border-radius:100px;font-size:0.7rem;font-weight:600">${st.label}</span>
                        </div>
                        <h3 style="margin:0 0 0.25rem">${lot?.title || 'Работа'}</h3>
                        <p style="margin:0;color:var(--text-muted);font-size:0.85rem">${project?.title || 'Объект'}</p>
                    </div>
                    <div style="text-align:right">
                        <div style="font-size:1.5rem;font-weight:700;color:var(--primary)">${assignment.progressPercent}%</div>
                    </div>
                </div>

                <!-- Progress bar -->
                <div style="background:var(--bg);border-radius:8px;height:10px;overflow:hidden;margin-bottom:1rem">
                    <div style="height:100%;width:${assignment.progressPercent}%;background:linear-gradient(90deg,var(--primary),var(--accent));transition:width 0.3s"></div>
                </div>

                <!-- Checkpoints -->
                <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap">
                    ${checkpoints.map(cp => {
            const isDone = completedCheckpoints.includes(cp);
            const isCurrent = !isDone && completedCheckpoints.every(c => c < cp);
            return `
                            <div onclick="${isDone || isCurrent ? `VipExecutorUI.showReportModal('${assignment.id}', ${cp})` : ''}" 
                                style="flex:1;min-width:60px;padding:0.75rem 0.5rem;background:${isDone ? 'rgba(34,197,94,0.2)' : isCurrent ? 'rgba(139,92,246,0.2)' : 'var(--bg)'};border:2px solid ${isDone ? '#22c55e' : isCurrent ? 'var(--primary)' : 'var(--border)'};border-radius:8px;text-align:center;cursor:${isDone || isCurrent ? 'pointer' : 'default'}">
                                <div style="font-weight:700;color:${isDone ? '#22c55e' : isCurrent ? 'var(--primary)' : 'var(--text-muted)'}">${cp}%</div>
                                <div style="font-size:0.75rem;color:var(--text-muted)">${isDone ? '✓' : isCurrent ? '📷' : ''}</div>
                            </div>
                        `;
        }).join('')}
                </div>

                <!-- Actions -->
                ${assignment.status === 'ACTIVE' || assignment.status === 'REWORK' ? `
                    <div style="display:flex;gap:0.5rem">
                        <button onclick="VipExecutorUI.showReportModal('${assignment.id}', ${checkpoints.find(cp => !completedCheckpoints.includes(cp)) || 100})"
                            style="flex:1;padding:0.75rem;background:var(--primary);border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:600">
                            📷 Загрузить отчёт
                        </button>
                        ${assignment.progressPercent >= 100 ? `
                            <button onclick="VipExecutorUI.submitWork('${assignment.id}')"
                                style="flex:1;padding:0.75rem;background:#22c55e;border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:600">
                                ✅ Сдать на проверку
                            </button>
                        ` : `
                            <button disabled style="flex:1;padding:0.75rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text-muted);cursor:not-allowed">
                                Завершите все чекпоинты
                            </button>
                        `}
                    </div>
                ` : ''}

                ${assignment.status === 'REWORK' ? `
                    <div style="margin-top:1rem;padding:1rem;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px">
                        <div style="font-weight:600;color:#ef4444;margin-bottom:0.25rem">⚠️ Требуется доработка</div>
                        <p style="margin:0;color:var(--text-muted);font-size:0.85rem">Проверьте комментарии заказчика и загрузите дополнительные фото</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ===== Show Report Modal =====
    function showReportModal(assignmentId, checkpoint) {
        const assignment = window.VipModels?.Assignment?.find(assignmentId);
        const lot = assignment ? window.VipModels?.Lot?.find(assignment.lotId) : null;
        const req = lot?.requirementsJson || {};
        const minPhotos = req.minPhotos?.[checkpoint] || 2;
        const proofTypes = req.proofTypes || ['general'];

        const modal = document.createElement('div');
        modal.id = 'reportModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;overflow-y:auto';
        modal.innerHTML = `
            <div style="background:var(--card);border-radius:16px;padding:2rem;max-width:500px;width:100%;margin:auto">
                <h2 style="margin:0 0 0.5rem">📷 Отчёт ${checkpoint}%</h2>
                <p style="color:var(--text-muted);margin:0 0 1.5rem">Минимум ${minPhotos} фото</p>

                <div style="display:flex;flex-direction:column;gap:1rem">
                    <div>
                        <label style="display:block;margin-bottom:0.5rem;font-weight:600">Фотографии *</label>
                        <input type="file" id="reportPhotos" multiple accept="image/*"
                            style="width:100%;padding:0.75rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text)">
                        <div id="photoPreview" style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem"></div>
                    </div>

                    <div>
                        <label style="display:block;margin-bottom:0.5rem;font-weight:600">Тип фото</label>
                        <select id="reportProofType" style="width:100%;padding:0.75rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text)">
                            <option value="general">📷 Общее фото</option>
                            <option value="measurement">📏 Замеры</option>
                            <option value="level">📐 Уровень</option>
                            <option value="material_label">🏷️ Этикетка материала</option>
                            <option value="hidden_work">🔧 Скрытые работы</option>
                            <option value="pressure_test">💧 Опрессовка</option>
                        </select>
                    </div>

                    <div>
                        <label style="display:block;margin-bottom:0.5rem;font-weight:600">Комментарий</label>
                        <textarea id="reportComment" rows="2" placeholder="Описание выполненных работ..."
                            style="width:100%;padding:0.75rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);resize:vertical"></textarea>
                    </div>
                </div>

                <div style="display:flex;gap:1rem;margin-top:1.5rem">
                    <button onclick="VipExecutorUI.submitReport('${assignmentId}', ${checkpoint})"
                        style="flex:1;padding:0.75rem;background:var(--primary);border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:600">
                        Загрузить
                    </button>
                    <button onclick="document.getElementById('reportModal').remove()"
                        style="padding:0.75rem 1.5rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);cursor:pointer">
                        Отмена
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.onclick = e => { if (e.target === modal) modal.remove(); };

        // Photo preview
        const input = $('#reportPhotos');
        input?.addEventListener('change', () => {
            const preview = $('#photoPreview');
            if (!preview) return;
            preview.innerHTML = '';
            Array.from(input.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = e => {
                    preview.innerHTML += `<img src="${e.target.result}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:2px solid var(--primary)">`;
                };
                reader.readAsDataURL(file);
            });
        });
    }

    function submitReport(assignmentId, checkpoint) {
        const filesInput = $('#reportPhotos');
        const proofType = $('#reportProofType')?.value || 'general';
        const comment = $('#reportComment')?.value?.trim() || '';

        if (!filesInput?.files?.length) {
            window.showToast?.('⚠️ Добавьте фотографии');
            return;
        }

        // Convert files to base64 (simplified)
        const photos = [];
        const files = Array.from(filesInput.files);
        let loaded = 0;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                photos.push({
                    url: e.target.result,
                    proofType,
                    fileName: file.name
                });
                loaded++;
                if (loaded === files.length) {
                    // All loaded, submit
                    const result = window.VipService?.Report?.create(
                        assignmentId,
                        checkpoint,
                        photos,
                        [proofType],
                        comment
                    );
                    if (result?.success) {
                        $('#reportModal')?.remove();
                        window.showToast?.(`✅ Отчёт ${checkpoint}% загружен`);
                        // Refresh page
                        if (typeof window.loadMyWorks === 'function') {
                            window.loadMyWorks();
                        } else {
                            location.reload();
                        }
                    } else {
                        window.showToast?.('❌ ' + (result?.error || 'Ошибка'));
                    }
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // ===== Submit Work =====
    function submitWork(assignmentId) {
        const result = window.VipService?.Assignment?.submit(assignmentId);
        if (result?.success) {
            window.showToast?.('✅ Работа сдана на проверку!');
            location.reload();
        } else {
            if (result?.details?.length) {
                window.showToast?.('❌ ' + result.details.join('\n'));
            } else {
                window.showToast?.('❌ ' + (result?.error || 'Ошибка'));
            }
        }
    }

    // ===== EXPORT =====
    window.VipExecutorUI = {
        renderVipLotsInFeed,
        renderVipLotCard,
        openLotDetails,
        takeLot,
        showBidModal,
        submitBid,
        renderMyVipWorks,
        showReportModal,
        submitReport,
        submitWork
    };

    console.log('✅ VIP Executor UI loaded');
})();
