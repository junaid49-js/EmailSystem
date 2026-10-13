/**
 * Base custom error class for operational application errors.
 */
export class AppError extends Error {
    /**
     * @param {string} message - Human-readable error message
     * @param {number} [statusCode=500] - HTTP status code
     * @param {Array|object|null} [errors=null] - Additional validation or field error details
     * @param {string|null} [errorCode=null] - Internal application error code string
     */
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

/**
 * Factory for creating standard application and HTTP errors.
 */
export const ErrorFactory = {
    /**
     * 400 Bad Request
     */
    badRequest(message = 'Bad Request', errors = null, errorCode = 'BAD_REQUEST') {
        return new AppError(message, 400, errors, errorCode);
    },

    /**
     * 401 Unauthorized
     */
    unauthorized(message = 'Unauthorized. Authentication required.', errorCode = 'UNAUTHORIZED') {
        return new AppError(message, 401, null, errorCode);
    },

    /**
     * 403 Forbidden
     */
    forbidden(message = 'Access forbidden. Insufficient permissions.', errorCode = 'FORBIDDEN') {
        return new AppError(message, 403, null, errorCode);
    },

    /**
     * 404 Not Found
     */
    notFound(message = 'Resource not found.', errorCode = 'NOT_FOUND') {
        return new AppError(message, 404, null, errorCode);
    },

    /**
     * 409 Conflict
     */
    conflict(message = 'Resource already exists or conflict occurred.', errorCode = 'CONFLICT') {
        return new AppError(message, 409, null, errorCode);
    },

    /**
     * 422 Unprocessable Entity
     */
    unprocessable(message = 'Unprocessable Entity.', errors = null, errorCode = 'UNPROCESSABLE_ENTITY') {
        return new AppError(message, 422, errors, errorCode);
    },

    /**
     * 500 Internal Server Error
     */
    internal(message = 'Internal server error.', errorCode = 'INTERNAL_SERVER_ERROR') {
        return new AppError(message, 500, null, errorCode);
    }
};

export default ErrorFactory;
