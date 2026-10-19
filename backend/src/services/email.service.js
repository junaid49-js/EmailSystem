import { getPreviewUrl, verifyTransporter } from '../config/mailer.js';
import { SmtpService } from './smtp.service.js';
import {
    welcomeEmailTemplate,
    passwordResetTemplate,
    adminInviteTemplate
} from '../utils/emailTemplates.js';
import { ErrorFactory } from '../utils/errorFactory.js';

export class EmailService {
    static async sendMail({ adminId, to, subject, html, text, from, replyTo, attachments = [] }) {
        try {
            const resolved = await SmtpService.getTransporterForAdmin(adminId);
            const transporter = resolved.transporter;
            const sender = from || resolved.from;
            const replyToAddress = replyTo || resolved.replyTo;

            const info = await transporter.sendMail({
                from: sender,
                to,
                subject,
                text,
                html,
                ...(replyToAddress ? { replyTo: replyToAddress } : {}),
                attachments
            });

            const previewUrl = getPreviewUrl(info);
            if (previewUrl) {
                console.log(`📨 [Email Preview URL]: ${previewUrl}`);
            }

            return {
                messageId: info.messageId,
                previewUrl: previewUrl || null,
                accepted: info.accepted,
                isCustomSmtp: resolved.isCustom
            };
        } catch (error) {
            console.error('❌ [EmailService Error]:', error);
            throw ErrorFactory.internal(`Failed to send email: ${error.message}`, 'EMAIL_SEND_FAILED');
        }
    }

    static async sendWelcomeEmail({ to, name, loginUrl }) {
        const template = welcomeEmailTemplate({ name, loginUrl });
        return this.sendMail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text
        });
    }

    static async sendPasswordResetEmail({ to, name, resetUrl, expiresInMinutes }) {
        const template = passwordResetTemplate({ name, resetUrl, expiresInMinutes });
        return this.sendMail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text
        });
    }

    static async sendAdminInviteEmail({ to, name, invitedByName, loginUrl, tempPassword }) {
        const template = adminInviteTemplate({ name, invitedByName, loginUrl, tempPassword });
        return this.sendMail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text
        });
    }

    static async sendTemplatedMail({ adminId, to, templateSlug, variables = {}, attachments = [] }) {
        const { TemplateService } = await import('./template.service.js');
        const rendered = await TemplateService.renderTemplate(templateSlug, adminId, variables);

        const result = await this.sendMail({
            adminId,
            to,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
            attachments
        });

        return {
            ...result,
            templateSlug: rendered.slug,
            templateSource: rendered.source,
            isCustomTemplate: rendered.isCustomActive
        };
    }

    static async verifySmtp() {
        return verifyTransporter();
    }
}

export default EmailService;
