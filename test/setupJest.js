// Global jest setup for ESM tests
import './setupEnv.js';

// Silence helmet contentSecurityPolicy warnings under test
process.env.NODE_ENV = 'test';
