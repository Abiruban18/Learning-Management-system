import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { connectDB } from './config/db';
import routes from './routes/index';
import { initSocket } from './services/socketService';
import { runDeadlineReminders, runStreakRiskCheck } from './jobs/cronJobs';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(mongoSanitize());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: 'Too many requests, slow down.' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', routes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Socket.io ─────────────────────────────────────────────────────────────────
initSocket(httpServer);

// ── Cron Jobs ─────────────────────────────────────────────────────────────────
// Run deadline reminders every day at 8am
cron.schedule('0 8 * * *', runDeadlineReminders);
// Run streak risk check every day at 7pm
cron.schedule('0 19 * * *', runStreakRiskCheck);

// ── Start ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

export default app;
