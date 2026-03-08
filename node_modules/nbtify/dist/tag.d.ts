import { Int8, Int16, Int32, Float32 } from "./primitive.js";
export type Tag = ByteTag | BooleanTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | ByteArrayTag | StringTag | ListTag<Tag> | CompoundTag | IntArrayTag | LongArrayTag;
export type RootTag = CompoundTag | ListTag<Tag>;
export type RootTagLike = CompoundTagLike | ListTagLike;
export type ByteTag<T extends number = number> = Int8<NumberLike<T>>;
export type BooleanTag = FalseTag | TrueTag;
export type FalseTag = false | ByteTag<0>;
export type TrueTag = true | ByteTag<1>;
export type ShortTag<T extends number = number> = Int16<NumberLike<T>>;
export type IntTag<T extends number = number> = Int32<NumberLike<T>>;
export type LongTag<T extends bigint = bigint> = T;
export type FloatTag<T extends number = number> = Float32<NumberLike<T>>;
export type DoubleTag<T extends number = number> = NumberLike<T>;
export type ByteArrayTag = Int8Array | Uint8Array;
export type StringTag<T extends string = string> = StringLike<T>;
export interface ListTag<T extends Tag | undefined> extends Array<T> {
    [TAG_TYPE]?: TAG;
}
export type ListTagLike = any[];
export interface CompoundTag {
    [name: string]: Tag | undefined;
}
export type CompoundTagLike = object;
export type IntArrayTag = Int32Array | Uint32Array;
export type LongArrayTag = BigInt64Array | BigUint64Array;
export type NumberLike<T extends number> = `${T}` extends `${infer N extends number}` ? N : never;
export type StringLike<T extends string> = `${T}`;
export declare enum TAG {
    END = 0,
    BYTE = 1,
    SHORT = 2,
    INT = 3,
    LONG = 4,
    FLOAT = 5,
    DOUBLE = 6,
    BYTE_ARRAY = 7,
    STRING = 8,
    LIST = 9,
    COMPOUND = 10,
    INT_ARRAY = 11,
    LONG_ARRAY = 12
}
export declare const TAG_TYPE: unique symbol;
export declare function isTag<T extends Tag>(value: unknown): value is T;
export declare function isTagType(type: unknown): type is TAG;
export declare function getTagType(value: Tag): TAG;
export declare function getTagType(value: unknown): TAG | null;
