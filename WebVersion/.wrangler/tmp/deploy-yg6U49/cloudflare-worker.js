var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// cloudflare-worker.js
var ALLOWED_ORIGINS = [
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
  "http://localhost:8091"
];
function base64url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64url, "base64url");
function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}
__name(base64urlDecode, "base64urlDecode");
async function hmacSign(payload, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return `${data}.${base64url(String.fromCharCode(...new Uint8Array(sig)))}`;
}
__name(hmacSign, "hmacSign");
async function hmacVerify(token, secret) {
  try {
    const [header, body, sig] = token.split(".");
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = Uint8Array.from(base64urlDecode(sig), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(`${header}.${body}`));
    if (!valid) return null;
    const payload = JSON.parse(base64urlDecode(body));
    if (payload.exp && payload.exp < Date.now() / 1e3) return null;
    return payload;
  } catch {
    return null;
  }
}
__name(hmacVerify, "hmacVerify");
async function generateToken(userId, role, secret, expiresInSec = 900) {
  return hmacSign({
    userId,
    role,
    iat: Math.floor(Date.now() / 1e3),
    exp: Math.floor(Date.now() / 1e3) + expiresInSec
  }, secret);
}
__name(generateToken, "generateToken");
async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 1e5, hash: "SHA-256" }, key, 256);
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  const saltStr = btoa(String.fromCharCode(...salt));
  return `${saltStr}:${hash}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, stored) {
  const [saltStr, hashStr] = stored.split(":");
  const enc = new TextEncoder();
  const salt = Uint8Array.from(atob(saltStr), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 1e5, hash: "SHA-256" }, key, 256);
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return hash === hashStr;
}
__name(verifyPassword, "verifyPassword");
function isOriginAllowed(origin) {
  if (!origin) return false;
  for (const pattern of ALLOWED_ORIGINS) {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, "[a-z0-9-]+") + "$");
      if (regex.test(origin)) return true;
    } else {
      if (origin === pattern) return true;
    }
  }
  return false;
}
__name(isOriginAllowed, "isOriginAllowed");
var cloudflare_worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0];
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    const path = url.pathname;
    const method = request.method;
    try {
      if (path === "/health" || path === "/api/health") {
        return json({
          ok: true,
          service: "iConstrution.com API",
          status: "running",
          db: env.DB ? "connected" : "missing",
          kv: env.SESSIONS ? "connected" : "missing",
          r2: env.FILES ? "connected" : "missing",
          gemini: env.GEMINI_API_KEY ? "configured" : "missing",
          openai: env.OPENAI_API_KEY ? "configured" : "missing",
          time: (/* @__PURE__ */ new Date()).toISOString()
        }, corsHeaders);
      }
      if (path === "/api/gemini/generate" && method === "POST") {
        return await proxyGemini(request, env, corsHeaders);
      }
      if (path === "/api/openai/chat" && method === "POST") {
        return await proxyOpenAI(request, env, corsHeaders);
      }
      if (path === "/api/freedompay/init" && method === "POST") {
        return await proxyFreedomPay(request, env, corsHeaders);
        return json({ ok: true, status: "running" }, corsHeaders);
      }
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
      if (path === "/api/v1/orders" && method === "GET") return await ordersList(request, env, corsHeaders);
      if (path === "/api/v1/orders/public" && method === "GET") return await ordersPublic(request, env, corsHeaders);
      if (path === "/api/v1/orders" && method === "POST") return await ordersCreate(request, env, corsHeaders);
      if (path.match(/^\/api\/v1\/orders\/[\w-]+\/proposals$/) && method === "POST") return await ordersSubmitProposal(path.split("/")[4], request, env, corsHeaders);
      if (path.match(/^\/api\/v1\/orders\/[\w-]+\/assign$/) && method === "POST") return await ordersAssign(path.split("/")[4], request, env, corsHeaders);
      if (path.match(/^\/api\/v1\/orders\/[\w-]+\/status$/) && method === "POST") return await ordersChangeStatus(path.split("/")[4], request, env, corsHeaders);
      if (path.match(/^\/api\/v1\/orders\/[\w-]+\/publish$/) && method === "POST") return await ordersPublish(path.split("/")[4], request, env, corsHeaders);
      if (path.match(/^\/api\/v1\/orders\/[\w-]+$/) && method === "GET") return await ordersGet(path.split("/").pop(), env, corsHeaders);
      if (path.match(/^\/api\/v1\/orders\/[\w-]+$/) && method === "PUT") return await ordersUpdate(path.split("/").pop(), request, env, corsHeaders);
      if (path === "/api/v1/users/profile" && method === "GET") return await userProfile(request, env, corsHeaders);
      if (path === "/api/v1/users/profile" && method === "PUT") return await userProfileUpdate(request, env, corsHeaders);
      if (path === "/api/v1/finance/wallet" && method === "GET") return await financeWallet(request, env, corsHeaders);
      if (path === "/api/v1/finance/deposit" && method === "POST") return await financeDeposit(request, env, corsHeaders);
      if (path === "/api/v1/finance/transactions" && method === "GET") return await financeTransactions(request, env, corsHeaders);
      if (path === "/api/v1/finance/withdraw/request" && method === "POST") return await financeWithdrawRequest(request, env, corsHeaders);
      if (path === "/api/v1/notifications" && method === "GET") return await notificationsList(request, env, corsHeaders);
      if (path === "/api/v1/notifications/read-all" && method === "POST") return await notificationsReadAll(request, env, corsHeaders);
      if (path.match(/^\/api\/v1\/notifications\/[\w-]+\/read$/) && method === "POST") return await notificationsRead(path.split("/")[4], request, env, corsHeaders);
      if (path === "/api/v1/admin/stats" && method === "GET") return await adminStats(request, env, corsHeaders);
      if (path === "/api/v1/admin/users" && method === "GET") return await adminUsers(request, env, corsHeaders);
      if (path === "/api/v1/files/upload" && method === "POST") return await fileUpload(request, env, corsHeaders);
      if (path === "/api/config") return json({ gemini: !!env.GEMINI_API_KEY, openai: !!env.OPENAI_API_KEY, version: "3.0.0" }, corsHeaders);
      return json({ ok: false, error: "Route not found", path }, corsHeaders, 404);
    } catch (error) {
      console.error("Worker error:", error);
      return json({ ok: false, error: error.message || "Internal error" }, corsHeaders, 500);
    }
  }
};
async function authRegister(request, env, cors) {
  const { phone, email, password, role = "customer", firstName, lastName } = await request.json();
  if (!phone || !password) return json({ ok: false, error: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D \u0438 \u043F\u0430\u0440\u043E\u043B\u044C \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B" }, cors, 400);
  const existing = await env.DB.prepare("SELECT id FROM users WHERE phone = ?").bind(phone).first();
  if (existing) return json({ ok: false, error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442" }, cors, 409);
  const id = crypto.randomUUID();
  const pwHash = await hashPassword(password);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare(
    `INSERT INTO users (id, phone, email, password_hash, first_name, last_name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, phone, email || null, pwHash, firstName || null, lastName || null, role, now, now).run();
  await env.DB.prepare("INSERT INTO wallets (id, user_id, created_at) VALUES (?, ?, ?)").bind(crypto.randomUUID(), id, now).run();
  const token = await generateToken(id, role, env.JWT_SECRET || "default-secret");
  return json({ success: true, user: { id, phone, role }, token, expiresIn: 900 }, cors);
}
__name(authRegister, "authRegister");
async function authLogin(request, env, cors) {
  const { phone, password } = await request.json();
  if (!phone || !password) return json({ ok: false, error: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D \u0438 \u043F\u0430\u0440\u043E\u043B\u044C \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B" }, cors, 400);
  const user = await env.DB.prepare("SELECT id, phone, password_hash, role, first_name, last_name FROM users WHERE phone = ?").bind(phone).first();
  if (!user) return json({ ok: false, error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C" }, cors, 401);
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return json({ ok: false, error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C" }, cors, 401);
  const token = await generateToken(user.id, user.role, env.JWT_SECRET || "default-secret");
  return json({
    success: true,
    user: { id: user.id, phone: user.phone, role: user.role, firstName: user.first_name, lastName: user.last_name },
    token,
    expiresIn: 900
  }, cors);
}
__name(authLogin, "authLogin");
async function authMe(request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const row = await env.DB.prepare(
    `SELECT u.*, up.city, up.company_name, up.experience_years
         FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = ?`
  ).bind(user.userId).first();
  if (!row) return json({ ok: false, error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" }, cors, 404);
  return json({
    success: true,
    user: {
      id: row.id,
      phone: row.phone,
      email: row.email,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name,
      city: row.city,
      companyName: row.company_name,
      experienceYears: row.experience_years
    }
  }, cors);
}
__name(authMe, "authMe");
async function authenticate(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return await hmacVerify(auth.slice(7), env.JWT_SECRET || "default-secret");
}
__name(authenticate, "authenticate");
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
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
  } else if (status) {
    sql += " WHERE status = ?";
    params.push(status);
  }
  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return json({ success: true, orders: results, total: results.length }, cors);
}
__name(ordersList, "ordersList");
async function ordersCreate(request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const body = await request.json();
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare(
    `INSERT INTO orders (id, customer_id, title, description, category, address, estimated_price, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
  ).bind(
    id,
    user.userId,
    body.title || "\u041D\u043E\u0432\u044B\u0439 \u0437\u0430\u043A\u0430\u0437",
    body.description || null,
    body.category || null,
    body.address || null,
    body.estimatedPrice || 0,
    now,
    now
  ).run();
  return json({ success: true, order: { id, status: "draft" } }, cors, 201);
}
__name(ordersCreate, "ordersCreate");
async function ordersGet(id, env, cors) {
  const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
  if (!order) return json({ ok: false, error: "\u0417\u0430\u043A\u0430\u0437 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" }, cors, 404);
  const { results: items } = await env.DB.prepare(
    "SELECT * FROM order_estimate_items WHERE order_id = ?"
  ).bind(id).all();
  return json({ success: true, order: { ...order, estimateItems: items } }, cors);
}
__name(ordersGet, "ordersGet");
async function ordersUpdate(id, request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const body = await request.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const sets = [];
  const vals = [];
  for (const [key, val] of Object.entries(body)) {
    const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    sets.push(`${col} = ?`);
    vals.push(val);
  }
  sets.push("updated_at = ?");
  vals.push(now);
  vals.push(id);
  await env.DB.prepare(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
  return json({ success: true, message: "\u0417\u0430\u043A\u0430\u0437 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D" }, cors);
}
__name(ordersUpdate, "ordersUpdate");
async function ordersPublic(request, env, cors) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit")) || 50;
  const category = url.searchParams.get("category");
  let sql = "SELECT o.*, u.first_name, u.last_name FROM orders o LEFT JOIN users u ON o.customer_id = u.id WHERE o.status = 'published'";
  const params = [];
  if (category) {
    sql += " AND o.category = ?";
    params.push(category);
  }
  sql += " ORDER BY o.created_at DESC LIMIT ?";
  params.push(limit);
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return json({ success: true, orders: results, total: results.length }, cors);
}
__name(ordersPublic, "ordersPublic");
async function ordersSubmitProposal(orderId, request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const body = await request.json();
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare(
    "INSERT INTO order_estimate_items (id, order_id, name, unit, quantity, unit_price, total_price, created_at) VALUES (?,?,?,?,?,?,?,?)"
  ).bind(
    id,
    orderId,
    "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043E\u0442 " + (user.role || "executor"),
    "\u043A\u043E\u043C\u043F\u043B.",
    1,
    body.price || 0,
    body.price || 0,
    now
  ).run();
  await createNotification(env, null, orderId, "new_proposal", `\u041D\u043E\u0432\u043E\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043F\u043E \u0437\u0430\u043A\u0430\u0437\u0443 #${orderId.slice(0, 8)}`);
  return json({ success: true, proposalId: id }, cors, 201);
}
__name(ordersSubmitProposal, "ordersSubmitProposal");
async function ordersAssign(orderId, request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const { executorId } = await request.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare("UPDATE orders SET executor_id = ?, status = 'assigned', updated_at = ? WHERE id = ?").bind(executorId, now, orderId).run();
  await createNotification(env, executorId, orderId, "order_assigned", `\u0412\u0430\u0441 \u043D\u0430\u0437\u043D\u0430\u0447\u0438\u043B\u0438 \u0438\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u0435\u043C \u0437\u0430\u043A\u0430\u0437\u0430 #${orderId.slice(0, 8)}`);
  return json({ success: true, message: "\u0418\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D" }, cors);
}
__name(ordersAssign, "ordersAssign");
async function ordersChangeStatus(orderId, request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const { status } = await request.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").bind(status, now, orderId).run();
  return json({ success: true, status }, cors);
}
__name(ordersChangeStatus, "ordersChangeStatus");
async function ordersPublish(orderId, request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare("UPDATE orders SET status = 'published', updated_at = ? WHERE id = ? AND customer_id = ?").bind(now, orderId, user.userId).run();
  return json({ success: true, message: "\u0417\u0430\u043A\u0430\u0437 \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D" }, cors);
}
__name(ordersPublish, "ordersPublish");
async function userProfile(request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.userId).first();
  if (!row) return json({ ok: false, error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" }, cors, 404);
  const wallet = await env.DB.prepare("SELECT * FROM wallets WHERE user_id = ?").bind(user.userId).first();
  return json({
    success: true,
    user: {
      id: row.id,
      phone: row.phone,
      email: row.email,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name
    },
    wallet: wallet ? { balanceKzt: wallet.balance_kzt, balanceUsd: wallet.balance_usd } : null
  }, cors);
}
__name(userProfile, "userProfile");
async function userProfileUpdate(request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const body = await request.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const sets = [];
  const vals = [];
  if (body.firstName) {
    sets.push("first_name = ?");
    vals.push(body.firstName);
  }
  if (body.lastName) {
    sets.push("last_name = ?");
    vals.push(body.lastName);
  }
  if (body.email) {
    sets.push("email = ?");
    vals.push(body.email);
  }
  if (sets.length === 0) return json({ success: true, message: "\u041D\u0435\u0442 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439" }, cors);
  sets.push("updated_at = ?");
  vals.push(now);
  vals.push(user.userId);
  await env.DB.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
  if (body.city || body.companyName) {
    await env.DB.prepare(
      "INSERT INTO user_profiles (id, user_id, city, company_name, updated_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET city=excluded.city, company_name=excluded.company_name, updated_at=excluded.updated_at"
    ).bind(crypto.randomUUID(), user.userId, body.city || null, body.companyName || null, now).run();
  }
  return json({ success: true, message: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D" }, cors);
}
__name(userProfileUpdate, "userProfileUpdate");
async function financeWallet(request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  let wallet = await env.DB.prepare("SELECT * FROM wallets WHERE user_id = ?").bind(user.userId).first();
  if (!wallet) {
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare("INSERT INTO wallets (id, user_id, created_at) VALUES (?,?,?)").bind(id, user.userId, now).run();
    wallet = { balance_kzt: 0, balance_usd: 0 };
  }
  return json({ success: true, wallet: { balanceKzt: wallet.balance_kzt || 0, balanceUsd: wallet.balance_usd || 0 } }, cors);
}
__name(financeWallet, "financeWallet");
async function financeDeposit(request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const { amount } = await request.json();
  if (!amount || amount <= 0) return json({ ok: false, error: "\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0443\u043C\u043C\u0430" }, cors, 400);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare("UPDATE wallets SET balance_kzt = balance_kzt + ?, updated_at = ? WHERE user_id = ?").bind(Number(amount), now, user.userId).run();
  const txId = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO transactions (id, wallet_id, type, amount, currency, status, created_at) SELECT ?, id, 'deposit', ?, 'KZT', 'completed', ? FROM wallets WHERE user_id = ?").bind(txId, Number(amount), now, user.userId).run();
  return json({ success: true, transactionId: txId, amount }, cors);
}
__name(financeDeposit, "financeDeposit");
async function financeTransactions(request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const { results } = await env.DB.prepare(
    "SELECT t.* FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE w.user_id = ? ORDER BY t.created_at DESC LIMIT 50"
  ).bind(user.userId).all();
  return json({ success: true, transactions: results }, cors);
}
__name(financeTransactions, "financeTransactions");
async function financeWithdrawRequest(request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const { amount, bankName, iban, recipientName } = await request.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const wallet = await env.DB.prepare("SELECT * FROM wallets WHERE user_id = ?").bind(user.userId).first();
  if (!wallet || (wallet.balance_kzt || 0) < amount) return json({ ok: false, error: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0441\u0440\u0435\u0434\u0441\u0442\u0432" }, cors, 400);
  await env.DB.prepare("UPDATE wallets SET balance_kzt = balance_kzt - ?, updated_at = ? WHERE user_id = ?").bind(Number(amount), now, user.userId).run();
  const txId = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO transactions (id, wallet_id, type, amount, currency, status, description, created_at) SELECT ?, id, 'withdrawal', ?, 'KZT', 'pending', ?, ? FROM wallets WHERE user_id = ?").bind(txId, Number(amount), `${bankName} ${iban}`, now, user.userId).run();
  return json({ success: true, transactionId: txId }, cors);
}
__name(financeWithdrawRequest, "financeWithdrawRequest");
async function createNotification(env, userId, refId, type, message) {
  try {
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare("INSERT INTO notifications (id, user_id, type, message, ref_id, is_read, created_at) VALUES (?,?,?,?,?,0,?)").bind(id, userId || "", type, message, refId || "", now).run();
  } catch (e) {
    console.warn("Notification error:", e.message);
  }
}
__name(createNotification, "createNotification");
async function notificationsList(request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  const { results } = await env.DB.prepare(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
  ).bind(user.userId).all();
  return json({ success: true, notifications: results }, cors);
}
__name(notificationsList, "notificationsList");
async function notificationsRead(notifId, request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  await env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?").bind(notifId, user.userId).run();
  return json({ success: true }, cors);
}
__name(notificationsRead, "notificationsRead");
async function notificationsReadAll(request, env, cors) {
  const user = await authenticate(request, env);
  if (!user) return json({ ok: false, error: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" }, cors, 401);
  await env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").bind(user.userId).run();
  return json({ success: true }, cors);
}
__name(notificationsReadAll, "notificationsReadAll");
async function adminStats(request, env, cors) {
  const user = await authenticate(request, env);
  if (!user || user.role !== "admin") return json({ ok: false, error: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430" }, cors, 403);
  const [users, orders, wallets] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as cnt FROM users").first(),
    env.DB.prepare("SELECT COUNT(*) as cnt, status FROM orders GROUP BY status").all(),
    env.DB.prepare("SELECT SUM(balance_kzt) as total FROM wallets").first()
  ]);
  return json({ success: true, stats: {
    totalUsers: users?.cnt || 0,
    orders: orders.results || [],
    totalBalance: wallets?.total || 0
  } }, cors);
}
__name(adminStats, "adminStats");
async function adminUsers(request, env, cors) {
  const user = await authenticate(request, env);
  if (!user || user.role !== "admin") return json({ ok: false, error: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430" }, cors, 403);
  const { results } = await env.DB.prepare(
    "SELECT id, phone, email, role, first_name, last_name, created_at FROM users ORDER BY created_at DESC LIMIT 100"
  ).all();
  return json({ success: true, users: results }, cors);
}
__name(adminUsers, "adminUsers");
async function fileUpload(request, env, cors) {
  if (!env.FILES) return json({ ok: false, error: "R2 not configured" }, cors, 500);
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) return json({ ok: false, error: "\u0424\u0430\u0439\u043B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D" }, cors, 400);
  const ext = file.name.split(".").pop();
  const key = `uploads/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
  await env.FILES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  });
  return json({
    success: true,
    file: {
      key,
      name: file.name,
      size: file.size,
      type: file.type,
      url: `/api/v1/files/${key}`
    }
  }, cors);
}
__name(fileUpload, "fileUpload");
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
__name(proxyGemini, "proxyGemini");
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
__name(proxyOpenAI, "proxyOpenAI");
function json(data, cors, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors }
  });
}
__name(json, "json");
async function proxyFreedomPay(request, env, cors) {
  try {
    const body = await request.text();
    console.log("[FreedomPay Proxy] Forwarding request, body length:", body.length);
    const resp = await fetch("https://api.freedompay.kz/init_payment.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });
    const responseText = await resp.text();
    console.log("[FreedomPay Proxy] Response status:", resp.status, "body:", responseText.substring(0, 300));
    return new Response(responseText, {
      status: resp.status,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        ...cors
      }
    });
  } catch (err) {
    console.error("[FreedomPay Proxy] Error:", err);
    return json({ ok: false, error: "Freedom Pay proxy error: " + err.message }, cors, 502);
  }
}
__name(proxyFreedomPay, "proxyFreedomPay");
export {
  cloudflare_worker_default as default
};
//# sourceMappingURL=cloudflare-worker.js.map
