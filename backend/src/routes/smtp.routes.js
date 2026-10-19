import { Router } from 'express';
import {
    getSmtpSettings,
    saveSmtpSettings,
    testSmtpConnection,
    toggleSmtpStatus,
    deleteSmtpSettings
} from '../controllers/smtp.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    saveSmtpSchema,
    testSmtpConfigSchema,
    toggleSmtpSchema
} from '../validations/smtp.validation.js';

const router = Router();

// All routes require an authenticated admin
router.use(authenticateToken);

// Get current admin's SMTP status and settings (or platform default if none)
router.get('/', getSmtpSettings);

// Test arbitrary SMTP credentials without saving
router.post('/verify', validate(testSmtpConfigSchema), testSmtpConnection);

// Save/update custom SMTP credentials (automatically verified before saving)
router.post('/', validate(saveSmtpSchema), saveSmtpSettings);

// Toggle between custom SMTP and platform default SMTP
router.patch('/toggle', validate(toggleSmtpSchema), toggleSmtpStatus);

// Delete custom SMTP settings and revert to platform default
router.delete('/', deleteSmtpSettings);

export default router;
