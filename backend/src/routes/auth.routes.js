import { Router } from 'express';
import { adminSignup, login, getProfile } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticateToken, optionalAuth } from '../middlewares/auth.middleware.js';
import { adminSignupSchema, loginSchema } from '../validations/auth.validation.js';

const router = Router();

// Admin Signup (supports optional superadmin bearer token to link created_by)
router.post('/signup', optionalAuth, validate(adminSignupSchema), adminSignup);
router.post('/admin/signup', optionalAuth, validate(adminSignupSchema), adminSignup);

// Login for both Super Admin and Admin
router.post('/login', validate(loginSchema), login);

// Authenticated profile
router.get('/me', authenticateToken, getProfile);

export default router;
