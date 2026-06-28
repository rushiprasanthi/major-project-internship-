import { jest } from '@jest/globals';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

const mockDb = {
  query: jest.fn(async (text) => {
    const normalized = text.trim().toUpperCase();

    if (normalized.includes('FROM USERS U') && normalized.includes('JOIN ROLES R')) {
      return {
        rowCount: 1,
        rows: [
          {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            password_hash: '$2a$10$DUMMY_HASHED_PASSWORD',
            status: 'Active',
            role: 'user',
            created_at: '2026-06-27T00:00:00.000Z',
          },
        ],
      };
    }

    return { rowCount: 0, rows: [] };
  }),
};

jest.unstable_mockModule('../config/db.js', () => ({
  __esModule: true,
  default: mockDb,
}));

jest.unstable_mockModule('bcryptjs', () => ({
  __esModule: true,
  default: {
    compare: jest.fn(),
  },
}));

const bcrypt = await import('bcryptjs');
const { app } = await import('../server.js');

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and sets a JWT cookie on successful login', async () => {
    bcrypt.default.compare.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'correctPassword' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.user).toMatchObject({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      status: 'Active',
      role: 'user',
    });

    const setCookieHeader = res.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    expect(Array.isArray(setCookieHeader)).toBe(true);
    expect(setCookieHeader.some((cookie) => cookie.startsWith('token='))).toBe(true);
  });

  it('returns 401 when the password is incorrect', async () => {
    bcrypt.default.compare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
    expect(res.headers['set-cookie']).toBeUndefined();
  });
});
