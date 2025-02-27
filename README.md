<h1 align="center"><img width="250" src="https://jaredwray.com/images/keyc.svg" alt="keyc"></h1>

> A modern, TypeScript-first key-value storage with middleware, compression, and edge computing support

[![npm](https://img.shields.io/npm/dm/keyc.svg)](https://www.npmjs.com/package/keyc)
[![npm](https://img.shields.io/npm/v/keyc.svg)](https://www.npmjs.com/package/keyc)

# Keyc - Next Generation Key-Value Storage

Keyc provides a powerful, flexible interface for key-value storage across multiple backends. It extends the popular Keyv library with advanced features focused on TypeScript integration, middleware support, and performance optimization.

## Key Features

- **Strong TypeScript Integration** - Full type safety with generics for keys and values
- **Middleware Pipeline** - Transform, validate, or log operations with a flexible middleware system
- **Performance Optimizations** - Enhanced serialization, compression, and efficient memory usage
- **Atomic Operations** - Built-in support for operations like increment/decrement
- **Edge Computing Support** - Optimized for serverless and edge environments with Cloudflare KV support
- **Enhanced Event System** - Comprehensive event emission for reactive applications
- **Improved Batch Operations** - Efficient multi-key operations with type safety


## Basic Usage

```javascript
import Keyc from 'keyc';

// Create a type-safe instance
const cache = new Keyc<string>();

// Basic operations
await cache.set('user:1:name', 'John Doe');
const name = await cache.get('user:1:name');
console.log(name); // 'John Doe'

// With TTL (1 hour)
await cache.set('session:abc123', { userId: 42 }, 3600000);

// Delete keys
await cache.delete('user:1:name');

// Clear namespace
await cache.clear();
```

## Type-Safe Usage

Keyc is designed with TypeScript in mind, offering type safety at both the instance and method level:

```typescript
// Instance-level typing
const numberCache = new Keyc<number>();
await numberCache.set('count', 42); // ✅ Valid
await numberCache.set('count', 'hello'); // ❌ Type error!

// Method-level specificity
const cache = new Keyc();
await cache.set<string>('name', 'John'); // Explicitly typed as string
await cache.set<number>('age', 30);      // Explicitly typed as number

const name = await cache.get<string>('name'); // name is typed as string
const age = await cache.get<number>('age');   // age is typed as number
```

## Middleware System

Keyc introduces a powerful middleware system that allows you to intercept, transform, and monitor operations:

```typescript
import Keyc from 'keyc';
import { LoggerMiddleware } from 'keyc/middlewares/logger';

const cache = new Keyc();

// Add built-in logging middleware
cache.use(new LoggerMiddleware({
  logGet: true,
  logSet: true,
  logDelete: true
}));

// Create custom middleware
const validationMiddleware = {
  name: 'validation',
  preSet: (key, value) => {
    if (typeof value === 'string' && value.length > 100) {
      throw new Error('Value too long');
    }
    return { modifiedKey: key, modifiedValue: value };
  }
};

cache.use(validationMiddleware);

// Now all operations will go through the middleware pipeline
await cache.set('key', 'value'); // Logged and validated
```

## Compression

Keyc supports various compression strategies to reduce storage size:

```typescript
import Keyc from 'keyc';
import { MessagePackCompressor } from 'keyc/compressors/msgpack';

const cache = new Keyc({
  compressor: new MessagePackCompressor()
});

// Data will be automatically compressed when stored
// and decompressed when retrieved
await cache.set('object', { complex: 'data', with: ['arrays', 'and', 'more'] });
```

## Edge Computing Support

Keyc is optimized for edge environments like Cloudflare Workers:

```typescript
import Keyc from 'keyc';
import { CloudflareKVAdapter } from 'keyc/adapters/cloudflare-kv';

// In a Cloudflare Workers environment
export default {
  async fetch(request, env) {
    // Create Keyc instance with Cloudflare KV
    const cache = new Keyc({
      store: new CloudflareKVAdapter(env.MY_KV_NAMESPACE)
    });
    
    // Use cache operations in your request handler
    // ...
  }
};
```

## Atomic Operations

Keyc supports atomic operations like increment and decrement:

```typescript
// Initialize counter if needed
if (await cache.get('views') === undefined) {
  await cache.set('views', 0);
}

// Increment view count
const newViews = await cache.increment('views');
console.log(`This page has been viewed ${newViews} times`);

// Increment by custom amount
await cache.increment('points', 5);
```

## Batch Operations

Efficiently handle multiple keys at once:

```typescript
// Get multiple values
const [username, email, preferences] = await cache.getMany([
  'user:1:username',
  'user:1:email',
  'user:1:preferences'
]);

// Set multiple values
await cache.setMany([
  ['user:1:lastLogin', Date.now()],
  ['user:1:loginCount', 42],
  ['user:1:status', 'online']
], 86400000); // 24 hour TTL for all items
```

## Complete API Reference

### Constructor Options

```typescript
new Keyc<ValueType>(options?: {
  namespace?: string;       // Default: 'keyc'
  ttl?: number;             // Default: undefined (no expiration)
  store?: any;              // Default: new Map()
  serializer?: Function;    // Default: JSON.stringify
  deserializer?: Function;  // Default: JSON.parse
  compressor?: Compressor;  // Default: undefined (no compression)
  emitErrors?: boolean;     // Default: true
  middlewares?: Middleware[]; // Default: []
})
```

### Methods

- **`async get<T>(key: string, options?: GetOptions): Promise<T | undefined>`**  
  Retrieve a value by key. Options include `{ raw: boolean }` to get the internal item structure.

- **`async set<T>(key: string, value: T, ttl?: number): Promise<boolean>`**  
  Store a value with optional TTL in milliseconds.

- **`async delete(key: string): Promise<boolean>`**  
  Remove a key from storage.

- **`async clear(): Promise<void>`**  
  Clear all keys in the current namespace.

- **`async getMany<T>(keys: string[]): Promise<(T | undefined)[]>`**  
  Get multiple values at once.

- **`async setMany<T>(entries: [string, T][], ttl?: number): Promise<boolean>`**  
  Set multiple key-value pairs at once.

- **`async increment(key: string, delta?: number): Promise<number | false>`**  
  Atomically increment a numeric value.

- **`async *iterator(): AsyncIterableIterator<[string, any]>`**  
  Iterate through all keys in the namespace.

- **`async disconnect(): Promise<void>`**  
  Disconnect from the storage backend.

- **`use(middleware: Middleware): Keyc<ValueType>`**  
  Add middleware to the pipeline.

### Events

Keyc extends EventEmitter and emits these events:

- **`error`** - Emitted when an error occurs
- **`set`** - Emitted when a value is stored
- **`delete`** - Emitted when a key is deleted
- **`clear`** - Emitted when cache is cleared
- **`disconnect`** - Emitted on disconnection

### Creating Custom Middleware

```typescript
const customMiddleware = {
  name: 'custom',
  
  // Pre-hooks modify input before operation
  preGet: (key) => {
    return `modified:${key}`;
  },
  
  // Post-hooks modify output after operation
  postGet: (key, value) => {
    if (value === null) return 'default value';
    return value;
  },
  
  // Pre-set can modify both key and value
  preSet: (key, value) => {
    return {
      modifiedKey: key.toLowerCase(),
      modifiedValue: typeof value === 'string' ? value.trim() : value
    };
  }
  
  // ...other hooks available
};

cache.use(customMiddleware);
```

## Migration from Keyv

Keyc maintains compatibility with Keyv's core API while adding new features:

```typescript
// Keyv code
const keyv = new Keyv();
await keyv.set('foo', 'bar', 1000);
const value = await keyv.get('foo');

// Equivalent Keyc code
const keyc = new Keyc();
await keyc.set('foo', 'bar', 1000);
const value = await keyc.get('foo');
```

Additional Keyc features can be adopted incrementally as needed.

## License

MIT © Jared Wray