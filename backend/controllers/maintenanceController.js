import db from '../config/db.js';

const VALID_MAINTENANCE_STATUSES = ['Open', 'In Progress', 'Resolved'];

export async function getAll(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const result = await db.query(
      'SELECT * FROM maintenance_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return res.status(200).json({
      success: true,
      message: 'Maintenance requests retrieved successfully',
      data: result.rows,
      meta: { page, limit },
    });
  } catch (error) {
    console.error('Maintenance getAll error:', error);
    return next(error);
  }
}

export async function create(req, res, next) {
  const reportedBy = req.user?.id;
  const { asset_id, issue, status } = req.body;

  if (!reportedBy || !asset_id || !issue) {
    return res.status(400).json({
      success: false,
      message: 'asset_id and issue are required',
      data: null,
    });
  }

  if (status !== undefined && !VALID_MAINTENANCE_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid maintenance status. Valid statuses: ${VALID_MAINTENANCE_STATUSES.join(', ')}`,
      data: null,
    });
  }

  const statusValue = status || 'Open';

  try {
    const result = await db.query(
      'INSERT INTO maintenance_requests (asset_id, reported_by, issue, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [asset_id, reportedBy, issue, statusValue]
    );
    return res.status(201).json({
      success: true,
      message: 'Maintenance request created successfully',
      data: { maintenance_request: result.rows[0] },
    });
  } catch (error) {
    console.error('Maintenance create error:', error);
    return next(error);
  }
}

export async function updateStatus(req, res, next) {
  const maintenanceId = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (Number.isNaN(maintenanceId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid maintenance request id',
      data: null,
    });
  }

  if (!status || !VALID_MAINTENANCE_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_MAINTENANCE_STATUSES.join(', ')}`,
      data: null,
    });
  }

  try {
    const result = await db.query('UPDATE maintenance_requests SET status = $1 WHERE id = $2 RETURNING *', [status, maintenanceId]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found',
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Maintenance request status updated successfully',
      data: { maintenance_request: result.rows[0] },
    });
  } catch (error) {
    console.error('Maintenance updateStatus error:', error);
    return next(error);
  }
}