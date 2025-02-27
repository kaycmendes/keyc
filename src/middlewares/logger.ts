import { Middleware } from '../middleware';

/**
 * Logger middleware for Keyc
 * Provides logging capabilities for key operations
 */
export class LoggerMiddleware implements Middleware {
  name = 'logger';
  
  constructor(private options: LoggerOptions = {}) {}
  
  async preGet(key: string): Promise<string> {
    if (this.options.logGet) {
      console.log(`[Keyc] Getting key: ${key}`);
    }
    return key;
  }
  
  async postGet(key: string, value: any): Promise<any> {
    if (this.options.logGet) {
      console.log(`[Keyc] Got value for key: ${key}`);
    }
    return value;
  }
  
  async preSet(key: string, value: any): Promise<{modifiedKey: string, modifiedValue: any}> {
    if (this.options.logSet) {
      console.log(`[Keyc] Setting key: ${key}`);
    }
    return { modifiedKey: key, modifiedValue: value };
  }
  
  async postSet(key: string, value: any): Promise<void> {
    if (this.options.logSet) {
      console.log(`[Keyc] Set value for key: ${key}`);
    }
  }
  
  async preDelete(key: string): Promise<string> {
    if (this.options.logDelete) {
      console.log(`[Keyc] Deleting key: ${key}`);
    }
    return key;
  }
  
  async postDelete(key: string, result: boolean): Promise<void> {
    if (this.options.logDelete) {
      console.log(`[Keyc] Deleted key: ${key}, success: ${result}`);
    }
  }
}

interface LoggerOptions {
  logGet?: boolean;
  logSet?: boolean;
  logDelete?: boolean;
}

export default LoggerMiddleware; 