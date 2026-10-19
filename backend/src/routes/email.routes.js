import { Router } from 'express';
import { checkSmtpStatus, sendTestEmail, sendTemplatedEmail } from '../controllers/email.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { sendTestEmailSchema, sendTemplatedEmailSchema } from '../validations/email.validation.js';

const router = Router();

// SMTP Verification
router.get('/smtp-status', authenticateToken, checkSmtpStatus);

// Send Test Email
router.post('/send-test', authenticateToken, validate(sendTestEmailSchema), sendTestEmail);

// Send Templated Email
router.post('/send-templated', authenticateToken, validate(sendTemplatedEmailSchema), sendTemplatedEmail);

export default router;
