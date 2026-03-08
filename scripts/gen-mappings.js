/**
 * Block Mapping Generator
 * Generates complete block fallback mappings based on color/material similarity
 * 
 * Usage: node scripts/gen-mappings.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Color/Material categories for smart fallback matching
const BLOCK_COLORS = {
    // Reds
    red: ['red_wool', 'red_concrete', 'red_terracotta', 'red_stained_glass', 'red_carpet', 'bricks', 'red_nether_bricks', 'red_sandstone', 'red_mushroom_block'],
    // Oranges
    orange: ['orange_wool', 'orange_concrete', 'orange_terracotta', 'orange_stained_glass', 'acacia_planks', 'pumpkin', 'copper_block', 'cut_copper'],
    // Yellows
    yellow: ['yellow_wool', 'yellow_concrete', 'yellow_terracotta', 'yellow_stained_glass', 'gold_block', 'hay_block', 'honeycomb_block', 'bee_nest'],
    // Greens
    green: ['green_wool', 'green_concrete', 'green_terracotta', 'lime_wool', 'lime_concrete', 'moss_block', 'moss_carpet'],
    // Blues/Cyan
    blue: ['blue_wool', 'blue_concrete', 'blue_terracotta', 'cyan_wool', 'cyan_concrete', 'light_blue_wool', 'prismarine', 'warped_planks'],
    // Purples
    purple: ['purple_wool', 'purple_concrete', 'purple_terracotta', 'magenta_wool', 'magenta_concrete', 'purpur_block', 'amethyst_block'],
    // Whites
    white: ['white_wool', 'white_concrete', 'white_terracotta', 'snow_block', 'quartz_block', 'calcite', 'diorite'],
    // Grays
    gray: ['gray_wool', 'gray_concrete', 'gray_terracotta', 'light_gray_wool', 'stone', 'cobblestone', 'andesite', 'tuff', 'deepslate'],
    // Blacks
    black: ['black_wool', 'black_concrete', 'black_terracotta', 'coal_block', 'obsidian', 'blackstone', 'basalt'],
    // Browns
    brown: ['brown_wool', 'brown_concrete', 'brown_terracotta', 'oak_planks', 'spruce_planks', 'dark_oak_planks', 'dirt', 'mud'],
    // Pinks
    pink: ['pink_wool', 'pink_concrete', 'pink_terracotta', 'cherry_planks', 'pink_petals'],
};

// Material type mappings (for structural similarity)
const MATERIAL_TYPES = {
    planks: ['oak_planks', 'spruce_planks', 'birch_planks', 'jungle_planks', 'acacia_planks', 'dark_oak_planks', 'crimson_planks', 'warped_planks', 'mangrove_planks', 'cherry_planks', 'bamboo_planks'],
    logs: ['oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log', 'crimson_stem', 'warped_stem', 'mangrove_log', 'cherry_log', 'bamboo_block'],
    stone_bricks: ['stone_bricks', 'mossy_stone_bricks', 'cracked_stone_bricks', 'deepslate_bricks', 'polished_blackstone_bricks', 'tuff_bricks'],
    slabs: ['oak_slab', 'stone_slab', 'cobblestone_slab', 'brick_slab', 'stone_brick_slab'],
    stairs: ['oak_stairs', 'stone_stairs', 'cobblestone_stairs', 'brick_stairs', 'stone_brick_stairs'],
    fences: ['oak_fence', 'spruce_fence', 'birch_fence', 'nether_brick_fence', 'iron_bars'],
    doors: ['oak_door', 'spruce_door', 'birch_door', 'iron_door'],
    trapdoors: ['oak_trapdoor', 'spruce_trapdoor', 'iron_trapdoor'],
    buttons: ['oak_button', 'stone_button', 'polished_blackstone_button'],
    pressure_plates: ['oak_pressure_plate', 'stone_pressure_plate', 'heavy_weighted_pressure_plate'],
    walls: ['cobblestone_wall', 'stone_brick_wall', 'brick_wall', 'nether_brick_wall'],
    glass: ['glass', 'glass_pane', 'tinted_glass'],
    lanterns: ['lantern', 'soul_lantern', 'torch', 'redstone_torch'],
    copper: ['copper_block', 'cut_copper', 'exposed_copper', 'weathered_copper', 'oxidized_copper'],
};

// Version introduction data (when blocks were added) - CORRECTED VERSION BOUNDARIES
// Sources: https://minecraft.wiki/w/Java_Edition_version_history
const VERSION_ADDED = {
    // 1.14 additions (Village & Pillage)
    '1.14': ['barrel', 'bell', 'blast_furnace', 'campfire', 'cartography_table', 'composter', 'fletching_table', 'grindstone', 'jigsaw', 'lantern', 'lectern', 'loom', 'scaffolding', 'smithing_table', 'smoker', 'stonecutter', 'sweet_berry_bush'],
    // 1.15 additions (Buzzy Bees)
    '1.15': ['bee_nest', 'beehive', 'honey_block', 'honeycomb_block'],
    // 1.16 additions (Nether Update) - ancient_debris, basalt, blackstone added HERE
    '1.16': ['ancient_debris', 'basalt', 'polished_basalt', 'blackstone', 'polished_blackstone', 'chiseled_polished_blackstone', 'gilded_blackstone', 'blackstone_slab', 'blackstone_stairs', 'blackstone_wall', 'polished_blackstone_slab', 'polished_blackstone_stairs', 'polished_blackstone_wall', 'polished_blackstone_bricks', 'cracked_polished_blackstone_bricks', 'polished_blackstone_brick_slab', 'polished_blackstone_brick_stairs', 'polished_blackstone_brick_wall', 'polished_blackstone_button', 'polished_blackstone_pressure_plate', 'chain', 'crimson_planks', 'crimson_slab', 'crimson_stairs', 'crimson_fence', 'crimson_fence_gate', 'crimson_door', 'crimson_trapdoor', 'crimson_button', 'crimson_pressure_plate', 'crimson_sign', 'crimson_stem', 'stripped_crimson_stem', 'crimson_hyphae', 'stripped_crimson_hyphae', 'crimson_nylium', 'crimson_fungus', 'crimson_roots', 'warped_planks', 'warped_slab', 'warped_stairs', 'warped_fence', 'warped_fence_gate', 'warped_door', 'warped_trapdoor', 'warped_button', 'warped_pressure_plate', 'warped_sign', 'warped_stem', 'stripped_warped_stem', 'warped_hyphae', 'stripped_warped_hyphae', 'warped_nylium', 'warped_fungus', 'warped_roots', 'nether_sprouts', 'weeping_vines', 'weeping_vines_plant', 'twisting_vines', 'twisting_vines_plant', 'shroomlight', 'crying_obsidian', 'respawn_anchor', 'lodestone', 'netherite_block', 'nether_gold_ore', 'quartz_bricks', 'soul_campfire', 'soul_fire', 'soul_lantern', 'soul_torch', 'soul_soil', 'target'],
    // 1.17 additions (Caves & Cliffs Part 1) - copper, deepslate, amethyst, moss, tuff added HERE
    '1.17': ['amethyst_block', 'amethyst_cluster', 'large_amethyst_bud', 'medium_amethyst_bud', 'small_amethyst_bud', 'budding_amethyst', 'azalea', 'flowering_azalea', 'azalea_leaves', 'flowering_azalea_leaves', 'big_dripleaf', 'big_dripleaf_stem', 'small_dripleaf', 'calcite', 'candle', 'white_candle', 'orange_candle', 'magenta_candle', 'light_blue_candle', 'yellow_candle', 'lime_candle', 'pink_candle', 'gray_candle', 'light_gray_candle', 'cyan_candle', 'purple_candle', 'blue_candle', 'brown_candle', 'green_candle', 'red_candle', 'black_candle', 'cave_vines', 'cave_vines_plant', 'copper_block', 'copper_ore', 'deepslate_copper_ore', 'cut_copper', 'cut_copper_slab', 'cut_copper_stairs', 'exposed_copper', 'exposed_cut_copper', 'exposed_cut_copper_slab', 'exposed_cut_copper_stairs', 'weathered_copper', 'weathered_cut_copper', 'weathered_cut_copper_slab', 'weathered_cut_copper_stairs', 'oxidized_copper', 'oxidized_cut_copper', 'oxidized_cut_copper_slab', 'oxidized_cut_copper_stairs', 'waxed_copper_block', 'waxed_cut_copper', 'waxed_cut_copper_slab', 'waxed_cut_copper_stairs', 'waxed_exposed_copper', 'waxed_exposed_cut_copper', 'waxed_exposed_cut_copper_slab', 'waxed_exposed_cut_copper_stairs', 'waxed_weathered_copper', 'waxed_weathered_cut_copper', 'waxed_weathered_cut_copper_slab', 'waxed_weathered_cut_copper_stairs', 'waxed_oxidized_copper', 'waxed_oxidized_cut_copper', 'waxed_oxidized_cut_copper_slab', 'waxed_oxidized_cut_copper_stairs', 'deepslate', 'cobbled_deepslate', 'cobbled_deepslate_slab', 'cobbled_deepslate_stairs', 'cobbled_deepslate_wall', 'polished_deepslate', 'polished_deepslate_slab', 'polished_deepslate_stairs', 'polished_deepslate_wall', 'deepslate_bricks', 'cracked_deepslate_bricks', 'deepslate_brick_slab', 'deepslate_brick_stairs', 'deepslate_brick_wall', 'deepslate_tiles', 'cracked_deepslate_tiles', 'deepslate_tile_slab', 'deepslate_tile_stairs', 'deepslate_tile_wall', 'chiseled_deepslate', 'deepslate_coal_ore', 'deepslate_diamond_ore', 'deepslate_emerald_ore', 'deepslate_gold_ore', 'deepslate_iron_ore', 'deepslate_lapis_ore', 'deepslate_redstone_ore', 'dripstone_block', 'pointed_dripstone', 'glow_lichen', 'hanging_roots', 'infested_deepslate', 'lightning_rod', 'moss_block', 'moss_carpet', 'powder_snow', 'raw_copper_block', 'raw_gold_block', 'raw_iron_block', 'rooted_dirt', 'smooth_basalt', 'spore_blossom', 'tinted_glass', 'tuff'],
    // 1.18 additions (Caves & Cliffs Part 2) - mostly world generation changes, few new blocks
    '1.18': [],
    // 1.19 additions (The Wild Update) - mud, sculk, mangrove added HERE
    '1.19': ['mud', 'packed_mud', 'mud_bricks', 'mud_brick_slab', 'mud_brick_stairs', 'mud_brick_wall', 'muddy_mangrove_roots', 'mangrove_planks', 'mangrove_slab', 'mangrove_stairs', 'mangrove_fence', 'mangrove_fence_gate', 'mangrove_door', 'mangrove_trapdoor', 'mangrove_button', 'mangrove_pressure_plate', 'mangrove_sign', 'mangrove_log', 'stripped_mangrove_log', 'mangrove_wood', 'stripped_mangrove_wood', 'mangrove_leaves', 'mangrove_propagule', 'mangrove_roots', 'sculk', 'sculk_catalyst', 'sculk_sensor', 'sculk_shrieker', 'sculk_vein', 'reinforced_deepslate', 'frogspawn', 'ochre_froglight', 'pearlescent_froglight', 'verdant_froglight'],
    // 1.19.3/1.19.4 additions (bamboo, cherry, archaeology)
    '1.19.3': ['bamboo_block', 'stripped_bamboo_block', 'bamboo_planks', 'bamboo_slab', 'bamboo_stairs', 'bamboo_fence', 'bamboo_fence_gate', 'bamboo_door', 'bamboo_trapdoor', 'bamboo_button', 'bamboo_pressure_plate', 'bamboo_sign', 'bamboo_mosaic', 'bamboo_mosaic_slab', 'bamboo_mosaic_stairs', 'chiseled_bookshelf'],
    // 1.20 additions (Trails & Tales) - cherry, archaeology
    '1.20': ['cherry_planks', 'cherry_slab', 'cherry_stairs', 'cherry_fence', 'cherry_fence_gate', 'cherry_door', 'cherry_trapdoor', 'cherry_button', 'cherry_pressure_plate', 'cherry_sign', 'cherry_log', 'stripped_cherry_log', 'cherry_wood', 'stripped_cherry_wood', 'cherry_leaves', 'cherry_sapling', 'pink_petals', 'decorated_pot', 'suspicious_sand', 'suspicious_gravel', 'torchflower', 'torchflower_crop', 'pitcher_plant', 'pitcher_crop', 'sniffer_egg', 'calibrated_sculk_sensor'],
    // 1.21 additions (Tricky Trials) - copper variants, trial chambers, tuff variants
    '1.21': ['chiseled_tuff', 'tuff_slab', 'tuff_stairs', 'tuff_wall', 'polished_tuff', 'polished_tuff_slab', 'polished_tuff_stairs', 'polished_tuff_wall', 'tuff_bricks', 'tuff_brick_slab', 'tuff_brick_stairs', 'tuff_brick_wall', 'chiseled_tuff_bricks', 'chiseled_copper', 'exposed_chiseled_copper', 'weathered_chiseled_copper', 'oxidized_chiseled_copper', 'waxed_chiseled_copper', 'waxed_exposed_chiseled_copper', 'waxed_weathered_chiseled_copper', 'waxed_oxidized_chiseled_copper', 'copper_grate', 'exposed_copper_grate', 'weathered_copper_grate', 'oxidized_copper_grate', 'waxed_copper_grate', 'waxed_exposed_copper_grate', 'waxed_weathered_copper_grate', 'waxed_oxidized_copper_grate', 'copper_bulb', 'exposed_copper_bulb', 'weathered_copper_bulb', 'oxidized_copper_bulb', 'waxed_copper_bulb', 'waxed_exposed_copper_bulb', 'waxed_weathered_copper_bulb', 'waxed_oxidized_copper_bulb', 'copper_door', 'exposed_copper_door', 'weathered_copper_door', 'oxidized_copper_door', 'waxed_copper_door', 'waxed_exposed_copper_door', 'waxed_weathered_copper_door', 'waxed_oxidized_copper_door', 'copper_trapdoor', 'exposed_copper_trapdoor', 'weathered_copper_trapdoor', 'oxidized_copper_trapdoor', 'waxed_copper_trapdoor', 'waxed_exposed_copper_trapdoor', 'waxed_weathered_copper_trapdoor', 'waxed_oxidized_copper_trapdoor', 'crafter', 'trial_spawner', 'vault', 'heavy_core'],
    // 1.21.2+ additions (Pale Garden)
    '1.21.2': ['pale_oak_planks', 'pale_oak_slab', 'pale_oak_stairs', 'pale_oak_fence', 'pale_oak_fence_gate', 'pale_oak_door', 'pale_oak_trapdoor', 'pale_oak_button', 'pale_oak_pressure_plate', 'pale_oak_sign', 'pale_oak_log', 'stripped_pale_oak_log', 'pale_oak_wood', 'stripped_pale_oak_wood', 'pale_oak_leaves', 'pale_oak_sapling', 'pale_moss_block', 'pale_moss_carpet', 'pale_hanging_moss', 'creaking_heart', 'open_eyeblossom', 'closed_eyeblossom', 'resin_clump', 'resin_block', 'resin_bricks', 'resin_brick_slab', 'resin_brick_stairs', 'resin_brick_wall', 'chiseled_resin_bricks'],
};

// Smart fallback finder based on color and material
function findFallback(block, availableBlocks) {
    // 1. Try same material type first
    for (const [type, blocks] of Object.entries(MATERIAL_TYPES)) {
        if (blocks.includes(block)) {
            for (const alt of blocks) {
                if (alt !== block && availableBlocks.has(alt)) {
                    return alt;
                }
            }
        }
    }
    
    // 2. Try color matching
    for (const [color, blocks] of Object.entries(BLOCK_COLORS)) {
        if (blocks.includes(block)) {
            for (const alt of blocks) {
                if (alt !== block && availableBlocks.has(alt)) {
                    return alt;
                }
            }
        }
    }
    
    // 3. Pattern-based fallbacks
    const patterns = [
        // Wood variants -> oak
        [/_planks$/, 'oak_planks'],
        [/_log$/, 'oak_log'],
        [/_wood$/, 'oak_wood'],
        [/_slab$/, 'oak_slab'],
        [/_stairs$/, 'oak_stairs'],
        [/_fence$/, 'oak_fence'],
        [/_fence_gate$/, 'oak_fence_gate'],
        [/_door$/, 'oak_door'],
        [/_trapdoor$/, 'oak_trapdoor'],
        [/_button$/, 'oak_button'],
        [/_pressure_plate$/, 'oak_pressure_plate'],
        [/_sign$/, 'oak_sign'],
        [/_wall_sign$/, 'oak_wall_sign'],
        [/_hanging_sign$/, 'oak_sign'],
        [/_wall_hanging_sign$/, 'oak_wall_sign'],
        // Stone variants -> stone
        [/deepslate/, 'stone'],
        [/blackstone/, 'cobblestone'],
        [/tuff/, 'andesite'],
        [/calcite/, 'diorite'],
        // Copper -> iron
        [/copper/, 'iron_block'],
        [/^exposed_/, 'iron_block'],
        [/^weathered_/, 'iron_block'],
        [/^oxidized_/, 'iron_block'],
        [/^waxed_/, 'iron_block'],
        // Nether blocks
        [/crimson/, 'nether_bricks'],
        [/warped/, 'prismarine'],
        [/soul_/, 'netherrack'],
        [/basalt/, 'stone'],
        // Sculk -> black wool
        [/sculk/, 'black_wool'],
        // Mud -> dirt
        [/^mud/, 'dirt'],
        [/mangrove/, 'oak_planks'],
        // Cherry -> birch (similar light color)
        [/cherry/, 'birch_planks'],
        // Bamboo -> oak
        [/bamboo/, 'oak_planks'],
        // Pale oak -> birch
        [/pale_oak/, 'birch_planks'],
        [/pale_moss/, 'moss_block'],
        // Amethyst -> purple glass
        [/amethyst/, 'purple_stained_glass'],
        // Candles -> torches
        [/candle/, 'torch'],
        // Froglights -> glowstone
        [/froglight/, 'glowstone'],
        // Dripleaf -> lily pad
        [/dripleaf/, 'lily_pad'],
        // Moss -> green wool
        [/moss/, 'green_wool'],
        // Honey -> yellow glass
        [/honey/, 'yellow_stained_glass'],
        // Resin -> orange terracotta
        [/resin/, 'orange_terracotta'],
    ];
    
    for (const [pattern, fallback] of patterns) {
        if (pattern.test(block) && availableBlocks.has(fallback)) {
            return fallback;
        }
    }
    
    // 4. Default fallback
    return 'stone';
}

// Generate complete fallback mappings
function generateFallbacks(versionBlocks) {
    const fallbacks = {};
    const versions = Object.keys(VERSION_ADDED).sort((a, b) => parseFloat(a) - parseFloat(b));
    
    // For each version's new blocks, find fallbacks in previous version
    for (let i = 0; i < versions.length; i++) {
        const ver = versions[i];
        const newBlocks = VERSION_ADDED[ver] || [];
        
        // Find available blocks in 1.13 (base version)
        const baseBlocks = new Set([
            'stone', 'granite', 'diorite', 'andesite', 'cobblestone', 'oak_planks', 'spruce_planks',
            'birch_planks', 'jungle_planks', 'acacia_planks', 'dark_oak_planks', 'oak_log', 'spruce_log',
            'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log', 'oak_wood', 'spruce_wood',
            'birch_wood', 'jungle_wood', 'acacia_wood', 'dark_oak_wood', 'oak_leaves', 'spruce_leaves',
            'birch_leaves', 'jungle_leaves', 'acacia_leaves', 'dark_oak_leaves', 'sand', 'gravel',
            'gold_ore', 'iron_ore', 'coal_ore', 'oak_slab', 'spruce_slab', 'birch_slab', 'jungle_slab',
            'acacia_slab', 'dark_oak_slab', 'stone_slab', 'cobblestone_slab', 'brick_slab',
            'stone_brick_slab', 'nether_brick_slab', 'quartz_slab', 'red_sandstone_slab', 'sandstone_slab',
            'oak_stairs', 'cobblestone_stairs', 'brick_stairs', 'stone_brick_stairs', 'nether_brick_stairs',
            'sandstone_stairs', 'spruce_stairs', 'birch_stairs', 'jungle_stairs', 'quartz_stairs',
            'acacia_stairs', 'dark_oak_stairs', 'red_sandstone_stairs', 'oak_fence', 'spruce_fence',
            'birch_fence', 'jungle_fence', 'acacia_fence', 'dark_oak_fence', 'nether_brick_fence',
            'oak_fence_gate', 'spruce_fence_gate', 'birch_fence_gate', 'jungle_fence_gate',
            'acacia_fence_gate', 'dark_oak_fence_gate', 'oak_door', 'spruce_door', 'birch_door',
            'jungle_door', 'acacia_door', 'dark_oak_door', 'iron_door', 'oak_trapdoor', 'spruce_trapdoor',
            'birch_trapdoor', 'jungle_trapdoor', 'acacia_trapdoor', 'dark_oak_trapdoor', 'iron_trapdoor',
            'oak_button', 'spruce_button', 'birch_button', 'jungle_button', 'acacia_button',
            'dark_oak_button', 'stone_button', 'oak_pressure_plate', 'spruce_pressure_plate',
            'birch_pressure_plate', 'jungle_pressure_plate', 'acacia_pressure_plate',
            'dark_oak_pressure_plate', 'stone_pressure_plate', 'light_weighted_pressure_plate',
            'heavy_weighted_pressure_plate', 'cobblestone_wall', 'mossy_cobblestone_wall', 'brick_wall',
            'stone_brick_wall', 'mossy_stone_brick_wall', 'nether_brick_wall', 'end_stone_brick_wall',
            'prismarine_wall', 'red_sandstone_wall', 'sandstone_wall', 'glass', 'glass_pane',
            'white_stained_glass', 'orange_stained_glass', 'magenta_stained_glass', 'light_blue_stained_glass',
            'yellow_stained_glass', 'lime_stained_glass', 'pink_stained_glass', 'gray_stained_glass',
            'light_gray_stained_glass', 'cyan_stained_glass', 'purple_stained_glass', 'blue_stained_glass',
            'brown_stained_glass', 'green_stained_glass', 'red_stained_glass', 'black_stained_glass',
            'white_wool', 'orange_wool', 'magenta_wool', 'light_blue_wool', 'yellow_wool', 'lime_wool',
            'pink_wool', 'gray_wool', 'light_gray_wool', 'cyan_wool', 'purple_wool', 'blue_wool',
            'brown_wool', 'green_wool', 'red_wool', 'black_wool', 'white_concrete', 'orange_concrete',
            'magenta_concrete', 'light_blue_concrete', 'yellow_concrete', 'lime_concrete', 'pink_concrete',
            'gray_concrete', 'light_gray_concrete', 'cyan_concrete', 'purple_concrete', 'blue_concrete',
            'brown_concrete', 'green_concrete', 'red_concrete', 'black_concrete', 'white_terracotta',
            'orange_terracotta', 'magenta_terracotta', 'light_blue_terracotta', 'yellow_terracotta',
            'lime_terracotta', 'pink_terracotta', 'gray_terracotta', 'light_gray_terracotta',
            'cyan_terracotta', 'purple_terracotta', 'blue_terracotta', 'brown_terracotta',
            'green_terracotta', 'red_terracotta', 'black_terracotta', 'terracotta', 'bricks',
            'stone_bricks', 'mossy_stone_bricks', 'cracked_stone_bricks', 'chiseled_stone_bricks',
            'nether_bricks', 'red_nether_bricks', 'end_stone_bricks', 'prismarine', 'prismarine_bricks',
            'dark_prismarine', 'sea_lantern', 'glowstone', 'redstone_lamp', 'torch', 'redstone_torch',
            'iron_block', 'gold_block', 'diamond_block', 'emerald_block', 'lapis_block', 'coal_block',
            'redstone_block', 'quartz_block', 'chiseled_quartz_block', 'quartz_pillar', 'purpur_block',
            'purpur_pillar', 'end_stone', 'obsidian', 'netherrack', 'soul_sand', 'magma_block',
            'hay_block', 'bone_block', 'slime_block', 'dirt', 'grass_block', 'podzol', 'mycelium',
            'clay', 'packed_ice', 'blue_ice', 'snow_block', 'ice', 'bookshelf', 'crafting_table',
            'furnace', 'chest', 'ender_chest', 'anvil', 'enchanting_table', 'brewing_stand',
            'cauldron', 'hopper', 'dispenser', 'dropper', 'observer', 'piston', 'sticky_piston',
            'tnt', 'note_block', 'jukebox', 'beacon', 'conduit', 'lily_pad', 'vine', 'ladder',
            'rail', 'powered_rail', 'detector_rail', 'activator_rail', 'oak_sign', 'spruce_sign',
            'birch_sign', 'jungle_sign', 'acacia_sign', 'dark_oak_sign', 'white_bed', 'orange_bed',
            'magenta_bed', 'light_blue_bed', 'yellow_bed', 'lime_bed', 'pink_bed', 'gray_bed',
            'light_gray_bed', 'cyan_bed', 'purple_bed', 'blue_bed', 'brown_bed', 'green_bed',
            'red_bed', 'black_bed', 'flower_pot', 'skeleton_skull', 'wither_skeleton_skull',
            'zombie_head', 'player_head', 'creeper_head', 'dragon_head', 'white_banner', 'orange_banner',
            'magenta_banner', 'light_blue_banner', 'yellow_banner', 'lime_banner', 'pink_banner',
            'gray_banner', 'light_gray_banner', 'cyan_banner', 'purple_banner', 'blue_banner',
            'brown_banner', 'green_banner', 'red_banner', 'black_banner', 'white_carpet', 'orange_carpet',
            'magenta_carpet', 'light_blue_carpet', 'yellow_carpet', 'lime_carpet', 'pink_carpet',
            'gray_carpet', 'light_gray_carpet', 'cyan_carpet', 'purple_carpet', 'blue_carpet',
            'brown_carpet', 'green_carpet', 'red_carpet', 'black_carpet', 'shulker_box',
            'white_shulker_box', 'orange_shulker_box', 'magenta_shulker_box', 'light_blue_shulker_box',
            'yellow_shulker_box', 'lime_shulker_box', 'pink_shulker_box', 'gray_shulker_box',
            'light_gray_shulker_box', 'cyan_shulker_box', 'purple_shulker_box', 'blue_shulker_box',
            'brown_shulker_box', 'green_shulker_box', 'red_shulker_box', 'black_shulker_box',
            'white_glazed_terracotta', 'orange_glazed_terracotta', 'magenta_glazed_terracotta',
            'light_blue_glazed_terracotta', 'yellow_glazed_terracotta', 'lime_glazed_terracotta',
            'pink_glazed_terracotta', 'gray_glazed_terracotta', 'light_gray_glazed_terracotta',
            'cyan_glazed_terracotta', 'purple_glazed_terracotta', 'blue_glazed_terracotta',
            'brown_glazed_terracotta', 'green_glazed_terracotta', 'red_glazed_terracotta',
            'black_glazed_terracotta', 'iron_bars', 'chain_command_block', 'command_block',
            'repeating_command_block', 'structure_block', 'structure_void', 'barrier', 'spawner',
            'end_portal_frame', 'end_gateway', 'bedrock', 'air', 'water', 'lava', 'fire',
        ]);
        
        for (const block of newBlocks) {
            const fb = findFallback(block, baseBlocks);
            fallbacks[block] = { addedIn: ver, fallback: fb };
        }
    }
    
    return fallbacks;
}

// Main
async function main() {
    console.log('🔧 Generating Block Mappings...\n');
    
    const fallbacks = generateFallbacks({});
    
    // Generate BLOCK_RENAMES format
    const renames = {};
    const fallbackMap = {};
    
    for (const [block, info] of Object.entries(fallbacks)) {
        // Convert version to previous version for "doesn't exist" marker
        const prevVer = {
            '1.14': '1.13',
            '1.15': '1.14',
            '1.16': '1.15',
            '1.17': '1.16',
            '1.18': '1.17',
            '1.19': '1.18',
            '1.19.3': '1.19',
            '1.20': '1.19',
            '1.21': '1.20',
            '1.21.2': '1.21',
        }[info.addedIn] || '1.13';
        
        renames[block] = { [prevVer]: null };
        fallbackMap[block] = info.fallback;
    }
    
    // Output
    console.log('// BLOCK_RENAMES - blocks that need conversion');
    console.log('export const BLOCK_RENAMES = {');
    for (const [block, vers] of Object.entries(renames).sort()) {
        const verStr = Object.entries(vers).map(([v, n]) => `'${v}': ${n === null ? 'null' : `'${n}'`}`).join(', ');
        console.log(`    '${block}': { ${verStr} },`);
    }
    console.log('};\n');
    
    console.log('// BLOCK_FALLBACKS - replacement blocks');
    console.log('export const BLOCK_FALLBACKS = {');
    for (const [block, fb] of Object.entries(fallbackMap).sort()) {
        console.log(`    '${block}': '${fb}',`);
    }
    console.log('};');
    
    // Save to file
    const output = {
        generated: new Date().toISOString(),
        totalMappings: Object.keys(fallbacks).length,
        renames,
        fallbacks: fallbackMap,
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'block-mappings-output.json'),
        JSON.stringify(output, null, 2)
    );
    
    console.log(`\n✅ Generated ${Object.keys(fallbacks).length} block mappings`);
    console.log('📄 Saved to scripts/block-mappings-output.json');
}

main().catch(console.error);
