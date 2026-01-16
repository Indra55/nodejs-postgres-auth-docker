-- =============================================
-- User Authentication Database Schema
-- =============================================
-- Supports: Local authentication + Google OAuth
-- Uses: UUID v7 for time-ordered unique IDs
-- Requires: PostgreSQL 17+ for native uuidv7()
-- =============================================

-- Create database (run this separately if needed)
-- CREATE DATABASE your_database_name;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    -- Primary key using UUID v7 (time-ordered, auto-generated)
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    
    -- Basic user info
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Local authentication (nullable for OAuth-only users)
    password VARCHAR(255),
    
    -- Google OAuth fields
    google_id VARCHAR(255) UNIQUE,
    
    -- Profile information
    avatar TEXT,                              -- Profile picture URL
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    bio TEXT,
    
    -- Authentication tracking
    auth_provider VARCHAR(50) DEFAULT 'local', -- 'local', 'google', 'github', etc.
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Email verification
    email_verified_at TIMESTAMPTZ,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMPTZ,
    
    -- Password reset
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMPTZ,
    
    -- Security
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),                -- Supports IPv6
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    
    -- Refresh token (for JWT refresh token strategy)
    refresh_token TEXT,
    refresh_token_expires TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES for faster queries
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_password_token ON users(reset_password_token);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- =============================================
-- TRIGGER: Auto-update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SESSIONS TABLE (for refresh tokens per device)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID NOT NULL,
    refresh_token TEXT NOT NULL,
    device_info TEXT,                         -- Browser/device info
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- =============================================
-- Sample data (for testing - remove in production)
-- =============================================
-- INSERT INTO users (username, email, password, auth_provider) 
-- VALUES ('testuser', 'test@example.com', '$2b$12$...hashed_password...', 'local');
