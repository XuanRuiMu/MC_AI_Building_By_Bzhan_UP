/**
 * Sandbox for executing AI-generated voxel scripts.
 */

class VoxelBuilder {
    constructor() {
        this.voxels = []; // Stores { position, type, mode?, properties?, groupId?, priority? }
        this.positionMap = new Map(); // For O(1) lookups: "x,y,z" -> { type, priority }
        this.components = new Map(); // Component templates: name -> [{dx, dy, dz, type, properties}]
        this.currentGroupId = null; // Current group being built
        this.groupCounter = 0; // Auto-increment group IDs
        this.currentPriority = 0; // Default priority for current group
        this._noiseSeed = 12345; // Fixed seed for deterministic noise
    }

    /**
     * Position-based deterministic random number generator.
     * Same position always returns the same "random" value.
     * Use this instead of Math.random() to ensure consistent results across re-executions.
     * 
     * @param {number} x, y, z - Position coordinates
     * @param {number} seed - Optional additional seed for variation (default: 0)
     * @returns {number} - Value between 0 and 1 (like Math.random())
     * 
     * @example
     * // Pick random material for each position (consistent across re-runs)
     * const materials = ['stone_bricks', 'mossy_stone_bricks', 'cobblestone'];
     * const mat = materials[Math.floor(builder.randomAt(x, y, z) * materials.length)];
     */
    randomAt(x, y, z, seed = 0) {
        // Hash function that produces consistent results for same inputs
        const hash = (x * 374761393 + y * 668265263 + z * 1274126177 + seed * 1103515245) >>> 0;
        const s = Math.sin(hash) * 43758.5453123;
        return s - Math.floor(s);
    }

    /**
     * Pick a random item from an array based on position.
     * Same position always picks the same item.
     * 
     * @param {number} x, y, z - Position coordinates
     * @param {Array} items - Array of items to pick from
     * @param {number} seed - Optional seed for variation
     * @returns {*} - One item from the array
     * 
     * @example
     * const mat = builder.pickAt(x, y, z, ['stone_bricks', 'mossy_stone_bricks', 'cobblestone']);
     */
    pickAt(x, y, z, items, seed = 0) {
        if (!items || items.length === 0) return null;
        const index = Math.floor(this.randomAt(x, y, z, seed) * items.length);
        return items[index];
    }

    /**
     * Simple 3D noise function for organic shapes
     * @param {number} x, y, z - Position
     * @param {number} scale - Noise scale (smaller = smoother)
     * @returns {number} - Value between -1 and 1
     */
    _noise3D(x, y, z, scale = 1) {
        // Simple pseudo-random noise based on position
        const sx = x * scale + this._noiseSeed;
        const sy = y * scale + this._noiseSeed * 1.3;
        const sz = z * scale + this._noiseSeed * 0.7;
        
        // Hash function for pseudo-random
        const hash = (n) => {
            const s = Math.sin(n) * 43758.5453123;
            return s - Math.floor(s);
        };
        
        // Combine multiple frequencies for more natural look
        const n1 = hash(sx * 12.9898 + sy * 78.233 + sz * 37.719);
        const n2 = hash(sx * 39.346 + sy * 11.135 + sz * 83.155) * 0.5;
        const n3 = hash(sx * 73.156 + sy * 52.235 + sz * 9.346) * 0.25;
        
        return (n1 + n2 + n3) / 1.75 * 2 - 1; // Normalize to -1 to 1
    }

    /**
     * Apply noise to a distance value for organic shapes
     * @param {number} dist - Original distance
     * @param {number} x, y, z - Position for noise sampling
     * @param {Object} noiseOptions - { amount: 0-1, scale: 0.1-1, seed: number }
     * @returns {number} - Modified distance
     */
    _applyNoise(dist, x, y, z, noiseOptions) {
        if (!noiseOptions || noiseOptions.amount === 0) return dist;
        
        const amount = noiseOptions.amount || 0.3;
        const scale = noiseOptions.scale || 0.3;
        
        if (noiseOptions.seed !== undefined) {
            this._noiseSeed = noiseOptions.seed;
        }
        
        const noise = this._noise3D(x, y, z, scale);
        return dist + noise * amount;
    }

    /**
     * Clear the entire canvas or a specific region
     * @param {number} x1, y1, z1, x2, y2, z2 - Optional bounds. If omitted, clears internal state.
     */
    clear(x1, y1, z1, x2, y2, z2) {
        if (x1 === undefined) {
            // Reset everything
            this.voxels = [];
            this.positionMap.clear();
            this.currentGroupId = null;
            this.groupCounter = 0;
            return;
        }

        // Clear specific region by filling with AIR
        // We use a high priority to ensure it overwrites everything
        const prevPriority = this.currentPriority;
        this.currentPriority = 1000;
        this.fill(x1, y1, z1, x2, y2, z2, 'AIR');
        this.currentPriority = prevPriority;
    }

    /**
     * Parse type string that may include mode: "WALL_STONE:noise"
     * OR specific properties: "oak_stairs?facing=north"
     */
    parseType(typeStr) {
        // Guard against undefined/null type
        if (typeStr === undefined || typeStr === null) {
            console.warn('parseType received undefined/null type, defaulting to stone');
            return { type: 'stone', mode: null, properties: null };
        }

        // Ensure it's a string
        let type = String(typeStr);
        let mode = null;
        let properties = null;

        // 1. Handle Properties (using ?)
        if (type.includes('?')) {
            const parts = type.split('?');
            type = parts[0];
            properties = parts[1]; // Keep standard format "facing=north,half=top"
        }

        // 2. Handle Mode (using :)
        if (type.includes(':')) {
            const parts = type.split(':');
            type = parts[0];
            mode = parts[1].toLowerCase();
        }

        // 3. Normalize Type
        if (type === type.toUpperCase()) {
            // It's already uppercase, likely semantic
        } else {
            type = type.toLowerCase();
        }

        return { type, mode, properties };
    }

    /**
     * Get the block type at a specific position
     */
    get(x, y, z) {
        const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
        const data = this.positionMap.get(key);
        return data ? data.type : null;
    }

    /**
     * Set priority for subsequent blocks (until changed)
     * @param {number} priority - Higher number = higher priority (won't be overwritten)
     * Common values: 0 = default, 50 = decorations, 100 = structure/frame
     */
    setPriority(priority) {
        this.currentPriority = priority;
    }

    /**
     * Start a new group - all subsequent blocks will have this groupId
     * @param {string} name - Group name
     * @param {Object} options - { priority: number } - set priority for entire group
     */
    beginGroup(name = null, options = {}) {
        this.groupCounter++;
        this.currentGroupId = name || `group_${this.groupCounter}`;

        // Allow setting priority for entire group
        if (options.priority !== undefined) {
            this.currentPriority = options.priority;
        }

        return this.currentGroupId;
    }

    /**
     * End the current group
     */
    endGroup() {
        const gid = this.currentGroupId;
        this.currentGroupId = null;
        this.currentPriority = 0; // Reset priority to default
        return gid;
    }

    /**
     * Place a block at position
     * @param {number} x, y, z - Position
     * @param {string} typeStr - Block type
     * @param {Object} options - { priority: number } - override current priority for this block
     */
    set(x, y, z, typeStr, options = {}) {
        // Validation: Check for floating point coordinates
        if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z)) {
            console.warn(`[VoxelBuilder] Warning: Floating point coordinates detected at (${x}, ${y}, ${z}). Auto-flooring.`);
        }

        const fx = Math.floor(x);
        const fy = Math.floor(y);
        const fz = Math.floor(z);

        const { type, mode, properties } = this.parseType(typeStr);
        const key = `${fx},${fy},${fz}`;

        // Determine priority: explicit > group > default
        const priority = options.priority !== undefined ? options.priority : this.currentPriority;

        // Check if position already has a block with higher priority
        const existing = this.positionMap.get(key);
        if (existing && existing.priority > priority) {
            // Exception: AIR blocks should always be replaceable by non-AIR blocks
            // This allows interior furniture (low priority) to be placed in hollowed-out spaces
            const existingIsAir = existing.type.toLowerCase() === 'air';
            const newIsAir = type.toLowerCase() === 'air';
            
            if (!existingIsAir || newIsAir) {
                // Existing block has higher priority and is not AIR (or new block is also AIR), don't overwrite
                return;
            }
            // If existing is AIR and new is not AIR, allow the replacement
        }

        // Update position map with priority info
        this.positionMap.set(key, { type, priority });

        this.voxels.push({
            position: [fx, fy, fz],
            type,
            mode,
            properties,
            priority,
            groupId: this.currentGroupId // Attach group if active
        });
    }

    /**
     * Place a door at position with automatic clearance.
     * Doors have priority 100 (highest) and automatically clear any blocks
     * in front of and behind them to ensure they're never blocked.
     * @param {number} x, y, z - Position of the LOWER door block
     * @param {string} doorType - Door block type with facing, e.g. 'oak_door?facing=south'
     */
    setDoor(x, y, z, doorType) {
        const DOOR_PRIORITY = 100;

        // Parse facing direction from door type
        let facing = 'south'; // default
        const facingMatch = doorType.match(/facing=(\w+)/);
        if (facingMatch) {
            facing = facingMatch[1];
        }

        // Calculate direction vectors based on facing
        // 'facing' is the direction the door faces when closed (where the player stands to open it)
        let dx = 0, dz = 0;
        switch (facing) {
            case 'north': dz = -1; break;
            case 'south': dz = 1; break;
            case 'east': dx = 1; break;
            case 'west': dx = -1; break;
        }

        // Clear blocks in front of the door (where player enters from)
        // The "front" is the direction the door faces
        this.set(x + dx, y, z + dz, 'air', { priority: DOOR_PRIORITY });
        this.set(x + dx, y + 1, z + dz, 'air', { priority: DOOR_PRIORITY });

        // Clear blocks behind the door (inside)
        this.set(x - dx, y, z - dz, 'air', { priority: DOOR_PRIORITY });
        this.set(x - dx, y + 1, z - dz, 'air', { priority: DOOR_PRIORITY });

        // Place the door (lower and upper halves)
        // Note: Minecraft handles the upper half automatically, but we explicitly set both for clarity
        this.set(x, y, z, doorType + ',half=lower', { priority: DOOR_PRIORITY });
        this.set(x, y + 1, z, doorType + ',half=upper', { priority: DOOR_PRIORITY });
    }

    fill(x1, y1, z1, x2, y2, z2, type) {
        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
        const minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    this.set(x, y, z, type);
                }
            }
        }
    }

    /**
     * Create only 4 vertical walls (no floor or ceiling)
     * This is the preferred function for building room walls that don't block interior space.
     */
    walls(x1, y1, z1, x2, y2, z2, type) {
        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
        const minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);

        // 4 Walls only (no top/bottom)
        this.fill(minX, minY, minZ, maxX, maxY, minZ, type); // Front (minZ)
        this.fill(minX, minY, maxZ, maxX, maxY, maxZ, type); // Back (maxZ)
        this.fill(minX, minY, minZ, minX, maxY, maxZ, type); // Left (minX)
        this.fill(maxX, minY, minZ, maxX, maxY, maxZ, type); // Right (maxX)
    }

    line(x1, y1, z1, x2, y2, z2, type) {
        const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1), dz = Math.abs(z2 - z1);
        const n = Math.max(dx, dy, dz);
        for (let i = 0; i <= n; i++) {
            this.set(
                x1 + (x2 - x1) * (i / n),
                y1 + (y2 - y1) * (i / n),
                z1 + (z2 - z1) * (i / n),
                type
            );
        }
    }

    /**
     * Draw a Polygon/Circular Roof (Cone, Dome, Pagoda)
     * Smart stair/solid block placement: edges use stairs, interior uses solid blocks
     * @param {number} x, y, z - Center bottom position
     * @param {number} radius - Base radius
     * @param {number} height - Roof height
     * @param {number} sides - Number of sides (e.g., 4=Pyramid, 8=Octagon, 20=Cone)
     * @param {string} style - 'cone' (straight), 'dome' (spherical), 'curve' (bell/asian), 'steep' (gothic)
     * @param {string} type - Material (can be stairs like 'oak_stairs' or solid like 'stone_bricks')
     */
    drawPolyRoof(x, y, z, radius, height, sides, style = 'cone', type) {
        // ========== SMART MATERIAL DETECTION ==========
        // If type is a stair, extract the base material for solid blocks
        let stairType = type;
        let solidType = type;
        let slabType = null;

        // Common stair -> solid/slab mappings
        const stairMappings = {
            'oak_stairs': { solid: 'oak_planks', slab: 'oak_slab' },
            'spruce_stairs': { solid: 'spruce_planks', slab: 'spruce_slab' },
            'birch_stairs': { solid: 'birch_planks', slab: 'birch_slab' },
            'jungle_stairs': { solid: 'jungle_planks', slab: 'jungle_slab' },
            'acacia_stairs': { solid: 'acacia_planks', slab: 'acacia_slab' },
            'dark_oak_stairs': { solid: 'dark_oak_planks', slab: 'dark_oak_slab' },
            'crimson_stairs': { solid: 'crimson_planks', slab: 'crimson_slab' },
            'warped_stairs': { solid: 'warped_planks', slab: 'warped_slab' },
            'stone_stairs': { solid: 'stone', slab: 'stone_slab' },
            'cobblestone_stairs': { solid: 'cobblestone', slab: 'cobblestone_slab' },
            'stone_brick_stairs': { solid: 'stone_bricks', slab: 'stone_brick_slab' },
            'brick_stairs': { solid: 'bricks', slab: 'brick_slab' },
            'sandstone_stairs': { solid: 'sandstone', slab: 'sandstone_slab' },
            'smooth_sandstone_stairs': { solid: 'smooth_sandstone', slab: 'smooth_sandstone_slab' },
            'red_sandstone_stairs': { solid: 'red_sandstone', slab: 'red_sandstone_slab' },
            'nether_brick_stairs': { solid: 'nether_bricks', slab: 'nether_brick_slab' },
            'quartz_stairs': { solid: 'quartz_block', slab: 'quartz_slab' },
            'prismarine_stairs': { solid: 'prismarine', slab: 'prismarine_slab' },
            'dark_prismarine_stairs': { solid: 'dark_prismarine', slab: 'dark_prismarine_slab' },
            'purpur_stairs': { solid: 'purpur_block', slab: 'purpur_slab' },
            'deepslate_stairs': { solid: 'deepslate', slab: 'deepslate_slab' },
            'deepslate_brick_stairs': { solid: 'deepslate_bricks', slab: 'deepslate_brick_slab' },
            'deepslate_tile_stairs': { solid: 'deepslate_tiles', slab: 'deepslate_tile_slab' },
            'polished_deepslate_stairs': { solid: 'polished_deepslate', slab: 'polished_deepslate_slab' },
            'polished_blackstone_stairs': { solid: 'polished_blackstone', slab: 'polished_blackstone_slab' },
            'polished_blackstone_brick_stairs': { solid: 'polished_blackstone_bricks', slab: 'polished_blackstone_brick_slab' },
            'cut_copper_stairs': { solid: 'cut_copper', slab: 'cut_copper_slab' },
            'mossy_stone_brick_stairs': { solid: 'mossy_stone_bricks', slab: 'mossy_stone_brick_slab' },
            'mossy_cobblestone_stairs': { solid: 'mossy_cobblestone', slab: 'mossy_cobblestone_slab' },
            'bamboo_stairs': { solid: 'bamboo_planks', slab: 'bamboo_slab' },
            'bamboo_mosaic_stairs': { solid: 'bamboo_mosaic', slab: 'bamboo_mosaic_slab' },
            'cherry_stairs': { solid: 'cherry_planks', slab: 'cherry_slab' },
            'red_nether_brick_stairs': { solid: 'red_nether_bricks', slab: 'red_nether_brick_slab' },
        };

        // Check if type is a stair and get mappings
        const baseType = type.replace(/\?.*$/, ''); // Remove any properties
        if (stairMappings[baseType]) {
            stairType = baseType;
            solidType = stairMappings[baseType].solid;
            slabType = stairMappings[baseType].slab;
        } else if (baseType.includes('_stairs')) {
            // Unknown stair type - try to derive solid type
            stairType = baseType;
            solidType = baseType.replace('_stairs', 's').replace('ss', 's'); // crude approximation
            slabType = baseType.replace('_stairs', '_slab');
        } else {
            // Not a stair - use as solid, try to find matching stair
            solidType = baseType;
            // Try to find a stair version
            const possibleStair = baseType.replace('_bricks', '_brick_stairs')
                .replace('_planks', '_stairs')
                .replace('_tiles', '_tile_stairs')
                .replace('_block', '_stairs');
            if (possibleStair !== baseType) {
                stairType = possibleStair;
            }
        }

        // ========== RADIUS CALCULATION HELPER ==========
        const getRadiusFactor = (t) => {
            switch (style) {
                case 'cone': return 1 - t;
                case 'dome': return Math.sqrt(Math.max(0, 1 - t * t));
                case 'curve':
                case 'asian': return Math.pow(1 - t, 1.5);
                case 'steep': return 1 - Math.pow(t, 0.7);
                default: return 1 - t;
            }
        };

        // ========== BUILD ROOF LAYER BY LAYER ==========
        // We need to track all positions first, then decide stair vs solid
        const roofBlocks = new Map(); // "x,y,z" -> { isEdge, angle }

        // Sample more points for accuracy
        const layerCount = Math.max(height, 2);

        for (let layer = 0; layer <= layerCount; layer++) {
            const t = layer / layerCount;
            const currentY = Math.floor(y + t * height);
            const rFactor = getRadiusFactor(t);
            const currentR = radius * rFactor;

            if (currentR < 0.3) continue;

            // For this layer, mark all blocks in the polygon ring
            const range = Math.ceil(currentR) + 1;

            for (let dx = -range; dx <= range; dx++) {
                for (let dz = -range; dz <= range; dz++) {
                    const dist = Math.sqrt(dx * dx + dz * dz);

                    // Check if point is on the polygon edge (within the ring)
                    // For hollow polygon: outerR - thickness < dist <= outerR
                    const thickness = Math.max(1, Math.ceil(currentR * 0.25));
                    const innerR = Math.max(0, currentR - thickness);

                    if (dist <= currentR + 0.5 && dist > innerR - 0.5) {
                        const px = x + dx;
                        const pz = z + dz;
                        const key = `${px},${currentY},${pz}`;

                        // Calculate angle from center for stair facing
                        const angle = Math.atan2(dz, dx);

                        // Determine if this is an outer edge (for stair) or inner (for solid)
                        const isOuterEdge = dist > currentR - 1;

                        roofBlocks.set(key, {
                            x: px, y: currentY, z: pz,
                            isEdge: isOuterEdge,
                            angle: angle,
                            radius: currentR
                        });
                    }
                }
            }
        }

        // ========== FIRST PASS: Collect all block positions ==========
        const placedBlocks = new Map(); // "x,y,z" -> { type, isStair, stairFacing }

        roofBlocks.forEach((info, key) => {
            const { x: px, y: py, z: pz, isEdge, angle } = info;

            if (isEdge && stairType !== solidType) {
                // Edge block: calculate stair facing
                let facing;
                if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
                    facing = 'west';
                } else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) {
                    facing = 'north';
                } else if (angle >= 3 * Math.PI / 4 || angle < -3 * Math.PI / 4) {
                    facing = 'east';
                } else {
                    facing = 'south';
                }
                placedBlocks.set(key, { x: px, y: py, z: pz, type: 'stair', facing, stairType, solidType });
            } else {
                placedBlocks.set(key, { x: px, y: py, z: pz, type: 'solid', solidType });
            }
        });

        // ========== SECOND PASS: Convert surrounded stairs to solid ==========
        // Rule: If a stair has 3+ neighbors on the same Y level (N/S/E/W), convert to solid
        placedBlocks.forEach((block, key) => {
            if (block.type !== 'stair') return;

            const { x: px, y: py, z: pz } = block;

            // Check 4 horizontal neighbors
            const neighbors = [
                `${px + 1},${py},${pz}`, // East
                `${px - 1},${py},${pz}`, // West
                `${px},${py},${pz + 1}`, // South
                `${px},${py},${pz - 1}`, // North
            ];

            let solidNeighborCount = 0;
            neighbors.forEach(nKey => {
                if (placedBlocks.has(nKey)) {
                    solidNeighborCount++;
                }
            });

            // If 3 or 4 sides are surrounded, convert this stair to solid
            if (solidNeighborCount >= 3) {
                block.type = 'solid';
            }
        });

        // ========== THIRD PASS: Only topmost block at each X,Z can be stair ==========
        // Find the highest Y for each X,Z position, convert lower ones to solid
        const xzMaxY = new Map(); // "x,z" -> maxY

        // First, find max Y for each X,Z
        placedBlocks.forEach((block, key) => {
            const xzKey = `${block.x},${block.z}`;
            const existing = xzMaxY.get(xzKey);
            if (!existing || block.y > existing) {
                xzMaxY.set(xzKey, block.y);
            }
        });

        // Then, convert non-topmost stairs to solid
        placedBlocks.forEach((block, key) => {
            if (block.type !== 'stair') return;

            const xzKey = `${block.x},${block.z}`;
            const maxY = xzMaxY.get(xzKey);

            // If this block is not at the top Y for this X,Z, convert to solid
            if (block.y < maxY) {
                block.type = 'solid';
            }
        });

        // ========== FOURTH PASS: Actually place the blocks ==========
        placedBlocks.forEach((block, key) => {
            const { x: px, y: py, z: pz } = block;

            if (block.type === 'stair') {
                this.set(px, py, pz, `${block.stairType}?facing=${block.facing}`);
            } else {
                this.set(px, py, pz, block.solidType || solidType);
            }
        });

        // ========== FINIAL FOR CURVE/STEEP STYLES ==========
        if (style === 'curve' || style === 'steep' || style === 'asian') {
            const peakY = y + height;
            // Use fence for tip if available
            const baseName = solidType.split('_')[0];
            const fenceType = `${baseName}_fence`;
            this.set(x, peakY, z, fenceType);
        }
    }

    /**
     * Draw a Roof using coordinates (bounding box).
     * This is the ONLY public method for drawing roofs to prevent errors.
     */
    drawRoofBounds(x1, y, z1, x2, z2, height, style, type, options = {}) {
        const minX = Math.min(x1, x2);
        const minZ = Math.min(z1, z2);
        const maxX = Math.max(x1, x2);
        const maxZ = Math.max(z1, z2);

        const width = maxX - minX + 1;
        const depth = maxZ - minZ + 1;

        // Resolve ROOF_ semantic types to actual stair blocks
        let resolvedType = type;
        if (type && type.startsWith('ROOF_')) {
            const roofMappings = {
                'ROOF_WOOD': 'spruce_stairs',
                'ROOF_DARK': 'dark_oak_stairs',
                'ROOF_DARK_OAK': 'dark_oak_stairs',
                'ROOF_BAMBOO': 'bamboo_stairs',
                'ROOF_STONE': 'stone_brick_stairs',
                'ROOF_DEEPSLATE': 'deepslate_tile_stairs',
                'ROOF_BLACKSTONE': 'polished_blackstone_brick_stairs',
                'ROOF_RED': 'red_nether_brick_stairs',
                'ROOF_BLUE': 'dark_prismarine_stairs',
                'ROOF_GREEN': 'mossy_stone_brick_stairs',
                'ROOF_PURPLE': 'purpur_stairs',
                'ROOF_GOLD': 'sandstone_stairs',
                'ROOF_COPPER': 'cut_copper_stairs',
            };
            resolvedType = roofMappings[type] || 'dark_oak_stairs'; // Default fallback
            console.log(`[VoxelBuilder] Resolved roof type ${type} -> ${resolvedType}`);
        }

        this._drawRoofImpl(minX, y, minZ, width, depth, height, style, resolvedType, options);
    }

    /**
     * Internal implementation for drawing roofs.
     * Creates proper 45-degree A-frame roofs with stairs on all visible surfaces.
     * @private
     */
    _drawRoofImpl(x, y, z, width, depth, height, style, type, options = {}) {
        // Validation: Parameter Order Check
        const validStyles = ['straight', 'curve', 'arch', 'gambrel', 'gable', 'pyramid'];
        if (validStyles.includes(type) && !validStyles.includes(style)) {
            throw new Error(`[VoxelBuilder] drawRoof Argument Error: It looks like you swapped 'style' and 'type'. Correct order: style, material.`);
        }

        // ========== SMART MATERIAL DETECTION ==========
        let stairType = type;
        let solidType = type;

        const stairMappings = {
            'oak_stairs': { solid: 'oak_planks' },
            'spruce_stairs': { solid: 'spruce_planks' },
            'birch_stairs': { solid: 'birch_planks' },
            'dark_oak_stairs': { solid: 'dark_oak_planks' },
            'stone_stairs': { solid: 'stone' },
            'cobblestone_stairs': { solid: 'cobblestone' },
            'stone_brick_stairs': { solid: 'stone_bricks' },
            'brick_stairs': { solid: 'bricks' },
            'sandstone_stairs': { solid: 'sandstone' },
            'nether_brick_stairs': { solid: 'nether_bricks' },
            'quartz_stairs': { solid: 'quartz_block' },
            'prismarine_stairs': { solid: 'prismarine' },
            'dark_prismarine_stairs': { solid: 'dark_prismarine' },
            'purpur_stairs': { solid: 'purpur_block' },
            'deepslate_tile_stairs': { solid: 'deepslate_tiles' },
            'deepslate_brick_stairs': { solid: 'deepslate_bricks' },
            'polished_blackstone_stairs': { solid: 'polished_blackstone' },
            'cut_copper_stairs': { solid: 'cut_copper' },
            'bamboo_stairs': { solid: 'bamboo_planks' },
            'cherry_stairs': { solid: 'cherry_planks' },
            'red_nether_brick_stairs': { solid: 'red_nether_bricks' },
        };

        const baseType = type.replace(/\?.*$/, '');
        if (stairMappings[baseType]) {
            stairType = baseType;
            solidType = stairMappings[baseType].solid;
        } else if (baseType.includes('_stairs')) {
            stairType = baseType;
            solidType = baseType.replace('_stairs', 's').replace('ss', 's');
        } else {
            solidType = baseType;
            const possibleStair = baseType.replace('_bricks', '_brick_stairs')
                .replace('_planks', '_stairs')
                .replace('_tiles', '_tile_stairs');
            if (possibleStair !== baseType) {
                stairType = possibleStair;
            }
        }

        // ========== CALCULATE ROOF DIMENSIONS ==========
        const halfWidth = Math.floor(width / 2);
        const isOddWidth = width % 2 === 1;

        // Calculate slope ratio: how many Y levels to rise per horizontal step
        // Default 45 degrees (1:1) if height matches halfWidth, otherwise use custom slope
        const slopeRatio = height / halfWidth; // e.g., 1.0 = 45°, 2.0 = steeper, 0.5 = shallower

        // Save current priority for roof (use high priority to ensure roof is on top)
        const roofPriority = this.currentPriority || 60;

        // ========== BUILD ROOF LAYER BY LAYER ==========
        // 填充逻辑：
        // - 楼梯：放在计算出的 Y 位置（屋顶表面）
        // - 实心方块：原本的位置下移一格
        
        if (slopeRatio >= 1) {
            // STEEP or 45-degree roof: iterate by X layer
            // 修复：当宽度为偶数时，最后一层（layer == halfWidth）不需要向上移动
            const maxLayer = isOddWidth ? halfWidth : halfWidth - 1;
            
            for (let layer = 0; layer <= maxLayer; layer++) {
                const currentY = y + Math.floor(layer * slopeRatio);
                const prevY = layer > 0 ? y + Math.floor((layer - 1) * slopeRatio) : y - 1;

                const xLeft = x + layer;
                const xRight = x + width - 1 - layer;

                if (xLeft > xRight) continue;

                for (let zPos = z; zPos < z + depth; zPos++) {
                    // 楼梯放在当前 Y 位置（屋顶表面）
                    this.set(xLeft, currentY, zPos, `${stairType}?facing=east`, { priority: roofPriority });

                    // 实心方块：原本在 prevY+1 到 currentY-1，现在下移一格
                    for (let fillY = prevY + 1; fillY < currentY; fillY++) {
                        this.set(xLeft, fillY - 1, zPos, solidType, { priority: roofPriority });
                    }

                    if (xRight > xLeft) {
                        this.set(xRight, currentY, zPos, `${stairType}?facing=west`, { priority: roofPriority });
                        
                        for (let fillY = prevY + 1; fillY < currentY; fillY++) {
                            this.set(xRight, fillY - 1, zPos, solidType, { priority: roofPriority });
                        }
                    } else if (xRight === xLeft && isOddWidth) {
                        // 奇数宽度的屋脊：只放一个方块，不需要额外处理
                        // 已经在上面放了 facing=east 的楼梯
                    }
                }
            }
            
            // 偶数宽度时，在最顶层放置两个相对的楼梯
            if (!isOddWidth) {
                const topY = y + Math.floor(halfWidth * slopeRatio);
                const centerLeft = x + halfWidth - 1;
                const centerRight = x + halfWidth;
                
                for (let zPos = z; zPos < z + depth; zPos++) {
                    // 两个楼梯面对面，形成屋脊
                    this.set(centerLeft, topY, zPos, `${stairType}?facing=east`, { priority: roofPriority });
                    this.set(centerRight, topY, zPos, `${stairType}?facing=west`, { priority: roofPriority });
                }
            }
        } else {
            // SHALLOW roof (slopeRatio < 1): iterate by Y level to avoid gaps
            // 对于平缓屋顶，同一 Y 层可能有多个 X 位置
            for (let relY = 0; relY <= height; relY++) {
                const currentY = y + relY;
                
                // Calculate which X layers correspond to this Y level
                const layerStart = Math.floor(relY / slopeRatio);
                const layerEnd = relY < height ? Math.floor((relY + 1) / slopeRatio) - 1 : halfWidth;
                
                for (let layer = layerStart; layer <= Math.min(layerEnd, halfWidth); layer++) {
                    const xLeft = x + layer;
                    const xRight = x + width - 1 - layer;

                    if (xLeft > xRight) continue;

                    // 判断是否是该 X 位置的最高点（放楼梯）还是内侧（放实心方块）
                    const isTopSurface = (layer >= layerEnd) || (relY === height);

                    for (let zPos = z; zPos < z + depth; zPos++) {
                        if (isTopSurface) {
                            // 楼梯放在当前 Y 位置
                            this.set(xLeft, currentY, zPos, `${stairType}?facing=east`, { priority: roofPriority });
                        } else {
                            // 实心方块：原本在 currentY，现在下移一格到 currentY-1
                            this.set(xLeft, currentY - 1, zPos, solidType, { priority: roofPriority });
                        }

                        if (xRight > xLeft) {
                            if (isTopSurface) {
                                this.set(xRight, currentY, zPos, `${stairType}?facing=west`, { priority: roofPriority });
                            } else {
                                this.set(xRight, currentY - 1, zPos, solidType, { priority: roofPriority });
                            }
                        }
                    }
                }
            }
        }

        // ========== AUTO-GABLE FILLING ==========
        // Gable fills with LOWER priority than roof to ensure roof stairs are never overwritten
        if (options && options.gable) {
            const gableMat = options.gable;
            const offset = options.gableOffset ?? 1;

            // Gable priority MUST be lower than roof priority
            const gablePriority = roofPriority - 10;

            // Gable positions (front and back walls)
            const zStart = z + offset;
            const zEnd = z + depth - 1 - offset;

            // Fill the triangular gable area using the same slope ratio as the roof
            const totalRoofHeight = Math.ceil(halfWidth * slopeRatio);

            // For each Y level from base to peak, calculate which X range should be filled
            for (let relY = 0; relY < totalRoofHeight; relY++) {
                const fillY = y + relY;

                // At this Y level, how many horizontal steps has the roof progressed?
                const layer = Math.floor(relY / slopeRatio);

                // X range for the gable at this Y level (inside the roof by 1 block)
                const fillXLeft = x + layer + 1;
                const fillXRight = x + width - 1 - layer - 1;

                if (fillXLeft <= fillXRight) {
                    // Front and back gable - use lower priority so roof wins
                    for (let gx = fillXLeft; gx <= fillXRight; gx++) {
                        this.set(gx, fillY, zStart, gableMat, { priority: gablePriority });
                        this.set(gx, fillY, zEnd, gableMat, { priority: gablePriority });
                    }
                } else {
                    // Peak case: single center block(s)
                    const centerX = Math.floor(x + width / 2);
                    if (isOddWidth) {
                        this.set(centerX, fillY, zStart, gableMat, { priority: gablePriority });
                        this.set(centerX, fillY, zEnd, gableMat, { priority: gablePriority });
                    }
                }
            }
        }

        // ========== AUTO-RIDGE DECORATION ==========
        // Ridge is a line along the roof peak
        if (options && options.ridge) {
            const ridgeMat = options.ridge;
            const ridgePriority = roofPriority + 5; // Slightly higher than roof

            // Calculate peak Y position
            // 奇数宽度：最高点在 halfWidth 层
            // 偶数宽度：最高点在 halfWidth 层（两个楼梯并排）
            const peakY = y + Math.floor(halfWidth * slopeRatio);

            // Ridge runs along Z axis (the length of the building)
            // Center X position
            const centerX = Math.floor(x + width / 2);

            // Place ridge along the peak (same length as roof: z to z+depth-1)
            for (let zPos = z; zPos < z + depth; zPos++) {
                if (isOddWidth) {
                    // Single center line for odd width
                    this.set(centerX, peakY, zPos, ridgeMat, { priority: ridgePriority });
                } else {
                    // For even width, ridge goes on top of the two center stairs
                    // 偶数宽度时，屋脊放在两个中心楼梯的上方
                    this.set(centerX - 1, peakY + 1, zPos, ridgeMat, { priority: ridgePriority });
                    this.set(centerX, peakY + 1, zPos, ridgeMat, { priority: ridgePriority });
                }
            }
        }
    }

    /**
     * Draw a Cylinder (or Tube)
     * @param {number} x, y, z - Center bottom
     * @param {number} radius - Radius
     * @param {number} height - Height
     * @param {string} type - Material
     * @param {Object} options - { hollow: boolean, thickness: number, axis: 'y'|'x'|'z', noise: { amount: 0-1, scale: 0.1-1 }, rotateX: degrees, rotateY: degrees, rotateZ: degrees }
     */
    drawCylinder(x, y, z, radius, height, type, options = {}) {
        const { hollow = false, thickness = 1, axis = 'y', noise = null, rotateX = 0, rotateY = 0, rotateZ = 0 } = options;

        // Check if using arbitrary rotation (rotateX/Y/Z) vs simple axis
        const hasRotation = rotateX !== 0 || rotateY !== 0 || rotateZ !== 0;

        if (hasRotation) {
            // Use rotation matrix approach for arbitrary angles
            const radX = (rotateX * Math.PI) / 180;
            const radY = (rotateY * Math.PI) / 180;
            const radZ = (rotateZ * Math.PI) / 180;

            const cosX = Math.cos(radX), sinX = Math.sin(radX);
            const cosY = Math.cos(radY), sinY = Math.sin(radY);
            const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ);

            // Inverse rotation to check if point is inside rotated cylinder
            const inverseRotate = (dx, dy, dz) => {
                let x1 = dx * cosZ + dy * sinZ;
                let y1 = -dx * sinZ + dy * cosZ;
                let z1 = dz;
                let x2 = x1 * cosY - z1 * sinY;
                let y2 = y1;
                let z2 = x1 * sinY + z1 * cosY;
                let x3 = x2;
                let y3 = y2 * cosX + z2 * sinX;
                let z3 = -y2 * sinX + z2 * cosX;
                return [x3, y3, z3];
            };

            const noiseExpand = noise ? (noise.amount || 0.3) * 2 : 0;
            const maxR = Math.max(radius, height / 2) + noiseExpand;
            const bound = Math.ceil(maxR + height / 2);

            for (let dx = -bound; dx <= bound; dx++) {
                for (let dy = -bound; dy <= bound; dy++) {
                    for (let dz = -bound; dz <= bound; dz++) {
                        // Transform to local coordinates (cylinder centered at origin, extending along Y)
                        const [lx, ly, lz] = inverseRotate(dx, dy - height / 2, dz);

                        // Check if inside cylinder (Y is the height axis in local space)
                        const localY = ly + height / 2; // Shift back to 0-height range
                        if (localY < 0 || localY >= height) continue;

                        let dist = Math.sqrt(lx * lx + lz * lz);

                        if (noise) {
                            const noiseVal = this._noise3D(lx, localY, lz, noise.scale || 0.3);
                            dist -= noiseVal * (noise.amount || 0.3) * radius;
                        }

                        let shouldPlace = false;
                        if (hollow) {
                            shouldPlace = dist <= radius && dist >= (radius - thickness);
                        } else {
                            shouldPlace = dist <= radius;
                        }

                        if (shouldPlace) {
                            this.set(x + dx, y + dy, z + dz, type);
                        }
                    }
                }
            }
        } else {
            // Original simple axis-based approach (faster for axis-aligned cylinders)
            const range = Math.ceil(radius + (noise?.amount || 0) * 2);

            for (let dx = -range; dx <= range; dx++) {
                for (let dz = -range; dz <= range; dz++) {
                    for (let dy = 0; dy < height; dy++) {
                        const dist2 = dx * dx + dz * dz;
                        let dist = Math.sqrt(dist2);

                        if (noise) {
                            const noiseVal = this._noise3D(dx, dy, dz, noise.scale || 0.3);
                            dist -= noiseVal * (noise.amount || 0.3) * radius;
                        }

                        let shouldPlace = false;
                        if (hollow) {
                            shouldPlace = dist <= radius && dist >= (radius - thickness);
                        } else {
                            shouldPlace = dist <= radius;
                        }

                        if (shouldPlace) {
                            if (axis === 'y') this.set(x + dx, y + dy, z + dz, type);
                            else if (axis === 'x') this.set(x + dy, y + dx, z + dz, type);
                            else this.set(x + dx, y + dz, z + dy, type);
                        }
                    }
                }
            }
        }
    }

    /**
     * Draw a Regular Polygon (Triangle, Square, Hexagon, Octagon, etc.)
     * @param {number} x, y, z - Center bottom
     * @param {number} radius - Radius
     * @param {number} sides - Number of sides (3+)
     * @param {number} height - Height
     * @param {string} type - Material
     * @param {Object} options - { hollow: boolean, thickness: number, rotation: degrees (Y-axis), rotateX: degrees, rotateY: degrees, rotateZ: degrees, noise: { amount: 0-1, scale: 0.1-1 } }
     */
    drawPolygon(x, y, z, radius, sides, height, type, options = {}) {
        const { hollow = false, thickness = 1, rotation = 0, rotateX = 0, rotateY = 0, rotateZ = 0, noise = null } = options;
        if (sides < 3) return;

        // Check if using 3D rotation
        const has3DRotation = rotateX !== 0 || rotateY !== 0 || rotateZ !== 0;

        if (has3DRotation) {
            // Use rotation matrix for arbitrary 3D rotation
            const radX = (rotateX * Math.PI) / 180;
            const radY = (rotateY * Math.PI) / 180;
            const radZ = (rotateZ * Math.PI) / 180;

            const cosX = Math.cos(radX), sinX = Math.sin(radX);
            const cosY = Math.cos(radY), sinY = Math.sin(radY);
            const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ);

            const inverseRotate = (dx, dy, dz) => {
                let x1 = dx * cosZ + dy * sinZ;
                let y1 = -dx * sinZ + dy * cosZ;
                let z1 = dz;
                let x2 = x1 * cosY - z1 * sinY;
                let y2 = y1;
                let z2 = x1 * sinY + z1 * cosY;
                let x3 = x2;
                let y3 = y2 * cosX + z2 * sinX;
                let z3 = -y2 * sinX + z2 * cosX;
                return [x3, y3, z3];
            };

            const rotRad = (rotation * Math.PI) / 180; // Additional Y rotation for polygon shape
            const sectorAngle = (2 * Math.PI) / sides;
            const noiseExpand = noise ? (noise.amount || 0.3) * 2 : 0;
            const maxR = Math.max(radius, height / 2) + noiseExpand;
            const bound = Math.ceil(maxR + height / 2);

            for (let dx = -bound; dx <= bound; dx++) {
                for (let dy = -bound; dy <= bound; dy++) {
                    for (let dz = -bound; dz <= bound; dz++) {
                        const [lx, ly, lz] = inverseRotate(dx, dy - height / 2, dz);
                        const localY = ly + height / 2;

                        if (localY < 0 || localY >= height) continue;

                        // Check polygon boundary in local XZ plane
                        let angle = Math.atan2(lz, lx) - rotRad;
                        while (angle < 0) angle += 2 * Math.PI;
                        while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;

                        const dist = Math.sqrt(lx * lx + lz * lz);
                        const sectorIdx = Math.floor(angle / sectorAngle);
                        const sectorCenter = sectorIdx * sectorAngle + sectorAngle / 2;
                        const alpha = angle - sectorCenter;
                        let maxDist = radius * Math.cos(sectorAngle / 2) / Math.cos(alpha);

                        if (noise) {
                            const noiseVal = this._noise3D(lx, localY, lz, noise.scale || 0.3);
                            maxDist += noiseVal * (noise.amount || 0.3) * radius * 0.3;
                        }

                        let shouldPlace = false;
                        if (hollow) {
                            const innerRadius = radius - thickness;
                            let innerMaxDist = innerRadius * Math.cos(sectorAngle / 2) / Math.cos(alpha);
                            if (noise) {
                                const noiseVal = this._noise3D(lx, localY, lz, noise.scale || 0.3);
                                innerMaxDist += noiseVal * (noise.amount || 0.3) * radius * 0.3;
                            }
                            shouldPlace = dist <= maxDist && dist > innerMaxDist;
                        } else {
                            shouldPlace = dist <= maxDist;
                        }

                        if (shouldPlace) {
                            this.set(x + dx, y + dy, z + dz, type);
                        }
                    }
                }
            }
        } else {
            // Original Y-axis rotation only (faster)
            const rotRad = (rotation * Math.PI) / 180;
            const sectorAngle = (2 * Math.PI) / sides;
            const noiseExpand = noise ? (noise.amount || 0.3) * 2 : 0;
            const range = Math.ceil(radius + noiseExpand);

            for (let dx = -range; dx <= range; dx++) {
                for (let dz = -range; dz <= range; dz++) {
                    let angle = Math.atan2(dz, dx) - rotRad;
                    while (angle < 0) angle += 2 * Math.PI;
                    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;

                    const dist = Math.sqrt(dx * dx + dz * dz);
                    const sectorIdx = Math.floor(angle / sectorAngle);
                    const sectorCenter = sectorIdx * sectorAngle + sectorAngle / 2;
                    const alpha = angle - sectorCenter;
                    let maxDist = radius * Math.cos(sectorAngle / 2) / Math.cos(alpha);

                    if (noise) {
                        for (let dy = 0; dy < height; dy++) {
                            const noiseVal = this._noise3D(dx, dy, dz, noise.scale || 0.3);
                            const noisyMaxDist = maxDist + noiseVal * (noise.amount || 0.3) * radius * 0.3;

                            let shouldPlace = false;
                            if (hollow) {
                                const innerRadius = radius - thickness;
                                const innerMaxDist = innerRadius * Math.cos(sectorAngle / 2) / Math.cos(alpha);
                                const noisyInnerDist = innerMaxDist + noiseVal * (noise.amount || 0.3) * radius * 0.3;
                                shouldPlace = dist <= noisyMaxDist && dist > noisyInnerDist;
                            } else {
                                shouldPlace = dist <= noisyMaxDist;
                            }

                            if (shouldPlace) {
                                this.set(x + dx, y + dy, z + dz, type);
                            }
                        }
                    } else {
                        let shouldPlace = false;
                        if (hollow) {
                            const innerRadius = radius - thickness;
                            const innerMaxDist = innerRadius * Math.cos(sectorAngle / 2) / Math.cos(alpha);
                            shouldPlace = dist <= maxDist && dist > innerMaxDist;
                        } else {
                            shouldPlace = dist <= maxDist;
                        }

                        if (shouldPlace) {
                            for (let dy = 0; dy < height; dy++) {
                                this.set(x + dx, y + dy, z + dz, type);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Draw an Ellipsoid (Sphere is special case where rx=ry=rz)
     * Axiom-style primitive.
     * @param {number} x, y, z - Center
     * @param {number} rx, ry, rz - Radii
     * @param {string} type - Material
     * @param {Object} options - { hollow: boolean, noise: { amount: 0-1, scale: 0.1-1 }, rotateX: degrees, rotateY: degrees, rotateZ: degrees }
     */
    drawEllipsoid(x, y, z, rx, ry, rz, type, options = {}) {
        const { hollow = false, noise = null, rotateX = 0, rotateY = 0, rotateZ = 0 } = options;
        const noiseExpand = noise ? (noise.amount || 0.3) * 2 : 0;

        // Convert rotation angles to radians
        const radX = (rotateX * Math.PI) / 180;
        const radY = (rotateY * Math.PI) / 180;
        const radZ = (rotateZ * Math.PI) / 180;

        // Precompute sin/cos for rotation matrices
        const cosX = Math.cos(radX), sinX = Math.sin(radX);
        const cosY = Math.cos(radY), sinY = Math.sin(radY);
        const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ);

        // Helper: Apply inverse rotation to check if point is inside rotated ellipsoid
        const inverseRotate = (dx, dy, dz) => {
            // Apply rotations in reverse order (Z, Y, X) to get local coordinates
            // Rotate around Z
            let x1 = dx * cosZ + dy * sinZ;
            let y1 = -dx * sinZ + dy * cosZ;
            let z1 = dz;
            // Rotate around Y
            let x2 = x1 * cosY - z1 * sinY;
            let y2 = y1;
            let z2 = x1 * sinY + z1 * cosY;
            // Rotate around X
            let x3 = x2;
            let y3 = y2 * cosX + z2 * sinX;
            let z3 = -y2 * sinX + z2 * cosX;
            return [x3, y3, z3];
        };

        // Bounding box needs to be larger to account for rotation
        const maxR = Math.max(rx, ry, rz) + noiseExpand;
        const minB = Math.floor(-maxR), maxB = Math.ceil(maxR);

        for (let dx = minB; dx <= maxB; dx++) {
            for (let dy = minB; dy <= maxB; dy++) {
                for (let dz = minB; dz <= maxB; dz++) {
                    // Transform to local (unrotated) coordinates
                    const [lx, ly, lz] = inverseRotate(dx, dy, dz);

                    // Ellipsoid equation: (x/a)^2 + (y/b)^2 + (z/c)^2 <= 1
                    let dist = (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) + (lz * lz) / (rz * rz);

                    // Apply noise to make organic shape
                    if (noise) {
                        const noiseVal = this._noise3D(lx, ly, lz, noise.scale || 0.3);
                        dist -= noiseVal * (noise.amount || 0.3);
                    }

                    if (dist <= 1.0) {
                        if (hollow) {
                            const irx = rx - 1, iry = ry - 1, irz = rz - 1;
                            if (irx > 0 && iry > 0 && irz > 0) {
                                let innerDist = (lx * lx) / (irx * irx) + (ly * ly) / (iry * iry) + (lz * lz) / (irz * irz);
                                if (noise) {
                                    const noiseVal = this._noise3D(lx, ly, lz, noise.scale || 0.3);
                                    innerDist -= noiseVal * (noise.amount || 0.3);
                                }
                                if (innerDist <= 1.0) continue;
                            }
                        }
                        this.set(x + dx, y + dy, z + dz, type);
                    }
                }
            }
        }
    }

    // Alias for Sphere with noise support
    drawSphere(x, y, z, radius, type, options = {}) {
        this.drawEllipsoid(x, y, z, radius, radius, radius, type, options);
    }

    /**
     * Draw a Torus (Donut)
     * @param {number} x, y, z - Center
     * @param {number} R - Major radius (distance from center to tube center)
     * @param {number} r - Minor radius (tube thickness radius)
     * @param {string} type - Material
     * @param {Object} options - { axis: 'y'|'x'|'z', noise: { amount: 0-1, scale: 0.1-1 }, rotateX: degrees, rotateY: degrees, rotateZ: degrees }
     */
    drawTorus(x, y, z, R, r, type, options = {}) {
        const { axis = 'y', noise = null, rotateX = 0, rotateY = 0, rotateZ = 0 } = options;
        const noiseExpand = noise ? (noise.amount || 0.3) * 2 : 0;
        const totalR = R + r + 1 + noiseExpand;

        // Check if using arbitrary rotation
        const hasRotation = rotateX !== 0 || rotateY !== 0 || rotateZ !== 0;

        if (hasRotation) {
            const radX = (rotateX * Math.PI) / 180;
            const radY = (rotateY * Math.PI) / 180;
            const radZ = (rotateZ * Math.PI) / 180;

            const cosX = Math.cos(radX), sinX = Math.sin(radX);
            const cosY = Math.cos(radY), sinY = Math.sin(radY);
            const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ);

            const inverseRotate = (dx, dy, dz) => {
                let x1 = dx * cosZ + dy * sinZ;
                let y1 = -dx * sinZ + dy * cosZ;
                let z1 = dz;
                let x2 = x1 * cosY - z1 * sinY;
                let y2 = y1;
                let z2 = x1 * sinY + z1 * cosY;
                let x3 = x2;
                let y3 = y2 * cosX + z2 * sinX;
                let z3 = -y2 * sinX + z2 * cosX;
                return [x3, y3, z3];
            };

            const bound = Math.ceil(totalR);

            for (let dx = -bound; dx <= bound; dx++) {
                for (let dy = -bound; dy <= bound; dy++) {
                    for (let dz = -bound; dz <= bound; dz++) {
                        const [lx, ly, lz] = inverseRotate(dx, dy, dz);

                        // Torus equation in local space (ring in XZ plane, Y is up)
                        const distToRingCenter = Math.sqrt(lx * lx + lz * lz) - R;
                        let tubeDist = distToRingCenter * distToRingCenter + ly * ly;

                        if (noise) {
                            const noiseVal = this._noise3D(lx, ly, lz, noise.scale || 0.3);
                            tubeDist -= noiseVal * (noise.amount || 0.3) * r * r;
                        }

                        if (tubeDist <= r * r) {
                            this.set(x + dx, y + dy, z + dz, type);
                        }
                    }
                }
            }
        } else {
            // Original axis-based approach
            for (let dx = -Math.ceil(totalR); dx <= Math.ceil(totalR); dx++) {
                for (let dy = -Math.ceil(r + noiseExpand); dy <= Math.ceil(r + noiseExpand); dy++) {
                    for (let dz = -Math.ceil(totalR); dz <= Math.ceil(totalR); dz++) {
                        let shouldPlace = false;

                        if (axis === 'y') {
                            const distToRingCenter = Math.sqrt(dx * dx + dz * dz) - R;
                            let tubeDist = distToRingCenter * distToRingCenter + dy * dy;
                            if (noise) {
                                const noiseVal = this._noise3D(dx, dy, dz, noise.scale || 0.3);
                                tubeDist -= noiseVal * (noise.amount || 0.3) * r * r;
                            }
                            shouldPlace = tubeDist <= r * r;
                        }
                        else if (axis === 'x') {
                            const distToRingCenter = Math.sqrt(dy * dy + dz * dz) - R;
                            let tubeDist = distToRingCenter * distToRingCenter + dx * dx;
                            if (noise) {
                                const noiseVal = this._noise3D(dx, dy, dz, noise.scale || 0.3);
                                tubeDist -= noiseVal * (noise.amount || 0.3) * r * r;
                            }
                            shouldPlace = tubeDist <= r * r;
                        }
                        else if (axis === 'z') {
                            const distToRingCenter = Math.sqrt(dx * dx + dy * dy) - R;
                            let tubeDist = distToRingCenter * distToRingCenter + dz * dz;
                            if (noise) {
                                const noiseVal = this._noise3D(dx, dy, dz, noise.scale || 0.3);
                                tubeDist -= noiseVal * (noise.amount || 0.3) * r * r;
                            }
                            shouldPlace = tubeDist <= r * r;
                        }

                        if (shouldPlace) {
                            this.set(x + dx, y + dy, z + dz, type);
                        }
                    }
                }
            }
        }
    }

    /**
     * Draw a Pyramid
     * @param {number} x, y, z - Bottom Center
     * @param {number} baseSize - Side length
     * @param {number} height 
     * @param {string} type 
     * @param {Object} options - { filled: true, noise: { amount: 0-1, scale: 0.1-1 }, rotateX: degrees, rotateY: degrees, rotateZ: degrees }
     */
    drawPyramid(x, y, z, baseSize, height, type, options = {}) {
        const { filled = true, noise = null, rotateX = 0, rotateY = 0, rotateZ = 0 } = options;
        const half = baseSize / 2;

        // Check if using arbitrary rotation
        const hasRotation = rotateX !== 0 || rotateY !== 0 || rotateZ !== 0;

        if (hasRotation) {
            const radX = (rotateX * Math.PI) / 180;
            const radY = (rotateY * Math.PI) / 180;
            const radZ = (rotateZ * Math.PI) / 180;

            const cosX = Math.cos(radX), sinX = Math.sin(radX);
            const cosY = Math.cos(radY), sinY = Math.sin(radY);
            const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ);

            const inverseRotate = (dx, dy, dz) => {
                let x1 = dx * cosZ + dy * sinZ;
                let y1 = -dx * sinZ + dy * cosZ;
                let z1 = dz;
                let x2 = x1 * cosY - z1 * sinY;
                let y2 = y1;
                let z2 = x1 * sinY + z1 * cosY;
                let x3 = x2;
                let y3 = y2 * cosX + z2 * sinX;
                let z3 = -y2 * sinX + z2 * cosX;
                return [x3, y3, z3];
            };

            const noiseExpand = noise ? (noise.amount || 0.3) * 2 : 0;
            const maxR = Math.max(half, height) + noiseExpand;
            const bound = Math.ceil(maxR);

            for (let dx = -bound; dx <= bound; dx++) {
                for (let dy = -bound; dy <= bound; dy++) {
                    for (let dz = -bound; dz <= bound; dz++) {
                        const [lx, ly, lz] = inverseRotate(dx, dy, dz);

                        // Check if inside pyramid in local space
                        if (ly < 0 || ly >= height) continue;

                        const t = ly / height;
                        const currentSize = baseSize * (1 - t);
                        let baseR = currentSize / 2;

                        if (noise) {
                            const noiseVal = this._noise3D(lx, ly, lz, noise.scale || 0.3);
                            baseR += noiseVal * (noise.amount || 0.3) * baseR * 0.5;
                        }

                        const dist = Math.max(Math.abs(lx), Math.abs(lz));

                        let shouldPlace = false;
                        if (dist <= baseR) {
                            if (filled || dist >= baseR - 1) {
                                shouldPlace = true;
                            }
                        }

                        if (shouldPlace) {
                            this.set(x + dx, y + dy, z + dz, type);
                        }
                    }
                }
            }
        } else {
            // Original non-rotated approach
            for (let yi = 0; yi < height; yi++) {
                const t = yi / height;
                const currentSize = baseSize * (1 - t);
                const baseR = Math.floor(currentSize / 2);

                if (noise) {
                    for (let dx = -baseR - 1; dx <= baseR + 1; dx++) {
                        for (let dz = -baseR - 1; dz <= baseR + 1; dz++) {
                            const dist = Math.max(Math.abs(dx), Math.abs(dz));
                            const noiseVal = this._noise3D(dx, yi, dz, noise.scale || 0.3);
                            const noisyR = baseR + noiseVal * (noise.amount || 0.3) * baseR * 0.5;

                            if (dist <= noisyR) {
                                if (filled || dist >= noisyR - 1) {
                                    this.set(x + dx, y + yi, z + dz, type);
                                }
                            }
                        }
                    }
                } else {
                    if (filled) {
                        this.fill(x - baseR, y + yi, z - baseR, x + baseR, y + yi, z + baseR, type);
                    } else {
                        this.walls(x - baseR, y + yi, z - baseR, x + baseR, y + yi, z + baseR, type);
                    }
                }
            }
        }
    }

    /**
     * Draw a Bezier Curve (3 or 4 points)
     * Great for cables, hanging bridges, vines, dragon bodies!
     * @param {Array} points - Array of {x,y,z} objects. 3 points = Quadratic, 4 points = Cubic
     * @param {string} type - Material
     * @param {number} width - Thickness of line
     */
    drawBezier(points, type, width = 1) {
        if (points.length < 3) {
            // Fallback to straight line
            if (points.length === 2) this.line(points[0].x, points[0].y, points[0].z, points[1].x, points[1].y, points[1].z, type);
            return;
        }

        // Estimate length to determine segment count
        // Rough distance sum
        let totalDist = 0;
        for (let i = 0; i < points.length - 1; i++) {
            const dx = points[i + 1].x - points[i].x;
            const dy = points[i + 1].y - points[i].y;
            const dz = points[i + 1].z - points[i].z;
            totalDist += Math.sqrt(dx * dx + dy * dy + dz * dz);
        }

        const segments = Math.ceil(totalDist * 2); // 2 samples per block for smoothness

        let prev = points[0];

        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            let curr = { x: 0, y: 0, z: 0 };

            if (points.length === 3) {
                // Quadratic Bezier: (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
                const p0 = points[0], p1 = points[1], p2 = points[2];
                const mt = 1 - t;
                curr.x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
                curr.y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
                curr.z = mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z;
            } else if (points.length === 4) {
                // Cubic Bezier: (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t)t^2 P2 + t^3 P3
                const p0 = points[0], p1 = points[1], p2 = points[2], p3 = points[3];
                const mt = 1 - t;
                const mt2 = mt * mt, t2 = t * t;
                curr.x = mt * mt2 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t * t * t * p3.x;
                curr.y = mt * mt2 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t * t * t * p3.y;
                curr.z = mt * mt2 * p0.z + 3 * mt2 * t * p1.z + 3 * mt * t2 * p2.z + t * t * t * p3.z;
            }

            // Draw segment from prev to curr
            // If width > 1, make it a tube? For now, stick to lines
            // Simple Bresenham line between sample points ensures continuity
            this.line(Math.round(prev.x), Math.round(prev.y), Math.round(prev.z),
                Math.round(curr.x), Math.round(curr.y), Math.round(curr.z), type);

            prev = curr;
        }
    }

    /**
     * Scatter blocks randomly within an area
     * Great for grass, flowers, or texturing walls
     * @param {number} x1, y1, z1, x2, z2 - Bounding box (y1 is the surface level)
     * @param {number} density - 0.0 to 1.0, chance of placing a block at each position
     * @param {string|Array} types - Single type or array of types to randomly choose from
     * @param {Object} options - { requireSupport: boolean } - only place if block below exists
     */
    /**
     * Scatter blocks randomly on a 2D surface at a specific Y level.
     * @param {number} x1, y, z1, x2, z2 - Bounding box (y is the surface level)
     * @param {number} density - 0.0 to 1.0
     * @param {string|Array} types - Block types
     * @param {Object} options - { requireSupport: boolean }
     */
    scatter(x1, y, z1, x2, z2, density, types, options = {}) {
        // Forward to 3D implementation with flat volume (y1=y, y2=y)
        this.scatter3D(x1, y, z1, x2, y, z2, density, types, options);
    }

    /**
     * Scatter blocks randomly within a 3D volume.
     * @param {number} x1, y1, z1, x2, y2, z2 - Bounding box
     * @param {number} density - 0.0 to 1.0
     * @param {string|Array} types - Block types
     * @param {Object} options - { requireSupport: boolean }
     */
    scatter3D(x1, y1, z1, x2, y2, z2, density, types, options = {}) {
        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
        const minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);
        const requireSupport = options.requireSupport !== false; // Default true

        if (!types) {
            console.warn('VoxelBuilder.scatter3D: types is undefined');
            return;
        }
        const typeArray = Array.isArray(types) ? types : [types];

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    if (Math.random() < density) {
                        // Check if there's a supporting block below
                        if (requireSupport) {
                            const below = this.get(x, y - 1, z);
                            if (!below) continue; // No support, skip this position
                        }

                        // Check if position is empty (don't overwrite existing blocks)
                        const current = this.get(x, y, z);
                        if (current) continue; // Already occupied

                        const type = typeArray[Math.floor(Math.random() * typeArray.length)];
                        this.set(x, y, z, type);
                    }
                }
            }
        }
    }

    /**
     * Draw Hanging/Draping elements (Weeping Willow, Vines, Chains, etc.)
     * Creates natural-looking hanging strands from a starting point
     * @param {number} x, y, z - Starting point (top of the hang)
     * @param {Object} options - Configuration options
     *   - length: number - Average length of strands (default 5)
     *   - lengthVariation: number - Random variation in length (default 3)
     *   - count: number - Number of strands (default 1)
     *   - spread: number - How far strands can spread horizontally (default 0)
     *   - type: string|Array - Block type(s) to use (default 'vine')
     *   - tipType: string - Optional different block for the tip
     *   - sway: number - Horizontal sway/curve amount (default 0)
     *   - swayDirection: 'random'|'north'|'south'|'east'|'west' - Direction of sway
     */
    drawHanging(x, y, z, options = {}) {
        const length = options.length || 5;
        const lengthVariation = options.lengthVariation || 3;
        const count = options.count || 1;
        const spread = options.spread || 0;
        const sway = options.sway || 0;
        const swayDirection = options.swayDirection || 'random';
        const tipType = options.tipType || null;

        // Normalize types to array
        const types = options.type || 'vine';
        const typeArray = Array.isArray(types) ? types : [types];

        for (let i = 0; i < count; i++) {
            // Calculate starting offset for this strand
            let sx = x, sz = z;
            if (spread > 0) {
                sx += Math.floor(Math.random() * (spread * 2 + 1)) - spread;
                sz += Math.floor(Math.random() * (spread * 2 + 1)) - spread;
            }

            // Calculate strand length
            const strandLength = Math.max(1, length + Math.floor(Math.random() * (lengthVariation * 2 + 1)) - lengthVariation);

            // Determine sway direction
            let swayDx = 0, swayDz = 0;
            if (sway > 0) {
                if (swayDirection === 'random') {
                    const dir = Math.floor(Math.random() * 4);
                    if (dir === 0) swayDx = 1;
                    else if (dir === 1) swayDx = -1;
                    else if (dir === 2) swayDz = 1;
                    else swayDz = -1;
                } else if (swayDirection === 'east') swayDx = 1;
                else if (swayDirection === 'west') swayDx = -1;
                else if (swayDirection === 'south') swayDz = 1;
                else if (swayDirection === 'north') swayDz = -1;
            }

            // Draw the strand
            let currentX = sx, currentZ = sz;
            for (let j = 0; j < strandLength; j++) {
                const currentY = y - j;

                // Apply sway (more towards the end)
                if (sway > 0 && j > 0) {
                    const swayProgress = j / strandLength;
                    const swayAmount = Math.floor(swayProgress * sway);
                    currentX = sx + swayDx * swayAmount;
                    currentZ = sz + swayDz * swayAmount;
                }

                // Select block type
                const isLast = j === strandLength - 1;
                let blockType;
                if (isLast && tipType) {
                    blockType = tipType;
                } else {
                    blockType = typeArray[Math.floor(Math.random() * typeArray.length)];
                }

                this.set(currentX, currentY, currentZ, blockType);
            }
        }
    }

    /**
     * Draw Hanging Ring - Creates hanging strands around a circle/polygon
     * Perfect for weeping willow tree canopy, chandelier chains, etc.
     * @param {number} x, y, z - Center position
     * @param {number} radius - Radius of the ring
     * @param {Object} options - Same as drawHanging, plus:
     *   - density: number - Chance of strand at each position (0.0-1.0, default 0.5)
     *   - innerRadius: number - Minimum radius (default 0, fills entire circle)
     */
    drawHangingRing(x, y, z, radius, options = {}) {
        const density = options.density || 0.5;
        const innerRadius = options.innerRadius || 0;

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const dist = Math.sqrt(dx * dx + dz * dz);

                // Check if within ring bounds
                if (dist <= radius && dist >= innerRadius) {
                    if (Math.random() < density) {
                        // Create a hanging strand at this edge position
                        this.drawHanging(x + dx, y, z + dz, {
                            ...options,
                            count: 1,
                            spread: 0 // No additional spread for ring
                        });
                    }
                }
            }
        }
    }

    /**
     * Draw Spiral Stairs
     * @param {number} x, y, z - Center bottom position
     * @param {number} radius - Radius of the spiral
     * @param {number} height - Total height
     * @param {string} type - Stair block type
     * @param {Object} options - { clockwise: boolean, turns: number, width: number }
     */
    drawSpiralStairs(x, y, z, radius, height, type, options = {}) {
        const clockwise = options.clockwise !== false; // Default true
        const turns = options.turns || 1; // How many full rotations
        const width = options.width || 2; // Width of each step

        const stepsPerRevolution = Math.ceil(2 * Math.PI * radius / 1.5); // Approx steps per full turn
        const totalSteps = Math.ceil(stepsPerRevolution * turns);
        const heightPerStep = height / totalSteps;
        const anglePerStep = (2 * Math.PI * turns) / totalSteps;

        for (let step = 0; step <= totalSteps; step++) {
            const angle = step * anglePerStep * (clockwise ? 1 : -1);
            const currentY = Math.floor(y + step * heightPerStep);

            // Draw step platform (wedge-shaped)
            for (let r = radius - width + 1; r <= radius; r++) {
                const sx = Math.round(x + Math.cos(angle) * r);
                const sz = Math.round(z + Math.sin(angle) * r);

                // Determine stair facing based on angle
                let facing;
                if (clockwise) {
                    if (angle >= -Math.PI / 4 && angle < Math.PI / 4) facing = 'south';
                    else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) facing = 'west';
                    else if (angle >= 3 * Math.PI / 4 || angle < -3 * Math.PI / 4) facing = 'north';
                    else facing = 'east';
                } else {
                    if (angle >= -Math.PI / 4 && angle < Math.PI / 4) facing = 'north';
                    else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) facing = 'east';
                    else if (angle >= 3 * Math.PI / 4 || angle < -3 * Math.PI / 4) facing = 'south';
                    else facing = 'west';
                }

                // Use stair at the outer edge, solid block at inner
                if (r === radius) {
                    this.set(sx, currentY, sz, `${type}?facing=${facing}`);
                } else {
                    // Inner part - use solid block derived from stair type
                    const solidType = type.replace('_stairs', '_planks')
                        .replace('_brick_stairs', '_bricks')
                        .replace('_tile_stairs', '_tiles');
                    this.set(sx, currentY, sz, solidType !== type ? solidType : 'stone');
                }
            }
        }

        // Optional: Add central pillar
        if (options.pillar) {
            const pillarType = options.pillarType || 'oak_log';
            for (let py = y; py <= y + height; py++) {
                this.set(x, py, z, pillarType);
            }
        }
    }

    /**
     * Define a reusable component template
     * @param {string} name - Component name (e.g., "gothic_pillar", "wall_segment")
     * @param {Function} buildFn - Function that takes (builder, params) and builds relative to origin
     */
    defineComponent(name, buildFn) {
        // Store the build function itself, not pre-built blocks
        // This allows params to work dynamically when placing
        this.components.set(name, { buildFn });
    }

    /**
     * Place an instance of a component at a specific location
     * @param {string} name - Component name
     * @param {number} x, y, z - World position
     * @param {object} params - Parameters to pass to the component's buildFn (e.g., { width: 2, hasPlanter: true })
     * @param {object} options - { rotateY: 0|90|180|270, groupName: string }
     */
    placeComponent(name, x, y, z, params = {}, options = {}) {
        const component = this.components.get(name);
        if (!component) {
            console.warn(`Component "${name}" not defined`);
            return;
        }

        const { rotateY = 0, groupName = name } = options;

        // Create a temporary builder to capture the component's blocks with the given params
        const tempBuilder = new VoxelBuilder();
        tempBuilder.components = new Map(this.components); // Inherit components for nesting

        // Build the component with the provided params
        component.buildFn(tempBuilder, params);

        // Start a group for this instance
        this.beginGroup(`${groupName}_${x}_${z}`);

        tempBuilder.voxels.forEach(block => {
            let dx = block.position[0];
            let dy = block.position[1];
            let dz = block.position[2];

            // Apply Y rotation to coordinates
            if (rotateY === 90) {
                [dx, dz] = [-dz, dx];
            } else if (rotateY === 180) {
                [dx, dz] = [-dx, -dz];
            } else if (rotateY === 270) {
                [dx, dz] = [dz, -dx];
            }

            // Rotate facing property if present
            let properties = block.properties;
            if (properties && rotateY !== 0) {
                const facingMatch = properties.match(/facing=(\w+)/);
                if (facingMatch) {
                    const currentFacing = facingMatch[1];
                    const facingRotation = {
                        90: { north: 'east', east: 'south', south: 'west', west: 'north' },
                        180: { north: 'south', east: 'west', south: 'north', west: 'east' },
                        270: { north: 'west', east: 'north', south: 'east', west: 'south' }
                    };
                    const newFacing = facingRotation[rotateY]?.[currentFacing] || currentFacing;
                    properties = properties.replace(/facing=\w+/, `facing=${newFacing}`);
                    console.log(`[placeComponent] Rotated facing: ${currentFacing} -> ${newFacing} (rotateY=${rotateY})`);
                }
            }

            const typeStr = properties ? `${block.type}?${properties}` : block.type;
            this.set(x + dx, y + dy, z + dz, typeStr);
        });

        this.endGroup();
    }
}

/**
 * Executes the Javascript code string and returns voxel data.
 * @param {string} code - The JS code body.
 * @param {boolean} throwOnError - If true, throws actual script errors instead of returning [].
 * @returns {Array} List of voxel objects
 */
export const executeVoxelScript = (code, throwOnError = false) => {
    try {
        const builder = new VoxelBuilder();

        let cleanCode = code;
        // Robust markdown extraction... (omitted for brevity, keep logic same)
        if (code.includes('```')) {
            const matches = code.match(/```(?:javascript|js)?\s*([\s\S]*?)```/g);
            if (matches) {
                cleanCode = matches.map(m => m.replace(/```(?:javascript|js)?|```/g, '')).join('\n');
            } else {
                const openMatch = code.match(/```(?:javascript|js)?\s*([\s\S]*?)$/);
                if (openMatch && openMatch[1]) cleanCode = openMatch[1];
            }
        }
        cleanCode = cleanCode.trim();

        if (!cleanCode) return [];
        if (!cleanCode.includes('builder.') && !cleanCode.includes('for (') && !cleanCode.includes('const ')) return [];

        try {
            const sandboxFn = new Function('builder', cleanCode);
            sandboxFn(builder);
            return builder.voxels;
        } catch (scriptErr) {
            // If strictly creating, we want to know WHY it failed
            if (throwOnError) {
                throw scriptErr;
            }
            // Otherwise (streaming preview), suppress errors
            return [];
        }

    } catch (error) {
        if (throwOnError) throw error;
        console.error("Sandbox Error:", error);
        return [];
    }
};
