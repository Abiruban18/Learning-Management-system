"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.protect = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    try {
        const secret = process.env.JWT_SECRET;
        const decoded = jsonwebtoken_1.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.protect = protect;
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        res.status(403).json({ message: 'Access forbidden' });
        return;
    }
    next();
};
exports.requireRole = requireRole;
