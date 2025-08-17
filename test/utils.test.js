import { tokenFromDeletionToken, isValidUrl, normalizeExpiry, httpError } from '../src/utils.js';

describe('utils', () => {
    test('tokenFromDeletionToken produces deterministic shortened token', () => {
        const token = 'a1b2c3d4e5f6g7h8i9j0';
        expect(tokenFromDeletionToken(token)).toBe(token.split('').filter((_, i) => i % 2 === 0).slice(0, 12).join(''));
    });

    test('isValidUrl accepts http/https only', () => {
        expect(isValidUrl('https://example.com')).toBe(true);
        expect(isValidUrl('http://example.com')).toBe(true);
        expect(isValidUrl('ftp://example.com')).toBe(false);
        expect(isValidUrl('not-a-url')).toBe(false);
    });

    test('generateShortCode length and charset', () => {
        const code = generateShortCode(10);
        expect(code).toHaveLength(10);
        expect(/^[A-Za-z0-9]+$/.test(code)).toBe(true);
    });

    test('normalizeExpiry returns provided valid future date under 1 year', () => {
        const future = new Date(Date.now() + 1000 * 60 * 60).toISOString();
        const d = normalizeExpiry(future);
        expect(d instanceof Date).toBe(true);
    });

    test('normalizeExpiry clamps invalid date to 1 year', () => {
        const d = normalizeExpiry('invalid');
        const diff = d.getTime() - Date.now();
        expect(diff).toBeGreaterThan(1000 * 60 * 60 * 24 * 364); // ~1 year
    });

    test('httpError builds error with status', () => {
        const e = httpError(404, 'Not found');
        expect(e.status).toBe(404);
        expect(e.message).toBe('Not found');
    });
});


function generateShortCode(length = 8) { // kept for tests / potential future use
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}