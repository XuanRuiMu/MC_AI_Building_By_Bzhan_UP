import { NBTData } from "./format.js";
import type { NBTDataOptions } from "./format.js";
import type { RootTag, RootTagLike } from "./tag.js";
/**
 * Converts an NBT object into an NBT buffer. Accepts an endian type, compression format, and file headers to write the data with.
 *
 * If a format option isn't specified, the value of the equivalent property on the NBTData object will be used.
*/
export declare function write<T extends RootTagLike = RootTag>(data: T | NBTData<T>, options?: NBTDataOptions): Promise<Uint8Array>;
