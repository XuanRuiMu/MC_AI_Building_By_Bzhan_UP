/**
 * Compresses a Uint8Array using a specific compression format.
*/
export declare function compress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array>;
/**
 * Decompresses a Uint8Array using a specific decompression format.
*/
export declare function decompress(data: Uint8Array, format: CompressionFormat): Promise<Uint8Array>;
