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

export async function seedDefaultTemplates(superAdminId) {
    const templates = [
        {
            slug: 'welcome-email',
            name: 'Welcome Email',
            description: 'Welcome message for newly registered administrative accounts',
            category: 'onboarding',
            variables: JSON.stringify(['name', 'loginUrl']),
            subject: 'Welcome to Email System, {{name}}!',
            bodyHtml: `<h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">Welcome to the Platform, {{name}}!</h2>
<p>Your administrative account has been successfully created. You can now access the management dashboard.</p>
<div style="margin: 28px 0; text-align: center;">
  <a href="{{loginUrl}}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;" target="_blank">Access Dashboard</a>
</div>
<p style="color: #64748b; font-size: 13px;">If you have any questions or require assistance, please contact your Super Administrator.</p>`,
            bodyText: `Welcome to Email System, {{name}}!\n\nYour account has been created. You can access the dashboard here: {{loginUrl}}\n`,
            designJson: JSON.stringify({
                blocks: [
                    { id: 'w1', type: 'heading', props: { level: 1, text: 'Welcome to the Platform, {{name}}!', align: 'left', color: '#0f172a', marginBottom: 16 } },
                    { id: 'w2', type: 'text', props: { content: 'Your administrative account has been successfully created. You can now access the management dashboard and configure your workspace.', align: 'left', color: '#334155', fontSize: 15, marginBottom: 24 } },
                    { id: 'w3', type: 'button', props: { label: 'Access Dashboard', url: '{{loginUrl}}', align: 'center', backgroundColor: '#4f46e5', textColor: '#ffffff', borderRadius: 8, paddingY: 12, paddingX: 28, marginBottom: 24 } },
                    { id: 'w4', type: 'divider', props: { color: '#e2e8f0', thickness: 1, margin: 24 } },
                    { id: 'w5', type: 'text', props: { content: 'If you have any questions or require assistance, please contact your Super Administrator.', align: 'left', color: '#64748b', fontSize: 13, marginBottom: 12 } }
                ]
            })
        },
        {
            slug: 'password-reset',
            name: 'Password Reset Request',
            description: 'Instructions and link to reset forgotten account passwords',
            category: 'auth',
            variables: JSON.stringify(['name', 'resetUrl', 'expiresInMinutes']),
            subject: 'Password Reset Request',
            bodyHtml: `<h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">Password Reset Request</h2>
<p>Hello {{name}},</p>
<p>We received a request to reset the password for your administrator account. Click the button below to set a new password:</p>
<div style="margin: 28px 0; text-align: center;">
  <a href="{{resetUrl}}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;" target="_blank">Reset Password</a>
</div>
<p style="color: #64748b; font-size: 13px;">This link will expire in <strong>{{expiresInMinutes}} minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>`,
            bodyText: `Hello {{name}},\n\nWe received a request to reset your password. Use the link below (valid for {{expiresInMinutes}} minutes):\n{{resetUrl}}\n\nIf you did not request this, please ignore this email.\n`,
            designJson: JSON.stringify({
                blocks: [
                    { id: 'p1', type: 'heading', props: { level: 2, text: 'Password Reset Request', align: 'left', color: '#0f172a', marginBottom: 16 } },
                    { id: 'p2', type: 'text', props: { content: 'Hello {{name}}, we received a request to reset the password for your administrator account. Click the button below to set a new password:', align: 'left', color: '#334155', fontSize: 15, marginBottom: 24 } },
                    { id: 'p3', type: 'button', props: { label: 'Reset Password', url: '{{resetUrl}}', align: 'center', backgroundColor: '#2563eb', textColor: '#ffffff', borderRadius: 8, paddingY: 12, paddingX: 28, marginBottom: 24 } },
                    { id: 'p4', type: 'divider', props: { color: '#e2e8f0', thickness: 1, margin: 24 } },
                    { id: 'p5', type: 'text', props: { content: 'This link will expire in {{expiresInMinutes}} minutes. If you did not request a password reset, you can safely ignore this email.', align: 'left', color: '#64748b', fontSize: 13, marginBottom: 12 } }
                ]
            })
        },
        {
            slug: 'admin-invite',
            name: 'Administrator Invitation',
            description: 'Invitation for new administrators invited by Super Admin',
            category: 'onboarding',
            variables: JSON.stringify(['name', 'invitedByName', 'loginUrl', 'tempPassword']),
            subject: 'Invitation to Join Email System as Administrator',
            bodyHtml: `<h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">You've Been Invited to Administer Email System</h2>
<p>Hello {{name}},</p>
<p><strong>{{invitedByName}}</strong> has invited you to join Email System as an Administrator.</p>
<p>Your temporary password is: <code style="background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: #0f172a;">{{tempPassword}}</code></p>
<div style="margin: 28px 0; text-align: center;">
  <a href="{{loginUrl}}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;" target="_blank">Log In to Your Account</a>
</div>
<p style="color: #64748b; font-size: 13px;">Please change your temporary password immediately upon your first login.</p>`,
            bodyText: `Hello {{name}},\n\n{{invitedByName}} has invited you to join Email System as an Administrator.\nTemporary Password: {{tempPassword}}\nLog in here: {{loginUrl}}\n`,
            designJson: JSON.stringify({
                blocks: [
                    { id: 'i1', type: 'heading', props: { level: 1, text: "You've Been Invited to Administer Email System", align: 'left', color: '#0f172a', marginBottom: 16 } },
                    { id: 'i2', type: 'text', props: { content: 'Hello {{name}}, {{invitedByName}} has invited you to join Email System as an Administrator.', align: 'left', color: '#334155', fontSize: 15, marginBottom: 16 } },
                    { id: 'i3', type: 'text', props: { content: 'Your temporary password is: {{tempPassword}}', align: 'left', color: '#0f172a', fontSize: 14, marginBottom: 24 } },
                    { id: 'i4', type: 'button', props: { label: 'Log In to Your Account', url: '{{loginUrl}}', align: 'center', backgroundColor: '#4f46e5', textColor: '#ffffff', borderRadius: 8, paddingY: 12, paddingX: 28, marginBottom: 24 } },
                    { id: 'i5', type: 'divider', props: { color: '#e2e8f0', thickness: 1, margin: 24 } },
                    { id: 'i6', type: 'text', props: { content: 'Please change your temporary password immediately upon your first login.', align: 'left', color: '#64748b', fontSize: 13, marginBottom: 12 } }
                ]
            })
        }
    ];

    for (const t of templates) {
        await pool.query(
            `INSERT INTO email_templates (slug, name, description, category, variables, subject, body_html, body_text, design_json, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                description = VALUES(description),
                category = VALUES(category),
                variables = VALUES(variables),
                subject = VALUES(subject),
                body_html = VALUES(body_html),
                body_text = VALUES(body_text),
                design_json = VALUES(design_json)`,
            [t.slug, t.name, t.description, t.category, t.variables, t.subject, t.bodyHtml, t.bodyText, t.designJson, superAdminId]
        );
    }

    console.log(`✅ Default email templates seeded successfully (${templates.length} templates).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        const superAdmin = await seedSuperAdmin();
        await seedDefaultTemplates(superAdmin.id);
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to seed:', err);
        process.exit(1);
    }
}
