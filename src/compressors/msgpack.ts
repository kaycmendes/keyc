import { Compressor } from './base';
import * as msgpack from 'msgpackr';

export class MessagePackCompressor implements Compressor {
  private encoder: any;
  
  constructor(options: Record<string, any> = {}) {
    // Use a type assertion to avoid TypeScript errors
    this.encoder = new msgpack.Encoder(options as any);
  }
  
  async compress(data: any): Promise<Buffer> {
    return this.encoder.encode(data);
  }
  
  async decompress(data: Buffer): Promise<any> {
    return msgpack.decode(data);
  }
}

export default MessagePackCompressor;