import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { doubleCsrf } from 'csrf-csrf';
import winston from 'winston';
import { PORT, NODE_ENV, COOKIE_SECRET, CSRF_SECRET, FRONTEND_URL } from './config/env.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import userRoutes from './routes/userRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      const output = stack || message;
      return `${timestamp} ${level}: ${output}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    ...(NODE_ENV === 'production'
      ? [new winston.transports.File({ filename: 'error.log', level: 'error' })]
      : []),
  ],
});

export const app = express();

// SECURE: CRITICAL FIX FOR PRODUCTION. 
// Without this, the load balancer's IP is rate-limited, locking out all users globally.
app.set('trust proxy', 1);

// Global API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cookieParser(COOKIE_SECRET));
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Apply global rate limiting to all /api/ routes
app.use('/api/', apiLimiter);

// Setup modern double-csrf protection using strict env secrets
const { doubleCsrfProtection, generateToken } = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: NODE_ENV === 'production',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

function conditionalCsrf(req, res, next) {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }
  return doubleCsrfProtection(req, res, next);
}

app.use(conditionalCsrf);

app.get('/api/csrf-token', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CSRF token generated',
    data: { csrfToken: generateToken(req, res) },
  });
});

app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

if (NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Backend server running on http://localhost:${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

export default app;