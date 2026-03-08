/**
 * Configuration options for {@link MUtf8Decoder}.
 */
export interface TextDecoderOptions {
    /**
     * Controls error handling behavior when invalid Modified UTF-8 byte sequences are encountered.
     *
     * When `true`, the decoder throws a `TypeError` immediately upon encountering invalid bytes. When `false`, invalid
     * sequences are replaced with the Unicode replacement character (U+FFFD).
     *
     * @defaultValue `false`
     *
     * @example
     * ```typescript
     * const decoder = new MUtf8Decoder("mutf-8", { fatal: true });
     * const invalidBytes = new Uint8Array([0xFF, 0xFE]);
     *
     * try {
     *   decoder.decode(invalidBytes); // Throws TypeError
     * } catch (error) {
     *   console.error("Invalid MUTF-8 data:", error.message);
     * }
     * ```
     */
    fatal?: boolean;
    /**
     * Whether to ignore the Byte Order Mark (BOM) at the beginning of the input.
     *
     * When `false`, a BOM (0xEF 0xBB 0xBF) at the start of the input is treated as a zero-width non-breaking space
     * character. When `true`, the BOM is silently ignored and not included in the decoded output.
     *
     * @defaultValue `false`
     *
     * @remarks
     * BOMs are uncommon in Modified UTF-8 data since it's primarily used internally by Java, but this option provides
     * compatibility when processing mixed encoding data.
     */
    ignoreBOM?: boolean;
}
/**
 * Options for individual decode operations on {@link MUtf8Decoder}.
 *
 * These options are passed to {@link MUtf8Decoder.decode} to control how each decoding operation is performed.
 */
export interface TextDecodeOptions {
    /**
     * Enables streaming mode for partial decoding of incomplete byte sequences.
     *
     * When `true`, the decoder preserves incomplete byte sequences at the end of the input for the next decode
     * operation. This is essential for processing data that arrives in chunks, where a Modified UTF-8 character might
     * be split across chunk boundaries. When `false` (default), incomplete sequences at the end are treated as
     * decoding errors and handled according to the decoder's `fatal` setting.
     *
     * @defaultValue `false`
     *
     * @example
     * ```typescript
     * const decoder = new MUtf8Decoder();
     *
     * // First chunk ends with incomplete sequence
     * const chunk1 = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0xe4]);
     * const result1 = decoder.decode(chunk1, { stream: true });
     * console.log(result1); // "Hello" (0xe4 is preserved)
     *
     * // Second chunk completes the sequence
     * const chunk2 = new Uint8Array([0xb8, 0x96]);
     * const result2 = decoder.decode(chunk2, { stream: true });
     * console.log(result2); // "世" (completes the character)
     * ```
     */
    stream?: boolean;
}
/**
 * Result returned by {@link MUtf8Encoder.encodeInto} indicating encoding progress.
 *
 * This interface provides information about how much of the input string was processed and how many bytes were
 * written to the destination buffer.
 */
export interface TextEncoderEncodeIntoResult {
    /**
     * The number of Unicode code units (characters) read from the source string.
     *
     * Note that this counts code units, not code points. For supplementary characters (emoji, etc.), this will be 2 per
     * character due to surrogate pairs.
     */
    read: number;
    /**
     * The number of bytes written to the destination buffer.
     *
     * This represents the actual number of Modified UTF-8 bytes that were encoded into the destination array.
     */
    written: number;
}
/**
 * Union type representing all buffer sources that can be decoded by {@link MUtf8Decoder}.
 */
export type AllowSharedBufferSource = ArrayBuffer | SharedArrayBuffer | ArrayBufferView;
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
export declare class MUtf8Decoder {
    #private;
    /**
     * The encoding name for this decoder.
     *
     * This property is provided for compatibility with the WHATWG `TextDecoder` interface.
     *
     * @returns Always `"mutf-8"`
     */
    get encoding(): string;
    /**
     * Indicates whether the decoder is in fatal error mode.
     *
     * When `true`, the decoder will throw a `TypeError` when encountering invalid Modified UTF-8 byte sequences. When
     * `false`, invalid sequences are replaced with the Unicode replacement character (U+FFFD).
     *
     * @returns `true` if error mode is fatal, otherwise `false`
     */
    get fatal(): boolean;
    /**
     * Indicates whether the decoder ignores Byte Order Marks.
     *
     * When `true`, BOM bytes (0xEF 0xBB 0xBF) at the beginning of input are silently ignored. When `false`, they are
     * treated as regular characters.
     *
     * @returns `true` if BOM should be ignored, otherwise `false`
     */
    get ignoreBOM(): boolean;
    /**
     * @param label - The encoding label. Must be `"mutf-8"` or `"mutf8"` (case-insensitive)
     * @param options - Configuration options for the decoder behavior
     * @throws `RangeError` If the `label` is not a supported value
     */
    constructor(label?: string, options?: TextDecoderOptions);
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
    decode(input: AllowSharedBufferSource, options?: TextDecodeOptions): string;
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
export declare class MUtf8Encoder {
    #private;
    /**
     * The encoding name for this encoder.
     *
     * This property is provided for compatibility with the WHATWG `TextEncoder` interface.
     *
     * @returns Always `"mutf-8"`
     */
    get encoding(): string;
    /**
     * Encodes a JavaScript string into Modified UTF-8 bytes.
     *
     * This method converts the input string into a Modified UTF-8 byte array.
     *
     * @param input - The string to encode
     * @returns A new `Uint8Array` containing the Modified UTF-8 encoded bytes
     */
    encode(input?: string): Uint8Array;
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
    encodeInto(source: string, destination: Uint8Array): TextEncoderEncodeIntoResult;
}
