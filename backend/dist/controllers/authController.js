"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleCallback = exports.getMe = exports.logout = exports.refreshAccessToken = exports.login = exports.register = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
function signAccess(id, role, name) {
    return jsonwebtoken_1.sign({ id, role, name }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
}
async function createRefreshToken(userId) {
    const token = crypto_1.default.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES);
    await RefreshToken_1.default.create({ user: userId, token, expiresAt });
    return token;
}
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!['student', 'teacher'].includes(role)) {
            res.status(400).json({ message: 'Role must be student or teacher' });
            return;
        }
        const exists = await User_1.default.findOne({ email });
        if (exists) {
            res.status(409).json({ message: 'Email already in use' });
            return;
        }
        const user = await User_1.default.create({ name, email, password, role });
        const accessToken = signAccess(String(user._id), user.role, user.name);
        const refreshToken = await createRefreshToken(String(user._id));
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', maxAge: REFRESH_EXPIRES,
        });
        res.status(201).json({ token: accessToken, user });
    }
    catch (err) {
        res.status(500).json({ message: 'Registration failed', error: err });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const accessToken = signAccess(String(user._id), user.role, user.name);
        const refreshToken = await createRefreshToken(String(user._id));
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', maxAge: REFRESH_EXPIRES,
        });
        res.json({ token: accessToken, user });
    }
    catch (err) {
        res.status(500).json({ message: 'Login failed', error: err });
    }
};
exports.login = login;
const refreshAccessToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            res.status(401).json({ message: 'No refresh token' });
            return;
        }
        const stored = await RefreshToken_1.default.findOne({ token }).populate('user');
        if (!stored || stored.expiresAt < new Date()) {
            res.status(401).json({ message: 'Refresh token expired or invalid' });
            return;
        }
        // Rotate: delete old, issue new
        await RefreshToken_1.default.deleteOne({ _id: stored._id });
        const newRefresh = await createRefreshToken(String(stored.user._id));
        const newAccess = signAccess(String(stored.user._id), stored.user.role, stored.user.name);
        res.cookie('refreshToken', newRefresh, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', maxAge: REFRESH_EXPIRES,
        });
        res.json({ token: newAccess, user: stored.user });
    }
    catch (err) {
        res.status(500).json({ message: 'Token refresh failed', error: err });
    }
};
exports.refreshAccessToken = refreshAccessToken;
const logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token)
            await RefreshToken_1.default.deleteOne({ token });
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out' });
    }
    catch (err) {
        res.status(500).json({ message: 'Logout failed', error: err });
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    const user = await User_1.default.findById(req.user.id);
    res.json({ user });
};
exports.getMe = getMe;
/** Google OAuth callback — issues tokens same as login */
const googleCallback = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth`);
            return;
        }
        const accessToken = signAccess(String(user._id), user.role, user.name);
        const refreshToken = await createRefreshToken(String(user._id));
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', maxAge: REFRESH_EXPIRES,
        });
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
    }
    catch (err) {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth`);
    }
};
exports.googleCallback = googleCallback;
