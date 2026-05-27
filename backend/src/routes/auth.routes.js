import { Router } from 'express';
import { login, register, me, guest } from '../controllers/auth.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.post('/login', login);
router.post('/register', register);
router.get('/me', authRequired, me);
router.get('/guest', guest);

export default router;
