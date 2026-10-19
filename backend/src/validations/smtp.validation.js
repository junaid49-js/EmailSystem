import { z } from 'zod';

export const saveSmtpSchema = z.object({
    provider: z.string().trim().default('custom'),
    host: z.string().trim().min(1, 'SMTP host is required'),
    port: z.coerce.number().int().min(1).max(65535).default(587),
    secure: z.boolean().default(false),
    username: z.string().trim().min(1, 'SMTP username is required'),
    password: z.string().min(1, 'SMTP password is required'),
    fromName: z.string().trim().max(100).optional(),
    fromEmail: z.string().trim().email('Valid from email is required').toLowerCase(),
    replyTo: z.string().trim().email('Invalid reply-to email').toLowerCase().optional(),
    isActive: z.boolean().default(true)
});

export const testSmtpConfigSchema = z.object({
    host: z.string().trim().min(1, 'SMTP host is required'),
    port: z.coerce.number().int().min(1).max(65535).default(587),
    secure: z.boolean().default(false),
    username: z.string().trim().min(1, 'SMTP username is required'),
    password: z.string().min(1, 'SMTP password is required')
});

export const toggleSmtpSchema = z.object({
    isActive: z.boolean({ required_error: 'isActive boolean flag is required' })
});
