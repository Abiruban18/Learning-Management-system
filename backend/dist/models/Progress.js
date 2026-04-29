"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseProgress = exports.QuizAttempt = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const QuizAttemptSchema = new mongoose_1.Schema({
    student: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    course: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course', required: true },
    answers: [{ type: Number }],
    score: { type: Number, required: true },
    xpEarned: { type: Number, default: 0 },
    timeTakenSeconds: { type: Number },
    passed: { type: Boolean, default: false },
    attemptedAt: { type: Date, default: Date.now },
});
exports.QuizAttempt = mongoose_1.default.model('QuizAttempt', QuizAttemptSchema);
const TaskProgressSchema = new mongoose_1.Schema({
    moduleTitle: { type: String, required: true },
    materialTitle: { type: String, required: true },
    completedAt: { type: Date },
    isDone: { type: Boolean, default: false },
});
const CourseProgressSchema = new mongoose_1.Schema({
    student: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course', required: true },
    tasks: [TaskProgressSchema],
    totalXp: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now },
}, { timestamps: true });
CourseProgressSchema.index({ student: 1, course: 1 }, { unique: true });
exports.CourseProgress = mongoose_1.default.model('CourseProgress', CourseProgressSchema);
