-- ================================================================
-- QazGost AI — D1 Database Schema (SQLite / Cloudflare D1)
-- Run: wrangler d1 execute DB --file=d1-schema.sql --remote
-- ================================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'executor', 'engineer', 'admin')),
    is_verified INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    rating REAL DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    iin TEXT,
    is_iin_verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    city TEXT,
    address TEXT,
    company_name TEXT,
    is_company INTEGER DEFAULT 0,
    inn TEXT,
    description TEXT,
    experience_years INTEGER DEFAULT 0,
    hourly_rate INTEGER DEFAULT 0,
    telegram_id TEXT,
    telegram_username TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    executor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    address TEXT,
    phone TEXT,
    estimated_price INTEGER DEFAULT 0,
    final_price INTEGER,
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft','published','pending','assigned','in_progress',
        'estimated','submitted','on_review','revision','completed','cancelled','expired'
    )),
    deadline TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    published_at TEXT,
    assigned_at TEXT,
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_executor ON orders(executor_id);

-- Order Estimate Items
CREATE TABLE IF NOT EXISTS order_estimate_items (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit TEXT,
    quantity REAL,
    unit_price INTEGER,
    total_price INTEGER,
    category TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Order Photos
CREATE TABLE IF NOT EXISTS order_photos (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    type TEXT DEFAULT 'before' CHECK (type IN (
        'before','during','after','measures','hidden','obstacles','problems','defect'
    )),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Wallets
CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance_kzt INTEGER DEFAULT 0,
    balance_usd INTEGER DEFAULT 0,
    frozen_kzt INTEGER DEFAULT 0,
    frozen_usd INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    wallet_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN (
        'deposit','withdrawal','payment','refund','commission','subscription','bonus',
        'escrow_freeze','escrow_release','escrow_refund','milestone_release'
    )),
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'KZT',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','cancelled')),
    description TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

-- Engineer Projects
CREATE TABLE IF NOT EXISTS engineer_projects (
    id TEXT PRIMARY KEY,
    engineer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    object_address TEXT,
    total_price INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK (status IN (
        'in_progress','submitted','on_review','revision','completed','cancelled'
    )),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    order_id TEXT,
    sender_id TEXT,
    sender_name TEXT,
    text TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_messages(room_id);

-- Notifications
-- ref_id = related order/estimate ID; message = human-readable text
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT,
    message TEXT,
    ref_id TEXT,
    data TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    reviewer_id TEXT,
    reviewee_id TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    revoked_at TEXT
);

-- ================================================================
-- MIGRATION: run only if DB already exists with old schema
-- ================================================================
-- ALTER TABLE notifications ADD COLUMN ref_id TEXT;
-- ALTER TABLE notifications ADD COLUMN message TEXT;
-- ALTER TABLE orders ADD COLUMN phone TEXT;
-- ALTER TABLE orders ADD COLUMN estimated_price INTEGER DEFAULT 0;
