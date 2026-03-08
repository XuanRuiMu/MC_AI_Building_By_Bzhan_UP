import { MUtf8Encoder } from "mutf-8";
import { NBTData } from "./format.js";
import { TAG, TAG_TYPE, isTag, getTagType } from "./tag.js";
import { Int32 } from "./primitive.js";
import { compress } from "./compression.js";
/**
 * Converts an NBT object into an NBT buffer. Accepts an endian type, compression format, and file headers to write the data with.
 *
 * If a format option isn't specified, the value of the equivalent property on the NBTData object will be used.
*/
export async function write(data, options = {}) {
    data = new NBTData(data, options);
    const { rootName, endian, compression, bedrockLevel } = data;
    if (typeof data !== "object" || data === null) {
        data;
        throw new TypeError("First parameter must be an object or array");
    }
    if (rootName !== undefined && typeof rootName !== "string" && rootName !== null) {
        rootName;
        throw new TypeError("Root Name option must be a string or null");
    }
    if (endian !== undefined && endian !== "big" && endian !== "little" && endian !== "little-varint") {
        endian;
        throw new TypeError("Endian option must be a valid endian type");
    }
    if (compression !== undefined && compression !== "deflate" && compression !== "deflate-raw" && compression !== "gzip" && compression !== null) {
        compression;
        throw new TypeError("Compression option must be a valid compression type");
    }
    if (bedrockLevel !== undefined && typeof bedrockLevel !== "boolean") {
        bedrockLevel;
        throw new TypeError("Bedrock Level option must be a boolean");
    }
    const writer = new NBTWriter(endian !== "big", endian === "little-varint");
    return writer.writeRoot(data);
}
class NBTWriter {
    #byteOffset = 0;
    #data = new Uint8Array(1024);
    #view = new DataView(this.#data.buffer);
    #littleEndian;
    #varint;
    #encoder = new MUtf8Encoder();
    constructor(littleEndian, varint) {
        this.#littleEndian = littleEndian;
        this.#varint = varint;
    }
    #allocate(byteLength) {
        const required = this.#byteOffset + byteLength;
        if (this.#data.byteLength >= required)
            return;
        let length = this.#data.byteLength;
        while (length < required) {
            length *= 2;
        }
        const data = new Uint8Array(length);
        data.set(this.#data, 0);
        // not sure this is really needed, keeping it just in case; freezer burn
        if (this.#byteOffset > this.#data.byteLength) {
            data.fill(0, byteLength, this.#byteOffset);
        }
        this.#data = data;
        this.#view = new DataView(data.buffer);
    }
    #trimmedEnd() {
        this.#allocate(0);
        return this.#data.slice(0, this.#byteOffset);
    }
    async writeRoot(data) {
        const { data: root, rootName, endian, compression, bedrockLevel } = data;
        const littleEndian = endian !== "big";
        const type = getTagType(root);
        if (type !== TAG.LIST && type !== TAG.COMPOUND) {
            throw new TypeError(`Encountered unexpected Root tag type '${type}', must be either a List or Compound tag`);
        }
        if (bedrockLevel) {
            this.#writeUnsignedInt(0);
            this.#writeUnsignedInt(0);
        }
        this.#writeTagType(type);
        if (rootName !== null)
            this.#writeString(rootName);
        this.#writeTag(root);
        if (bedrockLevel) {
            if (littleEndian !== true) {
                throw new TypeError("Endian option must be 'little' when the Bedrock Level flag is enabled");
            }
            if (!("StorageVersion" in root) || !(root["StorageVersion"] instanceof Int32)) {
                throw new TypeError("Expected a 'StorageVersion' Int tag when Bedrock Level flag is enabled");
            }
            const version = root["StorageVersion"].valueOf();
            const byteLength = this.#byteOffset - 8;
            this.#view.setUint32(0, version, littleEndian);
            this.#view.setUint32(4, byteLength, littleEndian);
        }
        let result = this.#trimmedEnd();
        if (compression !== null) {
            result = await compress(result, compression);
        }
        return result;
    }
    #writeTag(value) {
        const type = getTagType(value);
        switch (type) {
            case TAG.BYTE: return this.#writeByte(value);
            case TAG.SHORT: return this.#writeShort(value);
            case TAG.INT: return this.#varint ? this.#writeVarIntZigZag(value) : this.#writeInt(value);
            case TAG.LONG: return this.#varint ? this.#writeVarLongZigZag(value) : this.#writeLong(value);
            case TAG.FLOAT: return this.#writeFloat(value);
            case TAG.DOUBLE: return this.#writeDouble(value);
            case TAG.BYTE_ARRAY: return this.#writeByteArray(value);
            case TAG.STRING: return this.#writeString(value);
            case TAG.LIST: return this.#writeList(value);
            case TAG.COMPOUND: return this.#writeCompound(value);
            case TAG.INT_ARRAY: return this.#writeIntArray(value);
            case TAG.LONG_ARRAY: return this.#writeLongArray(value);
            default: throw new Error(`Encountered unsupported tag type '${type}'`);
        }
    }
    #writeTagType(type) {
        this.#writeUnsignedByte(type);
        return this;
    }
    #writeUnsignedByte(value) {
        this.#allocate(1);
        this.#view.setUint8(this.#byteOffset, value);
        this.#byteOffset += 1;
        return this;
    }
    #writeByte(value) {
        this.#allocate(1);
        this.#view.setInt8(this.#byteOffset, Number(value.valueOf()));
        this.#byteOffset += 1;
        return this;
    }
    #writeUnsignedShort(value) {
        this.#allocate(2);
        this.#view.setUint16(this.#byteOffset, value, this.#littleEndian);
        this.#byteOffset += 2;
        return this;
    }
    #writeShort(value) {
        this.#allocate(2);
        this.#view.setInt16(this.#byteOffset, value.valueOf(), this.#littleEndian);
        this.#byteOffset += 2;
        return this;
    }
    #writeUnsignedInt(value) {
        this.#allocate(4);
        this.#view.setUint32(this.#byteOffset, value, this.#littleEndian);
        this.#byteOffset += 4;
        return this;
    }
    #writeInt(value) {
        this.#allocate(4);
        this.#view.setInt32(this.#byteOffset, value.valueOf(), this.#littleEndian);
        this.#byteOffset += 4;
        return this;
    }
    #writeVarInt(value) {
        while (true) {
            let byte = value & 0x7F;
            value >>>= 7;
            if (value !== 0) {
                byte |= 0x80;
            }
            this.#writeByte(byte);
            if (value === 0)
                break;
        }
        return this;
    }
    #writeVarIntZigZag(value) {
        value = value.valueOf();
        value = (value << 1) ^ (value >> 31);
        while (value & ~0x7F) {
            const byte = (value & 0xFF) | 0x80;
            this.#writeByte(byte);
            value >>>= 7;
        }
        this.#writeByte(value);
        return this;
    }
    #writeLong(value) {
        this.#allocate(8);
        this.#view.setBigInt64(this.#byteOffset, value, this.#littleEndian);
        this.#byteOffset += 8;
        return this;
    }
    #writeVarLongZigZag(value) {
        value = (value << 1n) ^ (value >> 63n);
        while (value > 127n) {
            const byte = Number(value & 0xffn);
            this.#writeByte(byte | 0x80);
            value >>= 7n;
        }
        this.#writeByte(Number(value));
        return this;
    }
    #writeFloat(value) {
        this.#allocate(4);
        this.#view.setFloat32(this.#byteOffset, value.valueOf(), this.#littleEndian);
        this.#byteOffset += 4;
        return this;
    }
    #writeDouble(value) {
        this.#allocate(8);
        this.#view.setFloat64(this.#byteOffset, value, this.#littleEndian);
        this.#byteOffset += 8;
        return this;
    }
    #writeByteArray(value) {
        const { length } = value;
        this.#varint ? this.#writeVarIntZigZag(length) : this.#writeInt(length);
        this.#allocate(length);
        this.#data.set(value, this.#byteOffset);
        this.#byteOffset += length;
        return this;
    }
    #writeString(value) {
        const entry = this.#encoder.encode(value);
        const { length } = entry;
        this.#varint ? this.#writeVarInt(length) : this.#writeUnsignedShort(length);
        this.#allocate(length);
        this.#data.set(entry, this.#byteOffset);
        this.#byteOffset += length;
        return this;
    }
    #writeList(value) {
        let type = value[TAG_TYPE];
        value = value.filter(isTag);
        type = type ?? (value[0] !== undefined ? getTagType(value[0]) : TAG.END);
        const { length } = value;
        this.#writeTagType(type);
        this.#varint ? this.#writeVarIntZigZag(length) : this.#writeInt(length);
        for (const entry of value) {
            if (getTagType(entry) !== type) {
                throw new TypeError("Encountered unexpected item type in array, all tags in a List tag must be of the same type");
            }
            this.#writeTag(entry);
        }
        return this;
    }
    #writeCompound(value) {
        for (const [name, entry] of Object.entries(value)) {
            if (entry === undefined)
                continue;
            const type = getTagType(entry);
            if (type === null)
                continue;
            this.#writeTagType(type);
            this.#writeString(name);
            this.#writeTag(entry);
        }
        this.#writeTagType(TAG.END);
        return this;
    }
    #writeIntArray(value) {
        const { length } = value;
        this.#varint ? this.#writeVarIntZigZag(length) : this.#writeInt(length);
        for (const entry of value) {
            this.#writeInt(entry);
        }
        return this;
    }
    #writeLongArray(value) {
        const { length } = value;
        this.#varint ? this.#writeVarIntZigZag(length) : this.#writeInt(length);
        for (const entry of value) {
            this.#writeLong(entry);
        }
        return this;
    }
}
//# sourceMappingURL=write.js.map