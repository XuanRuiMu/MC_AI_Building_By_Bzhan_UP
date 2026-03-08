import JSZip from 'jszip';
import { write, Int8, Int16, Int32 } from 'nbtify';
import { gzipSync } from 'fflate';
import { VALID_BLOCKS_1_21 } from './validBlocks.js';
import { VERSION_GROUPS, getVersionConfig, convertBlockForVersion, formatBlockForVersion, NUMERIC_BLOCK_IDS, propertiesToMetadata, BLOCK_PROPERTY_CATEGORY, getLegacyBlockName } from './versionConfig.js';
import { renderThumbnail } from './thumbnailRenderer.js';

/**
 * Optimizes Minecraft block placement by combining adjacent blocks into /fill commands.
 * Implements a simple greedy meshing algorithm.
 * Block validation uses official Minecraft 1.21 data from misode/mcmeta
 * Now supports multi-version export (1.8.x - 1.21+)
 */

// Use official 1.21 block list (1060 blocks)
const VALID_BLOCKS = VALID_BLOCKS_1_21;

// Semantic type mappings (from your builder API to Minecraft blocks)
const SEMANTIC_MAPPINGS = {
    // Walls
    'wall_stone': 'stone_bricks', 'wall_wood': 'oak_planks', 'wall_brick': 'bricks',
    'wall_white': 'white_concrete', 'wall_gray': 'gray_concrete',
    // Roofs
    'roof_stone': 'stone_brick_stairs', 'roof_wood': 'dark_oak_stairs', 'roof_red': 'bricks',
    // Floors
    'floor_stone': 'stone_bricks', 'floor_wood': 'oak_planks',
    // Structure
    'frame_wood': 'stripped_oak_log', 'window': 'glass_pane',
    // Common typos and alternatives
    'wood': 'oak_planks', 'log': 'oak_log', 'leaves': 'oak_leaves', 'plank': 'oak_planks',
    'brick': 'bricks', 'glass_block': 'glass', 'stone_brick': 'stone_bricks',
};

// Format block ID for Minecraft command with version compatibility
const formatBlock = (b, targetVersion = '1.21') => {
    const versionConfig = getVersionConfig(targetVersion);
    
    // 1. Remove all prefixes and trim whitespace/hidden chars
    let rawType = b.type.toString().trim().replace(/^(WALL_|ROOF_|FLOOR_|FRAME_)/, '').toLowerCase();

    // 2. Check semantic mappings first
    if (SEMANTIC_MAPPINGS[rawType]) {
        rawType = SEMANTIC_MAPPINGS[rawType];
    }

    // 3. Version-specific renames (handled by versionConfig)
    // For 1.21+: grass -> short_grass
    // For older: short_grass -> grass
    if (targetVersion === '1.21' || versionConfig.isLatest) {
        if (rawType === 'grass' || rawType === 'minecraft:grass') rawType = 'short_grass';
    } else {
        if (rawType === 'short_grass' || rawType === 'minecraft:short_grass') rawType = 'grass';
    }
    
    if (rawType === 'snow' || rawType === 'minecraft:snow') rawType = 'snow_block';

    // 4. Strip minecraft: prefix for validation
    let cleanType = rawType.replace('minecraft:', '');

    // Remove properties for validation
    const propsStart = cleanType.indexOf('[');
    const baseType = propsStart > 0 ? cleanType.substring(0, propsStart) : cleanType;

    // 5. Validate block name - if invalid, use fallback
    if (!VALID_BLOCKS.has(baseType)) {
        // Try common fixes
        const fixes = {
            'stone_brick': 'stone_bricks',
            'nether_brick': 'nether_bricks',
            'mud_brick': 'mud_bricks',
            'oak_wood': 'oak_log',
            'spruce_wood': 'spruce_log',
        };

        if (fixes[baseType]) {
            cleanType = fixes[baseType];
        } else {
            console.warn(`[Export] Unknown block "${rawType}", using stone as fallback`);
            cleanType = 'stone';
        }
    }

    // 6. Convert for target version (handles renames and fallbacks)
    const convertedType = convertBlockForVersion(cleanType, targetVersion);

    // 7. Build final ID based on version
    let id;
    if (versionConfig.usesNumericIds) {
        // Legacy format for 1.8.x - 1.12.x
        // Use block names with optional data values
        // Format: setblock ~ ~ ~ stone 0  OR  setblock ~ ~ ~ planks 2
        
        // Get legacy block name (e.g., stone_bricks -> stonebrick, oak_planks -> planks)
        const legacyName = getLegacyBlockName(convertedType) || getLegacyBlockName(cleanType) || convertedType;
        
        // Get data value from NUMERIC_BLOCK_IDS
        let dataValue = 0;
        const numericId = NUMERIC_BLOCK_IDS[convertedType] || NUMERIC_BLOCK_IDS[cleanType];
        if (numericId && numericId.includes(':')) {
            // Extract data value from "5:2" format
            const parts = numericId.split(':');
            dataValue = parseInt(parts[1]) || 0;
        }
        
        // Also check properties for additional metadata
        if (b.properties && b.properties !== '0' && String(b.properties).trim() !== '') {
            const propsObj = parsePropertiesToObject(b.properties);
            const propsMeta = propertiesToMetadata(cleanType, propsObj);
            if (propsMeta > 0) {
                dataValue = propsMeta;
            }
        }
        
        // Format: block_name OR block_name data_value
        if (dataValue > 0) {
            id = `${legacyName} ${dataValue}`;
        } else {
            id = legacyName;
        }
    } else {
        // Modern format: minecraft:block_name
        id = 'minecraft:' + convertedType.replace(/[^a-z0-9_\[\]=,]/g, '');
        
        // 8. Add properties if present (only for modern versions)
        if (b.properties && b.properties !== '0' && String(b.properties).trim() !== '') {
            let p = String(b.properties).replace(/\s/g, '');
            if (p.endsWith(',')) p = p.slice(0, -1);
            const sanitizedProps = p.replace(/[^a-zA-Z0-9_=,]/g, '');
            if (sanitizedProps && sanitizedProps.includes('=') && !id.includes('[')) {
                id += `[${sanitizedProps}]`;
            }
        }
    }

    return id.replace(/[^\x00-\x7F]/g, "");
};

// Helper: Parse properties string to object
function parsePropertiesToObject(propsStr) {
    if (!propsStr || propsStr === '0') return {};
    const props = {};
    const str = String(propsStr).replace(/\s/g, '');
    const pairs = str.split(',');
    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
            props[key.trim()] = value.trim();
        }
    });
    return props;
}

export const generateOptimizedCommands = (blocks, targetVersion = '1.21') => {
    const commands = [];
    const versionConfig = getVersionConfig(targetVersion);

    if (!blocks || blocks.length === 0) return [];

    console.log(`[Export] Processing ${blocks.length} blocks for version ${targetVersion}...`);
    const startTime = performance.now();

    // Normalize bounds to 0,0,0
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    blocks.forEach(b => {
        const [x, y, z] = b.position;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);
    });

    // Group blocks by full ID (type + properties) with HASH MAP for O(1) lookup
    const blocksByKey = new Map();

    blocks.forEach(b => {
        const key = formatBlock(b, targetVersion);
        if (!blocksByKey.has(key)) {
            blocksByKey.set(key, {
                list: [],
                posMap: new Map() // Hash map for O(1) position lookup
            });
        }
        const rx = b.position[0] - minX;
        const ry = b.position[1] - minY;
        const rz = b.position[2] - minZ;
        const posKey = `${rx},${ry},${rz}`;

        blocksByKey.get(key).list.push({ x: rx, y: ry, z: rz });
        blocksByKey.get(key).posMap.set(posKey, true);
    });

    console.log(`[Export] Grouped into ${blocksByKey.size} block types`);

    // Greedy merge for each block type using hash lookup
    blocksByKey.forEach(({ list, posMap }, blockId) => {
        const visited = new Set();

        // Helper: Check if block exists at position - O(1) now!
        const hasBlock = (x, y, z) => posMap.has(`${x},${y},${z}`);

        list.forEach(startBlock => {
            const posKey = `${startBlock.x},${startBlock.y},${startBlock.z}`;
            if (visited.has(posKey)) return;

            // Start a new region
            let x1 = startBlock.x, y1 = startBlock.y, z1 = startBlock.z;
            let x2 = startBlock.x, y2 = startBlock.y, z2 = startBlock.z;

            // 1. Expand in X
            while (hasBlock(x2 + 1, y1, z1) && !visited.has(`${x2 + 1},${y1},${z1}`)) {
                x2++;
            }

            // 2. Expand in Z (check the whole row X1..X2)
            expandZ: while (true) {
                const nextZ = z2 + 1;
                for (let ix = x1; ix <= x2; ix++) {
                    if (!hasBlock(ix, y1, nextZ) || visited.has(`${ix},${y1},${nextZ}`)) {
                        break expandZ;
                    }
                }
                z2++;
            }

            // 3. Expand in Y (check the whole plate X1..X2, Z1..Z2)
            expandY: while (true) {
                const nextY = y2 + 1;
                for (let ix = x1; ix <= x2; ix++) {
                    for (let iz = z1; iz <= z2; iz++) {
                        if (!hasBlock(ix, nextY, iz) || visited.has(`${ix},${nextY},${iz}`)) {
                            break expandY;
                        }
                    }
                }
                y2++;
            }

            // Mark all gathered blocks as visited
            for (let ix = x1; ix <= x2; ix++) {
                for (let iy = y1; iy <= y2; iy++) {
                    for (let iz = z1; iz <= z2; iz++) {
                        visited.add(`${ix},${iy},${iz}`);
                    }
                }
            }

            // Generate Command
            if (x1 === x2 && y1 === y2 && z1 === z2) {
                commands.push(`setblock ~${x1} ~${y1} ~${z1} ${blockId}`);
            } else {
                commands.push(`fill ~${x1} ~${y1} ~${z1} ~${x2} ~${y2} ~${z2} ${blockId}`);
            }
        });
    });

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`[Export] Generated ${commands.length} commands in ${elapsed}s`);

    return commands;
};

/**
 * Generates a "One Command" string using falling blocks stack.
 * Note: Limited by command block char limit (32k).
 * 
 * Version differences:
 * - 1.8: FallingSand + command_block with TileEntityData, uses RIDING tag (nested)
 *        Structure: redstone_block -> fill_command -> building_commands (top to bottom)
 * - 1.9-1.10: FallingSand, MinecartCommandBlock + activator_rail, uses PASSENGERS tag
 * - 1.11-1.12: falling_block, commandblock_minecart + activator_rail, uses PASSENGERS tag
 * - 1.13+: falling_block, command_block_minecart + activator_rail, BlockState format
 */
export const generateOneCommand = (blocks, targetVersion = '1.21') => {
    const versionConfig = getVersionConfig(targetVersion);
    const cmds = generateOptimizedCommands(blocks, targetVersion);

    // 1.8.x: Uses FallingSand + command_block with TileEntityData
    // Structure (from top to bottom when falling):
    // 1. redstone_block (top) - activates the command block below it
    // 2. command_block with /fill to create redstone column
    // 3. command_blocks with building commands
    // 4. last command_block (bottom)
    // 
    // Riding means "this entity is riding on top of the next entity"
    // So we build from bottom to top in the Riding chain
    if (versionConfig.id === '1.8') {
        const numCmds = cmds.length;
        // Calculate the fill command Y offset: need to fill from current position down to cover all command blocks
        // Stack height = numCmds + 1 (fill command block)
        const fillYEnd = -(numCmds + 1);
        
        // Build from bottom (innermost) to top (outermost)
        // Bottom: last building command
        let ridingChain = '';
        
        // Add all building commands from last to first
        for (let i = numCmds - 1; i >= 0; i--) {
            const safeCmd = cmds[i].replace(/"/g, '\\"');
            if (ridingChain === '') {
                ridingChain = `{id:FallingSand,Block:command_block,Time:1,TileEntityData:{Command:${safeCmd}}}`;
            } else {
                ridingChain = `{id:FallingSand,Block:command_block,Time:1,TileEntityData:{Command:${safeCmd}},Riding:${ridingChain}}`;
            }
        }
        
        // Add the fill command to create redstone column (this activates all command blocks)
        // /fill ~ ~-1 ~-1 ~ ~-N ~-1 redstone_block
        // The ~-1 in Z places the redstone column next to the command blocks
        ridingChain = `{id:FallingSand,Block:command_block,Time:1,TileEntityData:{Command:/fill ~ ~-1 ~-1 ~ ~${fillYEnd} ~-1 redstone_block},Riding:${ridingChain}}`;
        
        // Top: redstone_block to activate the first command block (the fill command)
        return `summon FallingSand ~ ~1 ~ {Block:redstone_block,Time:1,Riding:${ridingChain}}`;
    }
    
    // 1.9-1.10: Uses Passengers tag with old entity IDs (FallingSand, MinecartCommandBlock)
    if (versionConfig.usesOldEntityIds) {
        const commandMinecarts = cmds.map(cmd => {
            const safeCmd = cmd.replace(/"/g, '\\"');
            return `{id:MinecartCommandBlock,Command:"${safeCmd}"}`;
        });
        
        // Cleanup commands
        commandMinecarts.push(`{id:MinecartCommandBlock,Command:"fill ~ ~-3 ~ ~ ~ ~ air"}`);
        commandMinecarts.push(`{id:MinecartCommandBlock,Command:"kill @e[type=MinecartCommandBlock,r=3]"}`);
        
        // 1.9-1.10 structure: FallingSand with Passengers
        return `summon FallingSand ~ ~2 ~ {Block:command_block,Time:1,TileEntityData:{Command:""},Passengers:[{id:FallingSand,Block:redstone_block,Time:1,Passengers:[{id:FallingSand,Block:activator_rail,Time:1,Passengers:[${commandMinecarts.join(',')}]}]}]}`;
    }
    
    // 1.11-1.12: New entity IDs (lowercase) but old Block: format
    if (versionConfig.usesNumericIds) {
        const commandMinecarts = cmds.map(cmd => {
            const safeCmd = cmd.replace(/"/g, '\\"');
            return `{id:commandblock_minecart,Command:"${safeCmd}"}`;
        });
        
        // Cleanup commands
        commandMinecarts.push(`{id:commandblock_minecart,Command:"fill ~ ~-3 ~ ~ ~ ~ air"}`);
        commandMinecarts.push(`{id:commandblock_minecart,Command:"kill @e[type=commandblock_minecart,r=3]"}`);
        commandMinecarts.push(`{id:commandblock_minecart,Command:"kill @e[type=falling_block,r=3]"}`);
        
        // 1.11-1.12 structure
        return `summon falling_block ~ ~2 ~ {Block:command_block,Time:1,TileEntityData:{Command:""},Passengers:[{id:falling_block,Block:redstone_block,Time:1,Passengers:[{id:falling_block,Block:activator_rail,Time:1,Passengers:[${commandMinecarts.join(',')}]}]}]}`;
    }

    // 1.13+ Modern format with BlockState
    const passengers = cmds.map(cmd => {
        const safeCmd = cmd.replace(/"/g, '\\"');
        return `{id:"command_block_minecart",Command:"${safeCmd}"}`;
    });

    // Cleanup commands
    passengers.push(`{id:"command_block_minecart",Command:"setblock ~ ~-2 ~ air"}`);
    passengers.push(`{id:"command_block_minecart",Command:"kill @e[type=command_block_minecart,distance=..5]"}`);
    passengers.push(`{id:"command_block_minecart",Command:"kill @e[type=falling_block,distance=..5]"}`);
    passengers.push(`{id:"command_block_minecart",Command:"kill @e[type=armor_stand,distance=..5]"}`);

    // 1.13+ structure with BlockState
    return `summon falling_block ~ ~2 ~ {BlockState:{Name:"command_block"},Time:1,TileEntityData:{Command:""},Passengers:[{id:"falling_block",BlockState:{Name:"redstone_block"},Time:1,Passengers:[{id:"falling_block",BlockState:{Name:"activator_rail"},Time:1,Passengers:[${passengers.join(',')}]}]}]}`;
};


/**
 * Exports to .mcfunction file (Old feature, kept for compatibility if needed)
 */
export const exportToMcFunction = (blocks, filename = 'structure') => {
    // ... existing logic if you want to keep it ...
    const cmds = generateOptimizedCommands(blocks);
    const content = cmds.join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.mcfunction';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Export to NBT Structure (.nbt) - Vanilla Minecraft format
 * 
 * Structure file format (Java Edition):
 * - DataVersion: Int - The data version of the game
 * - size: List<Int> - [x, y, z] dimensions
 * - palette: List<Compound> - Block state palette
 *   - Name: String - Block identifier (e.g., "minecraft:stone")
 *   - Properties: Compound (optional) - Block state properties
 * - blocks: List<Compound> - Block entries
 *   - pos: List<Int> - [x, y, z] position relative to structure origin
 *   - state: Int - Index into palette
 *   - nbt: Compound (optional) - Block entity data
 * - entities: List<Compound> - Entity data (empty for now)
 * 
 * Reference: https://minecraft.wiki/w/Structure_file
 */
export const exportToNBTStructure = async (blocks, filename = 'structure', targetVersion = '1.21') => {
    if (!blocks || blocks.length === 0) {
        console.error('No blocks to export!');
        return;
    }

    const versionConfig = getVersionConfig(targetVersion);

    // Calculate bounds
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    blocks.forEach(b => {
        const [x, y, z] = b.position;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    });

    const sizeX = maxX - minX + 1;
    const sizeY = maxY - minY + 1;
    const sizeZ = maxZ - minZ + 1;

    // Create block palette
    const paletteMap = new Map();
    const palette = [];

    blocks.forEach(b => {
        const blockName = formatBlock(b, targetVersion).split('[')[0]; // Get base name e.g. minecraft:stone
        const props = parseProperties(b.properties);
        const key = JSON.stringify({ Name: blockName, Properties: props });

        if (!paletteMap.has(key)) {
            paletteMap.set(key, palette.length);
            palette.push({
                Name: blockName,
                Properties: Object.keys(props).length > 0 ? props : undefined
            });
        }
    });

    // Create block list
    // IMPORTANT: pos must be List<Int> (TAG_List of TAG_Int), NOT Int32Array (TAG_Int_Array)
    // Using plain arrays with Int32 ensures nbtify writes them as TAG_List
    const blockList = blocks.map(b => {
        const blockName = formatBlock(b, targetVersion).split('[')[0];
        const props = parseProperties(b.properties);
        const key = JSON.stringify({ Name: blockName, Properties: props });
        const paletteIndex = paletteMap.get(key);

        return {
            pos: [
                new Int32(b.position[0] - minX),
                new Int32(b.position[1] - minY),
                new Int32(b.position[2] - minZ)
            ],
            state: new Int32(paletteIndex)
        };
    });

    // Structure format uses unnamed root tag
    // IMPORTANT: size must be List<Int> (TAG_List of TAG_Int), NOT Int32Array (TAG_Int_Array)
    const structure = {
        DataVersion: new Int32(versionConfig.dataVersion),
        size: [new Int32(sizeX), new Int32(sizeY), new Int32(sizeZ)],
        palette: palette,
        blocks: blockList,
        entities: []
    };

    try {
        const buffer = await write(structure);
        const compressed = gzipSync(buffer);
        downloadBlob(new Blob([compressed]), `${filename}.nbt`);
        console.log('NBT Structure exported successfully');
    } catch (err) {
        console.error('Failed to export NBT:', err);
    }
};

/**
 * Export to WorldEdit Schematic (.schem) format
 * Implements Sponge Schematic Format Version 3
 * Reference: https://github.com/SpongePowered/Schematic-Specification
 * 
 * V3 Changes from V2:
 * - Palette and BlockData moved inside "Blocks" compound
 * - Added support for 3D biomes in "Biomes" compound
 */
export const exportToWorldEdit = async (blocks, filename = 'structure', targetVersion = '1.21') => {
    if (!blocks || blocks.length === 0) {
        console.error('No blocks to export!');
        return;
    }

    const versionConfig = getVersionConfig(targetVersion);

    // Calculate bounds
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    blocks.forEach(b => {
        const [x, y, z] = b.position;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    });

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const length = maxZ - minZ + 1;

    // Build palette (String -> Int)
    // Palette maps block state strings to indices
    const palette = {};
    const paletteMap = new Map();
    let paletteIndex = 0;

    // Air should be index 0 (convention)
    palette["minecraft:air"] = new Int32(paletteIndex++);
    paletteMap.set("minecraft:air", 0);

    blocks.forEach(b => {
        const blockState = formatBlock(b, targetVersion);
        if (!paletteMap.has(blockState)) {
            palette[blockState] = new Int32(paletteIndex);
            paletteMap.set(blockState, paletteIndex++);
        }
    });

    // Create block data array
    // Index formula: (y * length + z) * width + x
    const volume = width * height * length;
    const dataArray = new Array(volume).fill(0); // 0 = air

    blocks.forEach(b => {
        const x = b.position[0] - minX;
        const y = b.position[1] - minY;
        const z = b.position[2] - minZ;
        const index = (y * length + z) * width + x;
        const blockState = formatBlock(b, targetVersion);
        dataArray[index] = paletteMap.get(blockState);
    });

    // VarInt Encoding for BlockData
    // Each palette index is encoded as a VarInt
    const blockData = [];
    dataArray.forEach(val => {
        let v = val;
        while ((v & ~0x7F) !== 0) {
            blockData.push((v & 0x7F) | 0x80);
            v >>>= 7;
        }
        blockData.push(v & 0x7F);
    });

    // Build schematic structure according to Sponge Schematic Format v3
    // Key difference: Palette and Data are now inside "Blocks" compound
    const schematic = {
        Version: new Int32(3),
        DataVersion: new Int32(versionConfig.dataVersion),
        Width: new Int16(width),
        Height: new Int16(height),
        Length: new Int16(length),
        Offset: new Int32Array([0, 0, 0]),
        Metadata: {
            WEOffsetX: new Int32(0),
            WEOffsetY: new Int32(0),
            WEOffsetZ: new Int32(0)
        },
        // V3: Blocks compound contains Palette and Data
        Blocks: {
            Palette: palette,
            Data: new Int8Array(blockData)
        }
    };

    try {
        const buffer = await write(schematic, { name: "Schematic" });
        const compressed = gzipSync(buffer);
        downloadBlob(new Blob([compressed]), `${filename}.schem`);
        console.log('WorldEdit Schematic (v3) exported successfully');
    } catch (err) {
        console.error('Failed to export Schematic:', err);
    }
};

/**
 * Export to Litematica (.litematic)
 */
export const exportToLitematica = async (blocks, filename = 'structure', targetVersion = '1.21') => {
    if (!blocks || blocks.length === 0) {
        console.error('No blocks to export!');
        return;
    }

    const versionConfig = getVersionConfig(targetVersion);

    // Calculate bounds
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    blocks.forEach(b => {
        const [x, y, z] = b.position;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    });

    const sizeX = maxX - minX + 1;
    const sizeY = maxY - minY + 1;
    const sizeZ = maxZ - minZ + 1;

    // Build palette
    const blockStatePalette = [{ Name: "minecraft:air" }];
    const paletteMap = new Map();
    paletteMap.set("minecraft:air", 0);

    blocks.forEach(b => {
        const blockName = formatBlock(b, targetVersion).split('[')[0];
        const props = parseProperties(b.properties);
        const key = JSON.stringify({ Name: blockName, Properties: props });

        if (!paletteMap.has(key)) {
            paletteMap.set(key, blockStatePalette.length);
            blockStatePalette.push({
                Name: blockName,
                Properties: Object.keys(props).length > 0 ? props : undefined
            });
        }
    });

    // Bit Packing for BlockStates
    const bitsPerIndex = Math.max(2, Math.ceil(Math.log2(blockStatePalette.length)));
    const volume = sizeX * sizeY * sizeZ;
    const blockStates = new Array(volume).fill(0);

    blocks.forEach(b => {
        const x = b.position[0] - minX;
        const y = b.position[1] - minY;
        const z = b.position[2] - minZ;
        const index = (y * sizeZ + z) * sizeX + x; // Litematica order: Y, Z, X
        const blockName = formatBlock(b, targetVersion).split('[')[0];
        const props = parseProperties(b.properties);
        const key = JSON.stringify({ Name: blockName, Properties: props });
        blockStates[index] = paletteMap.get(key);
    });

    // Pack into BigInt64Array
    const packed = [];
    let currentLong = 0n;
    let bitsUsed = 0;
    const mask = (1n << BigInt(bitsPerIndex)) - 1n;

    for (const val of blockStates) {
        const bigVal = BigInt(val) & mask;
        if (bitsUsed + bitsPerIndex > 64) {
            packed.push(currentLong);
            currentLong = bigVal;
            bitsUsed = bitsPerIndex;
        } else {
            currentLong |= (bigVal << BigInt(bitsUsed));
            bitsUsed += bitsPerIndex;
        }
    }
    if (bitsUsed > 0) packed.push(currentLong);

    const litematic = {
        Version: new Int32(5),
        MinecraftDataVersion: new Int32(versionConfig.dataVersion),
        Metadata: {
            Name: filename,
            Author: "MC AI Builder",
            Description: `Generated by AI for Minecraft ${versionConfig.label}`,
            RegionCount: new Int32(1),
            TimeCreated: BigInt(Date.now()),
            TimeModified: BigInt(Date.now()),
            TotalBlocks: new Int32(blocks.length),
            TotalVolume: new Int32(volume),
            EnclosingSize: {
                x: new Int32(sizeX),
                y: new Int32(sizeY),
                z: new Int32(sizeZ)
            }
        },
        Regions: {
            [filename]: {
                Position: { x: new Int32(0), y: new Int32(0), z: new Int32(0) },
                Size: { x: new Int32(sizeX), y: new Int32(sizeY), z: new Int32(sizeZ) },
                BlockStatePalette: blockStatePalette,
                BlockStates: new BigInt64Array(packed),
                TileEntities: [],
                Entities: [],
                PendingBlockTicks: [],
                PendingFluidTicks: []
            }
        }
    };

    try {
        const buffer = await write(litematic);
        const compressed = gzipSync(buffer);
        downloadBlob(new Blob([compressed]), `${filename}.litematic`);
        console.log('Litematica exported successfully');
    } catch (err) {
        console.error('Failed to export Litematica:', err);
    }
};

/**
 * Export to Axiom Blueprint (.bp)
 * 
 * Axiom Blueprint format (reverse engineered):
 * 1. Header (8 bytes): 0x0a + 4 bytes checksum/length + 3 bytes info
 * 2. Metadata NBT (uncompressed): ThumbnailYaw, ContainsAir, Version, etc.
 * 3. PNG Thumbnail: 4 bytes length + PNG data
 * 4. Block Data (Gzip compressed NBT): 4 bytes length + Gzip(NBT)
 *    - DataVersion: game version
 *    - BlockRegion: list of 16x16x16 chunks with palette and block data
 *    - BlockEntities: list of block entities
 *    - Entities: list of entities
 */
export const exportToAxiom = async (blocks, filename = 'structure', targetVersion = '1.21') => {
    if (!blocks || blocks.length === 0) {
        console.error('No blocks to export!');
        return;
    }

    const versionConfig = getVersionConfig(targetVersion);

    // Calculate bounds
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    blocks.forEach(b => {
        const [x, y, z] = b.position;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    });

    // Normalize positions to start from 0
    const normalizedBlocks = blocks.map(b => ({
        ...b,
        position: [b.position[0] - minX, b.position[1] - minY, b.position[2] - minZ]
    }));

    // Group blocks into 16x16x16 regions (Axiom uses chunk-based storage)
    const REGION_SIZE = 16;
    const regions = new Map();

    normalizedBlocks.forEach(b => {
        const [x, y, z] = b.position;
        const regionX = Math.floor(x / REGION_SIZE);
        const regionY = Math.floor(y / REGION_SIZE);
        const regionZ = Math.floor(z / REGION_SIZE);
        const regionKey = `${regionX},${regionY},${regionZ}`;

        if (!regions.has(regionKey)) {
            regions.set(regionKey, {
                x: regionX,
                y: regionY,
                z: regionZ,
                blocks: []
            });
        }
        regions.get(regionKey).blocks.push({
            ...b,
            localPos: [x % REGION_SIZE, y % REGION_SIZE, z % REGION_SIZE]
        });
    });

    // Build BlockRegion list
    const blockRegionList = [];

    for (const [, region] of regions) {
        // Build palette for this region
        const palette = [];
        const paletteMap = new Map();

        // Add structure_void as first entry (index 0) - this is Axiom's "air" equivalent
        palette.push({ Name: "minecraft:structure_void" });
        paletteMap.set("minecraft:structure_void", 0);

        region.blocks.forEach(b => {
            const blockState = formatBlock(b, targetVersion);
            const blockName = blockState.split('[')[0];
            const propsStr = blockState.includes('[') ? blockState.slice(blockState.indexOf('[') + 1, -1) : '';
            const props = parseProperties(propsStr);

            const paletteEntry = { Name: blockName };
            if (Object.keys(props).length > 0) {
                paletteEntry.Properties = props;
            }

            const key = JSON.stringify(paletteEntry);
            if (!paletteMap.has(key)) {
                paletteMap.set(key, palette.length);
                palette.push(paletteEntry);
            }
        });

        // Build block data array (16x16x16 = 4096 blocks)
        const blockArray = new Array(4096).fill(0); // 0 = structure_void

        region.blocks.forEach(b => {
            const [lx, ly, lz] = b.localPos;
            const index = ly * 256 + lz * 16 + lx; // Y * 256 + Z * 16 + X
            const blockState = formatBlock(b, targetVersion);
            const blockName = blockState.split('[')[0];
            const propsStr = blockState.includes('[') ? blockState.slice(blockState.indexOf('[') + 1, -1) : '';
            const props = parseProperties(propsStr);

            const paletteEntry = { Name: blockName };
            if (Object.keys(props).length > 0) {
                paletteEntry.Properties = props;
            }

            const key = JSON.stringify(paletteEntry);
            blockArray[index] = paletteMap.get(key);
        });

        // Encode block data as packed long array (Minecraft 1.16+ format)
        // IMPORTANT: Minecraft 1.16+ does NOT allow values to span across Long boundaries
        // Each Long stores floor(64 / bitsPerBlock) complete values
        const bitsPerBlock = Math.max(4, Math.ceil(Math.log2(palette.length)));
        const blocksPerLong = Math.floor(64 / bitsPerBlock);
        const longsNeeded = Math.ceil(4096 / blocksPerLong);
        const packedData = new BigInt64Array(longsNeeded);

        for (let i = 0; i < 4096; i++) {
            const value = BigInt(blockArray[i]);
            const longIndex = Math.floor(i / blocksPerLong);
            const indexInLong = i % blocksPerLong;
            const bitOffset = indexInLong * bitsPerBlock;
            
            packedData[longIndex] |= value << BigInt(bitOffset);
        }

        // Create region entry
        const regionEntry = {
            BlockStates: {
                palette: palette
            },
            X: new Int32(region.x),
            Y: new Int32(region.y),
            Z: new Int32(region.z)
        };

        // Only add data if there are non-void blocks
        if (palette.length > 1) {
            regionEntry.BlockStates.data = packedData;
        }

        blockRegionList.push(regionEntry);
    }

    // Build the block data NBT structure
    const blockDataNBT = {
        DataVersion: new Int32(versionConfig.dataVersion),
        BlockRegion: blockRegionList,
        BlockEntities: [], // Empty for now
        Entities: [] // Empty for now
    };

    // Write and compress block data
    let compressedBlockData;
    try {
        const blockDataBuffer = await write(blockDataNBT, { name: "" });
        compressedBlockData = gzipSync(blockDataBuffer);
    } catch (err) {
        console.error('Failed to write block data NBT:', err);
        return;
    }

    // Build metadata NBT
    const metadataNBT = {
        ThumbnailYaw: 135.0,  // Float
        ContainsAir: new Int8(1),
        Version: 1n,  // Long (BigInt)
        LockedThumbnail: new Int8(0),
        BlockCount: new Int32(blocks.length),
        Author: "MC AI Builder",
        Tags: [],
        Name: filename,
        ThumbnailPitch: 30.0  // Float
    };

    // Write metadata NBT (uncompressed)
    let metadataBuffer;
    try {
        metadataBuffer = await write(metadataNBT, { name: "" });
    } catch (err) {
        console.error('Failed to write metadata NBT:', err);
        return;
    }

    // Render thumbnail (96x96 PNG with watermark)
    let thumbnailPNG;
    try {
        thumbnailPNG = await renderThumbnail(blocks, 96);
        console.log('Thumbnail rendered:', thumbnailPNG.length, 'bytes');
    } catch (err) {
        console.warn('Failed to render thumbnail, using placeholder:', err);
        thumbnailPNG = createPlaceholderPNG();
    }

    // Assemble the final .bp file
    const totalSize = 8 + metadataBuffer.length + 4 + thumbnailPNG.length + 4 + compressedBlockData.length;
    const finalBuffer = new Uint8Array(totalSize);
    let offset = 0;

    // Header (8 bytes)
    // Byte 0: 0x0a (format identifier)
    // Bytes 1-4: Magic number (0xe5bb3600) - required for Axiom to recognize the file
    //            Discovered through reverse engineering - only this exact value works
    // Bytes 5-7: Metadata NBT size (3 bytes, big endian)
    const headerView = new DataView(finalBuffer.buffer);
    finalBuffer[0] = 0x0a;
    // Bytes 1-4: Axiom magic number (must be exactly 0xe5bb3600)
    finalBuffer[1] = 0xe5;
    finalBuffer[2] = 0xbb;
    finalBuffer[3] = 0x36;
    finalBuffer[4] = 0x00;
    // Bytes 5-7: Metadata NBT size (3 bytes big endian)
    const metadataSize = metadataBuffer.length;
    finalBuffer[5] = (metadataSize >> 16) & 0xff;
    finalBuffer[6] = (metadataSize >> 8) & 0xff;
    finalBuffer[7] = metadataSize & 0xff;
    offset = 8;

    // Metadata NBT
    finalBuffer.set(new Uint8Array(metadataBuffer), offset);
    offset += metadataBuffer.length;

    // PNG length (4 bytes, big endian)
    headerView.setUint32(offset, thumbnailPNG.length, false);
    offset += 4;

    // PNG data
    finalBuffer.set(thumbnailPNG, offset);
    offset += thumbnailPNG.length;

    // Compressed block data length (4 bytes, big endian)
    headerView.setUint32(offset, compressedBlockData.length, false);
    offset += 4;

    // Compressed block data
    finalBuffer.set(compressedBlockData, offset);

    // Download the file
    downloadBlob(new Blob([finalBuffer]), `${filename}.bp`);
    console.log('Axiom Blueprint exported successfully');
};

// Create a minimal 1x1 transparent PNG
function createPlaceholderPNG() {
    // Minimal 1x1 transparent PNG (67 bytes)
    return new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // width = 1
        0x00, 0x00, 0x00, 0x01, // height = 1
        0x08, 0x06, // 8-bit RGBA
        0x00, 0x00, 0x00, // compression, filter, interlace
        0x1F, 0x15, 0xC4, 0x89, // CRC
        0x00, 0x00, 0x00, 0x0A, // IDAT length
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // compressed data
        0x0D, 0x0A, 0x2D, 0xB4, // CRC
        0x00, 0x00, 0x00, 0x00, // IEND length
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
}

// Helper: Parse block properties string to object
function parseProperties(propsStr) {
    if (!propsStr || propsStr === '0') return {};
    const props = {};
    const pairs = propsStr.split(',');
    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
            props[key.trim()] = value.trim();
        }
    });
    return props;
}

// Helper: Download binary file
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export to Complete Minecraft Datapack (.zip)
 * Creates a ready-to-use datapack that players can directly place in their saves/world/datapacks folder
 * After placing the datapack, players just need to run `/function ai_structure:build` in-game
 * Now supports multi-version export (1.8.x - 1.21+)
 */
export const exportToDatapack = async (blocks, filename = 'my_structure', targetVersion = '1.21') => {
    if (!blocks || blocks.length === 0) {
        alert('No blocks to export!');
        return;
    }

    const versionConfig = getVersionConfig(targetVersion);
    
    // Sanitize filename (remove spaces, special chars)
    const safeName = filename.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const zip = new JSZip();

    // Use pack_format from version config
    const packFormat = versionConfig.packFormat;

    // 1. Create pack.mcmeta (datapack metadata file)
    const packMcmeta = {
        pack: {
            pack_format: packFormat,
            description: `AI Generated Structure - ${filename}\nFor Minecraft ${versionConfig.label}\nCreated by MC AI Builder`
        }
    };
    zip.file('pack.mcmeta', JSON.stringify(packMcmeta, null, 4));

    // 2. Create data folder structure
    const dataFolder = zip.folder('data');

    // 3. Create namespace folder (using safe filename as namespace)
    const namespaceFolder = dataFolder.folder(safeName);
    
    // IMPORTANT: Folder name varies by version
    // 1.21+ uses 'function' (singular)
    // 1.20.x and below uses 'functions' (plural) - actually 1.21 changed this
    const functionFolderName = versionConfig.id === '1.21' ? 'function' : 'functions';
    const functionsFolder = namespaceFolder.folder(functionFolderName);

    // 4. Generate optimized commands for target version
    const commands = generateOptimizedCommands(blocks, targetVersion);

    // Split commands into multiple files if needed (each file max 65536 commands)
    const COMMANDS_PER_FILE = 60000; // Safe limit
    const numFiles = Math.ceil(commands.length / COMMANDS_PER_FILE);

    // Always create build.mcfunction - handle 0, 1, or multiple file cases
    if (numFiles <= 1) {
        // Single file (or no commands) - simple case
        let buildContent = `# AI Generated Structure\n# Target: Minecraft ${versionConfig.label}\n# Blocks: ${blocks.length}\n\n`;
        if (commands.length > 0) {
            buildContent += commands.join('\n');
        } else {
            buildContent += '# No blocks to place\n';
        }
        
        // tellraw format varies by version
        if (versionConfig.usesNumericIds) {
            buildContent += `\n\n# Success\nsay [Builder] Done! (${blocks.length} blocks)`;
        } else {
            buildContent += `\n\n# Success\ntellraw @a {"text":"[Builder] Done! (${blocks.length} blocks)","color":"green"}`;
        }
        functionsFolder.file('build.mcfunction', buildContent);
    } else {
        // Multiple files needed
        for (let i = 0; i < numFiles; i++) {
            const start = i * COMMANDS_PER_FILE;
            const end = Math.min((i + 1) * COMMANDS_PER_FILE, commands.length);
            const chunk = commands.slice(start, end);

            functionsFolder.file(`build_part${i + 1}.mcfunction`, chunk.join('\n'));
        }

        // Create main build.mcfunction that calls all parts
        let mainBuildContent = '# Multi-part build\n';
        mainBuildContent += `# Parts: ${numFiles}\n`;
        mainBuildContent += `# Blocks: ${blocks.length}\n\n`;

        for (let i = 0; i < numFiles; i++) {
            mainBuildContent += `function ${safeName}:build_part${i + 1}\n`;
        }
        mainBuildContent += `\n# Success\ntellraw @a {"text":"[Builder] Done! (${blocks.length} blocks)","color":"green"}`;

        functionsFolder.file('build.mcfunction', mainBuildContent);
    }

    // 5. Create load.mcfunction
    const loadContent = `# Loaded
tellraw @a {"text":"[Info] Datapack Ready!","color":"aqua"}
tellraw @a {"text":"Use: /function ${safeName}:build","color":"yellow"}`;
    functionsFolder.file('load.mcfunction', loadContent);

    // 6. Create clear.mcfunction
    const clearCommands = [];

    // Calculate bounds
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    blocks.forEach(b => {
        minX = Math.min(minX, b.position[0]);
        minY = Math.min(minY, b.position[1]);
        minZ = Math.min(minZ, b.position[2]);
        maxX = Math.max(maxX, b.position[0]);
        maxY = Math.max(maxY, b.position[1]);
        maxZ = Math.max(maxZ, b.position[2]);
    });

    const clearContent = `# Clear
fill ~${minX} ~${minY} ~${minZ} ~${maxX} ~${maxY} ~${maxZ} air
tellraw @a {"text":"[Info] Structure Cleared","color":"red"}`;
    functionsFolder.file('clear.mcfunction', clearContent);

    // 7. Create tags to auto-load the datapack
    // This MUST be in data/minecraft/tags/function/ (singular for 1.21+)
    const minecraftFolder = dataFolder.folder('minecraft');
    const minecraftTagsFolder = minecraftFolder.folder('tags').folder('function');
    minecraftTagsFolder.file('load.json', JSON.stringify({
        values: [`${safeName}:load`]
    }, null, 2));

    // 8. Add README.txt for user instructions
    const readmeContent = `AI Generated Minecraft Structure Datapack
=========================================

Structure Name: ${filename}
Total Blocks: ${blocks.length}
Generated: ${new Date().toLocaleString()}

INSTALLATION:
1. Place this ZIP file in your Minecraft world's datapacks folder:
   .minecraft/saves/[YourWorldName]/datapacks/

2. In-game, reload datapacks:
   /reload

3. Build the structure at your current position:
   /function ${safeName}:build

4. (Optional) To remove the structure:
   /function ${safeName}:clear

NOTES:
- The structure will be placed relative to where you stand
- Make sure you have enough space around you
- Commands will be placed relative to your position (~X ~Y ~Z)
- This datapack was generated by MC AI Builder

Enjoy your AI-generated structure! 🎮✨
`;
    zip.file('README.txt', readmeContent);

    // 9. Generate and download the ZIP file
    try {
        // Debug: Log the structure before generating
        console.log('=== Datapack Structure ===');
        console.log('Namespace:', safeName);
        console.log('Files:');
        zip.forEach((relativePath, file) => {
            console.log(`  - ${relativePath}`);
        });
        console.log('========================');

        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeName}_datapack.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Datapack generation error:', error);
    }
};
