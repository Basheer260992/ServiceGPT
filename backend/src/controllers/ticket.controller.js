import { nanoid } from 'nanoid';
import { db, persist } from '../config/storage.js';
import * as sn from '../integrations/servicenow.js';

const PREFIX = { incidents: 'INC', problems: 'PRB', changes: 'CHG' };
const COUNTER_START = { incidents: 1001, problems: 2001, changes: 3001 };

function isSN() {
  return (process.env.DATA_SOURCE || 'json').toLowerCase() === 'servicenow' && sn.isConfigured();
}

function nextNumber(collection) {
  const items = db.data[collection] || [];
  const prefix = PREFIX[collection];
  const max = items
    .map((i) => parseInt(i.number?.replace(prefix, ''), 10))
    .filter((n) => !isNaN(n))
    .reduce((m, n) => Math.max(m, n), COUNTER_START[collection] - 1);
  return `${prefix}${String(max + 1).padStart(7, '0')}`;
}

function ownsTicket(user, ticket) {
  if (!user || !ticket) return false;
  return ticket.requestedBy === user.name || ticket.requestedBy === user.email;
}

export function makeTicketController(collection) {
  return {
    list: async (req, res, next) => {
      try {
        if (isSN()) {
          const { state, priority, search, page = 1, limit = 50 } = req.query;
          // Employees: scope to their own requests via SN query
          const extraQuery = req.user?.role === 'employee' ? { requestedByEquals: req.user.name } : {};
          const result = await sn.listTickets(collection, {
            state, priority, search, page: Number(page), limit: Number(limit), ...extraQuery,
          });
          return res.json(result);
        }
        const { state, priority, category, search, page = 1, limit = 50 } = req.query;
        let rows = [...(db.data[collection] || [])].reverse();

        // Role-based scoping: employees see only their own tickets
        if (req.user?.role === 'employee') {
          rows = rows.filter((r) => ownsTicket(req.user, r));
        }

        if (state) rows = rows.filter((r) => r.state === state);
        if (priority) rows = rows.filter((r) => r.priority === priority);
        if (category) rows = rows.filter((r) => r.category === category);
        if (search) {
          const q = String(search).toLowerCase();
          rows = rows.filter(
            (r) =>
              r.shortDescription?.toLowerCase().includes(q) ||
              r.number?.toLowerCase().includes(q) ||
              r.requestedBy?.toLowerCase().includes(q)
          );
        }
        const total = rows.length;
        const p = Math.max(1, parseInt(page, 10));
        const l = Math.max(1, parseInt(limit, 10));
        const slice = rows.slice((p - 1) * l, p * l);
        res.json({ data: slice, total, page: p, limit: l });
      } catch (err) { next(err); }
    },

    get: async (req, res, next) => {
      try {
        if (isSN()) {
          const item = await sn.getTicket(collection, req.params.id);
          if (req.user?.role === 'employee' && !ownsTicket(req.user, item)) {
            return res.status(403).json({ message: 'You can only view your own tickets' });
          }
          return res.json(item);
        }
        const item = db.data[collection].find((r) => r.id === req.params.id || r.number === req.params.id);
        if (!item) return res.status(404).json({ message: 'Not found' });
        if (req.user?.role === 'employee' && !ownsTicket(req.user, item)) {
          return res.status(403).json({ message: 'You can only view your own tickets' });
        }
        res.json(item);
      } catch (err) {
        if (err.status === 404) return res.status(404).json({ message: 'Not found' });
        next(err);
      }
    },

    create: async (req, res, next) => {
      try {
        if (req.user?.role === 'guest') {
          return res.status(403).json({ message: 'Guest users cannot create tickets. Please log in.' });
        }
        const payload = req.body || {};
        if (!payload.shortDescription) {
          return res.status(400).json({ message: 'shortDescription is required' });
        }
        // Employees can only file tickets in their own name
        if (req.user?.role === 'employee') {
          payload.requestedBy = req.user.name;
          payload.assignedTo = '';
        }

        if (isSN()) {
          const instanceId = payload.instanceId || payload.selectedInstance || req.query.instanceId;
          const created = await sn.createTicket(collection, payload, instanceId);
          return res.status(201).json(created);
        }

        const now = new Date().toISOString();
        const ticket = {
          id: nanoid(),
          number: nextNumber(collection),
          shortDescription: payload.shortDescription,
          description: payload.description || '',
          priority: payload.priority || 'Moderate',
          category: payload.category || 'Software',
          assignmentGroup: payload.assignmentGroup || 'Application Support',
          state: payload.state || 'New',
          impact: payload.impact || 'Medium',
          urgency: payload.urgency || 'Medium',
          requestedBy: payload.requestedBy || req.user?.name || 'Self-Service',
          assignedTo: payload.assignedTo || '',
          attachments: payload.attachments || [],
          sla: 100,
          ...(collection === 'changes' && {
            plannedStart: payload.plannedStart || null,
            plannedEnd: payload.plannedEnd || null,
            riskLevel: payload.riskLevel || 'Moderate',
            approval: 'Requested',
          }),
          ...(collection === 'problems' && {
            relatedIncidents: payload.relatedIncidents || [],
          }),
          createdAt: now,
          updatedAt: now,
        };
        db.data[collection].push(ticket);

        if (req.user) {
          db.data.notifications.unshift({
            id: nanoid(),
            userId: req.user.id,
            title: `${ticket.number} created`,
            message: ticket.shortDescription,
            type: 'success',
            read: false,
            createdAt: now,
          });
        }
        await persist();
        res.status(201).json(ticket);
      } catch (err) { next(err); }
    },

    update: async (req, res, next) => {
      try {
        // Employees and guests may never edit tickets
        if (req.user?.role === 'employee' || req.user?.role === 'guest') {
          return res.status(403).json({ message: 'You do not have permission to modify tickets.' });
        }
        // IT Support cannot approve change requests (admin-only state transitions)
        if (req.user?.role === 'support' && collection === 'changes' && req.body?.state === 'Approved') {
          return res.status(403).json({ message: 'Only an admin can approve change requests' });
        }

        if (isSN()) {
          const instanceId = req.body?.instanceId || req.body?.selectedInstance || req.query.instanceId;
          const updated = await sn.updateTicket(collection, req.params.id, req.body || {}, instanceId);
          return res.json(updated);
        }
        const idx = db.data[collection].findIndex((r) => r.id === req.params.id || r.number === req.params.id);
        if (idx === -1) return res.status(404).json({ message: 'Not found' });
        const updated = { ...db.data[collection][idx], ...req.body, updatedAt: new Date().toISOString() };
        db.data[collection][idx] = updated;
        await persist();
        res.json(updated);
      } catch (err) { next(err); }
    },

    remove: async (req, res, next) => {
      try {
        if (req.user?.role !== 'admin') {
          return res.status(403).json({ message: 'Only admins can delete tickets' });
        }
        if (isSN()) {
          return res.status(405).json({ message: 'Delete via ServiceNow is disabled from this portal' });
        }
        const idx = db.data[collection].findIndex((r) => r.id === req.params.id || r.number === req.params.id);
        if (idx === -1) return res.status(404).json({ message: 'Not found' });
        const [removed] = db.data[collection].splice(idx, 1);
        await persist();
        res.json({ removed });
      } catch (err) { next(err); }
    },
  };
}

// Admin-only: approve / reject a change request (or any ticket that supports it)
export function makeApprovalController(collection) {
  return async (req, res, next) => {
    try {
      const decision = String(req.params.decision || '').toLowerCase();
      if (!['approve', 'reject'].includes(decision)) {
        return res.status(400).json({ message: 'decision must be approve or reject' });
      }
      const newState = decision === 'approve' ? 'Approved' : 'Closed';
      const approval = decision === 'approve' ? 'Approved' : 'Rejected';

      if (isSN()) {
        const updated = await sn.updateTicket(collection, req.params.id, { state: newState });
        return res.json(updated);
      }

      const idx = db.data[collection].findIndex((r) => r.id === req.params.id || r.number === req.params.id);
      if (idx === -1) return res.status(404).json({ message: 'Not found' });
      const now = new Date().toISOString();
      const ticket = db.data[collection][idx];
      db.data[collection][idx] = {
        ...ticket,
        state: newState,
        approval,
        approvedBy: req.user.name,
        approvedAt: now,
        updatedAt: now,
      };

      // Notify the original requester
      const requester = db.data.users.find((u) => u.name === ticket.requestedBy);
      if (requester) {
        db.data.notifications.unshift({
          id: nanoid(),
          userId: requester.id,
          title: `${ticket.number} ${approval.toLowerCase()}`,
          message: `Your change request was ${approval.toLowerCase()} by ${req.user.name}.`,
          type: decision === 'approve' ? 'success' : 'warning',
          read: false,
          createdAt: now,
        });
      }
      await persist();
      res.json(db.data[collection][idx]);
    } catch (err) { next(err); }
  };
}
