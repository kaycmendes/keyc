const keycModule = require('../../dist/index.js');
const Keyc = keycModule.default || keycModule;

async function runMiddlewareTests() {
  console.log('Keyc constructor type:', typeof Keyc);
  
  // Create Keyc instance
  const cache = new Keyc();
  
  // Add a simple middleware that transforms keys to uppercase
  cache.use({
    name: 'uppercase-key',
    preGet: (key) => key.toUpperCase(),
    preSet: (key, value) => ({ modifiedKey: key.toUpperCase(), modifiedValue: value }),
    preDelete: (key) => key.toUpperCase()
  });
  
  // Test middleware with set/get
  await cache.set('test', 'middleware value');
  const result = await cache.get('test');
  
  if (result !== 'middleware value') {
    throw new Error(`Expected 'middleware value', got ${result}`);
  }
  
  console.log('  ✓ Basic middleware works');
  
  // Test middleware with uppercase key
  const uppercaseResult = await cache.get('TEST');
  if (uppercaseResult !== 'middleware value') {
    throw new Error(`Middleware transformation failed: Expected 'middleware value', got ${uppercaseResult}`);
  }
  
  console.log('  ✓ Key transformation works');
  
  // Test middleware with delete
  await cache.delete('test');
  const deletedResult = await cache.get('TEST');
  if (deletedResult !== undefined) {
    throw new Error('Middleware delete transformation failed');
  }
  
  console.log('  ✓ Delete transformation works');
}

module.exports = { runMiddlewareTests }; 