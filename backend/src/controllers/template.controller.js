import { TemplateService } from '../services/template.service.js';
import { ResponseFactory } from '../utils/responseFactory.js';

export async function listTemplates(req, res) {
    const templates = await TemplateService.listTemplates(req.admin.id);
    return ResponseFactory.success(res, 'Templates retrieved successfully.', templates);
}

export async function getTemplate(req, res) {
    const template = await TemplateService.getTemplate(req.params.id, req.admin.id);
    return ResponseFactory.success(res, 'Template retrieved successfully.', template);
}

export async function createDefaultTemplate(req, res) {
    const template = await TemplateService.createDefaultTemplate(req.admin.id, req.body);
    return ResponseFactory.created(res, 'Default template created successfully.', template);
}

export async function updateDefaultTemplate(req, res) {
    const template = await TemplateService.updateDefaultTemplate(req.params.id, req.body);
    return ResponseFactory.success(res, 'Default template updated successfully.', template);
}

export async function deleteDefaultTemplate(req, res) {
    const result = await TemplateService.deleteDefaultTemplate(req.params.id);
    return ResponseFactory.success(res, result.message, result);
}

export async function customizeTemplate(req, res) {
    const template = await TemplateService.saveAdminCustomization(req.params.id, req.admin.id, req.body);
    return ResponseFactory.success(res, 'Custom template saved and activated.', template);
}

export async function toggleCustomization(req, res) {
    const { isActive } = req.body;
    const result = await TemplateService.toggleAdminCustomization(req.params.id, req.admin.id, isActive);
    return ResponseFactory.success(res, result.message, result.template);
}

export async function deleteCustomization(req, res) {
    const result = await TemplateService.deleteAdminCustomization(req.params.id, req.admin.id);
    return ResponseFactory.success(res, result.message, result.template);
}

export async function previewTemplate(req, res) {
    const preview = await TemplateService.renderTemplate(req.params.id, req.admin.id, req.body.variables || {});
    return ResponseFactory.success(res, 'Template preview generated successfully.', preview);
}

export default {
    listTemplates,
    getTemplate,
    createDefaultTemplate,
    updateDefaultTemplate,
    deleteDefaultTemplate,
    customizeTemplate,
    toggleCustomization,
    deleteCustomization,
    previewTemplate
};
