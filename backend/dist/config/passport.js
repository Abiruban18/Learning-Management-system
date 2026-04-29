"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const User_1 = __importDefault(require("../models/User"));
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email)
                return done(new Error('No email from Google'), undefined);
            let user = await User_1.default.findOne({ email });
            if (!user) {
                user = await User_1.default.create({
                    name: profile.displayName,
                    email,
                    password: Math.random().toString(36).slice(-12) + 'Aa1!',
                    role: 'student',
                    avatar: profile.photos?.[0]?.value,
                });
            }
            return done(null, user);
        }
        catch (err) {
            return done(err, undefined);
        }
    }));
}
exports.default = passport_1.default;
