---
name: 灯具设计
description: 吊灯、壁灯、台灯、地灯等各种灯具设计
---

# 💡 灯具设计参考

## 吊灯

### 现代吊灯
```javascript
builder.setBlock(0, 5, 0, 'chain');                // 吊链
builder.setBlock(0, 4, 0, 'chain');
builder.setBlock(0, 3, 0, 'sea_lantern');          // 灯体
builder.fill(-1, 3, 0, 1, 3, 0, 'glass');          // 玻璃罩
builder.fill(0, 3, -1, 0, 3, 1, 'glass');
```

### 水晶吊灯
```javascript
// 中心
builder.setBlock(0, 5, 0, 'chain');
builder.setBlock(0, 4, 0, 'glowstone');
// 水晶臂
builder.setBlock(-1, 4, 0, 'end_rod');
builder.setBlock(1, 4, 0, 'end_rod');
builder.setBlock(0, 4, -1, 'end_rod');
builder.setBlock(0, 4, 1, 'end_rod');
// 水晶坠
builder.setBlock(-1, 3, 0, 'amethyst_cluster');
builder.setBlock(1, 3, 0, 'amethyst_cluster');
```

### 中世纪枝形吊灯
```javascript
builder.setBlock(0, 5, 0, 'chain');
builder.setBlock(0, 4, 0, 'oak_fence');            // 中心
// 四臂
builder.setBlock(-1, 4, 0, 'oak_fence');
builder.setBlock(1, 4, 0, 'oak_fence');
builder.setBlock(0, 4, -1, 'oak_fence');
builder.setBlock(0, 4, 1, 'oak_fence');
// 蜡烛
builder.setBlock(-1, 5, 0, 'candle');
builder.setBlock(1, 5, 0, 'candle');
builder.setBlock(0, 5, -1, 'candle');
builder.setBlock(0, 5, 1, 'candle');
```

### 日式纸灯笼
```javascript
builder.setBlock(0, 4, 0, 'chain');
builder.fill(0, 1, 0, 0, 3, 0, 'white_wool');      // 灯笼体
builder.setBlock(0, 2, 0, 'glowstone');            // 内部光源
builder.setBlock(0, 0, 0, 'dark_oak_fence');       // 底部装饰
```

## 壁灯

### 火把壁灯
```javascript
builder.setBlock(0, 2, 0, 'wall_torch');           // 基础
// 或带支架
builder.setBlock(0, 2, 1, 'oak_fence');            // 支架
builder.setBlock(0, 2, 0, 'torch');
```

### 现代壁灯
```javascript
builder.setBlock(0, 2, 1, 'iron_trapdoor');        // 底座
builder.setBlock(0, 2, 0, 'sea_lantern');          // 灯
builder.setBlock(0, 2, -1, 'glass');               // 罩
```

### 哥特壁灯
```javascript
builder.setBlock(0, 2, 1, 'chain');                // 挂链
builder.setBlock(0, 1, 0, 'soul_lantern');         // 幽魂灯
```

### 中式壁灯
```javascript
builder.setBlock(0, 2, 1, 'dark_oak_fence');       // 支架
builder.setBlock(0, 2, 0, 'red_wool');             // 灯笼外壳
builder.setBlock(0, 1, 0, 'glowstone');            // 光源
```

## 台灯/桌灯

### 现代台灯
```javascript
builder.setBlock(0, 0, 0, 'iron_bars');            // 灯柱
builder.setBlock(0, 1, 0, 'white_wool');           // 灯罩
builder.setBlock(0, 1, 0, 'light');                // 隐形光源
```

### 蒂芙尼台灯
```javascript
builder.setBlock(0, 0, 0, 'gold_block');           // 底座
builder.setBlock(0, 1, 0, 'end_rod');              // 灯柱
builder.fill(-1, 2, -1, 1, 2, 1, 'stained_glass'); // 彩色玻璃罩
builder.setBlock(0, 2, 0, 'glowstone');            // 光源
```

### 蜡烛台
```javascript
builder.setBlock(0, 0, 0, 'gold_block');           // 底座
builder.setBlock(0, 1, 0, 'candle');               // 单蜡烛
// 或多蜡烛
builder.setBlock(0, 1, 0, 'candle');
builder.setBlock(-1, 1, 0, 'candle');
builder.setBlock(1, 1, 0, 'candle');
```

## 地灯/落地灯

### 现代落地灯
```javascript
builder.setBlock(0, 0, 0, 'stone_slab');           // 底座
builder.fill(0, 1, 0, 0, 3, 0, 'iron_bars');       // 灯柱
builder.setBlock(0, 4, 0, 'white_wool');           // 灯罩
builder.setBlock(0, 4, 0, 'light');                // 光源
```

### 路灯
```javascript
builder.fill(0, 0, 0, 0, 3, 0, 'stone_brick_wall'); // 灯柱
builder.setBlock(0, 4, 0, 'stone_bricks');          // 顶
builder.setBlock(0, 3, 1, 'lantern');               // 灯
```

### 日式石灯笼
```javascript
builder.setBlock(0, 0, 0, 'stone');                // 底座
builder.setBlock(0, 1, 0, 'stone_brick_wall');     // 柱
builder.setBlock(0, 2, 0, 'chiseled_stone_bricks'); // 灯室
builder.setBlock(0, 2, 0, 'lantern');              // 灯
builder.fill(-1, 3, -1, 1, 3, 1, 'stone_slab');    // 顶盖
```

## 特殊灯具

### 壁炉火光
```javascript
builder.setBlock(0, 0, 0, 'campfire');             // 火焰
builder.setBlock(0, 0, 0, 'soul_campfire');        // 蓝色火焰
```

### 红石灯
```javascript
builder.setBlock(0, 0, 0, 'redstone_lamp');        // 可控灯
builder.setBlock(0, -1, 0, 'redstone_block');      // 永亮
```

### 萤火虫瓶（奇幻）
```javascript
builder.setBlock(0, 1, 0, 'glass');                // 玻璃瓶
builder.setBlock(0, 1, 0, 'light');                // 微光
```

## 光源方块参考

| 方块 | 亮度 | 风格 |
|------|------|------|
| glowstone | 15 | 魔法/现代 |
| sea_lantern | 15 | 海洋/现代 |
| lantern | 15 | 中世纪/乡村 |
| soul_lantern | 10 | 哥特/阴森 |
| torch | 14 | 通用 |
| candle | 3-12 | 浪漫/古典 |
| campfire | 15 | 乡村/野外 |
| end_rod | 14 | 奇幻/现代 |
| shroomlight | 15 | 奇幻/自然 |
| froglight | 15 | 自然/温馨 |
