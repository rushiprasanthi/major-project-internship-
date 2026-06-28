import db from '../config/db.js';

const VALID_ASSET_CONDITIONS = ['Available', 'Assigned', 'Damaged', 'Under Repair'];

export async function getAll(req, res, next) {
  try {
    const parsedPage = Number.parseInt(req.query.page, 10);
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1);
    const limit = Number.isNaN(parsedLimit) ? 10 : Math.max(parsedLimit, 1);
    const offset = (page - 1) * limit;

    const result = await db.query('SELECT * FROM assets ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    return res.status(200).json({
      success: true,
      message: 'Assets retrieved successfully',
      data: result.rows,
      meta: { page, limit },
    });
  } catch (error) {
    console.error('Asset getAll error:', error);
    return next(error);
  }
}

export async function create(req, res, next) {
  const { asset_name, category, serial_number, condition, assigned_resource_id } = req.body;
  if (!asset_name || !category || !serial_number || !condition) {
    return res.status(400).json({
      success: false,
      message: 'asset_name, category, serial_number, and condition are required',
      data: null,
    });
  }

  if (!VALID_ASSET_CONDITIONS.includes(condition)) {
    return res.status(400).json({
      success: false,
      message: `Invalid asset condition. Valid conditions: ${VALID_ASSET_CONDITIONS.join(', ')}`,
      data: null,
    });
  }

  try {
    const result = await db.query(
      'INSERT INTO assets (asset_name, category, serial_number, condition, assigned_resource_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [asset_name, category, serial_number, condition, assigned_resource_id || null]
    );
    return res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: { asset: result.rows[0] },
    });
  } catch (error) {
    console.error('Asset create error:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'An asset with this serial number already exists',
        data: null,
      });
    }
    return next(error);
  }
}

export async function update(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid asset id',
      data: null,
    });
  }

  const assetId = parseInt(req.params.id, 10);
  const { condition, assigned_resource_id } = req.body;
  const updates = [];
  const values = [];

  if (condition !== undefined) {
    if (!VALID_ASSET_CONDITIONS.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: `Invalid asset condition. Valid conditions: ${VALID_ASSET_CONDITIONS.join(', ')}`,
        data: null,
      });
    }
    updates.push(`condition = $${values.length + 1}`);
    values.push(condition);
  }

  if (assigned_resource_id !== undefined) {
    updates.push(`assigned_resource_id = $${values.length + 1}`);
    values.push(assigned_resource_id);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one field (condition or assigned_resource_id) is required for update',
      data: null,
    });
  }

  try {
    const query = `UPDATE assets SET ${updates.join(', ')} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(assetId);
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      data: { asset: result.rows[0] },
    });
  } catch (error) {
    console.error('Asset update error:', error);
    return next(error);
  }
}

export async function remove(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid asset id',
      data: null,
    });
  }

  const assetId = parseInt(req.params.id, 10);

  try {
    const result = await db.query('DELETE FROM assets WHERE id = $1', [assetId]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Asset deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Asset delete error:', error);
    return next(error);
  }
}
