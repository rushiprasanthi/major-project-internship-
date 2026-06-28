import express from 'express';
import {
  getAll,
  create,
  update,
  remove,
} from '../controllers/assetController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, authorize('admin', 'maintenance'), getAll);
router.post('/', authMiddleware, authorize('admin'), create);
router.put('/:id', authMiddleware, authorize('admin'), update);
router.delete('/:id', authMiddleware, authorize('admin'), remove);

export default router;
