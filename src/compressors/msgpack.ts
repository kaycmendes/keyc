import { Compressor } from './base';
import msgpack from 'msgpackr';

export class MessagePackCompressor implements Compressor {
  private encoder: msgpack.Encoder;
  
  constructor(options: msgpack.EncoderOptions = {}) {
    this.encoder = new msgpack.Encoder(options);
  }
  
  compress(data: any): Buffer {
    return this.encoder.encode(data);
  }
  
  decompress(data: Buffer): any {
    return msgpack.decode(data);
  }
}

export default MessagePackCompressor; 