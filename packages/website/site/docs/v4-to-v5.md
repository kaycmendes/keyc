# Migration Guide: v4 to v5

## Breaking Changes

- **Explicit File Extensions:**  
  All relative imports now require explicit file extensions (e.g., `./types.js`).

- **Package Rename:**  
  The package formerly known as `@keyv` is now renamed to `@keyc/core`.

- **Middleware Parameter Typing:**  
  Middleware functions now require explicit type annotations.

- **TTL Handling:**  
  Expiry properties now support an explicit `number | null` type.

## Upgrade Examples

- **Importing the Core Module:**

  ```typescript
  import { Keyc } from '@keyc/core';
  ```

- **Using Middleware:**

  ```typescript
  import { commonMiddleware } from '@keyc/core';

  const validateMiddleware = commonMiddleware.validate((value: string) => value === 'expected');
  ```

## New Features

- **Batch Operations:**  
  New methods like `getMany` and `setMany` have been added to adapters.

- **New Adapters:**  
  The SQLite and Cloudflare KV adapters are now available as separate packages.

- **Enhanced Test Coverage:**  
  Comprehensive tests have been added for middleware, adapters, and TTL handling.

Please refer to the detailed README and inline documentation for further upgrade instructions. 