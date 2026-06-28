import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const PORT = process.env.PORT || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
export const DATABASE_FILE = process.env.DATABASE_FILE || path.resolve(__dirname, '../database/rms.db');
