import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Edges } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { TextureLoader, NearestFilter } from 'three';
import * as THREE from 'three';
import useStore from '../store/useStore';
import { TransformControls } from '@react-three/drei';

const TEXTURE_PATH = '/minecraft/textures/block/';

// Alias mapping for common block names to texture files
const ALIASES = {
    // Grass & Dirt
    'grass': 'grass_block_side',
    'grass_block': 'grass_block_side',
    'dirt': 'dirt',
    'coarse_dirt': 'coarse_dirt',
    'podzol': 'podzol_top',

    // Stone variants
    'stone': 'stone',
    'cobble': 'cobblestone',
    'cobblestone': 'cobblestone',
    'stone_bricks': 'stone_bricks',
    'mossy_stone_bricks': 'mossy_stone_bricks',
    'cracked_stone_bricks': 'cracked_stone_bricks',
    'smooth_stone': 'smooth_stone',
    'polished_andesite': 'polished_andesite',
    'polished_diorite': 'polished_diorite',
    'polished_granite': 'polished_granite',

    // Deepslate variants
    'deepslate': 'deepslate',
    'deepslate_bricks': 'deepslate_bricks',
    'deepslate_tiles': 'deepslate_tiles',
    'cracked_deepslate_bricks': 'cracked_deepslate_bricks',
    'cracked_deepslate_tiles': 'cracked_deepslate_tiles',
    'polished_deepslate': 'polished_deepslate',
    'chiseled_deepslate': 'chiseled_deepslate',
    'cobbled_deepslate': 'cobbled_deepslate',
    // Deepslate stairs/slabs - map to their base texture
    'deepslate_tile_stairs': 'deepslate_tiles',
    'deepslate_tile_slab': 'deepslate_tiles',
    'deepslate_brick_stairs': 'deepslate_bricks',
    'deepslate_brick_slab': 'deepslate_bricks',
    'polished_deepslate_stairs': 'polished_deepslate',
    'polished_deepslate_slab': 'polished_deepslate',
    'cobbled_deepslate_stairs': 'cobbled_deepslate',
    'cobbled_deepslate_slab': 'cobbled_deepslate',
    // AI sometimes generates wrong names - map to closest
    'polished_deepslate_bricks': 'deepslate_bricks',  // This block doesn't exist, map to deepslate_bricks


    // Wood planks
    'planks': 'oak_planks',
    'oak_planks': 'oak_planks',
    'spruce_planks': 'spruce_planks',
    'birch_planks': 'birch_planks',
    'jungle_planks': 'jungle_planks',
    'acacia_planks': 'acacia_planks',
    'dark_oak_planks': 'dark_oak_planks',
    'crimson_planks': 'crimson_planks',
    'warped_planks': 'warped_planks',
    'mangrove_planks': 'mangrove_planks',
    'cherry_planks': 'cherry_planks',
    'bamboo_planks': 'bamboo_planks',

    // Logs
    'log': 'oak_log',
    'oak_log': 'oak_log',
    'spruce_log': 'spruce_log',
    'birch_log': 'birch_log',
    'jungle_log': 'jungle_log',
    'acacia_log': 'acacia_log',
    'dark_oak_log': 'dark_oak_log',
    'crimson_stem': 'crimson_stem',
    'warped_stem': 'warped_stem',
    'mangrove_log': 'mangrove_log',
    'cherry_log': 'cherry_log',

    // Stripped logs
    'stripped_oak_log': 'stripped_oak_log',
    'stripped_spruce_log': 'stripped_spruce_log',
    'stripped_birch_log': 'stripped_birch_log',
    'stripped_jungle_log': 'stripped_jungle_log',
    'stripped_acacia_log': 'stripped_acacia_log',
    'stripped_dark_oak_log': 'stripped_dark_oak_log',
    'stripped_crimson_stem': 'stripped_crimson_stem',
    'stripped_warped_stem': 'stripped_warped_stem',
    'stripped_mangrove_log': 'stripped_mangrove_log',
    'stripped_cherry_log': 'stripped_cherry_log',

    // Wood blocks (bark on all sides) - map to log side texture
    'oak_wood': 'oak_log',
    'spruce_wood': 'spruce_log',
    'birch_wood': 'birch_log',
    'jungle_wood': 'jungle_log',
    'acacia_wood': 'acacia_log',
    'dark_oak_wood': 'dark_oak_log',
    'crimson_hyphae': 'crimson_stem',
    'warped_hyphae': 'warped_stem',
    'mangrove_wood': 'mangrove_log',
    'cherry_wood': 'cherry_log',
    
    // Stripped wood blocks
    'stripped_oak_wood': 'stripped_oak_log',
    'stripped_spruce_wood': 'stripped_spruce_log',
    'stripped_birch_wood': 'stripped_birch_log',
    'stripped_jungle_wood': 'stripped_jungle_log',
    'stripped_acacia_wood': 'stripped_acacia_log',
    'stripped_dark_oak_wood': 'stripped_dark_oak_log',
    'stripped_crimson_hyphae': 'stripped_crimson_stem',
    'stripped_warped_hyphae': 'stripped_warped_stem',
    'stripped_mangrove_wood': 'stripped_mangrove_log',
    'stripped_cherry_wood': 'stripped_cherry_log',

    // Slabs (map to their base block texture)
    'oak_slab': 'oak_planks',
    'spruce_slab': 'spruce_planks',
    'birch_slab': 'birch_planks',
    'jungle_slab': 'jungle_planks',
    'acacia_slab': 'acacia_planks',
    'dark_oak_slab': 'dark_oak_planks',
    'crimson_slab': 'crimson_planks',
    'warped_slab': 'warped_planks',
    'stone_slab': 'stone',
    'cobblestone_slab': 'cobblestone',
    'stone_brick_slab': 'stone_bricks',
    'brick_slab': 'bricks',
    'quartz_slab': 'quartz_block_side',
    'smooth_stone_slab': 'smooth_stone',
    'polished_andesite_slab': 'polished_andesite',
    'sandstone_slab': 'sandstone',
    'red_sandstone_slab': 'red_sandstone',
    'cut_sandstone_slab': 'cut_sandstone',
    'nether_brick_slab': 'nether_bricks',
    'red_nether_brick_slab': 'red_nether_bricks',
    'prismarine_slab': 'prismarine',
    'dark_prismarine_slab': 'dark_prismarine',
    'prismarine_brick_slab': 'prismarine_bricks',
    'granite_slab': 'granite',
    'diorite_slab': 'diorite',
    'andesite_slab': 'andesite',
    'polished_granite_slab': 'polished_granite',
    'polished_diorite_slab': 'polished_diorite',
    'mossy_stone_brick_slab': 'mossy_stone_bricks',
    'mossy_cobblestone_slab': 'mossy_cobblestone',
    'blackstone_slab': 'blackstone',
    'polished_blackstone_slab': 'polished_blackstone',
    'mud_brick_slab': 'mud_bricks',
    'bamboo_slab': 'bamboo_planks',
    'cherry_slab': 'cherry_planks',
    'mangrove_slab': 'mangrove_planks',

    // Stairs (map to their base block texture)
    'oak_stairs': 'oak_planks',
    'spruce_stairs': 'spruce_planks',
    'birch_stairs': 'birch_planks',
    'jungle_stairs': 'jungle_planks',
    'acacia_stairs': 'acacia_planks',
    'dark_oak_stairs': 'dark_oak_planks',
    'cobblestone_stairs': 'cobblestone',
    'stone_brick_stairs': 'stone_bricks',
    'brick_stairs': 'bricks',
    'quartz_stairs': 'quartz_block_side',
    'sandstone_stairs': 'sandstone',
    'red_sandstone_stairs': 'red_sandstone',
    'nether_brick_stairs': 'nether_bricks',
    'red_nether_brick_stairs': 'red_nether_bricks',
    'prismarine_stairs': 'prismarine',
    'dark_prismarine_stairs': 'dark_prismarine',
    'prismarine_brick_stairs': 'prismarine_bricks',
    'granite_stairs': 'granite',
    'diorite_stairs': 'diorite',
    'andesite_stairs': 'andesite',
    'polished_granite_stairs': 'polished_granite',
    'polished_diorite_stairs': 'polished_diorite',
    'polished_andesite_stairs': 'polished_andesite',
    'stone_stairs': 'stone',
    'mossy_stone_brick_stairs': 'mossy_stone_bricks',
    'mossy_cobblestone_stairs': 'mossy_cobblestone',
    'blackstone_stairs': 'blackstone',
    'polished_blackstone_stairs': 'polished_blackstone',
    'crimson_stairs': 'crimson_planks',
    'warped_stairs': 'warped_planks',
    'bamboo_stairs': 'bamboo_planks',
    'cherry_stairs': 'cherry_planks',
    'mangrove_stairs': 'mangrove_planks',
    'mud_brick_stairs': 'mud_bricks',

    // Leaves
    'leaves': 'oak_leaves',
    'oak_leaves': 'oak_leaves',
    'spruce_leaves': 'spruce_leaves',
    'birch_leaves': 'birch_leaves',
    'jungle_leaves': 'jungle_leaves',
    'acacia_leaves': 'acacia_leaves',
    'dark_oak_leaves': 'dark_oak_leaves',
    'azalea_leaves': 'azalea_leaves',
    'cherry_leaves': 'cherry_leaves',
    'mangrove_leaves': 'mangrove_leaves',

    // Bricks & Walls
    'brick': 'bricks',
    'bricks': 'bricks',
    'brick_wall': 'bricks',
    'stone_brick_wall': 'stone_bricks',
    'cobblestone_wall': 'cobblestone',
    'mossy_cobblestone_wall': 'mossy_cobblestone',
    'deepslate_brick_wall': 'deepslate_bricks',
    'deepslate_tile_wall': 'deepslate_tiles',

    // Glass - All 16 colors
    'glass': 'glass',
    'glass_pane': 'glass',
    'tinted_glass': 'tinted_glass',
    // White
    'white_stained_glass': 'white_stained_glass',
    'white_stained_glass_pane': 'white_stained_glass',
    // Orange
    'orange_stained_glass': 'orange_stained_glass',
    'orange_stained_glass_pane': 'orange_stained_glass',
    // Magenta
    'magenta_stained_glass': 'magenta_stained_glass',
    'magenta_stained_glass_pane': 'magenta_stained_glass',
    // Light Blue
    'light_blue_stained_glass': 'light_blue_stained_glass',
    'light_blue_stained_glass_pane': 'light_blue_stained_glass',
    // Yellow
    'yellow_stained_glass': 'yellow_stained_glass',
    'yellow_stained_glass_pane': 'yellow_stained_glass',
    // Lime
    'lime_stained_glass': 'lime_stained_glass',
    'lime_stained_glass_pane': 'lime_stained_glass',
    // Pink
    'pink_stained_glass': 'pink_stained_glass',
    'pink_stained_glass_pane': 'pink_stained_glass',
    // Gray
    'gray_stained_glass': 'gray_stained_glass',
    'gray_stained_glass_pane': 'gray_stained_glass',
    // Light Gray
    'light_gray_stained_glass': 'light_gray_stained_glass',
    'light_gray_stained_glass_pane': 'light_gray_stained_glass',
    // Cyan
    'cyan_stained_glass': 'cyan_stained_glass',
    'cyan_stained_glass_pane': 'cyan_stained_glass',
    // Purple
    'purple_stained_glass': 'purple_stained_glass',
    'purple_stained_glass_pane': 'purple_stained_glass',
    // Blue
    'blue_stained_glass': 'blue_stained_glass',
    'blue_stained_glass_pane': 'blue_stained_glass',
    // Brown
    'brown_stained_glass': 'brown_stained_glass',
    'brown_stained_glass_pane': 'brown_stained_glass',
    // Green
    'green_stained_glass': 'green_stained_glass',
    'green_stained_glass_pane': 'green_stained_glass',
    // Red
    'red_stained_glass': 'red_stained_glass',
    'red_stained_glass_pane': 'red_stained_glass',
    // Black
    'black_stained_glass': 'black_stained_glass',
    'black_stained_glass_pane': 'black_stained_glass',

    // Doors
    'oak_door': 'oak_door_bottom',
    'spruce_door': 'spruce_door_bottom',
    'birch_door': 'birch_door_bottom',
    'jungle_door': 'jungle_door_bottom',
    'acacia_door': 'acacia_door_bottom',
    'dark_oak_door': 'dark_oak_door_bottom',
    'iron_door': 'iron_door_bottom',
    'crimson_door': 'crimson_door_bottom',
    'warped_door': 'warped_door_bottom',

    // Concrete
    'white_concrete': 'white_concrete',
    'black_concrete': 'black_concrete',
    'gray_concrete': 'gray_concrete',
    'light_gray_concrete': 'light_gray_concrete',
    'red_concrete': 'red_concrete',
    'orange_concrete': 'orange_concrete',
    'yellow_concrete': 'yellow_concrete',
    'lime_concrete': 'lime_concrete',
    'green_concrete': 'green_concrete',
    'cyan_concrete': 'cyan_concrete',
    'light_blue_concrete': 'light_blue_concrete',
    'blue_concrete': 'blue_concrete',
    'purple_concrete': 'purple_concrete',
    'magenta_concrete': 'magenta_concrete',
    'pink_concrete': 'pink_concrete',
    'brown_concrete': 'brown_concrete',

    // Wool
    'white_wool': 'white_wool',
    'black_wool': 'black_wool',
    'gray_wool': 'gray_wool',
    'light_gray_wool': 'light_gray_wool',

    // Terracotta
    'terracotta': 'terracotta',
    'white_terracotta': 'white_terracotta',
    'orange_terracotta': 'orange_terracotta',
    'magenta_terracotta': 'magenta_terracotta',
    'light_blue_terracotta': 'light_blue_terracotta',
    'yellow_terracotta': 'yellow_terracotta',
    'lime_terracotta': 'lime_terracotta',
    'pink_terracotta': 'pink_terracotta',
    'gray_terracotta': 'gray_terracotta',
    'light_gray_terracotta': 'light_gray_terracotta',
    'cyan_terracotta': 'cyan_terracotta',
    'purple_terracotta': 'purple_terracotta',
    'blue_terracotta': 'blue_terracotta',
    'brown_terracotta': 'brown_terracotta',
    'green_terracotta': 'green_terracotta',
    'red_terracotta': 'red_terracotta',
    'black_terracotta': 'black_terracotta',

    // Metals & Ores
    'iron_block': 'iron_block',
    'gold_block': 'gold_block',
    'diamond_block': 'diamond_block',
    'emerald_block': 'emerald_block',
    'copper_block': 'copper_block',
    'netherite_block': 'netherite_block',

    // Misc
    'sand': 'sand',
    'gravel': 'gravel',
    'clay': 'clay',
    'snow_block': 'snow',
    'ice': 'ice',
    'packed_ice': 'packed_ice',
    'blue_ice': 'blue_ice',
    'obsidian': 'obsidian',
    'crying_obsidian': 'crying_obsidian',
    'glowstone': 'glowstone',
    'sea_lantern': 'sea_lantern',
    'shroomlight': 'shroomlight',
    // Note: lantern/torch/flower_pot textures are not cube-mappable, use fallback colors
    'bookshelf': 'bookshelf',
    'crafting_table': 'crafting_table_front',
    'furnace': 'furnace_front',
    'barrel': 'barrel_side',
    'quartz_block': 'quartz_block_side',
    'smooth_quartz': 'quartz_block_bottom',
    'prismarine': 'prismarine',
    'dark_prismarine': 'dark_prismarine',

    // Carpets (map to wool textures)
    'white_carpet': 'white_wool',
    'black_carpet': 'black_wool',
    'gray_carpet': 'gray_wool',
    'light_gray_carpet': 'light_gray_wool',
    'red_carpet': 'red_wool',
    'blue_carpet': 'blue_wool',
    'green_carpet': 'green_wool',
    'brown_carpet': 'brown_wool',
    'orange_carpet': 'orange_wool',
    'yellow_carpet': 'yellow_wool',
    'lime_carpet': 'lime_wool',
    'pink_carpet': 'pink_wool',
    'cyan_carpet': 'cyan_wool',
    'purple_carpet': 'purple_wool',
    'magenta_carpet': 'magenta_wool',
    'light_blue_carpet': 'light_blue_wool',
    
    // Fences (map to their wood planks texture)
    'oak_fence': 'oak_planks',
    'spruce_fence': 'spruce_planks',
    'birch_fence': 'birch_planks',
    'jungle_fence': 'jungle_planks',
    'acacia_fence': 'acacia_planks',
    'dark_oak_fence': 'dark_oak_planks',
    'crimson_fence': 'crimson_planks',
    'warped_fence': 'warped_planks',
    'nether_brick_fence': 'nether_bricks',
    'bamboo_fence': 'bamboo_planks',
    'cherry_fence': 'cherry_planks',
    'mangrove_fence': 'mangrove_planks',
    
    // Fence Gates
    'oak_fence_gate': 'oak_planks',
    'spruce_fence_gate': 'spruce_planks',
    'birch_fence_gate': 'birch_planks',
    'jungle_fence_gate': 'jungle_planks',
    'acacia_fence_gate': 'acacia_planks',
    'dark_oak_fence_gate': 'dark_oak_planks',
    'crimson_fence_gate': 'crimson_planks',
    'warped_fence_gate': 'warped_planks',
    'bamboo_fence_gate': 'bamboo_planks',
    'cherry_fence_gate': 'cherry_planks',
    'mangrove_fence_gate': 'mangrove_planks',
    
    // Trapdoors
    'oak_trapdoor': 'oak_trapdoor',
    'spruce_trapdoor': 'spruce_trapdoor',
    'birch_trapdoor': 'birch_trapdoor',
    'jungle_trapdoor': 'jungle_trapdoor',
    'acacia_trapdoor': 'acacia_trapdoor',
    'dark_oak_trapdoor': 'dark_oak_trapdoor',
    'iron_trapdoor': 'iron_trapdoor',
    'crimson_trapdoor': 'crimson_trapdoor',
    'warped_trapdoor': 'warped_trapdoor',
    'bamboo_trapdoor': 'bamboo_trapdoor',
    'cherry_trapdoor': 'cherry_trapdoor',
    'mangrove_trapdoor': 'mangrove_trapdoor',
    
    // Crops (map to their mature stage)
    'wheat': 'wheat_stage7',
    'carrots': 'carrots_stage3',
    'potatoes': 'potatoes_stage3',
    'beetroots': 'beetroots_stage3',
    'nether_wart': 'nether_wart_stage2',
    
    // Flowers
    'dandelion': 'dandelion',
    'poppy': 'poppy',
    'blue_orchid': 'blue_orchid',
    'allium': 'allium',
    'azure_bluet': 'azure_bluet',
    'red_tulip': 'red_tulip',
    'orange_tulip': 'orange_tulip',
    'white_tulip': 'white_tulip',
    'pink_tulip': 'pink_tulip',
    'oxeye_daisy': 'oxeye_daisy',
    'cornflower': 'cornflower',
    'lily_of_the_valley': 'lily_of_the_valley',
    'wither_rose': 'wither_rose',
    'torchflower': 'torchflower',
    
    // Grass & Ferns
    'short_grass': 'short_grass',
    'tall_grass': 'tall_grass_top',
    'fern': 'fern',
    'large_fern': 'large_fern_top',
    'dead_bush': 'dead_bush',
    'seagrass': 'seagrass',
    
    // Saplings
    'oak_sapling': 'oak_sapling',
    'spruce_sapling': 'spruce_sapling',
    'birch_sapling': 'birch_sapling',
    'jungle_sapling': 'jungle_sapling',
    'acacia_sapling': 'acacia_sapling',
    'dark_oak_sapling': 'dark_oak_sapling',
    'cherry_sapling': 'cherry_sapling',
    
    // Mushrooms
    'red_mushroom': 'red_mushroom',
    'brown_mushroom': 'brown_mushroom',
    'crimson_fungus': 'crimson_fungus',
    'warped_fungus': 'warped_fungus',
    
    // Other plants
    'sweet_berry_bush': 'sweet_berry_bush_stage3',
    'sugar_cane': 'sugar_cane',
    'bamboo': 'bamboo_stalk',
    'nether_sprouts': 'nether_sprouts',
    'warped_roots': 'warped_roots',
    'crimson_roots': 'crimson_roots',
    'cave_vines': 'cave_vines',
    'cave_vines_plant': 'cave_vines_plant',
    'kelp': 'kelp',
    'kelp_plant': 'kelp_plant',
    
    // Farming blocks
    'farmland': 'farmland_moist',
    'dirt': 'dirt',
    'coarse_dirt': 'coarse_dirt',
    'rooted_dirt': 'rooted_dirt',
    'grass_block': 'grass_block_side',
    'podzol': 'podzol_top',
    'mycelium': 'mycelium_top',
    'moss_block': 'moss_block',
    'mud': 'mud',
    
    // Nether blocks
    'netherrack': 'netherrack',
    'nether_bricks': 'nether_bricks',
    'red_nether_bricks': 'red_nether_bricks',
    'soul_sand': 'soul_sand',
    'soul_soil': 'soul_soil',
    'basalt': 'basalt_side',
    'polished_basalt': 'polished_basalt_side',
    'blackstone': 'blackstone',
    'polished_blackstone': 'polished_blackstone',
    'polished_blackstone_bricks': 'polished_blackstone_bricks',
    'gilded_blackstone': 'gilded_blackstone',
    'magma_block': 'magma',
    'ancient_debris': 'ancient_debris_side',
    
    // Misc functional blocks
    'campfire': 'campfire_log',
    'soul_campfire': 'soul_campfire_log',
    'cauldron': 'cauldron_side',
    'composter': 'composter_side',
    'smoker': 'smoker_front',
    'blast_furnace': 'blast_furnace_front',
    'stonecutter': 'stonecutter_side',
    'grindstone': 'grindstone_side',
    'lectern': 'lectern_front',
    'note_block': 'note_block',
    'jukebox': 'jukebox_side',
    'hopper': 'hopper_outside',
    'iron_bars': 'iron_bars',
    'chain': 'chain',
    'rail': 'rail',
    'powered_rail': 'powered_rail',
    'detector_rail': 'detector_rail',
    'activator_rail': 'activator_rail',
    'lily_pad': 'lily_pad',
    'water': 'water_still',
    'lava': 'lava_still',
};

// Blocks that should NOT load textures (use fallback colors only)
// These are blocks with textures that don't map well to cubes
const USE_FALLBACK_ONLY = [
    // Small decorative blocks
    'lantern', 'soul_lantern',
    'torch', 'wall_torch', 'soul_torch', 'redstone_torch',
    'flower_pot', 'potted_oak_sapling', 'potted_spruce_sapling', 'potted_birch_sapling',
    'potted_fern', 'potted_dandelion', 'potted_poppy', 'potted_cactus', 'potted_azalea_bush',
    'candle', 'white_candle', 'black_candle', 'red_candle', 'blue_candle',
    // Buttons (no textures exist)
    'oak_button', 'spruce_button', 'birch_button', 'jungle_button',
    'acacia_button', 'dark_oak_button', 'stone_button', 'polished_blackstone_button',
    // Plants/Bushes
    'sweet_berry_bush', 'dead_bush', 'fern', 'large_fern', 'grass', 'tall_grass',
    'seagrass', 'tall_seagrass', 'kelp', 'kelp_plant',
    // Other problematic blocks
    'chest', 'ender_chest', 'trapped_chest',
    'brewing_stand', 'enchanting_table', 'anvil', 'bell',
    'lever', 'tripwire_hook',
];

// Transparent blocks that should render with alpha
const TRANSPARENT_BLOCKS = [
    'glass', 'glass_pane',
    'tinted_glass',
    'white_stained_glass', 'white_stained_glass_pane',
    'orange_stained_glass', 'orange_stained_glass_pane',
    'magenta_stained_glass', 'magenta_stained_glass_pane',
    'light_blue_stained_glass', 'light_blue_stained_glass_pane',
    'yellow_stained_glass', 'yellow_stained_glass_pane',
    'lime_stained_glass', 'lime_stained_glass_pane',
    'pink_stained_glass', 'pink_stained_glass_pane',
    'gray_stained_glass', 'gray_stained_glass_pane',
    'light_gray_stained_glass', 'light_gray_stained_glass_pane',
    'cyan_stained_glass', 'cyan_stained_glass_pane',
    'purple_stained_glass', 'purple_stained_glass_pane',
    'blue_stained_glass', 'blue_stained_glass_pane',
    'brown_stained_glass', 'brown_stained_glass_pane',
    'green_stained_glass', 'green_stained_glass_pane',
    'red_stained_glass', 'red_stained_glass_pane',
    'black_stained_glass', 'black_stained_glass_pane',
    'ice', 'packed_ice', 'blue_ice',
];

// Global texture loader
const loader = new TextureLoader();

// Texture cache
const textureCache = {};

function loadTexture(type) {
    if (textureCache[type]) {
        return Promise.resolve(textureCache[type]);
    }

    return new Promise((resolve) => {
        const url = `${TEXTURE_PATH}${type}.png`;
        loader.load(
            url,
            (tex) => {
                tex.magFilter = NearestFilter;
                tex.minFilter = NearestFilter;
                tex.needsUpdate = true;
                textureCache[type] = tex;
                resolve(tex);
            },
            undefined,
            () => {
                textureCache[type] = null;
                resolve(null);
            }
        );
    });
}

// Color map for blocks without textures
const FALLBACK_COLORS = {
    // Woods
    'oak_planks': '#b8945f',
    'oak_log': '#6b4423',
    'oak_door': '#b8945f',
    'spruce_planks': '#5c4033',
    'spruce_log': '#3d2817',
    'birch_planks': '#c8b77a',
    'birch_log': '#f5f5dc',
    'jungle_planks': '#9a6e4a',
    'acacia_planks': '#ad5d32',
    'dark_oak_planks': '#3d2817',
    'dark_oak_log': '#2d1f12',
    'dark_oak_slab': '#3d2817',
    'dark_oak_stairs': '#3d2817',
    'stripped_oak_log': '#b8945f',
    'stripped_spruce_log': '#6b5032',
    'stripped_birch_log': '#c8b77a',
    'stripped_dark_oak_log': '#4a3423',
    'crimson_planks': '#6f2828',
    'warped_planks': '#2a6e6e',
    'cherry_planks': '#e4baba',
    'mangrove_planks': '#7a3f3f',
    'bamboo_planks': '#c4a84b',
    
    // Wood blocks (bark on all sides)
    'oak_wood': '#6b4423',
    'spruce_wood': '#3d2817',
    'birch_wood': '#f5f5dc',
    'jungle_wood': '#5a4a3a',
    'acacia_wood': '#6a6a6a',
    'dark_oak_wood': '#2d1f12',
    'crimson_hyphae': '#5a1a1a',
    'warped_hyphae': '#1a5a5a',
    'mangrove_wood': '#5a3030',
    'cherry_wood': '#d4a0a0',
    
    // Stripped wood blocks
    'stripped_oak_wood': '#b8945f',
    'stripped_spruce_wood': '#6b5032',
    'stripped_birch_wood': '#c8b77a',
    'stripped_jungle_wood': '#9a6e4a',
    'stripped_acacia_wood': '#ad5d32',
    'stripped_dark_oak_wood': '#4a3423',
    'stripped_crimson_hyphae': '#8a4040',
    'stripped_warped_hyphae': '#3a8a8a',
    'stripped_mangrove_wood': '#7a4040',
    'stripped_cherry_wood': '#e4baba',

    // Stone variants
    'stone': '#8a8a8a',
    'cobblestone': '#7a7a7a',
    'stone_bricks': '#888888',
    'mossy_stone_bricks': '#6a7a6a',
    'smooth_stone': '#9a9a9a',
    'polished_andesite': '#8a8a8a',
    'polished_diorite': '#c0c0c0',
    'polished_granite': '#9a6a5a',

    // Deepslate
    'deepslate': '#4a4a55',
    'deepslate_bricks': '#3d3d48',
    'deepslate_tiles': '#363644',
    'cracked_deepslate_bricks': '#3a3a45',
    'cracked_deepslate_tiles': '#333340',
    'polished_deepslate': '#484855',
    'chiseled_deepslate': '#404050',
    'cobbled_deepslate': '#4a4a55',
    // Deepslate stairs/slabs
    'deepslate_tile_stairs': '#363644',
    'deepslate_tile_slab': '#363644',
    'deepslate_brick_stairs': '#3d3d48',
    'deepslate_brick_slab': '#3d3d48',
    'polished_deepslate_stairs': '#484855',
    'polished_deepslate_slab': '#484855',
    'cobbled_deepslate_stairs': '#4a4a55',
    'cobbled_deepslate_slab': '#4a4a55',
    // AI incorrect names
    'polished_deepslate_bricks': '#3d3d48',


    // Bricks & Walls
    'bricks': '#9b5a4a',
    'brick_wall': '#9b5a4a',
    'stone_brick_wall': '#888888',
    'cobblestone_wall': '#7a7a7a',

    // Glass - All 16 colors (fallback colors)
    'glass': '#c0e8f8',
    'glass_pane': '#c0e8f8',
    'tinted_glass': '#2a2a3a',
    'white_stained_glass': '#f0f0f0',
    'white_stained_glass_pane': '#f0f0f0',
    'orange_stained_glass': '#d87f33',
    'orange_stained_glass_pane': '#d87f33',
    'magenta_stained_glass': '#b24cd8',
    'magenta_stained_glass_pane': '#b24cd8',
    'light_blue_stained_glass': '#6699d8',
    'light_blue_stained_glass_pane': '#6699d8',
    'yellow_stained_glass': '#e5e533',
    'yellow_stained_glass_pane': '#e5e533',
    'lime_stained_glass': '#7fcc19',
    'lime_stained_glass_pane': '#7fcc19',
    'pink_stained_glass': '#f27fa5',
    'pink_stained_glass_pane': '#f27fa5',
    'gray_stained_glass': '#4c4c4c',
    'gray_stained_glass_pane': '#4c4c4c',
    'light_gray_stained_glass': '#999999',
    'light_gray_stained_glass_pane': '#999999',
    'cyan_stained_glass': '#4c7f99',
    'cyan_stained_glass_pane': '#4c7f99',
    'purple_stained_glass': '#7f3fb2',
    'purple_stained_glass_pane': '#7f3fb2',
    'blue_stained_glass': '#334cb2',
    'blue_stained_glass_pane': '#334cb2',
    'brown_stained_glass': '#664c33',
    'brown_stained_glass_pane': '#664c33',
    'green_stained_glass': '#667f33',
    'green_stained_glass_pane': '#667f33',
    'red_stained_glass': '#993333',
    'red_stained_glass_pane': '#993333',
    'black_stained_glass': '#191919',
    'black_stained_glass_pane': '#191919',

    // Concrete
    'white_concrete': '#cfd5d6',
    'black_concrete': '#080a0f',
    'gray_concrete': '#36393d',
    'light_gray_concrete': '#7d7d73',
    'red_concrete': '#8e2121',
    'orange_concrete': '#e06101',
    'yellow_concrete': '#f0af15',
    'lime_concrete': '#5ea918',
    'green_concrete': '#495b24',
    'cyan_concrete': '#157788',
    'light_blue_concrete': '#2389c6',
    'blue_concrete': '#2c2e8f',
    'purple_concrete': '#64209c',
    'magenta_concrete': '#a9309f',
    'pink_concrete': '#d5658e',
    'brown_concrete': '#603b1f',

    // Metals
    'iron_block': '#d8d8d8',
    'gold_block': '#f9d849',
    'diamond_block': '#62ece8',
    'emerald_block': '#2ed151',
    'copper_block': '#c06b4e',
    'netherite_block': '#423d3f',

    // Lights
    'torch': '#ffcc00',
    'glowstone': '#ffdd66',
    'sea_lantern': '#a8e4e4',
    'shroomlight': '#f9a825',
    'lantern': '#e8a93c',

    // Misc
    'sand': '#e0d6a8',
    'gravel': '#8a8078',
    'clay': '#a0a0b0',
    'snow_block': '#fafafa',
    'ice': '#8eb8e8',
    'packed_ice': '#7aa8d8',
    'blue_ice': '#6a98e8',
    'obsidian': '#0f0a18',
    'bookshelf': '#6b4423',
    'quartz_block': '#ece8e0',
    'prismarine': '#5a9a8a',
    'dark_prismarine': '#3a5a4a',

    // Decorative
    'flower_pot': '#8b4513',
    'potted_oak_sapling': '#8b4513',
    'potted_spruce_sapling': '#8b4513',
    'potted_birch_sapling': '#8b4513',
    'potted_fern': '#8b4513',
    'potted_dandelion': '#8b4513',
    'potted_poppy': '#8b4513',
    'potted_cactus': '#8b4513',
    'potted_azalea_bush': '#8b4513',
    'wall_torch': '#ffcc00',
    'soul_torch': '#66ffff',
    'redstone_torch': '#ff4444',
    'candle': '#e8d8b8',
    'white_candle': '#f0f0f0',
    'black_candle': '#1a1a1a',
    'red_candle': '#aa2020',
    'blue_candle': '#2020aa',
    'soul_lantern': '#66dddd',

    // Buttons (use wood/stone colors)
    'oak_button': '#b8945f',
    'spruce_button': '#5c4033',
    'birch_button': '#c8b77a',
    'jungle_button': '#9a6e4a',
    'acacia_button': '#ad5d32',
    'dark_oak_button': '#3d2817',
    'stone_button': '#8a8a8a',
    'polished_blackstone_button': '#2a2a30',

    // Plants
    'sweet_berry_bush': '#4a8a4a',
    'dead_bush': '#8b7355',
    'fern': '#4a8a4a',
    'large_fern': '#4a8a4a',
    'grass': '#5a9a4a',
    'short_grass': '#5a9a4a',
    'tall_grass': '#5a9a4a',
    'seagrass': '#3a8a6a',
    'kelp': '#3a7a5a',
    'kelp_plant': '#3a7a5a',
    
    // Flowers
    'dandelion': '#f0d000',
    'poppy': '#e02020',
    'blue_orchid': '#2090d0',
    'allium': '#b060d0',
    'azure_bluet': '#e0e0f0',
    'red_tulip': '#e02020',
    'orange_tulip': '#e07020',
    'white_tulip': '#f0f0f0',
    'pink_tulip': '#e080a0',
    'oxeye_daisy': '#f0f0a0',
    'cornflower': '#4060d0',
    'lily_of_the_valley': '#f0f0f0',
    'wither_rose': '#202020',
    'torchflower': '#e08020',
    'sunflower': '#f0d000',
    'lilac': '#c080c0',
    'rose_bush': '#c02020',
    'peony': '#e0a0c0',
    
    // Saplings
    'oak_sapling': '#4a8a4a',
    'spruce_sapling': '#2a5a3a',
    'birch_sapling': '#5a9a5a',
    'jungle_sapling': '#3a7a3a',
    'acacia_sapling': '#5a8a4a',
    'dark_oak_sapling': '#2a5a2a',
    'cherry_sapling': '#e0a0b0',
    'azalea': '#5a8a5a',
    'flowering_azalea': '#c080a0',
    
    // Mushrooms
    'red_mushroom': '#c02020',
    'brown_mushroom': '#8a6a4a',
    'crimson_fungus': '#8a2020',
    'warped_fungus': '#2a8a8a',
    
    // Nether plants
    'nether_sprouts': '#2a8a8a',
    'warped_roots': '#2a8a8a',
    'crimson_roots': '#8a2020',
    'nether_wart': '#6a2020',
    
    // Vines
    'cave_vines': '#4a8a4a',
    'cave_vines_plant': '#4a8a4a',
    'bamboo': '#6a9a4a',
    'sugar_cane': '#8ac060',
    
    // Crops
    'wheat': '#d4b84a',
    'carrots': '#e07020',
    'potatoes': '#c4a060',
    'beetroots': '#8a2020',
    'melon': '#6a9a30',
    'pumpkin': '#d07010',
    'sugar_cane': '#8ac060',
    
    // Farming
    'farmland': '#6a4a2a',
    'dirt': '#8b6b4a',
    'coarse_dirt': '#7a5a3a',
    'rooted_dirt': '#7a5a3a',
    'grass_block': '#5a9a4a',
    'podzol': '#6a5030',
    'mycelium': '#8a7080',
    'moss_block': '#5a7a4a',
    'mud': '#4a3a3a',
    'muddy_mangrove_roots': '#4a3a3a',
    
    // Fences & Gates
    'oak_fence': '#b8945f',
    'spruce_fence': '#5c4033',
    'birch_fence': '#c8b77a',
    'jungle_fence': '#9a6e4a',
    'acacia_fence': '#ad5d32',
    'dark_oak_fence': '#3d2817',
    'crimson_fence': '#6f2828',
    'warped_fence': '#2a6e6e',
    'nether_brick_fence': '#2d1a1a',
    'oak_fence_gate': '#b8945f',
    'spruce_fence_gate': '#5c4033',
    'birch_fence_gate': '#c8b77a',
    'jungle_fence_gate': '#9a6e4a',
    'acacia_fence_gate': '#ad5d32',
    'dark_oak_fence_gate': '#3d2817',
    
    // Trapdoors
    'oak_trapdoor': '#b8945f',
    'spruce_trapdoor': '#5c4033',
    'birch_trapdoor': '#c8b77a',
    'jungle_trapdoor': '#9a6e4a',
    'acacia_trapdoor': '#ad5d32',
    'dark_oak_trapdoor': '#3d2817',
    'iron_trapdoor': '#d8d8d8',
    'crimson_trapdoor': '#6f2828',
    'warped_trapdoor': '#2a6e6e',
    
    // Doors
    'spruce_door': '#5c4033',
    'birch_door': '#c8b77a',
    'jungle_door': '#9a6e4a',
    'acacia_door': '#ad5d32',
    'dark_oak_door': '#3d2817',
    'iron_door': '#d8d8d8',
    'crimson_door': '#6f2828',
    'warped_door': '#2a6e6e',
    
    // Stairs
    'oak_stairs': '#b8945f',
    'spruce_stairs': '#5c4033',
    'birch_stairs': '#c8b77a',
    'jungle_stairs': '#9a6e4a',
    'acacia_stairs': '#ad5d32',
    'stone_stairs': '#8a8a8a',
    'cobblestone_stairs': '#7a7a7a',
    'stone_brick_stairs': '#888888',
    'mossy_stone_brick_stairs': '#6a7a6a',
    'brick_stairs': '#9b5a4a',
    'sandstone_stairs': '#e0d6a8',
    'red_sandstone_stairs': '#b86030',
    'nether_brick_stairs': '#2d1a1a',
    'red_nether_brick_stairs': '#4a1a1a',
    'quartz_stairs': '#ece8e0',
    'prismarine_stairs': '#5a9a8a',
    'dark_prismarine_stairs': '#3a5a4a',
    'purpur_stairs': '#a070a0',
    'polished_blackstone_stairs': '#2a2a30',
    'polished_blackstone_brick_stairs': '#2a2a30',
    'cut_copper_stairs': '#c06b4e',
    'bamboo_stairs': '#c4a84b',
    'cherry_stairs': '#e4baba',
    
    // Slabs
    'oak_slab': '#b8945f',
    'spruce_slab': '#5c4033',
    'birch_slab': '#c8b77a',
    'jungle_slab': '#9a6e4a',
    'acacia_slab': '#ad5d32',
    'stone_slab': '#8a8a8a',
    'cobblestone_slab': '#7a7a7a',
    'stone_brick_slab': '#888888',
    'brick_slab': '#9b5a4a',
    'sandstone_slab': '#e0d6a8',
    'quartz_slab': '#ece8e0',
    'smooth_stone_slab': '#9a9a9a',
    'smooth_quartz_slab': '#ece8e0',
    'cut_copper_slab': '#c06b4e',
    
    // Nether blocks
    'netherrack': '#6a3030',
    'nether_bricks': '#2d1a1a',
    'red_nether_bricks': '#4a1a1a',
    'soul_sand': '#5a4a3a',
    'soul_soil': '#4a3a2a',
    'basalt': '#4a4a50',
    'polished_basalt': '#5a5a60',
    'blackstone': '#2a2a30',
    'polished_blackstone': '#2a2a30',
    'polished_blackstone_bricks': '#2a2a30',
    'gilded_blackstone': '#3a3a30',
    'crying_obsidian': '#2a1a4a',
    'ancient_debris': '#5a4a40',
    'glowstone': '#ffdd66',
    'magma_block': '#8a3010',
    
    // Wool
    'white_wool': '#f0f0f0',
    'black_wool': '#1a1a1a',
    'gray_wool': '#4a4a4a',
    'light_gray_wool': '#8a8a8a',
    'red_wool': '#9a2020',
    'blue_wool': '#2020aa',
    'green_wool': '#209a20',
    'brown_wool': '#6b4423',
    'orange_wool': '#d06000',
    'yellow_wool': '#d0c000',
    'lime_wool': '#6ac000',
    'pink_wool': '#d070a0',
    'cyan_wool': '#009090',
    'purple_wool': '#802080',
    'magenta_wool': '#a030a0',
    'light_blue_wool': '#4090d0',
    
    // Beds
    'white_bed': '#f0f0f0',
    'red_bed': '#9a2020',
    'blue_bed': '#2020aa',
    'green_bed': '#209a20',
    'black_bed': '#1a1a1a',
    'cyan_bed': '#009090',
    'orange_bed': '#d06000',
    'yellow_bed': '#d0c000',
    'pink_bed': '#d070a0',
    'purple_bed': '#802080',
    
    // Terracotta
    'terracotta': '#9a6a4a',
    'white_terracotta': '#d0c0b0',
    'black_terracotta': '#2a2020',
    'gray_terracotta': '#4a4040',
    'light_gray_terracotta': '#8a7a70',
    'red_terracotta': '#8a3030',
    'orange_terracotta': '#a05020',
    'yellow_terracotta': '#b09030',
    'brown_terracotta': '#5a3020',
    'cyan_terracotta': '#506060',
    
    // Misc blocks
    'campfire': '#d06000',
    'soul_campfire': '#40a0a0',
    'cauldron': '#4a4a4a',
    'water_cauldron': '#3060a0',
    'lava_cauldron': '#d04000',
    'composter': '#6a5030',
    'barrel': '#6a5030',
    'smoker': '#5a5050',
    'blast_furnace': '#5a5a5a',
    'furnace': '#6a6a6a',
    'crafting_table': '#8a6a4a',
    'cartography_table': '#6a5a4a',
    'fletching_table': '#8a7a5a',
    'smithing_table': '#3a3a4a',
    'loom': '#8a7a6a',
    'stonecutter': '#7a7a7a',
    'grindstone': '#6a6a6a',
    'lectern': '#8a6a4a',
    'note_block': '#6a4a3a',
    'jukebox': '#6a4a3a',
    'tripwire_hook': '#6a5a4a',
    'iron_bars': '#8a8a8a',
    'chain': '#4a4a5a',
    'hopper': '#4a4a4a',
    'activator_rail': '#6a3030',
    'detector_rail': '#6a4a4a',
    'powered_rail': '#d0a030',
    'rail': '#8a7a6a',
    'lily_pad': '#2a6a2a',
    'water': '#3060a0',
    'lava': '#d04000',

    // Other
    'chest': '#8b6914',
    'ender_chest': '#1a3a3a',
    'trapped_chest': '#8b6914',
    'brewing_stand': '#4a4a4a',
    'enchanting_table': '#2a1a4a',
    'anvil': '#4a4a4a',
    'bell': '#d4a017',
    'lever': '#6b4423',

    // Carpets
    'white_carpet': '#f0f0f0',
    'black_carpet': '#1a1a1a',
    'gray_carpet': '#4a4a4a',
    'light_gray_carpet': '#8a8a8a',
    'red_carpet': '#9a2020',
    'blue_carpet': '#2020aa',
    'green_carpet': '#209a20',
    'brown_carpet': '#6b4423',
    'orange_carpet': '#d06000',
    'yellow_carpet': '#d0c000',
    'lime_carpet': '#6ac000',
    'pink_carpet': '#d070a0',
    'cyan_carpet': '#009090',
    'purple_carpet': '#802080',
    'magenta_carpet': '#a030a0',
    'light_blue_carpet': '#4090d0',
    'moss_carpet': '#5a7a4a',

    'default': '#888888'
};

// Block shape configurations
// Defines the geometry dimensions [width, height, depth] and position offset [x, y, z]
const BLOCK_SHAPES = {
    // Slabs - half height blocks
    'slab': { size: [1, 0.5, 1], offset: [0, -0.25, 0] },
    // Carpets - very thin
    'carpet': { size: [1, 0.0625, 1], offset: [0, -0.46875, 0] },
    // Pressure plates
    'pressure_plate': { size: [0.875, 0.0625, 0.875], offset: [0, -0.46875, 0] },
    // Buttons - tiny
    'button': { size: [0.375, 0.125, 0.25], offset: [0, 0, 0.375] },
    // Flower pots - small decorative
    'flower_pot': { size: [0.375, 0.375, 0.375], offset: [0, -0.3125, 0] },
    // Lanterns
    'lantern': { size: [0.375, 0.5625, 0.375], offset: [0, -0.21875, 0] },
    // Candles
    'candle': { size: [0.25, 0.375, 0.25], offset: [0, -0.3125, 0] },
    // Torches
    'torch': { size: [0.125, 0.625, 0.125], offset: [0, -0.1875, 0] },
    // Walls - slightly narrower
    'wall': { size: [0.5, 1, 0.5], offset: [0, 0, 0] },
    // Fences
    'fence': { size: [0.25, 1, 0.25], offset: [0, 0, 0] },
    // Cross shape for plants (two intersecting planes)
    'cross': { size: [1, 1, 1], offset: [0, 0, 0], isCross: true },
    // Full block (default)
    'full': { size: [1, 1, 1], offset: [0, 0, 0] }
};

// Blocks that should render as cross (two intersecting planes)
const CROSS_BLOCKS = [
    // Crops
    'wheat', 'carrots', 'potatoes', 'beetroots', 'nether_wart',
    // Flowers
    'dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet',
    'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip',
    'oxeye_daisy', 'cornflower', 'lily_of_the_valley', 'wither_rose',
    'sunflower', 'lilac', 'rose_bush', 'peony', 'torchflower', 'pitcher_plant',
    // Grass & Ferns
    'short_grass', 'tall_grass', 'fern', 'large_fern',
    'dead_bush', 'seagrass', 'tall_seagrass',
    // Saplings
    'oak_sapling', 'spruce_sapling', 'birch_sapling', 'jungle_sapling',
    'acacia_sapling', 'dark_oak_sapling', 'cherry_sapling', 'mangrove_propagule',
    'azalea', 'flowering_azalea',
    // Mushrooms
    'red_mushroom', 'brown_mushroom', 'crimson_fungus', 'warped_fungus',
    // Other plants
    'sweet_berry_bush', 'cave_vines', 'cave_vines_plant',
    'kelp', 'kelp_plant', 'bamboo', 'sugar_cane',
    'nether_sprouts', 'warped_roots', 'crimson_roots',
];

// Map block types to their shape category
const getBlockShape = (blockType) => {
    const type = blockType.toLowerCase();
    
    // Check for cross blocks first
    if (CROSS_BLOCKS.some(cb => type === cb || type.startsWith(cb + '?'))) return 'cross';

    // Slabs
    if (type.includes('_slab')) return 'slab';

    // Carpets
    if (type.includes('_carpet') || type === 'moss_carpet') return 'carpet';

    // Pressure plates
    if (type.includes('_pressure_plate')) return 'pressure_plate';

    // Buttons
    if (type.includes('_button')) return 'button';

    // Flower pots
    if (type.includes('flower_pot') || type.includes('potted_')) return 'flower_pot';

    // Lanterns
    if (type === 'lantern' || type === 'soul_lantern') return 'lantern';

    // Candles
    if (type.includes('candle')) return 'candle';

    // Torches
    if (type.includes('torch') && !type.includes('torchflower')) return 'torch';

    // Walls
    if (type.includes('_wall') && !type.includes('wall_')) return 'wall';

    // Fences
    if (type.includes('_fence') && !type.includes('fence_gate')) return 'fence';

    return 'full';
};

// ============ TEXTURED BLOCK (For quality mode) ============

/**
 * Cross-shaped block for plants (two intersecting planes)
 */
const CrossBlock = React.memo(function CrossBlock({ data, isSelected, onClick }) {
    const [texture, setTexture] = useState(null);
    const type = ALIASES[data.type] || data.type;
    const fallbackColor = FALLBACK_COLORS[data.type] || FALLBACK_COLORS['default'];

    const position = [
        data.position[0] + 0.5,
        data.position[1] + 0.5,
        data.position[2] + 0.5
    ];

    useEffect(() => {
        loadTexture(type).then((tex) => {
            setTexture(tex);
        });
    }, [type]);

    // Create two intersecting planes at 45 degrees
    return (
        <group
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                onClick(data.id);
            }}
        >
            {/* First plane - diagonal from corner to corner */}
            <mesh rotation={[0, Math.PI / 4, 0]}>
                <planeGeometry args={[1.414, 1]} /> {/* sqrt(2) for diagonal */}
                <meshBasicMaterial
                    map={texture}
                    color={texture ? '#ffffff' : fallbackColor}
                    toneMapped={false}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
            {/* Second plane - perpendicular to first */}
            <mesh rotation={[0, -Math.PI / 4, 0]}>
                <planeGeometry args={[1.414, 1]} />
                <meshBasicMaterial
                    map={texture}
                    color={texture ? '#ffffff' : fallbackColor}
                    toneMapped={false}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
            {isSelected && (
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color="#fbbf24" wireframe={true} />
                </mesh>
            )}
        </group>
    );
});

/**
 * Single block with texture - used when block count is low
 */
const Block = React.memo(function Block({ data, isSelected, onClick }) {
    const [texture, setTexture] = useState(null);
    const materialRef = useRef();
    const type = ALIASES[data.type] || data.type;
    const fallbackColor = FALLBACK_COLORS[data.type] || FALLBACK_COLORS['default'];
    const useFallbackOnly = USE_FALLBACK_ONLY.includes(data.type);
    const isTransparent = TRANSPARENT_BLOCKS.includes(data.type);

    const shapeType = getBlockShape(data.type);
    const shape = BLOCK_SHAPES[shapeType];
    
    // Use CrossBlock for cross-shaped blocks
    if (shape.isCross) {
        return <CrossBlock data={data} isSelected={isSelected} onClick={onClick} />;
    }

    const position = [
        data.position[0] + 0.5 + shape.offset[0],
        data.position[1] + 0.5 + shape.offset[1],
        data.position[2] + 0.5 + shape.offset[2]
    ];

    useEffect(() => {
        if (useFallbackOnly) {
            setTexture(null);
            return;
        }
        loadTexture(type).then((tex) => {
            setTexture(tex);
            if (materialRef.current && tex) {
                materialRef.current.map = tex;
                materialRef.current.needsUpdate = true;
            }
        });
    }, [type, useFallbackOnly]);

    return (
        <mesh
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                onClick(data.id);
            }}
        >
            <boxGeometry args={shape.size} />
            <meshBasicMaterial
                ref={materialRef}
                map={texture}
                color={texture ? '#ffffff' : fallbackColor}
                toneMapped={false}
                transparent={isTransparent}
                opacity={isTransparent ? 0.6 : 1.0}
                side={isTransparent ? THREE.DoubleSide : THREE.FrontSide}
                depthWrite={!isTransparent}
            />
            {isSelected && <Edges color="#fbbf24" linewidth={3} threshold={15} />}
        </mesh>
    );
});

// ============ INSTANCED RENDERING (For performance mode) ============

/**
 * InstancedBlocks - Renders all blocks of one color using InstancedMesh
 * MUCH faster than individual <mesh> components
 */
function InstancedBlocks({ blocks, color }) {
    const meshRef = useRef();
    const tempObject = useMemo(() => new THREE.Object3D(), []);

    useEffect(() => {
        if (!meshRef.current || blocks.length === 0) return;

        blocks.forEach((block, i) => {
            const shape = BLOCK_SHAPES[getBlockShape(block.type)];

            tempObject.position.set(
                block.position[0] + 0.5 + shape.offset[0],
                block.position[1] + 0.5 + shape.offset[1],
                block.position[2] + 0.5 + shape.offset[2]
            );
            tempObject.scale.set(shape.size[0], shape.size[1], shape.size[2]);
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [blocks, tempObject]);

    if (blocks.length === 0) return null;

    return (
        <instancedMesh ref={meshRef} args={[null, null, blocks.length]} frustumCulled={true}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={color} toneMapped={false} />
        </instancedMesh>
    );
}

// ============ TEXTURED INSTANCED RENDERING ============
// Material cache for performance
// IMPORTANT: Clear this cache if textures aren't loading properly
const materialCache = new Map();

// Clear material cache (call this if textures are broken)
export function clearMaterialCache() {
    materialCache.forEach(mat => mat.dispose());
    materialCache.clear();
}

function getOrCreateMaterial(blockType) {
    const textureKey = ALIASES[blockType] || blockType;

    if (materialCache.has(textureKey)) {
        return materialCache.get(textureKey);
    }

    const fallbackColor = FALLBACK_COLORS[blockType] || FALLBACK_COLORS['default'];
    const useFallbackOnly = USE_FALLBACK_ONLY.includes(blockType);
    const isTransparent = TRANSPARENT_BLOCKS.includes(blockType);

    // Create material
    const material = new THREE.MeshBasicMaterial({
        color: fallbackColor,
        toneMapped: false,
        transparent: isTransparent,
        opacity: isTransparent ? 0.6 : 1.0,
        side: THREE.FrontSide,
        depthTest: true,
        depthWrite: !isTransparent,
    });

    // Load texture asynchronously
    if (!useFallbackOnly) {
        loadTexture(textureKey).then((tex) => {
            if (tex) {
                material.map = tex;
                material.color.set('#ffffff');
                material.needsUpdate = true;
            }
        });
    }

    materialCache.set(textureKey, material);
    return material;
}

function TexturedInstancedBlocks({ blocks, blockType, onBlockClick, positionMap }) {
    const meshRef = useRef();
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const material = useMemo(() => getOrCreateMaterial(blockType), [blockType]);
    
    // Check if this is a cross-shaped block
    const shapeType = getBlockShape(blockType);
    const isCross = BLOCK_SHAPES[shapeType]?.isCross;

    useEffect(() => {
        if (!meshRef.current || blocks.length === 0) return;

        blocks.forEach((block, i) => {
            const shape = BLOCK_SHAPES[getBlockShape(block.type)];

            tempObject.position.set(
                block.position[0] + 0.5 + shape.offset[0],
                block.position[1] + 0.5 + shape.offset[1],
                block.position[2] + 0.5 + shape.offset[2]
            );
            tempObject.scale.set(shape.size[0], shape.size[1], shape.size[2]);
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [blocks, tempObject]);

    // Handle click on instanced mesh
    const handleClick = (event) => {
        event.stopPropagation();
        const instanceId = event.instanceId;
        if (instanceId !== undefined && blocks[instanceId]) {
            onBlockClick(blocks[instanceId].id, event);
        }
    };

    if (blocks.length === 0) return null;
    
    // For cross-shaped blocks, render as individual CrossBlocks for now
    // (instanced cross rendering is complex and would require custom shaders)
    if (isCross) {
        return (
            <CrossInstancedBlocks 
                blocks={blocks} 
                blockType={blockType} 
                onBlockClick={onBlockClick}
            />
        );
    }

    return (
        <instancedMesh
            ref={meshRef}
            args={[null, null, blocks.length]}
            material={material}
            onClick={handleClick}
            frustumCulled={true}
        >
            <boxGeometry args={[1, 1, 1]} />
        </instancedMesh>
    );
}

/**
 * CrossInstancedBlocks - Renders cross-shaped blocks (plants, crops, flowers)
 * Uses two intersecting planes per block
 */
function CrossInstancedBlocks({ blocks, blockType, onBlockClick }) {
    const mesh1Ref = useRef();
    const mesh2Ref = useRef();
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const [textureLoaded, setTextureLoaded] = useState(false);
    
    // Create material with transparency for plants
    const material = useMemo(() => {
        const textureKey = ALIASES[blockType] || blockType;
        const fallbackColor = FALLBACK_COLORS[blockType] || FALLBACK_COLORS['default'];
        
        const mat = new THREE.MeshBasicMaterial({
            color: fallbackColor,
            toneMapped: false,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        
        return mat;
    }, [blockType]);
    
    // Load texture separately to trigger re-render
    useEffect(() => {
        const textureKey = ALIASES[blockType] || blockType;
        loadTexture(textureKey).then((tex) => {
            if (tex && material) {
                material.map = tex;
                material.color.set('#ffffff');
                material.needsUpdate = true;
                setTextureLoaded(true);
            }
        });
    }, [blockType, material]);

    useEffect(() => {
        if (!mesh1Ref.current || !mesh2Ref.current || blocks.length === 0) return;

        blocks.forEach((block, i) => {
            tempObject.position.set(
                block.position[0] + 0.5,
                block.position[1] + 0.5,
                block.position[2] + 0.5
            );
            tempObject.scale.set(1, 1, 1);
            
            // First plane - rotated 45 degrees
            tempObject.rotation.set(0, Math.PI / 4, 0);
            tempObject.updateMatrix();
            mesh1Ref.current.setMatrixAt(i, tempObject.matrix);
            
            // Second plane - rotated -45 degrees
            tempObject.rotation.set(0, -Math.PI / 4, 0);
            tempObject.updateMatrix();
            mesh2Ref.current.setMatrixAt(i, tempObject.matrix);
        });

        mesh1Ref.current.instanceMatrix.needsUpdate = true;
        mesh2Ref.current.instanceMatrix.needsUpdate = true;
    }, [blocks, tempObject]);

    const handleClick = (event) => {
        event.stopPropagation();
        const instanceId = event.instanceId;
        if (instanceId !== undefined && blocks[instanceId]) {
            onBlockClick(blocks[instanceId].id, event);
        }
    };

    if (blocks.length === 0) return null;

    return (
        <group>
            {/* First plane */}
            <instancedMesh
                ref={mesh1Ref}
                args={[null, null, blocks.length]}
                material={material}
                onClick={handleClick}
                frustumCulled={true}
            >
                <planeGeometry args={[1.414, 1]} />
            </instancedMesh>
            {/* Second plane */}
            <instancedMesh
                ref={mesh2Ref}
                args={[null, null, blocks.length]}
                material={material}
                onClick={handleClick}
                frustumCulled={true}
            >
                <planeGeometry args={[1.414, 1]} />
            </instancedMesh>
        </group>
    );
}

// ============ ULTRA PERFORMANCE MODE ============
// Single mesh with vertex colors - NO textures, minimal draw calls
// For 10,000+ blocks where FPS is more important than visual quality
const PERFORMANCE_THRESHOLD = 1000000;

function UltraPerformanceRenderer({ blocks, positionMap, onBlockClick }) {
    const meshRef = useRef();

    const geometry = useMemo(() => {
        if (blocks.length === 0) return null;

        // Helper to check if neighbor blocks the face
        const isFaceBlocked = (x, y, z) => {
            const key = `${x},${y},${z}`;
            const neighbor = positionMap?.get(key);
            if (!neighbor) return false;
            const type = neighbor.type?.toLowerCase() || '';
            if (TRANSPARENT_BLOCKS.includes(type)) return false;
            if (type.includes('_slab') || type.includes('_stairs')) return false;
            return true;
        };

        const positions = [];
        const normals = [];
        const colors = [];
        const indices = [];
        let vertexOffset = 0;

        const FACE_DIRS = [
            { axis: 'x', dir: 1, normal: [1, 0, 0] },
            { axis: 'x', dir: -1, normal: [-1, 0, 0] },
            { axis: 'y', dir: 1, normal: [0, 1, 0] },
            { axis: 'y', dir: -1, normal: [0, -1, 0] },
            { axis: 'z', dir: 1, normal: [0, 0, 1] },
            { axis: 'z', dir: -1, normal: [0, 0, -1] },
        ];

        blocks.forEach(block => {
            const [bx, by, bz] = block.position;
            const colorHex = FALLBACK_COLORS[block.type] || FALLBACK_COLORS['default'];
            const color = new THREE.Color(colorHex);

            FACE_DIRS.forEach(({ axis, dir, normal }) => {
                const nx = axis === 'x' ? bx + dir : bx;
                const ny = axis === 'y' ? by + dir : by;
                const nz = axis === 'z' ? bz + dir : bz;

                if (isFaceBlocked(nx, ny, nz)) return;

                let verts;
                if (axis === 'x') {
                    const x = dir > 0 ? bx + 1 : bx;
                    verts = dir > 0
                        ? [[x, by, bz], [x, by + 1, bz], [x, by + 1, bz + 1], [x, by, bz + 1]]
                        : [[x, by, bz + 1], [x, by + 1, bz + 1], [x, by + 1, bz], [x, by, bz]];
                } else if (axis === 'y') {
                    const y = dir > 0 ? by + 1 : by;
                    verts = dir > 0
                        ? [[bx, y, bz + 1], [bx + 1, y, bz + 1], [bx + 1, y, bz], [bx, y, bz]]
                        : [[bx, y, bz], [bx + 1, y, bz], [bx + 1, y, bz + 1], [bx, y, bz + 1]];
                } else {
                    const z = dir > 0 ? bz + 1 : bz;
                    verts = dir > 0
                        ? [[bx, by, z], [bx + 1, by, z], [bx + 1, by + 1, z], [bx, by + 1, z]]
                        : [[bx + 1, by, z], [bx, by, z], [bx, by + 1, z], [bx + 1, by + 1, z]];
                }

                verts.forEach(vert => {
                    positions.push(...vert);
                    normals.push(...normal);
                    colors.push(color.r, color.g, color.b);
                });

                indices.push(
                    vertexOffset, vertexOffset + 1, vertexOffset + 2,
                    vertexOffset, vertexOffset + 2, vertexOffset + 3
                );
                vertexOffset += 4;
            });
        });

        if (positions.length === 0) return null;

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.setIndex(indices);
        geo.computeBoundingSphere();

        return geo;
    }, [blocks, positionMap]);

    const handleClick = (event) => {
        event.stopPropagation();
        if (!event.point || blocks.length === 0) return;

        const point = event.point;
        let closestBlock = blocks[0];
        let minDist = Infinity;

        // Use spatial hashing for faster lookup in large datasets
        const gridX = Math.floor(point.x);
        const gridY = Math.floor(point.y);
        const gridZ = Math.floor(point.z);

        // Check nearby blocks only
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const key = `${gridX + dx},${gridY + dy},${gridZ + dz}`;
                    const block = positionMap?.get(key);
                    if (block) {
                        const [x, y, z] = block.position;
                        const dist = Math.abs(point.x - x - 0.5) + Math.abs(point.y - y - 0.5) + Math.abs(point.z - z - 0.5);
                        if (dist < minDist) {
                            minDist = dist;
                            closestBlock = block;
                        }
                    }
                }
            }
        }

        onBlockClick(closestBlock.id, event);
    };

    if (!geometry) return null;

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            onClick={handleClick}
            frustumCulled={true}
        >
            <meshBasicMaterial vertexColors side={THREE.FrontSide} />
        </mesh>
    );
}

// ============ MAIN COMPONENT ============

const INVISIBLE_BLOCKS = ['air', 'cave_air', 'void_air', 'structure_void', 'barrier', 'AIR'];


// Semantic Colors for Blueprint Mode
const SEMANTIC_COLORS = {
    // Walls
    'WALL_STONE': '#808080',
    'WALL_WOOD': '#A0522D',
    'WALL_BRICK': '#B22222',
    'WALL_WHITE': '#F0F0F0',
    'WALL_RED': '#D32F2F',
    'WALL_BLUE': '#1976D2',
    'WALL_GREEN': '#388E3C',
    'WALL_YELLOW': '#FBC02D',

    // Roofs
    'ROOF_STONE': '#616161',
    'ROOF_WOOD': '#5D4037',
    'ROOF_RED': '#C62828',
    'ROOF_BLUE': '#1565C0',
    'ROOF_GOLD': '#FFA000',

    // Floors
    'FLOOR_STONE': '#757575',
    'FLOOR_WOOD': '#8D6E63',

    // Structure
    'FRAME_WOOD': '#3E2723',
    'WINDOW': '#90CAF9', // Light blue glass
    'AIR': 'transparent'
};

const SemanticInstancedGroup = ({ color, blocks }) => {
    const meshRef = useRef();

    // Use effect to ensure update happens after mount
    useEffect(() => {
        if (!meshRef.current) return;
        const tempObj = new THREE.Object3D();
        blocks.forEach((block, i) => {
            // Handle both array [x,y,z] and object {x,y,z} formats
            const pos = block.position || [block.x, block.y, block.z];
            const [x, y, z] = Array.isArray(pos) ? pos : [pos.x, pos.y, pos.z];

            tempObj.position.set(x, y, z);
            tempObj.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObj.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [blocks]);

    return (
        <instancedMesh ref={meshRef} args={[null, null, blocks.length]} frustumCulled={true}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
                color={color}
                transparent={color === SEMANTIC_COLORS.WINDOW}
                opacity={color === SEMANTIC_COLORS.WINDOW ? 0.4 : 1.0}
                roughness={0.8}
            />
        </instancedMesh>
    );
};

export default function VoxelWorld() {
    // Get store values
    const blocks = useStore((state) => state.blocks);
    const semanticVoxels = useStore((state) => state.semanticVoxels);
    const selectedBlockIds = useStore((state) => state.selectedBlockIds);
    const selectBlock = useStore((state) => state.selectBlock);
    const pushHistory = useStore((state) => state.pushHistory);
    const updateBlocksPosition = useStore((state) => state.updateBlocksPosition);
    const finalizeBlocksPosition = useStore((state) => state.finalizeBlocksPosition);
    const viewMode = useStore((state) => state.viewMode); // 'mc' | 'blueprint'
    const controlMode = useStore((state) => state.controlMode); // 'orbit' | 'minecraft'

    // Transform Gizmo Logic
    const gizmoRef = useRef();
    const gizmoAnchorRef = useRef();
    const [dragging, setDragging] = useState(false);
    const startDragPos = useRef(new THREE.Vector3());
    const lastEmitPos = useRef(new THREE.Vector3());

    // Calculate selection average center for gizmo positioning
    const selectionCenter = useMemo(() => {
        if (selectedBlockIds.length === 0) return null;
        const selectedBlocks = blocks.filter(b => selectedBlockIds.includes(b.id));
        if (selectedBlocks.length === 0) return null;

        let x = 0, y = 0, z = 0;
        selectedBlocks.forEach(b => {
            x += b.position[0];
            y += b.position[1];
            z += b.position[2];
        });
        return [
            x / selectedBlocks.length + 0.5,
            y / selectedBlocks.length + 0.5,
            z / selectedBlocks.length + 0.5
        ];
    }, [selectedBlockIds, blocks]);

    // Use a state to force re-render when selection changes (to fix the ref delay)
    const [, forceUpdate] = useState({});
    useEffect(() => {
        forceUpdate({});
    }, [selectedBlockIds]);

    // Sync gizmo anchor position only when NOT dragging
    useEffect(() => {
        if (selectionCenter && gizmoAnchorRef.current && !dragging) {
            gizmoAnchorRef.current.position.set(...selectionCenter);
        }
    }, [selectionCenter, dragging]);

    // Handle Transform Controls events
    const handleDragStart = () => {
        // Disable dragging in GAME mode
        if (controlMode === 'minecraft') return;

        if (selectionCenter) {
            pushHistory(); // Save snapshot BEFORE moving
            startDragPos.current.set(...selectionCenter);
            lastEmitPos.current.set(...selectionCenter);
        }
        setDragging(true);
    };

    const handleDragChange = () => {
        if (!gizmoAnchorRef.current || !dragging) return;

        const currentPos = gizmoAnchorRef.current.position;
        const dx = currentPos.x - lastEmitPos.current.x;
        const dy = currentPos.y - lastEmitPos.current.y;
        const dz = currentPos.z - lastEmitPos.current.z;

        // Only update if movement exceeds threshold
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01 || Math.abs(dz) > 0.01) {
            // Throttle: only update at most every 50ms
            const now = Date.now();
            if (!handleDragChange._lastUpdate || now - handleDragChange._lastUpdate > 50) {
                handleDragChange._lastUpdate = now;
                updateBlocksPosition(selectedBlockIds, dx, dy, dz);
                lastEmitPos.current.copy(currentPos);
            }
        }
    };

    const handleDragEnd = () => {
        if (!gizmoAnchorRef.current) {
            setDragging(false);
            return;
        }

        // Final sync: ensure we catch any throttled updates
        const currentPos = gizmoAnchorRef.current.position;
        const dx = currentPos.x - lastEmitPos.current.x;
        const dy = currentPos.y - lastEmitPos.current.y;
        const dz = currentPos.z - lastEmitPos.current.z;

        if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001 || Math.abs(dz) > 0.001) {
            updateBlocksPosition(selectedBlockIds, dx, dy, dz);
        }

        setDragging(false);

        // Finalize position (rounding and saving)
        finalizeBlocksPosition(selectedBlockIds);
    };

    // Drag detection: prevent click after rotation
    const pointerDownPos = useRef({ x: 0, y: 0 });
    const isDraggingClick = useRef(false);
    const lastEvent = useRef(null);
    const DRAG_THRESHOLD = 5;

    const handlePointerDown = (e) => {
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
        isDraggingClick.current = false;
        lastEvent.current = { ctrlKey: e.ctrlKey, shiftKey: e.shiftKey };
    };

    const handlePointerUp = (e) => {
        const dx = e.clientX - pointerDownPos.current.x;
        const dy = e.clientY - pointerDownPos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        isDraggingClick.current = distance > DRAG_THRESHOLD;
        lastEvent.current = { ctrlKey: e.ctrlKey, shiftKey: e.shiftKey };
    };

    const safeSelectBlock = (blockId, eventOrModifiers) => {
        // Disable selection in GAME mode
        if (controlMode === 'minecraft') return;

        if (isDraggingClick.current || dragging) return;
        const modifiers = eventOrModifiers?.ctrlKey !== undefined
            ? { ctrlKey: eventOrModifiers.ctrlKey, shiftKey: eventOrModifiers.shiftKey }
            : lastEvent.current || {};
        selectBlock(blockId, modifiers);
    };

    // ============ OCCLUSION CULLING ============
    // Build position map for O(1) neighbor lookups (used for face culling)
    const { visibleBlocks, positionMap } = useMemo(() => {
        const filtered = blocks.filter(b =>
            b && b.position && Array.isArray(b.position) && b.position.length >= 3 &&
            !INVISIBLE_BLOCKS.includes(b.type) &&
            !INVISIBLE_BLOCKS.includes(b.type?.toUpperCase())
        );

        // Build a position lookup map for O(1) neighbor checks
        const posMap = new Map();
        filtered.forEach(block => {
            const posKey = `${block.position[0]},${block.position[1]},${block.position[2]}`;
            posMap.set(posKey, block);
        });

        // Deduplicate by position (keep last block at each position)
        const uniqueBlocks = Array.from(posMap.values());

        // Check if a block is solid (opaque, not transparent/glass)
        const isSolidBlock = (block) => {
            if (!block) return false;
            const type = block.type?.toLowerCase() || '';
            // Transparent blocks don't occlude neighbors
            if (TRANSPARENT_BLOCKS.includes(type)) return false;
            // Slabs/stairs don't fully occlude
            if (type.includes('_slab') || type.includes('_stairs')) return false;
            // Small decorative blocks don't occlude
            if (type.includes('_button') || type.includes('_pressure_plate')) return false;
            if (type.includes('torch') || type.includes('lantern')) return false;
            if (type.includes('_wall') || type.includes('_fence')) return false;
            if (type.includes('carpet')) return false;
            return true;
        };

        // Check if block at position exists and is solid
        const hasSolidNeighbor = (x, y, z) => {
            const key = `${x},${y},${z}`;
            return isSolidBlock(posMap.get(key));
        };

        // Filter to only blocks with at least one exposed face
        const visible = uniqueBlocks.filter(block => {
            const [x, y, z] = block.position;

            // If this block is not solid itself (transparent/partial), always render it
            if (!isSolidBlock(block)) return true;

            // Check all 6 neighbors - if any neighbor is missing or non-solid, this block is visible
            const neighbors = [
                [x + 1, y, z], // +X
                [x - 1, y, z], // -X
                [x, y + 1, z], // +Y
                [x, y - 1, z], // -Y
                [x, y, z + 1], // +Z
                [x, y, z - 1], // -Z
            ];

            // Block is visible if at least one face is exposed (no solid neighbor)
            return neighbors.some(([nx, ny, nz]) => !hasSolidNeighbor(nx, ny, nz));
        });

        return { visibleBlocks: visible, positionMap: posMap };
    }, [blocks]);

    // Removed Auto-center Logic (centerOffset is gone)

    const isStair = (block) => block.type?.toLowerCase().includes('_stairs');

    const { stairBlocks, regularBlocks } = useMemo(() => {
        const stairs = [];
        const regular = [];
        visibleBlocks.forEach(block => {
            if (isStair(block)) stairs.push(block);
            else regular.push(block);
        });
        return { stairBlocks: stairs, regularBlocks: regular };
    }, [visibleBlocks]);

    const blocksByTexture = useMemo(() => {
        const groups = new Map();
        regularBlocks.forEach(block => {
            const textureKey = ALIASES[block.type] || block.type;
            if (!groups.has(textureKey)) groups.set(textureKey, []);
            groups.get(textureKey).push(block);
        });
        return groups;
    }, [regularBlocks]);

    const selectedBlocks = useMemo(() =>
        visibleBlocks.filter(b => selectedBlockIds.includes(b.id)),
        [visibleBlocks, selectedBlockIds]
    );

    if (viewMode === 'blueprint') {
        const semanticGroups = new Map();
        semanticVoxels.forEach(v => {
            if (v.type === 'AIR') return;
            const color = SEMANTIC_COLORS[v.type] || '#FF00FF';
            if (!semanticGroups.has(color)) semanticGroups.set(color, []);
            semanticGroups.get(color).push(v);
        });

        return (
            <group>
                {Array.from(semanticGroups.entries()).map(([color, groupBlocks]) => (
                    <SemanticInstancedGroup key={color} color={color} blocks={groupBlocks} />
                ))}
            </group>
        );
    }

    // MC MODE RENDER (Regular)
    // Get rotation and flip state for stair based on facing and half
    // Our stair model: high part (back) at -Z, low part (front) at +Z
    // facing = direction you walk UP to (where the high step is)
    // half=bottom: normal stair (ascending), half=top: upside-down stair (descending/ceiling)
    const getStairTransform = (properties) => {
        let rotation = 0;
        let isUpsideDown = false;

        if (properties) {
            // Check facing direction
            if (properties.includes('facing=south')) rotation = 0;
            else if (properties.includes('facing=west')) rotation = -Math.PI / 2;
            else if (properties.includes('facing=north')) rotation = Math.PI;
            else if (properties.includes('facing=east')) rotation = Math.PI / 2;

            // Check if upside-down
            isUpsideDown = properties.includes('half=top');
        }

        return { rotation, isUpsideDown };
    };

    // Check if we should use ultra performance mode (no textures, just vertex colors)
    const useUltraPerformance = visibleBlocks.length > PERFORMANCE_THRESHOLD;

    return (
        <group onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
            {/* Ultra Performance Mode: Single mesh with vertex colors - includes ALL blocks */}
            {useUltraPerformance && (
                <UltraPerformanceRenderer
                    blocks={visibleBlocks}
                    positionMap={positionMap}
                    onBlockClick={safeSelectBlock}
                />
            )}

            {/* Regular Mode: Textured blocks grouped by texture */}
            {!useUltraPerformance && Array.from(blocksByTexture.entries()).map(([textureKey, blocksInGroup]) => (
                <TexturedInstancedBlocks
                    key={textureKey}
                    blocks={blocksInGroup}
                    blockType={blocksInGroup[0]?.type || textureKey}
                    onBlockClick={safeSelectBlock}
                    positionMap={positionMap}
                />
            ))}

            {/* Render stairs - simplified in ultra performance mode */}
            {!useUltraPerformance && stairBlocks.length > 0 && stairBlocks.length < 500 && stairBlocks.map((block) => {
                const { rotation, isUpsideDown } = getStairTransform(block.properties);
                const material = getOrCreateMaterial(block.type);

                // For upside-down stairs, flip the Y positions
                const bottomSlabY = isUpsideDown ? 0.25 : -0.25;
                const topHalfY = isUpsideDown ? -0.25 : 0.25;

                return (
                    <group
                        key={block.id}
                        position={[
                            block.position[0] + 0.5,
                            block.position[1] + 0.5,
                            block.position[2] + 0.5
                        ]}
                        rotation={[0, rotation, 0]}
                        onClick={(e) => {
                            e.stopPropagation();
                            safeSelectBlock(block.id, e);
                        }}
                    >
                        {/* Full-width slab (bottom for normal, top for upside-down) */}
                        <mesh position={[0, bottomSlabY, 0]} material={material}>
                            <boxGeometry args={[1, 0.5, 1]} />
                        </mesh>
                        {/* Back half (the solid/high side) */}
                        <mesh position={[0, topHalfY, 0.25]} material={material}>
                            <boxGeometry args={[1, 0.5, 0.5]} />
                        </mesh>
                    </group>
                );
            })}

            {/* Stairs as simple blocks when there are too many (>500) or in ultra mode */}
            {!useUltraPerformance && stairBlocks.length >= 500 && (
                <TexturedInstancedBlocks
                    blocks={stairBlocks}
                    blockType={stairBlocks[0]?.type || 'stone_stairs'}
                    onBlockClick={safeSelectBlock}
                    positionMap={positionMap}
                />
            )}

            {/* Render selected blocks highlight (multi-select) */}
            {selectedBlocks.map(block => (
                <mesh
                    key={`highlight-${block.id}`}
                    position={[
                        block.position[0] + 0.5,
                        block.position[1] + 0.5,
                        block.position[2] + 0.5
                    ]}
                >
                    <boxGeometry args={[1.02, 1.02, 1.02]} />
                    <meshBasicMaterial color="#fbbf24" wireframe={true} transparent opacity={0.5} />
                </mesh>
            ))}

            {/* 3D Transform Gizmo (Select & Move like Blender/3DSMax) */}
            {controlMode === 'orbit' && selectionCenter && (
                <>
                    <group
                        ref={gizmoAnchorRef}
                        position={[selectionCenter[0], selectionCenter[1], selectionCenter[2]]}
                    />
                    {gizmoAnchorRef.current && (
                        <TransformControls
                            object={gizmoAnchorRef.current}
                            mode="translate"
                            onMouseDown={handleDragStart}
                            onObjectChange={handleDragChange}
                            onMouseUp={handleDragEnd}
                        />
                    )}
                </>
            )}
        </group>
    );
}


