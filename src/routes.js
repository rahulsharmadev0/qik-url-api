import express from 'express';
import { createQikUrl, deleteQikUrl, getQikUrl as redirectToLongUrl, getHealth } from './controller.js';
import { 
    validateCreateRequest, 
    validateQikCode, 
    validateDeletionCode 
} from './middlewares/validation.js';
import { rateLimiter } from './middlewares/errorHandler.js';

const router = express.Router();

// Health check endpoint
router.get('/health', getHealth);

// Create short URL with validation and rate limiting
router.post('/create', rateLimiter, validateCreateRequest, createQikUrl);

// Redirect to original URL with validation
router.get('/:qik_code', validateQikCode, redirectToLongUrl);

// Delete short URL with validation
router.delete('/delete/:deletion_code', validateDeletionCode, deleteQikUrl);

export default router;