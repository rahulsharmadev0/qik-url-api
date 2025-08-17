// ---- General helpers ----
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

export function tokenFromDeletionToken(token) {
    return token.split('').filter((_, i) => i % 2 === 0).slice(0, 12).join('');
}

export function isValidUrl(str) {
    try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

export function normalizeExpiry(expires_at) {
    const now = Date.now();
    if (expires_at) {
        const d = new Date(expires_at);
        if (!isNaN(d) && (d.getTime() - now) > 0 && (d.getTime() - now) <= ONE_YEAR_MS) return d;
    }
    return new Date(now + ONE_YEAR_MS);
}

// Express async wrapper to avoid try/catch in every controller
export const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Lightweight HTTP error helper
export function httpError(status, message) {
    const e = new Error(message);
    e.status = status;
    return e;
}

