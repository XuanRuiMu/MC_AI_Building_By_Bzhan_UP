---
name: 储物家具
description: 衣柜、书架、箱子等储物家具设计
---

# 📦 储物家具设计参考

## 衣柜/橱柜

### 现代衣柜
```javascript
// 双门衣柜
builder.fill(0, 0, 0, 1, 3, 0, 'white_concrete');  // 柜体
builder.fill(0, 1, 1, 0, 2, 1, 'iron_trapdoor');   // 左门
builder.fill(1, 1, 1, 1, 2, 1, 'iron_trapdoor');   // 右门
```

### 中世纪衣柜
```javascript
builder.fill(0, 0, 0, 1, 3, 0, 'oak_planks');      // 柜体
builder.fill(0, 1, 1, 0, 2, 1, 'oak_trapdoor');    // 木门
builder.fill(1, 1, 1, 1, 2, 1, 'oak_trapdoor');
builder.setBlock(0, 3, 0, 'oak_slab');             // 顶部装饰
builder.setBlock(1, 3, 0, 'oak_slab');
```

### 厨房橱柜
```javascript
// 下柜
builder.fill(0, 0, 0, 3, 1, 0, 'stripped_oak_log');
builder.fill(0, 0, 1, 3, 0, 1, 'barrel');          // 抽屉效果
// 台面
builder.fill(0, 2, 0, 3, 2, 1, 'smooth_stone_slab');
// 上柜
builder.fill(0, 4, 0, 3, 5, 0, 'stripped_oak_log');
builder.fill(0, 4, 1, 3, 4, 1, 'oak_trapdoor');
```

## 书架

### 满墙书架
```javascript
builder.fill(0, 0, 0, 4, 3, 0, 'bookshelf');
// 添加变化
builder.setBlock(2, 1, 0, 'lantern');              // 灯
builder.setBlock(1, 2, 0, 'flower_pot');           // 装饰
```

### 现代书架
```javascript
// 开放式格子
builder.fill(0, 0, 0, 0, 3, 0, 'white_concrete');  // 左侧板
builder.fill(3, 0, 0, 3, 3, 0, 'white_concrete');  // 右侧板
builder.fill(0, 0, 0, 3, 0, 0, 'white_concrete');  // 底板
builder.fill(0, 1, 0, 3, 1, 0, 'white_slab');      // 隔板1
builder.fill(0, 2, 0, 3, 2, 0, 'white_slab');      // 隔板2
// 放书
builder.setBlock(1, 1, 0, 'bookshelf');
builder.setBlock(2, 2, 0, 'bookshelf');
```

### 旋转书架
```javascript
// 圆柱形
builder.drawCylinder(0, 0, 0, 1, 3, 'bookshelf');
builder.setBlock(0, 3, 0, 'oak_slab');             // 顶
```

## 箱子/收纳

### 宝箱堆
```javascript
builder.setBlock(0, 0, 0, 'chest');
builder.setBlock(1, 0, 0, 'chest');                // 大箱子
builder.setBlock(0, 1, 0, 'barrel');               // 堆叠
builder.setBlock(2, 0, 0, 'trapped_chest');        // 变化
```

### 储物架
```javascript
builder.fill(0, 0, 0, 2, 0, 0, 'oak_slab');        // 底层
builder.fill(0, 2, 0, 2, 2, 0, 'oak_slab');        // 中层
builder.fill(0, 4, 0, 2, 4, 0, 'oak_slab');        // 顶层
// 支撑
builder.fill(0, 0, -1, 0, 4, -1, 'oak_fence');
builder.fill(2, 0, -1, 2, 4, -1, 'oak_fence');
// 物品
builder.setBlock(1, 1, 0, 'barrel');
builder.setBlock(0, 3, 0, 'flower_pot');
```

### 行李箱（旅行风）
```javascript
builder.fill(0, 0, 0, 1, 1, 0, 'brown_wool');      // 箱体
builder.setBlock(0, 1, 1, 'iron_trapdoor');        // 锁扣
builder.setBlock(1, 0, 0, 'leather');              // 皮带装饰
```

## 展示柜

### 玻璃展示柜
```javascript
builder.fill(0, 0, 0, 2, 0, 2, 'oak_planks');      // 底座
builder.fill(0, 1, 0, 0, 2, 0, 'glass');           // 玻璃四面
builder.fill(2, 1, 0, 2, 2, 0, 'glass');
builder.fill(0, 1, 2, 0, 2, 2, 'glass');
builder.fill(2, 1, 2, 2, 2, 2, 'glass');
builder.fill(0, 3, 0, 2, 3, 2, 'oak_slab');        // 顶
// 展品
builder.setBlock(1, 1, 1, 'diamond_block');
```

### 武器架
```javascript
builder.fill(0, 1, 0, 2, 1, 0, 'oak_planks');      // 背板
builder.fill(0, 2, 0, 2, 2, 0, 'oak_planks');
// 使用物品展示框（需要实体）
// 或用方块模拟
builder.setBlock(1, 2, 1, 'iron_sword');           // 剑（装饰）
```

## 推荐方块

| 类型 | 主体 | 门/抽屉 | 装饰 |
|------|------|---------|------|
| 现代 | concrete, quartz | iron_trapdoor | glass |
| 中世纪 | planks, log | trapdoor, barrel | lantern |
| 东方 | bamboo, dark_oak | trapdoor | flower_pot |
| 工业 | iron_block | iron_trapdoor | chain |
