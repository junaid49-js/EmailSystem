import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import { ResponseFactory } from './utils/responseFactory.js';
import { AppError } from './utils/errorFactory.js';

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

// 404 Handler
app.use((req, res) => {
    ResponseFactory.error(
        res,
        `Route not found: ${req.method} ${req.originalUrl}`,
        404,
        null,
        'NOT_FOUND'
    );
});

// Centralized Global Error Handler (Express 5 natively forwards async errors here)
app.use((err, req, res, next) => {
    if (err instanceof AppError) {
        return ResponseFactory.error(
            res,
            err.message,
            err.statusCode,
            err.errors,
            err.errorCode
        );
    }

    console.error('Unhandled server error:', err);
    return ResponseFactory.error(
        res,
        err.message || 'Internal Server Error',
        err.status || err.statusCode || 500,
        null,
        'INTERNAL_SERVER_ERROR'
    );
});

export default app;
