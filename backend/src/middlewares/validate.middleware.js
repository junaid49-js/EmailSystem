import { ResponseFactory } from '../utils/responseFactory.js';

export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const issues = result.error.issues || result.error.errors || [];
            const formattedErrors = issues.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            return ResponseFactory.error(
                res,
                'Validation failed',
                400,
                formattedErrors,
                'VALIDATION_ERROR'
            );
        }

        req.body = result.data;
        next();
    };
}

export default validate;
