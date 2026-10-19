import pool from '../config/db.js';
import { ErrorFactory } from '../utils/errorFactory.js';
import { renderBaseLayout } from '../utils/emailTemplates.js';
import { compileBlocksToHtml, compileBlocksToText } from '../utils/templateCompiler.js';

export class TemplateService {
    static async resolveTemplateId(idOrSlug) {
        if (!isNaN(idOrSlug) && Number(idOrSlug) > 0) {
            const [rows] = await pool.query('SELECT id FROM email_templates WHERE id = ? LIMIT 1', [Number(idOrSlug)]);
            if (rows.length > 0) return rows[0].id;
        }

        const [rows] = await pool.query('SELECT id FROM email_templates WHERE slug = ? LIMIT 1', [idOrSlug]);
        if (rows.length === 0) {
            throw ErrorFactory.notFound(`Email template '${idOrSlug}' not found.`, 'TEMPLATE_NOT_FOUND');
        }
        return rows[0].id;
    }

    static async listTemplates(adminId) {
        const [rows] = await pool.query(
            `SELECT 
                t.id,
                t.slug,
                t.name,
                t.description,
                t.category,
                t.variables,
                t.subject AS default_subject,
                t.created_by,
                t.created_at,
                t.updated_at,
                c.id AS customization_id,
                c.subject AS custom_subject,
                c.is_active AS is_custom_active,
                c.updated_at AS custom_updated_at
             FROM email_templates t
             LEFT JOIN admin_template_customizations c 
                ON t.id = c.template_id AND c.admin_id = ?
             ORDER BY t.category ASC, t.name ASC`,
            [adminId]
        );

        return rows.map(r => {
            const hasCustomization = Boolean(r.customization_id);
            const isCustomActive = hasCustomization && Boolean(r.is_custom_active);
            const isRolledBack = hasCustomization && !r.is_custom_active;

            let source = 'platform_default';
            if (isCustomActive) {
                source = 'custom_admin_version';
            } else if (isRolledBack) {
                source = 'platform_default (custom rolled back)';
            }

            return {
                id: r.id,
                slug: r.slug,
                name: r.name,
                description: r.description,
                category: r.category,
                variables: typeof r.variables === 'string' ? JSON.parse(r.variables) : (r.variables || []),
                effectiveSubject: isCustomActive ? r.custom_subject : r.default_subject,
                defaultSubject: r.default_subject,
                customSubject: r.custom_subject || null,
                hasCustomization,
                isCustomActive,
                isRolledBack,
                source,
                canRollback: isCustomActive,
                canReactivate: isRolledBack,
                createdAt: r.created_at,
                updatedAt: r.updated_at
            };
        });
    }

    static async getTemplate(idOrSlug, adminId) {
        const templateId = await this.resolveTemplateId(idOrSlug);

        const [tRows] = await pool.query(
            `SELECT id, slug, name, description, category, variables, subject, body_html, body_text, design_json, created_by, created_at, updated_at
             FROM email_templates WHERE id = ? LIMIT 1`,
            [templateId]
        );

        if (tRows.length === 0) {
            throw ErrorFactory.notFound('Email template not found.', 'TEMPLATE_NOT_FOUND');
        }

        const defaultTemplate = tRows[0];
        defaultTemplate.variables = typeof defaultTemplate.variables === 'string'
            ? JSON.parse(defaultTemplate.variables)
            : (defaultTemplate.variables || []);

        const defaultDesignJson = typeof defaultTemplate.design_json === 'string'
            ? JSON.parse(defaultTemplate.design_json)
            : (defaultTemplate.design_json || null);

        const [cRows] = await pool.query(
            `SELECT id, subject, body_html, body_text, design_json, is_active, created_at, updated_at
             FROM admin_template_customizations 
             WHERE template_id = ? AND admin_id = ? LIMIT 1`,
            [templateId, adminId]
        );

        const customization = cRows.length > 0 ? cRows[0] : null;
        const hasCustomization = Boolean(customization);
        const isCustomActive = hasCustomization && Boolean(customization.is_active);
        const isRolledBack = hasCustomization && !customization.is_active;

        const customDesignJson = customization && typeof customization.design_json === 'string'
            ? JSON.parse(customization.design_json)
            : (customization?.design_json || null);

        const effective = {
            subject: isCustomActive ? customization.subject : defaultTemplate.subject,
            bodyHtml: isCustomActive ? customization.body_html : defaultTemplate.body_html,
            bodyText: isCustomActive ? customization.body_text : defaultTemplate.body_text,
            designJson: isCustomActive ? (customDesignJson || defaultDesignJson) : defaultDesignJson,
            source: isCustomActive ? 'custom_admin_version' : 'platform_default'
        };

        return {
            id: defaultTemplate.id,
            slug: defaultTemplate.slug,
            name: defaultTemplate.name,
            description: defaultTemplate.description,
            category: defaultTemplate.category,
            variables: defaultTemplate.variables,
            effective,
            defaultVersion: {
                subject: defaultTemplate.subject,
                bodyHtml: defaultTemplate.body_html,
                bodyText: defaultTemplate.body_text,
                designJson: defaultDesignJson,
                createdBy: defaultTemplate.created_by,
                updatedAt: defaultTemplate.updated_at
            },
            customVersion: customization ? {
                id: customization.id,
                subject: customization.subject,
                bodyHtml: customization.body_html,
                bodyText: customization.body_text,
                designJson: customDesignJson,
                isActive: Boolean(customization.is_active),
                updatedAt: customization.updated_at
            } : null,
            status: {
                hasCustomization,
                isCustomActive,
                isRolledBack,
                canRollback: isCustomActive,
                canReactivate: isRolledBack
            }
        };
    }

    static async createDefaultTemplate(superAdminId, data) {
        const {
            slug,
            name,
            description,
            category = 'general',
            subject,
            variables = [],
            designJson = null
        } = data;

        let bodyHtml = data.bodyHtml;
        let bodyText = data.bodyText;

        if (designJson && !bodyHtml) {
            bodyHtml = compileBlocksToHtml(designJson);
        }
        if (designJson && !bodyText) {
            bodyText = compileBlocksToText(designJson);
        }
        if (!bodyHtml) {
            bodyHtml = '<p></p>';
        }

        const [existing] = await pool.query(
            'SELECT id FROM email_templates WHERE slug = ? LIMIT 1',
            [slug]
        );

        if (existing.length > 0) {
            throw ErrorFactory.conflict(`Template with slug '${slug}' already exists.`, 'SLUG_EXISTS');
        }

        const [result] = await pool.query(
            `INSERT INTO email_templates (slug, name, description, category, variables, subject, body_html, body_text, design_json, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                slug,
                name,
                description || null,
                category,
                JSON.stringify(variables),
                subject,
                bodyHtml,
                bodyText || null,
                designJson ? JSON.stringify(designJson) : null,
                superAdminId
            ]
        );

        return this.getTemplate(result.insertId, superAdminId);
    }

    static async updateDefaultTemplate(idOrSlug, data) {
        const templateId = await this.resolveTemplateId(idOrSlug);

        const [tRows] = await pool.query(
            'SELECT id, slug FROM email_templates WHERE id = ? LIMIT 1',
            [templateId]
        );

        if (tRows.length === 0) {
            throw ErrorFactory.notFound('Email template not found.', 'TEMPLATE_NOT_FOUND');
        }

        if (data.slug && data.slug !== tRows[0].slug) {
            const [slugCheck] = await pool.query(
                'SELECT id FROM email_templates WHERE slug = ? AND id != ? LIMIT 1',
                [data.slug, templateId]
            );
            if (slugCheck.length > 0) {
                throw ErrorFactory.conflict(`Template with slug '${data.slug}' already exists.`, 'SLUG_EXISTS');
            }
        }

        let bodyHtml = data.bodyHtml;
        let bodyText = data.bodyText;

        if (data.designJson !== undefined) {
            if (data.designJson && bodyHtml === undefined) {
                bodyHtml = compileBlocksToHtml(data.designJson);
            }
            if (data.designJson && bodyText === undefined) {
                bodyText = compileBlocksToText(data.designJson);
            }
        }

        const updateFields = [];
        const params = [];

        if (data.slug !== undefined) {
            updateFields.push('slug = ?');
            params.push(data.slug);
        }
        if (data.name !== undefined) {
            updateFields.push('name = ?');
            params.push(data.name);
        }
        if (data.description !== undefined) {
            updateFields.push('description = ?');
            params.push(data.description);
        }
        if (data.category !== undefined) {
            updateFields.push('category = ?');
            params.push(data.category);
        }
        if (data.subject !== undefined) {
            updateFields.push('subject = ?');
            params.push(data.subject);
        }
        if (bodyHtml !== undefined) {
            updateFields.push('body_html = ?');
            params.push(bodyHtml);
        }
        if (bodyText !== undefined) {
            updateFields.push('body_text = ?');
            params.push(bodyText);
        }
        if (data.designJson !== undefined) {
            updateFields.push('design_json = ?');
            params.push(data.designJson ? JSON.stringify(data.designJson) : null);
        }
        if (data.variables !== undefined) {
            updateFields.push('variables = ?');
            params.push(JSON.stringify(data.variables));
        }

        if (updateFields.length > 0) {
            params.push(templateId);
            await pool.query(
                `UPDATE email_templates SET ${updateFields.join(', ')} WHERE id = ?`,
                params
            );
        }

        return this.getTemplate(templateId, 1);
    }

    static async deleteDefaultTemplate(idOrSlug) {
        const templateId = await this.resolveTemplateId(idOrSlug);

        const [result] = await pool.query(
            'DELETE FROM email_templates WHERE id = ?',
            [templateId]
        );

        if (result.affectedRows === 0) {
            throw ErrorFactory.notFound('Email template not found.', 'TEMPLATE_NOT_FOUND');
        }

        return {
            success: true,
            message: 'Default template and all associated admin customizations deleted successfully.'
        };
    }

    static async saveAdminCustomization(idOrSlug, adminId, data) {
        const templateId = await this.resolveTemplateId(idOrSlug);
        let { subject, bodyHtml, bodyText, designJson = null, isActive = true } = data;

        if (designJson && !bodyHtml) {
            bodyHtml = compileBlocksToHtml(designJson);
        }
        if (designJson && !bodyText) {
            bodyText = compileBlocksToText(designJson);
        }
        if (!bodyHtml) {
            bodyHtml = '<p></p>';
        }

        await pool.query(
            `INSERT INTO admin_template_customizations 
                (template_id, admin_id, subject, body_html, body_text, design_json, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                subject = VALUES(subject),
                body_html = VALUES(body_html),
                body_text = VALUES(body_text),
                design_json = VALUES(design_json),
                is_active = VALUES(is_active),
                updated_at = CURRENT_TIMESTAMP`,
            [
                templateId,
                adminId,
                subject,
                bodyHtml,
                bodyText || null,
                designJson ? JSON.stringify(designJson) : null,
                Boolean(isActive)
            ]
        );

        return this.getTemplate(templateId, adminId);
    }

    static async toggleAdminCustomization(idOrSlug, adminId, isActive) {
        const templateId = await this.resolveTemplateId(idOrSlug);

        const [existing] = await pool.query(
            'SELECT id FROM admin_template_customizations WHERE template_id = ? AND admin_id = ? LIMIT 1',
            [templateId, adminId]
        );

        if (existing.length === 0) {
            throw ErrorFactory.notFound(
                'No custom template version found to toggle. Please customize the template first.',
                'CUSTOMIZATION_NOT_FOUND'
            );
        }

        await pool.query(
            'UPDATE admin_template_customizations SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE template_id = ? AND admin_id = ?',
            [Boolean(isActive), templateId, adminId]
        );

        const result = await this.getTemplate(templateId, adminId);
        const message = isActive
            ? 'Custom template version restored and activated.'
            : 'Template rolled back to Super Admin default. Your custom version is preserved and can be restored anytime.';

        return {
            message,
            template: result
        };
    }

    static async deleteAdminCustomization(idOrSlug, adminId) {
        const templateId = await this.resolveTemplateId(idOrSlug);

        const [result] = await pool.query(
            'DELETE FROM admin_template_customizations WHERE template_id = ? AND admin_id = ?',
            [templateId, adminId]
        );

        if (result.affectedRows === 0) {
            throw ErrorFactory.notFound('No customization exists for this template.', 'CUSTOMIZATION_NOT_FOUND');
        }

        const template = await this.getTemplate(templateId, adminId);
        return {
            success: true,
            message: 'Customization removed. Template fully reverted to Super Admin default.',
            template
        };
    }

    static substituteVariables(text, variables = {}) {
        if (!text) return '';
        return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
            return variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : match;
        });
    }

    static async renderTemplate(idOrSlug, adminId, variables = {}, wrapLayout = true) {
        const template = await this.getTemplate(idOrSlug, adminId);
        const subject = this.substituteVariables(template.effective.subject, variables);
        let html = this.substituteVariables(template.effective.bodyHtml, variables);
        const text = this.substituteVariables(template.effective.bodyText, variables);

        if (wrapLayout) {
            html = renderBaseLayout({
                title: subject,
                previewText: subject,
                content: html
            });
        }

        return {
            templateId: template.id,
            slug: template.slug,
            name: template.name,
            source: template.effective.source,
            isCustomActive: template.status.isCustomActive,
            subject,
            html,
            text
        };
    }
}

export default TemplateService;
