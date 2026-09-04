-- SQL DDL Schema for Body Weight Tracking & Calendar Reminders
-- Compatible with PostgreSQL, MySQL, H2, and SQLite

CREATE TABLE IF NOT EXISTS weight_logs (
    id BIGSERIAL PRIMARY KEY,
    weight NUMERIC(5, 2) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'kg',
    logged_at TIMESTAMP NOT NULL,
    reminder_date TIMESTAMP NOT NULL,
    notes TEXT,
    google_calendar_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index on logged_at for high-performance chronological queries
CREATE INDEX IF NOT EXISTS idx_weight_logs_logged_at ON weight_logs (logged_at DESC);
