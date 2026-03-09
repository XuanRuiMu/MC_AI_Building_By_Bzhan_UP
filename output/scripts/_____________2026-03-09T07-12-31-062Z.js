/**
 * AI Architect - Generated Script
 * Prompt: 生成一个守望先锋的漓江塔
 * Session: 1773033962096
 * Generated: 2026-03-09T07:12:31.062Z
 */

```javascript
// ==========================================
// 守望先锋 - 漓江塔 (Lijiang Tower)
// ==========================================

// 材质定义 - 基于参考图片的色彩
const MAT_ROOF = 'ROOF_BLACKSTONE';      // 深灰色飞檐瓦片
const MAT_ROOF_EDGE = 'ROOF_DEEPSLATE';  // 屋檐边缘深色
const MAT_WALL = 'WALL_QUARTZ';          // 白色墙体
const MAT_PILLAR = 'WALL_RED';           // 红色柱子
const MAT_ACCENT = 'WALL_ORANGE';        // 橙色装饰线条
const MAT_BASE = 'WALL_SMOOTH_STONE';    // 白色石质基座
const MAT_GOLD = 'WALL_GOLD';            // 金色点缀
const MAT_WINDOW = 'WINDOW';             // 窗户玻璃
const MAT_DARK = 'WALL_BLACK';           // 深色细节

// 塔参数
const CENTER_X = 0;
const CENTER_Z = 0;
const BASE_Y = 0;

// ==========================================
// 组件定义
// ==========================================

// 单层飞檐组件 - 带翘角
builder.defineComponent('pagoda_tier', (b, params) => {
    const {
        width = 10,
        height = 4,
        roofOverhang = 3,
        hasWindows = true
    } = params;
    
    const halfWidth = Math.floor(width / 2);
    
    // 墙体（白色）- 四面墙
    b.setPriority(50);
    // 前后墙
    b.fill(-halfWidth + 1, 0, -halfWidth + 1, halfWidth - 1, height - 1, -halfWidth + 1, MAT_WALL);
    b.fill(-halfWidth + 1, 0, halfWidth - 1, halfWidth - 1, height - 1, halfWidth - 1, MAT_WALL);
    // 左右墙
    b.fill(-halfWidth + 1, 0, -halfWidth + 1, -halfWidth + 1, height - 1, halfWidth - 1, MAT_WALL);
    b.fill(halfWidth - 1, 0, -halfWidth + 1, halfWidth - 1, height - 1, halfWidth - 1, MAT_WALL);
    
    // 内部镂空（创建空心结构）
    b.clear(-halfWidth + 2, 1, -halfWidth + 2, halfWidth - 2, height - 2, halfWidth - 2);
    
    // 四角红色柱子（贯穿整层）
    b.setPriority(95);
    const pillarPositions = [
        [-halfWidth + 1, -halfWidth + 1],
        [halfWidth - 1, -halfWidth + 1],
        [-halfWidth + 1, halfWidth - 1],
        [halfWidth - 1, halfWidth - 1]
    ];
    
    pillarPositions.forEach(([px, pz]) => {
        b.fill(px, 0, pz, px, height, pz, MAT_PILLAR);
    });
    
    // 窗户（每层四面中央）
    if (hasWindows && width > 4) {
        b.setPriority(60);
        const windowY = Math.floor(height / 2);
        // 四面窗户
        b.set(0, windowY, -halfWidth + 1, MAT_WINDOW);
        b.set(0, windowY, halfWidth - 1, MAT_WINDOW);
        b.set(-halfWidth + 1, windowY, 0, MAT_WINDOW);
        b.set(halfWidth - 1, windowY, 0, MAT_WINDOW);
        
        // 如果宽度足够，两侧也加窗户
        if (width > 6) {
            b.set(-2, windowY, -halfWidth + 1, MAT_WINDOW);
            b.set(2, windowY, -halfWidth + 1, MAT_WINDOW);
            b.set(-2, windowY, halfWidth - 1, MAT_WINDOW);
            b.set(2, windowY, halfWidth - 1, MAT_WINDOW);
        }
    }
    
    // 屋檐下方装饰（橙色斗拱层）
    b.setPriority(60);
    const overhangStart = halfWidth;
    const overhangEnd = halfWidth + roofOverhang - 1;
    
    // 四面斗拱装饰
    for (let i = -overhangEnd; i <= overhangEnd; i++) {
        for (let j = -overhangEnd; j <= overhangEnd; j++) {
            // 只处理屋檐边缘
            if (Math.abs(i) >= overhangStart || Math.abs(j) >= overhangStart) {
                // 斗拱位置（屋檐下方）
                if (Math.abs(i) <= overhangEnd && Math.abs(j) <= overhangEnd) {
                    // 主屋檐
                    if (Math.abs(i) === overhangEnd || Math.abs(j) === overhangEnd) {
                        b.set(i, height - 1, j, MAT_ACCENT);
                    }
                }
            }
        }
    }
    
    // 飞檐屋顶（八边形曲线屋顶）
    b.setPriority(70);
    const roofRadius = halfWidth + roofOverhang;
    b.drawPolyRoof(0, height, 0, roofRadius, 3, 8, 'curve', MAT_ROOF);
    
    // 屋角上翘装饰（四个角落额外上翘）
    const cornerDist = roofRadius - 1;
    const cornerPositions = [
        [cornerDist, cornerDist],
        [-cornerDist, cornerDist],
        [cornerDist, -cornerDist],
        [-cornerDist, -cornerDist]
    ];
    
    cornerPositions.forEach(([cx, cz]) => {
        // 上翘的屋角 - 两层上升
        b.set(cx, height + 2, cz, MAT_ROOF_EDGE);
        const dx = cx > 0 ? 1 : -1;
        const dz = cz > 0 ? 1 : -1;
        b.set(cx + dx, height + 3, cz + dz, MAT_ROOF_EDGE);
    });
    
    // 屋脊装饰线
    b.setPriority(75);
    for (let i = -cornerDist + 1; i < cornerDist; i++) {
        b.set(i, height + 2, -cornerDist, MAT_ROOF);
        b.set(i, height + 2, cornerDist, MAT_ROOF);
        b.set(-cornerDist, height + 2, i, MAT_ROOF);
        b.set(cornerDist, height + 2, i, MAT_ROOF);
    }
});

// 塔顶尖顶
builder.defineComponent('pagoda_spire', (b, params) => {
    const { height = 10 } = params;
    
    b.setPriority(90);
    
    // 主塔尖 - 逐渐变细的金色柱
    for (let y = 0; y < height; y++) {
        const radius = Math.max(1, Math.floor((height - y) / 3));
        if (radius === 1) {
            b.set(0, y, 0, MAT_GOLD);
        } else {
            b.drawCylinder(0, y, 0, radius, 1, MAT_GOLD, { axis: 'y' });
        }
    }
    
    // 顶部宝珠
    b.drawSphere(0, height, 0, 1.5, MAT_GOLD);
    b.set(0, height + 2, 0, MAT_GOLD); // 尖端
});

// 基座与楼梯
builder.defineComponent('pagoda_base', (b, params) => {
    const { width = 20, height = 2 } = params;
    const halfWidth = Math.floor(width / 2);
    
    // 基座平台（白色石材）
    b.setPriority(40);
    b.fill(-halfWidth, 0, -halfWidth, halfWidth, height - 1, halfWidth, MAT_BASE);
    
    // 基座边缘装饰（深色线条）
    b.fill(-halfWidth - 1, 0, -halfWidth - 1, halfWidth + 1, 0, halfWidth + 1, MAT_DARK);
    
    // 四面台阶（正面主台阶更宽）
    const directions = [
        { dx: 0, dz: -1, isMain: true },  // 北（主入口）
        { dx: 0, dz: 1, isMain: false },  // 南
        { dx: -1, dz: 0, isMain: false }, // 西
        { dx: 1, dz: 0, isMain: false }   // 东
    ];
    
    directions.forEach(dir => {
        const stairWidth = dir.isMain ? 4 : 2;
        const steps = height + 2;
        
        for (let step = 0; step < steps; step++) {
            const dist = halfWidth + step;
            const sx = dir.dx * dist;
            const sz = dir.dz * dist;
            const sy = height - 1 - step;
            
            if (sy < 0) break;
            
            // 台阶主体
            for (let w = -stairWidth; w <= stairWidth; w++) {
                const wx = sx + (dir.dz !== 0 ? w : 0);
                const wz = sz + (dir.dx !== 0 ? w : 0);
                b.set(wx, sy, wz, MAT_BASE);
            }
        }
    });
    
    // 基座围栏（矮墙）
    b.setPriority(50);
    for (let x = -halfWidth; x <= halfWidth; x++) {
        b.set(x, height, -halfWidth, 'WALL_STONE');
        b.set(x, height, halfWidth, 'WALL_STONE');
    }
    for (let z = -halfWidth; z <= halfWidth; z++) {
        b.set(-halfWidth, height, z, 'WALL_STONE');
        b.set(halfWidth, height, z, 'WALL_STONE');
    }
});

// ==========================================
// 主构建逻辑
// ==========================================

// 1. 基座 (宽大平台)
builder.placeComponent('pagoda_base', CENTER_X, BASE_Y, CENTER_Z, {
    width: 18,
    height: 2
});

// 2. 七层塔身 (逐层缩小，还原图片结构)
const tiers = [
    { width: 14, height: 5, overhang: 3 },  // 第一层（最宽）
    { width: 12, height: 4, overhang: 3 },  // 第二层
    { width: 10, height: 4, overhang: 2 },  // 第三层
    { width: 8, height: 4, overhang: 2 },   // 第四层
    { width: 6, height: 4, overhang: 2 },   // 第五层
    { width: 5, height: 3, overhang: 2 },   // 第六层
    { width: 4, height: 3, overhang: 1 }    // 第七层（最顶层）
];

let currentY = BASE_Y + 2;

tiers.forEach((tier, index) => {
    builder.placeComponent('pagoda_tier', CENTER_X, currentY, CENTER_Z, {
        width: tier.width,
        height: tier.height,
        roofOverhang: tier.overhang,
        hasWindows: tier.width > 4
    });
    currentY += tier.height + 2; // +2 为屋顶厚度
});

// 3. 塔尖
builder.placeComponent('pagoda_spire', CENTER_X, currentY, CENTER_Z, {
    height: 8
});

// ==========================================
// 细节装饰
// ==========================================

// 悬挂灯笼 (每层屋檐角落)
builder.setPriority(30);
const lanternPositions = [];
let checkY = BASE_Y + 2;

tiers.forEach((tier, idx) => {
    const halfW = Math.floor(tier.width / 2) + tier.overhang - 1;
    const roofTop = checkY + tier.height + 2;
    
    // 四个角落挂灯笼
    const corners = [
        [halfW, halfW], [-halfW, halfW],
        [halfW, -halfW], [-halfW, -halfW]
    ];
    
    corners.forEach(([lx, lz]) => {
        builder.drawHanging(CENTER_X + lx, roofTop - 1, CENTER_Z + lz, {
            length: 2,
            type: 'lantern',
            tipType: MAT_ACCENT
        });
    });
    
    checkY += tier.height + 2;
});

// 顶层发光装饰
builder.setPriority(85);
builder.set(CENTER_X, currentY + 4, CENTER_Z, MAT_GOLD);

// 入口装饰（正面）
builder.setPriority(100);
const frontZ = CENTER_Z - 9;
// 主门
builder.setDoor(CENTER_X, BASE_Y + 2, frontZ + 1, 'dark_oak_door?facing=north');

// 门两侧红色柱子
builder.fill(CENTER_X - 3, BASE_Y + 2, frontZ + 2, CENTER_X - 3, BASE_Y + 5, frontZ + 2, MAT_PILLAR);
builder.fill(CENTER_X + 3, BASE_Y + 2, frontZ + 2, CENTER_X + 3, BASE_Y + 5, frontZ + 2, MAT_PILLAR);

// 门楣（橙色横梁）
builder.fill(CENTER_X - 4, BASE_Y + 6, frontZ + 2, CENTER_X + 4, BASE_Y + 6, frontZ + 2, MAT_ACCENT);

// 门两侧基座装饰
builder.set(CENTER_X - 4, BASE_Y + 2, frontZ + 2, MAT_DARK);
builder.set(CENTER_X + 4, BASE_Y + 2, frontZ + 2, MAT_DARK);

console.log('漓江塔构建完成！');
```
