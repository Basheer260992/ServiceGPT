import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { initStorage } from './src/config/storage.js';
import authRoutes from './src/routes/auth.routes.js';
import incidentRoutes from './src/routes/incident.routes.js';
import problemRoutes from './src/routes/problem.routes.js';
import changeRoutes from './src/routes/change.routes.js';
import catalogRoutes from './src/routes/catalog.routes.js';
import knowledgeRoutes from './src/routes/knowledge.routes.js';
import statsRoutes from './src/routes/stats.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';
import chatRoutes from './src/routes/chat.routes.js';
import userRoutes from './src/routes/user.routes.js';
import servicenowRoutes from './src/routes/servicenow.routes.js';
import { errorHandler, notFound } from './src/middleware/error.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ServiceGPT API', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/changes', changeRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/servicenow', servicenowRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await initStorage();
  app.listen(PORT, () => {
    console.log(`\n  ServiceGPT API listening on http://localhost:${PORT}`);
    console.log(`  Storage: ${process.env.STORAGE || 'json'}`);
    console.log(`  Data source: ${process.env.DATA_SOURCE || 'json'}${process.env.DATA_SOURCE === 'servicenow' ? ` (${process.env.SERVICENOW_INSTANCE})` : ''}\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
