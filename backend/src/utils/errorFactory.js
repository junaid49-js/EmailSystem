export class AppError extends Error {
    constructor(message, statusCode = 500, errors = null, errorCode = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errors = errors;
        this.errorCode = errorCode;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const ErrorFactory = {
    badRequest(message = 'Bad Request', errors = null, errorCode = 'BAD_REQUEST') {
        return new AppError(message, 400, errors, errorCode);
    },

    unauthorized(message = 'Unauthorized. Authentication required.', errorCode = 'UNAUTHORIZED') {
        return new AppError(message, 401, null, errorCode);
    },

    forbidden(message = 'Access forbidden. Insufficient permissions.', errorCode = 'FORBIDDEN') {
        return new AppError(message, 403, null, errorCode);
    },

    notFound(message = 'Resource not found.', errorCode = 'NOT_FOUND') {
        return new AppError(message, 404, null, errorCode);
    },

    conflict(message = 'Resource already exists or conflict occurred.', errorCode = 'CONFLICT') {
        return new AppError(message, 409, null, errorCode);
    },

    unprocessable(message = 'Unprocessable Entity.', errors = null, errorCode = 'UNPROCESSABLE_ENTITY') {
        return new AppError(message, 422, errors, errorCode);
    },

    internal(message = 'Internal server error.', errorCode = 'INTERNAL_SERVER_ERROR') {
        return new AppError(message, 500, null, errorCode);
    }
};

export default ErrorFactory;
