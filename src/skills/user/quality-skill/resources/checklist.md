---
name: Quality Checklist
description: 建筑质量检查清单
---

# 📋 Quality Checklist

Complete this checklist before finalizing any build.

## 1. Structural Integrity

### Walls
- [ ] All exterior walls are fully closed (no gaps)
- [ ] Interior walls properly connect to exterior
- [ ] Wall height matches roof starting point

### Gables
- [ ] Triangular gable areas under sloped roofs are FILLED
- [ ] Gable material matches wall or is complementary
- [ ] No gaps visible from inside

**Gable Fix Template:**
```javascript
// Fill front gable triangle
builder.beginGroup('gables', { priority: 50 });
for (let i = 0; i < roofHeight; i++) {
  builder.fill(-halfWidth + i, wallTop + i, frontZ, 
               halfWidth - i, wallTop + i, frontZ, 'wall_material');
}
builder.endGroup();
```

### Roof
- [ ] Roof is properly sealed (no holes)
- [ ] Roof extends beyond walls (overhang)
- [ ] Chimney (if present) passes through roof

### Floor
- [ ] Foundation/floor is complete
- [ ] No holes in floor
- [ ] Floor material is appropriate for style

---

## 2. Detail Completeness

### Windows
- [ ] Windows have shutters (trapdoors) or frames
- [ ] Windows are placed at appropriate heights
- [ ] Window style matches building style

**Window Fix Template:**
```javascript
// Window with shutters
builder.set(x, y, z, 'glass_pane');
builder.set(x-1, y, z-1, 'spruce_trapdoor?facing=east,open=true');  // Left shutter
builder.set(x+1, y, z-1, 'spruce_trapdoor?facing=west,open=true');  // Right shutter
```

### Doors
- [ ] Door has proper entrance (steps or porch)
- [ ] Door overhang if style appropriate
- [ ] Path leading to door

**Entrance Fix Template:**
```javascript
// Door entrance
builder.set(x, y-1, z-1, 'stone_stairs?facing=south');  // Step
builder.fill(x-1, y+2, z-1, x+1, y+2, z-1, 'stone_slab?type=top');  // Overhang
```

### Interior
- [ ] Furniture appropriate for building type
- [ ] Lighting (lanterns, torches)
- [ ] Floor covering (if appropriate)

> **NOTE:** For non-habitable structures (Trees, Statues, etc.), you may SKIP Windows, Doors, and Interior checks.
> Use `{ "skipQualityChecks": ["interior", "openings"] }` when calling `complete` to bypass these errors.

---

## 3. Decorative Elements

### Weathering (for rustic/medieval)
- [ ] Some blocks replaced with mossy variants
- [ ] Vines on exterior walls
- [ ] Cracked blocks mixed in

### Landscaping
- [ ] Flowers near entrance
- [ ] Path to door
- [ ] Fence or garden elements

### Lighting
- [ ] Interior lanterns
- [ ] Exterior lanterns near door
- [ ] Chimney has campfire (if chimney exists)

---

## 4. Priority System

| Component | Required Priority |
|-----------|------------------|
| Foundation | 10 |
| Floor | 15 |
| Decoration | 20 |
| Walls | 50 |
| Roof | 60 |
| Windows/Doors | 70 |
| Frame/Pillars | 100 |

**Check:**
- [ ] All components wrapped in `beginGroup/endGroup`
- [ ] Frame/pillars have priority 100
- [ ] Walls have priority 50
- [ ] Decorations have low priority (10-30)

---

## 5. Code Quality

- [ ] Code has comments explaining sections
- [ ] Group names are descriptive
- [ ] No duplicate block placements
- [ ] Variables used for repeated values
