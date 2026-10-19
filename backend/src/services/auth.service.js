import pool from '../config/db.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { ErrorFactory } from '../utils/errorFactory.js';
import { EmailService } from './email.service.js';

export class AuthService {
    static async registerAdmin({ name, email, password, createdBy = null, ipAddress = null }) {
        const [existing] = await pool.query(
            'SELECT id FROM admins WHERE email = ? LIMIT 1',
            [email]
        );

        if (existing.length > 0) {
            throw ErrorFactory.conflict('Email address is already in use.', 'EMAIL_EXISTS');
        }

        const passwordHash = await hashPassword(password);

        const [result] = await pool.query(
            `INSERT INTO admins (name, email, password_hash, role, status, created_by)
             VALUES (?, ?, ?, 'admin', 'active', ?)`,
            [name, email, passwordHash, createdBy]
        );

        const newAdminId = result.insertId;

        const token = generateToken({
            id: newAdminId,
            email,
            role: 'admin',
            name
        });

        await pool.query(
            `INSERT INTO admin_activity_logs (admin_id, action, details, ip_address)
             VALUES (?, 'ADMIN_REGISTERED', ?, ?)`,
            [
                createdBy || newAdminId,
                JSON.stringify({ newAdminId, email, createdBy }),
                ipAddress
            ]
        ).catch(() => {});

        EmailService.sendWelcomeEmail({
            to: email,
            name
        }).catch(err => console.error('⚠️ [Email] Welcome email failed to send:', err.message));

        return {
            token,
            admin: {
                id: newAdminId,
                name,
                email,
                role: 'admin',
                status: 'active',
                createdBy
            }
        };
    }

    static async loginAdmin({ email, password, ipAddress = null }) {
        const [rows] = await pool.query(
            'SELECT id, name, email, password_hash, role, status FROM admins WHERE email = ? LIMIT 1',
            [email]
        );

        if (rows.length === 0) {
            throw ErrorFactory.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
        }

        const admin = rows[0];

        const isPasswordValid = await verifyPassword(admin.password_hash, password);
        if (!isPasswordValid) {
            throw ErrorFactory.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
        }

        if (admin.status !== 'active') {
            throw ErrorFactory.forbidden(
                `Account is ${admin.status}. Please contact the Super Admin.`,
                'ACCOUNT_INACTIVE'
            );
        }

        await pool.query(
            'UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
            [admin.id]
        );

        const token = generateToken({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            name: admin.name
        });

        await pool.query(
            `INSERT INTO admin_activity_logs (admin_id, action, details, ip_address)
             VALUES (?, 'ADMIN_LOGIN', ?, ?)`,
            [admin.id, JSON.stringify({ role: admin.role }), ipAddress]
        ).catch(() => {});

        return {
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                status: admin.status
            }
        };
    }

    static async findAdminById(id) {
        const [rows] = await pool.query(
            'SELECT id, name, email, role, status, created_by, last_login_at, created_at FROM admins WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    }
}

export default AuthService;
