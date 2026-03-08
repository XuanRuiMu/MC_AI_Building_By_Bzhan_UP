import { NBTData } from "./format.js";
import type { RootName, Endian, Compression, BedrockLevel } from "./format.js";
import type { RootTag, RootTagLike } from "./tag.js";
export interface ReadOptions {
    rootName: boolean | RootName;
    endian: Endian;
    compression: Compression;
    bedrockLevel: BedrockLevel;
    strict: boolean;
}
/**
 * Converts an NBT buffer into an NBT object. Accepts an endian type, compression format, and file headers to read the data with.
 *
 * If a format option isn't specified, the function will attempt reading the data using all options until it either throws or returns successfully.
*/
export declare function read<T extends RootTagLike = RootTag>(data: Uint8Array | ArrayBufferLike | Blob, options?: Partial<ReadOptions>): Promise<NBTData<T>>;
