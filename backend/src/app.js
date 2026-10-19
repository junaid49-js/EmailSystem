import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import emailRoutes from './routes/email.routes.js';
import smtpRoutes from './routes/smtp.routes.js';
import templateRoutes from './routes/template.routes.js';
import { ResponseFactory } from './utils/responseFactory.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
    ResponseFactory.success(res, 'Server is healthy', { timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/admin/smtp', smtpRoutes);
app.use('/api/templates', templateRoutes);

// 404 Handler & Global Error Handler Middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
