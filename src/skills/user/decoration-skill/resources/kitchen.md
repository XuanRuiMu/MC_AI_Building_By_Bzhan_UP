---
name: 厨房家具
description: 灶台、水槽、冰箱等厨房设备设计
---

# 🍳 厨房家具设计参考

## 灶台/炉灶

### 现代燃气灶
```javascript
builder.fill(0, 0, 0, 1, 0, 1, 'polished_blackstone'); // 灶台面
builder.setBlock(0, 0, 0, 'iron_trapdoor');            // 炉眼
builder.setBlock(1, 0, 0, 'iron_trapdoor');
// 下方烤箱
builder.fill(0, -1, 0, 1, -1, 1, 'black_concrete');
builder.setBlock(0, -1, 1, 'iron_trapdoor');           // 烤箱门
```

### 中世纪灶台
```javascript
builder.fill(0, 0, 0, 1, 1, 1, 'cobblestone');         // 灶体
builder.setBlock(0, 1, 0, 'campfire');                 // 火焰
builder.setBlock(1, 2, 0, 'cauldron');                 // 锅
```

### 烟熏炉组合
```javascript
builder.setBlock(0, 0, 0, 'smoker');                   // 烟熏炉
builder.setBlock(1, 0, 0, 'blast_furnace');            // 高炉
builder.fill(0, 1, 0, 1, 1, 0, 'stone_slab');          // 台面
```

## 水槽

### 现代水槽
```javascript
builder.setBlock(0, 0, 0, 'cauldron');                 // 水槽
builder.setBlock(0, 1, -1, 'lever');                   // 水龙头
builder.fill(-1, 0, 0, 1, 0, 0, 'smooth_quartz');      // 台面
```

### 双槽水槽
```javascript
builder.setBlock(0, 0, 0, 'cauldron');
builder.setBlock(1, 0, 0, 'cauldron');
builder.setBlock(0, 1, -1, 'tripwire_hook');           // 龙头
builder.fill(-1, 0, 0, 2, 0, 0, 'white_concrete');     // 台面
```

### 乡村水槽
```javascript
builder.setBlock(0, 0, 0, 'composter');                // 木质水槽
builder.setBlock(0, 1, -1, 'oak_button');              // 简易龙头
```

## 冰箱

### 现代冰箱
```javascript
builder.fill(0, 0, 0, 0, 2, 0, 'white_concrete');      // 冰箱体
builder.setBlock(0, 2, 1, 'iron_trapdoor');            // 冷冻室门
builder.setBlock(0, 1, 1, 'iron_trapdoor');            // 冷藏室门
builder.setBlock(0, 0, 1, 'iron_trapdoor');
```

### 复古冰箱
```javascript
builder.fill(0, 0, 0, 0, 2, 0, 'cyan_terracotta');     // 复古色
builder.setBlock(0, 1, 1, 'iron_trapdoor');            // 单门
builder.setBlock(0, 2, 0, 'smooth_stone_slab');        // 顶部
```

### 冰柜（商用）
```javascript
builder.fill(0, 0, 0, 2, 1, 1, 'iron_block');          // 柜体
builder.fill(0, 1, 0, 2, 1, 0, 'glass');               // 玻璃顶
builder.setBlock(0, 0, 2, 'iron_trapdoor');            // 侧门
```

## 橱柜/储物

### 上柜
```javascript
builder.fill(0, 3, 0, 2, 4, 0, 'stripped_oak_log');    // 柜体
builder.fill(0, 3, 1, 2, 4, 1, 'oak_trapdoor');        // 柜门
```

### 下柜带抽屉
```javascript
builder.fill(0, 0, 0, 2, 1, 0, 'stripped_oak_log');    // 柜体
builder.fill(0, 0, 1, 2, 0, 1, 'barrel');              // 抽屉
builder.fill(0, 1, 1, 2, 1, 1, 'oak_trapdoor');        // 柜门
```

### 岛台
```javascript
builder.fill(0, 0, 0, 2, 1, 1, 'oak_planks');          // 岛台体
builder.fill(0, 2, 0, 2, 2, 1, 'smooth_stone_slab');   // 台面
builder.setBlock(0, 0, 2, 'oak_stairs');               // 座位
builder.setBlock(2, 0, 2, 'oak_stairs');
```

## 餐具/装饰

### 餐具架
```javascript
builder.setBlock(0, 2, 0, 'flower_pot');               // 杯子
builder.setBlock(1, 2, 0, 'flower_pot');
builder.fill(0, 1, 0, 1, 1, 0, 'oak_slab');            // 架子
```

### 调料架
```javascript
builder.fill(0, 2, 0, 2, 2, 0, 'oak_slab');            // 架子
builder.setBlock(0, 3, 0, 'flower_pot');               // 调料瓶
builder.setBlock(1, 3, 0, 'flower_pot');
builder.setBlock(2, 3, 0, 'flower_pot');
```

### 锅具挂架
```javascript
builder.fill(0, 3, 0, 2, 3, 0, 'iron_bars');           // 挂杆
builder.setBlock(0, 2, 0, 'cauldron');                 // 挂锅
builder.setBlock(2, 2, 0, 'heavy_weighted_pressure_plate'); // 平底锅
```

## 厨房电器

### 微波炉
```javascript
builder.setBlock(0, 2, 0, 'observer');                 // 微波炉（观察者像显示屏）
```

### 咖啡机
```javascript
builder.setBlock(0, 1, 0, 'brewing_stand');            // 咖啡机
builder.setBlock(0, 0, 0, 'stone_slab');               // 底座
```

### 烤面包机
```javascript
builder.setBlock(0, 1, 0, 'hopper');                   // 烤面包机
```

## 推荐方块

| 设备 | 主体 | 门/面板 | 装饰 |
|------|------|---------|------|
| 灶台 | blackstone, stone | trapdoor | campfire |
| 水槽 | cauldron | lever, button | - |
| 冰箱 | concrete, iron | iron_trapdoor | - |
| 橱柜 | planks, log | trapdoor, barrel | - |
