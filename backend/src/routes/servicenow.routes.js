import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import { db, persist } from '../config/storage.js';
import * as sn from '../integrations/servicenow.js';

const router = Router();

router.get('/status', authRequired, async (_req, res) => {
  const instances = sn.listInstances();
  const enabled = (process.env.DATA_SOURCE || '').toLowerCase() === 'servicenow';
  if (instances.length === 0) return res.json({ enabled: false, configured: false, message: 'No ServiceNow instances configured' });
  try {
    // Ping default / first instance
    await sn.ping();
    res.json({ enabled, configured: true, ok: true, instances: instances });
  } catch (e) {
    res.status(502).json({ enabled, configured: true, ok: false, status: e.status, message: e.message, detail: e.detail, instances });
  }
});

// List configured ServiceNow instances (admin+support)
router.get('/instances', authRequired, async (_req, res) => {
  const list = sn.listInstances();
  res.json(list);
});

// Add a ServiceNow instance (admin only)
router.post('/instances', authRequired, requireRole('admin'), async (req, res) => {
  const { id, name, instance, url, username, password } = req.body || {};
  if (!instance && !url) return res.status(400).json({ message: 'instance or url required' });
  if (!db.data.servicenowInstances) db.data.servicenowInstances = [];
  const entry = { id: id || `inst-${Date.now()}`, name: name || instance || url, instance, url, username, password };
  db.data.servicenowInstances.push(entry);
  await persist();
  res.status(201).json({ ok: true, entry: { id: entry.id, name: entry.name, instance: entry.instance, url: entry.url } });
});

// One-shot import: pulls all incidents/problems/changes from ServiceNow
// into local JSON. Useful for demo + offline mode after the PDI hibernates.
router.post('/sync', authRequired, requireRole('admin'), async (_req, res, next) => {
  if (!sn.isConfigured()) {
    return res.status(400).json({ message: 'ServiceNow env vars not set' });
  }
  try {
    const [incidents, problems, changes] = await Promise.all([
      sn.listTickets('incidents', { limit: 200 }),
      sn.listTickets('problems', { limit: 200 }),
      sn.listTickets('changes', { limit: 200 }),
    ]);
    db.data.incidents = incidents.data;
    db.data.problems = problems.data;
    db.data.changes = changes.data;
    await persist();
    res.json({
      ok: true,
      imported: {
        incidents: incidents.data.length,
        problems: problems.data.length,
        changes: changes.data.length,
      },
      hint: 'Set DATA_SOURCE=json in .env to use these locally; set DATA_SOURCE=servicenow to keep reading live.',
    });
  } catch (e) {
    next(e);
  }
});

export default router;
