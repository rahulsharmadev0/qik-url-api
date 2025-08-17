import { testResults } from './controller.test.js';

console.log('\n🧪 Test Suite Results:');
console.log('===================');
console.log(`Total Tests: ${testResults.totalTests}`);
console.log(`Passed: ${testResults.passedTests}`);
console.log(`Failed: ${testResults.failedTests}`);
console.log(`Status: ${testResults.utilityTests}`);

if (testResults.failedTests === 0) {
    console.log('✅ All tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some tests failed!');
    process.exit(1);
}
