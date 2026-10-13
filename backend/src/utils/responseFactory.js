/**
 * Centralized response factory for standardized JSON API responses.
 */
export const ResponseFactory = {
    /**
     * Send a standardized success response (200 OK by default).
     * @param {import('express').Response} res 
     * @param {string} [message='Success'] 
     * @param {any} [data=null] 
     * @param {number} [statusCode=200] 
     * @param {object|null} [meta=null] 
     */
    success(res, message = 'Success', data = null, statusCode = 200, meta = null) {
        const payload = {
            success: true,
            message,
            ...(data !== null && data !== undefined ? { data } : {}),
            ...(meta ? { meta } : {})
        };
        return res.status(statusCode).json(payload);
    },

    /**
     * Send a standardized 201 Created response.
     * @param {import('express').Response} res 
     * @param {string} [message='Resource created successfully'] 
     * @param {any} [data=null] 
     * @param {object|null} [meta=null] 
     */
    created(res, message = 'Resource created successfully', data = null, meta = null) {
        return this.success(res, message, data, 201, meta);
    },

    /**
     * Send a standardized 204 No Content response.
     * @param {import('express').Response} res 
     */
    noContent(res) {
        return res.status(204).send();
    },

    /**
     * Send a standardized error response.
     * @param {import('express').Response} res 
     * @param {string} [message='An error occurred'] 
     * @param {number} [statusCode=500] 
     * @param {Array|object|null} [errors=null] 
     * @param {string|null} [errorCode=null] 
     */
    error(res, message = 'An error occurred', statusCode = 500, errors = null, errorCode = null) {
        const payload = {
            success: false,
            message,
            ...(errorCode ? { errorCode } : {}),
            ...(errors ? { errors } : {})
        };
        return res.status(statusCode).json(payload);
    }
};

export default ResponseFactory;
