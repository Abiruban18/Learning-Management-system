"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const SiteSettings_1 = __importDefault(require("../models/SiteSettings"));
const getSettings = async (_req, res) => {
    try {
        let settings = await SiteSettings_1.default.findOne();
        if (!settings)
            settings = await SiteSettings_1.default.create({});
        res.json({ settings });
    }
    catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        let settings = await SiteSettings_1.default.findOne();
        if (!settings) {
            settings = await SiteSettings_1.default.create({ ...req.body, updatedBy: req.user.name });
        }
        else {
            Object.assign(settings, req.body);
            settings.updatedBy = req.user.name;
            await settings.save();
        }
        res.json({ settings });
    }
    catch (err) {
        res.status(500).json({ message: 'Update failed', error: err });
    }
};
exports.updateSettings = updateSettings;
