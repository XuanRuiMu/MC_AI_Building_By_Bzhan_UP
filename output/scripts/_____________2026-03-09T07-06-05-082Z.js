/**
 * AI Architect - Generated Script
 * Prompt: 生成一个守望先锋的漓江塔
 * Session: 1773033962096
 * Generated: 2026-03-09T07:06:05.084Z
 */



```javascript
// ==========================================
// 守望先锋 - 漓江塔 (Lijiang Tower)
// ==========================================

// 材质定义
const MAT_ROOF = 'ROOF_BLACKSTONE';      // 深灰色飞檐
const MAT_ROOF_EDGE = 'ROOF_DEEPSLATE';  // 屋檐边缘
const MAT_WALL = 'WALL_QUARTZ';          // 白色墙体
const MAT_PILLAR = 'WALL_RED';           // 红色柱子
const MAT_ACCENT = 'WALL_ORANGE';        // 橙色装饰
const MAT_BASE = 'WALL_SMOOTH_STONE';    // 基座
const MAT_GOLD = 'WALL_GOLD';            // 金色装饰
const MAT_WINDOW = 'WINDOW';             // 窗户
const MAT_DARK = 'WALL_BLACK';           // 深色细节

// 塔参数
const CENTER_X = 0;
const CENTER_Z = 0;
const BASE_Y = 0;

// ==========================================
// 组件定义
// ==========================================

// 单层飞檐组件
builder.defineComponent('pagoda_tier', (b, params) => {
    const {
        width = 10,
        height = 4,
        roofOverhang = 2
    } = params;
    
    const halfWidth = Math.floor(width / 2);
    const roofWidth = width + roofOverhang * 2;
    
    // 墙体（白色）
    b.setPriority(50);
    b.fill(-halfWidth + 1, 0, -halfWidth + 1, halfWidth - 1, height - 1, halfWidth - 1, MAT_WALL);
    
    // 内部镂空
    b.clear(-halfWidth + 2, 1, -halfWidth + 2, halfWidth - 2, height - 2, halfWidth - 2);
    
    // 四角柱子（红色）
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
    
    // 屋檐下方装饰（橙色斗拱）
    b.setPriority(60);
    const overhang = halfWidth + 1;
    for (let i = 0; i < 4; i++) {
        const angle = i * 90;
        // 斗拱装饰
        for (let j = -overhang + 1; j < overhang; j++) {
            const x = (i === 0 || i === 2) ? j : (i === 1 ? overhang : -overhang);
            const z = (i === 1 || i === 3) ? j : (i === 0 ? -overhang : overhang);
            if (Math.abs(x) <= halfWidth && Math.abs(z) <= halfWidth) continue;
            b.set(x, height - 1, z, MAT_ACCENT);
        }
    }
    
    // 飞檐屋顶（使用曲线风格）
    b.setPriority(70);
    // 主体屋顶
    b.drawPolyRoof(0, height, 0, halfWidth + roofOverhang, 3, 8, 'curve', MAT_ROOF);
    
    // 屋角上翘装饰
    const cornerDist = halfWidth + roofOverhang - 1;
    const cornerPositions = [
        [cornerDist, cornerDist],
        [-cornerDist, cornerDist],
        [cornerDist, -cornerDist],
        [-cornerDist, -cornerDist]
    ];
    
    cornerPositions.forEach(([cx, cz]) => {
        // 上翘的屋角
        b.set(cx, height + 2, cz, MAT_ROOF_EDGE);
        b.set(cx + (cx > 0 ? 1 : -1), height + 3, cz + (cz > 0 ? 1 : -1), MAT_ROOF_EDGE);
    });
    
    // 栏杆（每层边缘）
    b.setPriority(55);
    for (let x = -halfWidth; x <= halfWidth; x++) {
        for (let z = -halfWidth; z <= halfWidth; z++) {
            if (Math.abs(x) === halfWidth || Math.abs(z) === halfWidth) {
                b.set(x, height, z, 'WALL_IRON'); // 栏杆
            }
        }
    }
});

// 塔顶尖顶
builder.defineComponent('pagoda_spire', (b, params) => {
    const { height = 8 } = params;
    
    // 主塔尖
    b.setPriority(90);
    b.drawCylinder(0, 0, 0, 1, height - 2, MAT_GOLD, { axis: 'y' });
    
    // 顶部宝珠
    b.drawSphere(0, height, 0, 1, MAT_GOLD);
    
    // 装饰环
    for (let y = 2; y < height - 2; y += 2) {
        b.drawTorus(0, y, 0, 1.5, 0.3, MAT_ACCENT, { axis: 'y' });
    }
    
    // 最顶端
    b.set(0, height + 1, 0, MAT_GOLD);
    b.set(0, height + 2, 0, 'AIR'); // 尖端
});

// 基座与楼梯
builder.defineComponent('pagoda_base', (b, params) => {
    const { width = 20, height = 3 } = params;
    const halfWidth = Math.floor(width / 2);
    
    // 基座平台
    b.setPriority(40);
    b.fill(-halfWidth, 0, -halfWidth, halfWidth, height - 1, halfWidth, MAT_BASE);
    
    // 基座装饰层
    b.fill(-halfWidth - 1, 0, -halfWidth - 1, halfWidth + 1, 0, halfWidth + 1, MAT_DARK);
    
    // 四面楼梯
    const stairWidth = 3;
    for (let i = 0; i < 4; i++) {
        const angle = i * 90;
        const dir = [
            [0, -1],  // 北
            [1, 0],   // 东
            [0, 1],   // 南
            [-1, 0]   // 西
        ][i];
        
        for (let step = 0; step < height + 2; step++) {
            const sx = dir[0] * (halfWidth + step);
            const sz = dir[1] * (halfWidth + step);
            const sy = height - 1 - step;
            
            if (sy < 0) break;
            
            // 楼梯主体
            for (let w = -stairWidth; w <= stairWidth; w++) {
                const wx = sx + (dir[1] !== 0 ? w : 0);
                const wz = sz + (dir[0] !== 0 ? w : 0);
                b.set(wx, sy, wz, MAT_BASE);
            }
        }
    }
    
    // 基座围栏
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

// 1. 基座 (最下层平台)
builder.placeComponent('pagoda_base', CENTER_X, BASE_Y, CENTER_Z, {
    width: 22,
    height: 3
});

// 2. 七层塔身 (逐层缩小)
const tiers = [
    { width: 16, height: 5, y: 3 },      // 第一层
    { width: 14, height: 4, y: 8 },      // 第二层
    { width: 12, height: 4, y: 12 },     // 第三层
    { width: 10, height: 4, y: 16 },     // 第四层
    { width: 8, height: 4, y: 20 },      // 第五层
    { width: 6, height: 4, y: 24 },      // 第六层
    { width: 4, height: 4, y: 28 }       // 第七层
];

let currentY = BASE_Y + 3;

tiers.forEach((tier, index) => {
    builder.placeComponent('pagoda_tier', CENTER_X, currentY, CENTER_Z, {
        width: tier.width,
        height: tier.height,
        roofOverhang: index < 3 ? 2 : 1
    });
    currentY += tier.height + 1; // +1 for roof thickness
});

// 3. 塔尖
builder.placeComponent('pagoda_spire', CENTER_X, currentY, CENTER_Z, {
    height: 6
});

// ==========================================
// 细节装饰
// ==========================================

// 悬挂灯笼 (每层角落)
builder.setPriority(30);
const lanternTiers = [
    { y: 7, dist: 8 },
    { y: 11, dist: 7 },
    { y: 15, dist: 6 },
    { y: 19, dist: 5 },
    { y: 23, dist: 4 }
];

lanternTiers.forEach(({ y, dist }) => {
    const positions = [
        [dist, dist], [-dist, dist],
        [dist, -dist], [-dist, -dist]
    ];
    positions.forEach(([lx, lz]) => {
        builder.drawHanging(lx, y, lz, {
            length: 2,
            type: 'lantern',
            tipType: MAT_ACCENT
        });
    });
});

// 顶层发光装饰
builder.setPriority(85);
builder.set(CENTER_X, currentY + 3, CENTER_Z, MAT_GOLD);
builder.set(CENTER_X, currentY + 4, CENTER_Z, 'AIR');

// 底部入口装饰
builder.setPriority(100);
// 主入口门
builder.setDoor(CENTER_X, BASE_Y + 3, CENTER_X - 8, 'dark_oak_door?facing=north');

// 入口两侧装饰柱
builder.fill(CENTER_X - 2, BASE_Y + 3, CENTER_X - 7, CENTER_X - 2, BASE_Y + 6, CENTER_X - 7, MAT_PILLAR);
builder.fill(CENTER_X + 2, BASE_Y + 3, CENTER_X - 7, CENTER_X + 2, BASE_Y + 6, CENTER_X - 7, MAT_PILLAR);

// 门楣
builder.fill(CENTER_X - 3, BASE_Y + 7, CENTER_X - 7, CENTER_X + 3, BASE_Y + 7, CENTER_X - 7, MAT_ACCENT);

console.log('漓江塔构建完成！');
```

这座漓江塔包含：
- **七层塔身**：逐层收窄的传统结构
- **飞檐翘角**：使用曲线屋顶和上扬的屋角
- **红白配色**：白色墙体配红色柱子，还原经典风格
- **基座楼梯**：四面都有登塔台阶
- **金色塔尖**：顶部装饰宝珠和光环
- **悬挂灯笼**：每层角落的东方装饰元素

整体高度约40格，展现出守望先锋中那种传统与未来结合的独特美感！
