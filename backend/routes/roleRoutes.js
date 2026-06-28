import express from 'express';
import db from '../config/db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, authorize('admin'), async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM roles ORDER BY id ASC');
    return res.status(200).json({
      success: true,
      message: 'Roles retrieved successfully',
      data: { roles: result.rows },
    });
  } catch (error) {
    console.error('Role list error:', error);
    return next(error);
  }
});

export default router;
