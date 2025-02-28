const keycModule = require('../../dist/index.js');
const Keyc = keycModule.default || keycModule;

async function runMemoryTests() {
  console.log('Keyc constructor type:', typeof Keyc);
  
  const cache = new Keyc();
  
  // Test basic set/get
  await cache.set('test', 'value');
  const result = await cache.get('test');
  if (result !== 'value') {
    throw new Error(`Expected 'value', got ${result}`);
  }
  
  console.log('  ✓ Basic set/get operations');
  
  // Test TTL expiration
  await cache.set('expiring', 'temp', 50); // 50ms TTL
  await new Promise(resolve => setTimeout(resolve, 60));
  const expired = await cache.get('expiring');
  if (expired !== undefined) {
    throw new Error('TTL expiration failed');
  }
  
  console.log('  ✓ TTL expiration');
}

module.exports = { runMemoryTests }; 