import { Router } from 'express';
import { createSession, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/session', createSession);
router.get('/me', verifyToken, getMe);

export default router;
