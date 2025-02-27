import Keyc from '../src';
import { LoggerMiddleware } from '../src';

describe('Keyc', () => {
  test('basic get/set operations', async () => {
    const cache = new Keyc<string>();
    await cache.set('test', 'value');
    const result = await cache.get('test');
    expect(result).toBe('value');
  });

  test('middleware pipeline', async () => {
    const cache = new Keyc<string>();
    cache.use({
      name: 'transformer',
      preSet: (key, value) => ({ 
        modifiedKey: key.toUpperCase(), 
        modifiedValue: value 
      })
    });
    
    await cache.set('test', 'value');
    const result = await cache.get('TEST');
    expect(result).toBe('value');
  });
  
  test('TTL expiration', async () => {
    const cache = new Keyc<string>();
    await cache.set('expiring', 'value', 50); // 50ms TTL
    
    const immediate = await cache.get('expiring');
    expect(immediate).toBe('value');
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 60));
    
    const expired = await cache.get('expiring');
    expect(expired).toBeUndefined();
  });
});
