/**
 * Update versionConfig.js with official block mappings
 * This script reads the generated mappings and updates the source file
 */

const fs = require('fs');
const path = require('path');

// Read the generated mappings
const mappingsPath = path.join(__dirname, 'final-block-mappings.json');
const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));

// Fix fallbacks that reference non-existent blocks
const fixedFallbacks = {};
for (const [block, fallback] of Object.entries(mappings.blockFallbacks)) {
    let fixed = fallback;
    
    // Fix terracotta slabs/stairs (don't exist)
    if (fixed.includes('terracotta_slab')) fixed = 'brick_slab';
    if (fixed.includes('terracotta_stairs')) fixed = 'brick_stairs';
    if (fixed.includes('terracotta_door')) fixed = 'iron_door';
    
    // Fix incomplete wood type references
    if (fixed === 'dark_oak' || fixed === 'oak' || fixed === 'jungle' || fixed === 'birch') {
        if (block.includes('fungus') || block.includes('roots')) fixed = 'dead_bush';
        else if (block.includes('nylium')) fixed = 'netherrack';
        else if (block.includes('stem') || block.includes('log')) fixed = `${fixed}_log`;
        else if (block.includes('hyphae') || block.includes('wood')) fixed = `${fixed}_wood`;
        else fixed = `${fixed}_planks`;
    }
    
    // Fix cobblestone button/pressure_plate (don't exist)
    if (fixed === 'cobblestone_button') fixed = 'stone_button';
    if (fixed === 'cobblestone_pressure_plate') fixed = 'stone_pressure_plate';
    if (fixed === 'cobblestone_slab') fixed = 'stone_slab';
    
    fixedFallbacks[block] = fixed;
}

// Generate the output
console.log('// ============================================');
console.log('// BLOCK_RENAMES - Auto-generated from mcmeta');
console.log('// Source: https://github.com/misode/mcmeta');
console.log(`// Generated: ${new Date().toISOString()}`);
console.log('// ============================================');
console.log('export const BLOCK_RENAMES = {');

// Group by version
const byVersion = {};
for (const [block, vers] of Object.entries(mappings.blockRenames)) {
    for (const [ver, val] of Object.entries(vers)) {
        if (!byVersion[ver]) byVersion[ver] = [];
        byVersion[ver].push({ block, val });
    }
}

// Name changes first
const nameChanges = ['short_grass', 'dirt_path'];
console.log('    // === Name changes ===');
for (const block of nameChanges) {
    if (mappings.blockRenames[block]) {
        const vers = mappings.blockRenames[block];
        const verStr = Object.entries(vers).map(([v, n]) => `'${v}': '${n}'`).join(', ');
        console.log(`    '${block}': { ${verStr} },`);
    }
}

// Sort versions
const sortedVers = Object.keys(byVersion).sort((a, b) => {
    const [aMaj, aMin] = a.split('.').map(Number);
    const [bMaj, bMin] = b.split('.').map(Number);
    return aMaj - bMaj || aMin - bMin;
});

// Version labels
const versionLabels = {
    '1.14': '1.15 (Buzzy Bees)',
    '1.15': '1.16 (Nether Update)',
    '1.16': '1.17 (Caves & Cliffs P1)',
    '1.18': '1.19 (Wild Update)',
    '1.19': '1.20 (Trails & Tales)',
    '1.20': '1.21 (Tricky Trials)'
};

for (const ver of sortedVers) {
    const blocks = byVersion[ver].filter(b => !nameChanges.includes(b.block));
    if (blocks.length === 0) continue;
    
    const label = versionLabels[ver] || `${ver}+`;
    console.log(`\n    // === ${label} additions (null in ${ver}) ===`);
    
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

const sortedFallbacks = Object.entries(fixedFallbacks).sort((a, b) => a[0].localeCompare(b[0]));
for (const [block, fallback] of sortedFallbacks) {
    console.log(`    '${block}': '${fallback}',`);
}

console.log('};');
