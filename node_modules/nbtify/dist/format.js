/**
 * A container which maintains how a given NBT object is formatted.
*/
export class NBTData {
    data;
    rootName;
    endian;
    compression;
    bedrockLevel;
    #byteOffset = null;
    constructor(data, options = {}) {
        if (data instanceof NBTData) {
            if (options.rootName === undefined) {
                options.rootName = data.rootName;
            }
            if (options.endian === undefined) {
                options.endian = data.endian;
            }
            if (options.compression === undefined) {
                options.compression = data.compression;
            }
            if (options.bedrockLevel === undefined) {
                options.bedrockLevel = data.bedrockLevel;
            }
            data = data.data;
        }
        const { rootName = "", endian = "big", compression = null, bedrockLevel = false } = options;
        this.data = data;
        this.rootName = rootName;
        this.endian = endian;
        this.compression = compression;
        this.bedrockLevel = bedrockLevel;
    }
    get byteOffset() {
        return this.#byteOffset;
    }
    /**
     * @internal
     */
    set byteOffset(value) {
        this.#byteOffset = value;
    }
    get [Symbol.toStringTag]() {
        return "NBTData";
    }
}
//# sourceMappingURL=format.js.map