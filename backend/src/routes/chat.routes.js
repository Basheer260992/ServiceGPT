import { Router } from 'express';
import { nanoid } from 'nanoid';
import { authRequired } from '../middleware/auth.js';
import { db, persist } from '../config/storage.js';
import { askClaude, isClaudeEnabled } from '../integrations/claude.js';
import { askGemini, isGeminiEnabled } from '../integrations/gemini.js';
import * as sn from '../integrations/servicenow.js';

const router = Router();

const KNOWLEDGE_TIPS = {
  password: 'To reset your password, visit reset.servicegpt.io and complete MFA.',
  vpn: 'For VPN issues: check your network, then download the latest profile from the portal.',
  outlook: 'Try clearing cached credentials from Credential Manager and restarting Outlook.',
  printer: 'Verify the printer is online, then run the troubleshooter from Settings -> Printers.',
  laptop: 'You can request a new laptop from the Service Catalog. SLA: 5 business days.',
  sla: 'SLA targets: P1 - 4h, P2 - 8h, P3 - 24h, P4 - 48h.',
};

const INTENT_CREATE = /\b(create|raise|open|file|log|submit|new)\s+(an?\s+|the\s+)?(incident|ticket|issue)\b/i;
const INTENT_CONFIRM = /^\s*(yes|y|yep|yeah|ok|okay|confirm|confirmed|go ahead|please|do it|sure|create it|raise it|open it|proceed)\b/i;
const INTENT_CANCEL = /^\s*(no|n|cancel|stop|nevermind|never mind|don'?t|wait)\b/i;

function parseShortDescription(text) {
  let t = text
    .replace(/\b(please\s+)?(create|raise|open|file|log|submit|new)\s+(an?\s+|the\s+)?(incident|ticket|issue)\b/gi, '')
    .trim();
  t = t.replace(/^[:,\-\s]*(regarding|about|for|because of|because|on|with|to)\s+/i, '').trim();
  // Strip trailing priority hints so they don't end up in the title.
  t = t.replace(/[,;\s\-]*\b(critical|high|moderate|medium|low|urgent|asap)\s+priority\b.*$/i, '').trim();
  t = t.replace(/[,;\s\-]*\bpriority\s*[:=]?\s*(critical|high|moderate|medium|low|urgent|asap)\b.*$/i, '').trim();
  t = t.replace(/[,;\s\-]+$/, '').trim();
  t = t.replace(/^[:,\-\s]+/, '').trim();
  if (!t) return 'New incident raised from chat';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function parsePriority(text) {
  const t = text.toLowerCase();
  if (/\bcritical\b|production down|complete outage|everyone (is )?affected/.test(t)) return 'Critical';
  if (/\b(high|urgent|asap|down|blocked|severe)\b/.test(t)) return 'High';
  if (/\b(low|minor|whenever|when you can|not urgent)\b/.test(t)) return 'Low';
  return 'Moderate';
}

function hasPriorityHint(text) {
  return /\b(critical|high|urgent|asap|down|blocked|severe|low|minor|not urgent|whenever|when you can|production down|complete outage|everyone (is )?affected)\b/i.test(String(text));
}

function rulesReply(text) {
  const t = text.toLowerCase();
  for (const [key, reply] of Object.entries(KNOWLEDGE_TIPS)) {
    if (t.includes(key)) return reply;
  }
  if (t.includes('what is servicenow') || t.includes('what is service now') || t.includes('servicenow')) {
    return 'ServiceNow is an enterprise service management platform used for incident, change, problem, and request tracking. In this portal I can create ServiceNow incidents, but general conversational replies need a GPT API key in backend/.env.';
  }
  if (t.includes('who are you') || t.includes('what can you do') || t.includes('what is this')) {
    return 'I am ServiceGPT, an assistant that can create ServiceNow incidents and help with IT service requests. For broader chat or knowledge questions, the GPT engine must be enabled with a backend API key.';
  }
  if (t.includes('hello') || t.includes('hi ') || t.includes('hey')) {
    return 'Hi! I can open ServiceNow incidents for you right now. For general questions, the GPT engine needs GEMINI_API_KEY or GOOGLE_API_KEY (for Gemini), or ANTHROPIC_API_KEY (for Claude) set in backend/.env.';
  }
  if (t.includes('thanks') || t.includes('thank you')) return 'You are welcome!';
  return 'I can create incidents in ServiceNow if you say "create incident <describe issue>". For general chat, the GPT engine is not configured yet — ask the admin to set GEMINI_API_KEY or GOOGLE_API_KEY (for Gemini), or ANTHROPIC_API_KEY (for Claude) in backend/.env.';
}

function buildContext(userId) {
  const user = (db.data.users || []).find((u) => u.id === userId) || null;
  return {
    user: user ? { name: user.name, email: user.email, role: user.role } : null,
    incidents: db.data.incidents || [],
    problems: db.data.problems || [],
    changes: db.data.changes || [],
    knowledge: db.data.knowledge || [],
  };
}

function getPending(userId) {
  if (!db.data.pendingIncidents) db.data.pendingIncidents = {};
  return db.data.pendingIncidents[userId] || null;
}

async function setPending(userId, value) {
  if (!db.data.pendingIncidents) db.data.pendingIncidents = {};
  if (value === null) delete db.data.pendingIncidents[userId];
  else db.data.pendingIncidents[userId] = value;
  await persist();
}

const PRIORITY_TO_IMPACT_URGENCY = {
  Critical: { impact: 'High', urgency: 'High' },
  High: { impact: 'High', urgency: 'Medium' },
  Moderate: { impact: 'Medium', urgency: 'Medium' },
  Low: { impact: 'Low', urgency: 'Low' },
};

async function createInServiceNow(userId, proposal) {
  const instanceId = proposal.selectedInstance;
  if (!sn.isConfigured(instanceId)) {
    return { ok: false, error: 'ServiceNow is not configured for the selected instance.' };
  }
  const user = (db.data.users || []).find((u) => u.id === userId);
  const priority = proposal.priority || 'Moderate';
  const { impact, urgency } = PRIORITY_TO_IMPACT_URGENCY[priority] || PRIORITY_TO_IMPACT_URGENCY.Moderate;
  try {
    const created = await sn.createTicket('incidents', {
      shortDescription: proposal.shortDescription,
      description: proposal.description || proposal.shortDescription,
      priority,
      impact,
      urgency,
      category: 'software',
      requestedBy: user?.name || user?.email || '',
    }, instanceId);
    return { ok: true, ticket: created };
  } catch (err) {
    return {
      ok: false,
      error: `ServiceNow rejected the request: ${err.message}${err.status ? ` (HTTP ${err.status})` : ''}`,
    };
  }
}

async function generateReply(text, userId) {
  const history = (db.data.chatMessages || [])
    .filter((m) => m.userId === userId)
    .slice(-10);
  const ctx = buildContext(userId);

  const pending = getPending(userId);
  if (pending) {
    // If user picks an instance by number (or with select prefix)
    const selectMatch = text.match(/^\s*(?:select\s+)?(\d+)\s*$/i);
    if (selectMatch && pending.instances && pending.instances.length) {
      const idx = Number(selectMatch[1]) - 1;
      if (idx >= 0 && idx < pending.instances.length) {
        pending.selectedInstance = pending.instances[idx].id;
        pending.awaitingField = 'shortDescription';
        await setPending(userId, pending);
        const currentDesc = pending.shortDescription && pending.shortDescription !== 'New incident raised from chat'
          ? ` Reply with a new short description, or say "same" to keep: "${pending.shortDescription}".`
          : '';
        return `Selected instance: ${pending.instances[idx].name}. What short description should I use for this incident?${currentDesc}`;
      }
    }

    if (pending.awaitingField) {
      if (pending.awaitingField === 'shortDescription') {
        if (/^\s*(same|keep|yes|y)\s*$/i.test(text) && pending.shortDescription) {
          // keep the existing parsed description
        } else {
          pending.shortDescription = text.trim() || pending.shortDescription;
        }
        pending.awaitingField = 'priority';
        await setPending(userId, pending);
        return 'Great — what priority should this incident have? Critical, High, Moderate, or Low?';
      }
      if (pending.awaitingField === 'priority') {
        pending.priority = parsePriority(text);
        if (!pending.shortDescription || pending.shortDescription === 'New incident raised from chat') {
          pending.shortDescription = parseShortDescription(text);
        }
        pending.awaitingField = null;
        await setPending(userId, pending);
        return `Got it. I'll open this incident with short description "${pending.shortDescription}" and priority ${pending.priority}. Reply "yes" to confirm and create the incident, or "no" to cancel.`;
      }
    }
    if (INTENT_CONFIRM.test(text)) {
      const result = await createInServiceNow(userId, pending);
      await setPending(userId, null);
      if (result.ok) {
        const t = result.ticket;
        const inst = sn.listInstances().find((i) => i.id === pending.selectedInstance) || sn.listInstances()[0] || {};
        const base = inst.url || `https://${inst.instance || process.env.SERVICENOW_INSTANCE}.service-now.com`;
        return `Created ${t.number} in ServiceNow. State: ${t.state}, priority: ${t.priority}. View it at ${base}/nav_to.do?uri=incident.do?sys_id=${t.id}`;
      }
      return `I could not create the incident. ${result.error}`;
    }
    if (INTENT_CANCEL.test(text)) {
      await setPending(userId, null);
      return 'Cancelled. Let me know if you want to open a different incident.';
    }
  }

  if (INTENT_CREATE.test(text)) {
    const proposal = {
      shortDescription: parseShortDescription(text),
      priority: parsePriority(text),
      description: text,
      createdAt: new Date().toISOString(),
    };
    const instances = sn.listInstances();
    if (instances.length > 1) {
      const numbered = instances.map((i, idx) => `${idx + 1}. ${i.name} (${i.instance || i.url})`).join('\n');
      const pendingObj = { ...proposal, instances };
      await setPending(userId, pendingObj);
      return `I can open this incident in one of these instances:\n${numbered}\nReply with the number of the instance you want to use.`;
    }
    if (instances.length === 1) {
      proposal.selectedInstance = instances[0].id;
      proposal.awaitingField = 'shortDescription';
      await setPending(userId, proposal);
      return `I'll open this incident in ServiceNow (${instances[0].name}). What short description should I use for this incident?`;
    }
    await setPending(userId, proposal);
    return `I'll open this incident in ServiceNow: "${proposal.shortDescription}" with priority ${proposal.priority}. Reply "yes" to confirm or "no" to cancel.`;
  }

  // Primary GPT engine: Google Gemini (free tier). Owns intent detection + tool use.
  if (isGeminiEnabled()) {
    try {
      return await askGemini({ text, history, context: ctx });
    } catch (err) {
      console.error('[gemini] error, trying next engine:', err.message);
    }
  }

  // Secondary GPT engine: Anthropic Claude.
  if (isClaudeEnabled()) {
    try {
      return await askClaude({ text, history, context: ctx });
    } catch (err) {
      console.error('[claude] error, falling back to deterministic flow:', err.message);
    }
  }

  return rulesReply(text);
}

router.get('/', authRequired, (req, res) => {
  const list = (db.data.chatMessages || []).filter((m) => m.userId === req.user.id).slice(-50);
  res.json(list);
});

router.post('/', authRequired, async (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ message: 'Text required' });
  const now = new Date().toISOString();
  const user = { id: nanoid(), userId: req.user.id, role: 'user', text, createdAt: now };
  const replyText = await generateReply(text, req.user.id);
  const bot = {
    id: nanoid(),
    userId: req.user.id,
    role: 'bot',
    text: replyText,
    createdAt: new Date().toISOString(),
  };
  db.data.chatMessages.push(user, bot);
  await persist();
  res.json({ user, bot });
});

export default router;
