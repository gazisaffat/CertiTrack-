import { Router } from 'express';
import {
  createApplication,
  listMyApplications,
  withdrawApplication,
  listAllApplications,
  updateApplicationStatus
} from '../controllers/applicationController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken);

// Applicant
router.post('/', createApplication);
router.get('/mine', listMyApplications);
router.patch('/:id/withdraw', withdrawApplication);

// Admin
router.get('/', verifyAdmin, listAllApplications);
router.patch('/:id/status', verifyAdmin, updateApplicationStatus);

export default router;
