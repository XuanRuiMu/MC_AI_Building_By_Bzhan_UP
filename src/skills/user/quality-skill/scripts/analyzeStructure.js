const vm = require('vm');

// === 1. Mock Builder Environment ===
class MockBuilder {
    constructor() {
        this.blocks = [];
        this.groups = {};
    }
    set(x, y, z, type) { this.blocks.push({ x, y, z, type: String(type) }); }
    fill(x1, y1, z1, x2, y2, z2, type) {
        // Simplified: estimate count or just push one representative
        // For analysis, we need actual counts roughly.
        // Let's iterate but limit size to avoid OOM on massive fills.
        const vol = Math.abs((x2 - x1 + 1) * (y2 - y1 + 1) * (z2 - z1 + 1));
        if (vol > 10000) {
            this.blocks.push({ type: String(type), count: vol }); // Virtual block
        } else {
            for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
                for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
                    for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++)
                        this.set(x, y, z, type);
        }
    }
    // Implement other methods as pass-throughs or simplifications
    hollowBox(x1, y1, z1, x2, y2, z2, type) { this.fill(x1, y1, z1, x2, y2, z2, type); } // Rough approx
    line(x1, y1, z1, x2, y2, z2, type) { this.fill(x1, y1, z1, x2, y2, z2, type); }
    drawRoofBounds() { /* Assume AI uses it correctly, or we mock it simply */ }
    drawPolyRoof() { }
    drawCylinder() { }
    drawEllipsoid() { }
    drawTorus() { }
    drawSpiralStairs() { }
    drawBezier() { }
    drawHanging() { }
    scatter() { }
    defineComponent() { }
    placeComponent() { }
    beginGroup() { }
    endGroup() { }
}

// === 2. Analysis Definitions ===
const CATEGORIES = {
    interior: ['bed', 'crafting', 'furnace', 'chest', 'barrel', 'lectern', 'bookshelf', 'lantern', 'torch', 'carpet', 'painting', 'flower_pot', 'anvil', 'enchanting', 'brewing', 'loom', 'smoker', 'blast_furnace'],
    nature: ['leaves', 'vine', 'grass', 'poppy', 'dandelion', 'orchid', 'tulip', 'allium', 'fern', 'bamboo', 'lily', 'sugar_cane'],
    opening: ['door', 'glass', 'pane', 'trapdoor', 'gate']
};

const RULES = [
    {
        id: 'missing_interior',
        category: 'interior',
        min: 4,
        message: "❌ INTERIOR MISSING: The building seems empty. Add furniture (beds, tables, lights, bookshelves)."
    },
    {
        id: 'missing_windows',
        category: 'opening',
        min: 2,
        message: "❌ NO WINDOWS/DOORS: The building has no openings. Add windows (glass) and doors."
    },
    {
        id: 'missing_nature',
        category: 'nature',
        min: 2,
        message: "⚠️ NO NATURE: The build looks sterile. Add some plants, leaves, or vines outside."
    }
];

// === 3. Main Execution ===
try {
    const code = process.argv[2];
    if (!code) throw new Error("No code provided");

    const builder = new MockBuilder();
    const sandbox = {
        builder,
        Math,
        console: { log: () => { }, warn: () => { } }
    };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { timeout: 1000 });

    // Analyze Blocks
    const counts = { interior: 0, nature: 0, opening: 0 };
    let totalBlocks = 0;

    for (const block of builder.blocks) {
        const type = block.type.toLowerCase();
        const count = block.count || 1;
        totalBlocks += count;

        for (const [cat, keywords] of Object.entries(CATEGORIES)) {
            if (keywords.some(k => type.includes(k))) {
                counts[cat] += count;
            }
        }
    }

    // Check Rules
    const failures = [];
    for (const rule of RULES) {
        if (counts[rule.category] < rule.min) {
            failures.push(rule.message);
        }
    }

    const result = {
        valid: failures.length === 0,
        stats: counts,
        totalBlocks,
        errors: failures
    };

    console.log(JSON.stringify(result));

} catch (e) {
    console.log(JSON.stringify({
        valid: false,
        error: "Script Execution Error: " + e.message,
        errors: ["Script Crashed: " + e.message]
    }));
}
