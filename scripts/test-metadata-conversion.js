/**
 * Test script for property-to-metadata conversion
 * Verifies that modern block properties are correctly converted to legacy metadata
 */

import { propertiesToMetadata, BLOCK_PROPERTY_CATEGORY, PROPERTY_TO_METADATA } from '../src/utils/versionConfig.js';

console.log('=== Testing Property to Metadata Conversion ===\n');

// Test cases based on official 1.12 data
const testCases = [
    // Stairs tests
    { block: 'oak_stairs', props: { facing: 'east', half: 'bottom' }, expected: 0, desc: 'Stairs: east, bottom' },
    { block: 'oak_stairs', props: { facing: 'west', half: 'bottom' }, expected: 1, desc: 'Stairs: west, bottom' },
    { block: 'oak_stairs', props: { facing: 'south', half: 'bottom' }, expected: 2, desc: 'Stairs: south, bottom' },
    { block: 'oak_stairs', props: { facing: 'north', half: 'bottom' }, expected: 3, desc: 'Stairs: north, bottom' },
    { block: 'oak_stairs', props: { facing: 'east', half: 'top' }, expected: 4, desc: 'Stairs: east, top' },
    { block: 'oak_stairs', props: { facing: 'west', half: 'top' }, expected: 5, desc: 'Stairs: west, top' },
    { block: 'oak_stairs', props: { facing: 'south', half: 'top' }, expected: 6, desc: 'Stairs: south, top' },
    { block: 'oak_stairs', props: { facing: 'north', half: 'top' }, expected: 7, desc: 'Stairs: north, top' },
    
    // Slab tests
    { block: 'stone_slab', props: { type: 'bottom' }, expected: 0, desc: 'Slab: bottom' },
    { block: 'stone_slab', props: { type: 'top' }, expected: 8, desc: 'Slab: top' },
    
    // Log tests
    { block: 'oak_log', props: { axis: 'y' }, expected: 0, desc: 'Log: axis Y' },
    { block: 'oak_log', props: { axis: 'x' }, expected: 4, desc: 'Log: axis X' },
    { block: 'oak_log', props: { axis: 'z' }, expected: 8, desc: 'Log: axis Z' },
    
    // Trapdoor tests
    { block: 'oak_trapdoor', props: { facing: 'north', half: 'bottom', open: 'false' }, expected: 0, desc: 'Trapdoor: north, bottom, closed' },
    { block: 'oak_trapdoor', props: { facing: 'south', half: 'bottom', open: 'false' }, expected: 1, desc: 'Trapdoor: south, bottom, closed' },
    { block: 'oak_trapdoor', props: { facing: 'north', half: 'bottom', open: 'true' }, expected: 4, desc: 'Trapdoor: north, bottom, open' },
    { block: 'oak_trapdoor', props: { facing: 'north', half: 'top', open: 'false' }, expected: 8, desc: 'Trapdoor: north, top, closed' },
    { block: 'oak_trapdoor', props: { facing: 'north', half: 'top', open: 'true' }, expected: 12, desc: 'Trapdoor: north, top, open' },
    
    // Fence gate tests
    { block: 'oak_fence_gate', props: { facing: 'south', open: 'false' }, expected: 0, desc: 'Fence gate: south, closed' },
    { block: 'oak_fence_gate', props: { facing: 'west', open: 'false' }, expected: 1, desc: 'Fence gate: west, closed' },
    { block: 'oak_fence_gate', props: { facing: 'south', open: 'true' }, expected: 4, desc: 'Fence gate: south, open' },
    
    // Door tests (lower half)
    { block: 'oak_door', props: { facing: 'east', half: 'lower', open: 'false' }, expected: 0, desc: 'Door lower: east, closed' },
    { block: 'oak_door', props: { facing: 'south', half: 'lower', open: 'false' }, expected: 1, desc: 'Door lower: south, closed' },
    { block: 'oak_door', props: { facing: 'east', half: 'lower', open: 'true' }, expected: 4, desc: 'Door lower: east, open' },
    
    // Door tests (upper half)
    { block: 'oak_door', props: { half: 'upper', hinge: 'left', powered: 'false' }, expected: 8, desc: 'Door upper: left hinge' },
    { block: 'oak_door', props: { half: 'upper', hinge: 'right', powered: 'false' }, expected: 9, desc: 'Door upper: right hinge' },
    { block: 'oak_door', props: { half: 'upper', hinge: 'left', powered: 'true' }, expected: 10, desc: 'Door upper: left, powered' },
    
    // Chest tests
    { block: 'chest', props: { facing: 'north' }, expected: 2, desc: 'Chest: north' },
    { block: 'chest', props: { facing: 'south' }, expected: 3, desc: 'Chest: south' },
    { block: 'chest', props: { facing: 'west' }, expected: 4, desc: 'Chest: west' },
    { block: 'chest', props: { facing: 'east' }, expected: 5, desc: 'Chest: east' },
    
    // Bed tests
    { block: 'red_bed', props: { facing: 'south', part: 'foot' }, expected: 0, desc: 'Bed: south, foot' },
    { block: 'red_bed', props: { facing: 'west', part: 'foot' }, expected: 1, desc: 'Bed: west, foot' },
    { block: 'red_bed', props: { facing: 'south', part: 'head' }, expected: 8, desc: 'Bed: south, head' },
    
    // Rail tests
    { block: 'rail', props: { shape: 'north_south' }, expected: 0, desc: 'Rail: north_south' },
    { block: 'rail', props: { shape: 'east_west' }, expected: 1, desc: 'Rail: east_west' },
    { block: 'rail', props: { shape: 'ascending_east' }, expected: 2, desc: 'Rail: ascending_east' },
    { block: 'rail', props: { shape: 'south_east' }, expected: 6, desc: 'Rail: curved south_east' },
    
    // Powered rail tests
    { block: 'powered_rail', props: { shape: 'north_south', powered: 'false' }, expected: 0, desc: 'Powered rail: NS, off' },
    { block: 'powered_rail', props: { shape: 'north_south', powered: 'true' }, expected: 8, desc: 'Powered rail: NS, on' },
];

let passed = 0;
let failed = 0;

testCases.forEach(test => {
    const result = propertiesToMetadata(test.block, test.props);
    const status = result === test.expected ? '✓' : '✗';
    
    if (result === test.expected) {
        passed++;
        console.log(`${status} ${test.desc}: ${result}`);
    } else {
        failed++;
        console.log(`${status} ${test.desc}: got ${result}, expected ${test.expected}`);
    }
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

// Also test that unknown blocks return 0
const unknownResult = propertiesToMetadata('unknown_block', { facing: 'north' });
console.log(`\nUnknown block test: ${unknownResult === 0 ? '✓' : '✗'} (got ${unknownResult}, expected 0)`);

// Test null/undefined properties
const nullResult = propertiesToMetadata('oak_stairs', null);
console.log(`Null props test: ${nullResult === 0 ? '✓' : '✗'} (got ${nullResult}, expected 0)`);

process.exit(failed > 0 ? 1 : 0);
