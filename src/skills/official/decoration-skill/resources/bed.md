---
name: 床铺设计
description: 单人床、双人床、上下铺等各种床铺设计
---

# 🛏️ 床铺设计参考

## 基础结构
床由床架、床垫、床头板、枕头组成。

## 现代风格

### 简约双人床
```javascript
// 床垫
builder.fill(0, 1, 0, 1, 1, 2, 'white_bed');       // 原版床
// 或自定义
builder.fill(0, 1, 0, 1, 1, 2, 'white_wool');      // 床垫
builder.fill(0, 0, 0, 1, 0, 2, 'quartz_slab');     // 床架
builder.fill(0, 2, 0, 1, 2, 0, 'white_carpet');    // 枕头
```

### 榻榻米床
```javascript
builder.fill(0, 0, 0, 2, 0, 3, 'smooth_quartz');   // 低矮床台
builder.fill(0, 1, 0, 1, 1, 2, 'light_gray_wool'); // 床垫
builder.setBlock(0, 1, 0, 'white_carpet');         // 枕头
```

### 沙发床
```javascript
builder.fill(0, 0, 0, 2, 0, 1, 'gray_concrete');   // 底座
builder.fill(0, 1, 0, 2, 1, 1, 'gray_wool');       // 坐垫/床垫
builder.fill(0, 1, -1, 2, 2, -1, 'gray_wool');     // 靠背
```

## 中世纪/乡村风格

### 四柱大床
```javascript
// 床柱
builder.fill(-1, 0, -1, -1, 3, -1, 'dark_oak_fence');
builder.fill(2, 0, -1, 2, 3, -1, 'dark_oak_fence');
builder.fill(-1, 0, 3, -1, 3, 3, 'dark_oak_fence');
builder.fill(2, 0, 3, 2, 3, 3, 'dark_oak_fence');
// 顶棚
builder.fill(-1, 3, -1, 2, 3, 3, 'dark_oak_slab');
// 床体
builder.fill(0, 1, 0, 1, 1, 2, 'red_bed');
// 帷幔
builder.fill(-1, 2, 0, -1, 2, 2, 'red_carpet');
builder.fill(2, 2, 0, 2, 2, 2, 'red_carpet');
```

### 稻草床
```javascript
builder.fill(0, 0, 0, 1, 0, 2, 'hay_block');       // 稻草床垫
builder.fill(0, 1, 0, 1, 1, 0, 'brown_carpet');    // 毯子
```

### 木质单人床
```javascript
builder.fill(0, 0, 0, 0, 0, 2, 'oak_planks');      // 床架
builder.fill(0, 1, 0, 0, 1, 2, 'white_wool');      // 床垫
builder.setBlock(0, 1, 0, 'oak_trapdoor');         // 床头板
```

## 东方风格

### 日式布团
```javascript
// 地铺
builder.fill(0, 0, 0, 1, 0, 2, 'white_wool');      // 布团
builder.setBlock(0, 0, 0, 'white_carpet');         // 枕头
builder.fill(0, 0, 1, 1, 0, 2, 'blue_carpet');     // 被子
```

### 中式架子床
```javascript
// 床架
builder.fill(-1, 0, -1, 2, 0, 3, 'dark_oak_planks');
builder.fill(-1, 1, -1, -1, 2, 3, 'dark_oak_fence'); // 围栏
builder.fill(2, 1, -1, 2, 2, 3, 'dark_oak_fence');
// 床垫
builder.fill(0, 1, 0, 1, 1, 2, 'red_wool');
// 顶盖
builder.fill(-1, 3, -1, 2, 3, 3, 'dark_oak_slab');
```

## 特殊床铺

### 上下铺
```javascript
// 下铺
builder.fill(0, 0, 0, 0, 0, 2, 'oak_planks');
builder.fill(0, 1, 0, 0, 1, 2, 'white_bed');
// 上铺
builder.fill(0, 3, 0, 0, 3, 2, 'oak_planks');
builder.fill(0, 4, 0, 0, 4, 2, 'white_bed');
// 梯子
builder.fill(1, 0, 0, 1, 4, 0, 'ladder');
```

### 吊床
```javascript
builder.setBlock(-2, 2, 0, 'oak_fence');           // 支撑柱
builder.setBlock(2, 2, 0, 'oak_fence');
builder.fill(-1, 1, 0, 1, 1, 0, 'white_carpet');   // 吊床布
builder.setBlock(-2, 2, 0, 'tripwire_hook');       // 挂钩
builder.setBlock(2, 2, 0, 'tripwire_hook');
```

### 棺材床（哥特风）
```javascript
builder.fill(0, 0, 0, 0, 0, 2, 'dark_oak_planks'); // 底
builder.setBlock(0, 1, 0, 'dark_oak_stairs');      // 头部斜面
builder.setBlock(0, 1, 2, 'dark_oak_stairs');      // 脚部斜面
builder.fill(0, 1, 1, 0, 1, 1, 'red_wool');        // 内衬
```

## 推荐方块

| 风格 | 床垫 | 床架 | 装饰 |
|------|------|------|------|
| 现代 | wool, bed | quartz, concrete | carpet |
| 中世纪 | bed, wool | planks, fence | carpet, candle |
| 东方 | wool, carpet | bamboo, dark_oak | lantern |
| 哥特 | red_wool | dark_oak | soul_lantern |
