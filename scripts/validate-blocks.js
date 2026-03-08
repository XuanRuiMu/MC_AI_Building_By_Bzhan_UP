/**
 * Block Validation Script
 * Fetches official block lists from misode/mcmeta and validates current mappings
 * 
 * Usage: node scripts/validate-blocks.js
 * 
 * Sources:
 * - https://github.com/misode/mcmeta (Official Minecraft data)
 * - https://minecraft.wiki/w/Java_Edition_data_values
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Version to branch/tag mapping for misode/mcmeta
// Using the registries data from summary branches
const VERSION_BRANCHES = {
    '1.21': '1.21.4-summary',
    '1.20': '1.20.6-summary', 
    '1.19': '1.19.4-summary',
    '1.18': '1.18.2-summary',
    '1.17': '1.17.1-summary',
    '1.16': '1.16.5-summary',
    '1.15': '1.15.2-summary',
    '1.14': '1.14.4-summary',
    '1.13': '1.13.2-summary',
};

// Alternative: Use registries from assets branch
const VERSION_ASSETS = {
    '1.21': 'assets-1.21.4',
    '1.20': 'assets-1.20.6',
    '1.19': 'assets-1.19.4',
    '1.18': 'assets-1.18.2',
    '1.17': 'assets-1.17.1',
    '1.16': 'assets-1.16.5',
    '1.15': 'assets-1.15.2',
    '1.14': 'assets-1.14.4',
    '1.13': 'assets-1.13.2',
};

// Current block mappings from versionConfig.js (copy for validation)
const BLOCK_RENAMES = {
    'short_grass': { '1.20': 'grass' },
    'grass_block': { '1.12': 'grass' },
    'copper_block': { '1.16': null },
    'copper_ore': { '1.16': null },
    'deepslate': { '1.16': null },
    'deepslate_bricks': { '1.16': null },
    'calcite': { '1.16': null },
    'tuff': { '1.16': null },
    'amethyst_block': { '1.16': null },
    'moss_block': { '1.16': null },
    'glow_lichen': { '1.16': null },
    'ancient_debris': { '1.15': null },
    'basalt': { '1.15': null },
    'blackstone': { '1.15': null },
    'crimson_planks': { '1.15': null },
    'warped_planks': { '1.15': null },
    'netherite_block': { '1.15': null },
    'beehive': { '1.14': null },
    'honey_block': { '1.14': null },
    'barrel': { '1.13': null },
    'lantern': { '1.13': null },
    'campfire': { '1.13': null },
    'stonecutter': { '1.13': null },
    'mud': { '1.18': null },
    'mangrove_planks': { '1.18': null },
    'sculk': { '1.18': null },
    'cherry_planks': { '1.19': null },
    'bamboo_planks': { '1.19': null },
    'heavy_core': { '1.20': null },
    'vault': { '1.20': null },
    'trial_spawner': { '1.20': null },
    'crafter': { '1.20': null },
};

const BLOCK_FALLBACKS = {
    'copper_block': 'iron_block',
    'copper_ore': 'iron_ore',
    'deepslate': 'stone',
    'deepslate_bricks': 'stone_bricks',
    'calcite': 'diorite',
    'tuff': 'andesite',
    'amethyst_block': 'purple_stained_glass',
    'moss_block': 'green_wool',
    'glow_lichen': 'vine',
    'ancient_debris': 'netherrack',
    'basalt': 'stone',
    'blackstone': 'cobblestone',
    'crimson_planks': 'nether_brick',
    'warped_planks': 'prismarine',
    'netherite_block': 'iron_block',
    'beehive': 'oak_planks',
    'honey_block': 'yellow_stained_glass',
    'barrel': 'chest',
    'lantern': 'torch',
    'campfire': 'netherrack',
    'stonecutter': 'stone_slab',
    'mud': 'dirt',
    'mangrove_planks': 'oak_planks',
    'sculk': 'black_wool',
    'cherry_planks': 'birch_planks',
    'bamboo_planks': 'oak_planks',
    'heavy_core': 'iron_block',
    'vault': 'iron_block',
    'trial_spawner': 'spawner',
    'crafter': 'crafting_table',
};

// Fetch JSON from URL
function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'MC-AI-Builder-Validator' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchJSON(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Fetch block list for a version
async function fetchBlockList(version) {
    // Try summary branch first, then assets branch
    const summaryBranch = VERSION_BRANCHES[version];
    const assetsBranch = VERSION_ASSETS[version];
    
    // Try multiple URL patterns
    const urls = [
        // Summary branch - registries format
        `https://raw.githubusercontent.com/misode/mcmeta/${summaryBranch}/registries/block/data.json`,
        // Summary branch - blocks format
        `https://raw.githubusercontent.com/misode/mcmeta/${summaryBranch}/blocks/data.json`,
        // Assets branch
        `https://raw.githubusercontent.com/misode/mcmeta/${assetsBranch}/registries/block/data.json`,
        // Direct version tag
        `https://raw.githubusercontent.com/misode/mcmeta/refs/heads/${summaryBranch}/registries/block/data.json`,
    ];
    
    console.log(`📥 Fetching ${version} blocks...`);
    
    for (const url of urls) {
        try {
            const data = await fetchJSON(url);
            // data could be array of strings or object with values
            let blocks;
            if (Array.isArray(data)) {
                blocks = data.map(b => typeof b === 'string' ? b.replace('minecraft:', '') : b);
            } else if (data.values) {
                blocks = data.values.map(b => b.replace('minecraft:', ''));
            } else {
                blocks = Object.keys(data).map(b => b.replace('minecraft:', ''));
            }
            console.log(`   ✅ Found ${blocks.length} blocks for ${version}`);
            return blocks;
        } catch (e) {
            // Try next URL
            continue;
        }
    }
    
    console.log(`   ❌ Failed to fetch ${version} from all sources`);
    return null;
}

// Compare two version block lists
function compareVersions(newerVersion, newerBlocks, olderVersion, olderBlocks) {
    const added = newerBlocks.filter(b => !olderBlocks.includes(b));
    const removed = olderBlocks.filter(b => !newerBlocks.includes(b));
    
    return { added, removed };
}

// Validate current mappings
function validateMappings(versionBlocks) {
    const issues = [];
    const suggestions = [];
    
    // Check BLOCK_RENAMES
    for (const [newBlock, renames] of Object.entries(BLOCK_RENAMES)) {
        for (const [maxVer, oldName] of Object.entries(renames)) {
            if (oldName === null) {
                // Block doesn't exist in older version - verify it exists in newer
                const newerVersions = Object.keys(versionBlocks).filter(v => 
                    parseFloat(v) > parseFloat(maxVer)
                );
                
                for (const ver of newerVersions) {
                    if (versionBlocks[ver] && !versionBlocks[ver].includes(newBlock)) {
                        issues.push(`❌ ${newBlock} marked as new in ${maxVer}+ but not found in ${ver}`);
                    }
                }
                
                // Check fallback exists
                if (!BLOCK_FALLBACKS[newBlock]) {
                    issues.push(`⚠️  ${newBlock} has no fallback defined`);
                }
            }
        }
    }
    
    // Find blocks that were added in each version but not in our mappings
    const versions = Object.keys(versionBlocks).sort((a, b) => parseFloat(a) - parseFloat(b));
    
    for (let i = 1; i < versions.length; i++) {
        const olderVer = versions[i - 1];
        const newerVer = versions[i];
        
        if (!versionBlocks[olderVer] || !versionBlocks[newerVer]) continue;
        
        const { added } = compareVersions(newerVer, versionBlocks[newerVer], olderVer, versionBlocks[olderVer]);
        
        // Check if added blocks have mappings
        for (const block of added) {
            const hasMapping = BLOCK_RENAMES[block] && BLOCK_RENAMES[block][olderVer] !== undefined;
            if (!hasMapping && !block.includes('wall_') && !block.includes('potted_')) {
                // Skip wall variants and potted plants for cleaner output
                suggestions.push(`📝 ${block} added in ${newerVer}, consider adding fallback for ${olderVer}`);
            }
        }
    }
    
    return { issues, suggestions };
}

// Main
async function main() {
    console.log('🔍 MC AI Builder - Block Validation Script\n');
    console.log('=' .repeat(50));
    
    const versionBlocks = {};
    
    // Fetch all version block lists
    for (const version of Object.keys(VERSION_BRANCHES)) {
        const blocks = await fetchBlockList(version);
        if (blocks) {
            versionBlocks[version] = blocks;
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Block Count Summary:\n');
    
    for (const [ver, blocks] of Object.entries(versionBlocks).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))) {
        console.log(`   ${ver}: ${blocks.length} blocks`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🔄 Version Differences:\n');
    
    const versions = Object.keys(versionBlocks).sort((a, b) => parseFloat(a) - parseFloat(b));
    for (let i = 1; i < versions.length; i++) {
        const olderVer = versions[i - 1];
        const newerVer = versions[i];
        
        if (!versionBlocks[olderVer] || !versionBlocks[newerVer]) continue;
        
        const { added, removed } = compareVersions(newerVer, versionBlocks[newerVer], olderVer, versionBlocks[olderVer]);
        
        console.log(`\n${olderVer} → ${newerVer}:`);
        console.log(`   + ${added.length} blocks added`);
        if (removed.length > 0) {
            console.log(`   - ${removed.length} blocks removed/renamed`);
        }
        
        // Show first 10 added blocks
        if (added.length > 0) {
            const sample = added.slice(0, 10);
            console.log(`   Sample: ${sample.join(', ')}${added.length > 10 ? '...' : ''}`);
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Validating Current Mappings:\n');
    
    const { issues, suggestions } = validateMappings(versionBlocks);
    
    if (issues.length === 0) {
        console.log('   ✅ No critical issues found!');
    } else {
        console.log('   Issues:');
        issues.forEach(i => console.log(`   ${i}`));
    }
    
    if (suggestions.length > 0) {
        console.log(`\n   Suggestions (${suggestions.length} total, showing first 20):`);
        suggestions.slice(0, 20).forEach(s => console.log(`   ${s}`));
        if (suggestions.length > 20) {
            console.log(`   ... and ${suggestions.length - 20} more`);
        }
    }
    
    // Save results to file
    const outputPath = path.join(__dirname, 'block-validation-report.json');
    const report = {
        timestamp: new Date().toISOString(),
        versionBlockCounts: Object.fromEntries(
            Object.entries(versionBlocks).map(([v, b]) => [v, b.length])
        ),
        issues,
        suggestions: suggestions.slice(0, 50),
        fullSuggestionCount: suggestions.length
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${outputPath}`);
}

main().catch(console.error);
