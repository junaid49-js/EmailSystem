import { Router } from 'express';
import {
    listTemplates,
    getTemplate,
    createDefaultTemplate,
    updateDefaultTemplate,
    deleteDefaultTemplate,
    customizeTemplate,
    toggleCustomization,
    deleteCustomization,
    previewTemplate
} from '../controllers/template.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    createDefaultTemplateSchema,
    updateDefaultTemplateSchema,
    customizeTemplateSchema,
    toggleCustomizationSchema,
    renderPreviewSchema
} from '../validations/template.validation.js';

const router = Router();

// All template operations require an authenticated admin
router.use(authenticateToken);

// 1. Template Listing & Viewing (accessible to all admins)
router.get('/', listTemplates);
router.get('/:id', getTemplate);
router.post('/:id/preview', validate(renderPreviewSchema), previewTemplate);

// 2. Super Admin Only: Canonical Default Template CRUD
router.post('/', requireRole('super_admin'), validate(createDefaultTemplateSchema), createDefaultTemplate);
router.put('/:id', requireRole('super_admin'), validate(updateDefaultTemplateSchema), updateDefaultTemplate);
router.delete('/:id', requireRole('super_admin'), deleteDefaultTemplate);

// 3. Admin Overrides & Customization (Per-admin scope)
router.post('/:id/customize', validate(customizeTemplateSchema), customizeTemplate);
router.patch('/:id/toggle', validate(toggleCustomizationSchema), toggleCustomization);
router.delete('/:id/customize', deleteCustomization);

export default router;
