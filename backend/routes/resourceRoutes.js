import express from 'express';
import {
  getAll,
  getById,
  create,
  update,
  remove,
} from '../controllers/resourceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getAll);
router.get('/:id', authMiddleware, getById);
router.post('/', authMiddleware, authorize('admin'), create);
router.put('/:id', authMiddleware, authorize('admin'), update);
router.delete('/:id', authMiddleware, authorize('admin'), remove);

export default router;
