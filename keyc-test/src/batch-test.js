const keycModule = require('../../dist/index.js');
const Keyc = keycModule.default || keycModule;

async function runBatchOperationsTests() {
  console.log('Keyc constructor type:', typeof Keyc);
  
  // Create Keyc instance
  const cache = new Keyc();
  
  // Test data
  const items = [
    ['batch1', 'value1'],
    ['batch2', 'value2'],
    ['batch3', 'value3']
  ];
  
  // Test batch set
  const setResult = await cache.setMany(items);
  if (!setResult) {
    throw new Error('Batch set failed');
  }
  
  console.log('  ✓ Batch set works');
  
  // Test batch get
  const keys = items.map(([key]) => key);
  const values = await cache.getMany(keys);
  
  if (values.length !== items.length) {
    throw new Error(`Expected ${items.length} values, got ${values.length}`);
  }
  
  if (values[0] !== 'value1' || values[1] !== 'value2' || values[2] !== 'value3') {
    throw new Error('Batch get returned incorrect values');
  }
  
  console.log('  ✓ Batch get works');
  
  // Test batch get with missing keys
  const mixedKeys = ['batch1', 'nonexistent', 'batch3'];
  const mixedValues = await cache.getMany(mixedKeys);
  
  if (mixedValues[0] !== 'value1' || mixedValues[1] !== undefined || mixedValues[2] !== 'value3') {
    throw new Error('Batch get with missing keys returned incorrect values');
  }
  
  console.log('  ✓ Batch get with missing keys works');
}

module.exports = { runBatchOperationsTests }; 