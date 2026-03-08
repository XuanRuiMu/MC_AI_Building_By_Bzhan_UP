/**
 * Generate Final Block Mappings from Official mcmeta Data
 * 
 * This script reads the official-blocks-data.json and generates:
 * 1. BLOCK_RENAMES - blocks that don't exist in older versions (null) or were renamed
 * 2. BLOCK_FALLBACKS - color/material similar blocks for fallback
 */

const fs = require('fs');
const path = require('path');

// Read official data
const dataPath = path.join(__dirname, 'official-blocks-data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Block renames (name changes between versions)
// Format: { newName: { maxVersion: 'oldName' } }
const BLOCK_NAME_CHANGES = {
    // 1.20.3 renamed grass to short_grass
    'short_grass': { '1.20': 'grass' },
    // 1.17 renamed grass_path to dirt_path
    'dirt_path': { '1.16': 'grass_path' },
};

// Fallback mappings based on color/material similarity
// These are used when a block doesn't exist in the target version
const FALLBACK_RULES = {
    // Wood types fallback to similar wood
    'crimson': 'dark_oak',
    'warped': 'oak',
    'mangrove': 'jungle',
    'cherry': 'birch',
    'bamboo': 'oak',
    'pale_oak': 'birch',
    
    // Stone types
    'blackstone': 'cobblestone',
    'polished_blackstone': 'stone_bricks',
    'deepslate': 'stone',
    'cobbled_deepslate': 'cobblestone',
    'polished_deepslate': 'stone',
    'tuff': 'andesite',
    'polished_tuff': 'polished_andesite',
    
    // Copper oxidation states
    'copper_block': 'orange_terracotta',
    'exposed_copper': 'light_gray_terracotta',
    'weathered_copper': 'cyan_terracotta',
    'oxidized_copper': 'cyan_terracotta',
    'cut_copper': 'orange_terracotta',
    
    // Mud
    'mud': 'brown_terracotta',
    'packed_mud': 'brown_terracotta',
    'mud_bricks': 'bricks',
    
    // Sculk
    'sculk': 'black_wool',
    
    // Amethyst
    'amethyst': 'purple_wool',
    
    // Froglight
    'froglight': 'glowstone',
    
    // Resin (1.21.2+)
    'resin': 'orange_terracotta',
};

// Generate fallback for a block based on rules
function getFallback(blockName) {
    // Direct mappings
    const directMappings = {
        // 1.14 blocks
        'barrel': 'chest', 'bell': 'gold_block', 'blast_furnace': 'furnace',
        'campfire': 'netherrack', 'cartography_table': 'crafting_table',
        'composter': 'oak_planks', 'fletching_table': 'crafting_table',
        'grindstone': 'stone', 'jigsaw': 'stone', 'lantern': 'torch',
        'lectern': 'bookshelf', 'loom': 'crafting_table', 'scaffolding': 'oak_fence',
        'smithing_table': 'crafting_table', 'smoker': 'furnace',
        'stonecutter': 'stone_slab', 'sweet_berry_bush': 'oak_leaves',
        
        // 1.15 blocks
        'bee_nest': 'yellow_wool', 'beehive': 'oak_planks',
        'honey_block': 'yellow_stained_glass', 'honeycomb_block': 'yellow_wool',
        
        // 1.16 blocks
        'ancient_debris': 'netherrack', 'basalt': 'gray_wool', 'polished_basalt': 'stone',
        'chain': 'iron_bars', 'shroomlight': 'glowstone', 'crying_obsidian': 'obsidian',
        'respawn_anchor': 'obsidian', 'lodestone': 'iron_block', 'netherite_block': 'iron_block',
        'nether_gold_ore': 'gold_ore', 'quartz_bricks': 'quartz_block',
        'soul_campfire': 'netherrack', 'soul_fire': 'fire', 'soul_lantern': 'torch',
        'soul_torch': 'torch', 'soul_soil': 'soul_sand', 'target': 'hay_block',
        'gilded_blackstone': 'gold_ore', 'chiseled_nether_bricks': 'nether_bricks',
        'cracked_nether_bricks': 'nether_bricks', 'warped_wart_block': 'nether_wart_block',
        
        // 1.17 blocks
        'calcite': 'diorite', 'candle': 'torch', 'glow_lichen': 'vine',
        'hanging_roots': 'vine', 'lightning_rod': 'iron_bars',
        'moss_block': 'green_wool', 'moss_carpet': 'green_carpet',
        'powder_snow': 'snow_block', 'rooted_dirt': 'dirt',
        'smooth_basalt': 'stone', 'spore_blossom': 'pink_wool',
        'tinted_glass': 'glass', 'azalea': 'oak_leaves',
        'flowering_azalea': 'oak_leaves', 'azalea_leaves': 'oak_leaves',
        'flowering_azalea_leaves': 'oak_leaves', 'big_dripleaf': 'lily_pad',
        'big_dripleaf_stem': 'oak_fence', 'small_dripleaf': 'lily_pad',
        'cave_vines': 'vine', 'cave_vines_plant': 'vine',
        'dripstone_block': 'stone', 'pointed_dripstone': 'stone',
        'raw_copper_block': 'orange_terracotta', 'raw_gold_block': 'gold_block',
        'raw_iron_block': 'iron_block', 'infested_deepslate': 'infested_stone',
        'light': 'air', 'lava_cauldron': 'cauldron', 'water_cauldron': 'cauldron',
        'powder_snow_cauldron': 'cauldron', 'sculk_sensor': 'black_wool',
        'deepslate_coal_ore': 'coal_ore', 'deepslate_iron_ore': 'iron_ore',
        'deepslate_copper_ore': 'iron_ore', 'deepslate_gold_ore': 'gold_ore',
        'deepslate_redstone_ore': 'redstone_ore', 'deepslate_emerald_ore': 'emerald_ore',
        'deepslate_lapis_ore': 'lapis_ore', 'deepslate_diamond_ore': 'diamond_ore',
        'cracked_deepslate_bricks': 'cracked_stone_bricks',
        'cracked_deepslate_tiles': 'cracked_stone_bricks',
        'twisting_vines': 'vine', 'twisting_vines_plant': 'vine',
        'weeping_vines': 'vine', 'weeping_vines_plant': 'vine',
        'nether_sprouts': 'dead_bush',
        
        // 1.19 blocks
        'reinforced_deepslate': 'obsidian', 'frogspawn': 'lily_pad',
        'ochre_froglight': 'glowstone', 'pearlescent_froglight': 'glowstone',
        'verdant_froglight': 'glowstone', 'muddy_mangrove_roots': 'dirt',
        'mangrove_roots': 'oak_fence', 'mangrove_propagule': 'oak_sapling',
        'sculk_catalyst': 'black_wool', 'sculk_shrieker': 'black_wool',
        'sculk_vein': 'black_carpet',
        
        // 1.20 blocks
        'chiseled_bookshelf': 'bookshelf', 'pink_petals': 'pink_carpet',
        'decorated_pot': 'flower_pot', 'suspicious_sand': 'sand',
        'suspicious_gravel': 'gravel', 'torchflower': 'dandelion',
        'torchflower_crop': 'wheat', 'pitcher_plant': 'fern',
        'pitcher_crop': 'wheat', 'sniffer_egg': 'turtle_egg',
        'calibrated_sculk_sensor': 'black_wool',
        'piglin_head': 'player_head', 'piglin_wall_head': 'player_wall_head',
        
        // 1.21 blocks
        'crafter': 'crafting_table', 'trial_spawner': 'spawner',
        'vault': 'iron_block', 'heavy_core': 'iron_block',
        
        // 1.21.2+ blocks
        'pale_moss_block': 'white_wool', 'pale_moss_carpet': 'white_carpet',
        'pale_hanging_moss': 'vine', 'creaking_heart': 'dark_oak_log',
        'open_eyeblossom': 'dandelion', 'closed_eyeblossom': 'dandelion',
        'resin_clump': 'orange_wool',
    };
    
    if (directMappings[blockName]) {
        return directMappings[blockName];
    }
    
    // Pattern-based fallbacks
    for (const [pattern, replacement] of Object.entries(FALLBACK_RULES)) {
        if (blockName.includes(pattern)) {
            // Try to construct a similar block name
            const suffix = blockName.replace(pattern, '').replace(/^_/, '').replace(/_$/, '');
            
            // Handle wood variants
            if (['planks', 'slab', 'stairs', 'fence', 'fence_gate', 'door', 'trapdoor', 
                 'button', 'pressure_plate', 'sign', 'log', 'wood', 'leaves', 'sapling'].some(s => blockName.includes(s))) {
                const woodType = replacement;
                if (blockName.includes('planks')) return `${woodType}_planks`;
                if (blockName.includes('slab')) return `${woodType}_slab`;
                if (blockName.includes('stairs')) return `${woodType}_stairs`;
                if (blockName.includes('fence_gate')) return `${woodType}_fence_gate`;
                if (blockName.includes('fence')) return `${woodType}_fence`;
                if (blockName.includes('door')) return `${woodType}_door`;
                if (blockName.includes('trapdoor')) return `${woodType}_trapdoor`;
                if (blockName.includes('button')) return `${woodType}_button`;
                if (blockName.includes('pressure_plate')) return `${woodType}_pressure_plate`;
                if (blockName.includes('sign')) return `${woodType}_sign`;
                if (blockName.includes('log') || blockName.includes('stem')) return `${woodType}_log`;
                if (blockName.includes('wood') || blockName.includes('hyphae')) return `${woodType}_wood`;
                if (blockName.includes('leaves')) return `${woodType}_leaves`;
                if (blockName.includes('sapling')) return `${woodType}_sapling`;
            }
            
            // Handle stone variants
            if (['slab', 'stairs', 'wall', 'bricks', 'brick_slab', 'brick_stairs', 'brick_wall'].some(s => blockName.includes(s))) {
                if (blockName.includes('brick_wall')) return 'stone_brick_wall';
                if (blockName.includes('brick_stairs')) return 'stone_brick_stairs';
                if (blockName.includes('brick_slab')) return 'stone_brick_slab';
                if (blockName.includes('bricks')) return 'stone_bricks';
                if (blockName.includes('wall')) return 'cobblestone_wall';
                if (blockName.includes('stairs')) return 'stone_stairs';
                if (blockName.includes('slab')) return 'stone_slab';
            }
            
            // Handle copper variants
            if (blockName.includes('copper')) {
                if (blockName.includes('door')) return 'iron_door';
                if (blockName.includes('trapdoor')) return 'iron_trapdoor';
                if (blockName.includes('grate')) return 'iron_bars';
                if (blockName.includes('bulb')) return 'redstone_lamp';
                if (blockName.includes('chiseled')) return 'chiseled_stone_bricks';
                if (blockName.includes('slab')) return 'brick_slab';
                if (blockName.includes('stairs')) return 'brick_stairs';
                if (blockName.includes('exposed')) return 'light_gray_terracotta';
                if (blockName.includes('weathered') || blockName.includes('oxidized')) return 'cyan_terracotta';
                return 'orange_terracotta';
            }
            
            // Handle mud variants
            if (blockName.includes('mud')) {
                if (blockName.includes('slab')) return 'brick_slab';
                if (blockName.includes('stairs')) return 'brick_stairs';
                if (blockName.includes('wall')) return 'brick_wall';
                if (blockName.includes('bricks')) return 'bricks';
                return 'brown_terracotta';
            }
            
            // Handle deepslate ore variants
            if (blockName.includes('deepslate') && blockName.includes('ore')) {
                const oreType = blockName.replace('deepslate_', '');
                return oreType; // e.g., deepslate_iron_ore -> iron_ore
            }
            
            // Handle cut copper slabs/stairs (no terracotta slabs exist)
            if (blockName.includes('cut_copper')) {
                if (blockName.includes('slab')) return 'brick_slab';
                if (blockName.includes('stairs')) return 'brick_stairs';
                return 'orange_terracotta';
            }
            
            return replacement;
        }
    }
    
    // Candle fallbacks
    if (blockName.includes('candle')) {
        return 'torch';
    }
    
    // Hanging sign fallbacks
    if (blockName.includes('hanging_sign')) {
        const wood = blockName.replace('_hanging_sign', '').replace('_wall', '');
        return `${wood}_sign`.replace('crimson', 'dark_oak').replace('warped', 'oak')
            .replace('mangrove', 'jungle').replace('cherry', 'birch').replace('bamboo', 'oak')
            .replace('pale_oak', 'birch');
    }
    
    // Stripped wood fallbacks
    if (blockName.startsWith('stripped_')) {
        const base = blockName.replace('stripped_', '');
        if (base.includes('crimson')) return 'stripped_dark_oak_log';
        if (base.includes('warped')) return 'stripped_oak_log';
        if (base.includes('mangrove')) return 'stripped_jungle_log';
        if (base.includes('cherry')) return 'stripped_birch_log';
        if (base.includes('bamboo')) return 'stripped_oak_log';
        if (base.includes('pale_oak')) return 'stripped_birch_log';
    }
    
    // Potted plant fallbacks
    if (blockName.startsWith('potted_')) {
        return 'flower_pot';
    }
    
    // Default fallback
    return 'stone';
}

// Main function
function main() {
    console.log('📊 Generating final block mappings from official data...\n');
    
    const versions = Object.keys(data.versions).sort((a, b) => {
        const [aMaj, aMin] = a.split('.').map(Number);
        const [bMaj, bMin] = b.split('.').map(Number);
        return aMaj - bMaj || aMin - bMin;
    });
    
    console.log(`Versions: ${versions.join(', ')}\n`);
    
    // Build BLOCK_RENAMES
    const blockRenames = { ...BLOCK_NAME_CHANGES };
    
    // Add blocks that don't exist in older versions
    for (let i = 1; i < versions.length; i++) {
        const ver = versions[i];
        const prevVer = versions[i - 1];
        const currentBlocks = new Set(data.versions[ver]);
        const prevBlocks = new Set(data.versions[prevVer]);
        
        // Find new blocks
        for (const block of currentBlocks) {
            if (!prevBlocks.has(block)) {
                // Skip if it's a rename (handled separately)
                if (BLOCK_NAME_CHANGES[block]) continue;
                
                // Mark as null (doesn't exist) in previous version
                if (!blockRenames[block]) {
                    blockRenames[block] = {};
                }
                blockRenames[block][prevVer] = null;
            }
        }
    }
    
    // Build BLOCK_FALLBACKS
    const blockFallbacks = {};
    for (const block of Object.keys(blockRenames)) {
        const fallback = getFallback(block);
        if (fallback && fallback !== 'stone') {
            blockFallbacks[block] = fallback;
        } else if (fallback === 'stone') {
            // Only add stone fallback if we don't have a better one
            blockFallbacks[block] = 'stone';
        }
    }
    
    // Output BLOCK_RENAMES
    console.log('// ============================================');
    console.log('// BLOCK_RENAMES - Auto-generated from mcmeta');
    console.log('// Source: https://github.com/misode/mcmeta');
    console.log(`// Generated: ${new Date().toISOString()}`);
    console.log('// ============================================');
    console.log('export const BLOCK_RENAMES = {');
    
    // Group by version for readability
    const byVersion = {};
    for (const [block, vers] of Object.entries(blockRenames)) {
        for (const [ver, val] of Object.entries(vers)) {
            if (!byVersion[ver]) byVersion[ver] = [];
            byVersion[ver].push({ block, val });
        }
    }
    
    // Sort versions
    const sortedVers = Object.keys(byVersion).sort((a, b) => {
        const [aMaj, aMin] = a.split('.').map(Number);
        const [bMaj, bMin] = b.split('.').map(Number);
        return aMaj - bMaj || aMin - bMin;
    });
    
    // Output name changes first
    console.log('    // === Name changes ===');
    for (const [block, vers] of Object.entries(BLOCK_NAME_CHANGES)) {
        const verStr = Object.entries(vers).map(([v, n]) => `'${v}': '${n}'`).join(', ');
        console.log(`    '${block}': { ${verStr} },`);
    }
    
    // Output by version
    for (const ver of sortedVers) {
        const blocks = byVersion[ver].filter(b => !BLOCK_NAME_CHANGES[b.block]);
        if (blocks.length === 0) continue;
        
        const nextVer = versions[versions.indexOf(ver) + 1] || '1.21+';
        console.log(`\n    // === ${nextVer} additions (null in ${ver}) ===`);
        
        blocks.sort((a, b) => a.block.localeCompare(b.block));
        for (const { block, val } of blocks) {
            const valStr = val === null ? 'null' : `'${val}'`;
            console.log(`    '${block}': { '${ver}': ${valStr} },`);
        }
    }
    
    console.log('};');
    
    // Output BLOCK_FALLBACKS
    console.log('\n// ============================================');
    console.log('// BLOCK_FALLBACKS - Color/material similar blocks');
    console.log('// ============================================');
    console.log('export const BLOCK_FALLBACKS = {');
    
    const sortedFallbacks = Object.entries(blockFallbacks).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [block, fallback] of sortedFallbacks) {
        console.log(`    '${block}': '${fallback}',`);
    }
    
    console.log('};');
    
    // Save to file
    const output = {
        generated: new Date().toISOString(),
        source: 'https://github.com/misode/mcmeta',
        blockRenames,
        blockFallbacks
    };
    
    const outputPath = path.join(__dirname, 'final-block-mappings.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n✅ Saved to ${outputPath}`);
    
    // Stats
    console.log(`\n📊 Statistics:`);
    console.log(`   - Total blocks in BLOCK_RENAMES: ${Object.keys(blockRenames).length}`);
    console.log(`   - Total blocks in BLOCK_FALLBACKS: ${Object.keys(blockFallbacks).length}`);
}

main();
