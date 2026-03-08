/**
 * Parses the custom AI output format into structured block data.
 * 
 * Supports multiple formats:
 * 1. Single block: [<x,y,z>, block_name, properties]
 * 2. Fill region: [<x1,y1,z1><x2,y2,z2>, block_name, properties]
 * 3. Semantic single: [<x,y,z>, TYPE]  (No properties)
 * 4. Semantic region: [<x1,y1,z1><x2,y2,z2>, TYPE]  (No properties)
 * 
 * @param {string} text - The raw text input containing block definitions
 * @returns {Array} Array of block objects: { id, position: [x,y,z], type, properties }
 */
export const parseAIOutput = (text) => {
    const blocks = [];
    let blockId = 1;

    // === NEW: Semantic format regexes (no properties) ===

    // Semantic FILL format: [<x1,y1,z1><x2,y2,z2>, TYPE]
    const semanticFillRegex = /\[\s*<\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*>\s*<\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*>\s*,\s*([A-Z_]+)\s*\]/g;

    // Semantic SINGLE block format: [<x,y,z>, TYPE]
    const semanticSingleRegex = /\[\s*<\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*>\s*,\s*([A-Z_]+)\s*\]/g;

    // === Original format regexes (with properties) ===

    // Regex for FILL format: [<x1,y1,z1><x2,y2,z2>, block_name, properties]
    const fillRegex = /\[\s*<\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*>\s*<\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*>\s*,\s*([a-zA-Z0-9_:]+)\s*,\s*([^\]]+?)\s*\]/g;

    // NEW: FILL format without properties: [<x1,y1,z1><x2,y2,z2>, block_name]
    const fillNoPropsRegex = /\[\s*<\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*>\s*<\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*>\s*,\s*([a-z][a-z0-9_:]*)\s*\]/g;

    // Regex for SINGLE block format: [<x,y,z>, block_name, properties]
    const singleRegex = /\[\s*<\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*>\s*,\s*([a-zA-Z0-9_:]+)\s*,\s*([^\]]+?)\s*\]/g;

    // NEW: SINGLE block format without properties: [<x,y,z>, block_name]
    const singleNoPropsRegex = /\[\s*<\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*>\s*,\s*([a-z][a-z0-9_:]*)\s*\]/g;

    // Also support legacy format with ID: [id, <x,y,z>, block_name, properties]
    const legacyRegex = /\[\s*(\d+)\s*,\s*<\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*>\s*,\s*([a-zA-Z0-9_:]+)\s*,\s*([^\]]+?)\s*\]/g;

    // Track which parts of text we've already processed to avoid duplicates
    const processedRanges = [];

    const isOverlapping = (start, end) => {
        return processedRanges.some(([s, e]) =>
            (start >= s && start < e) || (end > s && end <= e) || (start <= s && end >= e)
        );
    };

    // ========== Process SEMANTIC FILL format first ==========
    let match;
    while ((match = semanticFillRegex.exec(text)) !== null) {
        if (isOverlapping(match.index, match.index + match[0].length)) continue;
        processedRanges.push([match.index, match.index + match[0].length]);

        const [_, x1, y1, z1, x2, y2, z2, type] = match;
        const minX = Math.min(parseInt(x1), parseInt(x2));
        const maxX = Math.max(parseInt(x1), parseInt(x2));
        const minY = Math.min(parseInt(y1), parseInt(y2));
        const maxY = Math.max(parseInt(y1), parseInt(y2));
        const minZ = Math.min(parseInt(z1), parseInt(z2));
        const maxZ = Math.max(parseInt(z1), parseInt(z2));

        // Expand the region into individual blocks
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    blocks.push({
                        id: blockId++,
                        position: [x, y, z],
                        type: type.trim().toUpperCase(), // Semantic types are uppercase
                        properties: '0'
                    });
                }
            }
        }
    }

    // ========== Process SEMANTIC SINGLE format ==========
    while ((match = semanticSingleRegex.exec(text)) !== null) {
        if (isOverlapping(match.index, match.index + match[0].length)) continue;
        processedRanges.push([match.index, match.index + match[0].length]);

        const [_, x, y, z, type] = match;
        blocks.push({
            id: blockId++,
            position: [parseInt(x), parseInt(y), parseInt(z)],
            type: type.trim().toUpperCase(),
            properties: '0'
        });
    }

    // ========== Process original FILL format (regions) ==========
    while ((match = fillRegex.exec(text)) !== null) {
        if (isOverlapping(match.index, match.index + match[0].length)) continue;
        processedRanges.push([match.index, match.index + match[0].length]);

        const [_, x1, y1, z1, x2, y2, z2, type, props] = match;
        const minX = Math.min(parseInt(x1), parseInt(x2));
        const maxX = Math.max(parseInt(x1), parseInt(x2));
        const minY = Math.min(parseInt(y1), parseInt(y2));
        const maxY = Math.max(parseInt(y1), parseInt(y2));
        const minZ = Math.min(parseInt(z1), parseInt(z2));
        const maxZ = Math.max(parseInt(z1), parseInt(z2));

        // Expand the region into individual blocks
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    blocks.push({
                        id: blockId++,
                        position: [x, y, z],
                        type: type.trim(),
                        properties: props.trim(),
                        // Store original region info for export optimization
                        _region: { from: [minX, minY, minZ], to: [maxX, maxY, maxZ] }
                    });
                }
            }
        }
    }

    // ========== Process legacy format (with explicit ID) ==========
    while ((match = legacyRegex.exec(text)) !== null) {
        if (isOverlapping(match.index, match.index + match[0].length)) continue;
        processedRanges.push([match.index, match.index + match[0].length]);

        const [_, id, x, y, z, type, props] = match;
        blocks.push({
            id: blockId++,
            position: [parseInt(x), parseInt(y), parseInt(z)],
            type: type.trim(),
            properties: props.trim()
        });
    }

    // ========== Process SINGLE block format (no ID prefix) ==========
    while ((match = singleRegex.exec(text)) !== null) {
        if (isOverlapping(match.index, match.index + match[0].length)) continue;
        processedRanges.push([match.index, match.index + match[0].length]);

        const [_, x, y, z, type, props] = match;
        blocks.push({
            id: blockId++,
            position: [parseInt(x), parseInt(y), parseInt(z)],
            type: type.trim(),
            properties: props.trim()
        });
    }

    // ========== NEW: Process FILL format without properties ==========
    while ((match = fillNoPropsRegex.exec(text)) !== null) {
        if (isOverlapping(match.index, match.index + match[0].length)) continue;
        processedRanges.push([match.index, match.index + match[0].length]);

        const [_, x1, y1, z1, x2, y2, z2, type] = match;
        const minX = Math.min(parseInt(x1), parseInt(x2));
        const maxX = Math.max(parseInt(x1), parseInt(x2));
        const minY = Math.min(parseInt(y1), parseInt(y2));
        const maxY = Math.max(parseInt(y1), parseInt(y2));
        const minZ = Math.min(parseInt(z1), parseInt(z2));
        const maxZ = Math.max(parseInt(z1), parseInt(z2));

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    blocks.push({
                        id: blockId++,
                        position: [x, y, z],
                        type: type.trim(),
                        properties: '0'
                    });
                }
            }
        }
    }

    // ========== NEW: Process SINGLE block format without properties ==========
    while ((match = singleNoPropsRegex.exec(text)) !== null) {
        if (isOverlapping(match.index, match.index + match[0].length)) continue;
        processedRanges.push([match.index, match.index + match[0].length]);

        const [_, x, y, z, type] = match;
        blocks.push({
            id: blockId++,
            position: [parseInt(x), parseInt(y), parseInt(z)],
            type: type.trim(),
            properties: '0'
        });
    }

    return blocks;
};

/**
 * Generates a Minecraft /setblock command for a given block.
 * @param {object} block - The block object
 * @returns {string} The Minecraft command
 */
export const generateCommand = (block) => {
    const { position, type, properties } = block;
    const [x, y, z] = position;

    let state = "";
    if (properties && properties !== "0" && properties !== "default") {
        if (properties.includes("=")) {
            state = `[${properties}]`;
        }
    }

    // Using relative coordinates ~ for easy pasting near player
    return `/setblock ~${x} ~${y} ~${z} minecraft:${type}${state}`;
};

/**
 * Generates optimized Minecraft commands, using /fill for regions where possible.
 * @param {Array} blocks - Array of block objects
 * @returns {string} Minecraft commands (potentially using /fill)
 */
export const generateStructureCommand = (blocks) => {
    if (!blocks.length) return '';

    // Group blocks by type+properties to find potential fill regions
    const commands = [];
    const processed = new Set();

    // First, try to find rectangular regions of same block type
    const blockMap = new Map();
    blocks.forEach((block, index) => {
        const key = `${block.type}|${block.properties}`;
        if (!blockMap.has(key)) blockMap.set(key, []);
        blockMap.get(key).push({ ...block, index });
    });

    // For each block type, try to find rectangular regions
    for (const [key, sameTypeBlocks] of blockMap) {
        const [type, properties] = key.split('|');

        // Create a 3D grid to find regions
        const posSet = new Set(sameTypeBlocks.map(b => `${b.position[0]},${b.position[1]},${b.position[2]}`));
        const positions = sameTypeBlocks.map(b => ({ pos: b.position, index: b.index }));

        // Simple greedy algorithm: find rectangular regions
        const used = new Set();

        for (const { pos, index } of positions) {
            if (used.has(index)) continue;

            // Try to expand from this position
            let [x1, y1, z1] = pos;
            let [x2, y2, z2] = pos;

            // Expand in X direction
            while (posSet.has(`${x2 + 1},${y1},${z1}`)) x2++;

            // Expand in Z direction (check full X range)
            let canExpandZ = true;
            while (canExpandZ) {
                for (let x = x1; x <= x2; x++) {
                    if (!posSet.has(`${x},${y1},${z2 + 1}`)) {
                        canExpandZ = false;
                        break;
                    }
                }
                if (canExpandZ) z2++;
            }

            // Expand in Y direction (check full XZ plane)
            let canExpandY = true;
            while (canExpandY) {
                for (let x = x1; x <= x2; x++) {
                    for (let z = z1; z <= z2; z++) {
                        if (!posSet.has(`${x},${y2 + 1},${z}`)) {
                            canExpandY = false;
                            break;
                        }
                    }
                    if (!canExpandY) break;
                }
                if (canExpandY) y2++;
            }

            // Mark all blocks in this region as used
            const regionBlocks = [];
            for (let x = x1; x <= x2; x++) {
                for (let y = y1; y <= y2; y++) {
                    for (let z = z1; z <= z2; z++) {
                        const foundBlock = sameTypeBlocks.find(
                            b => b.position[0] === x && b.position[1] === y && b.position[2] === z
                        );
                        if (foundBlock) {
                            used.add(foundBlock.index);
                            regionBlocks.push(foundBlock);
                        }
                    }
                }
            }

            // Generate command
            let state = "";
            if (properties && properties !== "0" && properties !== "default") {
                if (properties.includes("=")) {
                    state = `[${properties}]`;
                }
            }

            if (regionBlocks.length > 1) {
                // Use /fill for regions
                commands.push(`/fill ~${x1} ~${y1} ~${z1} ~${x2} ~${y2} ~${z2} minecraft:${type}${state}`);
            } else {
                // Use /setblock for single blocks
                commands.push(`/setblock ~${x1} ~${y1} ~${z1} minecraft:${type}${state}`);
            }
        }
    }

    return commands.join('\n');
};
