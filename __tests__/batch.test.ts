import Keyc from '../src';

describe('Keyc Batch Operations', () => {
  test('setMany and getMany', async () => {
    const cache = new Keyc<string>();
    
    // Test data
    const items: [string, string][] = [
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3']
    ];
    
    // Set multiple items
    const setResult = await cache.setMany(items);
    expect(setResult).toBe(true);
    
    // Get multiple items
    const values = await cache.getMany(['key1', 'key2', 'key3']);
    expect(values).toEqual(['value1', 'value2', 'value3']);
    
    // Get with missing keys
    const mixedValues = await cache.getMany(['key1', 'nonexistent', 'key3']);
    expect(mixedValues).toEqual(['value1', undefined, 'value3']);
  });
  
  test('batch operations with TTL', async () => {
    const cache = new Keyc<number>();
    
    // Set multiple items with short TTL
    await cache.setMany([
      ['expire1', 1],
      ['expire2', 2]
    ], 50); // 50ms TTL
    
    // Should be able to get them immediately
    const immediate = await cache.getMany(['expire1', 'expire2']);
    expect(immediate).toEqual([1, 2]);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 60));
    
    // Should be expired now
    const expired = await cache.getMany(['expire1', 'expire2']);
    expect(expired).toEqual([undefined, undefined]);
  });
}); 