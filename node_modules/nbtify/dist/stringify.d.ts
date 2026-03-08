import { NBTData } from "./format.js";
import type { RootTag, RootTagLike } from "./tag.js";
export interface StringifyOptions {
    space?: string | number;
}
/**
 * Converts an NBT object into an SNBT string.
*/
export declare function stringify<T extends RootTagLike = RootTag>(data: T | NBTData<T>, options?: StringifyOptions): string;
