import { loadEnvConfig, getEnvInfo } from './src/config/env.js';

console.log('🧪 Testing Environment Configuration...\n');

// Test development
process.env.NODE_ENV = 'development';
console.log('📋 Testing Development Environment:');
loadEnvConfig();
console.log(getEnvInfo());

console.log('\n📋 Testing Production Environment:');
// Test production
process.env.NODE_ENV = 'production';
loadEnvConfig();
console.log(getEnvInfo());

console.log('\n✅ Environment configuration test completed!');
