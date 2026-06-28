import db from '../config/db.js';

const VALID_RESOURCE_TYPES = ['Classroom', 'Laboratory', 'Seminar Hall'];
const VALID_RESOURCE_STATUSES = ['Available', 'Occupied', 'Maintenance'];

export async function getAll(req, res, next) {
  try {
    const filters = [];
    const values = [];

    if (req.query.type) {
      filters.push(`type = $${values.length + 1}`);
      values.push(req.query.type);
    }

    if (req.query.status) {
      filters.push(`status = $${values.length + 1}`);
      values.push(req.query.status);
    }

    const userRole = req.user?.role?.toLowerCase?.() || '';
    if (!['admin', 'maintenance'].includes(userRole)) {
      filters.push(`status != $${values.length + 1}`);
      values.push('Maintenance');
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const parsedPage = Number.parseInt(req.query.page, 10);
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1);
    
    // SECURE: Enforce maximum limit of 100 to prevent DoS attacks via massive payloads
    const limit = Number.isNaN(parsedLimit) ? 10 : Math.min(100, Math.max(parsedLimit, 1));
    const offset = (page - 1) * limit;

    const query = `SELECT * FROM resources ${whereClause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await db.query(query, values);

    return res.status(200).json({
      success: true,
      message: 'Resources retrieved successfully',
      data: result.rows,
      meta: { page, limit },
    });
  } catch (error) {
    console.error('Resource getAll error:', error);
    return next(error);
  }
}

export async function getById(req, res, next) {
  const resourceId = parseInt(req.params.id, 10);
  if (Number.isNaN(resourceId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource id',
      data: null,
    });
  }

  try {
    const result = await db.query('SELECT * FROM resources WHERE id = $1', [resourceId]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resource retrieved successfully',
      data: { resource: result.rows[0] },
    });
  } catch (error) {
    console.error('Resource getById error:', error);
    return next(error);
  }
}

export async function create(req, res, next) {
  const { name, type, capacity } = req.body;
  if (!name || !type || capacity === undefined || capacity === null) {
    return res.status(400).json({
      success: false,
      message: 'Name, type, and capacity are required',
      data: null,
    });
  }

  const parsedCapacity = Number(capacity);
  if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Capacity must be a positive integer',
      data: null,
    });
  }

  if (!VALID_RESOURCE_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid resource type. Valid types: ${VALID_RESOURCE_TYPES.join(', ')}`,
      data: null,
    });
  }

  try {
    const result = await db.query(
      'INSERT INTO resources (name, type, capacity) VALUES ($1, $2, $3) RETURNING *',
      [name, type, parsedCapacity]
    );

    return res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: { resource: result.rows[0] },
    });
  } catch (error) {
    console.error('Resource create error:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A resource with this name already exists',
        data: null,
      });
    }
    return next(error);
  }
}

export async function update(req, res, next) {
  const resourceId = parseInt(req.params.id, 10);
  if (Number.isNaN(resourceId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource id',
      data: null,
    });
  }

  const { name, capacity, status } = req.body;
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push(`name = $${values.length + 1}`);
    values.push(name);
  }

  if (capacity !== undefined) {
    const parsedCapacity = Number(capacity);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be a positive integer',
        data: null,
      });
    }
    updates.push(`capacity = $${values.length + 1}`);
    values.push(parsedCapacity);
  }

  if (status !== undefined) {
    if (!VALID_RESOURCE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${VALID_RESOURCE_STATUSES.join(', ')}`,
        data: null,
      });
    }
    updates.push(`status = $${values.length + 1}`);
    values.push(status);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one field (name, capacity, or status) must be provided for update',
      data: null,
    });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const query = `UPDATE resources SET ${updates.join(', ')} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(resourceId);

    const result = await client.query(query, values);
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
        data: null,
      });
    }

    if (status === 'Maintenance') {
      await client.query(
        `UPDATE bookings
         SET status = 'Cancelled'
         WHERE resource_id = $1
           AND booking_date >= CURRENT_DATE
           AND status IN ('Pending', 'Approved')`,
        [resourceId]
      );
    }

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: { resource: result.rows[0] },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Resource update error:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A resource with this name already exists',
        data: null,
      });
    }
    return next(error);
  } finally {
    client.release();
  }
}

export async function remove(req, res, next) {
  const resourceId = parseInt(req.params.id, 10);
  if (Number.isNaN(resourceId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource id',
      data: null,
    });
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      "UPDATE resources SET status = 'Maintenance' WHERE id = $1",
      [resourceId]
    );
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
        data: null,
      });
    }

    await client.query(
      `UPDATE bookings
       SET status = 'Cancelled'
       WHERE resource_id = $1
         AND booking_date >= CURRENT_DATE
         AND status IN ('Pending', 'Approved')`,
      [resourceId]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Resource archived successfully',
      data: null,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Resource delete error:', error);
    return next(error);
  } finally {
    client.release();
  }
}