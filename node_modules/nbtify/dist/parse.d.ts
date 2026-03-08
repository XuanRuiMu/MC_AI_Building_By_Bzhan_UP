import type { RootTag, RootTagLike } from "./tag.js";
/**
 * Converts an SNBT string into an NBT object.
*/
export declare function parse<T extends RootTagLike = RootTag>(data: string): T;
