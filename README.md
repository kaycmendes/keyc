 A modern, TypeScript-first key-value storage with middleware, compression, and edge computing support

[![npm version](https://img.shields.io/npm/v/keyc.svg)](https://www.npmjs.com/package/keyc)
[![npm downloads](https://img.shields.io/npm/dm/keyc.svg)](https://www.npmjs.com/package/keyc)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/keyc)](https://bundlephobia.com/package/keyc)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue)](https://www.typescriptlang.org/)
[![Node.js Version](https://img.shields.io/node/v/keyc.svg)](https://nodejs.org/en/)

# Keyc

A modern, TypeScript-first key-value storage library with middleware, compression, and edge computing support.

Keyc is inspired by [Keyv](https://github.com/jaredwray/keyv), redesigned to provide enhanced features, better performance, and improved TypeScript support.

## Features

- 🔒 **TypeScript First:** Full generic type support for values
- 🔌 **Middleware System:** Transform and validate data with a powerful middleware pipeline
- 🔄 **Atomic Operations:** Built-in support for increment/decrement operations
- 📦 **Efficient Storage:** Optimized adapters for in-memory, Redis, SQLite, and Cloudflare KV
- 🗜️ **Compression:** MessagePack support for smaller data footprint
- ⚡ **Edge Ready:** Optimized for both serverless and traditional environments
- 🚀 **Enhanced Performance:** Batch operations and optimized data access patterns

## Installation

```bash
npm install keyc
```

## Basic Usage

```typescript
import Keyc from 'keyc';

// Create a typed key-value store
const cache = new Keyc<string>();

// Store a value (with optional TTL in ms)
await cache.set('hello', 'world', 10000); // Expires in 10 seconds

// Retrieve a value
const value = await cache.get('hello');
console.log(value); // 'world'

// Delete a value
await cache.delete('hello');
```

## Type Safety

Keyc provides strong TypeScript support with generics:

```typescript
// Create a store that only accepts numbers
const numberStore = new Keyc<number>();

// This works fine
await numberStore.set('counter', 42);

// Method-level type support
const count = await numberStore.get<number>('counter');

// Error: Type 'string' is not assignable to type 'number'
await numberStore.set('name', 'John'); // ❌ TypeScript error
```

## Middleware System

Keyc includes a powerful middleware system for extending functionality:

```typescript
import Keyc, { LoggerMiddleware } from 'keyc';

const cache = new Keyc<string>();

// Add built-in logging middleware
cache.use(new LoggerMiddleware({ logGet: true, logSet: true }));

// Add custom transformation middleware
cache.use({
  name: 'uppercase',
  preSet: (key, value) => {
    // Convert all string values to uppercase before storage
    const modifiedValue = typeof value === 'string' ? value.toUpperCase() : value;
    return { modifiedKey: key, modifiedValue };
  }
});

await cache.set('name', 'john'); // Logs: [Keyc] Setting key: name
const value = await cache.get('name'); // Logs: [Keyc] Getting key: name
console.log(value); // 'JOHN'
```

## Storage Adapters

Keyc works with multiple storage backends:

### In-Memory (Default)

```typescript
// Uses Map by default
const cache = new Keyc();
```

### Redis

```typescript
import Keyc, { RedisAdapter } from 'keyc';
import { createClient } from 'redis';

const redisClient = createClient();
await redisClient.connect();

const redisAdapter = new RedisAdapter(redisClient);
const cache = new Keyc({ store: redisAdapter });
```

### SQLite

```typescript
import Keyc, { SQLiteAdapter } from 'keyc';

const sqliteAdapter = new SQLiteAdapter('./database.sqlite', {
  namespace: 'cache',
  cleanupInterval: 60000 // Clean expired keys every minute
});

const cache = new Keyc({ store: sqliteAdapter });
```

### Cloudflare KV (Edge Computing)

```typescript
import Keyc, { CloudflareKVAdapter } from 'keyc';

// In a Cloudflare Worker:
const kv = new CloudflareKVAdapter(NAMESPACE);
const cache = new Keyc({ store: kv });
```

## Compression

Keyc supports MessagePack compression to reduce storage size:

```typescript
import Keyc, { MessagePackCompressor } from 'keyc';

const cache = new Keyc({
  compressor: new MessagePackCompressor()
});

// Data is automatically compressed and decompressed
await cache.set('bigObject', { /* large object */ });
```

## Atomic Operations

Keyc provides atomic operations for better concurrency:

```typescript
const counter = new Keyc<number>();

// Initialize counter
await counter.set('visits', 0);

// Increment atomically
const newValue = await counter.increment('visits');
console.log(newValue); // 1

// Increment by custom amount
await counter.increment('visits', 5);
const visits = await counter.get('visits');
console.log(visits); // 6
```

## Batch Operations

Keyc efficiently handles multiple operations at once:

```typescript
const cache = new Keyc<string>();

// Set multiple values at once
await cache.setMany([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3']
]);

// Get multiple values at once
const values = await cache.getMany(['key1', 'key2', 'key3']);
console.log(values); // ['value1', 'value2', 'value3']
```

## Events

Keyc is an EventEmitter and emits events for various operations:

```typescript
const cache = new Keyc();

cache.on('error', err => console.error('Cache error:', err));
cache.on('set', (key, value) => console.log(`Cache set: ${key}`));
cache.on('delete', key => console.log(`Cache delete: ${key}`));
cache.on('clear', () => console.log('Cache cleared'));
```

## License

MIT