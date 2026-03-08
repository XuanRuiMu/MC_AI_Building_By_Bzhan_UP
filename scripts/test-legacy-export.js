/**
 * Test script for legacy version export (1.8-1.12)
 * Verifies that blocks with properties are correctly exported with metadata
 */

import { generateOptimizedCommands } from '../src/utils/exporter.js';

console.log('=== Testing Legacy Export (1.12) ===\n');

// Test blocks with various properties
const testBlocks = [
    // Stairs with different orientations
    { type: 'oak_stairs', position: [0, 0, 0], properties: 'facing=north,half=bottom' },
    { type: 'oak_stairs', position: [1, 0, 0], properties: 'facing=south,half=top' },
    { type: 'stone_brick_stairs', position: [2, 0, 0], properties: 'facing=east,half=bottom' },
    
    // Logs with different axes
    { type: 'oak_log', position: [0, 1, 0], properties: 'axis=y' },
    { type: 'oak_log', position: [1, 1, 0], properties: 'axis=x' },
    { type: 'oak_log', position: [2, 1, 0], properties: 'axis=z' },
    
    // Slabs
    { type: 'stone_slab', position: [0, 2, 0], properties: 'type=bottom' },
    { type: 'stone_slab', position: [1, 2, 0], properties: 'type=top' },
    
    // Trapdoors
    { type: 'oak_trapdoor', position: [0, 3, 0], properties: 'facing=north,half=bottom,open=false' },
    { type: 'oak_trapdoor', position: [1, 3, 0], properties: 'facing=south,half=top,open=true' },
    
    // Fence gates
    { type: 'oak_fence_gate', position: [0, 4, 0], properties: 'facing=south,open=false' },
    { type: 'oak_fence_gate', position: [1, 4, 0], properties: 'facing=west,open=true' },
    
    // Chests
    { type: 'chest', position: [0, 5, 0], properties: 'facing=north' },
    { type: 'chest', position: [1, 5, 0], properties: 'facing=east' },
    
    // Rails
    { type: 'rail', position: [0, 6, 0], properties: 'shape=north_south' },
    { type: 'powered_rail', position: [1, 6, 0], properties: 'shape=east_west,powered=true' },
    
    // Simple blocks (no properties)
    { type: 'stone', position: [0, 7, 0] },
    { type: 'oak_planks', position: [1, 7, 0] },
    { type: 'white_wool', position: [2, 7, 0] },
];

console.log('Testing 1.12 export (numeric IDs with metadata):');
console.log('------------------------------------------------');
const commands1_12 = generateOptimizedCommands(testBlocks, '1.12');
commands1_12.forEach(cmd => console.log(cmd));

console.log('\n\nTesting 1.21 export (modern format):');
console.log('------------------------------------');
const commands1_21 = generateOptimizedCommands(testBlocks, '1.21');
commands1_21.forEach(cmd => console.log(cmd));

console.log('\n\n=== Comparison ===');
console.log(`1.12 commands: ${commands1_12.length}`);
console.log(`1.21 commands: ${commands1_21.length}`);

// Verify that 1.12 commands use numeric IDs
const hasNumericIds = commands1_12.every(cmd => {
    const blockPart = cmd.split(' ').pop();
    // Should be numeric like "53:3" or just "1"
    return /^\d+(:\d+)?$/.test(blockPart);
});
console.log(`\n1.12 uses numeric IDs: ${hasNumericIds ? '✓' : '✗'}`);

// Verify that 1.21 commands use minecraft: prefix
const hasMinecraftPrefix = commands1_21.every(cmd => {
    const blockPart = cmd.split(' ').pop();
    return blockPart.startsWith('minecraft:');
});
console.log(`1.21 uses minecraft: prefix: ${hasMinecraftPrefix ? '✓' : '✗'}`);
