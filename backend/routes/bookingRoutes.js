import express from 'express';
import {
  getAll,
  create,
  approve,
  reject,
  cancel,
} from '../controllers/bookingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, authorize('admin', 'faculty', 'student'), getAll);
router.post('/', authMiddleware, authorize('admin', 'faculty', 'student'), create);
router.put('/:id/approve', authMiddleware, authorize('admin'), approve);
router.put('/:id/reject', authMiddleware, authorize('admin'), reject);
router.put('/:id/cancel', authMiddleware, cancel);

export default router;
