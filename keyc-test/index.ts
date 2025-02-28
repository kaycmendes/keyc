import { runMemoryTests } from '../src/tests/memory-test';
import { runMiddlewareTests } from '../src/tests/middleware-test';
import { runCompressionTests } from '../src/tests/compression-test';
import { runSQLiteTests } from '../src/tests/sqlite-test';
import { runBatchOperationsTests } from '../src/tests/batch-test';
import { runAtomicOperationsTests } from '../src/tests/atomic-test';

async function runAllTests() {
  console.log('=== KEYC TEST SUITE ===\n');
  
  try {
    console.log('📋 RUNNING MEMORY ADAPTER TESTS');
    await runMemoryTests();
    console.log('✅ Memory adapter tests passed\n');
    
    console.log('📋 RUNNING MIDDLEWARE TESTS');
    await runMiddlewareTests();
    console.log('✅ Middleware tests passed\n');
    
    console.log('📋 RUNNING COMPRESSION TESTS');
    await runCompressionTests();
    console.log('✅ Compression tests passed\n');
    
    console.log('📋 RUNNING SQLITE ADAPTER TESTS');
    await runSQLiteTests();
    console.log('✅ SQLite adapter tests passed\n');
    
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