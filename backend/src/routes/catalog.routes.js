import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { db } from '../config/storage.js';

const router = Router();

router.get('/', authRequired, (_req, res) => {
  res.json(db.data.catalog || []);
});

export default router;
