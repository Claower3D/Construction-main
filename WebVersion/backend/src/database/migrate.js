/**
 * Database Migration Script
 * Creates all required tables for QAZGOST AI
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('./connection');

const migrations = [
    // ========== USERS ==========
    `
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        avatar_url TEXT,
        role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'executor', 'engineer', 'admin')),
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        rating DECIMAL(3,2) DEFAULT 0,
        reviews_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,

    // ========== USER PROFILES ==========
    `
    CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        city VARCHAR(100),
        address TEXT,
        company_name VARCHAR(255),
        is_company BOOLEAN DEFAULT FALSE,
        inn VARCHAR(20),
        description TEXT,
        experience_years INT DEFAULT 0,
        hourly_rate INT DEFAULT 0,
        portfolio_urls TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
    );
    `,

    // ========== SPECIALIZATIONS ==========
    `
    CREATE TABLE IF NOT EXISTS specializations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(10),
        description TEXT,
        category VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS user_specializations (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        specialization_id UUID REFERENCES specializations(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, specialization_id)
    );
    `,

    // ========== ORDERS ==========
    `
    CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number SERIAL,
        customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        executor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        address TEXT,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        estimated_price BIGINT DEFAULT 0,
        final_price BIGINT,
        status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
            'draft', 'published', 'pending', 'assigned', 'in_progress',
            'submitted', 'on_review', 'revision', 'completed', 'cancelled', 'expired'
        )),
        deadline TIMESTAMPTZ,
        phone_consent_given BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        published_at TIMESTAMPTZ,
        assigned_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ
    );
    
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_executor ON orders(executor_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
    `,

    // ========== ORDER PHOTOS ==========
    `
    CREATE TABLE IF NOT EXISTS order_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        type VARCHAR(20) DEFAULT 'before' CHECK (type IN ('before', 'after', 'defect')),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,

    // ========== ORDER ESTIMATE ITEMS ==========
    `
    CREATE TABLE IF NOT EXISTS order_estimate_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(20),
        quantity DECIMAL(10,2),
        unit_price BIGINT,
        total_price BIGINT,
        category VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,

    // ========== PROPOSALS (Заявки от исполнителей) ==========
    `
    CREATE TABLE IF NOT EXISTS proposals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        executor_id UUID REFERENCES users(id) ON DELETE CASCADE,
        price BIGINT NOT NULL,
        duration_days INT,
        earliest_start_date DATE,
        comment TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(order_id, executor_id)
    );
    `,

    // ========== ENGINEER REQUESTS ==========
    `
    CREATE TABLE IF NOT EXISTS engineer_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_number SERIAL,
        customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        object_name VARCHAR(255),
        object_address TEXT,
        description TEXT,
        requirements TEXT,
        total_price BIGINT DEFAULT 0,
        status VARCHAR(30) DEFAULT 'open' CHECK (status IN (
            'open', 'assigned', 'in_progress', 'submitted', 'on_review', 'revision', 'completed', 'cancelled'
        )),
        deadline TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,

    // ========== ENGINEER SOLUTIONS (Заказанные решения) ==========
    `
    CREATE TABLE IF NOT EXISTS engineer_request_solutions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID REFERENCES engineer_requests(id) ON DELETE CASCADE,
        solution_type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price BIGINT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,

    // ========== ENGINEER PROJECTS (Проекты в работе) ==========
    `
    CREATE TABLE IF NOT EXISTS engineer_projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_number SERIAL,
        request_id UUID REFERENCES engineer_requests(id) ON DELETE SET NULL,
        engineer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        object_address TEXT,
        total_price BIGINT DEFAULT 0,
        progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        status VARCHAR(30) DEFAULT 'in_progress' CHECK (status IN (
            'in_progress', 'submitted', 'on_review', 'revision', 'completed', 'cancelled'
        )),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        assigned_at TIMESTAMPTZ,
        submitted_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_eng_projects_engineer ON engineer_projects(engineer_id);
    CREATE INDEX IF NOT EXISTS idx_eng_projects_status ON engineer_projects(status);
    `,

    // ========== PROJECT FILES ==========
    `
    CREATE TABLE IF NOT EXISTS project_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES engineer_projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        type VARCHAR(50),
        size_bytes BIGINT,
        uploaded_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,

    // ========== PROJECT COMMENTS ==========
    `
    CREATE TABLE IF NOT EXISTS project_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES engineer_projects(id) ON DELETE CASCADE,
        author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        author_name VARCHAR(100),
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,

    // ========== DEFECTS ==========
    `
    CREATE TABLE IF NOT EXISTS defects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        project_id UUID REFERENCES engineer_projects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'fixed', 'verified', 'wontfix')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        fixed_at TIMESTAMPTZ
    );
    `,

    // ========== CHAT MESSAGES ==========
    `
    CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR(100) NOT NULL,
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        project_id UUID REFERENCES engineer_projects(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        sender_name VARCHAR(100),
        text TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_chat_order ON chat_messages(order_id);
    CREATE INDEX IF NOT EXISTS idx_chat_project ON chat_messages(project_id);
    `,

    // ========== NOTIFICATIONS ==========
    `
    CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
    `,

    // ========== TRANSACTIONS (Wallets & Payments) ==========
    `
    CREATE TABLE IF NOT EXISTS wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        balance_kzt BIGINT DEFAULT 0,
        balance_usd BIGINT DEFAULT 0,
        frozen_kzt BIGINT DEFAULT 0,
        frozen_usd BIGINT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,

    `
    CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
        type VARCHAR(30) NOT NULL CHECK (type IN (
            'deposit', 'withdrawal', 'payment', 'refund', 'commission', 'subscription', 'bonus',
            'escrow_freeze', 'escrow_release', 'escrow_refund', 'milestone_release'
        )),
        amount BIGINT NOT NULL,
        currency VARCHAR(3) DEFAULT 'KZT',
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
        description TEXT,
        reference_id UUID,
        reference_type VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
    );
    
    CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    `,

    // ========== ESCROWS ==========
    `
    CREATE TABLE IF NOT EXISTS escrows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        contractor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        amount BIGINT NOT NULL,
        released_amount BIGINT DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'KZT',
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
            'pending', 'funded', 'released', 'refunded', 'disputed', 'cancelled'
        )),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_escrows_order ON escrows(order_id);
    CREATE INDEX IF NOT EXISTS idx_escrows_customer ON escrows(customer_id);
    CREATE INDEX IF NOT EXISTS idx_escrows_contractor ON escrows(contractor_id);
    `,

    `
    CREATE TABLE IF NOT EXISTS escrow_milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        escrow_id UUID REFERENCES escrows(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        amount BIGINT NOT NULL,
        sequence INT DEFAULT 1,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
            'pending', 'completed', 'released', 'disputed', 'cancelled'
        )),
        deadline TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        released_at TIMESTAMPTZ,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_milestones_escrow ON escrow_milestones(escrow_id);
    CREATE INDEX IF NOT EXISTS idx_milestones_status ON escrow_milestones(status);
    `,

    // ========== REVIEWS ==========
    `
    CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        project_id UUID REFERENCES engineer_projects(id) ON DELETE SET NULL,
        reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewee_id UUID REFERENCES users(id) ON DELETE SET NULL,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,

    // ========== REFRESH TOKENS ==========
    `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        device_info TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        revoked_at TIMESTAMPTZ
    );
    
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
    `,

    // ========== OTP CODES ==========
    `
    CREATE TABLE IF NOT EXISTS otp_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(10) NOT NULL,
        attempts INT DEFAULT 0,
        max_attempts INT DEFAULT 3,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        used_at TIMESTAMPTZ
    );
    
    CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);
    `,

    // ========== UPDATE TIMESTAMP TRIGGER ==========
    `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    `,

    `
    DO $$
    DECLARE
        t TEXT;
    BEGIN
        FOR t IN 
            SELECT table_name FROM information_schema.columns 
            WHERE column_name = 'updated_at' 
            AND table_schema = 'public'
        LOOP
            EXECUTE format('
                DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
                CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            ', t, t, t, t);
        END LOOP;
    END;
    $$;
    `,

    // ========== IIN/BIN VERIFICATION FIELDS ==========
    `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS iin VARCHAR(12);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_iin_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS iin_verified_at TIMESTAMPTZ;
    `,

    `
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bin VARCHAR(12);
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_bin_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bin_verified_at TIMESTAMPTZ;
    `,

    // ========== TELEGRAM BINDINGS ==========
    `
    CREATE TABLE IF NOT EXISTS telegram_bindings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        telegram_id VARCHAR(50),
        telegram_username VARCHAR(100),
        link_code VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
        expires_at TIMESTAMPTZ,
        linked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_tg_bindings_user ON telegram_bindings(user_id);
    CREATE INDEX IF NOT EXISTS idx_tg_bindings_tg_id ON telegram_bindings(telegram_id) WHERE status = 'active';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tg_bindings_code ON telegram_bindings(link_code) WHERE status = 'pending';
    `,

    // Telegram fields in user_profiles
    `
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(50);
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100);
    `,

];

async function migrate() {
    console.log('🚀 Starting database migration...\n');

    for (let i = 0; i < migrations.length; i++) {
        const sql = migrations[i];
        try {
            await pool.query(sql);
            // Extract table name for logging
            const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
            const name = match ? match[1] : `Migration ${i + 1}`;
            console.log(`✅ ${name}`);
        } catch (error) {
            console.error(`❌ Migration ${i + 1} failed:`, error.message);
            console.error('SQL:', sql.substring(0, 100) + '...');
        }
    }

    console.log('\n✨ Migration completed!');
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
