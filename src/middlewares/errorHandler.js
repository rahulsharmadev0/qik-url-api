import { RedisService } from '../config/redis.js';

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
    const status = err.status || (['ENOTFOUND','ECONNREFUSED'].includes(err.code) ? 500 : 500);
    const map = {
        400: 'Invalid request. Please provide a valid URL.',
        401: 'Unauthorized. Invalid deletion token.',
        404: 'Short URL not found or expired.',
        410: 'This link has already been used.',
        429: 'Rate limit exceeded. Try again later.'
    };
    const message = err.message && map[status] !== err.message ? err.message : map[status] || 'Internal server error. Please try again later.';
    if (status >= 500) console.error('Unhandled error:', err);
    res.status(status).json({ error: message });
}

export async function rateLimiter(req, res, next) {
    try {
        const key = `rl:${req.ip}`;
        const requests = await RedisService.client.incr(key);
        if (requests === 1) await RedisService.client.expire(key, 60);
        if (requests > 100) return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
    } catch (e) {
        console.warn('Rate limiter degraded:', e.message);
    }
    next();
}

export function notFoundHandler(req, res) {
    res.status(404).json({
        error: "Endpoint not found."
    });
}
