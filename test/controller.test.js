import { strict as assert } from 'assert';
import { isValidUrl, tokenFromDeletionToken } from '../src/utils.js';

describe('Controller utility functions', () => {
    test('URL validation works correctly', () => {
        expect(isValidUrl('https://example.com')).toBe(true);
        expect(isValidUrl('http://example.com')).toBe(true);
        expect(isValidUrl('ftp://example.com')).toBe(false);
        expect(isValidUrl('not-a-url')).toBe(false);
        expect(isValidUrl('')).toBe(false);
    });

    test('token generation from deletion token', () => {
        const testToken = 'abcdef123456789012345678';
        const shortCode = tokenFromDeletionToken(testToken);
        expect(shortCode.length).toBeLessThanOrEqual(12);
        expect(shortCode.length).toBeGreaterThan(0);
    });

    test('short code generation', () => {
        const generatedCode = generateShortCode();
        expect(generatedCode).toHaveLength(8);
        expect(/^[A-Za-z0-9]+$/.test(generatedCode)).toBe(true);

        const customLengthCode = generateShortCode(12);
        expect(customLengthCode).toHaveLength(12);
    });
});

function generateShortCode(length = 8) { // kept for tests / potential future use
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}