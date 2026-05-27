import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import { makeApprovalController, makeTicketController } from '../controllers/ticket.controller.js';

const router = Router();
const ctrl = makeTicketController('changes');
const approval = makeApprovalController('changes');

router.get('/', authRequired, ctrl.list);
router.get('/:id', authRequired, ctrl.get);
router.post('/', authRequired, ctrl.create);
router.put('/:id', authRequired, ctrl.update);
router.delete('/:id', authRequired, ctrl.remove);

// Admin-only: approve or reject a change request
router.post('/:id/:decision(approve|reject)', authRequired, requireRole('admin'), approval);

export default router;
