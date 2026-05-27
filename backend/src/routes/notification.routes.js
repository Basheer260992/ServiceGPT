import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { db, persist } from '../config/storage.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const list = (db.data.notifications || [])
    .filter((n) => !n.userId || n.userId === req.user.id)
    .slice(0, 50);
  res.json(list);
});

router.post('/:id/read', authRequired, async (req, res) => {
  const n = (db.data.notifications || []).find((x) => x.id === req.params.id);
  if (!n) return res.status(404).json({ message: 'Not found' });
  n.read = true;
  await persist();
  res.json(n);
});

router.post('/read-all', authRequired, async (req, res) => {
  (db.data.notifications || [])
    .filter((n) => !n.userId || n.userId === req.user.id)
    .forEach((n) => (n.read = true));
  await persist();
  res.json({ ok: true });
});

export default router;
