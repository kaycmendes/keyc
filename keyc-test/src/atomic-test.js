const keycModule = require('../../dist/index.js');
const Keyc = keycModule.default || keycModule;

async function runAtomicOperationsTests() {
  console.log('Keyc constructor type:', typeof Keyc);
  
  // Create Keyc instance
  const cache = new Keyc();
  
  // Test increment on non-existent key
  const initialIncrement = await cache.increment('counter');
  if (initialIncrement !== 1) {
    throw new Error(`Expected initial increment to be 1, got ${initialIncrement}`);
  }
  
  console.log('  ✓ Increment on non-existent key works');
  
  // Test increment on existing key
  const secondIncrement = await cache.increment('counter');
  if (secondIncrement !== 2) {
    throw new Error(`Expected second increment to be 2, got ${secondIncrement}`);
  }
  
  console.log('  ✓ Increment on existing key works');
  
  // Test increment with custom delta
  const customIncrement = await cache.increment('counter', 5);
  if (customIncrement !== 7) {
    throw new Error(`Expected custom increment to be 7, got ${customIncrement}`);
  }
  
  console.log('  ✓ Increment with custom delta works');
  
  // Test increment on non-numeric value
  await cache.set('string', 'not a number');
  
  // Handle error events by creating a new instance with error handling
  const cacheWithErrorHandler = new Keyc();
  let errorWasEmitted = false;
  
  // Set up error handler
  cacheWithErrorHandler.on('error', (err) => {
    // Verify it's the expected error
    if (err.message.includes('Cannot increment non-numeric')) {
      errorWasEmitted = true;
    }
  });
  
  await cacheWithErrorHandler.set('string', 'not a number');
  const invalidIncrement = await cacheWithErrorHandler.increment('string');
  
  if (invalidIncrement !== false) {
    throw new Error(`Expected increment on non-numeric value to return false`);
  }
  
  if (!errorWasEmitted) {
    throw new Error(`Expected an error to be emitted for non-numeric increment`);
  }
  
  console.log('  ✓ Increment on non-numeric value fails correctly with error event');
}

module.exports = { runAtomicOperationsTests }; 