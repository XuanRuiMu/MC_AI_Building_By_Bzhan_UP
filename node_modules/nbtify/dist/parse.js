import { Int8, Int16, Int32, Float32 } from "./primitive.js";
import { TAG, getTagType } from "./tag.js";
const UNQUOTED_STRING_PATTERN = /^[0-9A-Za-z.+_-]+$/;
/**
 * Converts an SNBT string into an NBT object.
*/
export function parse(data) {
    if (typeof data !== "string") {
        data;
        throw new TypeError("First parameter must be a string");
    }
    return new SNBTReader().parseRoot(data);
}
class SNBTReader {
    #i = 0;
    #index = 0;
    #peek(data, index, byteOffset = index) {
        const value = data[byteOffset];
        if (value === undefined) {
            throw this.#unexpectedEnd();
        }
        return value;
    }
    #unexpectedEnd() {
        return new Error("Unexpected end");
    }
    #unexpectedChar(data, index, i) {
        if (i == null) {
            i = index;
        }
        return new Error(`Unexpected character ${this.#peek(data, index)} at position ${index}`);
    }
    #skipWhitespace(data) {
        while (this.#index < data.length) {
            if (!/ |\t|\r/.test(this.#peek(data, this.#index)) && this.#peek(data, this.#index) != "\n")
                return;
            this.#index += 1;
        }
    }
    parseRoot(data) {
        this.#skipWhitespace(data);
        this.#i = this.#index;
        switch (this.#peek(data, this.#index)) {
            case "{": {
                this.#index++;
                return this.#parseCompound(data);
            }
            case "[": {
                this.#index++;
                const list = this.#parseList(data, "[root]");
                const type = getTagType(list);
                if (type !== TAG.LIST)
                    break;
                return list;
            }
        }
        throw new Error("Encountered unexpected Root tag type, must be either a List or Compound tag");
    }
    #parseTag(data, key) {
        this.#skipWhitespace(data);
        this.#i = this.#index;
        switch (this.#peek(data, this.#index)) {
            case "{": {
                this.#index++;
                return this.#parseCompound(data);
            }
            case "[": return (this.#index++, this.#parseList(data, key));
            case '"':
            case "'": return this.#parseQuotedString(data);
            default: {
                if (/^(true)$/.test(data.slice(this.#i, this.#index + 4)) ||
                    /^(false)$/.test(data.slice(this.#i, this.#index + 5))) {
                    return (this.#parseUnquotedString(data) === "true");
                }
                const value = this.#parseNumber(data);
                if (value != null && (this.#index == data.length || !UNQUOTED_STRING_PATTERN.test(this.#peek(data, this.#index)))) {
                    return value;
                }
                return (data.slice(this.#i, this.#index) + this.#parseUnquotedString(data));
            }
        }
    }
    #parseNumber(data) {
        if (!"-0123456789".includes(this.#peek(data, this.#index)))
            return null;
        this.#i = this.#index++;
        let hasFloatingPoint = false;
        while (this.#index < data.length) {
            const char = this.#peek(data, this.#index);
            this.#index++;
            if ("0123456789e-+".includes(char))
                continue;
            switch (char.toLowerCase()) {
                case ".": {
                    if (hasFloatingPoint) {
                        this.#index--;
                        return null;
                    }
                    hasFloatingPoint = true;
                    break;
                }
                case "f": return new Float32(Number(data.slice(this.#i, this.#index - 1)));
                case "d": return Number(data.slice(this.#i, this.#index - 1));
                case "b": return new Int8(Number(data.slice(this.#i, this.#index - 1)));
                case "s": return new Int16(Number(data.slice(this.#i, this.#index - 1)));
                case "l": return BigInt(data.slice(this.#i, this.#index - 1));
                default: {
                    if (hasFloatingPoint) {
                        return Number(data.slice(this.#i, --this.#index));
                    }
                    else {
                        return new Int32(Number(data.slice(this.#i, --this.#index)));
                    }
                }
            }
        }
        if (hasFloatingPoint) {
            return Number(data.slice(this.#i, this.#index));
        }
        else {
            return new Int32(Number(data.slice(this.#i, this.#index)));
        }
    }
    #parseString(data) {
        if (this.#peek(data, this.#index) == '"' || this.#peek(data, this.#index) == "'") {
            return this.#parseQuotedString(data);
        }
        else {
            return this.#parseUnquotedString(data);
        }
    }
    #parseUnquotedString(data) {
        this.#i = this.#index;
        while (this.#index < data.length) {
            if (!UNQUOTED_STRING_PATTERN.test(this.#peek(data, this.#index)))
                break;
            this.#index++;
        }
        if (this.#index - this.#i == 0) {
            if (this.#index == data.length) {
                throw this.#unexpectedEnd();
            }
            else {
                throw this.#unexpectedChar(data, this.#index);
            }
        }
        return data.slice(this.#i, this.#index);
    }
    #parseQuotedString(data) {
        const quoteChar = this.#peek(data, this.#index);
        // i = 
        ++this.#index;
        let string = "";
        while (this.#index < data.length) {
            let char = this.#peek(data, this.#index++);
            if (char === "\\") {
                char = `\\${this.#peek(data, this.#index++)}`;
            }
            if (char === quoteChar) {
                return string;
            }
            string += this.#unescapeString(char);
        }
        throw this.#unexpectedEnd();
    }
    #unescapeString(value) {
        return value
            .replaceAll("\\\\", "\\")
            .replaceAll("\\\"", "\"")
            .replaceAll("\\'", "'")
            .replaceAll("\\0", "\0")
            .replaceAll("\\b", "\b")
            .replaceAll("\\f", "\f")
            .replaceAll("\\n", "\n")
            .replaceAll("\\r", "\r")
            .replaceAll("\\t", "\t");
    }
    #skipCommas(data, isFirst, end) {
        this.#skipWhitespace(data);
        if (this.#peek(data, this.#index) == ",") {
            if (isFirst) {
                throw this.#unexpectedChar(data, this.#index);
            }
            else {
                this.#index++;
                this.#skipWhitespace(data);
            }
        }
        else if (!isFirst && this.#peek(data, this.#index) != end) {
            throw this.#unexpectedChar(data, this.#index);
        }
    }
    #parseArray(data, type) {
        const array = [];
        while (this.#index < data.length) {
            this.#skipCommas(data, array.length == 0, "]");
            if (this.#peek(data, this.#index) == "]") {
                this.#index++;
                switch (type) {
                    case "B": return Int8Array.from(array.map(v => Number(v)));
                    case "I": return Int32Array.from(array.map(v => Number(v)));
                    case "L": return BigInt64Array.from(array.map(v => BigInt(v)));
                }
            }
            this.#i = this.#index;
            if (this.#peek(data, this.#index) == "-") {
                this.#index++;
            }
            while (this.#index < data.length) {
                if (!"0123456789".includes(this.#peek(data, this.#index)))
                    break;
                this.#index++;
            }
            const prefix = (type === "B") ? "b" : (type === "L") ? "l" : "";
            if (this.#peek(data, this.#index) == prefix) {
                this.#index++;
            }
            if (this.#index - this.#i == 0) {
                throw this.#unexpectedChar(data, this.#index);
            }
            if (UNQUOTED_STRING_PATTERN.test(this.#peek(data, this.#index))) {
                throw this.#unexpectedChar(data, this.#index);
            }
            array.push(data.slice(this.#i, this.#index - ((type !== "I") ? 1 : 0)));
        }
        throw this.#unexpectedEnd();
    }
    #parseList(data, key) {
        const prefix = this.#peek(data, this.#index).toUpperCase();
        if ("BIL".includes(prefix) && data[this.#index + 1] == ";") {
            return this.#parseArray(data, this.#peek(data, (this.#index += 2) - 2).toUpperCase());
        }
        const array = [];
        let type;
        while (this.#index < data.length) {
            this.#skipWhitespace(data);
            if (this.#peek(data, this.#index) == ",") {
                if (array.length == 0) {
                    throw this.#unexpectedChar(data, this.#index);
                }
                else {
                    this.#index++;
                    this.#skipWhitespace(data);
                }
            }
            else if (array.length > 0 && this.#peek(data, this.#index) != "]") {
                throw this.#unexpectedChar(data, this.#index - 1);
            }
            if (this.#peek(data, this.#index) == "]") {
                this.#index++;
                return array;
            }
            const entry = this.#parseTag(data, key);
            if (type === undefined) {
                type = getTagType(entry);
            }
            if (getTagType(entry) !== type) {
                throw new TypeError(`Encountered unexpected item type '${getTagType(entry)}' in List '${key}' at index ${array.length}, expected item type '${type}'. All tags in a List tag must be of the same type`);
            }
            array.push(entry);
        }
        throw this.#unexpectedEnd();
    }
    #parseCompound(data) {
        const value = {};
        let first = true;
        while (true) {
            this.#skipCommas(data, first, "}");
            first = false;
            if (this.#peek(data, this.#index) == "}") {
                this.#index++;
                return value;
            }
            const key = this.#parseString(data);
            this.#skipWhitespace(data);
            if (data[this.#index++] != ":") {
                throw this.#unexpectedChar(data, this.#index);
            }
            value[key] = this.#parseTag(data, key);
        }
    }
}
//# sourceMappingURL=parse.js.map