import { SmtpService } from '../services/smtp.service.js';
import { ResponseFactory } from '../utils/responseFactory.js';

export async function getSmtpSettings(req, res) {
    const adminId = req.admin.id;
    const result = await SmtpService.getAdminSmtp(adminId);
    return ResponseFactory.success(res, 'SMTP settings retrieved successfully.', result);
}

export async function saveSmtpSettings(req, res) {
    const adminId = req.admin.id;
    const result = await SmtpService.saveAdminSmtp(adminId, req.body);
    return ResponseFactory.success(res, 'Custom SMTP settings verified and saved successfully.', result);
}

export async function testSmtpConnection(req, res) {
    const result = await SmtpService.verifyConfig(req.body);
    return ResponseFactory.success(res, 'SMTP connection test succeeded.', result);
}

export async function toggleSmtpStatus(req, res) {
    const adminId = req.admin.id;
    const { isActive } = req.body;
    const result = await SmtpService.toggleAdminSmtp(adminId, isActive);
    const message = isActive
        ? 'Custom SMTP activated. Outgoing emails will now use your custom server.'
        : 'Custom SMTP deactivated. Outgoing emails will now use the default platform SMTP.';
    return ResponseFactory.success(res, message, result);
}

export async function deleteSmtpSettings(req, res) {
    const adminId = req.admin.id;
    const result = await SmtpService.deleteAdminSmtp(adminId);
    return ResponseFactory.success(res, result.message, result);
}

export default {
    getSmtpSettings,
    saveSmtpSettings,
    testSmtpConnection,
    toggleSmtpStatus,
    deleteSmtpSettings
};
