import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const now = () => new Date().toISOString();

export async function seedData() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);
  const supportHash = await bcrypt.hash('support123', 10);
  const guestHash = await bcrypt.hash('guest', 10);

  const users = [
    {
      id: nanoid(),
      name: 'System Admin',
      email: 'admin@servicegpt.io',
      password: adminHash,
      role: 'admin',
      department: 'IT Operations',
      avatar: 'SA',
      createdAt: now(),
    },
    {
      id: nanoid(),
      name: 'Sameera Tamboli',
      email: 'sameera@servicegpt.io',
      password: supportHash,
      role: 'support',
      department: 'IT Support',
      avatar: 'ST',
      createdAt: now(),
    },
    {
      id: nanoid(),
      name: 'Anita Juliet Nazareth',
      email: 'anita@servicegpt.io',
      password: userHash,
      role: 'employee',
      department: 'Engineering',
      avatar: 'AN',
      createdAt: now(),
    },
    {
      id: 'guest-user',
      name: 'Guest User',
      email: 'guest@servicegpt.io',
      password: guestHash,
      role: 'guest',
      department: 'General',
      avatar: 'GU',
      createdAt: now(),
    },
  ];

  const groups = ['Network Team', 'Database Team', 'Application Support', 'Hardware Team', 'Security Team'];
  const categories = ['Hardware', 'Software', 'Network', 'Database', 'Email', 'Access', 'Security'];
  const priorities = ['Critical', 'High', 'Moderate', 'Low'];
  const states = ['New', 'In Progress', 'On Hold', 'Resolved', 'Closed'];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const makeIncident = (i) => ({
    id: nanoid(),
    number: `INC${String(1001 + i).padStart(7, '0')}`,
    shortDescription: [
      'Email not syncing on Outlook',
      'VPN connection drops every 10 minutes',
      'Printer offline in 3rd floor',
      'Slow response on CRM portal',
      'Unable to access shared drive',
      'Password reset request',
      'Laptop battery not charging',
      'Database timeout on reporting',
    ][i % 8],
    description: 'Detailed description of the issue with reproduction steps and affected systems.',
    priority: pick(priorities),
    category: pick(categories),
    assignmentGroup: pick(groups),
    state: pick(states),
    impact: pick(['High', 'Medium', 'Low']),
    urgency: pick(['High', 'Medium', 'Low']),
    requestedBy: users[2].name,
    assignedTo: users[1].name,
    attachments: [],
    sla: Math.floor(Math.random() * 100),
    createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
    updatedAt: now(),
  });

  const incidents = Array.from({ length: 8 }, (_, i) => makeIncident(i));

  const problems = Array.from({ length: 4 }, (_, i) => ({
    id: nanoid(),
    number: `PRB${String(2001 + i).padStart(7, '0')}`,
    shortDescription: [
      'Recurring VPN disconnections across region',
      'Database deadlocks on month-end batch',
      'Email server intermittent outages',
      'SSO login failures during peak hours',
    ][i],
    description: 'Root cause analysis pending. Multiple incidents linked.',
    priority: pick(priorities),
    category: pick(categories),
    assignmentGroup: pick(groups),
    state: pick(['New', 'Root Cause Analysis', 'Known Error', 'Resolved']),
    impact: pick(['High', 'Medium', 'Low']),
    urgency: pick(['High', 'Medium', 'Low']),
    requestedBy: users[1].name,
    assignedTo: users[0].name,
    relatedIncidents: [incidents[i].number],
    attachments: [],
    createdAt: new Date(Date.now() - i * 86400_000).toISOString(),
    updatedAt: now(),
  }));

  const changes = Array.from({ length: 5 }, (_, i) => ({
    id: nanoid(),
    number: `CHG${String(3001 + i).padStart(7, '0')}`,
    shortDescription: [
      'Upgrade production database to v15',
      'Deploy new firewall ruleset',
      'Patch Windows servers - May cycle',
      'Migrate email to Exchange Online',
      'Rotate SSL certificates',
    ][i],
    description: 'Standard change with rollback plan and CAB approval pending.',
    priority: pick(priorities),
    category: pick(categories),
    assignmentGroup: pick(groups),
    state: pick(['New', 'Assess', 'Approved', 'Implement', 'Closed']),
    impact: pick(['High', 'Medium', 'Low']),
    urgency: pick(['High', 'Medium', 'Low']),
    requestedBy: users[0].name,
    assignedTo: users[1].name,
    plannedStart: new Date(Date.now() + 86400_000).toISOString(),
    plannedEnd: new Date(Date.now() + 2 * 86400_000).toISOString(),
    riskLevel: pick(['Low', 'Moderate', 'High']),
    attachments: [],
    createdAt: new Date(Date.now() - i * 43200_000).toISOString(),
    updatedAt: now(),
  }));

  const catalog = [
    { id: nanoid(), name: 'Request New Laptop', category: 'Hardware', icon: 'Laptop', description: 'Order a new corporate laptop', sla: '5 business days' },
    { id: nanoid(), name: 'Software License', category: 'Software', icon: 'Package', description: 'Request a paid software license', sla: '2 business days' },
    { id: nanoid(), name: 'VPN Access', category: 'Network', icon: 'Shield', description: 'Get remote VPN connectivity', sla: '1 business day' },
    { id: nanoid(), name: 'Email Distribution List', category: 'Email', icon: 'Mail', description: 'Create or modify a distribution list', sla: '4 hours' },
    { id: nanoid(), name: 'Office 365 License', category: 'Software', icon: 'FileText', description: 'Provision a Microsoft 365 license', sla: '1 business day' },
    { id: nanoid(), name: 'Server Access', category: 'Access', icon: 'Server', description: 'Request elevated server access', sla: '3 business days' },
    { id: nanoid(), name: 'New User Onboarding', category: 'Access', icon: 'UserPlus', description: 'Full IT onboarding for a new hire', sla: '5 business days' },
    { id: nanoid(), name: 'Mobile Device', category: 'Hardware', icon: 'Smartphone', description: 'Corporate mobile device request', sla: '7 business days' },
  ];

  const knowledge = [
    {
      id: nanoid(),
      title: 'How to reset your Windows password',
      category: 'Access',
      summary: 'Step-by-step guide to reset your corporate Windows password using the self-service portal.',
      body: 'Open the self-service portal at https://reset.servicegpt.io, enter your email, complete MFA, and choose a new password meeting policy.',
      author: 'IT Support',
      views: 1245,
      updatedAt: now(),
    },
    {
      id: nanoid(),
      title: 'Connecting to VPN from macOS',
      category: 'Network',
      summary: 'Configure the corporate VPN profile on macOS Sonoma.',
      body: 'Download the .mobileconfig from the portal, double-click to install, authenticate with corporate SSO.',
      author: 'Network Team',
      views: 832,
      updatedAt: now(),
    },
    {
      id: nanoid(),
      title: 'Outlook keeps asking for password',
      category: 'Email',
      summary: 'Resolve repeated password prompts in Outlook desktop.',
      body: 'Clear cached credentials from Credential Manager, restart Outlook, sign in with SSO.',
      author: 'Application Support',
      views: 2114,
      updatedAt: now(),
    },
    {
      id: nanoid(),
      title: 'Best practices for SLA management',
      category: 'Process',
      summary: 'Internal guide to staying within SLA targets on P1/P2 incidents.',
      body: 'Acknowledge within 15 minutes, communicate every 30 minutes, escalate to tier 2 if not resolved within target.',
      author: 'IT Operations',
      views: 421,
      updatedAt: now(),
    },
  ];

  return {
    users,
    incidents,
    problems,
    changes,
    catalog,
    knowledge,
    notifications: [
      { id: nanoid(), userId: users[2].id, title: 'Welcome to ServiceGPT', message: 'Your portal is ready. Explore the catalog to get started.', type: 'info', read: false, createdAt: now() },
      { id: nanoid(), userId: users[2].id, title: 'Incident assigned', message: `${incidents[0].number} has been assigned to your group.`, type: 'warning', read: false, createdAt: now() },
    ],
    chatMessages: [],
  };
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const { initStorage } = await import('../config/storage.js');
  await initStorage();
  console.log('Seed complete.');
  process.exit(0);
}
