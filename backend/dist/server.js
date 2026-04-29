"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("./config/db");
const index_1 = __importDefault(require("./routes/index"));
const socketService_1 = require("./services/socketService");
const cronJobs_1 = require("./jobs/cronJobs");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const PORT = process.env.PORT || 5000;
// ── Security Middleware ───────────────────────────────────────────────────────
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((0, express_mongo_sanitize_1.default)());
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 300, message: 'Too many requests, slow down.' }));
// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', index_1.default);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
// ── Socket.io ─────────────────────────────────────────────────────────────────
(0, socketService_1.initSocket)(httpServer);
// ── Cron Jobs ─────────────────────────────────────────────────────────────────
// Run deadline reminders every day at 8am
node_cron_1.default.schedule('0 8 * * *', cronJobs_1.runDeadlineReminders);
// Run streak risk check every day at 7pm
node_cron_1.default.schedule('0 19 * * *', cronJobs_1.runStreakRiskCheck);
// ── Start ─────────────────────────────────────────────────────────────────────
(0, db_1.connectDB)().then(() => {
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
exports.default = app;
