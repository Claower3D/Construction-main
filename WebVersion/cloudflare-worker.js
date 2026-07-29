// ================================================================
// iConstrution.com — Full Backend on Cloudflare Worker
// Replaces Express.js backend completely
//
// Bindings needed in Cloudflare Dashboard:
//   D1 Database:  DB          → iconstrution-db
//   KV Namespace: SESSIONS    → iconstrution-sessions
//   R2 Bucket:    FILES       → iconstrution-files
//   Secrets:      GEMINI_API_KEY, OPENAI_API_KEY, JWT_SECRET
// ================================================================

const ALLOWED_ORIGINS = [
    "https://iconstrution.com",
    "https://www.iconstrution.com",
    "https://qazgost-ai.pages.dev",
    "https://*.qazgost-ai.pages.dev",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8787",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8091",
    "http://localhost:8091",
];

// ── JWT helpers (minimal, no external deps) ─────────────────────

function base64url(str) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return atob(str);
}

async function hmacSign(payload, secret) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = base64url(JSON.stringify(payload));
    const data = `${header}.${body}`;
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    return `${data}.${base64url(String.fromCharCode(...new Uint8Array(sig)))}`;
}

async function hmacVerify(token, secret) {
    try {
        const [header, body, sig] = token.split('.');
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
        );
        const sigBytes = Uint8Array.from(base64urlDecode(sig), c => c.charCodeAt(0));
        const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(`${header}.${body}`));
        if (!valid) return null;
        const payload = JSON.parse(base64urlDecode(body));
        if (payload.exp && payload.exp < Date.now() / 1000) return null;
        return payload;
    } catch { return null; }
}

async function generateToken(userId, role, secret, expiresInSec = 900) {
    return hmacSign({
        userId, role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresInSec
    }, secret);
}

// ── Password hashing (PBKDF2, no bcrypt needed) ─────────────────

async function hashPassword(password) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
    const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
    const saltStr = btoa(String.fromCharCode(...salt));
    return `${saltStr}:${hash}`;
}

async function verifyPassword(password, stored) {
    const [saltStr, hashStr] = stored.split(':');
    const enc = new TextEncoder();
    const salt = Uint8Array.from(atob(saltStr), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
    const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
    return hash === hashStr;
}

// ── Origin check with wildcard support ──────────────────────────

function isOriginAllowed(origin) {
    if (!origin) return false;
    for (const pattern of ALLOWED_ORIGINS) {
        if (pattern.includes('*')) {
            // Convert wildcard pattern to regex
            const regex = new RegExp('^' + pattern.replace(/\*/g, '[a-z0-9-]+') + '$');
            if (regex.test(origin)) return true;
        } else {
            if (origin === pattern) return true;
        }
    }
    return false;
}

// ── Main Router ─────────────────────────────────────────────────

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const origin = request.headers.get("Origin") || "";
        const allowedOrigin = isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0];

        const corsHeaders = {
            "Access-Control-Allow-Origin": allowedOrigin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        const path = url.pathname;
        const method = request.method;

        try {
            // ── Health ────────────────────────────────────────
            if (path === "/health" || path === "/api/health") {
                return json({ ok: true, service: "iConstrution.com API", status: "running",
                    db: env.DB ? "connected" : "missing",
                    kv: env.SESSIONS ? "connected" : "missing",
                    r2: env.FILES ? "connected" : "missing",
                    gemini: env.GEMINI_API_KEY ? "configured" : "missing",
                    openai: env.OPENAI_API_KEY ? "configured" : "missing",
                    time: new Date().toISOString()
                }, corsHeaders);
            }

            // ── AI Proxy: Gemini ──────────────────────────────
            if (path === "/api/gemini/generate" && method === "POST") {
                return await proxyGemini(request, env, corsHeaders);
            }

            // ── AI Proxy: OpenAI ──────────────────────────────
            if (path === "/api/openai/chat" && method === "POST") {
                return await proxyOpenAI(request, env, corsHeaders);
            }

            // ── Freedom Pay Proxy ─────────────────────────────────
            if (path === "/api/freedompay/init" && method === "POST") {
                return await proxyFreedomPay(request, env, corsHeaders);
            }

            // -- Auth Routes
            if (path === "/api/v1/auth/register" && method === "POST") return await authRegister(request, env, corsHeaders);
            if (path === "/api/v1/auth/login" && method === "POST") return await authLogin(request, env, corsHeaders);
            if (path === "/api/v1/auth/me" && method === "GET") return await authMe(request, env, corsHeaders);
            if ((path === "/api/v1/auth/logout" || path === "/auth/logout") && method === "POST") return json({ success: true }, corsHeaders);
            if (path === "/api/v1/auth/refresh" && method === "POST") {
                const u = await authenticate(request, env);
                if (!u) return json({ ok: false, error: "Token invalid" }, corsHeaders, 401);
                const t = await generateToken(u.userId, u.role, env.JWT_SECRET || "default-secret", 900);
                return json({ success: true, token: t, expiresIn: 900 }, corsHeaders);
            }

            // -- Orders Routes
            if (path === "/api/v1/orders" && method === "GET") return await ordersList(request, env, corsHeaders);
            if (path === "/api/v1/orders/public" && method === "GET") return await ordersPublic(request, env, corsHeaders);
            if (path === "/api/v1/orders" && method === "POST") return await ordersCreate(request, env, corsHeaders);
            if (path.match(/^\/api\/v1\/orders\/[\w-]+\/proposals$/) && method === "POST") return await ordersSubmitProposal(path.split('/')[4], request, env, corsHeaders);
            if (path.match(/^\/api\/v1\/orders\/[\w-]+\/assign$/) && method === "POST") return await ordersAssign(path.split('/')[4], request, env, corsHeaders);
            if (path.match(/^\/api\/v1\/orders\/[\w-]+\/status$/) && method === "POST") return await ordersChangeStatus(path.split('/')[4], request, env, corsHeaders);
            if (path.match(/^\/api\/v1\/orders\/[\w-]+\/publish$/) && method === "POST") return await ordersPublish(path.split('/')[4], request, env, corsHeaders);
            if (path.match(/^\/api\/v1\/orders\/[\w-]+$/) && method === "GET") return await ordersGet(path.split('/').pop(), env, corsHeaders);
            if (path.match(/^\/api\/v1\/orders\/[\w-]+$/) && method === "PUT") return await ordersUpdate(path.split('/').pop(), request, env, corsHeaders);

            // -- Users Routes
            if (path === "/api/v1/users/profile" && method === "GET") return await userProfile(request, env, corsHeaders);
            if (path === "/api/v1/users/profile" && method === "PUT") return await userProfileUpdate(request, env, corsHeaders);

            // -- Finance Routes
            if (path === "/api/v1/finance/wallet" && method === "GET") return await financeWallet(request, env, corsHeaders);
            if (path === "/api/v1/finance/deposit" && method === "POST") return await financeDeposit(request, env, corsHeaders);
            if (path === "/api/v1/finance/transactions" && method === "GET") return await financeTransactions(request, env, corsHeaders);
            if (path === "/api/v1/finance/withdraw/request" && method === "POST") return await financeWithdrawRequest(request, env, corsHeaders);

            // -- Notifications Routes
            if (path === "/api/v1/notifications" && method === "GET") return await notificationsList(request, env, corsHeaders);
            if (path === "/api/v1/notifications/read-all" && method === "POST") return await notificationsReadAll(request, env, corsHeaders);
            if (path.match(/^\/api\/v1\/notifications\/[\w-]+\/read$/) && method === "POST") return await notificationsRead(path.split('/')[4], request, env, corsHeaders);

            // -- Admin Routes
            if (path === "/api/v1/admin/stats" && method === "GET") return await adminStats(request, env, corsHeaders);
            if (path === "/api/v1/admin/users" && method === "GET") return await adminUsers(request, env, corsHeaders);

            // -- File Upload / Download
            if (path === "/api/v1/files/upload" && method === "POST") return await fileUpload(request, env, corsHeaders);
            if (path.startsWith("/api/v1/files/uploads/") && method === "GET") return await fileDownload(path, env, corsHeaders);

            // -- Config
            if (path === "/api/config") return json({ gemini: !!env.GEMINI_API_KEY, openai: !!env.OPENAI_API_KEY, version: "3.0.0" }, corsHeaders);

            // -- 404
            return json({ ok: false, error: "Route not found", path }, corsHeaders, 404);

        } catch (error) {
            console.error("Worker error:", error);
            return json({ ok: false, error: error.message || "Internal error" }, corsHeaders, 500);
        }
    }
};

// ════════════════════════════════════════════════════════════════
// AUTH HANDLERS
// ════════════════════════════════════════════════════════════════

async function authRegister(request, env, cors) {
    const { phone, email, password, role = "customer", firstName, lastName } = await request.json();
    if (!phone || !password) return json({ ok: false, error: "Телефон и пароль обязательны" }, cors, 400);

    // Check existing
    const existing = await env.DB.prepare("SELECT id FROM users WHERE phone = ?").bind(phone).first();
    if (existing) return json({ ok: false, error: "Пользователь уже существует" }, cors, 409);

    const id = crypto.randomUUID();
    const pwHash = await hashPassword(password);
    const now = new Date().toISOString();

    await env.DB.prepare(
        `INSERT INTO users (id, phone, email, password_hash, first_name, last_name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, phone, email || null, pwHash, firstName || null, lastName || null, role, now, now).run();

    // Create wallet
    await env.DB.prepare("INSERT INTO wallets (id, user_id, created_at) VALUES (?, ?, ?)")
        .bind(crypto.randomUUID(), id, now).run();

    const token = await generateToken(id, role, env.JWT_SECRET || "default-secret");
    return json({ success: true, user: { id, phone, role }, token, expiresIn: 900 }, cors);
}

async function authLogin(request, env, cors) {
    const { phone, password } = await request.json();
    if (!phone || !password) return json({ ok: false, error: "Телефон и пароль обязательны" }, cors, 400);

    const user = await env.DB.prepare("SELECT id, phone, password_hash, role, first_name, last_name FROM users WHERE phone = ?")
        .bind(phone).first();
    if (!user) return json({ ok: false, error: "Неверный телефон или пароль" }, cors, 401);

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return json({ ok: false, error: "Неверный телефон или пароль" }, cors, 401);

    const token = await generateToken(user.id, user.role, env.JWT_SECRET || "default-secret");
    return json({
        success: true,
        user: { id: user.id, phone: user.phone, role: user.role, firstName: user.first_name, lastName: user.last_name },
        token, expiresIn: 900
    }, cors);
}

async function authMe(request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);

    const row = await env.DB.prepare(
        `SELECT u.*, up.city, up.company_name, up.experience_years
         FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = ?`
    ).bind(user.userId).first();

    if (!row) return json({ ok: false, error: "Пользователь не найден" }, cors, 404);
    return json({
        success: true,
        user: { id: row.id, phone: row.phone, email: row.email, role: row.role,
            firstName: row.first_name, lastName: row.last_name, city: row.city,
            companyName: row.company_name, experienceYears: row.experience_years }
    }, cors);
}

async function authenticate(request, env) {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) return null;
    return await hmacVerify(auth.slice(7), env.JWT_SECRET || "default-secret");
}

// ════════════════════════════════════════════════════════════════
// ORDERS HANDLERS
// ════════════════════════════════════════════════════════════════

async function ordersList(request, env, cors) {
    const user = await authenticate(request, env);
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit")) || 50;

    let sql = "SELECT * FROM orders";
    const params = [];

    if (user) {
        sql += " WHERE customer_id = ?";
        params.push(user.userId);
        if (status) { sql += " AND status = ?"; params.push(status); }
    } else if (status) {
        sql += " WHERE status = ?";
        params.push(status);
    }

    sql += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const { results } = await env.DB.prepare(sql).bind(...params).all();
    return json({ success: true, orders: results, total: results.length }, cors);
}

async function ordersCreate(request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);

    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
        `INSERT INTO orders (id, customer_id, title, description, category, address, estimated_price, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
    ).bind(id, user.userId, body.title || "Новый заказ", body.description || null,
        body.category || null, body.address || null, body.estimatedPrice || 0, now, now).run();

    return json({ success: true, order: { id, status: "draft" } }, cors, 201);
}

async function ordersGet(id, env, cors) {
    const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
    if (!order) return json({ ok: false, error: "Заказ не найден" }, cors, 404);

    // Get estimate items
    const { results: items } = await env.DB.prepare(
        "SELECT * FROM order_estimate_items WHERE order_id = ?"
    ).bind(id).all();

    return json({ success: true, order: { ...order, estimateItems: items } }, cors);
}

// Whitelist of allowed columns for orders update (prevents SQL injection via column names)
const ORDERS_UPDATE_FIELDS = {
    title: 'title', description: 'description', category: 'category',
    address: 'address', phone: 'phone', estimatedPrice: 'estimated_price',
    finalPrice: 'final_price', status: 'status', deadline: 'deadline',
    executorId: 'executor_id'
};

async function ordersUpdate(id, request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);

    const body = await request.json();
    const now = new Date().toISOString();
    const sets = [];
    const vals = [];

    for (const [key, val] of Object.entries(body)) {
        const col = ORDERS_UPDATE_FIELDS[key];
        if (!col) continue; // Skip unknown fields — prevents SQL injection
        sets.push(`${col} = ?`);
        vals.push(val);
    }
    if (sets.length === 0) return json({ success: true, message: "Нет изменений" }, cors);
    sets.push("updated_at = ?");
    vals.push(now);
    vals.push(id);

    await env.DB.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
    return json({ success: true, message: "Заказ обновлён" }, cors);
}

async function ordersPublic(request, env, cors) {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit")) || 50;
    const category = url.searchParams.get("category");
    let sql = "SELECT o.*, u.first_name, u.last_name FROM orders o LEFT JOIN users u ON o.customer_id = u.id WHERE o.status = 'published'";
    const params = [];
    if (category) { sql += " AND o.category = ?"; params.push(category); }
    sql += " ORDER BY o.created_at DESC LIMIT ?";
    params.push(limit);
    const { results } = await env.DB.prepare(sql).bind(...params).all();
    return json({ success: true, orders: results, total: results.length }, cors);
}

async function ordersSubmitProposal(orderId, request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    // Store proposal in order_estimate_items reusing table, or create separate record
    await env.DB.prepare(
        "INSERT INTO order_estimate_items (id, order_id, name, unit, quantity, unit_price, total_price, created_at) VALUES (?,?,?,?,?,?,?,?)"
    ).bind(id, orderId, 'Предложение от ' + (user.role || 'executor'), 'компл.', 1,
        body.price || 0, body.price || 0, now).run();
    // Notify the customer who owns this order (look up customer_id)
    const order = await env.DB.prepare("SELECT customer_id FROM orders WHERE id = ?").bind(orderId).first();
    const customerId = order?.customer_id || null;
    await createNotification(env, customerId, orderId, 'new_proposal', `Новое предложение по заказу #${orderId.slice(0,8)}`);
    return json({ success: true, proposalId: id }, cors, 201);
}

async function ordersAssign(orderId, request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);
    const { executorId } = await request.json();
    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE orders SET executor_id = ?, status = 'assigned', updated_at = ? WHERE id = ?")
        .bind(executorId, now, orderId).run();
    await createNotification(env, executorId, orderId, 'order_assigned', `Вас назначили исполнителем заказа #${orderId.slice(0,8)}`);
    return json({ success: true, message: "Исполнитель назначен" }, cors);
}

async function ordersChangeStatus(orderId, request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);
    const { status } = await request.json();
    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?")
        .bind(status, now, orderId).run();
    return json({ success: true, status }, cors);
}

async function ordersPublish(orderId, request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);
    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE orders SET status = 'published', updated_at = ? WHERE id = ? AND customer_id = ?")
        .bind(now, orderId, user.userId).run();
    return json({ success: true, message: "Заказ опубликован" }, cors);
}

// ════════════════════════════════════════════════════════════════
// USER PROFILE
// ════════════════════════════════════════════════════════════════

async function userProfile(request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);

    const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.userId).first();
    if (!row) return json({ ok: false, error: "Пользователь не найден" }, cors, 404);

    const wallet = await env.DB.prepare("SELECT * FROM wallets WHERE user_id = ?").bind(user.userId).first();

    return json({
        success: true,
        user: { id: row.id, phone: row.phone, email: row.email, role: row.role,
            firstName: row.first_name, lastName: row.last_name },
        wallet: wallet ? { balanceKzt: wallet.balance_kzt, balanceUsd: wallet.balance_usd } : null
    }, cors);
}

async function userProfileUpdate(request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);
    const body = await request.json();
    const now = new Date().toISOString();
    const sets = []; const vals = [];
    if (body.firstName) { sets.push("first_name = ?"); vals.push(body.firstName); }
    if (body.lastName)  { sets.push("last_name = ?");  vals.push(body.lastName); }
    if (body.email)     { sets.push("email = ?");       vals.push(body.email); }
    if (sets.length === 0) return json({ success: true, message: "Нет изменений" }, cors);
    sets.push("updated_at = ?"); vals.push(now); vals.push(user.userId);
    await env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
    // Upsert profile
    if (body.city || body.companyName) {
        await env.DB.prepare(
            "INSERT INTO user_profiles (id, user_id, city, company_name, updated_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET city=excluded.city, company_name=excluded.company_name, updated_at=excluded.updated_at"
        ).bind(crypto.randomUUID(), user.userId, body.city||null, body.companyName||null, now).run();
    }
    return json({ success: true, message: "Профиль обновлён" }, cors);
}

// ════════ FINANCE ════════
async function financeWallet(request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);
    let wallet = await env.DB.prepare("SELECT * FROM wallets WHERE user_id = ?").bind(user.userId).first();
    if (!wallet) {
        const id = crypto.randomUUID(); const now = new Date().toISOString();
        await env.DB.prepare("INSERT INTO wallets (id, user_id, created_at) VALUES (?,?,?)").bind(id, user.userId, now).run();
        wallet = { balance_kzt: 0, balance_usd: 0 };
    }
    return json({ success: true, wallet: { balanceKzt: wallet.balance_kzt || 0, balanceUsd: wallet.balance_usd || 0 } }, cors);
}

async function financeDeposit(request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);
    const { amount } = await request.json();
    if (!amount || amount <= 0) return json({ ok: false, error: "Неверная сумма" }, cors, 400);
    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE wallets SET balance_kzt = balance_kzt + ?, updated_at = ? WHERE user_id = ?")
        .bind(Number(amount), now, user.userId).run();
    const txId = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO transactions (id, wallet_id, type, amount, currency, status, created_at) SELECT ?, id, 'deposit', ?, 'KZT', 'completed', ? FROM wallets WHERE user_id = ?")
        .bind(txId, Number(amount), now, user.userId).run();
    return json({ success: true, transactionId: txId, amount }, cors);
}

async function financeTransactions(request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);
    const { results } = await env.DB.prepare(
        "SELECT t.* FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE w.user_id = ? ORDER BY t.created_at DESC LIMIT 50"
    ).bind(user.userId).all();
    return json({ success: true, transactions: results }, cors);
}

async function financeWithdrawRequest(request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);
    const { amount, bankName, iban, recipientName } = await request.json();
    const now = new Date().toISOString();
    const wallet = await env.DB.prepare("SELECT * FROM wallets WHERE user_id = ?").bind(user.userId).first();
    if (!wallet || (wallet.balance_kzt || 0) < amount) return json({ ok: false, error: "Недостаточно средств" }, cors, 400);
    await env.DB.prepare("UPDATE wallets SET balance_kzt = balance_kzt - ?, updated_at = ? WHERE user_id = ?")
        .bind(Number(amount), now, user.userId).run();
    const txId = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO transactions (id, wallet_id, type, amount, currency, status, description, created_at) SELECT ?, id, 'withdrawal', ?, 'KZT', 'pending', ?, ? FROM wallets WHERE user_id = ?")
        .bind(txId, Number(amount), `${bankName} ${iban}`, now, user.userId).run();
    return json({ success: true, transactionId: txId }, cors);
}

// ════════ NOTIFICATIONS ════════
async function createNotification(env, userId, refId, type, message) {
    try {
        const id = crypto.randomUUID(); const now = new Date().toISOString();
        await env.DB.prepare("INSERT INTO notifications (id, user_id, type, message, ref_id, is_read, created_at) VALUES (?,?,?,?,?,0,?)")
            .bind(id, userId || '', type, message, refId || '', now).run();
    } catch(e) { console.warn('Notification error:', e.message); }
}

async function notificationsList(request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);
    const { results } = await env.DB.prepare(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
    ).bind(user.userId).all();
    return json({ success: true, notifications: results }, cors);
}

async function notificationsRead(notifId, request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);
    await env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?")
        .bind(notifId, user.userId).run();
    return json({ success: true }, cors);
}

async function notificationsReadAll(request, env, cors) {
    const user = await authenticate(request, env);
    if (!user) return json({ ok: false, error: "Не авторизован" }, cors, 401);
    await env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?")
        .bind(user.userId).run();
    return json({ success: true }, cors);
}

// ════════ ADMIN ════════
async function adminStats(request, env, cors) {
    const user = await authenticate(request, env);
    if (!user || user.role !== 'admin') return json({ ok: false, error: "Нет доступа" }, cors, 403);
    const [users, orders, wallets] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) as cnt FROM users").first(),
        env.DB.prepare("SELECT COUNT(*) as cnt, status FROM orders GROUP BY status").all(),
        env.DB.prepare("SELECT SUM(balance_kzt) as total FROM wallets").first()
    ]);
    return json({ success: true, stats: {
        totalUsers: users?.cnt || 0,
        orders: orders.results || [],
        totalBalance: wallets?.total || 0
    }}, cors);
}

async function adminUsers(request, env, cors) {
    const user = await authenticate(request, env);
    if (!user || user.role !== 'admin') return json({ ok: false, error: "Нет доступа" }, cors, 403);
    const { results } = await env.DB.prepare(
        "SELECT id, phone, email, role, first_name, last_name, created_at FROM users ORDER BY created_at DESC LIMIT 100"
    ).all();
    return json({ success: true, users: results }, cors);
}

// ════════════════════════════════════════════════════════════════
// FILE UPLOAD → R2
// ════════════════════════════════════════════════════════════════

async function fileUpload(request, env, cors) {
    if (!env.FILES) return json({ ok: false, error: "R2 not configured" }, cors, 500);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) return json({ ok: false, error: "Файл не указан" }, cors, 400);

    const ext = file.name.split('.').pop();
    const key = `uploads/${Date.now()}_${crypto.randomUUID().slice(0,8)}.${ext}`;

    await env.FILES.put(key, file.stream(), {
        httpMetadata: { contentType: file.type }
    });

    return json({
        success: true,
        file: { key, name: file.name, size: file.size, type: file.type,
            url: `/api/v1/files/${key}` }
    }, cors);
}

async function fileDownload(path, env, cors) {
    if (!env.FILES) return json({ ok: false, error: "R2 not configured" }, cors, 500);
    // path = /api/v1/files/uploads/xxx.jpg → key = uploads/xxx.jpg
    const key = path.replace('/api/v1/files/', '');
    const object = await env.FILES.get(key);
    if (!object) return json({ ok: false, error: "Файл не найден" }, cors, 404);
    const headers = new Headers(cors);
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return new Response(object.body, { headers });
}

// ════════════════════════════════════════════════════════════════
// AI PROXY (Gemini + OpenAI)
// ════════════════════════════════════════════════════════════════

async function proxyGemini(request, env, cors) {
    if (!env.GEMINI_API_KEY) return json({ ok: false, error: "Gemini not configured" }, cors, 500);
    const body = await request.json();
    const model = body.model || "gemini-2.5-flash";
    delete body.model;

    const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    const data = await resp.json();
    if (!resp.ok) return json({ ok: false, error: data.error?.message || "Gemini error" }, cors, resp.status);
    return json({ ok: true, ...data }, cors);
}

async function proxyOpenAI(request, env, cors) {
    if (!env.OPENAI_API_KEY) return json({ ok: false, error: "OpenAI not configured" }, cors, 500);
    const body = await request.json();

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.OPENAI_API_KEY}` },
        body: JSON.stringify(body)
    });
    const data = await resp.json();
    if (!resp.ok) return json({ ok: false, error: data.error?.message || "OpenAI error" }, cors, resp.status);
    return json({ ok: true, ...data }, cors);
}

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function json(data, cors, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...cors }
    });
}

// ════════════════════════════════════════════════════════════════
// FREEDOM PAY PROXY
// Forwards init_payment.php requests server-side to bypass CORS
// ════════════════════════════════════════════════════════════════

async function proxyFreedomPay(request, env, cors) {
    try {
        const body = await request.text();
        console.log('[FreedomPay Proxy] Forwarding request, body length:', body.length);

        const resp = await fetch('https://api.freedompay.kz/init_payment.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body
        });

        const responseText = await resp.text();
        console.log('[FreedomPay Proxy] Response status:', resp.status, 'body:', responseText.substring(0, 300));

        // Return the XML response as-is with CORS headers
        return new Response(responseText, {
            status: resp.status,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                ...cors
            }
        });
    } catch (err) {
        console.error('[FreedomPay Proxy] Error:', err);
        return json({ ok: false, error: 'Freedom Pay proxy error: ' + err.message }, cors, 502);
    }
}
