import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createQikUrl, deleteQikUrl, redirectToLongUrl, getHealth } from './controller.js';
import {
    validateCreateRequest,
    validateQikCode,
    validateDeletionCode
} from './middlewares/validation.js';
import { rateLimiter } from './middlewares/errorHandler.js';


// Serve home page on root route (before the wildcard)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Health check endpoint (most specific first)
router.get('/health', getHealth);

// Create short URL with validation and rate limiting
router.post('/create', rateLimiter, validateCreateRequest, createQikUrl);

// Delete short URL with validation (specific path)
router.delete('/delete/:deletion_code', validateDeletionCode, deleteQikUrl);


// root route serves static files from home directory after routes
router.use('/', express.static(path.join(__dirname, '..', 'static')));

// Redirect to original URL with validation (wildcard - must be last)
router.get('/:qik_code', validateQikCode, redirectToLongUrl);

export default router;