// SPDX-License-Identifier: MIT
/**
 * The decoder for Modified UTF-8.
 *
 * This class provides decoding functionality for the Modified UTF-8 character encoding. The API is designed to be
 * compatible with the WHATWG `TextDecoder` interface while handling the specific requirements of Modified UTF-8.
 *
 * @example
 * ```typescript
 * const decoder = new MUtf8Decoder();
 * const bytes = new Uint8Array([
 *   0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0xe4, 0xb8,
 *   0x96, 0xe7, 0x95, 0x8c, 0x21
 * ]);
 * const text = decoder.decode(bytes);
 * console.log(text); // "Hello 世界!"
 * ```
 *
 * @see {@link https://encoding.spec.whatwg.org/#interface-textdecoder | WHATWG Encoding Standard, TextDecoder}
 * @see {@link https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.4.7 | The Java Virtual Machine Specification, Java SE 21 Edition, Section 4.4.7}
 */
export class MUtf8Decoder {
    #fatal;
    #ignoreBOM;
    #leavings = new Uint8Array(3);
    #leavingsLength = 0;
    /**
     * The encoding name for this decoder.
     *
     * This property is provided for compatibility with the WHATWG `TextDecoder` interface.
     *
     * @returns Always `"mutf-8"`
     */
    get encoding() {
        return "mutf-8";
    }
    /**
     * Indicates whether the decoder is in fatal error mode.
     *
     * When `true`, the decoder will throw a `TypeError` when encountering invalid Modified UTF-8 byte sequences. When
     * `false`, invalid sequences are replaced with the Unicode replacement character (U+FFFD).
     *
     * @returns `true` if error mode is fatal, otherwise `false`
     */
    get fatal() {
        return this.#fatal;
    }
    /**
     * Indicates whether the decoder ignores Byte Order Marks.
     *
     * When `true`, BOM bytes (0xEF 0xBB 0xBF) at the beginning of input are silently ignored. When `false`, they are
     * treated as regular characters.
     *
     * @returns `true` if BOM should be ignored, otherwise `false`
     */
    get ignoreBOM() {
        return this.#ignoreBOM;
    }
    /**
     * @param label - The encoding label. Must be `"mutf-8"` or `"mutf8"` (case-insensitive)
     * @param options - Configuration options for the decoder behavior
     * @throws `RangeError` If the `label` is not a supported value
     */
    constructor(label = "mutf-8", options = {}) {
        const normalizedLabel = label.toLowerCase();
        if (normalizedLabel !== "mutf-8" && normalizedLabel !== "mutf8") {
            throw new RangeError(`MUtf8Decoder.constructor: '${label}' is not supported.`);
        }
        this.#fatal = options.fatal ?? false;
        this.#ignoreBOM = options.ignoreBOM ?? false;
    }
    /**
     * Decodes Modified UTF-8 bytes into a JavaScript string.
     *
     * This method converts Modified UTF-8 encoded bytes back to their original string representation. It supports both
     * single-shot decoding and streaming decoding for processing large amounts of data.
     *
     * Decoding Behavior:
     *
     * - **Invalid sequences**: Handled according to the `fatal` setting
     * - **Streaming**: Incomplete sequences at the end are preserved when `stream` is `true`
     *
     * @param input - The Modified UTF-8 encoded bytes to decode. Can be any buffer source type
     * @param options - Decoding options, primarily for streaming support
     * @returns The decoded string
     * @throws `TypeError` If `fatal` is `true` and the input contains invalid Modified UTF-8 sequences
     */
    decode(input, options = {}) {
        const stream = options.stream ?? false;
        const bytes = this.#toU8Array(input);
        const length = bytes.length;
        const codes = new Array(length);
        let bp = 0;
        let cp = 0;
        while (bp < length) {
            const b1 = bytes[bp++];
            if (!(b1 & 0x80) && b1 !== 0) {
                // U+0001-007F
                codes[cp++] = b1;
            }
            else if ((b1 & 0xe0) === 0xc0) {
                // U+0000, U+0080-07FF
                if (length <= bp) {
                    if (stream) {
                        this.#setLeavings(bytes, bp - 1);
                        break;
                    }
                    codes[cp++] = this.#handleError();
                    continue;
                }
                const b2 = bytes[bp++];
                if ((b2 & 0xc0) !== 0x80) {
                    codes[cp++] = this.#handleError();
                    bp--;
                    continue;
                }
                codes[cp++] = ((b1 & 0x1f) << 6) | (b2 & 0x3f);
            }
            else if ((b1 & 0xf0) === 0xe0) {
                // U+0800-FFFF
                if (length <= bp + 1) {
                    if (stream) {
                        this.#setLeavings(bytes, bp - 1);
                        break;
                    }
                    codes[cp++] = this.#handleError();
                    continue;
                }
                const b2 = bytes[bp++];
                if ((b2 & 0xc0) !== 0x80) {
                    codes[cp++] = this.#handleError();
                    bp--;
                    continue;
                }
                const b3 = bytes[bp++];
                if ((b3 & 0xc0) !== 0x80) {
                    codes[cp++] = this.#handleError();
                    bp -= 2;
                    continue;
                }
                if (bp === 3 && b1 === 0xef && b2 === 0xbb && b3 === 0xbf && !this.ignoreBOM) {
                    // skip BOM `EF BB BF`
                    continue;
                }
                codes[cp++] = ((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
            }
            else {
                codes[cp++] = this.#handleError();
            }
        }
        return String.fromCharCode(...(cp === codes.length ? codes : codes.slice(0, cp)));
    }
    #toU8Array(input) {
        let bytes;
        if (input instanceof Uint8Array) {
            bytes = input;
        }
        else if ("buffer" in input) {
            bytes = new Uint8Array(input.buffer, input.byteOffset);
        }
        else {
            bytes = new Uint8Array(input);
        }
        if (!this.#leavingsLength) {
            return bytes;
        }
        const combined = new Uint8Array(this.#leavingsLength + bytes.byteLength);
        combined.set(this.#leavings.subarray(0, this.#leavingsLength));
        combined.set(bytes, this.#leavingsLength);
        this.#leavingsLength = 0;
        return combined;
    }
    #setLeavings(bytes, startIndex) {
        this.#leavings.set(bytes.subarray(startIndex));
        this.#leavingsLength = bytes.length - startIndex;
    }
    #handleError() {
        if (this.fatal) {
            throw new TypeError("MUtf8Decoder.decode: Decoding failed.");
        }
        return 0xfffd;
    }
}
/**
 * The encoder for Modified UTF-8.
 *
 * This class provides encoding functionality to convert JavaScript strings into Modified UTF-8 byte sequences. The
 * API is designed to be compatible with the WHATWG `TextEncoder` interface while handling the specific requirements
 * of Modified UTF-8.
 *
 * @example
 * ```typescript
 * const encoder = new MUtf8Encoder();
 * const bytes = encoder.encode("Hello 世界!");
 * console.log(bytes);
 * // Uint8Array [
 * //   0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0xe4, 0xb8,
 * //   0x96, 0xe7, 0x95, 0x8c, 0x21
 * // ]
 * ```
 *
 * @see {@link https://encoding.spec.whatwg.org/#interface-textencoder | WHATWG Encoding Standard, TextEncoder}
 * @see {@link https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.4.7 | The Java Virtual Machine Specification, Java SE 21 Edition, Section 4.4.7}
 */
export class MUtf8Encoder {
    /**
     * The encoding name for this encoder.
     *
     * This property is provided for compatibility with the WHATWG `TextEncoder` interface.
     *
     * @returns Always `"mutf-8"`
     */
    get encoding() {
        return "mutf-8";
    }
    /**
     * Encodes a JavaScript string into Modified UTF-8 bytes.
     *
     * This method converts the input string into a Modified UTF-8 byte array.
     *
     * @param input - The string to encode
     * @returns A new `Uint8Array` containing the Modified UTF-8 encoded bytes
     */
    encode(input = "") {
        const bytes = new Uint8Array(this.#estimateByteLength(input));
        let bp = 0;
        for (let cp = 0; cp < input.length; cp++) {
            // biome-ignore lint/style/noNonNullAssertion: `c` is always a non-empty string.
            const code = input.codePointAt(cp);
            if (0x0001 <= code && code <= 0x007f) {
                bytes[bp++] = code;
            }
            else if (code <= 0x07ff) {
                bytes[bp++] = 0xc0 | (code >>> 6);
                bytes[bp++] = 0x80 | (0x3f & code);
            }
            else if (code <= 0xffff) {
                bytes[bp++] = 0xe0 | (code >>> 12);
                bytes[bp++] = 0x80 | (0x3f & (code >>> 6));
                bytes[bp++] = 0x80 | (0x3f & code);
            }
            else {
                bytes[bp++] = 0xed;
                bytes[bp++] = 0xa0 | ((code >>> 16) - 1);
                bytes[bp++] = 0x80 | (0x3f & (code >>> 10));
                bytes[bp++] = 0xed;
                bytes[bp++] = 0xb0 | (0x0f & (code >>> 6));
                bytes[bp++] = 0x80 | (0x3f & code);
                cp++;
            }
        }
        return bytes;
    }
    /**
     * Encodes a string into Modified UTF-8 bytes within an existing buffer.
     *
     * This method provides a memory-efficient way to encode strings by writing directly into a pre-allocated buffer
     * instead of creating a new array.
     *
     * The encoding process stops when either:
     * - The entire source string has been processed
     * - The destination buffer is full and cannot accommodate the next character
     *
     * @param source - The string to encode into Modified UTF-8 bytes
     * @param destination - The `Uint8Array` buffer to write the encoded bytes into
     * @returns An object indicating how many characters were read and bytes written
     */
    encodeInto(source, destination) {
        const capacity = destination.length;
        let bp = 0;
        let cp = 0;
        while (cp < source.length) {
            // biome-ignore lint/style/noNonNullAssertion: `c` is always a non-empty string.
            const code = source.codePointAt(cp);
            if (0x0001 <= code && code <= 0x007f) {
                if (capacity <= bp)
                    break;
                destination[bp++] = code;
                cp++;
            }
            else if (code <= 0x07ff) {
                if (capacity <= bp + 1)
                    break;
                destination[bp++] = 0xc0 | (code >>> 6);
                destination[bp++] = 0x80 | (0x3f & code);
                cp++;
            }
            else if (code <= 0xffff) {
                if (capacity <= bp + 2)
                    break;
                destination[bp++] = 0xe0 | (code >>> 12);
                destination[bp++] = 0x80 | (0x3f & (code >>> 6));
                destination[bp++] = 0x80 | (0x3f & code);
                cp++;
            }
            else {
                if (capacity <= bp + 5)
                    break;
                destination[bp++] = 0xed;
                destination[bp++] = 0xa0 | ((code >>> 16) - 1);
                destination[bp++] = 0x80 | (0x3f & (code >>> 10));
                destination[bp++] = 0xed;
                destination[bp++] = 0xb0 | (0x0f & (code >>> 6));
                destination[bp++] = 0x80 | (0x3f & code);
                cp += 2;
            }
        }
        return { read: cp, written: bp };
    }
    #estimateByteLength(source) {
        let length = 0;
        for (let cp = 0; cp < source.length; cp++) {
            // biome-ignore lint/style/noNonNullAssertion: `source` is always a non-empty string.
            const code = source.codePointAt(cp);
            if (0x0001 <= code && code <= 0x007f) {
                length += 1;
            }
            else if (code <= 0x07ff) {
                length += 2;
            }
            else if (code <= 0xffff) {
                length += 3;
            }
            else {
                length += 6;
                cp++;
            }
        }
        return length;
    }
}
