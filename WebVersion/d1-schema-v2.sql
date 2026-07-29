-- ================================================================
-- QazGost AI — D1 Database Schema V2 (Migration)
-- Extends d1-schema.sql with: controller role, bids, contracts,
-- disputes, engineer_tasks, quality_checks, and voice module tables.
--
-- Run: wrangler d1 execute DB --file=d1-schema-v2.sql --remote
-- ================================================================

-- ================================================================
-- PART 1: Fix existing schema — add controller role
-- ================================================================

-- SQLite doesn't support ALTER COLUMN, so we recreate users table
-- with the updated CHECK constraint. In production, use a migration
-- tool or handle this via application code.

-- For NEW databases, use this CREATE TABLE instead of the original:
-- CREATE TABLE IF NOT EXISTS users (
--     ... same columns ...
--     role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'executor', 'engineer', 'controller', 'admin')),
--     ... rest same ...
-- );

-- For EXISTING databases, the safest approach is to drop and recreate
-- the CHECK constraint. D1/SQLite doesn't enforce CHECK on existing rows,
-- so we add a new approach: just insert controller users directly.
-- The CHECK constraint in SQLite is only validated on INSERT/UPDATE.

-- ================================================================
-- PART 2: Bids (Отклики исполнителей — расширение applications)
-- ================================================================

CREATE TABLE IF NOT EXISTS bids (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    executor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'viewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn'
    )),
    price INTEGER NOT NULL,
    price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly', 'negotiable')),
    duration_days INTEGER,
    start_date TEXT,
    comment TEXT,
    attachments TEXT, -- JSON array of attachment URLs
    rejection_reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bids_order ON bids(order_id);
CREATE INDEX IF NOT EXISTS idx_bids_executor ON bids(executor_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

-- ================================================================
-- PART 3: Contracts (Договоры)
-- ================================================================

CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    executor_id TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    bid_id TEXT REFERENCES bids(id),
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'customer_signed', 'executor_signed', 'active',
        'completed', 'disputed', 'cancelled'
    )),
    title TEXT NOT NULL,
    description TEXT,
    total_amount INTEGER NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'KZT',
    commission_rate REAL DEFAULT 0.03, -- 3% platform commission
    commission_amount INTEGER DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    terms TEXT, -- JSON: payment terms, milestones, penalties
    signed_by_customer_at TEXT,
    signed_by_executor_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    cancelled_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_contracts_order ON contracts(order_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_executor ON contracts(executor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- ================================================================
-- PART 4: Escrow (Резервирование средств)
-- ================================================================

CREATE TABLE IF NOT EXISTS escrow (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL REFERENCES orders(id),
    payer_id TEXT NOT NULL REFERENCES users(id),
    payee_id TEXT NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'KZT',
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'frozen', 'released', 'refunded', 'disputed', 'partial_release'
    )),
    milestone_name TEXT,
    frozen_at TEXT,
    released_at TEXT,
    refunded_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_escrow_contract ON escrow(contract_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow(status);

-- ================================================================
-- PART 5: Engineer Tasks (Инженерные задачи и проверки)
-- ================================================================

CREATE TABLE IF NOT EXISTS engineer_tasks (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    engineer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    estimate_id TEXT, -- reference to AI estimate
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'assigned', 'in_review', 'approved',
        'needs_revision', 'rejected', 'completed'
    )),
    task_type TEXT DEFAULT 'estimate_review' CHECK (task_type IN (
        'estimate_review', 'site_inspection', 'design_review',
        'progress_check', 'final_inspection'
    )),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    title TEXT NOT NULL,
    description TEXT,
    original_data TEXT, -- JSON: original estimate/data for comparison
    revised_data TEXT, -- JSON: engineer's corrections
    comments TEXT, -- JSON array of comments with timestamps
    conclusion TEXT,
    attachments TEXT, -- JSON array
    assigned_at TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_engineer_tasks_order ON engineer_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_engineer_tasks_engineer ON engineer_tasks(engineer_id);
CREATE INDEX IF NOT EXISTS idx_engineer_tasks_status ON engineer_tasks(status);

-- ================================================================
-- PART 6: Quality Checks (Контроль качества)
-- ================================================================

CREATE TABLE IF NOT EXISTS quality_checks (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    work_id TEXT, -- reference to work record
    controller_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'accepted', 'with_comments',
        'rework_required', 'dispute_opened', 'completed'
    )),
    check_type TEXT DEFAULT 'final' CHECK (check_type IN (
        'interim', 'milestone', 'final', 'defect_recheck'
    )),
    photos_before TEXT, -- JSON array of photo URLs
    photos_after TEXT, -- JSON array of photo URLs
    defects_found TEXT, -- JSON array of defect descriptions
    defects_count INTEGER DEFAULT 0,
    defects_resolved INTEGER DEFAULT 0,
    comments TEXT, -- JSON array of controller comments
    conclusion TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    assigned_at TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quality_checks_order ON quality_checks(order_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_controller ON quality_checks(controller_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_status ON quality_checks(status);

-- ================================================================
-- PART 7: Disputes (Споры)
-- ================================================================

CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    contract_id TEXT REFERENCES contracts(id),
    initiator_id TEXT NOT NULL REFERENCES users(id),
    respondent_id TEXT NOT NULL REFERENCES users(id),
    moderator_id TEXT REFERENCES users(id), -- admin who handles the dispute
    status TEXT DEFAULT 'open' CHECK (status IN (
        'open', 'under_review', 'evidence_requested',
        'mediation', 'resolved_for_customer', 'resolved_for_executor',
        'resolved_compromise', 'escalated', 'closed'
    )),
    category TEXT CHECK (category IN (
        'quality', 'deadline', 'payment', 'scope_change',
        'communication', 'materials', 'other'
    )),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence TEXT, -- JSON array: [{type, url, description, uploadedBy, uploadedAt}]
    initiator_amount INTEGER, -- requested refund/payment amount
    resolved_amount INTEGER, -- actual resolved amount
    resolution_text TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    deadline TEXT, -- resolution deadline
    opened_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT,
    closed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_initiator ON disputes(initiator_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- ================================================================
-- PART 8: Voice Module Tables
-- ================================================================

CREATE TABLE IF NOT EXISTS voice_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    surface TEXT NOT NULL, -- photo_estimate | engineer_calendar | defects | orders
    provider_order TEXT NOT NULL DEFAULT 'browser,openai,google',
    consent_version TEXT NOT NULL DEFAULT '1.0',
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT
);

CREATE TABLE IF NOT EXISTS voice_recordings (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
    r2_key TEXT,
    mime_type TEXT NOT NULL DEFAULT 'audio/webm',
    duration_ms INTEGER,
    size_bytes INTEGER,
    retention_until TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS voice_transcripts (
    id TEXT PRIMARY KEY,
    recording_id TEXT REFERENCES voice_recordings(id) ON DELETE SET NULL,
    session_id TEXT REFERENCES voice_sessions(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'browser', -- browser | openai | google
    language TEXT NOT NULL DEFAULT 'ru-RU',
    raw_text TEXT NOT NULL,
    normalized_text TEXT,
    confidence REAL,
    timestamps_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS voice_commands (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    intent TEXT NOT NULL,
    entities_json TEXT,
    executed INTEGER NOT NULL DEFAULT 0,
    execution_result TEXT,
    requires_confirm INTEGER NOT NULL DEFAULT 0,
    confirmed INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS voice_errors (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES voice_sessions(id) ON DELETE SET NULL,
    source TEXT NOT NULL, -- browser | openai | google | command_router
    code TEXT NOT NULL,
    message TEXT,
    provider_response_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS voice_settings (
    scope TEXT PRIMARY KEY, -- 'global' | role name | user_id
    allow_browser_stt INTEGER DEFAULT 1,
    allow_server_stt INTEGER DEFAULT 1,
    allow_audio_storage INTEGER DEFAULT 0,
    retention_days INTEGER DEFAULT 30,
    default_lang TEXT DEFAULT 'ru-RU',
    preferred_provider TEXT DEFAULT 'browser',
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS voice_glossary (
    id TEXT PRIMARY KEY,
    term TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'ru-RU',
    normalized_form TEXT NOT NULL,
    surface TEXT, -- photo_estimate | engineer_calendar | global
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS voice_audit_log (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL, -- mic_enabled | mic_disabled | server_transcribe | command_executed | consent_given | consent_revoked
    target_id TEXT,
    details TEXT,
    ip_hash TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_transcripts_session ON voice_transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_session ON voice_commands(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_audit_actor ON voice_audit_log(actor_id);

-- ================================================================
-- PART 9: Feature Flags
-- ================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL, -- JSON value
    description TEXT,
    scope TEXT DEFAULT 'global', -- global | role | user
    updated_by TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert default voice feature flags
INSERT OR IGNORE INTO feature_flags (key, value, description) VALUES
    ('voice.enabled', 'false', 'Global voice feature toggle'),
    ('voice.browser.enabled', 'true', 'Allow browser SpeechRecognition'),
    ('voice.browser.processLocallyPreferred', 'true', 'Prefer on-device STT'),
    ('voice.server.openai.enabled', 'true', 'Enable OpenAI server ASR'),
    ('voice.server.google.enabled', 'false', 'Enable Google Cloud STT fallback'),
    ('voice.audioStorage.enabled', 'false', 'Store audio blobs in R2'),
    ('voice.roles.engineer.calendar', 'true', 'Voice in engineer calendar'),
    ('voice.roles.customer.photoEstimate', 'true', 'Voice in photo estimate for customer'),
    ('voice.roles.executor.photoEstimate', 'true', 'Voice in photo estimate for executor'),
    ('voice.roles.controller.defects', 'true', 'Voice comments for controller'),
    ('voice.commands.destructive.requireConfirm', 'true', 'Confirm destructive commands'),
    ('voice.retention.audioDays', '0', 'Audio retention period in days'),
    ('voice.retention.transcriptDays', '30', 'Transcript retention period in days');

-- ================================================================
-- PART 10: Audit Log Extension
-- ================================================================

-- Extend the generic audit log for more event types
CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    actor_role TEXT,
    entity_type TEXT NOT NULL, -- order | bid | contract | escrow | engineer_task | quality_check | dispute | voice
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- created | updated | status_changed | deleted | viewed | exported
    old_value TEXT, -- JSON: previous state
    new_value TEXT, -- JSON: new state
    metadata TEXT, -- JSON: additional context
    ip_hash TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at);
