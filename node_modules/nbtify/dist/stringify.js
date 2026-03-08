import { NBTData } from "./format.js";
import { TAG, isTag, getTagType } from "./tag.js";
export function stringify(data, { space = "" } = {}) {
    if (data instanceof NBTData) {
        data = data.data;
    }
    if (typeof data !== "object" || data === null) {
        data;
        throw new TypeError("First parameter must be an object or array");
    }
    if (typeof space !== "string" && typeof space !== "number") {
        space;
        throw new TypeError("Space option must be a string or number");
    }
    space = typeof space === "number" ? " ".repeat(space) : space;
    const level = 1;
    return stringifyRoot(data, space, level);
}
function stringifyRoot(value, space, level) {
    const type = getTagType(value);
    if (type !== TAG.LIST && type !== TAG.COMPOUND) {
        throw new TypeError("Encountered unexpected Root tag type, must be either a List or Compound tag");
    }
    return stringifyTag(value, space, level);
}
function stringifyTag(value, space, level) {
    const type = getTagType(value);
    switch (type) {
        case TAG.BYTE: return stringifyByte(value);
        case TAG.SHORT: return stringifyShort(value);
        case TAG.INT: return stringifyInt(value);
        case TAG.LONG: return stringifyLong(value);
        case TAG.FLOAT: return stringifyFloat(value);
        case TAG.DOUBLE: return stringifyDouble(value);
        case TAG.BYTE_ARRAY: return stringifyByteArray(value);
        case TAG.STRING: return stringifyString(value);
        case TAG.LIST: return stringifyList(value, space, level);
        case TAG.COMPOUND: return stringifyCompound(value, space, level);
        case TAG.INT_ARRAY: return stringifyIntArray(value);
        case TAG.LONG_ARRAY: return stringifyLongArray(value);
        default: throw new Error(`Encountered unsupported tag type '${type}'`);
    }
}
function stringifyByte(value) {
    return (typeof value === "boolean") ? `${value}` : `${value.valueOf()}b`;
}
function stringifyShort(value) {
    return `${value.valueOf()}s`;
}
function stringifyInt(value) {
    return `${value.valueOf()}`;
}
function stringifyLong(value) {
    return `${value}l`;
}
function stringifyFloat(value) {
    return `${value.valueOf()}${Number.isInteger(value.valueOf()) ? ".0" : ""}f`;
}
function stringifyDouble(value) {
    return `${value}${!Number.isInteger(value) || value.toExponential() === value.toString() ? "" : ".0"}d`;
}
function stringifyByteArray(value) {
    return `[B;${[...value].map(entry => stringifyByte(entry)).join()}]`;
}
function stringifyString(value) {
    const singleQuoteString = escapeString(value.replace(/['\\]/g, character => `\\${character}`));
    const doubleQuoteString = escapeString(value.replace(/["\\]/g, character => `\\${character}`));
    return (singleQuoteString.length < doubleQuoteString.length) ? `'${singleQuoteString}'` : `"${doubleQuoteString}"`;
}
function escapeString(value) {
    return value
        .replaceAll("\0", "\\0")
        .replaceAll("\b", "\\b")
        .replaceAll("\f", "\\f")
        .replaceAll("\n", "\\n")
        .replaceAll("\r", "\\r")
        .replaceAll("\t", "\\t");
}
function stringifyList(value, space, level) {
    value = value.filter(isTag);
    const fancy = (space !== "");
    const type = (value[0] !== undefined) ? getTagType(value[0]) : TAG.END;
    const isIndentedList = fancy && new Set([TAG.BYTE_ARRAY, TAG.LIST, TAG.COMPOUND, TAG.INT_ARRAY, TAG.LONG_ARRAY]).has(type);
    return `[${value.map(entry => `${isIndentedList ? `\n${space.repeat(level)}` : ""}${(() => {
        if (getTagType(entry) !== type) {
            throw new TypeError("Encountered unexpected item type in array, all tags in a List tag must be of the same type");
        }
        const result = stringifyTag(entry, space, level + 1);
        return result;
    })()}`).join(`,${fancy && !isIndentedList ? " " : ""}`)}${isIndentedList ? `\n${space.repeat(level - 1)}` : ""}]`;
}
function stringifyCompound(value, space, level) {
    const fancy = (space !== "");
    return `{${Object.entries(value).filter((entry) => isTag(entry[1])).map(([key, value]) => `${fancy ? `\n${space.repeat(level)}` : ""}${/^[0-9a-z_\-.+]+$/i.test(key) ? key : stringifyString(key)}:${fancy ? " " : ""}${(() => {
        const result = stringifyTag(value, space, level + 1);
        return result;
    })()}`).join(",")}${fancy && Object.keys(value).length !== 0 ? `\n${space.repeat(level - 1)}` : ""}}`;
}
function stringifyIntArray(value) {
    return `[I;${[...value].map(entry => stringifyInt(entry)).join()}]`;
}
function stringifyLongArray(value) {
    return `[L;${[...value].map(entry => stringifyLong(entry)).join()}]`;
}
//# sourceMappingURL=stringify.js.map