import express from 'express';
import {
  getAll,
  create,
  updateStatus,
} from '../controllers/maintenanceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, authorize('admin', 'faculty', 'maintenance'), getAll);
router.post('/', authMiddleware, authorize('admin', 'faculty', 'maintenance'), create);
router.put('/:id/status', authMiddleware, authorize('admin', 'maintenance'), updateStatus);

export default router;
