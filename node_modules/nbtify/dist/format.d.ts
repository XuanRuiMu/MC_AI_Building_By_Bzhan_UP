import type { RootTag, RootTagLike } from "./tag.js";
export type RootName = string | null;
export type Endian = "big" | "little" | "little-varint";
export type Compression = CompressionFormat | null;
export type BedrockLevel = boolean;
export interface Format {
    rootName: RootName;
    endian: Endian;
    compression: Compression;
    bedrockLevel: BedrockLevel;
}
export interface NBTDataOptions extends Partial<Format> {
}
/**
 * A container which maintains how a given NBT object is formatted.
*/
export declare class NBTData<T extends RootTagLike = RootTag> implements Format {
    #private;
    data: T;
    rootName: RootName;
    endian: Endian;
    compression: Compression;
    bedrockLevel: BedrockLevel;
    constructor(data: T | NBTData<T>, options?: NBTDataOptions);
    get byteOffset(): number | null;
    get [Symbol.toStringTag](): "NBTData";
}
