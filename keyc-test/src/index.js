const { runMemoryTests } = require('./memory-test.js');
const { runMiddlewareTests } = require('./middleware-test.js');
const { runBatchOperationsTests } = require('./batch-test.js');
const { runAtomicOperationsTests } = require('./atomic-test.js');
// Use dynamic imports for CommonJS modules
async function runAllTests() {
  console.log('=== KEYC TEST SUITE ===\n');
  
  try {
    console.log('📋 RUNNING MEMORY ADAPTER TESTS');
    await runMemoryTests();
    console.log('✅ Memory adapter tests passed\n');
    
     console.log('📋 RUNNING MIDDLEWARE TESTS');
     await runMiddlewareTests();  
     console.log('✅ Middleware tests passed\n');
    
    console.log('📋 RUNNING BATCH OPERATIONS TESTS');
    await runBatchOperationsTests();
    console.log('✅ Batch operations tests passed\n');
    
    console.log('📋 RUNNING ATOMIC OPERATIONS TESTS');
    await runAtomicOperationsTests();
    console.log('✅ Atomic operations tests passed\n');
    
    console.log('🎉 ALL TESTS PASSED!');
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    process.exit(1);
  }
}

runAllTests().catch(console.error);