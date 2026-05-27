// ServiceNow Table API client
// Docs: https://developer.servicenow.com/dev.do#!/reference/api/utah/rest/c_TableAPI

import { db } from '../config/storage.js';

function resolveInstance(instanceId) {
  if (instanceId && db && db.data && Array.isArray(db.data.servicenowInstances)) {
    const found = db.data.servicenowInstances.find((i) => i.id === instanceId || i.instance === instanceId);
    if (found) {
      const envUser = process.env[`SERVICENOW_USERNAME_${found.id}`];
      const envPass = process.env[`SERVICENOW_PASSWORD_${found.id}`];
      const envUrl = process.env[`SERVICENOW_URL_${found.id}`];
      return {
        instance: found.instance,
        user: envUser || found.username || process.env.SERVICENOW_USERNAME,
        pass: envPass || process.env.SERVICENOW_PASSWORD,
        url: envUrl || found.url || (found.instance ? `https://${found.instance}.service-now.com` : undefined),
      };
    }
  }
  return {
    instance: process.env.SERVICENOW_INSTANCE,
    user: process.env.SERVICENOW_USERNAME,
    pass: process.env.SERVICENOW_PASSWORD,
    url: process.env.SERVICENOW_URL,
  };
}

export { resolveInstance as _resolve };

export function isConfigured(instanceId) {
  const c = resolveInstance(instanceId);
  return Boolean((c.instance || c.url) && c.user && c.pass);
}

function baseUrl(c) {
  if (c.url) return `${c.url.replace(/\/$/, '')}/api/now`;
  return `https://${c.instance}.service-now.com/api/now`;
}

function authHeader(c) {
  const token = Buffer.from(`${c.user}:${c.pass}`).toString('base64');
  return `Basic ${token}`;
}

async function snFetch(path, init = {}, instanceId) {
  const c = resolveInstance(instanceId);
  const root = baseUrl(c);
  const url = path.startsWith('http') ? path : `${root}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader(c),
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!res.ok) {
    const err = new Error(body?.error?.message || `ServiceNow ${res.status}`);
    err.status = res.status;
    err.detail = body?.error?.detail;
    throw err;
  }
  return body;
}

// --- field normalizers (SN -> our shape) ---

const PRIORITY_MAP = {
  '1': 'Critical', '2': 'High', '3': 'Moderate', '4': 'Low', '5': 'Low',
};
const PRIORITY_REVERSE = { Critical: '1', High: '2', Moderate: '3', Low: '4' };

const IMPACT_URGENCY_MAP = { '1': 'High', '2': 'Medium', '3': 'Low' };
const IMPACT_URGENCY_REVERSE = { High: '1', Medium: '2', Low: '3' };

// Incident states (default ServiceNow)
const INC_STATE_MAP = {
  '1': 'New', '2': 'In Progress', '3': 'On Hold',
  '6': 'Resolved', '7': 'Closed', '8': 'Canceled',
};
const INC_STATE_REVERSE = {
  New: '1', 'In Progress': '2', 'On Hold': '3',
  Resolved: '6', Closed: '7', Canceled: '8',
};

// Problem states (default ServiceNow)
const PRB_STATE_MAP = {
  '1': 'New', '2': 'Root Cause Analysis', '3': 'Known Error',
  '4': 'Resolved', '5': 'Closed', '6': 'Closed',
};
const PRB_STATE_REVERSE = {
  New: '1', 'Root Cause Analysis': '2', 'Known Error': '3', Resolved: '4', Closed: '5',
};

// Change states (default ServiceNow)
const CHG_STATE_MAP = {
  '-5': 'New', '-4': 'Assess', '-3': 'Approved', '-2': 'Approved',
  '-1': 'Implement', '0': 'Review', '3': 'Closed', '4': 'Closed',
};
const CHG_STATE_REVERSE = {
  New: '-5', Assess: '-4', Approved: '-3', Implement: '-1', Review: '0', Closed: '3',
};

function pickField(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.display_value ?? v.value ?? '';
  return String(v);
}

function parsePriorityText(v) {
  const s = pickField(v).toLowerCase();
  if (s.includes('critical')) return 'Critical';
  if (s.includes('high')) return 'High';
  if (s.includes('moderate') || s.includes('medium')) return 'Moderate';
  if (s.includes('low') || s.includes('planning')) return 'Low';
  // numeric fallback
  return PRIORITY_MAP[pickField(v)] || 'Moderate';
}

function parseImpactUrgencyText(v) {
  const s = pickField(v).toLowerCase();
  if (s.includes('high')) return 'High';
  if (s.includes('medium')) return 'Medium';
  if (s.includes('low')) return 'Low';
  return IMPACT_URGENCY_MAP[pickField(v)] || 'Medium';
}

function parseSnDate(s) {
  if (!s) return new Date().toISOString();
  // ServiceNow returns "2024-01-02 15:04:05" (UTC)
  const iso = String(s).replace(' ', 'T') + (String(s).endsWith('Z') ? '' : 'Z');
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function mapRecord(r, table) {
  const stateMap =
    table === 'incident' ? INC_STATE_MAP
    : table === 'problem' ? PRB_STATE_MAP
    : CHG_STATE_MAP;

  const stateRaw = pickField(r.state);
  const stateText = stateMap[stateRaw] || stateRaw || 'New';

  return {
    id: pickField(r.sys_id),
    number: pickField(r.number),
    shortDescription: pickField(r.short_description),
    description: pickField(r.description),
    priority: parsePriorityText(r.priority),
    category: pickField(r.category) || 'Software',
    assignmentGroup: pickField(r.assignment_group) || '—',
    state: stateText,
    impact: parseImpactUrgencyText(r.impact),
    urgency: parseImpactUrgencyText(r.urgency),
    requestedBy: pickField(r.caller_id || r.opened_by || r.requested_by),
    assignedTo: pickField(r.assigned_to),
    attachments: [],
    sla: 0,
    createdAt: parseSnDate(pickField(r.sys_created_on)),
    updatedAt: parseSnDate(pickField(r.sys_updated_on)),
    ...(table === 'change_request' && {
      plannedStart: pickField(r.start_date) || null,
      plannedEnd: pickField(r.end_date) || null,
      riskLevel: pickField(r.risk) ? parsePriorityText(r.risk) : 'Moderate',
    }),
  };
}

function buildCreatePayload(body, table) {
  const stateReverse =
    table === 'incident' ? INC_STATE_REVERSE
    : table === 'problem' ? PRB_STATE_REVERSE
    : CHG_STATE_REVERSE;

  const out = {
    short_description: body.shortDescription,
    description: body.description || '',
    priority: PRIORITY_REVERSE[body.priority] || '3',
    impact: IMPACT_URGENCY_REVERSE[body.impact] || '2',
    urgency: IMPACT_URGENCY_REVERSE[body.urgency] || '2',
    category: (body.category || 'software').toLowerCase(),
  };
  if (body.state && stateReverse[body.state]) out.state = stateReverse[body.state];
  // assignment_group and caller_id expect sys_ids in SN; passing display names
  // works on most PDIs because of the friendly-name resolver. If it fails we omit.
  if (body.assignmentGroup) out.assignment_group = body.assignmentGroup;
  if (body.requestedBy) out.caller_id = body.requestedBy;
  return out;
}

// --- public API ---

const TABLE = { incidents: 'incident', problems: 'problem', changes: 'change_request' };

export async function listTickets(kind, query = {}, instanceId) {
  const table = TABLE[kind];
  const params = new URLSearchParams();
  params.set('sysparm_display_value', 'true');
  params.set('sysparm_limit', String(query.limit || 50));
  params.set('sysparm_offset', String(((query.page || 1) - 1) * (query.limit || 50)));
  params.set('sysparm_fields', [
    'sys_id', 'number', 'short_description', 'description', 'priority',
    'state', 'impact', 'urgency', 'category', 'assignment_group',
    'caller_id', 'opened_by', 'assigned_to',
    'sys_created_on', 'sys_updated_on',
    'start_date', 'end_date', 'risk',
  ].join(','));

  // ServiceNow query language
  const qParts = [];
  if (query.search) qParts.push(`short_descriptionLIKE${query.search}^ORnumberLIKE${query.search}`);
  if (query.priority) qParts.push(`priority=${PRIORITY_REVERSE[query.priority] || query.priority}`);
  if (query.state) {
    const reverse =
      table === 'incident' ? INC_STATE_REVERSE
      : table === 'problem' ? PRB_STATE_REVERSE
      : CHG_STATE_REVERSE;
    qParts.push(`state=${reverse[query.state] || query.state}`);
  }
  if (qParts.length) params.set('sysparm_query', qParts.join('^') + '^ORDERBYDESCsys_updated_on');
  else params.set('sysparm_query', 'ORDERBYDESCsys_updated_on');

  const data = await snFetch(`/table/${table}?${params.toString()}`, {}, instanceId);
  const items = (data.result || []).map((r) => mapRecord(r, table));
  return {
    data: items,
    total: items.length, // SN total count requires a separate HEAD; good enough for UI
    page: query.page || 1,
    limit: query.limit || 50,
  };
}

export async function getTicket(kind, idOrNumber, instanceId) {
  const table = TABLE[kind];
  // Try by sys_id first, then by number
  if (/^[a-f0-9]{32}$/i.test(idOrNumber)) {
    const data = await snFetch(`/table/${table}/${idOrNumber}?sysparm_display_value=true`, {}, instanceId);
    return mapRecord(data.result, table);
  }
  const data = await snFetch(`/table/${table}?sysparm_query=number=${encodeURIComponent(idOrNumber)}&sysparm_display_value=true&sysparm_limit=1`, {}, instanceId);
  if (!data.result || data.result.length === 0) {
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }
  return mapRecord(data.result[0], table);
}

export async function createTicket(kind, body, instanceId) {
  const table = TABLE[kind];
  const payload = buildCreatePayload(body, table);
  const data = await snFetch(`/table/${table}?sysparm_display_value=true`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, instanceId);
  return mapRecord(data.result, table);
}

export async function updateTicket(kind, idOrNumber, body, instanceId) {
  // Need sys_id for PATCH — resolve via getTicket if a number was provided
  const table = TABLE[kind];
  let sysId = idOrNumber;
  if (!/^[a-f0-9]{32}$/i.test(idOrNumber)) {
    const existing = await getTicket(kind, idOrNumber, instanceId);
    sysId = existing.id;
  }
  const payload = buildCreatePayload(body, table);
  // Only send changed/known fields, drop empty
  Object.keys(payload).forEach((k) => (payload[k] === '' || payload[k] == null) && delete payload[k]);
  const data = await snFetch(`/table/${table}/${sysId}?sysparm_display_value=true`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, instanceId);
  return mapRecord(data.result, table);
}

export async function summary(instanceId) {
  const [inc, prb, chg] = await Promise.all([
    listTickets('incidents', { limit: 100 }, instanceId),
    listTickets('problems', { limit: 100 }, instanceId),
    listTickets('changes', { limit: 100 }, instanceId),
  ]);
  const openStates = new Set(['New', 'In Progress', 'On Hold', 'Assess', 'Approved', 'Implement', 'Root Cause Analysis']);
  const resolvedStates = new Set(['Resolved', 'Closed']);
  const i = inc.data;

  const byPriority = ['Critical', 'High', 'Moderate', 'Low'].map((priority) => ({
    priority,
    count: i.filter((x) => x.priority === priority).length,
  }));
  const byState = ['New', 'In Progress', 'On Hold', 'Resolved', 'Closed'].map((state) => ({
    state,
    count: i.filter((x) => x.state === state).length,
  }));
  const totalResolved =
    i.filter((x) => resolvedStates.has(x.state)).length +
    prb.data.filter((x) => resolvedStates.has(x.state)).length +
    chg.data.filter((x) => resolvedStates.has(x.state)).length;

  return {
    totalIncidents: i.length,
    openIncidents: i.filter((x) => openStates.has(x.state)).length,
    problems: prb.data.length,
    changeRequests: chg.data.length,
    resolvedTickets: totalResolved,
    byPriority,
    byState,
    slaAverage: 0,
  };
}

export async function ping(instanceId) {
  // Lightweight check — fetch one record
  await snFetch('/table/incident?sysparm_limit=1&sysparm_fields=sys_id', {}, instanceId);
  return true;
}

export function listInstances() {
  if (db && db.data && Array.isArray(db.data.servicenowInstances) && db.data.servicenowInstances.length) {
    return db.data.servicenowInstances.map((i) => ({ id: i.id, name: i.name, instance: i.instance, url: i.url }));
  }
  // fallback to env
  if (process.env.SERVICENOW_INSTANCE) {
    return [{ id: 'env', name: process.env.SERVICENOW_INSTANCE, instance: process.env.SERVICENOW_INSTANCE, url: process.env.SERVICENOW_URL || `https://${process.env.SERVICENOW_INSTANCE}.service-now.com` }];
  }
  return [];
}
