import { z } from 'zod';

export const sendTestEmailSchema = z.object({
    to: z.string().trim().email('Invalid recipient email address').toLowerCase(),
    subject: z.string().trim().min(1, 'Subject is required').default('Test Email from Email System'),
    content: z.string().trim().optional()
});

export const sendTemplatedEmailSchema = z.object({
    to: z.string().trim().email('Invalid recipient email address').toLowerCase(),
    templateSlug: z.string().trim().min(1, 'Template slug is required'),
    variables: z.record(z.string(), z.any()).optional().default({})
});
