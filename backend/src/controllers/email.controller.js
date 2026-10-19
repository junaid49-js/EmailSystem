import { EmailService } from '../services/email.service.js';
import { ResponseFactory } from '../utils/responseFactory.js';
import { renderBaseLayout } from '../utils/emailTemplates.js';

export async function checkSmtpStatus(req, res) {
    const status = await EmailService.verifySmtp();
    if (status.success) {
        return ResponseFactory.success(res, 'SMTP server connection is active and valid.', status);
    } else {
        return ResponseFactory.error(res, `SMTP connection failed: ${status.message}`, 503, status, 'SMTP_UNAVAILABLE');
    }
}

export async function sendTestEmail(req, res) {
    const { to, subject, content } = req.body;

    const emailContent = `
      <h2 style="margin-top: 0; font-size: 20px; color: #0f172a;">SMTP Test Message</h2>
      <p>Hello,</p>
      <p>${content || 'This is a test email sent from the Email System backend to verify that Nodemailer and the SMTP transporter are configured correctly.'}</p>
      <div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #475569; margin: 20px 0;">
        <strong>Triggered by:</strong> ${req.admin?.name || 'Administrator'} (${req.admin?.email})<br>
        <strong>Timestamp:</strong> ${new Date().toISOString()}
      </div>
    `;

    const html = renderBaseLayout({
        title: subject || 'Test Email',
        previewText: 'Nodemailer SMTP test notification',
        content: emailContent
    });

    const result = await EmailService.sendMail({
        adminId: req.admin?.id,
        to,
        subject: subject || 'Test Email from Email System',
        html,
        text: content || 'This is a test email from Email System.'
    });

    return ResponseFactory.success(res, 'Test email dispatched successfully.', result);
}

export async function sendTemplatedEmail(req, res) {
    const { to, templateSlug, variables } = req.body;

    const result = await EmailService.sendTemplatedMail({
        adminId: req.admin.id,
        to,
        templateSlug,
        variables: variables || {}
    });

    return ResponseFactory.success(res, 'Templated email dispatched successfully.', result);
}

export default {
    checkSmtpStatus,
    sendTestEmail,
    sendTemplatedEmail
};
