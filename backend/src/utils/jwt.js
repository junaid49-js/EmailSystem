import jwt from 'jsonwebtoken';
import { ErrorFactory } from './errorFactory.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token with a given payload and expiration.
 * @param {object} payload 
 * @param {string} [expiresIn] 
 * @returns {string}
 */
export function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Generate an access token.
 * @param {object} payload 
 * @param {string} [expiresIn='15m'] 
 * @returns {string}
 */
export function generateAccessToken(payload, expiresIn = '1d') {
    return jwt.sign({ ...payload, tokenType: 'access' }, JWT_SECRET, { expiresIn });
}

/**
 * Generate a refresh token.
 * @param {object} payload 
 * @param {string} [expiresIn='7d'] 
 * @returns {string}
 */
export function generateRefreshToken(payload, expiresIn = '7d') {
    return jwt.sign({ ...payload, tokenType: 'refresh' }, JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode a JWT token.
 * Throws AppError on invalid or expired token.
 * @param {string} token 
 * @returns {object}
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw ErrorFactory.unauthorized('Token has expired. Please log in again.', 'TOKEN_EXPIRED');
        }
        if (err.name === 'JsonWebTokenError') {
            throw ErrorFactory.unauthorized('Invalid authentication token.', 'TOKEN_INVALID');
        }
        throw ErrorFactory.unauthorized('Authentication token verification failed.', 'TOKEN_ERROR');
    }
}

/**
 * Decode a token without verifying signature.
 * @param {string} token 
 * @returns {object|null}
 */
export function decodeToken(token) {
    return jwt.decode(token);
}

export default {
    generateToken,
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    decodeToken
};
