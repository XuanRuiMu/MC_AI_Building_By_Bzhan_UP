/**
 * Architecture Engine v2
 * Converts semantic voxel layers into detailed Minecraft blocks.
 * Features:
 * - Auto-texturing (random block mix for walls)
 * - Edge detection (auto-stairs, slabs, walls for edges)
 * - Smart roof orientation
 * - Hybrid mode (supports both semantic and precise block types)
 */

// ============ SEMANTIC TYPE DEFINITIONS ============
// Matches the new AI Prompt Abstract Types
export const SEMANTIC_TYPES = {
    // WALLS - Basic
    WALL_STONE: 'WALL_STONE',
    WALL_WOOD: 'WALL_WOOD',
    WALL_BRICK: 'WALL_BRICK',
    WALL_SANDSTONE: 'WALL_SANDSTONE',
    WALL_DEEPSLATE: 'WALL_DEEPSLATE',
    WALL_DARK_OAK: 'WALL_DARK_OAK',
    WALL_BAMBOO: 'WALL_BAMBOO',
    WALL_CONCRETE: 'WALL_CONCRETE',
    WALL_SMOOTH_STONE: 'WALL_SMOOTH_STONE',
    WALL_QUARTZ: 'WALL_QUARTZ',
    WALL_COBBLE: 'WALL_COBBLE',
    WALL_MUD: 'WALL_MUD',
    WALL_TERRACOTTA: 'WALL_TERRACOTTA',
    WALL_IRON: 'WALL_IRON',
    WALL_COPPER: 'WALL_COPPER',
    WALL_GOLD: 'WALL_GOLD',
    WALL_PRISMARINE: 'WALL_PRISMARINE',
    WALL_PURPUR: 'WALL_PURPUR',
    WALL_BLACKSTONE: 'WALL_BLACKSTONE',

    // WALLS - Colored (16 colors)
    WALL_WHITE: 'WALL_WHITE',
    WALL_BLACK: 'WALL_BLACK',
    WALL_GRAY: 'WALL_GRAY',
    WALL_LIGHT_GRAY: 'WALL_LIGHT_GRAY',
    WALL_RED: 'WALL_RED',
    WALL_ORANGE: 'WALL_ORANGE',
    WALL_YELLOW: 'WALL_YELLOW',
    WALL_PINK: 'WALL_PINK',
    WALL_BLUE: 'WALL_BLUE',
    WALL_CYAN: 'WALL_CYAN',
    WALL_LIGHT_BLUE: 'WALL_LIGHT_BLUE',
    WALL_GREEN: 'WALL_GREEN',
    WALL_LIME: 'WALL_LIME',
    WALL_BROWN: 'WALL_BROWN',
    WALL_PURPLE: 'WALL_PURPLE',
    WALL_MAGENTA: 'WALL_MAGENTA',

    // ROOFS
    ROOF_WOOD: 'ROOF_WOOD',
    ROOF_DARK: 'ROOF_DARK',
    ROOF_BAMBOO: 'ROOF_BAMBOO',
    ROOF_STONE: 'ROOF_STONE',
    ROOF_DEEPSLATE: 'ROOF_DEEPSLATE',
    ROOF_BLACKSTONE: 'ROOF_BLACKSTONE',
    ROOF_RED: 'ROOF_RED',
    ROOF_BLUE: 'ROOF_BLUE',
    ROOF_GREEN: 'ROOF_GREEN',
    ROOF_PURPLE: 'ROOF_PURPLE',
    ROOF_GOLD: 'ROOF_GOLD',
    ROOF_COPPER: 'ROOF_COPPER',

    // FLOORS
    FLOOR_STONE: 'FLOOR_STONE',
    FLOOR_WOOD: 'FLOOR_WOOD',
    FLOOR_COBBLE: 'FLOOR_COBBLE',
    FLOOR_MOSSY: 'FLOOR_MOSSY',
    FLOOR_DEEPSLATE: 'FLOOR_DEEPSLATE',
    FLOOR_DARK_OAK: 'FLOOR_DARK_OAK',
    FLOOR_BAMBOO: 'FLOOR_BAMBOO',
    FLOOR_CONCRETE: 'FLOOR_CONCRETE',
    FLOOR_SMOOTH: 'FLOOR_SMOOTH',
    FLOOR_QUARTZ: 'FLOOR_QUARTZ',

    // FRAMES
    FRAME_WOOD: 'FRAME_WOOD',
    FRAME_DARK_OAK: 'FRAME_DARK_OAK',
    FRAME_BAMBOO: 'FRAME_BAMBOO',
    FRAME_STONE: 'FRAME_STONE',

    // Others
    WINDOW: 'WINDOW',
    AIR: 'AIR',
    DECOR: 'DECOR'
};

// ============ STYLE PALETTES ============
// Each style can have a 'mode' for selection: 'random', 'noise', 'gradient_y', 'checkerboard', 'stripes_x', 'layers'
// For gradient_y: Array order is bottom → top (dark/aged → light/clean)
export const STYLES = {
    DEFAULT: {
        // WALLS - Basic Materials (继续扩展...)
        wall_stone: { base: ['mossy_cobblestone', 'cobbl石', 'mossy_stone_bricks', 'cracked_stone_bricks', 'stone_bricks', 'polished_andesite'], mode: 'gradient_y', options: { maxY: 20 } },
        wall_wood: { base: ['spruce_planks', 'dark_oak_planks', 'oak_planks', 'birch_planks'], mode: 'gradient_y', options: { maxY: 15 } },
        wall_brick: { base: ['mud_bricks', 'bricks', 'bricks'], mode: 'gradient_y', options: { maxY: 12 } },
        wall_sandstone: { base: ['sandstone', 'smooth_sandstone', 'cut_sandstone'], mode: 'gradient_y', options: { maxY: 15 } },
        wall_deepslate: { base: ['deepslate', 'cobbled_deepslate', 'polished_deepslate', 'deepslate_bricks'], mode: 'gradient_y', options: { maxY: 20 } },
        wall_dark_oak: { base: ['dark_oak_planks'], mode: 'random' },
        wall_bamboo: { base: ['bamboo_planks', 'bamboo_mosaic'], mode: '棋盘' },
        wall_concrete: { base: ['gray_concrete', 'light_gray_concrete'], mode: 'checkerboard' },
        wall_smooth_stone: { base: ['smooth_stone', 'polished_andesite', 'polished_diorite'], mode: 'random' },
        wall_quartz: { base: ['quartz_block', 'smooth_quartz', 'quartz_bricks'], mode: 'random' },
        wall_cobble: { base: ['cobblestone', 'mossy_cobblestone'], mode: 'noise' },
        wall_mud: { base: ['mud_bricks', 'packed_mud'], mode: 'random' },
        wall_terracotta: { base: ['terracotta', 'brown_terracotta', 'orange_terracotta'], mode: 'random' },
        wall_iron: { base: ['iron_block', 'cut_iron'], mode: 'random' },
        wall_copper: { base: ['copper_block', 'cut_copper', 'waxed_copper'], mode: 'random' },
        wall_gold: { base: ['gold_block'], mode: 'random' },
        wall_prismarine: { base: ['prismarine', 'prismarine_bricks', 'dark_prismarine'], mode: 'random' },
        wall_purpur: { base: ['purpur_block', 'purpur_pillar'], mode: 'random' },
        wall_blackstone: { base: ['blackstone', 'polished_blackstone', 'polished_blackstone_bricks'], mode: 'gradient_y', options: { maxY: 15 } },

        // WALLS - 16 Colors
        wall_white: { base: ['white_concrete', 'white_terracotta', 'quartz_block'], mode: 'random' },
        wall_black: { base: ['black_concrete', 'black_terracotta'], mode: 'random' },
        wall_gray: { base: ['gray_concrete', 'gray_terracotta'], mode: 'random' },
        wall_light_gray: { base: ['light_gray_concrete', 'light_gray_terracotta'], mode: 'random' },
        wall_red: { base: ['red_concrete', 'red_terracotta', 'nether_bricks'], mode: 'random' },
        wall_orange: { base: ['orange_concrete', 'orange_terracotta'], mode: 'random' },
        wall_yellow: { base: ['yellow_concrete', 'yellow_terracotta'], mode: 'random' },
        wall_pink: { base: ['pink_concrete', 'pink_terracotta'], mode: 'random' },
        wall_blue: { base: ['blue_concrete', 'blue_terracotta'], mode: 'random' },
        wall_cyan: { base: ['cyan_concrete', 'cyan_terracotta'], mode: 'random' },
        wall_light_blue: { base: ['light_blue_concrete', 'light_blue_terracotta'], mode: 'random' },
        wall_green: { base: ['green_concrete', 'green_terracotta'], mode: 'random' },
        wall_lime: { base: ['lime_concrete', 'lime_terracotta'], mode: 'random' },
        wall_brown: { base: ['brown_concrete', 'brown_terracotta'], mode: 'random' },
        wall_purple: { base: ['purple_concrete', 'purple_terracotta'], mode: 'random' },
        wall_magenta: { base: ['magenta_concrete', 'magenta_terracotta'], mode: 'random' },

        // FRAMES
        frame_wood: { base: ['dark_oak_log', 'spruce_log', 'oak_log'], mode: 'gradient_y', options: { maxY: 15 }, axis: true },
        frame_dark_oak: { base: ['dark_oak_log'], mode: 'random', axis: true },
        frame_bamboo: { base: ['bamboo_block'], mode: 'random', axis: true },
        frame_stone: { base: ['stone_bricks', 'chiseled_stone_bricks'], mode: 'random' },

        // ROOFS - 12 Types
        roof_wood: { base: ['spruce_planks'], stair: 'spruce_stairs', slab: 'spruce_slab', mode: 'random' },
        roof_dark: { base: ['dark_oak_planks'], stair: 'dark_oak_stairs', slab: 'dark_oak_slab', mode: 'random' },
        roof_bamboo: { base: ['bamboo_planks'], stair: 'bamboo_stairs', slab: 'bamboo_slab', mode: 'random' },
        roof_stone: { base: ['stone_bricks'], stair: 'stone_brick_stairs', slab: 'stone_brick_slab', mode: 'random' },
        roof_deepslate: { base: ['deepslate_tiles'], stair: 'deepslate_tile_stairs', slab: 'deepslate_tile_slab', mode: 'random' },
        roof_blackstone: { base: ['polished_blackstone_bricks'], stair: 'polished_black stone_brick_stairs', slab: 'polished_blackstone_slab', mode: 'random' },
        roof_red: { base: ['red_nether_bricks'], stair: 'red_nether_brick_stairs', slab: 'red_nether_brick_slab', mode: 'random' },
        roof_blue: { base: ['dark_prismarine'], stair: 'dark_prismarine_stairs', slab: 'dark_prismarine_slab', mode: 'random' },
        roof_green: { base: ['moss_block'], stair: 'mossy_stone_brick_stairs', slab: 'mossy_stone_brick_slab', mode: 'random' },
        roof_purple: { base: ['purpur_block'], stair: 'purpur_stairs', slab: 'purpur_slab', mode: 'random' },
        roof_gold: { base: ['cut_sandstone'], stair: 'sandstone_stairs', slab: 'sandstone_slab', mode: 'random' },
        roof_copper: { base: ['cut_copper'], stair: 'cut_copper_stairs', slab: 'cut_copper_slab', mode: 'random' },

        // FLOORS - 10 Types
        floor_stone: { base: ['cobblestone', 'stone', 'polished_andesite'], mode: 'checkerboard' },
        floor_wood: { base: ['oak_planks', 'spruce_planks'], mode: 'checkerboard' },
        floor_cobble: { base: ['cobblestone', 'mossy_cobblestone'], mode: 'noise' },
        floor_mossy: { base: ['mossy_cobblestone', 'moss_block'], mode: 'noise' },
        floor_deepslate: { base: ['deepslate_tiles', 'polished_deepslate'], mode: 'checkerboard' },
        floor_dark_oak: { base: ['dark_oak_planks'], mode: 'random' },
        floor_bamboo: { base: ['bamboo_planks', 'bamboo_mosaic'], mode: 'checkerboard' },
        floor_concrete: { base: ['gray_concrete', 'light_gray_concrete'], mode: 'checkerboard' },
        floor_smooth: { base: ['smooth_stone', 'polished_andesite'], mode: 'checkerboard' },
        floor_quartz: { base: ['quartz_block', 'smooth_quartz'], mode: 'checkerboard' },

        // DECOR
        window: { glass: 'glass_pane' }
    }
};

// ============ HELPER FUNCTIONS ============

/**
 * Better hash function using bit mixing for natural-looking randomness
 * Same coordinates always produce the same result, but no visible patterns
 */
const hashCoords = (x, y, z) => {
    // Use large primes and bit mixing for better distribution
    let h = x * 374761393 + y * 668265263 + z * 1274126177;
    h = (h ^ (h >> 13)) * 1274126177;
    h = h ^ (h >> 16);
    return Math.abs(h);
};

/**
 * Simple Perlin-like noise for smooth organic patterns
 */
const noise2D = (x, z, scale = 0.1) => {
    const sx = x * scale;
    const sz = z * scale;
    // Simplified value noise with interpolation
    const ix = Math.floor(sx);
    const iz = Math.floor(sz);
    const fx = sx - ix;
    const fz = sz - iz;

    // Corner values
    const v00 = (hashCoords(ix, 0, iz) % 1000) / 1000;
    const v10 = (hashCoords(ix + 1, 0, iz) % 1000) / 1000;
    const v01 = (hashCoords(ix, 0, iz + 1) % 1000) / 1000;
    const v11 = (hashCoords(ix + 1, 0, iz + 1) % 1000) / 1000;

    // Bilinear interpolation
    const v0 = v00 * (1 - fx) + v10 * fx;
    const v1 = v01 * (1 - fx) + v11 * fx;
    return v0 * (1 - fz) + v1 * fz;
};

/**
 * Material Selection Modes
 */
const SELECTION_MODES = {
    RANDOM: 'random',
    NOISE: 'noise',
    GRADIENT_Y: 'gradient_y',
    GRADIENT_XZ: 'gradient_xz',
    CHECKERBOARD: 'checkerboard',
    STRIPES_X: 'stripes_x',
    STRIPES_Z: 'stripes_z',
    LAYERS: 'layers'
};

/**
 * Select material from array using specified mode
 * @param {Array} arr - Material options
 * @param {number} x, y, z - Coordinates
 * @param {string} mode - Selection mode
 * @param {object} options - Additional options (bounds, etc.)
 */
const selectFrom = (arr, x, y, z, mode = 'random', options = {}) => {
    if (arr.length === 1) return arr[0];

    const len = arr.length;
    let index = 0;

    switch (mode) {
        case 'noise':
            // Smooth organic pattern using noise
            const noiseVal = noise2D(x, z, options.scale || 0.15);
            index = Math.floor(noiseVal * len);
            break;

        case 'gradient_y':
            // Vertical gradient (bottom = first, top = last)
            const maxY = options.maxY || 20;
            const yRatio = Math.min(y / maxY, 1);
            index = Math.floor(yRatio * len);
            break;

        case 'gradient_xz':
            // Horizontal gradient based on distance from origin
            const dist = Math.sqrt(x * x + z * z);
            const maxDist = options.maxDist || 30;
            index = Math.floor((dist / maxDist) * len) % len;
            break;

        case 'checkerboard':
            // Classic checkerboard pattern
            index = ((x + z) % 2 === 0) ? 0 : (len > 1 ? 1 : 0);
            break;

        case 'stripes_x':
            // Vertical stripes along X axis
            const stripeWidth = options.width || 2;
            index = Math.floor(x / stripeWidth) % len;
            break;

        case 'stripes_z':
            // Vertical stripes along Z axis
            const stripeWidthZ = options.width || 2;
            index = Math.floor(z / stripeWidthZ) % len;
            break;

        case 'layers':
            // Different material per Y level
            const layerHeight = options.height || 3;
            index = Math.floor(y / layerHeight) % len;
            break;

        case 'random':
        default:
            // Original hash-based random
            index = hashCoords(x, y, z) % len;
            break;
    }

    return arr[Math.min(index, len - 1)];
};

/**
 * Deterministic random-like value based on coordinates (0 to 1)
 */
const hashRandom = (x, y, z) => {
    return (hashCoords(x, y, z) % 1000) / 1000;
};

const posKey = (x, y, z) => `${x},${y},${z}`;

/**
 * Check if a voxel exists in the map
 */
const hasVoxel = (map, x, y, z) => map.has(posKey(x, y, z));

/**
 * Get voxel at position
 */
const getVoxel = (map, x, y, z) => map.get(posKey(x, y, z));

/**
 * Check if position is an edge (neighbor is air/missing)
 */
const getEdges = (map, x, y, z) => {
    return {
        top: !hasVoxel(map, x, y + 1, z),    // Above is empty
        bottom: !hasVoxel(map, x, y - 1, z), // Below is empty
        north: !hasVoxel(map, x, y, z - 1),
        south: !hasVoxel(map, x, y, z + 1),
        east: !hasVoxel(map, x + 1, y, z),
        west: !hasVoxel(map, x - 1, y, z)
    };
};

/**
 * Check if type is semantic (uppercase) or precise (lowercase)
 */
const isSemantic = (type) => type === type.toUpperCase() && /^[A-Z_]+$/.test(type);

// ============ MAIN ENGINE ============

export const processVoxels = (inputBlocks, styleName = 'DEFAULT') => {
    const style = STYLES[styleName] || STYLES.DEFAULT;
    const outputBlocks = [];
    const voxelMap = new Map();

    // Pass 1: Build Map for Neighbor Lookups (later blocks overwrite earlier ones at same position)
    inputBlocks.forEach(block => {
        if (!block || !block.type) return;
        voxelMap.set(posKey(...block.position), block);
    });

    // Pass 2: Generate Details - iterate over deduplicated voxelMap, not inputBlocks!
    // This ensures only the final block at each position is processed
    let index = 0;
    voxelMap.forEach((voxel) => {
        index++;
        const [x, y, z] = voxel.position;
        const type = voxel.type;
        const voxelMode = voxel.mode; // Mode specified by AI (may be null)

        if (type === 'AIR') return;

        // Passthrough for precise blocks (if any linger)
        if (!SEMANTIC_TYPES[type]) {
            outputBlocks.push({ ...voxel, id: index + 1 });
            return;
        }

        const edges = getEdges(voxelMap, x, y, z);
        let finalBlock = null;
        let properties = '0';

        // Helper to get mode: use voxel's mode if specified, else style default
        const getMode = (styleConfig) => voxelMode || styleConfig.mode || 'random';
        const getOptions = (styleConfig) => styleConfig.options || {};

        switch (type) {
            // WALLS - Basic Materials
            case 'WALL_STONE':
                finalBlock = selectFrom(style.wall_stone.base, x, y, z, getMode(style.wall_stone), getOptions(style.wall_stone));
                break;
            case 'WALL_WOOD':
                finalBlock = selectFrom(style.wall_wood.base, x, y, z, getMode(style.wall_wood), getOptions(style.wall_wood));
                break;
            case 'WALL_BRICK':
                finalBlock = selectFrom(style.wall_brick.base, x, y, z, getMode(style.wall_brick), getOptions(style.wall_brick));
                break;
            case 'WALL_SANDSTONE':
                finalBlock = selectFrom(style.wall_sandstone.base, x, y, z, getMode(style.wall_sandstone), getOptions(style.wall_sandstone));
                break;
            case 'WALL_DEEPSLATE':
                finalBlock = selectFrom(style.wall_deepslate.base, x, y, z, getMode(style.wall_deepslate), getOptions(style.wall_deepslate));
                break;
            case 'WALL_DARK_OAK':
                finalBlock = selectFrom(style.wall_dark_oak.base, x, y, z, getMode(style.wall_dark_oak), getOptions(style.wall_dark_oak));
                break;
            case 'WALL_BAMBOO':
                finalBlock = selectFrom(style.wall_bamboo.base, x, y, z, getMode(style.wall_bamboo), getOptions(style.wall_bamboo));
                break;
            case 'WALL_CONCRETE':
                finalBlock = selectFrom(style.wall_concrete.base, x, y, z, getMode(style.wall_concrete), getOptions(style.wall_concrete));
                break;
            case 'WALL_SMOOTH_STONE':
                finalBlock = selectFrom(style.wall_smooth_stone.base, x, y, z, getMode(style.wall_smooth_stone), getOptions(style.wall_smooth_stone));
                break;
            case 'WALL_QUARTZ':
                finalBlock = selectFrom(style.wall_quartz.base, x, y, z, getMode(style.wall_quartz), getOptions(style.wall_quartz));
                break;
            case 'WALL_COBBLE':
                finalBlock = selectFrom(style.wall_cobble.base, x, y, z, getMode(style.wall_cobble), getOptions(style.wall_cobble));
                break;
            case 'WALL_MUD':
                finalBlock = selectFrom(style.wall_mud.base, x, y, z, getMode(style.wall_mud), getOptions(style.wall_mud));
                break;
            case 'WALL_TERRACOTTA':
                finalBlock = selectFrom(style.wall_terracotta.base, x, y, z, getMode(style.wall_terracotta), getOptions(style.wall_terracotta));
                break;
            case 'WALL_IRON':
                finalBlock = selectFrom(style.wall_iron.base, x, y, z, getMode(style.wall_iron), getOptions(style.wall_iron));
                break;
            case 'WALL_COPPER':
                finalBlock = selectFrom(style.wall_copper.base, x, y, z, getMode(style.wall_copper), getOptions(style.wall_copper));
                break;
            case 'WALL_GOLD':
                finalBlock = selectFrom(style.wall_gold.base, x, y, z, getMode(style.wall_gold), getOptions(style.wall_gold));
                break;
            case 'WALL_PRISMARINE':
                finalBlock = selectFrom(style.wall_prismarine.base, x, y, z, getMode(style.wall_prismarine), getOptions(style.wall_prismarine));
                break;
            case 'WALL_PURPUR':
                finalBlock = selectFrom(style.wall_purpur.base, x, y, z, getMode(style.wall_purpur), getOptions(style.wall_purpur));
                break;
            case 'WALL_BLACKSTONE':
                finalBlock = selectFrom(style.wall_blackstone.base, x, y, z, getMode(style.wall_blackstone), getOptions(style.wall_blackstone));
                break;

            // WALLS - 16 Colors
            case 'WALL_WHITE':
                finalBlock = selectFrom(style.wall_white.base, x, y, z, getMode(style.wall_white), getOptions(style.wall_white));
                break;
            case 'WALL_BLACK':
                finalBlock = selectFrom(style.wall_black.base, x, y, z, getMode(style.wall_black), getOptions(style.wall_black));
                break;
            case 'WALL_GRAY':
                finalBlock = selectFrom(style.wall_gray.base, x, y, z, getMode(style.wall_gray), getOptions(style.wall_gray));
                break;
            case 'WALL_LIGHT_GRAY':
                finalBlock = selectFrom(style.wall_light_gray.base, x, y, z, getMode(style.wall_light_gray), getOptions(style.wall_light_gray));
                break;
            case 'WALL_RED':
                finalBlock = selectFrom(style.wall_red.base, x, y, z, getMode(style.wall_red), getOptions(style.wall_red));
                break;
            case 'WALL_ORANGE':
                finalBlock = selectFrom(style.wall_orange.base, x, y, z, getMode(style.wall_orange), getOptions(style.wall_orange));
                break;
            case 'WALL_YELLOW':
                finalBlock = selectFrom(style.wall_yellow.base, x, y, z, getMode(style.wall_yellow), getOptions(style.wall_yellow));
                break;
            case 'WALL_PINK':
                finalBlock = selectFrom(style.wall_pink.base, x, y, z, getMode(style.wall_pink), getOptions(style.wall_pink));
                break;
            case 'WALL_BLUE':
                finalBlock = selectFrom(style.wall_blue.base, x, y, z, getMode(style.wall_blue), getOptions(style.wall_blue));
                break;
            case 'WALL_CYAN':
                finalBlock = selectFrom(style.wall_cyan.base, x, y, z, getMode(style.wall_cyan), getOptions(style.wall_cyan));
                break;
            case 'WALL_LIGHT_BLUE':
                finalBlock = selectFrom(style.wall_light_blue.base, x, y, z, getMode(style.wall_light_blue), getOptions(style.wall_light_blue));
                break;
            case 'WALL_GREEN':
                finalBlock = selectFrom(style.wall_green.base, x, y, z, getMode(style.wall_green), getOptions(style.wall_green));
                break;
            case 'WALL_LIME':
                finalBlock = selectFrom(style.wall_lime.base, x, y, z, getMode(style.wall_lime), getOptions(style.wall_lime));
                break;
            case 'WALL_BROWN':
                finalBlock = selectFrom(style.wall_brown.base, x, y, z, getMode(style.wall_brown), getOptions(style.wall_brown));
                break;
            case 'WALL_PURPLE':
                finalBlock = selectFrom(style.wall_purple.base, x, y, z, getMode(style.wall_purple), getOptions(style.wall_purple));
                break;
            case 'WALL_MAGENTA':
                finalBlock = selectFrom(style.wall_magenta.base, x, y, z, getMode(style.wall_magenta), getOptions(style.wall_magenta));
                break;

            // FRAMES
            case 'FRAME_WOOD':
                finalBlock = selectFrom(style.frame_wood.base, x, y, z, getMode(style.frame_wood), getOptions(style.frame_wood));
                properties = 'axis=y';
                break;
            case 'FRAME_DARK_OAK':
                finalBlock = selectFrom(style.frame_dark_oak.base, x, y, z, getMode(style.frame_dark_oak), getOptions(style.frame_dark_oak));
                properties = 'axis=y';
                break;
            case 'FRAME_BAMBOO':
                finalBlock = selectFrom(style.frame_bamboo.base, x, y, z, getMode(style.frame_bamboo), getOptions(style.frame_bamboo));
                properties = 'axis=y';
                break;
            case 'FRAME_STONE':
                finalBlock = selectFrom(style.frame_stone.base, x, y, z, getMode(style.frame_stone), getOptions(style.frame_stone));
                break;

            // FLOORS
            case 'FLOOR_STONE':
                finalBlock = selectFrom(style.floor_stone.base, x, y, z, getMode(style.floor_stone), getOptions(style.floor_stone));
                break;
            case 'FLOOR_WOOD':
                finalBlock = selectFrom(style.floor_wood.base, x, y, z, getMode(style.floor_wood), getOptions(style.floor_wood));
                break;
            case 'FLOOR_COBBLE':
                finalBlock = selectFrom(style.floor_cobble.base, x, y, z, getMode(style.floor_cobble), getOptions(style.floor_cobble));
                break;
            case 'FLOOR_MOSSY':
                finalBlock = selectFrom(style.floor_mossy.base, x, y, z, getMode(style.floor_mossy), getOptions(style.floor_mossy));
                break;
            case 'FLOOR_DEEPSLATE':
                finalBlock = selectFrom(style.floor_deepslate.base, x, y, z, getMode(style.floor_deepslate), getOptions(style.floor_deepslate));
                break;
            case 'FLOOR_DARK_OAK':
                finalBlock = selectFrom(style.floor_dark_oak.base, x, y, z, getMode(style.floor_dark_oak), getOptions(style.floor_dark_oak));
                break;
            case 'FLOOR_BAMBOO':
                finalBlock = selectFrom(style.floor_bamboo.base, x, y, z, getMode(style.floor_bamboo), getOptions(style.floor_bamboo));
                break;
            case 'FLOOR_CONCRETE':
                finalBlock = selectFrom(style.floor_concrete.base, x, y, z, getMode(style.floor_concrete), getOptions(style.floor_concrete));
                break;
            case 'FLOOR_SMOOTH':
                finalBlock = selectFrom(style.floor_smooth.base, x, y, z, getMode(style.floor_smooth), getOptions(style.floor_smooth));
                break;
            case 'FLOOR_QUARTZ':
                finalBlock = selectFrom(style.floor_quartz.base, x, y, z, getMode(style.floor_quartz), getOptions(style.floor_quartz));
                break;

            case 'WINDOW':
                finalBlock = style.window.glass;
                break;

            // ROOFS - All Types
            case 'ROOF_WOOD':
            case 'ROOF_DARK':
            case 'ROOF_DARK_OAK': // Alias for ROOF_DARK
            case 'ROOF_BAMBOO':
            case 'ROOF_STONE':
            case 'ROOF_DEEPSLATE':
            case 'ROOF_BLACKSTONE':
            case 'ROOF_RED':
            case 'ROOF_BLUE':
            case 'ROOF_GREEN':
            case 'ROOF_PURPLE':
            case 'ROOF_GOLD':
            case 'ROOF_COPPER':
                let roofStyle;
                if (type === 'ROOF_WOOD') roofStyle = style.roof_wood;
                else if (type === 'ROOF_DARK' || type === 'ROOF_DARK_OAK') roofStyle = style.roof_dark;
                else if (type === 'ROOF_BAMBOO') roofStyle = style.roof_bamboo;
                else if (type === 'ROOF_STONE') roofStyle = style.roof_stone;
                else if (type === 'ROOF_DEEPSLATE') roofStyle = style.roof_deepslate;
                else if (type === 'ROOF_BLACKSTONE') roofStyle = style.roof_blackstone;
                else if (type === 'ROOF_RED') roofStyle = style.roof_red;
                else if (type === 'ROOF_BLUE') roofStyle = style.roof_blue;
                else if (type === 'ROOF_GREEN') roofStyle = style.roof_green;
                else if (type === 'ROOF_PURPLE') roofStyle = style.roof_purple;
                else if (type === 'ROOF_GOLD') roofStyle = style.roof_gold;
                else if (type === 'ROOF_COPPER') roofStyle = style.roof_copper;

                // Smart Roof Logic
                // Use stair if edge exposed, slab if top/corner, full block if interior

                const hasNorth = !edges.north; // has neighbor
                const hasSouth = !edges.south;
                const hasEast = !edges.east;
                const hasWest = !edges.west;

                const neighbors = [hasNorth, hasSouth, hasEast, hasWest].filter(Boolean).length;

                // 检查上方是否有方块 (如果有，说明这是内部支撑或山墙，不是屋顶表面)
                const hasUp = voxelMap.has(posKey(x, y + 1, z));

                if (neighbors === 4 || hasUp) {
                    // Interior OR Covered by roof above -> Full block (Gable Wall / Support)
                    finalBlock = selectFrom(roofStyle.base, x, y, z);
                } else if (edges.north && !edges.south) {
                    // North Edge Exposed (Air) -> Back should be South (Solid)
                    finalBlock = roofStyle.stair;
                    properties = 'facing=south';
                } else if (edges.south && !edges.north) {
                    finalBlock = roofStyle.stair;
                    properties = 'facing=north';
                } else if (edges.east && !edges.west) {
                    finalBlock = roofStyle.stair;
                    properties = 'facing=west';
                } else if (edges.west && !edges.east) {
                    finalBlock = roofStyle.stair;
                    properties = 'facing=east';
                } else {
                    // Ridge or corner -> Use base block (no slab)
                    finalBlock = selectFrom(roofStyle.base, x, y, z);
                }
                break;

            default:
                // Handle unknown ROOF_ types by falling back to ROOF_DARK
                if (type.startsWith('ROOF_')) {
                    console.warn(`[ArchEngine] Unknown roof type "${type}", falling back to ROOF_DARK`);
                    const fallbackRoofStyle = style.roof_dark;
                    const hasNorthFb = !edges.north;
                    const hasSouthFb = !edges.south;
                    const hasEastFb = !edges.east;
                    const hasWestFb = !edges.west;
                    const neighborsFb = [hasNorthFb, hasSouthFb, hasEastFb, hasWestFb].filter(Boolean).length;
                    const hasUpFb = voxelMap.has(posKey(x, y + 1, z));
                    
                    if (neighborsFb === 4 || hasUpFb) {
                        finalBlock = selectFrom(fallbackRoofStyle.base, x, y, z);
                    } else if (edges.north && !edges.south) {
                        finalBlock = fallbackRoofStyle.stair;
                        properties = 'facing=south';
                    } else if (edges.south && !edges.north) {
                        finalBlock = fallbackRoofStyle.stair;
                        properties = 'facing=north';
                    } else if (edges.east && !edges.west) {
                        finalBlock = fallbackRoofStyle.stair;
                        properties = 'facing=west';
                    } else if (edges.west && !edges.east) {
                        finalBlock = fallbackRoofStyle.stair;
                        properties = 'facing=east';
                    } else {
                        finalBlock = selectFrom(fallbackRoofStyle.base, x, y, z);
                    }
                } else {
                    finalBlock = 'stone'; // Fallback for completely unknown types
                }
        }

        if (finalBlock) {
            outputBlocks.push({
                id: index + 1,
                position: [x, y, z],
                type: finalBlock,
                properties: properties || '0'
            });
        }
    });

    // ============ POST-PROCESSING: CLEANUP & FIX ============

    // 1. Re-map output blocks for fast lookup
    const finalMap = new Map();
    outputBlocks.forEach(b => finalMap.set(posKey(...b.position), b));

    const getFinalBlock = (x, y, z) => finalMap.get(posKey(x, y, z));

    // 2. Iterate and Fix
    const fixedOutput = outputBlocks.filter(block => {
        // Only fix stairs
        if (!block.type.includes('stairs')) return true;

        const [x, y, z] = block.position;

        // Check 6 neighbors
        const neighbors = [
            getFinalBlock(x + 1, y, z), getFinalBlock(x - 1, y, z),
            getFinalBlock(x, y + 1, z), getFinalBlock(x, y - 1, z),
            getFinalBlock(x, y, z + 1), getFinalBlock(x, y, z - 1)
        ].filter(b => b && b.type !== 'AIR'); // Filter existing non-air blocks

        // Rule 1: Floating Stair (6 sides air) -> Delete
        if (neighbors.length === 0) {
            return false; // Remove this block
        }

        // Rule 2: Single Connection to another Stair -> Copy attributes
        if (neighbors.length === 1 && neighbors[0].type.includes('stairs')) {
            const neighbor = neighbors[0];
            // Copy orientation from the valid neighbor to fix broken chain
            block.properties = neighbor.properties;
        }

        return true; // Keep block
    });

    // ============ PASS 3: DIAGONAL STAIR DETECTION (DISABLED) ============
    // This pass was causing issues with roof rendering.
    // If you need to re-enable it, uncomment the code below.
    // For now, return fixedOutput directly without stair conversion.

    return fixedOutput;

    /* DISABLED - Diagonal Stair Detection
    const stairCandidates = new Set();
    const stairFacingMap = new Map();
    const stairHalfMap = new Map();

    const ascendingDirections = [
        { dx: 1, dz: 0, facing: 'west' },
        { dx: -1, dz: 0, facing: 'east' },
        { dx: 0, dz: 1, facing: 'north' },
        { dx: 0, dz: -1, facing: 'south' },
    ];

    const descendingDirections = [
        { dx: 1, dz: 0, facing: 'east' },
        { dx: -1, dz: 0, facing: 'west' },
        { dx: 0, dz: 1, facing: 'south' },
        { dx: 0, dz: -1, facing: 'north' },
    ];

    const stairDetectionMap = new Map();
    fixedOutput.forEach(b => stairDetectionMap.set(posKey(...b.position), b));

    // ... (rest of the stair detection logic)

    return finalWithStairs;
    */
};
