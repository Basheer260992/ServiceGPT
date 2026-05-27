import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedData } from '../utils/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

export let db;

const defaultData = {
  users: [],
  incidents: [],
  problems: [],
  changes: [],
  catalog: [],
  knowledge: [],
  notifications: [],
  chatMessages: [],
  // ServiceNow instances (admin-managed). Example shape:
  // [{ id: '1', name: 'CRISP - Security Incident', instance: 'dev352459', url: 'https://dev352459.service-now.com', username: 'admin' }]
  servicenowInstances: [
      { id: 'inst-2', name: 'CRISP - Security Incident', instance: 'dev352459', url: 'https://dev352459.service-now.com', username: 'admin' },
      { id: 'inst-3', name: 'NATAMA/CAPTURE - NBN Incident', instance: 'dev208811', url: 'https://dev208811.service-now.com', username: 'admin' },
      { id: 'inst-4', name: 'MyServices - Request Item', instance: 'dev305710', url: 'https://dev305710.service-now.com', username: 'admin' },
      { id: 'inst-5', name: 'AskUs - HR Request', instance: 'dev392710', url: 'https://dev392710.service-now.com', username: 'admin' },
      { id: 'inst-1', name: 'ITAM Request - Internal incident', instance: process.env.SERVICENOW_INSTANCE || 'dev386084', url: process.env.SERVICENOW_URL || `https://${process.env.SERVICENOW_INSTANCE || 'dev386084'}.service-now.com`, username: process.env.SERVICENOW_USERNAME || 'admin' },
    ],
};

export async function initStorage() {
  db = await JSONFilePreset(DB_FILE, defaultData);
  await db.read();
  db.data = db.data || {};
  if (!Array.isArray(db.data.chatMessages)) db.data.chatMessages = [];
  if (!Array.isArray(db.data.servicenowInstances)) db.data.servicenowInstances = defaultData.servicenowInstances;
  if (!db.data.users || db.data.users.length === 0) {
    Object.assign(db.data, await seedData());
    await db.write();
    console.log('  Seeded initial data');
  }
  return db;
}

export async function persist() {
  await db.write();
}
