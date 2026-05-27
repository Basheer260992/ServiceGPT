import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import { db, persist } from '../config/storage.js';

const router = Router();

router.get('/', authRequired, requireRole('admin'), (_req, res) => {
  const users = db.data.users.map(({ password, ...u }) => u);
  res.json(users);
});

router.put('/me', authRequired, async (req, res, next) => {
  if (req.user?.role === 'guest') {
    return res.status(403).json({ message: 'Guest users cannot modify profile.' });
  }
  const idx = db.data.users.findIndex((u) => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  const { name, department, avatar } = req.body || {};
  if (name) db.data.users[idx].name = name;
  if (department) db.data.users[idx].department = department;
  if (avatar) db.data.users[idx].avatar = avatar;
  await persist();
  const { password, ...rest } = db.data.users[idx];
  res.json(rest);
});

export default router;
