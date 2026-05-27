import Anthropic from '@anthropic-ai/sdk';
import * as sn from './servicenow.js';

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const maxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS) || 600;

let client = null;
if (apiKey) {
  client = new Anthropic({ apiKey });
}

export function isClaudeEnabled() {
  return Boolean(client);
}

const SYSTEM_PROMPT = `You are ServiceGPT, a helpful general-purpose AI assistant embedded inside an enterprise service portal.
You can answer anything a user asks — coding questions, explanations, writing help, math, general knowledge, brainstorming, casual conversation, IT troubleshooting, whatever they bring up. Be genuinely useful and conversational, like ChatGPT or Claude.

You also have one special capability: a tool called create_incident that opens a real ticket in this organization's ServiceNow instance. Use it ONLY when the user explicitly asks to raise/open/create/file/log an incident or ticket. For everything else, just answer naturally.

Style:
- Be clear and concise, but don't artificially cap length — match the question. Use markdown when it actually helps (code blocks, lists). Plain text for casual replies.
- If the user asks about "my tickets" or a specific ticket number, use the "User context" block if provided. Do NOT invent ticket numbers, statuses, or KB articles that aren't in that block.
- Don't refuse general questions by saying "I only help with IT" — you're a full assistant.

Creating incidents (only when the user asks):
- NEVER call create_incident on the first mention. First, restate what you will file (short description, priority, caller) in one short sentence and ask the user to confirm ("Should I open this?"). Only call the tool after they say yes / go ahead / confirm / please.
- If priority isn't mentioned, default to "Moderate". Words like "urgent/asap/down/outage" → "High"; "critical/everyone affected/production down" → "Critical"; "minor/low priority/whenever" → "Low".
- The caller is automatically the signed-in user; don't ask for it.
- After the tool returns, reply with the incident number and a one-line status.`;

const TOOLS = [
  {
    name: 'create_incident',
    description:
      'Create a new incident in the live ServiceNow instance. Only call this AFTER the user has explicitly confirmed they want the incident opened. Returns the new incident number.',
    input_schema: {
      type: 'object',
      properties: {
        shortDescription: {
          type: 'string',
          description: 'One-line summary of the issue, e.g. "Outlook keeps crashing on launch".',
        },
        description: {
          type: 'string',
          description: 'Longer details if the user provided them. Optional.',
        },
        priority: {
          type: 'string',
          enum: ['Critical', 'High', 'Moderate', 'Low'],
          description: 'Defaults to Moderate if unclear from the conversation.',
        },
        category: {
          type: 'string',
          description: 'Optional category (software, hardware, network, etc.). Defaults to software.',
        },
      },
      required: ['shortDescription'],
    },
  },
];

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
  if (user) {
    lines.push(`Signed-in user: ${user.name || user.email} (role: ${user.role || 'employee'})`);
  }
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

async function executeTool(name, input, { user }) {
  if (name === 'create_incident') {
    if (!sn.isConfigured()) {
      return { ok: false, error: 'ServiceNow is not configured on the server.' };
    }
    try {
      const created = await sn.createTicket('incidents', {
        shortDescription: input.shortDescription,
        description: input.description || '',
        priority: input.priority || 'Moderate',
        impact: 'Medium',
        urgency: 'Medium',
        category: input.category || 'software',
        requestedBy: user?.name || user?.email || '',
      }, input.instanceId);
      const inst = input.instanceId ? sn.listInstances().find((i) => i.id === input.instanceId) : null;
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
  return { ok: false, error: `Unknown tool: ${name}` };
}

export async function askClaude({ text, history, context }) {
  if (!client) throw new Error('Claude not configured');

  const userContext = buildUserContext(context);
  const system = userContext
    ? `${SYSTEM_PROMPT}\n\nUser context (use only if relevant):\n${userContext}`
    : SYSTEM_PROMPT;

  const messages = [];
  for (const m of (history || []).slice(-8)) {
    messages.push({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    });
  }
  messages.push({ role: 'user', content: text });

  // Tool-use loop: keep going while Claude wants to call tools (bounded to 3 hops).
  for (let hop = 0; hop < 3; hop += 1) {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      tools: TOOLS,
      messages,
    });

    if (response.stop_reason !== 'tool_use') {
      const reply = response.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
        .trim();
      if (!reply) throw new Error('Empty response from Claude');
      return reply;
    }

    // Execute every tool_use block in this response, then loop with tool_results.
    const toolUses = response.content.filter((c) => c.type === 'tool_use');
    const toolResults = [];
    for (const tu of toolUses) {
      const result = await executeTool(tu.name, tu.input || {}, { user: context.user });
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: JSON.stringify(result),
        ...(result.ok ? {} : { is_error: true }),
      });
    }
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });
  }

  throw new Error('Tool-use loop exceeded max hops');
}
