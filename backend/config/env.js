import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isProd = process.env.NODE_ENV === 'production';

// Validator function: Throws a fatal error in production if a secret is missing
const requireEnv = (name) => {
  if (!process.env[name]) {
    if (isProd) {
      throw new Error(`CRITICAL: Environment variable ${name} is strictly required in production.`);
    }
    console.warn(`Warning: Environment variable ${name} is missing. Falling back to insecure default for local development.`);
  }
  return process.env[name];
};

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = requireEnv('JWT_SECRET') || 'insecure_jwt_secret_change_me';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
export const COOKIE_SECRET = requireEnv('COOKIE_SECRET') || 'insecure_cookie_secret_change_me';
export const CSRF_SECRET = requireEnv('CSRF_SECRET') || 'insecure_csrf_secret_change_me';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';