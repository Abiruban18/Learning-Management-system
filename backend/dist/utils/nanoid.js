"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nanoid = nanoid;
/** Simple nanoid-like random string generator (no external dep) */
function nanoid(size = 21) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < size; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
