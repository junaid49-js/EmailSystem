import crypto from 'node:crypto';

const SECRET = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-encryption-key-change-in-prod';
const SALT = 'email-system-encryption-salt';
const KEY = crypto.scryptSync(SECRET, SALT, 32);

export function encrypt(text) {
    if (!text) return '';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

export function decrypt(cipherPayload) {
    if (!cipherPayload) return '';
    const parts = cipherPayload.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted payload format.');
    }
    const [ivHex, tagHex, dataHex] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(dataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export default {
    encrypt,
    decrypt
};
