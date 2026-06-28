import db from '../config/db.js';

const VALID_BOOKING_STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

function normalizeToUTC(dateString) {
  if (!dateString) return null;
  // Enforce parsing string explicitly as UTC ISO-8601
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00Z`);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

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

function isTimeRangeValid(bookingDate, startTime, endTime) {
  const normDate = normalizeToUTC(bookingDate);
  const normStart = parseTimeValue(startTime);
  const normEnd = parseTimeValue(endTime);

  if (!normDate || !normStart || !normEnd) return false;

  const start = new Date(`${normDate}T${normStart}Z`);
  const end = new Date(`${normDate}T${normEnd}Z`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

  return start < end;
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

  const normalizedDate = normalizeToUTC(booking_date);
  const normalizedStart = parseTimeValue(start_time);
  const normalizedEnd = parseTimeValue(end_time);

  if (!normalizedDate || !normalizedStart || !normalizedEnd) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ISO-8601 date or time format',
      data: null,
    });
  }

  if (!isTimeRangeValid(normalizedDate, normalizedStart, normalizedEnd)) {
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

    // Execute queries using strictly normalized UTC components 
    const overlapResult = await client.query(overlapQuery, [resource_id, normalizedDate, normalizedStart, normalizedEnd]);
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
    const insertResult = await client.query(insertQuery, [userId, resource_id, normalizedDate, normalizedStart, normalizedEnd]);
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
    // SECURE: Enforce state machine. Only 'Pending' bookings can be approved to prevent overlap bypass.
    const result = await db.query(
      `UPDATE bookings SET status = $1 WHERE id = $2 AND status = 'Pending' RETURNING *`, 
      ['Approved', bookingId]
    );
    
    if (result.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Booking not found or cannot be approved from its current state',
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
    // SECURE: Enforce state machine.
    const result = await db.query(
      `UPDATE bookings SET status = $1 WHERE id = $2 AND status = 'Pending' RETURNING *`, 
      ['Rejected', bookingId]
    );
    
    if (result.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Booking not found or cannot be rejected from its current state',
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

    // SECURE: Enforce state machine. Only active bookings can be cancelled.
    const result = await db.query(
      `UPDATE bookings SET status = $1 WHERE id = $2 AND status IN ('Pending', 'Approved') RETURNING *`, 
      ['Cancelled', bookingId]
    );
    
    if (result.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled from its current state',
        data: null,
      });
    }

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