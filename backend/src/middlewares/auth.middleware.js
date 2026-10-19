import { verifyToken } from '../utils/jwt.js';
import { ErrorFactory } from '../utils/errorFactory.js';
import { AuthService } from '../services/auth.service.js';

export async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;

    if (!token) {
        throw ErrorFactory.unauthorized('Access denied. No token provided.', 'TOKEN_MISSING');
    }

    const decoded = verifyToken(token);
    const admin = await AuthService.findAdminById(decoded.id);

    if (!admin) {
        throw ErrorFactory.unauthorized('Invalid token: User no longer exists.', 'USER_NOT_FOUND');
    }

    if (admin.status !== 'active') {
        throw ErrorFactory.forbidden(
            `Account is ${admin.status}. Please contact the Super Admin.`,
            'ACCOUNT_INACTIVE'
        );
    }

    req.admin = admin;
    next();
}

export async function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;

    if (!token) {
        return next();
    }

    try {
        const decoded = verifyToken(token);
        const admin = await AuthService.findAdminById(decoded.id);
        if (admin && admin.status === 'active') {
            req.admin = admin;
        }
    } catch {
        // Ignore token errors in optional auth
    }
    next();
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.admin) {
            throw ErrorFactory.unauthorized('Authentication required.', 'AUTH_REQUIRED');
        }

        if (!roles.includes(req.admin.role)) {
            throw ErrorFactory.forbidden(
                `Access denied. Requires one of the following roles: ${roles.join(', ')}.`,
                'INSUFFICIENT_ROLE'
            );
        }

        next();
    };
}

export default {
    authenticateToken,
    optionalAuth,
    requireRole
};
