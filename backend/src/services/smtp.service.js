import nodemailer from 'nodemailer';
import pool from '../config/db.js';
import { getTransporter, getDefaultFrom, getDefaultReplyTo } from '../config/mailer.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { ErrorFactory } from '../utils/errorFactory.js';

const adminTransporterCache = new Map();

export class SmtpService {
    static async getAdminSmtp(adminId) {
        const [rows] = await pool.query(
            `SELECT id, admin_id, provider, host, port, secure, username, from_name, from_email,
                    reply_to, is_active, is_verified, last_tested_at, created_at, updated_at
             FROM admin_smtp_settings WHERE admin_id = ? LIMIT 1`,
            [adminId]
        );

        if (rows.length === 0) {
            return {
                hasCustomSmtp: false,
                isUsingCustom: false,
                source: 'platform_default',
                settings: null
            };
        }

        const settings = rows[0];
        return {
            hasCustomSmtp: true,
            isUsingCustom: Boolean(settings.is_active),
            source: settings.is_active ? 'custom_admin_smtp' : 'platform_default',
            settings: {
                ...settings,
                secure: Boolean(settings.secure),
                is_active: Boolean(settings.is_active),
                is_verified: Boolean(settings.is_verified)
            }
        };
    }

    static async verifyConfig({ host, port, secure, username, password }) {
        try {
            const testTransporter = nodemailer.createTransport({
                host,
                port: Number(port) || 587,
                secure: secure === true || secure === 'true' || Number(port) === 465,
                auth: { user: username, pass: password },
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 15000
            });

            await testTransporter.verify();
            return {
                success: true,
                message: 'Custom SMTP credentials verified successfully.'
            };
        } catch (error) {
            throw ErrorFactory.badRequest(`SMTP Verification Failed: ${error.message}`, null, 'SMTP_VERIFICATION_FAILED');
        }
    }

    static async saveAdminSmtp(adminId, data) {
        const {
            provider = 'custom',
            host,
            port = 587,
            secure = false,
            username,
            password,
            fromName,
            fromEmail,
            replyTo,
            isActive = true
        } = data;

        await this.verifyConfig({
            host,
            port,
            secure,
            username,
            password
        });

        const encryptedPass = encrypt(password);

        await pool.query(
            `INSERT INTO admin_smtp_settings 
                (admin_id, provider, host, port, secure, username, password_encrypted, from_name, from_email, reply_to, is_active, is_verified, last_tested_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)
             ON DUPLICATE KEY UPDATE
                provider = VALUES(provider),
                host = VALUES(host),
                port = VALUES(port),
                secure = VALUES(secure),
                username = VALUES(username),
                password_encrypted = VALUES(password_encrypted),
                from_name = VALUES(from_name),
                from_email = VALUES(from_email),
                reply_to = VALUES(reply_to),
                is_active = VALUES(is_active),
                is_verified = TRUE,
                last_tested_at = CURRENT_TIMESTAMP`,
            [
                adminId,
                provider,
                host,
                Number(port),
                Boolean(secure),
                username,
                encryptedPass,
                fromName || null,
                fromEmail,
                replyTo || null,
                Boolean(isActive)
            ]
        );

        adminTransporterCache.delete(adminId);

        return this.getAdminSmtp(adminId);
    }

    static async toggleAdminSmtp(adminId, isActive) {
        const [existing] = await pool.query(
            'SELECT id FROM admin_smtp_settings WHERE admin_id = ? LIMIT 1',
            [adminId]
        );

        if (existing.length === 0) {
            throw ErrorFactory.notFound('No custom SMTP configuration found to toggle.', 'SMTP_CONFIG_NOT_FOUND');
        }

        await pool.query(
            'UPDATE admin_smtp_settings SET is_active = ? WHERE admin_id = ?',
            [Boolean(isActive), adminId]
        );

        adminTransporterCache.delete(adminId);

        return this.getAdminSmtp(adminId);
    }

    static async deleteAdminSmtp(adminId) {
        await pool.query(
            'DELETE FROM admin_smtp_settings WHERE admin_id = ?',
            [adminId]
        );

        adminTransporterCache.delete(adminId);

        return {
            success: true,
            message: 'Custom SMTP deleted. Now using platform default SMTP.',
            source: 'platform_default'
        };
    }

    static async getTransporterForAdmin(adminId) {
        if (!adminId) {
            return {
                transporter: await getTransporter(),
                from: getDefaultFrom(),
                replyTo: getDefaultReplyTo(),
                isCustom: false
            };
        }

        if (adminTransporterCache.has(adminId)) {
            return adminTransporterCache.get(adminId);
        }

        const [rows] = await pool.query(
            `SELECT host, port, secure, username, password_encrypted, from_name, from_email, reply_to, is_active
             FROM admin_smtp_settings WHERE admin_id = ? AND is_active = TRUE LIMIT 1`,
            [adminId]
        );

        if (rows.length === 0) {
            return {
                transporter: await getTransporter(),
                from: getDefaultFrom(),
                replyTo: getDefaultReplyTo(),
                isCustom: false
            };
        }

        const settings = rows[0];
        const plainPassword = decrypt(settings.password_encrypted);

        const customTransporter = nodemailer.createTransport({
            host: settings.host,
            port: Number(settings.port),
            secure: Boolean(settings.secure),
            auth: {
                user: settings.username,
                pass: plainPassword
            },
            pool: true,
            maxConnections: 5
        });

        const sender = settings.from_name
            ? `"${settings.from_name}" <${settings.from_email}>`
            : settings.from_email;

        const resolved = {
            transporter: customTransporter,
            from: sender,
            replyTo: settings.reply_to || undefined,
            isCustom: true
        };

        adminTransporterCache.set(adminId, resolved);
        return resolved;
    }
}

export default SmtpService;
