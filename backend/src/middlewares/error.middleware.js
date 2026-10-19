import { AppError } from '../utils/errorFactory.js';
import { ResponseFactory } from '../utils/responseFactory.js';

export function notFoundHandler(req, res) {
    return ResponseFactory.error(
        res,
        `Route not found: ${req.method} ${req.originalUrl}`,
        404,
        null,
        'NOT_FOUND'
    );
}

export function errorHandler(err, req, res, next) {
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
}

export default errorHandler;
