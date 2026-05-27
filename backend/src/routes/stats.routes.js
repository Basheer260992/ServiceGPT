import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { summary } from '../controllers/stats.controller.js';

const router = Router();
router.get('/summary', authRequired, summary);

export default router;
