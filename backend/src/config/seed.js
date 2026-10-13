import { fileURLToPath } from 'node:url';
import pool from './db.js';
import { hashPassword } from '../utils/password.js';

export async function seedSuperAdmin() {
    const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
    const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@1234';

    const connection = await pool.getConnection();
    try {
        // Check if super admin with this email or any super admin exists
        const [existing] = await connection.query(
            'SELECT id, name, email, role FROM admins WHERE email = ? LIMIT 1',
            [email]
        );

        if (existing.length > 0) {
            console.log(`ℹ️ Super admin already exists with email: ${email} (ID: ${existing[0].id})`);
            return existing[0];
        }

        const passwordHash = await hashPassword(password);

        const [result] = await connection.query(
            `INSERT INTO admins (name, email, password_hash, role, status)
             VALUES (?, ?, ?, 'super_admin', 'active')`,
            [name, email, passwordHash]
        );

        console.log(`✅ Super admin created successfully!`);
        console.log(`   ID: ${result.insertId}`);
        console.log(`   Name: ${name}`);
        console.log(`   Email: ${email}`);
        console.log(`   Role: super_admin`);

        return { id: result.insertId, name, email, role: 'super_admin' };
    } finally {
        connection.release();
    }
}

// Allow standalone execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        await seedSuperAdmin();
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to seed super admin:', err);
        process.exit(1);
    }
}
