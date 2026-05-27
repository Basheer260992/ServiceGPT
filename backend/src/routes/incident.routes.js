import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { makeTicketController } from '../controllers/ticket.controller.js';

const router = Router();
const ctrl = makeTicketController('incidents');

router.get('/', authRequired, ctrl.list);
router.get('/:id', authRequired, ctrl.get);
router.post('/', authRequired, ctrl.create);
router.put('/:id', authRequired, ctrl.update);
router.delete('/:id', authRequired, ctrl.remove);

export default router;
