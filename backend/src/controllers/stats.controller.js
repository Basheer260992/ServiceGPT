import { db } from '../config/storage.js';
import * as sn from '../integrations/servicenow.js';

const openStates = new Set(['New', 'In Progress', 'On Hold', 'Assess', 'Approved', 'Implement', 'Root Cause Analysis']);
const resolvedStates = new Set(['Resolved', 'Closed']);

function isSN() {
  return (process.env.DATA_SOURCE || 'json').toLowerCase() === 'servicenow' && sn.isConfigured();
}

function scope(rows, user) {
  if (!user || user.role !== 'employee') return rows;
  return rows.filter((r) => r.requestedBy === user.name || r.requestedBy === user.email);
}

export async function summary(req, res, next) {
  try {
    if (isSN()) {
      const s = await sn.summary();
      return res.json({ ...s, scope: req.user?.role === 'employee' ? 'self' : 'all' });
    }
    const i = scope(db.data.incidents, req.user);
    const p = scope(db.data.problems, req.user);
    const c = scope(db.data.changes, req.user);

    const totalIncidents = i.length;
    const openIncidents = i.filter((x) => openStates.has(x.state)).length;
    const resolvedTickets =
      i.filter((x) => resolvedStates.has(x.state)).length +
      p.filter((x) => resolvedStates.has(x.state)).length +
      c.filter((x) => resolvedStates.has(x.state)).length;
    const byPriority = ['Critical', 'High', 'Moderate', 'Low'].map((priority) => ({
      priority,
      count: i.filter((x) => x.priority === priority).length,
    }));
    const byState = ['New', 'In Progress', 'On Hold', 'Resolved', 'Closed'].map((state) => ({
      state,
      count: i.filter((x) => x.state === state).length,
    }));
    res.json({
      scope: req.user?.role === 'employee' ? 'self' : 'all',
      totalIncidents,
      openIncidents,
      problems: p.length,
      changeRequests: c.length,
      resolvedTickets,
      byPriority,
      byState,
      slaAverage: Math.round((i.reduce((s, x) => s + (x.sla || 0), 0) / Math.max(1, i.length)) * 10) / 10,
    });
  } catch (err) { next(err); }
}
