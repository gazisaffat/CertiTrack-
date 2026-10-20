import { Router } from 'express';
import { getOverviewStats } from '../controllers/applicationController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/overview', verifyToken, getOverviewStats);

export default router;
