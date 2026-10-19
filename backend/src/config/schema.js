-- Schema for Email System Administration (Super Admin & Admin)

CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin') NOT NULL DEFAULT 'admin',
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    created_by INT UNSIGNED NULL,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_admins_created_by FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_admins_email (email),
    INDEX idx_admins_role (role),
    INDEX idx_admins_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auth & Verification Tokens (Refresh tokens, Password reset, and Super Admin invitations)
CREATE TABLE IF NOT EXISTS admin_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    type ENUM('refresh', 'password_reset', 'invite') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_tokens_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_admin_tokens_lookup (admin_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit / Activity logs (Track administrative actions, admin invites, config changes)
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_logs_admin_action (admin_id, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Per-Admin Custom SMTP Settings (Admins can opt for their own SMTP or default to platform SMTP)
CREATE TABLE IF NOT EXISTS admin_smtp_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL DEFAULT 'custom',
    host VARCHAR(255) NOT NULL,
    port INT UNSIGNED NOT NULL DEFAULT 587,
    secure BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(255) NOT NULL,
    password_encrypted TEXT NOT NULL,
    from_name VARCHAR(100) NULL,
    from_email VARCHAR(255) NOT NULL,
    reply_to VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_tested_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_smtp_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_admin_smtp_active (admin_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Canonical Email Templates (Only Super Admin can create, edit, or delete default templates)
CREATE TABLE IF NOT EXISTS email_templates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    subject VARCHAR(255) NOT NULL,
    body_html MEDIUMTEXT NOT NULL,
    body_text TEXT NULL,
    design_json JSON NULL,
    variables JSON NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'system',
    created_by INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_templates_created_by FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE RESTRICT,
    INDEX idx_templates_slug (slug),
    INDEX idx_templates_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Per-Admin Custom Overrides on top of default templates (Admins can customize and soft rollback without losing content)
CREATE TABLE IF NOT EXISTS admin_template_customizations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_id INT UNSIGNED NOT NULL,
    admin_id INT UNSIGNED NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html MEDIUMTEXT NOT NULL,
    body_text TEXT NULL,
    design_json JSON NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customization_template FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE CASCADE,
    CONSTRAINT fk_customization_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    UNIQUE KEY unique_admin_template (admin_id, template_id),
    INDEX idx_customization_active (admin_id, template_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
