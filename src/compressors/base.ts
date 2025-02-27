/**
 * Interface for compression adapters in Keyc
 * Enables different compression algorithms to be used with Keyc
 */
export interface Compressor {
  /**
   * Compress data before storage
   * @param data The data to compress
   * @returns Promise resolving to the compressed data
   */
  compress(data: any): Promise<any> | any;
  
  /**
   * Decompress data after retrieval
   * @param data The compressed data to decompress
   * @returns Promise resolving to the original data
   */
  decompress(data: any): Promise<any> | any;
} 