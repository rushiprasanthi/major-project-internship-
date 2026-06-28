import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

const mockDbState = {
  bookings: [],
  nextId: 1,
  overlapMode: false,
  overlapResolvers: [],
};

const createMockClient = () => ({
  query: jest.fn(async (text) => {
    const normalized = text.trim().toUpperCase();

    if (normalized === 'BEGIN' || normalized === 'COMMIT' || normalized === 'ROLLBACK') {
      return { rowCount: 0, rows: [] };
    }

    if (normalized.includes('SELECT ID FROM RESOURCES') && normalized.includes('FOR UPDATE')) {
      return { rowCount: 1, rows: [{ id: 1 }] };
    }

    if (normalized.includes('SELECT STATUS FROM RESOURCES')) {
      return { rowCount: 1, rows: [{ status: 'Available' }] };
    }

    if (normalized.includes('SELECT ID FROM BOOKINGS')) {
      if (mockDbState.overlapMode) {
        return new Promise((resolve) => {
          mockDbState.overlapResolvers.push(resolve);
          if (mockDbState.overlapResolvers.length === 2) {
            const firstResolve = mockDbState.overlapResolvers.shift();
            firstResolve({ rowCount: 0, rows: [] });
            const secondResolve = mockDbState.overlapResolvers.shift();
            secondResolve({ rowCount: 1, rows: [{ id: 999 }] });
          }
        });
      }

      const hasConflict = mockDbState.bookings.some((booking) => {
        return booking.resource_id === 1 && booking.booking_date === '2026-06-28' && booking.status !== 'Cancelled' && booking.start_time < '11:00' && booking.end_time > '10:00';
      });

      return {
        rowCount: hasConflict ? 1 : 0,
        rows: hasConflict ? [{ id: 999 }] : [],
      };
    }

    if (normalized.includes('INSERT INTO BOOKINGS')) {
      const newBooking = {
        id: mockDbState.nextId++,
        user_id: 1,
        resource_id: 1,
        booking_date: '2026-06-28',
        start_time: '10:00',
        end_time: '11:00',
        status: 'Pending',
      };
      mockDbState.bookings.push(newBooking);
      return { rowCount: 1, rows: [newBooking] };
    }

    return { rowCount: 0, rows: [] };
  }),
  release: jest.fn(),
});

const mockDb = {
  query: jest.fn(async (text) => {
    if (text.includes('SELECT * FROM bookings')) {
      return { rowCount: mockDbState.bookings.length, rows: mockDbState.bookings };
    }
    return { rowCount: 0, rows: [] };
  }),
  getClient: jest.fn(() => createMockClient()),
};

jest.unstable_mockModule('../config/db.js', () => ({
  __esModule: true,
  default: mockDb,
}));

const { app } = await import('../server.js');

function getAuthToken() {
  return jwt.sign({ id: 1, email: 'student@example.com', role: 'student' }, process.env.JWT_SECRET);
}

describe('Booking controller concurrency handling', () => {
  beforeEach(() => {
    mockDbState.bookings = [];
    mockDbState.nextId = 1;
    mockDbState.overlapMode = false;
    mockDbState.overlapResolvers = [];
    jest.clearAllMocks();
  });

  it('creates a booking successfully', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${getAuthToken()}`)
      .send({
        resource_id: 1,
        booking_date: '2026-06-28',
        start_time: '10:00',
        end_time: '11:00',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking).toBeDefined();
  });

  it('rejects a booking with a conflict', async () => {
    mockDbState.bookings.push({
      id: 1,
      user_id: 1,
      resource_id: 1,
      booking_date: '2026-06-28',
      start_time: '10:00',
      end_time: '11:00',
      status: 'Approved',
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${getAuthToken()}`)
      .send({
        resource_id: 1,
        booking_date: '2026-06-28',
        start_time: '10:00',
        end_time: '11:00',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Booking conflict detected');
  });

  it('allows only one of two simultaneous requests to succeed', async () => {
    mockDbState.overlapMode = true;

    const requestOne = request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${getAuthToken()}`)
      .send({
        resource_id: 1,
        booking_date: '2026-06-28',
        start_time: '10:00',
        end_time: '11:00',
      });

    const requestTwo = request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${getAuthToken()}`)
      .send({
        resource_id: 1,
        booking_date: '2026-06-28',
        start_time: '10:00',
        end_time: '11:00',
      });

    const [firstResponse, secondResponse] = await Promise.all([requestOne, requestTwo]);
    const successCount = [firstResponse.status, secondResponse.status].filter((status) => status === 201).length;
    const conflictCount = [firstResponse.status, secondResponse.status].filter((status) => status === 409).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(1);
  });
});
