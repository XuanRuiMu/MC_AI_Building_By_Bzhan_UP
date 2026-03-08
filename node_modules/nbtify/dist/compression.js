/**
 * Compresses a Uint8Array using a specific compression format.
*/
export async function compress(data, format) {
    const compressionStream = new CompressionStream(format);
    return pipeThroughCompressionStream(data, compressionStream);
}
/**
 * Decompresses a Uint8Array using a specific decompression format.
*/
export async function decompress(data, format) {
    const decompressionStream = new DecompressionStream(format);
    return pipeThroughCompressionStream(data, decompressionStream);
}
async function pipeThroughCompressionStream(data, { readable, writable }) {
    const writer = writable.getWriter();
    writer.write(data).catch(() => { });
    writer.close().catch(() => { });
    const chunks = [];
    let byteLength = 0;
    const iterator = readableStreamToAsyncIterable(readable);
    for await (const chunk of iterator) {
        chunks.push(chunk);
        byteLength += chunk.byteLength;
    }
    const result = new Uint8Array(byteLength);
    let byteOffset = 0;
    for (const chunk of chunks) {
        result.set(chunk, byteOffset);
        byteOffset += chunk.byteLength;
    }
    return result;
}
function readableStreamToAsyncIterable(readable) {
    if (typeof readable[Symbol.asyncIterator] === "undefined") {
        return readableStreamToAsyncGenerator(readable);
    }
    return readable;
}
async function* readableStreamToAsyncGenerator(readable) {
    const reader = readable.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                return;
            yield value;
        }
    }
    finally {
        reader.releaseLock();
    }
}
//# sourceMappingURL=compression.js.map