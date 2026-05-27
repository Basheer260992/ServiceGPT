import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as sn from './servicenow.js';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const maxTokens = Number(process.env.GEMINI_MAX_TOKENS) || 2048;

let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export function isGeminiEnabled() {
  return Boolean(genAI);
}

const SYSTEM_PROMPT = `You are ServiceGPT, a helpful general-purpose AI assistant embedded inside an enterprise service portal.
You can answer anything a user asks — coding questions, explanations, writing help, math, general knowledge, brainstorming, casual conversation, IT troubleshooting, whatever they bring up. Be genuinely useful and conversational.

You also have one special capability: a function called create_incident that opens a real ticket in this organization's ServiceNow instance. Use it ONLY when the user explicitly asks to raise/open/create/file/log an incident or ticket. For everything else, just answer naturally.

Style:
- Be clear and concise, but match the length to the question. Use markdown when it helps (code blocks, lists).
- If the user asks about "my tickets" or a specific ticket number, use the "User context" block if provided. Do NOT invent ticket numbers, statuses, or KB articles.
- Don't refuse general questions by saying "I only help with IT" — you're a full assistant.

Creating incidents (only when the user asks):
- NEVER call create_incident on the first mention. First, restate what you will file (short description, priority, caller) in one short sentence and ask the user to confirm ("Should I open this?"). Only call the function after they say yes / go ahead / confirm / please.
- If priority isn't mentioned, default to "Moderate". Words like "urgent/asap/down/outage" → "High"; "critical/everyone affected/production down" → "Critical"; "minor/low priority/whenever" → "Low".
- The caller is automatically the signed-in user.
- After the function returns, reply with the incident number and a one-line status.`;

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'create_incident',
        description:
          'Create a new incident in the live ServiceNow instance. Only call AFTER the user has explicitly confirmed they want the incident opened. Returns the new incident number.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            shortDescription: {
              type: SchemaType.STRING,
              description: 'One-line summary of the issue.',
            },
            description: {
              type: SchemaType.STRING,
              description: 'Longer details if the user provided them. Optional.',
            },
            priority: {
              type: SchemaType.STRING,
              enum: ['Critical', 'High', 'Moderate', 'Low'],
              description: 'Defaults to Moderate if unclear from the conversation.',
            },
            category: {
              type: SchemaType.STRING,
              description: 'Optional category (software, hardware, network). Defaults to software.',
            },
          },
          required: ['shortDescription'],
        },
      },
    ],
  },
];

const PRIORITY_TO_IMPACT_URGENCY = {
  Critical: { impact: 'High', urgency: 'High' },
  High: { impact: 'High', urgency: 'Medium' },
  Moderate: { impact: 'Medium', urgency: 'Medium' },
  Low: { impact: 'Low', urgency: 'Low' },
};

function summarizeTickets(tickets, kind, limit = 5) {
  if (!Array.isArray(tickets) || tickets.length === 0) return '';
  const recent = [...tickets]
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, limit)
    .map((t) => `  - ${t.number || t.id} [${t.state || '?'} / ${t.priority || '?'}] ${t.shortDescription || ''}`)
    .join('\n');
  return `${kind}:\n${recent}`;
}

function summarizeKnowledge(articles, limit = 6) {
  if (!Array.isArray(articles) || articles.length === 0) return '';
  const items = articles
    .slice(0, limit)
    .map((a) => `  - ${a.title}${a.summary ? ` — ${a.summary}` : ''}`)
    .join('\n');
  return `Knowledge base articles:\n${items}`;
}

function buildUserContext({ user, incidents, problems, changes, knowledge }) {
  const lines = [];
  if (user) lines.push(`Signed-in user: ${user.name || user.email} (role: ${user.role || 'employee'})`);
  const myIncidents = (incidents || []).filter(
    (t) => t.requestedBy === user?.name || t.requestedBy === user?.email || t.assignedTo === user?.name,
  );
  const inc = summarizeTickets(myIncidents.length ? myIncidents : incidents, "User's recent incidents");
  const prb = summarizeTickets(problems, 'Recent problems');
  const chg = summarizeTickets(changes, 'Recent change requests');
  const kb = summarizeKnowledge(knowledge);
  [inc, prb, chg, kb].forEach((s) => s && lines.push(s));
  return lines.join('\n\n');
}

async function executeTool(name, args, { user }) {
  if (name !== 'create_incident') return { ok: false, error: `Unknown tool: ${name}` };
  if (!sn.isConfigured()) return { ok: false, error: 'ServiceNow is not configured.' };
  const priority = args.priority || 'Moderate';
  const { impact, urgency } = PRIORITY_TO_IMPACT_URGENCY[priority] || PRIORITY_TO_IMPACT_URGENCY.Moderate;
  try {
    const created = await sn.createTicket('incidents', {
      shortDescription: args.shortDescription,
      description: args.description || args.shortDescription,
      priority,
      impact,
      urgency,
      category: args.category || 'software',
      requestedBy: user?.name || user?.email || '',
    });
    // Build URL using selected instance if provided
    const inst = args.instanceId ? sn.listInstances().find((i) => i.id === args.instanceId) : null;
    const base = inst ? (inst.url || `https://${inst.instance}.service-now.com`) : `https://${process.env.SERVICENOW_INSTANCE}.service-now.com`;
    return {
      ok: true,
      number: created.number,
      id: created.id,
      state: created.state,
      priority: created.priority,
      url: `${base}/nav_to.do?uri=incident.do?sys_id=${created.id}`,
    };
  } catch (err) {
    return { ok: false, error: err.message || 'ServiceNow request failed' };
  }
}

function toGeminiHistory(history) {
  return (history || [])
    .slice(-10)
    .filter((m) => m.text)
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));
}

export async function askGemini({ text, history, context }) {
  if (!genAI) throw new Error('Gemini not configured');

  const userContext = buildUserContext(context);
  const systemInstruction = userContext
    ? `${SYSTEM_PROMPT}\n\nUser context (use only if relevant):\n${userContext}`
    : SYSTEM_PROMPT;

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    tools: TOOLS,
    generationConfig: { maxOutputTokens: maxTokens },
  });

  const chat = model.startChat({ history: toGeminiHistory(history) });
  let result;
  try {
    result = await chat.sendMessage(text);
  } catch (err) {
    // Retry once on transient 503 / model-overload errors.
    const msg = String(err?.message || '');
    if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
      await new Promise((r) => setTimeout(r, 1200));
      result = await chat.sendMessage(text);
    } else {
      throw err;
    }
  }

  // Function-calling loop (bounded to 3 hops)
  for (let hop = 0; hop < 3; hop += 1) {
    const calls = result.response.functionCalls?.() || [];
    if (calls.length === 0) {
      const reply = result.response.text();
      if (!reply) throw new Error('Empty response from Gemini');
      return reply;
    }
    const responses = [];
    for (const fc of calls) {
      const out = await executeTool(fc.name, fc.args || {}, { user: context.user });
      responses.push({ functionResponse: { name: fc.name, response: out } });
    }
    result = await chat.sendMessage(responses);
  }
  throw new Error('Gemini tool-use loop exceeded max hops');
}
