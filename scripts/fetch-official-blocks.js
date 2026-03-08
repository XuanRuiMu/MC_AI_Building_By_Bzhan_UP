/**
 * Fetch Official Block Data from mcmeta
 * Downloads block lists for each Minecraft version from the official mcmeta repository
 * 
 * Source: https://github.com/misode/mcmeta
 * This repository contains official Minecraft data extracted from the game files
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Minecraft versions we support (1.13+)
// mcmeta uses tags like "1.21-registries" for the registries branch
// Available versions: https://github.com/misode/mcmeta (starting from 1.14)
const VERSIONS = [
    { id: '1.14', mcmeta: '1.14' },
    { id: '1.15', mcmeta: '1.15' },
    { id: '1.16', mcmeta: '1.16' },
    { id: '1.17', mcmeta: '1.17' },
    { id: '1.18', mcmeta: '1.18' },
    { id: '1.19', mcmeta: '1.19' },
    { id: '1.20', mcmeta: '1.20' },
    { id: '1.21', mcmeta: '1.21' },
];

// Fetch JSON from URL
function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'mc-ai-builder' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchJSON(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                return;
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

// Fetch block list for a specific version
async function fetchBlocksForVersion(version) {
    // mcmeta uses tags like "1.21-registries" for the registries branch
    // URL format: https://raw.githubusercontent.com/misode/mcmeta/<version>-registries/block/data.json
    const url = `https://raw.githubusercontent.com/misode/mcmeta/${version}-registries/block/data.json`;
    console.log(`  Fetching ${version}...`);
    
    try {
        const data = await fetchJSON(url);
        // data is an array of block IDs like ["minecraft:stone", "minecraft:granite", ...]
        return data.map(b => b.replace('minecraft:', ''));
    } catch (e) {
        console.log(`  Warning: Could not fetch ${version}: ${e.message}`);
        return null;
    }
}

// Main function
async function main() {
    console.log('🔍 Fetching official block data from mcmeta...\n');
    
    const versionBlocks = {};
    
    // Fetch blocks for each version
    for (const ver of VERSIONS) {
        const blocks = await fetchBlocksForVersion(ver.mcmeta);
        if (blocks) {
            versionBlocks[ver.id] = new Set(blocks);
            console.log(`  ✅ ${ver.id}: ${blocks.length} blocks`);
        }
    }
    
    console.log('\n📊 Analyzing version differences...\n');
    
    // Find blocks added in each version
    const addedInVersion = {};
    const sortedVersions = Object.keys(versionBlocks).sort((a, b) => {
        const [aMaj, aMin] = a.split('.').map(Number);
        const [bMaj, bMin] = b.split('.').map(Number);
        return aMaj - bMaj || aMin - bMin;
    });
    
    for (let i = 0; i < sortedVersions.length; i++) {
        const ver = sortedVersions[i];
        const currentBlocks = versionBlocks[ver];
        
        if (i === 0) {
            // First version (1.13) - all blocks are "base" blocks
            addedInVersion[ver] = [];
        } else {
            const prevVer = sortedVersions[i - 1];
            const prevBlocks = versionBlocks[prevVer];
            
            // Find blocks in current that weren't in previous
            const newBlocks = [...currentBlocks].filter(b => !prevBlocks.has(b));
            addedInVersion[ver] = newBlocks;
            
            console.log(`${ver}: +${newBlocks.length} new blocks`);
            if (newBlocks.length > 0 && newBlocks.length <= 20) {
                console.log(`  ${newBlocks.join(', ')}`);
            }
        }
    }
    
    // Save raw data
    const outputData = {
        generated: new Date().toISOString(),
        source: 'https://github.com/misode/mcmeta',
        versions: {},
        addedInVersion: {}
    };
    
    for (const ver of sortedVersions) {
        outputData.versions[ver] = [...versionBlocks[ver]].sort();
        outputData.addedInVersion[ver] = addedInVersion[ver].sort();
    }
    
    const outputPath = path.join(__dirname, 'official-blocks-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`\n✅ Saved to ${outputPath}`);
    
    // Generate BLOCK_RENAMES
    console.log('\n📝 Generating BLOCK_RENAMES...\n');
    
    const blockRenames = {};
    for (let i = 1; i < sortedVersions.length; i++) {
        const ver = sortedVersions[i];
        const prevVer = sortedVersions[i - 1];
        const newBlocks = addedInVersion[ver];
        
        for (const block of newBlocks) {
            // Block doesn't exist in prevVer, so mark it as null
            blockRenames[block] = { [prevVer]: null };
        }
    }
    
    // Output BLOCK_RENAMES
    console.log('// BLOCK_RENAMES - Auto-generated from mcmeta');
    console.log('export const BLOCK_RENAMES = {');
    
    const sortedBlocks = Object.keys(blockRenames).sort();
    for (const block of sortedBlocks) {
        const vers = blockRenames[block];
        const verStr = Object.entries(vers).map(([v, n]) => `'${v}': ${n === null ? 'null' : `'${n}'`}`).join(', ');
        console.log(`    '${block}': { ${verStr} },`);
    }
    console.log('};');
    
    // Save BLOCK_RENAMES to file
    const renamesPath = path.join(__dirname, 'official-block-renames.json');
    fs.writeFileSync(renamesPath, JSON.stringify(blockRenames, null, 2));
    console.log(`\n✅ Saved BLOCK_RENAMES to ${renamesPath}`);
}

main().catch(console.error);
