import express from 'express';
import db from '../config/db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, authorize('admin'), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.status, r.name AS role, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: { users: result.rows },
    });
  } catch (error) {
    console.error('User list error:', error);
    return next(error);
  }
});

export default router;
