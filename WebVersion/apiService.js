// ========== API SERVICE ==========
// Real API Client for QazGost AI Backend
// Replaces localStorage-based dataService with real HTTP calls

(function () {
    'use strict';

    // ========== CONFIG ==========
    const API_BASE_URL = window.QAZGOST_API_URL || 'https://construction-api.kmp99.workers.dev/api/v1';
    let _backendAvailable = null; // null = not checked, true/false after check

    // ========== AUTH STATE (tokens are in HttpOnly cookies, NOT in localStorage) ==========
    // Токены хранятся ТОЛЬКО в HttpOnly cookies — недоступны для JS (защита от XSS)
    // В localStorage храним только флаги состояния и метаданные пользователя

    function clearAuthState() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('authPhone');
        localStorage.removeItem('authEmail');
    }

    // ========== HTTP CLIENT ==========
    async function request(endpoint, options = {}) {
        const maxRetries = options._retries || 2;
        const url = `${API_BASE_URL}${endpoint}`;

        // Get JWT token from localStorage (saved by auth-engine after login)
        const token = localStorage.getItem('authToken');

        const config = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers
            },
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        // Retry loop with exponential backoff
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                let response = await fetch(url, config);

                // Handle 401 - try to refresh token via cookie
                if (response.status === 401 && !endpoint.includes('/auth/')) {
                    const refreshed = await refreshAccessToken();
                    if (refreshed) {
                        // Cookie обновлён сервером — просто повторяем запрос
                        response = await fetch(url, config);
                    } else {
                        console.warn('⚠️ [ApiService] Backend 401 - keeping local session intact.');
                        return { success: false, error: 'Сессия бэкенда истекла' };
                    }
                }

                const data = await response.json();

                if (!response.ok) {
                    return {
                        success: false,
                        error: data.error || data.message || 'Ошибка сервера',
                        status: response.status
                    };
                }

                return { success: true, data };
            } catch (error) {
                // Retry only on network errors, not on HTTP errors
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
                    console.warn(`[API] Retry ${attempt + 1}/${maxRetries} for ${endpoint} in ${delay}ms...`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                console.error('API Error:', error);
                return { success: false, error: 'Ошибка соединения с сервером', networkError: true };
            }
        }
    }

    async function refreshAccessToken() {
        try {
            // Refresh token отправляется автоматически через cookie
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: '{}'
            });

            if (response.ok) {
                // Новые токены установлены сервером через Set-Cookie
                return true;
            }
        } catch (e) {
            console.error('Token refresh failed:', e);
        }
        return false;
    }

    // ========== AUTH API ==========
    const AuthAPI = {
        // Send OTP code
        async sendCode(phone, method = 'whatsapp') {
            return request('/auth/send-code', {
                method: 'POST',
                body: { phone, method }
            });
        },

        // Verify OTP and login
        async verifyCode(phone, code) {
            const result = await request('/auth/verify-code', {
                method: 'POST',
                body: { phone, code }
            });

            if (result.success && result.data) {
                // Токены установлены сервером через Set-Cookie (HttpOnly)
                // Сохраняем только метаданные пользователя
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUserId', result.data.user.id);
                localStorage.setItem('userRole', result.data.user.role);
                localStorage.setItem('userName', result.data.user.name || '');
                localStorage.setItem('authPhone', phone);
            }

            return result;
        },

        // Get current user
        async getCurrentUser() {
            return request('/auth/me');
        },

        // Logout
        async logout() {
            // Refresh token читается сервером из cookie, не нужно передавать в body
            await request('/auth/logout', {
                method: 'POST',
                body: {}
            });
            clearAuthState();
        },

        // Check if logged in (cookie-based — JS не имеет доступа к токену)
        isLoggedIn() {
            return localStorage.getItem('isLoggedIn') === 'true';
        }
    };

    // ========== ORDERS API ==========
    const OrdersAPI = {
        // Get orders list
        async getOrders(params = {}) {
            const query = new URLSearchParams(params).toString();
            return request(`/orders${query ? `?${query}` : ''}`);
        },

        // Get single order
        async getOrder(id) {
            return request(`/orders/${id}`);
        },

        // Create order
        async createOrder(data) {
            return request('/orders', {
                method: 'POST',
                body: data
            });
        },

        // Update order
        async updateOrder(id, data) {
            return request(`/orders/${id}`, {
                method: 'PUT',
                body: data
            });
        },

        // Delete order (draft only)
        async deleteOrder(id) {
            return request(`/orders/${id}`, {
                method: 'DELETE'
            });
        },

        // Publish order
        async publishOrder(id) {
            return request(`/orders/${id}/publish`, {
                method: 'POST'
            });
        },

        // Get public orders (for executors/engineers — no auth needed)
        async getPublicOrders(params = {}) {
            const query = new URLSearchParams(params).toString();
            return request(`/orders/public${query ? `?${query}` : ''}`);
        },

        // Submit proposal (for executors)
        async submitProposal(orderId, data) {
            return request(`/orders/${orderId}/proposals`, {
                method: 'POST',
                body: data
            });
        },

        // Assign executor (for customers)
        async assignExecutor(orderId, executorId) {
            return request(`/orders/${orderId}/assign`, {
                method: 'POST',
                body: { executorId }
            });
        },

        // Change status
        async changeStatus(orderId, status, data = {}) {
            return request(`/orders/${orderId}/status`, {
                method: 'POST',
                body: { status, ...data }
            });
        },

        // Alias used by engineerUI.js
        async changeOrderStatus(orderId, status) {
            return request(`/orders/${orderId}/status`, {
                method: 'POST',
                body: { status }
            });
        },

        // Update order (alias)
        async updateOrder(id, data) {
            return request(`/orders/${id}`, {
                method: 'PUT',
                body: data
            });
        }
    };

    // ========== USERS API ==========
    const UsersAPI = {
        // Get my profile
        async getProfile() {
            return request('/users/profile');
        },

        // Update profile
        async updateProfile(data) {
            return request('/users/profile', {
                method: 'PUT',
                body: data
            });
        },

        // Get public profile
        async getPublicProfile(userId) {
            return request(`/users/${userId}`);
        }
    };

    // ========== ENGINEERS API ==========
    const EngineersAPI = {
        // Get engineer profile
        async getProfile() {
            return request('/engineers/profile');
        },

        // Update engineer profile
        async updateProfile(data) {
            return request('/engineers/profile', {
                method: 'PUT',
                body: data
            });
        },

        // Get project summary
        async getSummary() {
            return request('/engineers/summary');
        },

        // Get available requests
        async getRequests(params = {}) {
            const query = new URLSearchParams(params).toString();
            return request(`/engineers/requests${query ? `?${query}` : ''}`);
        },

        // Get request details
        async getRequest(id) {
            return request(`/engineers/requests/${id}`);
        },

        // Accept request
        async acceptRequest(id) {
            return request(`/engineers/requests/${id}/accept`, {
                method: 'POST'
            });
        },

        // Get my projects
        async getProjects(params = {}) {
            const query = new URLSearchParams(params).toString();
            return request(`/engineers/projects${query ? `?${query}` : ''}`);
        },

        // Get project details
        async getProject(id) {
            return request(`/engineers/projects/${id}`);
        },

        // Update project progress
        async updateProgress(projectId, progress, comment = '') {
            return request(`/engineers/projects/${projectId}/progress`, {
                method: 'PATCH',
                body: { progress, comment }
            });
        },

        // Submit project
        async submitProject(projectId, data) {
            return request(`/engineers/projects/${projectId}/submit`, {
                method: 'POST',
                body: data
            });
        },

        // Add comment
        async addComment(projectId, text) {
            return request(`/engineers/projects/${projectId}/comments`, {
                method: 'POST',
                body: { text }
            });
        },

        // Get specializations
        async getSpecializations() {
            return request('/engineers/specializations');
        }
    };

    // ========== CHAT API ==========
    const ChatAPI = {
        // Get chat rooms
        async getRooms() {
            return request('/chat/rooms');
        },

        // Get order messages
        async getOrderMessages(orderId, params = {}) {
            const query = new URLSearchParams(params).toString();
            return request(`/chat/order/${orderId}/messages${query ? `?${query}` : ''}`);
        },

        // Send order message
        async sendOrderMessage(orderId, text) {
            return request(`/chat/order/${orderId}/messages`, {
                method: 'POST',
                body: { text }
            });
        },

        // Get project messages
        async getProjectMessages(projectId, params = {}) {
            const query = new URLSearchParams(params).toString();
            return request(`/chat/project/${projectId}/messages${query ? `?${query}` : ''}`);
        },

        // Send project message
        async sendProjectMessage(projectId, text) {
            return request(`/chat/project/${projectId}/messages`, {
                method: 'POST',
                body: { text }
            });
        }
    };

    // ========== FINANCE API ==========
    const FinanceAPI = {
        // Get wallet
        async getWallet() {
            return request('/finance/wallet');
        },

        // Get transactions
        async getTransactions(params = {}) {
            const query = new URLSearchParams(params).toString();
            return request(`/finance/transactions${query ? `?${query}` : ''}`);
        },

        // Deposit
        async deposit(amount, method = 'card') {
            return request('/finance/deposit', {
                method: 'POST',
                body: { amount, method }
            });
        },

        // Confirm deposit
        async confirmDeposit(transactionId) {
            return request('/finance/deposit/confirm', {
                method: 'POST',
                body: { transactionId }
            });
        },

        // Basic withdraw (legacy)
        async withdraw(amount, details) {
            return request('/finance/withdraw', {
                method: 'POST',
                body: { amount, details }
            });
        },

        // Get summary
        async getSummary() {
            return request('/finance/summary');
        }
    };

    // ========== ESCROW API ==========
    const EscrowAPI = {
        // Create escrow for order
        async create(orderId, amount, currency = 'KZT', milestones = null) {
            return request('/finance/escrow', {
                method: 'POST',
                body: { orderId, amount, currency, milestones }
            });
        },

        // Get escrow by order
        async getByOrder(orderId) {
            return request(`/finance/escrow/${orderId}`);
        },

        // Release escrow to contractor
        async release(escrowId, amount = null) {
            return request(`/finance/escrow/${escrowId}/release`, {
                method: 'POST',
                body: { amount }
            });
        },

        // Refund escrow to customer
        async refund(escrowId, amount = null, reason = '') {
            return request(`/finance/escrow/${escrowId}/refund`, {
                method: 'POST',
                body: { amount, reason }
            });
        },

        // Add milestones to escrow
        async addMilestones(escrowId, milestones) {
            return request(`/finance/escrow/${escrowId}/milestones`, {
                method: 'POST',
                body: { milestones }
            });
        }
    };

    // ========== MILESTONES API ==========
    const MilestonesAPI = {
        // Get milestones for escrow
        async getByEscrow(escrowId) {
            return request(`/finance/milestones/${escrowId}`);
        },

        // Mark milestone as completed (contractor)
        async complete(milestoneId, evidence = []) {
            return request(`/finance/milestones/${milestoneId}/complete`, {
                method: 'POST',
                body: { evidence }
            });
        },

        // Approve milestone → auto-release payment (customer)
        async approve(milestoneId) {
            return request(`/finance/milestones/${milestoneId}/approve`, {
                method: 'POST'
            });
        },

        // Dispute milestone (customer)
        async dispute(milestoneId, reason) {
            return request(`/finance/milestones/${milestoneId}/dispute`, {
                method: 'POST',
                body: { reason }
            });
        }
    };

    // ========== WITHDRAWALS API ==========
    const WithdrawAPI = {
        // Request withdrawal with bank details
        async request(amount, bankName, iban, recipientName = '', phone = '', currency = 'KZT') {
            return request('/finance/withdraw/request', {
                method: 'POST',
                body: { amount, currency, bankName, iban, recipientName, phone }
            });
        },

        // Get withdrawal history
        async history(params = {}) {
            const query = new URLSearchParams(params).toString();
            return request(`/finance/withdrawals${query ? `?${query}` : ''}`);
        },

        // Admin: approve withdrawal
        async approve(txId) {
            return request(`/finance/withdraw/${txId}/approve`, {
                method: 'POST'
            });
        }
    };


    // ========== NOTIFICATIONS API ==========
    const NotificationsAPI = {
        // Get notifications
        async getNotifications(params = {}) {
            const query = new URLSearchParams(params).toString();
            return request(`/notifications${query ? `?${query}` : ''}`);
        },

        // Get unread count
        async getUnreadCount() {
            return request('/notifications/unread-count');
        },

        // Mark as read
        async markAsRead(id) {
            return request(`/notifications/${id}/read`, {
                method: 'POST'
            });
        },

        // Mark all as read
        async markAllAsRead() {
            return request('/notifications/read-all', {
                method: 'POST'
            });
        },

        // Delete notification
        async delete(id) {
            return request(`/notifications/${id}`, {
                method: 'DELETE'
            });
        }
    };

    // ========== FILES API ==========
    const FilesAPI = {
        // Upload file
        async upload(file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`${API_BASE_URL}/files/upload`, {
                    method: 'POST',
                    credentials: 'include', // Cookie-based auth
                    body: formData
                });

                const data = await response.json();
                return response.ok ? { success: true, data } : { success: false, error: data.error };
            } catch (error) {
                return { success: false, error: 'Ошибка загрузки файла' };
            }
        },

        // Upload multiple files
        async uploadMultiple(files) {
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));

            try {
                const response = await fetch(`${API_BASE_URL}/files/upload-multiple`, {
                    method: 'POST',
                    credentials: 'include', // Cookie-based auth
                    body: formData
                });

                const data = await response.json();
                return response.ok ? { success: true, data } : { success: false, error: data.error };
            } catch (error) {
                return { success: false, error: 'Ошибка загрузки файлов' };
            }
        },

        // Upload project file
        async uploadProjectFile(projectId, file, description = '') {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('description', description);

            try {
                const response = await fetch(`${API_BASE_URL}/files/project/${projectId}`, {
                    method: 'POST',
                    credentials: 'include', // Cookie-based auth
                    body: formData
                });

                const data = await response.json();
                return response.ok ? { success: true, data } : { success: false, error: data.error };
            } catch (error) {
                return { success: false, error: 'Ошибка загрузки файла' };
            }
        },

        // Delete file
        async delete(fileId) {
            return request(`/files/${fileId}`, {
                method: 'DELETE'
            });
        }
    };


    // ========== EGOV VERIFICATION API ==========
    const VerificationAPI = {
        // Validate IIN
        async verifyIIN(iin) {
            return request('/finance/verify-iin', {
                method: 'POST',
                body: { iin }
            });
        },

        // Validate BIN
        async verifyBIN(bin) {
            return request('/finance/verify-bin', {
                method: 'POST',
                body: { bin }
            });
        }
    };

    // ========== HEALTH CHECK ==========
    async function healthCheck() {
        try {
            const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`, {
                signal: AbortSignal.timeout(3000)
            });
            const data = await response.json();
            _backendAvailable = true;
            return { success: true, data };
        } catch (error) {
            _backendAvailable = false;
            return { success: false, error: 'Сервер недоступен' };
        }
    }

    /**
     * Check if backend is available (cached after first check)
     * @returns {Promise<boolean>}
     */
    async function isBackendOnline() {
        if (_backendAvailable !== null) return _backendAvailable;
        const result = await healthCheck();
        return result.success;
    }

    // ========== ADMIN & NEW MODULES API ==========
    const AdminAPI = {
        getAuditLogs: () => request('/admin/audit'),
        exportAudit: () => request('/admin/audit/export'),
        getUsers: (params = {}) => request(`/admin/users?role=${params.role || 'all'}&search=${encodeURIComponent(params.search || '')}`),
        changeUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
        toggleBlockUser: (id) => request(`/admin/users/${id}/toggle-block`, { method: 'PATCH' })
    };

    const PricesAPI = {
        getAll: (params = {}) => request(`/prices?type=${params.type || 'all'}&search=${encodeURIComponent(params.search || '')}&page=${params.page || 1}&limit=${params.limit || 50}`),
        getStats: () => request('/prices/stats'),
        save: (data) => request('/prices', { method: 'POST', body: data }),
        update: (code, data) => request(`/prices/${code}`, { method: 'PUT', body: data }),
        delete: (code) => request(`/prices/${code}`, { method: 'DELETE' })
    };

    const ModerationAPI = {
        getQueue: () => request('/moderation/queue'),
        approve: (id) => request(`/moderation/${id}/approve`, { method: 'POST' }),
        reject: (id) => request(`/moderation/${id}/reject`, { method: 'POST' }),
        approveAll: () => request('/moderation/approve-all', { method: 'POST' })
    };

    const RegionsAPI = {
        getAll: () => request('/regions'),
        create: (region, coefficient) => request('/regions', { method: 'POST', body: { region, coefficient } }),
        update: (region, coefficient) => request(`/regions/${encodeURIComponent(region)}`, { method: 'PUT', body: { coefficient } })
    };

    const WBSAPI = {
        getPrices: () => request('/wbs/prices'),
        savePrice: (wbsId, price) => request('/wbs/prices', { method: 'POST', body: { wbsId, price } })
    };

    const EquipmentAPI = {
        getAll: (params = {}) => request(`/equipment?type=${params.type || 'all'}&city=${params.city || 'all'}`),
        create: (data) => request('/equipment', { method: 'POST', body: data })
    };

    const DisputesAPI = {
        getAll: () => request('/disputes'),
        resolve: (id, resolution) => request(`/disputes/${id}/resolve`, { method: 'POST', body: { resolution } })
    };

    // ========== EXPORT ==========
    window.API = {
        BASE_URL: API_BASE_URL,
        Auth: AuthAPI,
        Orders: OrdersAPI,
        Users: UsersAPI,
        Engineers: EngineersAPI,
        Chat: ChatAPI,
        Finance: FinanceAPI,
        Escrow: EscrowAPI,
        Milestones: MilestonesAPI,
        Withdraw: WithdrawAPI,
        Notifications: NotificationsAPI,
        Files: FilesAPI,
        Verification: VerificationAPI,
        Admin: AdminAPI,
        Prices: PricesAPI,
        Moderation: ModerationAPI,
        Regions: RegionsAPI,
        WBS: WBSAPI,
        Equipment: EquipmentAPI,
        Disputes: DisputesAPI,
        healthCheck,
        isBackendOnline,
        // Auth state management (tokens are in HttpOnly cookies)
        clearAuthState
    };

    // Auto-check backend on load
    setTimeout(async () => {
        const result = await healthCheck();
        if (result.success) {
            console.log('✅ API Service connected to backend:', API_BASE_URL, result.data);
        } else {
            console.warn('⚠️ Backend unavailable — running in localStorage demo mode');
        }
    }, 500);

    console.log('✅ API Service initialized:', API_BASE_URL);

})();
