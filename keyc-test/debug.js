const keyc = require('../../dist/index.js');

console.log('Module type:', typeof keyc);
console.log('Module contents:', keyc);
console.log('Is keyc a constructor?', typeof keyc === 'function');

if (typeof keyc === 'object' && keyc.default) {
  console.log('Default export exists. Type:', typeof keyc.default);
  console.log('Is default export a constructor?', typeof keyc.default === 'function');
  
  // Try creating an instance from the default export
  try {
    const instance = new keyc.default();
    console.log('Successfully created instance from default export');
  } catch (err) {
    console.error('Error creating instance from default export:', err.message);
  }
} 