export const ResponseFactory = {
    success(res, message = 'Success', data = null, statusCode = 200, meta = null) {
        const payload = {
            success: true,
            message,
            ...(data !== null && data !== undefined ? { data } : {}),
            ...(meta ? { meta } : {})
        };
        return res.status(statusCode).json(payload);
    },

    created(res, message = 'Resource created successfully', data = null, meta = null) {
        return this.success(res, message, data, 201, meta);
    },

    noContent(res) {
        return res.status(204).send();
    },

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
