import { Router } from 'express';
import {
  listSchemes,
  listCategories,
  getScheme,
  createScheme,
  updateScheme,
  deleteScheme
} from '../controllers/schemeController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', listSchemes);
router.get('/categories', listCategories); // must be declared before '/:id'
router.get('/:id', getScheme);

// Admin
router.post('/', verifyToken, verifyAdmin, createScheme);
router.patch('/:id', verifyToken, verifyAdmin, updateScheme);
router.delete('/:id', verifyToken, verifyAdmin, deleteScheme);

export default router;
