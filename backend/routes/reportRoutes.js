import express from 'express';
import { getOverview } from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/overview', authMiddleware, authorize('admin', 'faculty', 'maintenance'), getOverview);

export default router;
