import pool from '../config/db.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { ErrorFactory } from '../utils/errorFactory.js';

/**
 * Service handling all authentication, registration, and administrative account business logic.
 */
export class AuthService {
    /**
     * Register a new admin account.
     * @param {object} params
     * @param {string} params.name
     * @param {string} params.email
     * @param {string} params.password
     * @param {number|null} [params.createdBy]
     * @param {string|null} [params.ipAddress]
     */
    static async registerAdmin({ name, email, password, createdBy = null, ipAddress = null }) {
        // 1. Check if email already exists
        const [existing] = await pool.query(
            'SELECT id FROM admins WHERE email = ? LIMIT 1',
            [email]
        );

        if (existing.length > 0) {
            throw ErrorFactory.conflict('Email address is already in use.', 'EMAIL_EXISTS');
        }

        // 2. Hash password with Argon2
        const passwordHash = await hashPassword(password);

        // 3. Insert admin record
        const [result] = await pool.query(
            `INSERT INTO admins (name, email, password_hash, role, status, created_by)
             VALUES (?, ?, ?, 'admin', 'active', ?)`,
            [name, email, passwordHash, createdBy]
        );

        const newAdminId = result.insertId;

        // 4. Issue JWT token
        const token = generateToken({
            id: newAdminId,
            email,
            role: 'admin',
            name
        });

        // 5. Audit log (non-blocking)
        await pool.query(
            `INSERT INTO admin_activity_logs (admin_id, action, details, ip_address)
             VALUES (?, 'ADMIN_REGISTERED', ?, ?)`,
            [
                createdBy || newAdminId,
                JSON.stringify({ newAdminId, email, createdBy }),
                ipAddress
            ]
        ).catch(() => {});

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

    /**
     * Authenticate Super Admin or Admin credentials and issue a JWT token.
     * @param {object} params
     * @param {string} params.email
     * @param {string} params.password
     * @param {string|null} [params.ipAddress]
     */
    static async loginAdmin({ email, password, ipAddress = null }) {
        // 1. Look up admin by email
        const [rows] = await pool.query(
            'SELECT id, name, email, password_hash, role, status FROM admins WHERE email = ? LIMIT 1',
            [email]
        );

        if (rows.length === 0) {
            throw ErrorFactory.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
        }

        const admin = rows[0];

        // 2. Verify password with Argon2
        const isPasswordValid = await verifyPassword(admin.password_hash, password);
        if (!isPasswordValid) {
            throw ErrorFactory.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
        }

        // 3. Verify account status
        if (admin.status !== 'active') {
            throw ErrorFactory.forbidden(
                `Account is ${admin.status}. Please contact the Super Admin.`,
                'ACCOUNT_INACTIVE'
            );
        }

        // 4. Update last login timestamp
        await pool.query(
            'UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
            [admin.id]
        );

        // 5. Generate JWT token
        const token = generateToken({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            name: admin.name
        });

        // 6. Audit log (non-blocking)
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

    /**
     * Find admin by ID.
     * @param {number} id 
     */
    static async findAdminById(id) {
        const [rows] = await pool.query(
            'SELECT id, name, email, role, status, created_by, last_login_at, created_at FROM admins WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    }
}

export default AuthService;
