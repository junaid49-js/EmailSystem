import argon2 from 'argon2';

/**
 * Hash a plain text password using Argon2id.
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
    return argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3,
        parallelism: 1
    });
}

/**
 * Verify a plain text password against an Argon2 hash.
 * @param {string} hash 
 * @param {string} password 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(hash, password) {
    return argon2.verify(hash, password);
}
