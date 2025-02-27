import Keyv from 'keyv';
import Keyc from '../src';

// Sample data size
const ITEM_COUNT = 10000;
const KEY_SIZE = 16; // characters
const VALUE_SIZE = 1024; // bytes

// Generate random data
function generateRandomString(length: number): string {
  return [...Array(length)].map(() => Math.random().toString(36)[2]).join('');
}

function generateTestData(count: number): Array<[string, string]> {
  return Array.from({ length: count }, (_, i) => {
    const key = generateRandomString(KEY_SIZE);
    const value = generateRandomString(VALUE_SIZE);
    return [key, value];
  });
}

async function runKeyvBenchmark(data: Array<[string, string]>) {
  console.log('\nRunning Keyv benchmark...');
  const keyv = new Keyv();
  
  // Measure set performance
  const setStart = Date.now();
  for (const [key, value] of data) {
    await keyv.set(key, value);
  }
  const setEnd = Date.now();
  
  // Measure get performance
  const getStart = Date.now();
  for (const [key] of data) {
    await keyv.get(key);
  }
  const getEnd = Date.now();
  
  // Measure delete performance
  const deleteStart = Date.now();
  for (const [key] of data) {
    await keyv.delete(key);
  }
  const deleteEnd = Date.now();
  
  console.log(`Keyv set ${ITEM_COUNT} items: ${setEnd - setStart}ms`);
  console.log(`Keyv get ${ITEM_COUNT} items: ${getEnd - getStart}ms`);
  console.log(`Keyv delete ${ITEM_COUNT} items: ${deleteEnd - deleteStart}ms`);
}

async function runKeycBenchmark(data: Array<[string, string]>) {
  console.log('\nRunning Keyc benchmark...');
  const keyc = new Keyc<string>();
  
  // Measure set performance
  const setStart = Date.now();
  for (const [key, value] of data) {
    await keyc.set(key, value);
  }
  const setEnd = Date.now();
  
  // Measure get performance
  const getStart = Date.now();
  for (const [key] of data) {
    await keyc.get(key);
  }
  const getEnd = Date.now();
  
  // Measure delete performance
  const deleteStart = Date.now();
  for (const [key] of data) {
    await keyc.delete(key);
  }
  const deleteEnd = Date.now();
  
  console.log(`Keyc set ${ITEM_COUNT} items: ${setEnd - setStart}ms`);
  console.log(`Keyc get ${ITEM_COUNT} items: ${getEnd - getStart}ms`);
  console.log(`Keyc delete ${ITEM_COUNT} items: ${deleteEnd - deleteStart}ms`);
}

async function runBenchmarks() {
  console.log(`Generating ${ITEM_COUNT} test items...`);
  const testData = generateTestData(ITEM_COUNT);
  
  await runKeyvBenchmark(testData);
  await runKeycBenchmark(testData);
  
  // Now test batch operations (only available in Keyc)
  console.log('\nTesting batch operations in Keyc...');
  const keyc = new Keyc<string>();
  
  const batchSetStart = Date.now();
  await keyc.setMany(testData);
  const batchSetEnd = Date.now();
  
  const batchGetStart = Date.now();
  await keyc.getMany(testData.map(([key]) => key));
  const batchGetEnd = Date.now();
  
  console.log(`Keyc batch set ${ITEM_COUNT} items: ${batchSetEnd - batchSetStart}ms`);
  console.log(`Keyc batch get ${ITEM_COUNT} items: ${batchGetEnd - batchGetStart}ms`);
}

runBenchmarks().catch(console.error); 