/**
 * Middleware interface for Keyc
 * Provides hooks for intercepting and modifying operations
 */
export interface Middleware {
  name: string;
  // Hook functions
  preGet?: (key: string) => Promise<string> | string;
  postGet?: (key: string, value: any) => Promise<any> | any;
  preSet?: (key: string, value: any) => Promise<{modifiedKey: string, modifiedValue: any}> | {modifiedKey: string, modifiedValue: any};
  postSet?: (key: string, value: any) => Promise<void> | void;
  preDelete?: (key: string) => Promise<string> | string;
  postDelete?: (key: string, result: boolean) => Promise<void> | void;
}

/**
 * Middleware pipeline implementation
 * Manages middleware execution order and flow
 */
export class MiddlewarePipeline {
  private middlewares: Middleware[] = [];
  
  add(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }
  
  async runPreGet(key: string): Promise<string> {
    let currentKey = key;
    
    for (const middleware of this.middlewares) {
      if (middleware.preGet) {
        currentKey = await middleware.preGet(currentKey);
      }
    }
    
    return currentKey;
  }
  
  async runPostGet(key: string, value: any): Promise<any> {
    let currentValue = value;
    
    // Run middlewares in reverse order for post hooks
    for (const middleware of [...this.middlewares].reverse()) {
      if (middleware.postGet) {
        currentValue = await middleware.postGet(key, currentValue);
      }
    }
    
    return currentValue;
  }
  
  async runPreSet(key: string, value: any): Promise<{modifiedKey: string, modifiedValue: any}> {
    let currentKey = key;
    let currentValue = value;
    
    for (const middleware of this.middlewares) {
      if (middleware.preSet) {
        const result = await middleware.preSet(currentKey, currentValue);
        currentKey = result.modifiedKey;
        currentValue = result.modifiedValue;
      }
    }
    
    return { modifiedKey: currentKey, modifiedValue: currentValue };
  }
  
  async runPostSet(key: string, value: any): Promise<void> {
    for (const middleware of [...this.middlewares].reverse()) {
      if (middleware.postSet) {
        await middleware.postSet(key, value);
      }
    }
  }
  
  async runPreDelete(key: string): Promise<string> {
    let currentKey = key;
    
    for (const middleware of this.middlewares) {
      if (middleware.preDelete) {
        currentKey = await middleware.preDelete(currentKey);
      }
    }
    
    return currentKey;
  }
  
  async runPostDelete(key: string, result: boolean): Promise<void> {
    for (const middleware of [...this.middlewares].reverse()) {
      if (middleware.postDelete) {
        await middleware.postDelete(key, result);
      }
    }
  }
} 