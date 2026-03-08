import { Int8, Int16, Int32, Float32 } from "./primitive.js";
export var TAG;
(function (TAG) {
    TAG[TAG["END"] = 0] = "END";
    TAG[TAG["BYTE"] = 1] = "BYTE";
    TAG[TAG["SHORT"] = 2] = "SHORT";
    TAG[TAG["INT"] = 3] = "INT";
    TAG[TAG["LONG"] = 4] = "LONG";
    TAG[TAG["FLOAT"] = 5] = "FLOAT";
    TAG[TAG["DOUBLE"] = 6] = "DOUBLE";
    TAG[TAG["BYTE_ARRAY"] = 7] = "BYTE_ARRAY";
    TAG[TAG["STRING"] = 8] = "STRING";
    TAG[TAG["LIST"] = 9] = "LIST";
    TAG[TAG["COMPOUND"] = 10] = "COMPOUND";
    TAG[TAG["INT_ARRAY"] = 11] = "INT_ARRAY";
    TAG[TAG["LONG_ARRAY"] = 12] = "LONG_ARRAY";
})(TAG || (TAG = {}));
Object.freeze(TAG);
export const TAG_TYPE = Symbol("nbtify.tag.type");
export function isTag(value) {
    return getTagType(value) !== null;
}
export function isTagType(type) {
    return typeof type === "number" && type in TAG;
}
export function getTagType(value) {
    switch (true) {
        case value instanceof Int8:
        case typeof value === "boolean": return TAG.BYTE;
        case value instanceof Int16: return TAG.SHORT;
        case value instanceof Int32: return TAG.INT;
        case typeof value === "bigint": return TAG.LONG;
        case value instanceof Float32: return TAG.FLOAT;
        case typeof value === "number": return TAG.DOUBLE;
        case value instanceof Int8Array:
        case value instanceof Uint8Array: return TAG.BYTE_ARRAY;
        case typeof value === "string": return TAG.STRING;
        case value instanceof Array: return TAG.LIST;
        case value instanceof Int32Array:
        case value instanceof Uint32Array: return TAG.INT_ARRAY;
        case value instanceof BigInt64Array:
        case value instanceof BigUint64Array: return TAG.LONG_ARRAY;
        case typeof value === "object" && value !== null: return TAG.COMPOUND;
        default: return null;
    }
}
//# sourceMappingURL=tag.js.map