---
name: 桌子设计
description: 餐桌、书桌、茶几等各种桌子的设计参考
---

# 🪵 桌子设计参考

## 基础结构
桌子由桌面、桌腿组成，可添加抽屉、装饰。

## 现代风格

### 玻璃茶几
```javascript
builder.fill(0, 1, 0, 2, 1, 2, 'glass');           // 玻璃桌面
builder.setBlock(0, 0, 0, 'iron_bars');            // 金属腿
builder.setBlock(2, 0, 0, 'iron_bars');
builder.setBlock(0, 0, 2, 'iron_bars');
builder.setBlock(2, 0, 2, 'iron_bars');
```

### 办公桌
```javascript
builder.fill(0, 1, 0, 3, 1, 1, 'white_concrete');  // 桌面
builder.fill(0, 0, 0, 0, 0, 1, 'white_concrete');  // 左侧板
builder.fill(3, 0, 0, 3, 0, 1, 'white_concrete');  // 右侧板
builder.setBlock(1, 0, 0, 'barrel');               // 抽屉
```

### 极简餐桌
- 桌面: `smooth_quartz_slab`, `white_concrete`
- 桌腿: `iron_bars`, `chain`
- 尺寸: 4x2 或 6x3

## 中世纪/乡村风格

### 橡木餐桌
```javascript
builder.fill(0, 1, 0, 4, 1, 2, 'oak_slab');        // 桌面
builder.setBlock(0, 0, 0, 'oak_fence');            // 四角桌腿
builder.setBlock(4, 0, 0, 'oak_fence');
builder.setBlock(0, 0, 2, 'oak_fence');
builder.setBlock(4, 0, 2, 'oak_fence');
```

### 酒馆大桌
```javascript
builder.fill(0, 1, 0, 5, 1, 2, 'spruce_planks');   // 厚实桌面
builder.fill(0, 0, 1, 0, 0, 1, 'spruce_log');      // 粗壮桌腿
builder.fill(5, 0, 1, 5, 0, 1, 'spruce_log');
// 桌上摆设
builder.setBlock(2, 2, 1, 'lantern');
builder.setBlock(3, 2, 1, 'flower_pot');
```

### 工匠工作台
```javascript
builder.fill(0, 1, 0, 2, 1, 1, 'stripped_oak_log'); // 原木桌面
builder.setBlock(0, 0, 0, 'barrel');                // 工具箱
builder.setBlock(2, 0, 0, 'barrel');
builder.setBlock(1, 2, 0, 'grindstone');            // 工具
```

## 东方风格

### 日式矮桌
```javascript
builder.fill(0, 0, 0, 2, 0, 1, 'bamboo_mosaic_slab'); // 矮桌面
// 配合坐垫使用
builder.setBlock(0, 0, -1, 'red_carpet');
builder.setBlock(2, 0, -1, 'red_carpet');
```

### 中式八仙桌
```javascript
builder.fill(0, 1, 0, 2, 1, 2, 'dark_oak_slab');
builder.setBlock(0, 0, 0, 'dark_oak_fence');
builder.setBlock(2, 0, 0, 'dark_oak_fence');
builder.setBlock(0, 0, 2, 'dark_oak_fence');
builder.setBlock(2, 0, 2, 'dark_oak_fence');
// 桌上茶具
builder.setBlock(1, 2, 1, 'flower_pot');
```

## 特殊桌子

### 魔法附魔台
```javascript
builder.setBlock(1, 1, 1, 'enchanting_table');
builder.fill(0, 0, 0, 2, 1, 0, 'bookshelf');       // 环绕书架
builder.fill(0, 0, 2, 2, 1, 2, 'bookshelf');
```

### 炼金术桌
```javascript
builder.fill(0, 1, 0, 2, 1, 1, 'dark_oak_slab');
builder.setBlock(0, 2, 0, 'brewing_stand');
builder.setBlock(2, 2, 0, 'cauldron');
builder.setBlock(1, 2, 1, 'dragon_breath');        // 装饰瓶
```

## 推荐方块

| 风格 | 桌面 | 桌腿 | 装饰 |
|------|------|------|------|
| 现代 | concrete, glass | iron_bars | flower_pot |
| 中世纪 | planks, slab | fence, log | lantern |
| 东方 | bamboo, dark_oak | fence | flower_pot |
| 魔法 | obsidian, crying_obsidian | end_rod | candle |
