---
name: 户外家具
description: 花园桌椅、秋千、凉亭等户外家具设计
---

# 🌳 户外家具设计参考

## 花园桌椅

### 野餐桌
```javascript
// 桌面
builder.fill(0, 1, 0, 3, 1, 1, 'oak_slab');
// 长凳
builder.fill(0, 0, -1, 3, 0, -1, 'oak_slab');          // 前凳
builder.fill(0, 0, 2, 3, 0, 2, 'oak_slab');            // 后凳
// 支撑
builder.setBlock(0, 0, 0, 'oak_fence');
builder.setBlock(3, 0, 0, 'oak_fence');
```

### 铁艺桌椅
```javascript
// 圆桌
builder.setBlock(0, 1, 0, 'iron_bars');                // 桌腿
builder.fill(-1, 2, -1, 1, 2, 1, 'heavy_weighted_pressure_plate'); // 桌面
// 椅子
builder.setBlock(2, 0, 0, 'iron_bars');
builder.setBlock(2, 1, 0, 'anvil');                    // 座面
```

### 木质躺椅
```javascript
builder.fill(0, 0, 0, 0, 0, 2, 'oak_slab');            // 躺椅底
builder.setBlock(0, 1, 0, 'oak_stairs');               // 靠背（倾斜）
builder.setBlock(0, 0, -1, 'oak_fence');               // 腿
builder.setBlock(0, 0, 3, 'oak_fence');
```

## 秋千

### 单人秋千
```javascript
// 支架
builder.fill(-1, 0, 0, -1, 3, 0, 'oak_fence');         // 左柱
builder.fill(1, 0, 0, 1, 3, 0, 'oak_fence');           // 右柱
builder.fill(-1, 3, 0, 1, 3, 0, 'oak_fence');          // 横梁
// 秋千
builder.setBlock(0, 2, 0, 'chain');                    // 链条
builder.setBlock(0, 1, 0, 'oak_slab');                 // 座板
```

### 双人秋千椅
```javascript
// A型支架
builder.fill(-2, 0, -1, -2, 3, -1, 'spruce_fence');
builder.fill(-2, 0, 1, -2, 3, 1, 'spruce_fence');
builder.fill(2, 0, -1, 2, 3, -1, 'spruce_fence');
builder.fill(2, 0, 1, 2, 3, 1, 'spruce_fence');
builder.fill(-2, 3, 0, 2, 3, 0, 'spruce_fence');       // 横梁
// 秋千椅
builder.fill(-1, 2, 0, 1, 2, 0, 'chain');              // 链条
builder.fill(-1, 1, -1, 1, 1, 0, 'spruce_slab');       // 座椅
builder.fill(-1, 1, -1, 1, 2, -1, 'spruce_planks');    // 靠背
```

### 轮胎秋千
```javascript
builder.fill(0, 3, 0, 0, 3, 0, 'oak_fence');           // 横梁
builder.setBlock(0, 2, 0, 'chain');
builder.setBlock(0, 1, 0, 'black_wool');               // 轮胎
```

## 凉亭/遮阳

### 简易凉亭
```javascript
// 四柱
builder.fill(0, 0, 0, 0, 2, 0, 'oak_fence');
builder.fill(3, 0, 0, 3, 2, 0, 'oak_fence');
builder.fill(0, 0, 3, 0, 2, 3, 'oak_fence');
builder.fill(3, 0, 3, 3, 2, 3, 'oak_fence');
// 顶棚
builder.fill(0, 3, 0, 3, 3, 3, 'oak_slab');
```

### 遮阳伞
```javascript
builder.fill(0, 0, 0, 0, 2, 0, 'oak_fence');           // 伞柄
builder.fill(-1, 3, -1, 1, 3, 1, 'red_wool');          // 伞面
builder.setBlock(0, 3, 0, 'oak_fence');                // 伞顶
```

### 藤架/葡萄架
```javascript
// 支柱
builder.fill(0, 0, 0, 0, 2, 0, 'oak_fence');
builder.fill(4, 0, 0, 4, 2, 0, 'oak_fence');
builder.fill(0, 0, 3, 0, 2, 3, 'oak_fence');
builder.fill(4, 0, 3, 4, 2, 3, 'oak_fence');
// 顶部格栅
builder.fill(0, 3, 0, 4, 3, 0, 'oak_fence');
builder.fill(0, 3, 3, 4, 3, 3, 'oak_fence');
builder.fill(0, 3, 0, 0, 3, 3, 'oak_fence');
builder.fill(4, 3, 0, 4, 3, 3, 'oak_fence');
// 藤蔓
builder.scatter(0, 2, 0, 4, 3, 0.3, ['vine', 'oak_leaves']);
```

## 花园装饰

### 花盆组合
```javascript
builder.setBlock(0, 0, 0, 'flower_pot');               // 小花盆
builder.setBlock(1, 0, 0, 'potted_red_tulip');
builder.setBlock(2, 0, 0, 'potted_blue_orchid');
// 大花盆
builder.fill(0, 0, 2, 1, 1, 3, 'brick');
builder.setBlock(0, 2, 2, 'rose_bush');
```

### 喷泉
```javascript
// 底池
builder.drawCylinder(0, 0, 0, 3, 1, 'stone_bricks');
builder.fill(-2, 0, -2, 2, 0, 2, 'water');
// 中心柱
builder.fill(0, 1, 0, 0, 3, 0, 'stone_brick_wall');
builder.setBlock(0, 4, 0, 'water');                    // 喷水
```

### 鸟浴盆
```javascript
builder.setBlock(0, 0, 0, 'stone_brick_wall');         // 底座
builder.setBlock(0, 1, 0, 'cauldron');                 // 水盆
```

### 石灯笼（日式）
```javascript
builder.setBlock(0, 0, 0, 'stone');                    // 底座
builder.setBlock(0, 1, 0, 'stone_brick_wall');         // 柱
builder.setBlock(0, 2, 0, 'chiseled_stone_bricks');    // 灯室
builder.setBlock(0, 2, 0, 'lantern');                  // 灯
builder.fill(-1, 3, -1, 1, 3, 1, 'stone_slab');        // 顶盖
```

## 烧烤/户外厨房

### BBQ烤架
```javascript
builder.fill(0, 0, 0, 1, 1, 0, 'iron_block');          // 烤架体
builder.setBlock(0, 2, 0, 'campfire');                 // 火焰
builder.setBlock(1, 2, 0, 'iron_bars');                // 烤网
```

### 户外壁炉
```javascript
builder.fill(0, 0, 0, 2, 2, 0, 'stone_bricks');        // 壁炉体
builder.setBlock(1, 0, 1, 'campfire');                 // 火焰
builder.fill(0, 3, 0, 2, 4, 0, 'stone_brick_wall');    // 烟囱
```

## 推荐方块

| 类型 | 主体 | 装饰 | 风格 |
|------|------|------|------|
| 木质 | oak/spruce_fence, slab | vine, leaves | 乡村 |
| 铁艺 | iron_bars, anvil | flower_pot | 欧式 |
| 石质 | stone_bricks, wall | water, lantern | 日式 |
| 现代 | concrete, glass | sea_lantern | 现代 |
