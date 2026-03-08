/**
 * Minecraft Version Configuration
 * Supports 1.8.x to 1.21+
 * 
 * Sources:
 * - https://github.com/misode/mcmeta (Official block registries)
 * - https://minecraft.wiki/w/Java_Edition_data_values/Protocol_and_data_versions
 * - https://minecraft.wiki/w/Pack_format
 * 
 * Block data auto-generated from official mcmeta repository
 * Generated: 2026-01-06
 */

// Version groups with metadata
export const VERSION_GROUPS = [
    { id: '1.21', label: '1.21+ (最新)', description: 'Tricky Trials', dataVersion: 3953, packFormat: 48, isLatest: true },
    { id: '1.20', label: '1.20.x', description: 'Trails & Tales', dataVersion: 3700, packFormat: 15 },
    { id: '1.19', label: '1.19.x', description: 'The Wild Update', dataVersion: 3337, packFormat: 10 },
    { id: '1.18', label: '1.18.x', description: 'Caves & Cliffs Part 2', dataVersion: 2975, packFormat: 8 },
    { id: '1.17', label: '1.17.x', description: 'Caves & Cliffs Part 1', dataVersion: 2730, packFormat: 7 },
    { id: '1.16', label: '1.16.x', description: 'Nether Update', dataVersion: 2586, packFormat: 6 },
    { id: '1.15', label: '1.15.x', description: 'Buzzy Bees', dataVersion: 2230, packFormat: 5 },
    { id: '1.14', label: '1.14.x', description: 'Village & Pillage', dataVersion: 1976, packFormat: 4 },
    { id: '1.13', label: '1.13.x', description: 'Update Aquatic', dataVersion: 1631, packFormat: 4 },
    // Legacy versions - NO datapack support (datapacks introduced in 1.13)
    // 1.11-1.12: Uses lowercase entity IDs (falling_block, commandblock_minecart) but old Block: format
    { id: '1.12', label: '1.12.x', description: 'World of Color', dataVersion: 1343, packFormat: 3, isLegacy: true, usesNumericIds: true, noDatapack: true },
    { id: '1.11', label: '1.11.x', description: 'Exploration Update', dataVersion: 922, packFormat: 3, isLegacy: true, usesNumericIds: true, noDatapack: true },
    // 1.8-1.10: Uses old entity IDs (FallingSand, MinecartCommandBlock)
    { id: '1.9-1.10', label: '1.9.x - 1.10.x', description: 'Combat Update', dataVersion: 512, packFormat: 2, isLegacy: true, usesNumericIds: true, noDatapack: true, usesOldEntityIds: true },
    { id: '1.8', label: '1.8.x', description: 'Bountiful Update', dataVersion: 0, packFormat: 1, isLegacy: true, usesNumericIds: true, noDatapack: true, usesOldEntityIds: true }
];

// Filter versions that support datapacks (1.13+)
export const DATAPACK_VERSIONS = VERSION_GROUPS.filter(v => !v.noDatapack);

// ============================================
// BLOCK_RENAMES - Auto-generated from mcmeta
// Source: https://github.com/misode/mcmeta
// Format: { blockName: { maxVersion: 'oldName' or null } }
// null means block doesn't exist in that version
// ============================================
export const BLOCK_RENAMES = {
    // === Name changes ===
    'short_grass': { '1.20': 'grass' },
    'dirt_path': { '1.16': 'grass_path' },

    // === 1.15 (Buzzy Bees) additions (null in 1.14) ===
    'bee_nest': { '1.14': null },
    'beehive': { '1.14': null },
    'honey_block': { '1.14': null },
    'honeycomb_block': { '1.14': null },

    // === 1.16 (Nether Update) additions (null in 1.15) ===
    'ancient_debris': { '1.15': null },
    'basalt': { '1.15': null },
    'blackstone': { '1.15': null },
    'blackstone_slab': { '1.15': null },
    'blackstone_stairs': { '1.15': null },
    'blackstone_wall': { '1.15': null },
    'chain': { '1.15': null },
    'chiseled_nether_bricks': { '1.15': null },
    'chiseled_polished_blackstone': { '1.15': null },
    'cracked_nether_bricks': { '1.15': null },
    'cracked_polished_blackstone_bricks': { '1.15': null },
    'crimson_button': { '1.15': null },
    'crimson_door': { '1.15': null },
    'crimson_fence': { '1.15': null },
    'crimson_fence_gate': { '1.15': null },
    'crimson_fungus': { '1.15': null },
    'crimson_hyphae': { '1.15': null },
    'crimson_nylium': { '1.15': null },
    'crimson_planks': { '1.15': null },
    'crimson_pressure_plate': { '1.15': null },
    'crimson_roots': { '1.15': null },
    'crimson_sign': { '1.15': null },
    'crimson_slab': { '1.15': null },
    'crimson_stairs': { '1.15': null },
    'crimson_stem': { '1.15': null },
    'crimson_trapdoor': { '1.15': null },
    'crimson_wall_sign': { '1.15': null },
    'crying_obsidian': { '1.15': null },
    'gilded_blackstone': { '1.15': null },
    'lodestone': { '1.15': null },
    'nether_gold_ore': { '1.15': null },
    'nether_sprouts': { '1.15': null },
    'netherite_block': { '1.15': null },
    'polished_basalt': { '1.15': null },
    'polished_blackstone': { '1.15': null },
    'polished_blackstone_brick_slab': { '1.15': null },
    'polished_blackstone_brick_stairs': { '1.15': null },
    'polished_blackstone_brick_wall': { '1.15': null },
    'polished_blackstone_bricks': { '1.15': null },
    'polished_blackstone_button': { '1.15': null },
    'polished_blackstone_pressure_plate': { '1.15': null },
    'polished_blackstone_slab': { '1.15': null },
    'polished_blackstone_stairs': { '1.15': null },
    'polished_blackstone_wall': { '1.15': null },
    'potted_crimson_fungus': { '1.15': null },
    'potted_crimson_roots': { '1.15': null },
    'potted_warped_fungus': { '1.15': null },
    'potted_warped_roots': { '1.15': null },
    'quartz_bricks': { '1.15': null },
    'respawn_anchor': { '1.15': null },
    'shroomlight': { '1.15': null },
    'soul_campfire': { '1.15': null },
    'soul_fire': { '1.15': null },
    'soul_lantern': { '1.15': null },
    'soul_soil': { '1.15': null },
    'soul_torch': { '1.15': null },
    'soul_wall_torch': { '1.15': null },
    'stripped_crimson_hyphae': { '1.15': null },
    'stripped_crimson_stem': { '1.15': null },
    'stripped_warped_hyphae': { '1.15': null },
    'stripped_warped_stem': { '1.15': null },
    'target': { '1.15': null },
    'twisting_vines': { '1.15': null },
    'twisting_vines_plant': { '1.15': null },
    'warped_button': { '1.15': null },
    'warped_door': { '1.15': null },
    'warped_fence': { '1.15': null },
    'warped_fence_gate': { '1.15': null },
    'warped_fungus': { '1.15': null },
    'warped_hyphae': { '1.15': null },
    'warped_nylium': { '1.15': null },
    'warped_planks': { '1.15': null },
    'warped_pressure_plate': { '1.15': null },
    'warped_roots': { '1.15': null },
    'warped_sign': { '1.15': null },
    'warped_slab': { '1.15': null },
    'warped_stairs': { '1.15': null },
    'warped_stem': { '1.15': null },
    'warped_trapdoor': { '1.15': null },
    'warped_wall_sign': { '1.15': null },
    'warped_wart_block': { '1.15': null },
    'weeping_vines': { '1.15': null },
    'weeping_vines_plant': { '1.15': null },

    // === 1.17 (Caves & Cliffs P1) additions (null in 1.16) ===
    'amethyst_block': { '1.16': null },
    'amethyst_cluster': { '1.16': null },
    'azalea': { '1.16': null },
    'azalea_leaves': { '1.16': null },
    'big_dripleaf': { '1.16': null },
    'big_dripleaf_stem': { '1.16': null },
    'black_candle': { '1.16': null },
    'black_candle_cake': { '1.16': null },
    'blue_candle': { '1.16': null },
    'blue_candle_cake': { '1.16': null },
    'brown_candle': { '1.16': null },
    'brown_candle_cake': { '1.16': null },
    'budding_amethyst': { '1.16': null },
    'calcite': { '1.16': null },
    'candle': { '1.16': null },
    'candle_cake': { '1.16': null },
    'cave_vines': { '1.16': null },
    'cave_vines_plant': { '1.16': null },
    'chiseled_deepslate': { '1.16': null },
    'cobbled_deepslate': { '1.16': null },
    'cobbled_deepslate_slab': { '1.16': null },
    'cobbled_deepslate_stairs': { '1.16': null },
    'cobbled_deepslate_wall': { '1.16': null },
    'copper_block': { '1.16': null },
    'copper_ore': { '1.16': null },
    'cracked_deepslate_bricks': { '1.16': null },
    'cracked_deepslate_tiles': { '1.16': null },
    'cut_copper': { '1.16': null },
    'cut_copper_slab': { '1.16': null },
    'cut_copper_stairs': { '1.16': null },
    'cyan_candle': { '1.16': null },
    'cyan_candle_cake': { '1.16': null },
    'deepslate': { '1.16': null },
    'deepslate_brick_slab': { '1.16': null },
    'deepslate_brick_stairs': { '1.16': null },
    'deepslate_brick_wall': { '1.16': null },
    'deepslate_bricks': { '1.16': null },
    'deepslate_coal_ore': { '1.16': null },
    'deepslate_copper_ore': { '1.16': null },
    'deepslate_diamond_ore': { '1.16': null },
    'deepslate_emerald_ore': { '1.16': null },
    'deepslate_gold_ore': { '1.16': null },
    'deepslate_iron_ore': { '1.16': null },
    'deepslate_lapis_ore': { '1.16': null },
    'deepslate_redstone_ore': { '1.16': null },
    'deepslate_tile_slab': { '1.16': null },
    'deepslate_tile_stairs': { '1.16': null },
    'deepslate_tile_wall': { '1.16': null },
    'deepslate_tiles': { '1.16': null },
    'dripstone_block': { '1.16': null },
    'exposed_copper': { '1.16': null },
    'exposed_cut_copper': { '1.16': null },
    'exposed_cut_copper_slab': { '1.16': null },
    'exposed_cut_copper_stairs': { '1.16': null },
    'flowering_azalea': { '1.16': null },
    'flowering_azalea_leaves': { '1.16': null },
    'glow_lichen': { '1.16': null },
    'gray_candle': { '1.16': null },
    'gray_candle_cake': { '1.16': null },
    'green_candle': { '1.16': null },
    'green_candle_cake': { '1.16': null },
    'hanging_roots': { '1.16': null },
    'infested_deepslate': { '1.16': null },
    'large_amethyst_bud': { '1.16': null },
    'lava_cauldron': { '1.16': null },
    'light': { '1.16': null },
    'light_blue_candle': { '1.16': null },
    'light_blue_candle_cake': { '1.16': null },
    'light_gray_candle': { '1.16': null },
    'light_gray_candle_cake': { '1.16': null },
    'lightning_rod': { '1.16': null },
    'lime_candle': { '1.16': null },
    'lime_candle_cake': { '1.16': null },
    'magenta_candle': { '1.16': null },
    'magenta_candle_cake': { '1.16': null },
    'medium_amethyst_bud': { '1.16': null },
    'moss_block': { '1.16': null },
    'moss_carpet': { '1.16': null },
    'orange_candle': { '1.16': null },
    'orange_candle_cake': { '1.16': null },
    'oxidized_copper': { '1.16': null },
    'oxidized_cut_copper': { '1.16': null },
    'oxidized_cut_copper_slab': { '1.16': null },
    'oxidized_cut_copper_stairs': { '1.16': null },
    'pink_candle': { '1.16': null },
    'pink_candle_cake': { '1.16': null },
    'pointed_dripstone': { '1.16': null },
    'polished_deepslate': { '1.16': null },
    'polished_deepslate_slab': { '1.16': null },
    'polished_deepslate_stairs': { '1.16': null },
    'polished_deepslate_wall': { '1.16': null },
    'potted_azalea_bush': { '1.16': null },
    'potted_flowering_azalea_bush': { '1.16': null },
    'powder_snow': { '1.16': null },
    'powder_snow_cauldron': { '1.16': null },
    'purple_candle': { '1.16': null },
    'purple_candle_cake': { '1.16': null },
    'raw_copper_block': { '1.16': null },
    'raw_gold_block': { '1.16': null },
    'raw_iron_block': { '1.16': null },
    'red_candle': { '1.16': null },
    'red_candle_cake': { '1.16': null },
    'rooted_dirt': { '1.16': null },
    'sculk_sensor': { '1.16': null },
    'small_amethyst_bud': { '1.16': null },
    'small_dripleaf': { '1.16': null },
    'smooth_basalt': { '1.16': null },
    'spore_blossom': { '1.16': null },
    'tinted_glass': { '1.16': null },
    'tuff': { '1.16': null },
    'water_cauldron': { '1.16': null },
    'waxed_copper_block': { '1.16': null },
    'waxed_cut_copper': { '1.16': null },
    'waxed_cut_copper_slab': { '1.16': null },
    'waxed_cut_copper_stairs': { '1.16': null },
    'waxed_exposed_copper': { '1.16': null },
    'waxed_exposed_cut_copper': { '1.16': null },
    'waxed_exposed_cut_copper_slab': { '1.16': null },
    'waxed_exposed_cut_copper_stairs': { '1.16': null },
    'waxed_oxidized_copper': { '1.16': null },
    'waxed_oxidized_cut_copper': { '1.16': null },
    'waxed_oxidized_cut_copper_slab': { '1.16': null },
    'waxed_oxidized_cut_copper_stairs': { '1.16': null },
    'waxed_weathered_copper': { '1.16': null },
    'waxed_weathered_cut_copper': { '1.16': null },
    'waxed_weathered_cut_copper_slab': { '1.16': null },
    'waxed_weathered_cut_copper_stairs': { '1.16': null },
    'weathered_copper': { '1.16': null },
    'weathered_cut_copper': { '1.16': null },
    'weathered_cut_copper_slab': { '1.16': null },
    'weathered_cut_copper_stairs': { '1.16': null },
    'white_candle': { '1.16': null },
    'white_candle_cake': { '1.16': null },
    'yellow_candle': { '1.16': null },
    'yellow_candle_cake': { '1.16': null },

    // === 1.19 (Wild Update) additions (null in 1.18) ===
    'frogspawn': { '1.18': null },
    'mangrove_button': { '1.18': null },
    'mangrove_door': { '1.18': null },
    'mangrove_fence': { '1.18': null },
    'mangrove_fence_gate': { '1.18': null },
    'mangrove_leaves': { '1.18': null },
    'mangrove_log': { '1.18': null },
    'mangrove_planks': { '1.18': null },
    'mangrove_pressure_plate': { '1.18': null },
    'mangrove_propagule': { '1.18': null },
    'mangrove_roots': { '1.18': null },
    'mangrove_sign': { '1.18': null },
    'mangrove_slab': { '1.18': null },
    'mangrove_stairs': { '1.18': null },
    'mangrove_trapdoor': { '1.18': null },
    'mangrove_wall_sign': { '1.18': null },
    'mangrove_wood': { '1.18': null },
    'mud': { '1.18': null },
    'mud_brick_slab': { '1.18': null },
    'mud_brick_stairs': { '1.18': null },
    'mud_brick_wall': { '1.18': null },
    'mud_bricks': { '1.18': null },
    'muddy_mangrove_roots': { '1.18': null },
    'ochre_froglight': { '1.18': null },
    'packed_mud': { '1.18': null },
    'pearlescent_froglight': { '1.18': null },
    'potted_mangrove_propagule': { '1.18': null },
    'reinforced_deepslate': { '1.18': null },
    'sculk': { '1.18': null },
    'sculk_catalyst': { '1.18': null },
    'sculk_shrieker': { '1.18': null },
    'sculk_vein': { '1.18': null },
    'stripped_mangrove_log': { '1.18': null },
    'stripped_mangrove_wood': { '1.18': null },
    'verdant_froglight': { '1.18': null },

    // === 1.20 (Trails & Tales) additions (null in 1.19) ===
    'acacia_hanging_sign': { '1.19': null },
    'acacia_wall_hanging_sign': { '1.19': null },
    'bamboo_block': { '1.19': null },
    'bamboo_button': { '1.19': null },
    'bamboo_door': { '1.19': null },
    'bamboo_fence': { '1.19': null },
    'bamboo_fence_gate': { '1.19': null },
    'bamboo_hanging_sign': { '1.19': null },
    'bamboo_mosaic': { '1.19': null },
    'bamboo_mosaic_slab': { '1.19': null },
    'bamboo_mosaic_stairs': { '1.19': null },
    'bamboo_planks': { '1.19': null },
    'bamboo_pressure_plate': { '1.19': null },
    'bamboo_sign': { '1.19': null },
    'bamboo_slab': { '1.19': null },
    'bamboo_stairs': { '1.19': null },
    'bamboo_trapdoor': { '1.19': null },
    'bamboo_wall_hanging_sign': { '1.19': null },
    'bamboo_wall_sign': { '1.19': null },
    'birch_hanging_sign': { '1.19': null },
    'birch_wall_hanging_sign': { '1.19': null },
    'calibrated_sculk_sensor': { '1.19': null },
    'cherry_button': { '1.19': null },
    'cherry_door': { '1.19': null },
    'cherry_fence': { '1.19': null },
    'cherry_fence_gate': { '1.19': null },
    'cherry_hanging_sign': { '1.19': null },
    'cherry_leaves': { '1.19': null },
    'cherry_log': { '1.19': null },
    'cherry_planks': { '1.19': null },
    'cherry_pressure_plate': { '1.19': null },
    'cherry_sapling': { '1.19': null },
    'cherry_sign': { '1.19': null },
    'cherry_slab': { '1.19': null },
    'cherry_stairs': { '1.19': null },
    'cherry_trapdoor': { '1.19': null },
    'cherry_wall_hanging_sign': { '1.19': null },
    'cherry_wall_sign': { '1.19': null },
    'cherry_wood': { '1.19': null },
    'chiseled_bookshelf': { '1.19': null },
    'crimson_hanging_sign': { '1.19': null },
    'crimson_wall_hanging_sign': { '1.19': null },
    'dark_oak_hanging_sign': { '1.19': null },
    'dark_oak_wall_hanging_sign': { '1.19': null },
    'decorated_pot': { '1.19': null },
    'jungle_hanging_sign': { '1.19': null },
    'jungle_wall_hanging_sign': { '1.19': null },
    'mangrove_hanging_sign': { '1.19': null },
    'mangrove_wall_hanging_sign': { '1.19': null },
    'oak_hanging_sign': { '1.19': null },
    'oak_wall_hanging_sign': { '1.19': null },
    'piglin_head': { '1.19': null },
    'piglin_wall_head': { '1.19': null },
    'pink_petals': { '1.19': null },
    'pitcher_crop': { '1.19': null },
    'pitcher_plant': { '1.19': null },
    'potted_cherry_sapling': { '1.19': null },
    'potted_torchflower': { '1.19': null },
    'sniffer_egg': { '1.19': null },
    'spruce_hanging_sign': { '1.19': null },
    'spruce_wall_hanging_sign': { '1.19': null },
    'stripped_bamboo_block': { '1.19': null },
    'stripped_cherry_log': { '1.19': null },
    'stripped_cherry_wood': { '1.19': null },
    'suspicious_gravel': { '1.19': null },
    'suspicious_sand': { '1.19': null },
    'torchflower': { '1.19': null },
    'torchflower_crop': { '1.19': null },
    'warped_hanging_sign': { '1.19': null },
    'warped_wall_hanging_sign': { '1.19': null },

    // === 1.21 (Tricky Trials) additions (null in 1.20) ===
    'chiseled_copper': { '1.20': null },
    'chiseled_tuff': { '1.20': null },
    'chiseled_tuff_bricks': { '1.20': null },
    'copper_bulb': { '1.20': null },
    'copper_door': { '1.20': null },
    'copper_grate': { '1.20': null },
    'copper_trapdoor': { '1.20': null },
    'crafter': { '1.20': null },
    'exposed_chiseled_copper': { '1.20': null },
    'exposed_copper_bulb': { '1.20': null },
    'exposed_copper_door': { '1.20': null },
    'exposed_copper_grate': { '1.20': null },
    'exposed_copper_trapdoor': { '1.20': null },
    'heavy_core': { '1.20': null },
    'oxidized_chiseled_copper': { '1.20': null },
    'oxidized_copper_bulb': { '1.20': null },
    'oxidized_copper_door': { '1.20': null },
    'oxidized_copper_grate': { '1.20': null },
    'oxidized_copper_trapdoor': { '1.20': null },
    'polished_tuff': { '1.20': null },
    'polished_tuff_slab': { '1.20': null },
    'polished_tuff_stairs': { '1.20': null },
    'polished_tuff_wall': { '1.20': null },
    'trial_spawner': { '1.20': null },
    'tuff_brick_slab': { '1.20': null },
    'tuff_brick_stairs': { '1.20': null },
    'tuff_brick_wall': { '1.20': null },
    'tuff_bricks': { '1.20': null },
    'tuff_slab': { '1.20': null },
    'tuff_stairs': { '1.20': null },
    'tuff_wall': { '1.20': null },
    'vault': { '1.20': null },
    'waxed_chiseled_copper': { '1.20': null },
    'waxed_copper_bulb': { '1.20': null },
    'waxed_copper_door': { '1.20': null },
    'waxed_copper_grate': { '1.20': null },
    'waxed_copper_trapdoor': { '1.20': null },
    'waxed_exposed_chiseled_copper': { '1.20': null },
    'waxed_exposed_copper_bulb': { '1.20': null },
    'waxed_exposed_copper_door': { '1.20': null },
    'waxed_exposed_copper_grate': { '1.20': null },
    'waxed_exposed_copper_trapdoor': { '1.20': null },
    'waxed_oxidized_chiseled_copper': { '1.20': null },
    'waxed_oxidized_copper_bulb': { '1.20': null },
    'waxed_oxidized_copper_door': { '1.20': null },
    'waxed_oxidized_copper_grate': { '1.20': null },
    'waxed_oxidized_copper_trapdoor': { '1.20': null },
    'waxed_weathered_chiseled_copper': { '1.20': null },
    'waxed_weathered_copper_bulb': { '1.20': null },
    'waxed_weathered_copper_door': { '1.20': null },
    'waxed_weathered_copper_grate': { '1.20': null },
    'waxed_weathered_copper_trapdoor': { '1.20': null },
    'weathered_chiseled_copper': { '1.20': null },
    'weathered_copper_bulb': { '1.20': null },
    'weathered_copper_door': { '1.20': null },
    'weathered_copper_grate': { '1.20': null },
    'weathered_copper_trapdoor': { '1.20': null },
};

// ============================================
// BLOCK_FALLBACKS - Color/material similar blocks
// Used when a block doesn't exist in target version
// ============================================
export const BLOCK_FALLBACKS = {
    // Hanging signs -> regular signs
    'acacia_hanging_sign': 'acacia_sign', 'acacia_wall_hanging_sign': 'acacia_sign',
    'birch_hanging_sign': 'birch_sign', 'birch_wall_hanging_sign': 'birch_sign',
    'cherry_hanging_sign': 'birch_sign', 'cherry_wall_hanging_sign': 'birch_sign',
    'crimson_hanging_sign': 'dark_oak_sign', 'crimson_wall_hanging_sign': 'dark_oak_sign',
    'dark_oak_hanging_sign': 'dark_oak_sign', 'dark_oak_wall_hanging_sign': 'dark_oak_sign',
    'jungle_hanging_sign': 'jungle_sign', 'jungle_wall_hanging_sign': 'jungle_sign',
    'mangrove_hanging_sign': 'jungle_sign', 'mangrove_wall_hanging_sign': 'jungle_sign',
    'oak_hanging_sign': 'oak_sign', 'oak_wall_hanging_sign': 'oak_sign',
    'spruce_hanging_sign': 'spruce_sign', 'spruce_wall_hanging_sign': 'spruce_sign',
    'warped_hanging_sign': 'oak_sign', 'warped_wall_hanging_sign': 'oak_sign',
    'bamboo_hanging_sign': 'oak_sign', 'bamboo_wall_hanging_sign': 'oak_sign',
    
    // Amethyst
    'amethyst_block': 'purple_wool', 'amethyst_cluster': 'purple_wool',
    'budding_amethyst': 'purple_wool', 'large_amethyst_bud': 'purple_wool',
    'medium_amethyst_bud': 'purple_wool', 'small_amethyst_bud': 'purple_wool',
    
    // Bamboo wood
    'bamboo_block': 'oak_log', 'stripped_bamboo_block': 'stripped_oak_log',
    'bamboo_planks': 'oak_planks', 'bamboo_slab': 'oak_slab', 'bamboo_stairs': 'oak_stairs',
    'bamboo_fence': 'oak_fence', 'bamboo_fence_gate': 'oak_fence_gate',
    'bamboo_door': 'oak_door', 'bamboo_trapdoor': 'oak_trapdoor',
    'bamboo_button': 'oak_button', 'bamboo_pressure_plate': 'oak_pressure_plate',
    'bamboo_sign': 'oak_sign', 'bamboo_wall_sign': 'oak_sign',
    'bamboo_mosaic': 'oak_planks', 'bamboo_mosaic_slab': 'oak_slab', 'bamboo_mosaic_stairs': 'oak_stairs',
    
    // Cherry wood
    'cherry_planks': 'birch_planks', 'cherry_slab': 'birch_slab', 'cherry_stairs': 'birch_stairs',
    'cherry_fence': 'birch_fence', 'cherry_fence_gate': 'birch_fence_gate',
    'cherry_door': 'birch_door', 'cherry_trapdoor': 'birch_trapdoor',
    'cherry_button': 'birch_button', 'cherry_pressure_plate': 'birch_pressure_plate',
    'cherry_sign': 'birch_sign', 'cherry_wall_sign': 'birch_sign',
    'cherry_log': 'birch_log', 'stripped_cherry_log': 'stripped_birch_log',
    'cherry_wood': 'birch_wood', 'stripped_cherry_wood': 'stripped_birch_wood',
    'cherry_leaves': 'pink_wool', 'cherry_sapling': 'birch_sapling',
    'potted_cherry_sapling': 'flower_pot',
    
    // Crimson wood (Nether)
    'crimson_planks': 'dark_oak_planks', 'crimson_slab': 'dark_oak_slab', 'crimson_stairs': 'dark_oak_stairs',
    'crimson_fence': 'dark_oak_fence', 'crimson_fence_gate': 'dark_oak_fence_gate',
    'crimson_door': 'dark_oak_door', 'crimson_trapdoor': 'dark_oak_trapdoor',
    'crimson_button': 'dark_oak_button', 'crimson_pressure_plate': 'dark_oak_pressure_plate',
    'crimson_sign': 'dark_oak_sign', 'crimson_wall_sign': 'dark_oak_sign',
    'crimson_stem': 'dark_oak_log', 'stripped_crimson_stem': 'stripped_dark_oak_log',
    'crimson_hyphae': 'dark_oak_wood', 'stripped_crimson_hyphae': 'stripped_dark_oak_wood',
    'crimson_nylium': 'netherrack', 'crimson_fungus': 'red_mushroom', 'crimson_roots': 'dead_bush',
    'potted_crimson_fungus': 'flower_pot', 'potted_crimson_roots': 'flower_pot',
    
    // Warped wood (Nether)
    'warped_planks': 'oak_planks', 'warped_slab': 'oak_slab', 'warped_stairs': 'oak_stairs',
    'warped_fence': 'oak_fence', 'warped_fence_gate': 'oak_fence_gate',
    'warped_door': 'oak_door', 'warped_trapdoor': 'oak_trapdoor',
    'warped_button': 'oak_button', 'warped_pressure_plate': 'oak_pressure_plate',
    'warped_sign': 'oak_sign', 'warped_wall_sign': 'oak_sign',
    'warped_stem': 'oak_log', 'stripped_warped_stem': 'stripped_oak_log',
    'warped_hyphae': 'oak_wood', 'stripped_warped_hyphae': 'stripped_oak_wood',
    'warped_nylium': 'netherrack', 'warped_fungus': 'brown_mushroom', 'warped_roots': 'dead_bush',
    'warped_wart_block': 'nether_wart_block',
    'potted_warped_fungus': 'flower_pot', 'potted_warped_roots': 'flower_pot',
    
    // Mangrove wood
    'mangrove_planks': 'jungle_planks', 'mangrove_slab': 'jungle_slab', 'mangrove_stairs': 'jungle_stairs',
    'mangrove_fence': 'jungle_fence', 'mangrove_fence_gate': 'jungle_fence_gate',
    'mangrove_door': 'jungle_door', 'mangrove_trapdoor': 'jungle_trapdoor',
    'mangrove_button': 'jungle_button', 'mangrove_pressure_plate': 'jungle_pressure_plate',
    'mangrove_sign': 'jungle_sign', 'mangrove_wall_sign': 'jungle_sign',
    'mangrove_log': 'jungle_log', 'stripped_mangrove_log': 'stripped_jungle_log',
    'mangrove_wood': 'jungle_wood', 'stripped_mangrove_wood': 'stripped_jungle_wood',
    'mangrove_leaves': 'jungle_leaves', 'mangrove_propagule': 'oak_sapling',
    'mangrove_roots': 'oak_fence', 'muddy_mangrove_roots': 'dirt',
    'potted_mangrove_propagule': 'flower_pot',

    // Blackstone
    'blackstone': 'cobblestone', 'blackstone_slab': 'stone_slab', 'blackstone_stairs': 'cobblestone_stairs',
    'blackstone_wall': 'cobblestone_wall', 'gilded_blackstone': 'gold_ore',
    'polished_blackstone': 'stone_bricks', 'polished_blackstone_slab': 'stone_brick_slab',
    'polished_blackstone_stairs': 'stone_brick_stairs', 'polished_blackstone_wall': 'stone_brick_wall',
    'polished_blackstone_bricks': 'stone_bricks', 'cracked_polished_blackstone_bricks': 'cracked_stone_bricks',
    'polished_blackstone_brick_slab': 'stone_brick_slab', 'polished_blackstone_brick_stairs': 'stone_brick_stairs',
    'polished_blackstone_brick_wall': 'stone_brick_wall',
    'polished_blackstone_button': 'stone_button', 'polished_blackstone_pressure_plate': 'stone_pressure_plate',
    'chiseled_polished_blackstone': 'chiseled_stone_bricks',
    
    // Deepslate
    'deepslate': 'stone', 'cobbled_deepslate': 'cobblestone',
    'cobbled_deepslate_slab': 'cobblestone_slab', 'cobbled_deepslate_stairs': 'cobblestone_stairs',
    'cobbled_deepslate_wall': 'cobblestone_wall',
    'polished_deepslate': 'stone', 'polished_deepslate_slab': 'stone_slab',
    'polished_deepslate_stairs': 'stone_stairs', 'polished_deepslate_wall': 'stone_brick_wall',
    'deepslate_bricks': 'stone_bricks', 'cracked_deepslate_bricks': 'cracked_stone_bricks',
    'deepslate_brick_slab': 'stone_brick_slab', 'deepslate_brick_stairs': 'stone_brick_stairs',
    'deepslate_brick_wall': 'stone_brick_wall',
    'deepslate_tiles': 'stone_bricks', 'cracked_deepslate_tiles': 'cracked_stone_bricks',
    'deepslate_tile_slab': 'stone_brick_slab', 'deepslate_tile_stairs': 'stone_brick_stairs',
    'deepslate_tile_wall': 'stone_brick_wall', 'chiseled_deepslate': 'chiseled_stone_bricks',
    'infested_deepslate': 'infested_stone', 'reinforced_deepslate': 'obsidian',
    
    // Deepslate ores
    'deepslate_coal_ore': 'coal_ore', 'deepslate_iron_ore': 'iron_ore',
    'deepslate_copper_ore': 'iron_ore', 'deepslate_gold_ore': 'gold_ore',
    'deepslate_redstone_ore': 'redstone_ore', 'deepslate_emerald_ore': 'emerald_ore',
    'deepslate_lapis_ore': 'lapis_ore', 'deepslate_diamond_ore': 'diamond_ore',
    
    // Copper
    'copper_block': 'orange_terracotta', 'copper_ore': 'iron_ore',
    'cut_copper': 'orange_terracotta', 'cut_copper_slab': 'brick_slab', 'cut_copper_stairs': 'brick_stairs',
    'exposed_copper': 'light_gray_terracotta', 'exposed_cut_copper': 'light_gray_terracotta',
    'exposed_cut_copper_slab': 'stone_slab', 'exposed_cut_copper_stairs': 'stone_stairs',
    'weathered_copper': 'cyan_terracotta', 'weathered_cut_copper': 'cyan_terracotta',
    'weathered_cut_copper_slab': 'prismarine_slab', 'weathered_cut_copper_stairs': 'prismarine_stairs',
    'oxidized_copper': 'cyan_terracotta', 'oxidized_cut_copper': 'cyan_terracotta',
    'oxidized_cut_copper_slab': 'prismarine_slab', 'oxidized_cut_copper_stairs': 'prismarine_stairs',
    'waxed_copper_block': 'orange_terracotta', 'waxed_cut_copper': 'orange_terracotta',
    'waxed_cut_copper_slab': 'brick_slab', 'waxed_cut_copper_stairs': 'brick_stairs',
    'waxed_exposed_copper': 'light_gray_terracotta', 'waxed_exposed_cut_copper': 'light_gray_terracotta',
    'waxed_exposed_cut_copper_slab': 'stone_slab', 'waxed_exposed_cut_copper_stairs': 'stone_stairs',
    'waxed_weathered_copper': 'cyan_terracotta', 'waxed_weathered_cut_copper': 'cyan_terracotta',
    'waxed_weathered_cut_copper_slab': 'prismarine_slab', 'waxed_weathered_cut_copper_stairs': 'prismarine_stairs',
    'waxed_oxidized_copper': 'cyan_terracotta', 'waxed_oxidized_cut_copper': 'cyan_terracotta',
    'waxed_oxidized_cut_copper_slab': 'prismarine_slab', 'waxed_oxidized_cut_copper_stairs': 'prismarine_stairs',
    'raw_copper_block': 'orange_terracotta', 'lightning_rod': 'iron_bars',
    
    // 1.21 Copper variants
    'chiseled_copper': 'chiseled_stone_bricks', 'exposed_chiseled_copper': 'chiseled_stone_bricks',
    'weathered_chiseled_copper': 'chiseled_stone_bricks', 'oxidized_chiseled_copper': 'chiseled_stone_bricks',
    'waxed_chiseled_copper': 'chiseled_stone_bricks', 'waxed_exposed_chiseled_copper': 'chiseled_stone_bricks',
    'waxed_weathered_chiseled_copper': 'chiseled_stone_bricks', 'waxed_oxidized_chiseled_copper': 'chiseled_stone_bricks',
    'copper_grate': 'iron_bars', 'exposed_copper_grate': 'iron_bars',
    'weathered_copper_grate': 'iron_bars', 'oxidized_copper_grate': 'iron_bars',
    'waxed_copper_grate': 'iron_bars', 'waxed_exposed_copper_grate': 'iron_bars',
    'waxed_weathered_copper_grate': 'iron_bars', 'waxed_oxidized_copper_grate': 'iron_bars',
    'copper_bulb': 'redstone_lamp', 'exposed_copper_bulb': 'redstone_lamp',
    'weathered_copper_bulb': 'redstone_lamp', 'oxidized_copper_bulb': 'redstone_lamp',
    'waxed_copper_bulb': 'redstone_lamp', 'waxed_exposed_copper_bulb': 'redstone_lamp',
    'waxed_weathered_copper_bulb': 'redstone_lamp', 'waxed_oxidized_copper_bulb': 'redstone_lamp',
    'copper_door': 'iron_door', 'exposed_copper_door': 'iron_door',
    'weathered_copper_door': 'iron_door', 'oxidized_copper_door': 'iron_door',
    'waxed_copper_door': 'iron_door', 'waxed_exposed_copper_door': 'iron_door',
    'waxed_weathered_copper_door': 'iron_door', 'waxed_oxidized_copper_door': 'iron_door',
    'copper_trapdoor': 'iron_trapdoor', 'exposed_copper_trapdoor': 'iron_trapdoor',
    'weathered_copper_trapdoor': 'iron_trapdoor', 'oxidized_copper_trapdoor': 'iron_trapdoor',
    'waxed_copper_trapdoor': 'iron_trapdoor', 'waxed_exposed_copper_trapdoor': 'iron_trapdoor',
    'waxed_weathered_copper_trapdoor': 'iron_trapdoor', 'waxed_oxidized_copper_trapdoor': 'iron_trapdoor',
    
    // Tuff variants (1.21)
    'tuff': 'andesite', 'chiseled_tuff': 'chiseled_stone_bricks',
    'tuff_slab': 'andesite_slab', 'tuff_stairs': 'andesite_stairs', 'tuff_wall': 'andesite_wall',
    'polished_tuff': 'polished_andesite', 'polished_tuff_slab': 'polished_andesite_slab',
    'polished_tuff_stairs': 'polished_andesite_stairs', 'polished_tuff_wall': 'andesite_wall',
    'tuff_bricks': 'stone_bricks', 'chiseled_tuff_bricks': 'chiseled_stone_bricks',
    'tuff_brick_slab': 'stone_brick_slab', 'tuff_brick_stairs': 'stone_brick_stairs',
    'tuff_brick_wall': 'stone_brick_wall',
    
    // Mud
    'mud': 'brown_terracotta', 'packed_mud': 'brown_terracotta',
    'mud_bricks': 'bricks', 'mud_brick_slab': 'brick_slab',
    'mud_brick_stairs': 'brick_stairs', 'mud_brick_wall': 'brick_wall',
    
    // Sculk
    'sculk': 'black_wool', 'sculk_catalyst': 'black_wool',
    'sculk_sensor': 'black_wool', 'sculk_shrieker': 'black_wool',
    'sculk_vein': 'black_carpet', 'calibrated_sculk_sensor': 'black_wool',
    
    // Candles
    'candle': 'torch', 'candle_cake': 'torch',
    'white_candle': 'torch', 'white_candle_cake': 'torch',
    'orange_candle': 'torch', 'orange_candle_cake': 'torch',
    'magenta_candle': 'torch', 'magenta_candle_cake': 'torch',
    'light_blue_candle': 'torch', 'light_blue_candle_cake': 'torch',
    'yellow_candle': 'torch', 'yellow_candle_cake': 'torch',
    'lime_candle': 'torch', 'lime_candle_cake': 'torch',
    'pink_candle': 'torch', 'pink_candle_cake': 'torch',
    'gray_candle': 'torch', 'gray_candle_cake': 'torch',
    'light_gray_candle': 'torch', 'light_gray_candle_cake': 'torch',
    'cyan_candle': 'torch', 'cyan_candle_cake': 'torch',
    'purple_candle': 'torch', 'purple_candle_cake': 'torch',
    'blue_candle': 'torch', 'blue_candle_cake': 'torch',
    'brown_candle': 'torch', 'brown_candle_cake': 'torch',
    'green_candle': 'torch', 'green_candle_cake': 'torch',
    'red_candle': 'torch', 'red_candle_cake': 'torch',
    'black_candle': 'torch', 'black_candle_cake': 'torch',

    // Misc blocks
    'ancient_debris': 'netherrack', 'basalt': 'gray_wool', 'polished_basalt': 'stone', 'smooth_basalt': 'stone',
    'bee_nest': 'yellow_wool', 'beehive': 'oak_planks',
    'honey_block': 'yellow_stained_glass', 'honeycomb_block': 'yellow_wool',
    'chain': 'iron_bars', 'shroomlight': 'glowstone',
    'crying_obsidian': 'obsidian', 'respawn_anchor': 'obsidian',
    'lodestone': 'iron_block', 'netherite_block': 'iron_block',
    'nether_gold_ore': 'gold_ore', 'quartz_bricks': 'quartz_block',
    'soul_campfire': 'netherrack', 'soul_fire': 'fire',
    'soul_lantern': 'torch', 'soul_torch': 'torch', 'soul_wall_torch': 'wall_torch',
    'soul_soil': 'soul_sand', 'target': 'hay_block',
    'chiseled_nether_bricks': 'nether_bricks', 'cracked_nether_bricks': 'nether_bricks',
    'nether_sprouts': 'dead_bush', 'twisting_vines': 'vine', 'twisting_vines_plant': 'vine',
    'weeping_vines': 'vine', 'weeping_vines_plant': 'vine',
    
    // Plants and nature
    'azalea': 'oak_leaves', 'flowering_azalea': 'oak_leaves',
    'azalea_leaves': 'oak_leaves', 'flowering_azalea_leaves': 'oak_leaves',
    'potted_azalea_bush': 'flower_pot', 'potted_flowering_azalea_bush': 'flower_pot',
    'big_dripleaf': 'lily_pad', 'big_dripleaf_stem': 'oak_fence', 'small_dripleaf': 'lily_pad',
    'cave_vines': 'vine', 'cave_vines_plant': 'vine',
    'glow_lichen': 'vine', 'hanging_roots': 'vine', 'spore_blossom': 'pink_wool',
    'moss_block': 'green_wool', 'moss_carpet': 'green_carpet',
    'calcite': 'diorite', 'dripstone_block': 'stone', 'pointed_dripstone': 'stone',
    'rooted_dirt': 'dirt', 'tinted_glass': 'glass',
    'powder_snow': 'snow_block', 'powder_snow_cauldron': 'cauldron',
    'lava_cauldron': 'cauldron', 'water_cauldron': 'cauldron',
    'raw_gold_block': 'gold_block', 'raw_iron_block': 'iron_block',
    'light': 'air',
    
    // Froglights
    'frogspawn': 'lily_pad',
    'ochre_froglight': 'glowstone', 'pearlescent_froglight': 'glowstone', 'verdant_froglight': 'glowstone',
    
    // 1.20 misc
    'chiseled_bookshelf': 'bookshelf', 'decorated_pot': 'flower_pot',
    'pink_petals': 'pink_carpet', 'pitcher_plant': 'fern', 'pitcher_crop': 'wheat',
    'torchflower': 'dandelion', 'torchflower_crop': 'wheat', 'potted_torchflower': 'flower_pot',
    'suspicious_sand': 'sand', 'suspicious_gravel': 'gravel',
    'sniffer_egg': 'turtle_egg',
    'piglin_head': 'player_head', 'piglin_wall_head': 'player_wall_head',
    
    // 1.21 misc
    'crafter': 'crafting_table', 'trial_spawner': 'spawner',
    'vault': 'iron_block', 'heavy_core': 'iron_block',
    
    // Name changes fallbacks
    'short_grass': 'grass', 'dirt_path': 'grass_path',
};


// ============================================
// PROPERTY_TO_METADATA - Convert modern block properties to legacy metadata
// For 1.8-1.12 versions that use numeric metadata instead of named properties
// ============================================
export const PROPERTY_TO_METADATA = {
    // === STAIRS ===
    // Modern: facing=east/west/south/north, half=bottom/top
    // Legacy: metadata = facing_value + (half === 'top' ? 4 : 0)
    stairs: {
        // facing values (bits 0-1)
        facing: { east: 0, west: 1, south: 2, north: 3 },
        // half modifier (bit 2)
        half: { bottom: 0, top: 4 }
    },
    
    // === SLABS ===
    // Modern: type=bottom/top/double
    // Legacy: metadata = type_value (8 for top half)
    // Note: Different slab materials use different base IDs, not metadata
    slab: {
        type: { bottom: 0, top: 8, double: 0 }
    },
    
    // === LOGS ===
    // Modern: axis=x/y/z
    // Legacy: metadata = axis_value * 4 + wood_type
    // Note: wood_type is encoded in metadata 0-3
    log: {
        axis: { y: 0, x: 4, z: 8 }
    },
    
    // === FACING BLOCKS (Furnace, Dispenser, Dropper, etc.) ===
    // Modern: facing=north/south/west/east/up/down
    facing_horizontal: {
        facing: { north: 2, south: 3, west: 4, east: 5 }
    },
    facing_all: {
        facing: { down: 0, up: 1, north: 2, south: 3, west: 4, east: 5 }
    },
    
    // === PISTONS ===
    // Modern: facing=down/up/north/south/west/east, extended=true/false
    piston: {
        facing: { down: 0, up: 1, north: 2, south: 3, west: 4, east: 5 },
        extended: { false: 0, true: 8 }
    },
    
    // === TORCHES ===
    // Modern: facing (wall_torch only)
    // Legacy: metadata 1-4 for wall, 5 for standing
    torch: {
        facing: { east: 1, west: 2, south: 3, north: 4 }
    },
    
    // === DOORS ===
    // Modern: facing, half, hinge, open, powered
    // Legacy: Complex - lower half has facing+open, upper half has hinge+powered
    door_lower: {
        facing: { east: 0, south: 1, west: 2, north: 3 },
        open: { false: 0, true: 4 }
    },
    door_upper: {
        hinge: { left: 0, right: 1 },
        powered: { false: 0, true: 2 }
        // bit 3 (8) indicates upper half
    },
    
    // === TRAPDOORS ===
    // Modern: facing, half, open
    trapdoor: {
        facing: { north: 0, south: 1, west: 2, east: 3 },
        half: { bottom: 0, top: 8 },
        open: { false: 0, true: 4 }
    },
    
    // === BUTTONS ===
    // Modern: face, facing, powered
    button: {
        // face determines base: floor=5/6, ceiling=0/7, wall=1-4
        facing: { east: 1, west: 2, south: 3, north: 4 },
        powered: { false: 0, true: 8 }
    },
    
    // === LEVERS ===
    lever: {
        // Complex mapping based on face and facing
        facing: { east: 1, west: 2, south: 3, north: 4 },
        powered: { false: 0, true: 8 }
    },
    
    // === FENCE GATES ===
    fence_gate: {
        facing: { south: 0, west: 1, north: 2, east: 3 },
        open: { false: 0, true: 4 }
    },
    
    // === BEDS ===
    bed: {
        facing: { south: 0, west: 1, north: 2, east: 3 },
        part: { foot: 0, head: 8 },
        occupied: { false: 0, true: 4 }
    },
    
    // === RAILS ===
    rail: {
        shape: {
            'north_south': 0, 'east_west': 1,
            'ascending_east': 2, 'ascending_west': 3,
            'ascending_north': 4, 'ascending_south': 5,
            'south_east': 6, 'south_west': 7,
            'north_west': 8, 'north_east': 9
        }
    },
    powered_rail: {
        shape: {
            'north_south': 0, 'east_west': 1,
            'ascending_east': 2, 'ascending_west': 3,
            'ascending_north': 4, 'ascending_south': 5
        },
        powered: { false: 0, true: 8 }
    },
    
    // === CHESTS ===
    chest: {
        facing: { north: 2, south: 3, west: 4, east: 5 }
    },
    
    // === ANVILS ===
    anvil: {
        facing: { south: 0, west: 1, north: 2, east: 3 }
        // damage is encoded in bits 2-3 (0, 4, 8 for undamaged, chipped, damaged)
    },
    
    // === REPEATERS/COMPARATORS ===
    repeater: {
        facing: { south: 0, west: 1, north: 2, east: 3 },
        delay: { 1: 0, 2: 4, 3: 8, 4: 12 }
    },
    comparator: {
        facing: { south: 0, west: 1, north: 2, east: 3 },
        mode: { compare: 0, subtract: 4 }
    },
    
    // === GLAZED TERRACOTTA (1.12) ===
    glazed_terracotta: {
        facing: { south: 0, west: 1, north: 2, east: 3 }
    }
};

// Block type to property mapping category
export const BLOCK_PROPERTY_CATEGORY = {
    // Stairs
    'oak_stairs': 'stairs', 'spruce_stairs': 'stairs', 'birch_stairs': 'stairs',
    'jungle_stairs': 'stairs', 'acacia_stairs': 'stairs', 'dark_oak_stairs': 'stairs',
    'stone_stairs': 'stairs', 'cobblestone_stairs': 'stairs', 'brick_stairs': 'stairs',
    'stone_brick_stairs': 'stairs', 'nether_brick_stairs': 'stairs', 'sandstone_stairs': 'stairs',
    'quartz_stairs': 'stairs', 'red_sandstone_stairs': 'stairs', 'purpur_stairs': 'stairs',
    
    // Slabs
    'stone_slab': 'slab', 'sandstone_slab': 'slab', 'cobblestone_slab': 'slab',
    'brick_slab': 'slab', 'stone_brick_slab': 'slab', 'nether_brick_slab': 'slab',
    'quartz_slab': 'slab', 'red_sandstone_slab': 'slab', 'purpur_slab': 'slab',
    'oak_slab': 'slab', 'spruce_slab': 'slab', 'birch_slab': 'slab',
    'jungle_slab': 'slab', 'acacia_slab': 'slab', 'dark_oak_slab': 'slab',
    
    // Logs
    'oak_log': 'log', 'spruce_log': 'log', 'birch_log': 'log', 'jungle_log': 'log',
    'acacia_log': 'log', 'dark_oak_log': 'log',
    'stripped_oak_log': 'log', 'stripped_spruce_log': 'log', 'stripped_birch_log': 'log',
    'stripped_jungle_log': 'log', 'stripped_acacia_log': 'log', 'stripped_dark_oak_log': 'log',
    
    // Doors
    'oak_door': 'door', 'spruce_door': 'door', 'birch_door': 'door',
    'jungle_door': 'door', 'acacia_door': 'door', 'dark_oak_door': 'door',
    'iron_door': 'door',
    
    // Trapdoors
    'oak_trapdoor': 'trapdoor', 'spruce_trapdoor': 'trapdoor', 'birch_trapdoor': 'trapdoor',
    'jungle_trapdoor': 'trapdoor', 'acacia_trapdoor': 'trapdoor', 'dark_oak_trapdoor': 'trapdoor',
    'iron_trapdoor': 'trapdoor',
    
    // Fence gates
    'oak_fence_gate': 'fence_gate', 'spruce_fence_gate': 'fence_gate', 'birch_fence_gate': 'fence_gate',
    'jungle_fence_gate': 'fence_gate', 'acacia_fence_gate': 'fence_gate', 'dark_oak_fence_gate': 'fence_gate',
    
    // Buttons
    'oak_button': 'button', 'spruce_button': 'button', 'birch_button': 'button',
    'jungle_button': 'button', 'acacia_button': 'button', 'dark_oak_button': 'button',
    'stone_button': 'button',
    
    // Rails
    'rail': 'rail', 'powered_rail': 'powered_rail', 'detector_rail': 'powered_rail',
    'activator_rail': 'powered_rail',
    
    // Facing blocks
    'furnace': 'facing_horizontal', 'dispenser': 'facing_all', 'dropper': 'facing_all',
    'hopper': 'facing_all', 'observer': 'facing_all',
    'chest': 'chest', 'trapped_chest': 'chest', 'ender_chest': 'chest',
    
    // Pistons
    'piston': 'piston', 'sticky_piston': 'piston',
    
    // Torches
    'wall_torch': 'torch', 'redstone_wall_torch': 'torch',
    
    // Beds
    'white_bed': 'bed', 'orange_bed': 'bed', 'magenta_bed': 'bed', 'light_blue_bed': 'bed',
    'yellow_bed': 'bed', 'lime_bed': 'bed', 'pink_bed': 'bed', 'gray_bed': 'bed',
    'light_gray_bed': 'bed', 'cyan_bed': 'bed', 'purple_bed': 'bed', 'blue_bed': 'bed',
    'brown_bed': 'bed', 'green_bed': 'bed', 'red_bed': 'bed', 'black_bed': 'bed',
    
    // Redstone
    'repeater': 'repeater', 'comparator': 'comparator',
    'lever': 'lever',
    
    // Anvil
    'anvil': 'anvil', 'chipped_anvil': 'anvil', 'damaged_anvil': 'anvil',
    
    // Glazed terracotta
    'white_glazed_terracotta': 'glazed_terracotta', 'orange_glazed_terracotta': 'glazed_terracotta',
    'magenta_glazed_terracotta': 'glazed_terracotta', 'light_blue_glazed_terracotta': 'glazed_terracotta',
    'yellow_glazed_terracotta': 'glazed_terracotta', 'lime_glazed_terracotta': 'glazed_terracotta',
    'pink_glazed_terracotta': 'glazed_terracotta', 'gray_glazed_terracotta': 'glazed_terracotta',
    'light_gray_glazed_terracotta': 'glazed_terracotta', 'cyan_glazed_terracotta': 'glazed_terracotta',
    'purple_glazed_terracotta': 'glazed_terracotta', 'blue_glazed_terracotta': 'glazed_terracotta',
    'brown_glazed_terracotta': 'glazed_terracotta', 'green_glazed_terracotta': 'glazed_terracotta',
    'red_glazed_terracotta': 'glazed_terracotta', 'black_glazed_terracotta': 'glazed_terracotta'
};

/**
 * Convert modern block properties to legacy metadata value
 * @param {string} blockName - The block name (e.g., 'oak_stairs')
 * @param {object} properties - Properties object (e.g., {facing: 'north', half: 'top'})
 * @returns {number} - The metadata value (0-15)
 */
export function propertiesToMetadata(blockName, properties) {
    if (!properties || typeof properties !== 'object') return 0;
    
    const category = BLOCK_PROPERTY_CATEGORY[blockName];
    if (!category) return 0;
    
    let metadata = 0;
    
    // Special handling for doors (upper/lower half)
    if (category === 'door') {
        const isUpper = properties.half === 'upper';
        if (isUpper) {
            metadata = 8; // bit 3 indicates upper half
            const hingeMapping = PROPERTY_TO_METADATA.door_upper;
            if (properties.hinge && hingeMapping.hinge[properties.hinge] !== undefined) {
                metadata += hingeMapping.hinge[properties.hinge];
            }
            if (properties.powered && hingeMapping.powered[properties.powered] !== undefined) {
                metadata += hingeMapping.powered[properties.powered];
            }
        } else {
            // Lower half
            const lowerMapping = PROPERTY_TO_METADATA.door_lower;
            if (properties.facing && lowerMapping.facing[properties.facing] !== undefined) {
                metadata += lowerMapping.facing[properties.facing];
            }
            if (properties.open && lowerMapping.open[properties.open] !== undefined) {
                metadata += lowerMapping.open[properties.open];
            }
        }
        return metadata;
    }
    
    // Get mapping for this category
    const mapping = PROPERTY_TO_METADATA[category];
    if (!mapping) return 0;
    
    // General property mapping
    for (const [propName, propValue] of Object.entries(properties)) {
        if (mapping[propName] && mapping[propName][propValue] !== undefined) {
            metadata += mapping[propName][propValue];
        }
    }
    
    return metadata;
}

// Legacy numeric IDs for 1.12.x and below (block name -> id:meta)
export const NUMERIC_BLOCK_IDS = {
    'air': '0', 'stone': '1', 'grass': '2', 'dirt': '3', 'cobblestone': '4',
    'planks': '5', 'oak_planks': '5:0', 'spruce_planks': '5:1', 'birch_planks': '5:2', 'jungle_planks': '5:3', 'acacia_planks': '5:4', 'dark_oak_planks': '5:5',
    'sapling': '6', 'bedrock': '7', 'water': '8', 'lava': '10',
    'sand': '12', 'gravel': '13', 'gold_ore': '14', 'iron_ore': '15', 'coal_ore': '16',
    'log': '17', 'oak_log': '17:0', 'spruce_log': '17:1', 'birch_log': '17:2', 'jungle_log': '17:3',
    'leaves': '18', 'oak_leaves': '18:0', 'spruce_leaves': '18:1', 'birch_leaves': '18:2', 'jungle_leaves': '18:3',
    'sponge': '19', 'glass': '20', 'lapis_ore': '21', 'lapis_block': '22',
    'dispenser': '23', 'sandstone': '24', 'noteblock': '25', 'bed': '26',
    'golden_rail': '27', 'powered_rail': '27', 'detector_rail': '28', 'sticky_piston': '29', 'web': '30', 'cobweb': '30',
    'tallgrass': '31', 'deadbush': '32', 'piston': '33', 'piston_head': '34',
    'wool': '35', 'white_wool': '35:0', 'orange_wool': '35:1', 'magenta_wool': '35:2', 'light_blue_wool': '35:3',
    'yellow_wool': '35:4', 'lime_wool': '35:5', 'pink_wool': '35:6', 'gray_wool': '35:7',
    'light_gray_wool': '35:8', 'cyan_wool': '35:9', 'purple_wool': '35:10', 'blue_wool': '35:11',
    'brown_wool': '35:12', 'green_wool': '35:13', 'red_wool': '35:14', 'black_wool': '35:15',
    'yellow_flower': '37', 'red_flower': '38', 'brown_mushroom': '39', 'red_mushroom': '40',
    'gold_block': '41', 'iron_block': '42', 'double_stone_slab': '43', 'stone_slab': '44',
    'brick_block': '45', 'bricks': '45', 'tnt': '46', 'bookshelf': '47', 'mossy_cobblestone': '48', 'obsidian': '49',
    'torch': '50', 'fire': '51', 'mob_spawner': '52', 'spawner': '52', 'oak_stairs': '53', 'chest': '54',
    'redstone_wire': '55', 'diamond_ore': '56', 'diamond_block': '57', 'crafting_table': '58', 'wheat': '59',
    'farmland': '60', 'furnace': '61', 'lit_furnace': '62', 'standing_sign': '63', 'wooden_door': '64',
    'ladder': '65', 'rail': '66', 'stone_stairs': '67', 'cobblestone_stairs': '67', 'wall_sign': '68',
    'lever': '69', 'stone_pressure_plate': '70', 'iron_door': '71', 'wooden_pressure_plate': '72',
    'redstone_ore': '73', 'redstone_torch': '76', 'stone_button': '77', 'snow_layer': '78', 'snow': '78',
    'ice': '79', 'snow_block': '80', 'cactus': '81', 'clay': '82', 'reeds': '83', 'jukebox': '84',
    'fence': '85', 'oak_fence': '85', 'pumpkin': '86', 'netherrack': '87', 'soul_sand': '88', 'glowstone': '89',
    'portal': '90', 'lit_pumpkin': '91', 'jack_o_lantern': '91', 'cake': '92',
    'unpowered_repeater': '93', 'powered_repeater': '94',
    'stained_glass': '95', 'white_stained_glass': '95:0', 'orange_stained_glass': '95:1',
    'trapdoor': '96', 'oak_trapdoor': '96', 'monster_egg': '97', 'stonebrick': '98', 'stone_bricks': '98:0',
    'mossy_stonebrick': '98:1', 'mossy_stone_bricks': '98:1', 'cracked_stonebrick': '98:2', 'chiseled_stonebrick': '98:3',
    'brown_mushroom_block': '99', 'red_mushroom_block': '100', 'iron_bars': '101', 'glass_pane': '102',
    'melon_block': '103', 'pumpkin_stem': '104', 'melon_stem': '105', 'vine': '106',
    'fence_gate': '107', 'oak_fence_gate': '107', 'brick_stairs': '108', 'stone_brick_stairs': '109',
    'mycelium': '110', 'waterlily': '111', 'lily_pad': '111', 'nether_brick': '112', 'nether_brick_fence': '113',
    'nether_brick_stairs': '114', 'nether_wart': '115', 'enchanting_table': '116', 'brewing_stand': '117',
    'cauldron': '118', 'end_portal': '119', 'end_portal_frame': '120', 'end_stone': '121',
    'dragon_egg': '122', 'redstone_lamp': '123', 'double_wooden_slab': '125', 'wooden_slab': '126',
    'cocoa': '127', 'sandstone_stairs': '128', 'emerald_ore': '129', 'ender_chest': '130',
    'tripwire_hook': '131', 'tripwire': '132', 'emerald_block': '133', 'spruce_stairs': '134',
    'birch_stairs': '135', 'jungle_stairs': '136', 'command_block': '137', 'beacon': '138',
    'cobblestone_wall': '139', 'flower_pot': '140', 'carrots': '141', 'potatoes': '142',
    'wooden_button': '143', 'skull': '144', 'anvil': '145', 'trapped_chest': '146',
    'light_weighted_pressure_plate': '147', 'heavy_weighted_pressure_plate': '148',
    'unpowered_comparator': '149', 'powered_comparator': '150', 'daylight_detector': '151',
    'redstone_block': '152', 'quartz_ore': '153', 'hopper': '154', 'quartz_block': '155',
    'quartz_stairs': '156', 'activator_rail': '157', 'dropper': '158', 'stained_hardened_clay': '159',
    'white_terracotta': '159:0', 'orange_terracotta': '159:1', 'magenta_terracotta': '159:2',
    'stained_glass_pane': '160', 'leaves2': '161', 'acacia_leaves': '161:0', 'dark_oak_leaves': '161:1',
    'log2': '162', 'acacia_log': '162:0', 'dark_oak_log': '162:1',
    'acacia_stairs': '163', 'dark_oak_stairs': '164', 'slime': '165', 'slime_block': '165',
    'barrier': '166', 'iron_trapdoor': '167', 'prismarine': '168', 'sea_lantern': '169',
    'hay_block': '170', 'carpet': '171', 'hardened_clay': '172', 'terracotta': '172', 'coal_block': '173',
    'packed_ice': '174', 'double_plant': '175', 'standing_banner': '176', 'wall_banner': '177',
    'daylight_detector_inverted': '178', 'red_sandstone': '179', 'red_sandstone_stairs': '180',
    'double_stone_slab2': '181', 'stone_slab2': '182', 'spruce_fence_gate': '183', 'birch_fence_gate': '184',
    'jungle_fence_gate': '185', 'dark_oak_fence_gate': '186', 'acacia_fence_gate': '187',
    'spruce_fence': '188', 'birch_fence': '189', 'jungle_fence': '190', 'dark_oak_fence': '191', 'acacia_fence': '192',
    'spruce_door': '193', 'birch_door': '194', 'jungle_door': '195', 'acacia_door': '196', 'dark_oak_door': '197',
    // Note: In 1.12, only oak_trapdoor (96) and iron_trapdoor (167) exist
    // Other wood trapdoors were added in 1.13, so they fallback to oak_trapdoor
    'spruce_trapdoor': '96', 'birch_trapdoor': '96', 'jungle_trapdoor': '96', 'acacia_trapdoor': '96', 'dark_oak_trapdoor': '96',
    'end_rod': '198', 'chorus_plant': '199', 'chorus_flower': '200', 'purpur_block': '201',
    'purpur_pillar': '202', 'purpur_stairs': '203', 'purpur_double_slab': '204', 'purpur_slab': '205',
    'end_bricks': '206', 'end_stone_bricks': '206', 'beetroots': '207', 'grass_path': '208', 'dirt_path': '208',
    'end_gateway': '209', 'repeating_command_block': '210', 'chain_command_block': '211',
    'frosted_ice': '212', 'magma_block': '213', 'magma': '213', 'nether_wart_block': '214',
    'red_nether_brick': '215', 'red_nether_bricks': '215', 'bone_block': '216',
    'structure_void': '217', 'observer': '218', 'white_shulker_box': '219',
    'concrete': '251', 'white_concrete': '251:0', 'orange_concrete': '251:1', 'magenta_concrete': '251:2',
    'light_blue_concrete': '251:3', 'yellow_concrete': '251:4', 'lime_concrete': '251:5', 'pink_concrete': '251:6',
    'gray_concrete': '251:7', 'light_gray_concrete': '251:8', 'cyan_concrete': '251:9', 'purple_concrete': '251:10',
    'blue_concrete': '251:11', 'brown_concrete': '251:12', 'green_concrete': '251:13', 'red_concrete': '251:14', 'black_concrete': '251:15',
    'concrete_powder': '252', 'structure_block': '255'
};

// Get version config by ID
export function getVersionConfig(versionId) {
    return VERSION_GROUPS.find(v => v.id === versionId) || VERSION_GROUPS[0];
}

// Compare version IDs (returns -1, 0, or 1)
export function compareVersions(v1, v2) {
    const order = VERSION_GROUPS.map(v => v.id);
    return order.indexOf(v1) - order.indexOf(v2);
}

// Convert block name for target version
export function convertBlockForVersion(blockName, targetVersionId) {
    const cleanName = blockName.replace('minecraft:', '').split('[')[0];
    const targetConfig = getVersionConfig(targetVersionId);
    
    // Check if block needs renaming
    const renameInfo = BLOCK_RENAMES[cleanName];
    if (renameInfo) {
        for (const [maxVer, newName] of Object.entries(renameInfo)) {
            if (compareVersions(targetVersionId, maxVer) >= 0) {
                if (newName === null) {
                    // Block doesn't exist, use fallback
                    return BLOCK_FALLBACKS[cleanName] || 'stone';
                }
                return newName;
            }
        }
    }
    
    // DON'T convert to numeric IDs here - just return the clean name
    // The formatBlock function in exporter.js will handle legacy block names
    return cleanName;
}

// Format block for command (handles version-specific formatting)
export function formatBlockForVersion(blockName, targetVersionId, properties = null) {
    const targetConfig = getVersionConfig(targetVersionId);
    const convertedName = convertBlockForVersion(blockName, targetVersionId);
    
    if (targetConfig.usesNumericIds) {
        // Legacy format: just the numeric ID
        return convertedName;
    }
    
    // Modern format: minecraft:block_name[properties]
    let result = `minecraft:${convertedName}`;
    if (properties && typeof properties === 'string' && properties.includes('=')) {
        result += `[${properties}]`;
    }
    return result;
}

// ============================================
// LEGACY_BLOCK_NAMES - Modern name -> 1.8-1.12 name
// 1.8-1.12 uses different block names than 1.13+
// ============================================
export const LEGACY_BLOCK_NAMES = {
    // Stone variants
    'stone_bricks': 'stonebrick',
    'mossy_stone_bricks': 'stonebrick',
    'cracked_stone_bricks': 'stonebrick',
    'chiseled_stone_bricks': 'stonebrick',
    'infested_stone_bricks': 'monster_egg',
    
    // Planks
    'oak_planks': 'planks',
    'spruce_planks': 'planks',
    'birch_planks': 'planks',
    'jungle_planks': 'planks',
    'acacia_planks': 'planks',
    'dark_oak_planks': 'planks',
    
    // Logs
    'oak_log': 'log',
    'spruce_log': 'log',
    'birch_log': 'log',
    'jungle_log': 'log',
    'acacia_log': 'log2',
    'dark_oak_log': 'log2',
    
    // Leaves
    'oak_leaves': 'leaves',
    'spruce_leaves': 'leaves',
    'birch_leaves': 'leaves',
    'jungle_leaves': 'leaves',
    'acacia_leaves': 'leaves2',
    'dark_oak_leaves': 'leaves2',
    
    // Wool
    'white_wool': 'wool',
    'orange_wool': 'wool',
    'magenta_wool': 'wool',
    'light_blue_wool': 'wool',
    'yellow_wool': 'wool',
    'lime_wool': 'wool',
    'pink_wool': 'wool',
    'gray_wool': 'wool',
    'light_gray_wool': 'wool',
    'cyan_wool': 'wool',
    'purple_wool': 'wool',
    'blue_wool': 'wool',
    'brown_wool': 'wool',
    'green_wool': 'wool',
    'red_wool': 'wool',
    'black_wool': 'wool',
    
    // Concrete (doesn't exist in 1.8-1.11, use wool)
    'white_concrete': 'wool',
    'orange_concrete': 'wool',
    'magenta_concrete': 'wool',
    'light_blue_concrete': 'wool',
    'yellow_concrete': 'wool',
    'lime_concrete': 'wool',
    'pink_concrete': 'wool',
    'gray_concrete': 'wool',
    'light_gray_concrete': 'wool',
    'cyan_concrete': 'wool',
    'purple_concrete': 'wool',
    'blue_concrete': 'wool',
    'brown_concrete': 'wool',
    'green_concrete': 'wool',
    'red_concrete': 'wool',
    'black_concrete': 'wool',
    
    // Terracotta
    'terracotta': 'hardened_clay',
    'white_terracotta': 'stained_hardened_clay',
    'orange_terracotta': 'stained_hardened_clay',
    'magenta_terracotta': 'stained_hardened_clay',
    'light_blue_terracotta': 'stained_hardened_clay',
    'yellow_terracotta': 'stained_hardened_clay',
    'lime_terracotta': 'stained_hardened_clay',
    'pink_terracotta': 'stained_hardened_clay',
    'gray_terracotta': 'stained_hardened_clay',
    'light_gray_terracotta': 'stained_hardened_clay',
    'cyan_terracotta': 'stained_hardened_clay',
    'purple_terracotta': 'stained_hardened_clay',
    'blue_terracotta': 'stained_hardened_clay',
    'brown_terracotta': 'stained_hardened_clay',
    'green_terracotta': 'stained_hardened_clay',
    'red_terracotta': 'stained_hardened_clay',
    'black_terracotta': 'stained_hardened_clay',
    
    // Glass
    'white_stained_glass': 'stained_glass',
    'orange_stained_glass': 'stained_glass',
    'magenta_stained_glass': 'stained_glass',
    'light_blue_stained_glass': 'stained_glass',
    'yellow_stained_glass': 'stained_glass',
    'lime_stained_glass': 'stained_glass',
    'pink_stained_glass': 'stained_glass',
    'gray_stained_glass': 'stained_glass',
    'light_gray_stained_glass': 'stained_glass',
    'cyan_stained_glass': 'stained_glass',
    'purple_stained_glass': 'stained_glass',
    'blue_stained_glass': 'stained_glass',
    'brown_stained_glass': 'stained_glass',
    'green_stained_glass': 'stained_glass',
    'red_stained_glass': 'stained_glass',
    'black_stained_glass': 'stained_glass',
    
    // Glass panes
    'white_stained_glass_pane': 'stained_glass_pane',
    'orange_stained_glass_pane': 'stained_glass_pane',
    'magenta_stained_glass_pane': 'stained_glass_pane',
    'light_blue_stained_glass_pane': 'stained_glass_pane',
    'yellow_stained_glass_pane': 'stained_glass_pane',
    'lime_stained_glass_pane': 'stained_glass_pane',
    'pink_stained_glass_pane': 'stained_glass_pane',
    'gray_stained_glass_pane': 'stained_glass_pane',
    'light_gray_stained_glass_pane': 'stained_glass_pane',
    'cyan_stained_glass_pane': 'stained_glass_pane',
    'purple_stained_glass_pane': 'stained_glass_pane',
    'blue_stained_glass_pane': 'stained_glass_pane',
    'brown_stained_glass_pane': 'stained_glass_pane',
    'green_stained_glass_pane': 'stained_glass_pane',
    'red_stained_glass_pane': 'stained_glass_pane',
    'black_stained_glass_pane': 'stained_glass_pane',
    
    // Stairs
    'oak_stairs': 'oak_stairs',
    'cobblestone_stairs': 'stone_stairs',
    'stone_brick_stairs': 'stone_brick_stairs',
    'brick_stairs': 'brick_stairs',
    'nether_brick_stairs': 'nether_brick_stairs',
    'sandstone_stairs': 'sandstone_stairs',
    'spruce_stairs': 'spruce_stairs',
    'birch_stairs': 'birch_stairs',
    'jungle_stairs': 'jungle_stairs',
    'quartz_stairs': 'quartz_stairs',
    'acacia_stairs': 'acacia_stairs',
    'dark_oak_stairs': 'dark_oak_stairs',
    'red_sandstone_stairs': 'red_sandstone_stairs',
    'purpur_stairs': 'purpur_stairs',
    
    // Slabs
    'oak_slab': 'wooden_slab',
    'spruce_slab': 'wooden_slab',
    'birch_slab': 'wooden_slab',
    'jungle_slab': 'wooden_slab',
    'acacia_slab': 'wooden_slab',
    'dark_oak_slab': 'wooden_slab',
    'stone_slab': 'stone_slab',
    'sandstone_slab': 'stone_slab',
    'cobblestone_slab': 'stone_slab',
    'brick_slab': 'stone_slab',
    'stone_brick_slab': 'stone_slab',
    'nether_brick_slab': 'stone_slab',
    'quartz_slab': 'stone_slab',
    
    // Fences
    'oak_fence': 'fence',
    'spruce_fence': 'spruce_fence',
    'birch_fence': 'birch_fence',
    'jungle_fence': 'jungle_fence',
    'acacia_fence': 'acacia_fence',
    'dark_oak_fence': 'dark_oak_fence',
    'nether_brick_fence': 'nether_brick_fence',
    
    // Fence gates
    'oak_fence_gate': 'fence_gate',
    'spruce_fence_gate': 'spruce_fence_gate',
    'birch_fence_gate': 'birch_fence_gate',
    'jungle_fence_gate': 'jungle_fence_gate',
    'acacia_fence_gate': 'acacia_fence_gate',
    'dark_oak_fence_gate': 'dark_oak_fence_gate',
    
    // Doors
    'oak_door': 'wooden_door',
    'spruce_door': 'spruce_door',
    'birch_door': 'birch_door',
    'jungle_door': 'jungle_door',
    'acacia_door': 'acacia_door',
    'dark_oak_door': 'dark_oak_door',
    'iron_door': 'iron_door',
    
    // Trapdoors
    'oak_trapdoor': 'trapdoor',
    'iron_trapdoor': 'iron_trapdoor',
    
    // Buttons
    'oak_button': 'wooden_button',
    'stone_button': 'stone_button',
    
    // Pressure plates
    'oak_pressure_plate': 'wooden_pressure_plate',
    'stone_pressure_plate': 'stone_pressure_plate',
    'light_weighted_pressure_plate': 'light_weighted_pressure_plate',
    'heavy_weighted_pressure_plate': 'heavy_weighted_pressure_plate',
    
    // Other blocks
    'bricks': 'brick_block',
    'nether_bricks': 'nether_brick',
    'cobweb': 'web',
    'grass_block': 'grass',
    'dirt_path': 'grass_path',
    'jack_o_lantern': 'lit_pumpkin',
    'spawner': 'mob_spawner',
    'end_stone_bricks': 'end_bricks',
    'prismarine_bricks': 'prismarine',
    'dark_prismarine': 'prismarine',
    'red_nether_bricks': 'red_nether_brick',
    'magma_block': 'magma',
    'nether_wart_block': 'nether_wart_block',
    'bone_block': 'bone_block',
    
    // Redstone
    'redstone_lamp': 'redstone_lamp',
    'redstone_block': 'redstone_block',
    'observer': 'observer',
    
    // Misc
    'end_rod': 'end_rod',
    'chorus_plant': 'chorus_plant',
    'chorus_flower': 'chorus_flower',
    'purpur_block': 'purpur_block',
    'purpur_pillar': 'purpur_pillar',
    'end_stone': 'end_stone',
    'dragon_egg': 'dragon_egg',
    
    // === Blocks that DON'T EXIST in 1.8-1.12 - use fallbacks ===
    
    // Lanterns (1.14+) -> torch/glowstone
    'lantern': 'torch',
    'soul_lantern': 'torch',
    
    // Walls (1.14+ for most) -> cobblestone_wall or fence
    'stone_brick_wall': 'cobblestone_wall',
    'mossy_stone_brick_wall': 'cobblestone_wall',
    'brick_wall': 'cobblestone_wall',
    'prismarine_wall': 'cobblestone_wall',
    'red_sandstone_wall': 'cobblestone_wall',
    'sandstone_wall': 'cobblestone_wall',
    'nether_brick_wall': 'nether_brick_fence',
    'red_nether_brick_wall': 'nether_brick_fence',
    'end_stone_brick_wall': 'cobblestone_wall',
    'diorite_wall': 'cobblestone_wall',
    'granite_wall': 'cobblestone_wall',
    'andesite_wall': 'cobblestone_wall',
    'polished_blackstone_wall': 'cobblestone_wall',
    'polished_blackstone_brick_wall': 'cobblestone_wall',
    'blackstone_wall': 'cobblestone_wall',
    'cobbled_deepslate_wall': 'cobblestone_wall',
    'deepslate_brick_wall': 'cobblestone_wall',
    'deepslate_tile_wall': 'cobblestone_wall',
    'polished_deepslate_wall': 'cobblestone_wall',
    'mud_brick_wall': 'cobblestone_wall',
    
    // Concrete (1.12+) -> wool (closest match)
    'concrete': 'wool',
    'concrete_powder': 'sand',
    
    // Glazed terracotta (1.12+) -> stained_hardened_clay
    'white_glazed_terracotta': 'stained_hardened_clay',
    'orange_glazed_terracotta': 'stained_hardened_clay',
    'magenta_glazed_terracotta': 'stained_hardened_clay',
    'light_blue_glazed_terracotta': 'stained_hardened_clay',
    'yellow_glazed_terracotta': 'stained_hardened_clay',
    'lime_glazed_terracotta': 'stained_hardened_clay',
    'pink_glazed_terracotta': 'stained_hardened_clay',
    'gray_glazed_terracotta': 'stained_hardened_clay',
    'light_gray_glazed_terracotta': 'stained_hardened_clay',
    'cyan_glazed_terracotta': 'stained_hardened_clay',
    'purple_glazed_terracotta': 'stained_hardened_clay',
    'blue_glazed_terracotta': 'stained_hardened_clay',
    'brown_glazed_terracotta': 'stained_hardened_clay',
    'green_glazed_terracotta': 'stained_hardened_clay',
    'red_glazed_terracotta': 'stained_hardened_clay',
    'black_glazed_terracotta': 'stained_hardened_clay',
    
    // Quartz
    'quartz_block': 'quartz_block',
    'chiseled_quartz_block': 'quartz_block',
    'quartz_pillar': 'quartz_block',
    'smooth_quartz': 'quartz_block',
    'quartz_bricks': 'quartz_block',
};

// Get legacy block name for 1.8-1.12
export function getLegacyBlockName(modernName) {
    const cleanName = modernName.replace('minecraft:', '').split('[')[0];
    return LEGACY_BLOCK_NAMES[cleanName] || cleanName;
}
