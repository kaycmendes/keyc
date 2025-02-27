export interface Compressor {
  compress(data: any): Promise<any> | any;
  decompress(data: any): Promise<any> | any;
} 