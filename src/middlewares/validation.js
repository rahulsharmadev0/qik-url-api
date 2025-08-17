import { isValidUrl, ONE_YEAR_MS } from '../utils.js';

const badReq = msg => ({ error: msg || 'Invalid request. Please provide a valid URL.' });

export function validateCreateRequest(req, res, next) {
    const { long_url, expires_at, single_use } = req.body;
    if (!long_url || !isValidUrl(long_url)) return res.status(400).json(badReq());
    if (expires_at) {
        const d = new Date(expires_at);
        if (isNaN(d)) return res.status(400).json({ error: 'Invalid expiry date format.'});
        if (d.getTime() - Date.now() > ONE_YEAR_MS) return res.status(400).json({ error: 'Expiry date cannot be more than 1 year from now.'});
    }
    if (single_use !== undefined && typeof single_use !== 'boolean') return res.status(400).json({ error: 'single_use must be a boolean value.'});
    next();
}

export function validateQikCode(req, res, next) {
    const { qik_code } = req.params;

    if (!qik_code) {
        console.warn('Missing qik_code in request params');
        return res.status(400).json(badReq('Short URL code is required.'));
    }
    
    // Check length constraints (treat invalid formats as not found to avoid leaking info)
    if (qik_code.length < 6 || qik_code.length > 12) {
        console.warn('Invalid qik_code length:', qik_code.length);
        return res.status(404).json({ error: 'Short URL not found or expired.' });
    }
    
    // Check for valid characters (alphanumeric only)
    if (!/^[a-zA-Z0-9]+$/.test(qik_code)) {
        console.warn('Invalid characters in qik_code:', qik_code);
        return res.status(404).json({ error: 'Short URL not found or expired.' });
    }
    
    next();
}

export function validateDeletionCode(req, res, next) {
    const { deletion_code } = req.params;
    return (!deletion_code || deletion_code.length < 20)
        ? res.status(401).json({ error: 'Unauthorized. Invalid deletion token.' })
        : next();
}
