const vm = require('vm');

// === 1. Mock Builder Environment ===
class MockBuilder {
    constructor() {
        this.minX = Infinity; this.maxX = -Infinity;
        this.minY = Infinity; this.maxY = -Infinity;
        this.minZ = Infinity; this.maxZ = -Infinity;
        this.blockCount = 0;
    }

    _updateBounds(x, y, z) {
        this.minX = Math.min(this.minX, x);
        this.maxX = Math.max(this.maxX, x);
        this.minY = Math.min(this.minY, y);
        this.maxY = Math.max(this.maxY, y);
        this.minZ = Math.min(this.minZ, z);
        this.maxZ = Math.max(this.maxZ, z);
        this.blockCount++;
    }

    set(x, y, z, type) {
        this._updateBounds(x, y, z);
    }

    fill(x1, y1, z1, x2, y2, z2, type) {
        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
        const minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);

        // Update bounds with corners is enough for bounding box
        this._updateBounds(minX, minY, minZ);
        this._updateBounds(maxX, maxY, maxZ);

        // Accurate block count
        this.blockCount += (maxX - minX + 1) * (maxY - minY + 1) * (maxZ - minZ + 1);
    }

    // Mock other methods to avoid errors, simple implementations that update bounds
    hollowBox(x1, y1, z1, x2, y2, z2, type) { this.fill(x1, y1, z1, x2, y2, z2, type); }
    line(x1, y1, z1, x2, y2, z2, type) { this.fill(x1, y1, z1, x2, y2, z2, type); }

    // For complex shapes, we might miss some bounds if we don't simulate math, 
    // but typically they are bounded by their parameters.
    drawRoofBounds(x1, y1, z1, x2, y2, z2) { this.fill(x1, y1, z1, x2, y2, z2, 'mock'); }
    drawPolyRoof(x, y, z, r, h) {
        this._updateBounds(x - r, y, z - r);
        this._updateBounds(x + r, y + h, z + r);
    }
    drawCylinder(x, y, z, r, h) {
        this._updateBounds(x - r, y, z - r);
        this._updateBounds(x + r, y + h, z + r);
    }
    drawEllipsoid(x, y, z, rx, ry, rz) {
        this._updateBounds(x - rx, y - ry, z - rz);
        this._updateBounds(x + rx, y + ry, z + rz);
    }
    drawTorus(x, y, z, R, r) {
        const totalR = R + r;
        this._updateBounds(x - totalR, y - r, z - totalR); // Flat torus on y? Usually vertical.
        this._updateBounds(x + totalR, y + r, z + totalR); // Approximation
    }
    drawSpiralStairs(x, y, z, r, h) {
        this._updateBounds(x - r, y, z - r);
        this._updateBounds(x + r, y + h, z + r);
    }
    drawBezier(points) {
        points.forEach(p => this._updateBounds(p.x, p.y, p.z));
    }
    // Component stubs
    defineComponent() { }
    placeComponent() { } // This is tricky, would need to execute component logic. 
    // For now, assume components are used inside main script 
    // which expands to basic calls if we had full component registry.
    // Without registry, we miss component blocks.
    // BUT, usually generated code defines components in the same file.
    // So if we run the FULL code, defineComponent will store it, and placeComponent will run it.

    // Component support
    _components = {};
    defineComponent(name, fn) { this._components[name] = fn; }
    placeComponent(name, x, y, z, params = {}, options = {}) {
        if (this._components[name]) {
            // Create mini builder that offsets coordinates
            const miniBuilder = new Proxy(this, {
                get: (target, prop) => {
                    if (prop === 'set') return (bx, by, bz, t) => target.set(x + bx, y + by, z + bz, t);
                    if (prop === 'fill') return (x1, y1, z1, x2, y2, z2, t) => target.fill(x + x1, y + y1, z + z1, x + x2, y + y2, z + z2, t);
                    // ... verify other methods if needed
                    return target[prop];
                }
            });
            try {
                this._components[name](miniBuilder, params);
            } catch (e) {
                // Ignore component errors
            }
        }
    }

    beginGroup() { }
    endGroup() { }
    setPriority() { }
    drawHanging() { }
    drawHangingRing() { }
    scatter() { }
}

// === 2. Execution ===

// Get code from args (passed by run_script)
const args = process.argv.slice(2);
const code = args[0] || '';

if (!code) {
    console.log(JSON.stringify({ error: "No code provided to analyze" }));
    process.exit(0);
}

const mockBuilder = new MockBuilder();
const sandbox = {
    builder: mockBuilder,
    Math: Math,
    console: { log: () => { } } // Silence logs
};

try {
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    // === 3. Result ===

    // Check if empty
    if (mockBuilder.blockCount === 0) {
        console.log(JSON.stringify({
            exists: false,
            message: "Scene is empty",
            bounds: null
        }));
    } else {
        const bounds = {
            minX: mockBuilder.minX, maxX: mockBuilder.maxX,
            minY: mockBuilder.minY, maxY: mockBuilder.maxY,
            minZ: mockBuilder.minZ, maxZ: mockBuilder.maxZ
        };

        const size = {
            width: bounds.maxX - bounds.minX + 1,
            height: bounds.maxY - bounds.minY + 1,
            depth: bounds.maxZ - bounds.minZ + 1
        };

        const center = {
            x: Math.round((bounds.minX + bounds.maxX) / 2),
            y: bounds.minY, // Base y
            z: Math.round((bounds.minZ + bounds.maxZ) / 2)
        };

        console.log(JSON.stringify({
            exists: true,
            blockCount: mockBuilder.blockCount,
            bounds: bounds,
            size: size,
            center: center,
            recommendation: `New structures should be placed at least at X=${bounds.maxX + 10} or Z=${bounds.maxZ + 10} to avoid overlap.`
        }));
    }

} catch (err) {
    console.log(JSON.stringify({
        error: `Analysis failed: ${err.message}`,
        exists: false
    }));
}
