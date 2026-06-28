import db from '../config/db.js';

const VALID_BOOKING_STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

function parseTimeValue(timeValue) {
  if (!timeValue || typeof timeValue !== 'string') return null;

  const trimmed = timeValue.trim();

  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    return `${trimmed.padStart(5, '0')}:00`;
  }

  if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(trimmed)) {
    const [hours, minutes, seconds] = trimmed.split(':');
    return `${`${hours}:${minutes}`.padStart(5, '0')}:${seconds.padStart(2, '0')}`;
  }

  return null;
}

function isTimeRangeValid(startTime, endTime) {
  const normalizedStart = parseTimeValue(startTime);
  const normalizedEnd = parseTimeValue(endTime);
  if (!normalizedStart || !normalizedEnd) return false;
  return normalizedStart < normalizedEnd;
}

export async function getAll(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const [result, countResult] = await Promise.all([
      db.query(
        "SELECT id, user_id, resource_id, start_time, end_time, status, TO_CHAR(booking_date, 'YYYY-MM-DD') as booking_date FROM bookings ORDER BY bookings.booking_date DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      ),
      db.query('SELECT COUNT(*) FROM bookings'),
    ]);

    const total = parseInt(countResult.rows[0].count, 10) || 0;

    return res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: result.rows,
      meta: { total, page, limit },
    });
  } catch (error) {
    console.error('Booking getAll error:', error);
    return next(error);
  }
}

export async function create(req, res, next) {
  const userId = req.user?.id;
  const { resource_id, booking_date, start_time, end_time } = req.body;

  if (!userId || !resource_id || !booking_date || !start_time || !end_time) {
    return res.status(400).json({
      success: false,
      message: 'resource_id, booking_date, start_time, and end_time are required',
      data: null,
    });
  }

  if (!isTimeRangeValid(start_time, end_time)) {
    return res.status(400).json({
      success: false,
      message: 'start_time must be before end_time',
      data: null,
    });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const resourceStatusResult = await client.query('SELECT status FROM resources WHERE id = $1 FOR UPDATE', [resource_id]);
    
    if (resourceStatusResult.rowCount === 0 || resourceStatusResult.rows[0].status !== 'Available') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Resource is not available for booking',
        data: null,
      });
    }

    const overlapQuery = `
      SELECT id FROM bookings
      WHERE resource_id = $1
        AND booking_date = $2
        AND status IN ('Pending', 'Approved')
        AND (start_time < $4 AND end_time > $3)
      FOR UPDATE
    `;

    const overlapResult = await client.query(overlapQuery, [resource_id, booking_date, start_time, end_time]);
    if (overlapResult.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Booking conflict detected',
        data: null,
      });
    }

    const insertQuery = `
      INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const insertResult = await client.query(insertQuery, [userId, resource_id, booking_date, start_time, end_time]);
    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking: insertResult.rows[0] },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Booking create error:', error);
    return next(error);
  } finally {
    client.release();
  }
}

export async function approve(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking id',
      data: null,
    });
  }

  const bookingId = parseInt(req.params.id, 10);

  try {
    const result = await db.query('UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *', ['Approved', bookingId]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      data: { booking: result.rows[0] },
    });
  } catch (error) {
    console.error('Booking approve error:', error);
    return next(error);
  }
}

export async function reject(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking id',
      data: null,
    });
  }

  const bookingId = parseInt(req.params.id, 10);

  try {
    const result = await db.query('UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *', ['Rejected', bookingId]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: { booking: result.rows[0] },
    });
  } catch (error) {
    console.error('Booking reject error:', error);
    return next(error);
  }
}

export async function cancel(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking id',
      data: null,
    });
  }

  const bookingId = parseInt(req.params.id, 10);
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  try {
    const bookingResult = await db.query('SELECT user_id FROM bookings WHERE id = $1', [bookingId]);
    if (bookingResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        data: null,
      });
    }

    const bookingOwnerId = bookingResult.rows[0].user_id;
    if (userRole !== 'admin' && bookingOwnerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        data: null,
      });
    }

    const result = await db.query('UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *', ['Cancelled', bookingId]);
    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking: result.rows[0] },
    });
  } catch (error) {
    console.error('Booking cancel error:', error);
    return next(error);
  }
}