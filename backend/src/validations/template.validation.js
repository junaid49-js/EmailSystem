import { z } from 'zod';

export const createDefaultTemplateSchema = z.object({
    slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-_]+$/, 'Slug must only contain lowercase letters, numbers, hyphens, and underscores'),
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().max(255).optional(),
    category: z.string().trim().min(2).max(50).default('general'),
    subject: z.string().trim().min(1, 'Subject is required').max(255),
    bodyHtml: z.string().optional(),
    bodyText: z.string().optional(),
    designJson: z.any().optional(),
    variables: z.array(z.string().trim().min(1)).optional().default([])
});

export const updateDefaultTemplateSchema = z.object({
    slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-_]+$/, 'Slug must only contain lowercase letters, numbers, hyphens, and underscores').optional(),
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(255).optional().nullable(),
    category: z.string().trim().min(2).max(50).optional(),
    subject: z.string().trim().min(1).max(255).optional(),
    bodyHtml: z.string().min(1).optional(),
    bodyText: z.string().optional().nullable(),
    designJson: z.any().optional(),
    variables: z.array(z.string().trim().min(1)).optional()
});

export const customizeTemplateSchema = z.object({
    subject: z.string().trim().min(1, 'Subject is required').max(255),
    bodyHtml: z.string().optional(),
    bodyText: z.string().optional(),
    designJson: z.any().optional(),
    isActive: z.boolean().optional().default(true)
});

export const toggleCustomizationSchema = z.object({
    isActive: z.boolean({ required_error: 'isActive boolean flag is required' })
});

export const renderPreviewSchema = z.object({
    variables: z.record(z.string(), z.any()).optional().default({})
});
