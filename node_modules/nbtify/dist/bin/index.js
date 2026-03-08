#!/usr/bin/env node
import { extname } from "node:path";
import { readFileSync } from "node:fs";
import { inspect, promisify } from "node:util";
import { read, write, parse, stringify, NBTData } from "../index.js";
import { file, nbt, snbt, json, format, space } from "./args.js";
if (file === undefined) {
    file;
    throw new TypeError("Missing argument 'input'");
}
const buffer = readFileSync(file);
let input;
if (file === 0) {
    input = await readBuffer(buffer);
}
else {
    try {
        input = await readExtension(buffer, file);
    }
    catch {
        input = await readBuffer(buffer);
    }
}
async function readExtension(buffer, file) {
    const extension = extname(file);
    switch (extension) {
        case ".json": return JSON.parse(buffer.toString("utf-8"));
        case ".snbt": return parse(buffer.toString("utf-8"));
        default: return read(buffer);
    }
}
async function readBuffer(buffer) {
    try {
        return JSON.parse(buffer.toString("utf-8"));
    }
    catch {
        try {
            return parse(buffer.toString("utf-8"));
        }
        catch {
            return read(buffer);
        }
    }
}
const output = new NBTData(input, format);
if (!nbt && !snbt && !json) {
    console.log(inspect(output, { colors: true, depth: null }));
    process.exit(0);
}
const stdoutWriteAsync = promisify(process.stdout.write.bind(process.stdout));
const result = json
    ? `${JSON.stringify(output.data, null, space)}\n`
    : snbt
        ? `${stringify(output, { space })}\n`
        : await write(output);
await stdoutWriteAsync(result);
//# sourceMappingURL=index.js.map