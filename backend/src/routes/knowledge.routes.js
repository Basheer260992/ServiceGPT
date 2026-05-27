import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { db } from '../config/storage.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const { search } = req.query;
  let rows = [...(db.data.knowledge || [])];
  if (search) {
    const q = String(search).toLowerCase();
    rows = rows.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.summary?.toLowerCase().includes(q) ||
        r.body?.toLowerCase().includes(q)
    );
  }
  res.json(rows);
});

router.get('/:id', authRequired, (req, res) => {
  const a = (db.data.knowledge || []).find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ message: 'Not found' });
  res.json(a);
});

export default router;
