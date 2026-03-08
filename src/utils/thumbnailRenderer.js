/**
 * Thumbnail Renderer for Axiom Blueprint Export
 * Generates isometric 45-degree view PNG without Canvas/WebGL
 */

// Block color mapping (RGB values)
const BLOCK_COLORS = {
    // Stone variants
    'stone': [125, 125, 125],
    'cobblestone': [107, 107, 107],
    'stone_bricks': [122, 122, 122],
    'mossy_stone_bricks': [100, 115, 100],
    'cracked_stone_bricks': [118, 118, 118],
    'smooth_stone': [158, 158, 158],
    'andesite': [136, 136, 136],
    'diorite': [188, 188, 188],
    'granite': [149, 103, 85],
    'polished_andesite': [132, 135, 132],
    'polished_diorite': [192, 192, 192],
    'polished_granite': [154, 106, 89],
    
    // Deepslate
    'deepslate': [80, 80, 82],
    'deepslate_bricks': [70, 70, 72],
    'deepslate_tiles': [54, 54, 56],
    'cobbled_deepslate': [77, 77, 80],
    'polished_deepslate': [72, 72, 74],
    
    // Dirt & Grass
    'dirt': [139, 105, 20],
    'grass_block': [93, 156, 58],
    'podzol': [122, 89, 51],
    'mycelium': [111, 99, 107],
    'coarse_dirt': [119, 85, 59],
    'rooted_dirt': [144, 113, 80],
    'mud': [60, 57, 61],
    
    // Wood planks
    'oak_planks': [184, 148, 95],
    'spruce_planks': [107, 80, 48],
    'birch_planks': [215, 203, 141],
    'dark_oak_planks': [67, 43, 20],
    'jungle_planks': [160, 115, 81],
    'acacia_planks': [168, 90, 50],
    'mangrove_planks': [117, 54, 48],
    'cherry_planks': [226, 178, 172],
    'bamboo_planks': [194, 175, 83],
    'crimson_planks': [101, 48, 70],
    'warped_planks': [43, 104, 99],
    
    // Logs
    'oak_log': [107, 80, 48],
    'spruce_log': [61, 40, 23],
    'birch_log': [212, 212, 212],
    'dark_oak_log': [60, 46, 26],
    'jungle_log': [85, 68, 25],
    'acacia_log': [103, 96, 86],
    'mangrove_log': [84, 66, 41],
    'cherry_log': [53, 27, 37],

    // Terracotta
    'terracotta': [152, 94, 67],
    'white_terracotta': [210, 178, 161],
    'orange_terracotta': [162, 84, 38],
    'magenta_terracotta': [149, 88, 109],
    'light_blue_terracotta': [113, 109, 138],
    'yellow_terracotta': [186, 133, 35],
    'lime_terracotta': [103, 118, 53],
    'pink_terracotta': [162, 78, 79],
    'gray_terracotta': [58, 42, 36],
    'light_gray_terracotta': [135, 107, 98],
    'cyan_terracotta': [86, 91, 91],
    'purple_terracotta': [118, 70, 86],
    'blue_terracotta': [74, 60, 91],
    'brown_terracotta': [77, 51, 36],
    'green_terracotta': [76, 83, 42],
    'red_terracotta': [143, 61, 47],
    'black_terracotta': [37, 23, 16],
    
    // Concrete
    'white_concrete': [207, 213, 214],
    'orange_concrete': [224, 97, 1],
    'magenta_concrete': [169, 48, 159],
    'light_blue_concrete': [36, 137, 199],
    'yellow_concrete': [241, 175, 21],
    'lime_concrete': [94, 169, 24],
    'pink_concrete': [214, 101, 143],
    'gray_concrete': [55, 58, 62],
    'light_gray_concrete': [125, 125, 115],
    'cyan_concrete': [21, 119, 136],
    'purple_concrete': [100, 32, 156],
    'blue_concrete': [45, 47, 143],
    'brown_concrete': [96, 60, 32],
    'green_concrete': [73, 91, 36],
    'red_concrete': [142, 33, 33],
    'black_concrete': [8, 10, 15],
    
    // Wool
    'white_wool': [255, 255, 255],
    'orange_wool': [241, 118, 20],
    'magenta_wool': [189, 68, 179],
    'light_blue_wool': [58, 175, 217],
    'yellow_wool': [254, 216, 61],
    'lime_wool': [112, 185, 26],
    'pink_wool': [237, 141, 172],
    'gray_wool': [63, 68, 72],
    'light_gray_wool': [142, 142, 135],
    'cyan_wool': [21, 138, 145],
    'purple_wool': [122, 42, 173],
    'blue_wool': [60, 68, 170],
    'brown_wool': [114, 72, 41],
    'green_wool': [94, 124, 22],
    'red_wool': [176, 46, 38],
    'black_wool': [26, 26, 26],
    
    // Glass
    'glass': [192, 232, 255],
    'tinted_glass': [45, 35, 43],
    
    // Metals & Ores
    'iron_block': [216, 216, 216],
    'gold_block': [249, 216, 73],
    'diamond_block': [97, 233, 229],
    'emerald_block': [65, 205, 52],
    'lapis_block': [30, 67, 140],
    'redstone_block': [170, 28, 28],
    'copper_block': [192, 107, 79],
    'netherite_block': [66, 61, 63],
    
    // Bricks
    'bricks': [150, 100, 100],
    'nether_bricks': [44, 21, 26],
    'red_nether_bricks': [69, 7, 9],
    'mud_bricks': [137, 104, 79],
    
    // Nature
    'water': [63, 118, 228],
    'lava': [207, 92, 15],
    'sand': [219, 207, 163],
    'red_sand': [190, 102, 33],
    'gravel': [131, 127, 126],
    'clay': [160, 166, 179],
    'snow_block': [249, 254, 254],
    'ice': [145, 183, 253],
    'packed_ice': [141, 180, 250],
    'blue_ice': [116, 167, 253],
    
    // Leaves
    'oak_leaves': [59, 98, 25],
    'spruce_leaves': [58, 90, 58],
    'birch_leaves': [80, 106, 47],
    'jungle_leaves': [47, 107, 21],
    'acacia_leaves': [75, 110, 23],
    'dark_oak_leaves': [47, 75, 19],
    'azalea_leaves': [85, 124, 46],
    'cherry_leaves': [233, 178, 193],
    'mangrove_leaves': [75, 122, 44],
    
    // Nether
    'netherrack': [97, 38, 38],
    'nether_quartz_ore': [117, 65, 62],
    'quartz_block': [235, 229, 222],
    'glowstone': [171, 131, 84],
    'soul_sand': [81, 62, 51],
    'soul_soil': [75, 57, 46],
    'basalt': [73, 72, 77],
    'polished_basalt': [88, 88, 91],
    'blackstone': [42, 36, 41],
    'crying_obsidian': [32, 10, 60],
    'obsidian': [15, 10, 24],
    
    // End
    'end_stone': [219, 222, 158],
    'end_stone_bricks': [218, 224, 162],
    'purpur_block': [170, 126, 170],
    
    // Prismarine
    'prismarine': [99, 156, 151],
    'prismarine_bricks': [99, 171, 158],
    'dark_prismarine': [51, 91, 75],
    'sea_lantern': [172, 199, 190],
    
    // Special
    'structure_void': [0, 0, 0, 0],
    'air': [0, 0, 0, 0],
    'barrier': [0, 0, 0, 0],
    
    'default': [128, 128, 128]
};

function getBlockColor(blockType) {
    const name = (blockType || 'stone').replace('minecraft:', '').split('[')[0];
    return BLOCK_COLORS[name] || BLOCK_COLORS['default'];
}


/**
 * Simple 3x5 pixel font for watermark
 */
const PIXEL_FONT = {
    'M': [[1,0,1],[1,1,1],[1,0,1],[1,0,1],[1,0,1]],
    'C': [[1,1,1],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
    '-': [[0,0,0],[0,0,0],[1,1,1],[0,0,0],[0,0,0]],
    'A': [[0,1,0],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
    'I': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
    'B': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,1,0]],
    'U': [[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    'L': [[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
    'D': [[1,1,0],[1,0,1],[1,0,1],[1,0,1],[1,1,0]],
    'E': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,1,1]],
    'R': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
};

/**
 * Create PNG binary data from pixel array
 * Note: Axiom expects the image to be flipped vertically (bottom-to-top)
 */
function createPNG(width, height, pixels, flipY = false) {
    const crcTable = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[i] = c;
    }
    
    function crc32(data, start, len) {
        let crc = 0xffffffff;
        for (let i = start; i < start + len; i++) {
            crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
        }
        return (crc ^ 0xffffffff) >>> 0;
    }
    
    function adler32(data) {
        let a = 1, b = 0;
        for (let i = 0; i < data.length; i++) {
            a = (a + data[i]) % 65521;
            b = (b + a) % 65521;
        }
        return (b << 16) | a;
    }
    
    const rawData = new Uint8Array(height * (1 + width * 4));
    let idx = 0;
    for (let y = 0; y < height; y++) {
        rawData[idx++] = 0;
        // If flipY is true, read from bottom row first
        const srcY = flipY ? (height - 1 - y) : y;
        for (let x = 0; x < width; x++) {
            const pi = (srcY * width + x) * 4;
            rawData[idx++] = pixels[pi];
            rawData[idx++] = pixels[pi + 1];
            rawData[idx++] = pixels[pi + 2];
            rawData[idx++] = pixels[pi + 3];
        }
    }
    
    const blocks = [];
    let remaining = rawData.length;
    let offset = 0;
    
    while (remaining > 0) {
        const blockSize = Math.min(remaining, 65535);
        const isLast = remaining <= 65535;
        blocks.push(isLast ? 0x01 : 0x00);
        blocks.push(blockSize & 0xff);
        blocks.push((blockSize >> 8) & 0xff);
        blocks.push((~blockSize) & 0xff);
        blocks.push(((~blockSize) >> 8) & 0xff);
        for (let i = 0; i < blockSize; i++) blocks.push(rawData[offset + i]);
        offset += blockSize;
        remaining -= blockSize;
    }
    
    const adler = adler32(rawData);
    const idatData = new Uint8Array(2 + blocks.length + 4);
    idatData[0] = 0x78;
    idatData[1] = 0x01;
    idatData.set(blocks, 2);
    idatData[idatData.length - 4] = (adler >> 24) & 0xff;
    idatData[idatData.length - 3] = (adler >> 16) & 0xff;
    idatData[idatData.length - 2] = (adler >> 8) & 0xff;
    idatData[idatData.length - 1] = adler & 0xff;
    
    const png = [];
    png.push(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    
    const ihdr = new Uint8Array(13);
    ihdr[0] = (width >> 24) & 0xff; ihdr[1] = (width >> 16) & 0xff;
    ihdr[2] = (width >> 8) & 0xff; ihdr[3] = width & 0xff;
    ihdr[4] = (height >> 24) & 0xff; ihdr[5] = (height >> 16) & 0xff;
    ihdr[6] = (height >> 8) & 0xff; ihdr[7] = height & 0xff;
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    
    png.push(0, 0, 0, 13);
    png.push(0x49, 0x48, 0x44, 0x52);
    for (let i = 0; i < 13; i++) png.push(ihdr[i]);
    const ihdrCrc = crc32(new Uint8Array([0x49, 0x48, 0x44, 0x52, ...ihdr]), 0, 17);
    png.push((ihdrCrc >> 24) & 0xff, (ihdrCrc >> 16) & 0xff, (ihdrCrc >> 8) & 0xff, ihdrCrc & 0xff);
    
    const idatLen = idatData.length;
    png.push((idatLen >> 24) & 0xff, (idatLen >> 16) & 0xff, (idatLen >> 8) & 0xff, idatLen & 0xff);
    png.push(0x49, 0x44, 0x41, 0x54);
    for (let i = 0; i < idatData.length; i++) png.push(idatData[i]);
    const idatCrcData = new Uint8Array([0x49, 0x44, 0x41, 0x54, ...idatData]);
    const idatCrc = crc32(idatCrcData, 0, idatCrcData.length);
    png.push((idatCrc >> 24) & 0xff, (idatCrc >> 16) & 0xff, (idatCrc >> 8) & 0xff, idatCrc & 0xff);
    
    png.push(0, 0, 0, 0);
    png.push(0x49, 0x45, 0x4e, 0x44);
    png.push(0xae, 0x42, 0x60, 0x82);
    
    return new Uint8Array(png);
}


/**
 * Render isometric 45-degree view thumbnail
 * PNG coordinate system: y=0 at top, y increases downward
 * Minecraft Y axis: y=0 at bottom, y increases upward
 * So higher Y blocks should appear HIGHER on screen (smaller screenY in PNG)
 */
export async function renderThumbnail(blocks, size = 96) {
    if (!blocks || blocks.length === 0) {
        return createPlaceholderPNG();
    }

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

    // Isometric projection: calculate projected dimensions
    // In isometric view, the projected width and height depend on all 3 dimensions
    // Width in screen space: (sizeX + sizeZ) units (each unit is blockW/2 pixels)
    // Height in screen space: (sizeX + sizeZ)/2 + sizeY units (each unit is blockH pixels)
    
    // Calculate the scale to fit the building in 70% of the image
    // Leave room for watermark at bottom (12px) and some padding
    const availableWidth = size * 0.85;
    const availableHeight = (size - 14) * 0.85; // 14px for watermark + padding
    
    // For 2:1 isometric ratio (blockW = 2 * blockH)
    // Projected width = (sizeX + sizeZ) * blockW / 2 = (sizeX + sizeZ) * blockH
    // Projected height = ((sizeX + sizeZ) / 2 + sizeY) * blockH
    const projectedWidthUnits = sizeX + sizeZ;
    const projectedHeightUnits = (sizeX + sizeZ) / 2 + sizeY;
    
    // Calculate blockH to fit both dimensions
    const scaleByWidth = availableWidth / projectedWidthUnits;
    const scaleByHeight = availableHeight / projectedHeightUnits;
    const blockH = Math.max(1, Math.min(scaleByWidth, scaleByHeight));
    const blockW = blockH * 2;

    // Create pixel buffer
    const pixels = new Uint8Array(size * size * 4);
    const depthBuffer = new Float32Array(size * size).fill(-Infinity);
    
    // Fill with sky gradient background
    for (let y = 0; y < size; y++) {
        const t = y / size;
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            pixels[i] = Math.floor(135 + 60 * (1 - t));     // R
            pixels[i + 1] = Math.floor(175 + 50 * (1 - t)); // G
            pixels[i + 2] = Math.floor(220 + 25 * (1 - t)); // B
            pixels[i + 3] = 255;
        }
    }

    // Calculate center position for the building
    const centerX = size / 2;
    const centerY = (size - 12) / 2; // Leave 12px for watermark at bottom

    // Sort blocks for painter's algorithm (back to front, bottom to top)
    const sortedBlocks = [...blocks].sort((a, b) => {
        const [ax, ay, az] = a.position;
        const [bx, by, bz] = b.position;
        const sumA = (ax - minX) + (az - minZ);
        const sumB = (bx - minX) + (bz - minZ);
        if (sumA !== sumB) return sumA - sumB;
        return (ay - minY) - (by - minY);
    });

    // Helper function to draw a filled polygon
    const fillPolygon = (points, color, depth) => {
        // Find bounding box
        let minPX = Infinity, maxPX = -Infinity;
        let minPY = Infinity, maxPY = -Infinity;
        for (const [px, py] of points) {
            minPX = Math.min(minPX, px);
            maxPX = Math.max(maxPX, px);
            minPY = Math.min(minPY, py);
            maxPY = Math.max(maxPY, py);
        }
        
        // Scanline fill
        for (let sy = Math.floor(minPY); sy <= Math.ceil(maxPY); sy++) {
            if (sy < 0 || sy >= size) continue;
            
            // Find intersections with polygon edges
            const intersections = [];
            for (let i = 0; i < points.length; i++) {
                const [x1, y1] = points[i];
                const [x2, y2] = points[(i + 1) % points.length];
                
                if ((y1 <= sy && y2 > sy) || (y2 <= sy && y1 > sy)) {
                    const t = (sy - y1) / (y2 - y1);
                    intersections.push(x1 + t * (x2 - x1));
                }
            }
            
            intersections.sort((a, b) => a - b);
            
            // Fill between pairs of intersections
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const startX = Math.max(0, Math.floor(intersections[i]));
                const endX = Math.min(size - 1, Math.ceil(intersections[i + 1]));
                
                for (let sx = startX; sx <= endX; sx++) {
                    const di = sy * size + sx;
                    if (depth >= depthBuffer[di]) {
                        depthBuffer[di] = depth;
                        const idx = di * 4;
                        pixels[idx] = color[0];
                        pixels[idx + 1] = color[1];
                        pixels[idx + 2] = color[2];
                        pixels[idx + 3] = 255;
                    }
                }
            }
        }
    };

    // Draw each block
    sortedBlocks.forEach(block => {
        const [x, y, z] = block.position;
        const localX = x - minX;
        const localY = y - minY;
        const localZ = z - minZ;
        
        const color = getBlockColor(block.type);
        if (color.length === 4 && color[3] === 0) return; // Skip transparent
        
        // Isometric projection: convert 3D to 2D
        // Standard 2:1 isometric ratio
        const toScreen = (lx, ly, lz) => {
            const sx = (lx - lz) * blockW / 2;
            const sy = (lx + lz) * blockH / 2 - ly * blockH;
            return [sx, sy];
        };
        
        // Get the 8 corners of the cube in local space, then project
        // We only need to draw 3 visible faces: top, left, right
        
        // Calculate center offset for the building
        const buildingCenterX = 0;
        const buildingCenterY = (sizeX + sizeZ) / 2 * blockH / 2 - sizeY / 2 * blockH;
        
        // Project cube corners (relative to this block's position)
        const corners = {
            // Bottom face corners
            blf: toScreen(localX, localY, localZ),           // bottom-left-front
            brf: toScreen(localX + 1, localY, localZ),       // bottom-right-front
            blb: toScreen(localX, localY, localZ + 1),       // bottom-left-back
            brb: toScreen(localX + 1, localY, localZ + 1),   // bottom-right-back
            // Top face corners
            tlf: toScreen(localX, localY + 1, localZ),       // top-left-front
            trf: toScreen(localX + 1, localY + 1, localZ),   // top-right-front
            tlb: toScreen(localX, localY + 1, localZ + 1),   // top-left-back
            trb: toScreen(localX + 1, localY + 1, localZ + 1) // top-right-back
        };
        
        // Offset to screen coordinates
        const offset = (pt) => [
            centerX + pt[0] - buildingCenterX,
            centerY + pt[1] - buildingCenterY
        ];
        
        const depth = localX + localZ + localY * 1000;
        
        // Face colors
        const topColor = [
            Math.min(255, Math.floor(color[0] * 1.15)),
            Math.min(255, Math.floor(color[1] * 1.15)),
            Math.min(255, Math.floor(color[2] * 1.15))
        ];
        const leftColor = [
            Math.floor(color[0] * 0.7),
            Math.floor(color[1] * 0.7),
            Math.floor(color[2] * 0.7)
        ];
        const rightColor = [
            Math.floor(color[0] * 0.5),
            Math.floor(color[1] * 0.5),
            Math.floor(color[2] * 0.5)
        ];
        
        // Draw top face (diamond: tlf -> trf -> trb -> tlb)
        fillPolygon([
            offset(corners.tlf),
            offset(corners.trf),
            offset(corners.trb),
            offset(corners.tlb)
        ], topColor, depth + 0.3);
        
        // Draw left face (parallelogram: tlf -> tlb -> blb -> blf)
        fillPolygon([
            offset(corners.tlf),
            offset(corners.tlb),
            offset(corners.blb),
            offset(corners.blf)
        ], leftColor, depth + 0.1);
        
        // Draw right face (parallelogram: trf -> tlf -> blf -> brf) - wait, that's wrong
        // Right face should be: trf -> trb -> brb -> brf - no wait
        // In isometric view from top-right, we see: top, left (facing -Z), right (facing +X)
        // Left face: -Z direction = tlf, blf, blb, tlb - no
        // Let me reconsider: viewing from angle where +X goes right-down, +Z goes left-down
        // Visible faces: top, front-left (facing viewer-left), front-right (facing viewer-right)
        // Front-left face: corners tlf, trf, brf, blf - that's the +Y face... no
        
        // Actually for standard isometric:
        // - Top face: the Y+ face
        // - Left face: the Z+ face (going back-left in screen space)  
        // - Right face: the X+ face (going back-right in screen space)
        
        // Right face (X+ face): trf -> brf -> brb -> trb
        fillPolygon([
            offset(corners.trf),
            offset(corners.brf),
            offset(corners.brb),
            offset(corners.trb)
        ], rightColor, depth + 0.2);
    });

    // Draw watermark bar at bottom
    const wmBarHeight = 10;
    const wmBarY = size - wmBarHeight;
    for (let y = wmBarY; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            // Semi-transparent dark bar
            pixels[idx] = Math.floor(pixels[idx] * 0.25);
            pixels[idx + 1] = Math.floor(pixels[idx + 1] * 0.25);
            pixels[idx + 2] = Math.floor(pixels[idx + 2] * 0.25);
        }
    }
    
    // Draw "MC-AI-BUILDER" text using pixel font
    const text = "MC-AI-BUILDER";
    const textStartX = 3;
    const textStartY = wmBarY + 2;
    let cursorX = textStartX;
    
    for (const char of text) {
        const glyph = PIXEL_FONT[char];
        if (glyph) {
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < glyph[row].length; col++) {
                    if (glyph[row][col]) {
                        const px = cursorX + col;
                        const py = textStartY + row;
                        if (px < size && py < size) {
                            const idx = (py * size + px) * 4;
                            pixels[idx] = 220;
                            pixels[idx + 1] = 220;
                            pixels[idx + 2] = 220;
                        }
                    }
                }
            }
            cursorX += glyph[0].length + 1; // char width + 1px spacing
        } else {
            cursorX += 2; // space for unknown chars
        }
    }

    // Flip Y for Axiom compatibility (Axiom expects bottom-to-top image)
    return createPNG(size, size, pixels, true);
}

function createPlaceholderPNG() {
    const size = 8;
    const pixels = new Uint8Array(size * size * 4);
    for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = 64; pixels[i + 1] = 64; pixels[i + 2] = 64; pixels[i + 3] = 255;
    }
    return createPNG(size, size, pixels);
}

export { createPlaceholderPNG };
