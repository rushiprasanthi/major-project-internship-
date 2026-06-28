import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../config/db.js';
import { logger } from '../server.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Environment variable JWT_SECRET is required for JWT authentication');
}

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().min(1, 'Role is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function register(req, res, next) {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid registration payload',
      data: parseResult.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  const { name, password, role } = parseResult.data;
  const email = parseResult.data.email.toLowerCase();
  const normalizedRole = role.toLowerCase();

  try {
    const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', [normalizedRole]);
    if (roleResult.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided',
        data: null,
      });
    }

    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        data: null,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insertResult = await db.query(
      `INSERT INTO users (name, email, password_hash, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, status, created_at, role_id`,
      [name, email, passwordHash, roleResult.rows[0].id]
    );

    const userRow = insertResult.rows[0];

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      status: userRow.status,
      role: normalizedRole,
      created_at: userRow.created_at,
    };

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user },
    });
  } catch (error) {
    logger.error('Register error: %s', error.stack || error.message);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        data: null,
      });
    }

    return next(error);
  }
}

export async function login(req, res, next) {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid login payload',
      data: parseResult.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  const { password } = parseResult.data;
  const email = parseResult.data.email.toLowerCase();

  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.status, r.name AS role, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
      });
    }

    const user = result.rows[0];
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
        data: null,
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.role,
      created_at: user.created_at,
    };

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: safeUser },
    });
  } catch (error) {
    logger.error('Login error: %s', error.stack || error.message);
    return next(error);
  }
}

export async function logout(req, res) {
  return res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  }).status(200).json({
    success: true,
    message: 'Logout successful',
    data: null,
  });
}

export async function getMe(req, res, next) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  try {
    const userResult = await db.query(
      `SELECT u.id, u.name, u.email, u.status, r.name AS role, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    const user = userResult.rows[0];
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile fetched successfully',
      data: { user },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return next(error);
  }
}