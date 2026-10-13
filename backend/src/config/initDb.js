import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDb() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = await fs.readFile(schemaPath, 'utf8');

    const statements = sql
        .split(/;\s*$/m)
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

    const connection = await pool.getConnection();
    try {
        console.log('Applying database schema...');
        for (const statement of statements) {
            await connection.query(statement);
        }
        console.log('Database schema applied successfully!');
    } finally {
        connection.release();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        await initDb();
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('Failed to initialize database schema:', err);
        process.exit(1);
    }
}
