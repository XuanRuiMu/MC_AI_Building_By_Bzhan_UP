---
name: 椅子设计
description: 各种风格椅子的设计参考，包括现代、中世纪、东方风格
---

# 🪑 椅子设计参考

## 基础结构
椅子由座面、靠背、扶手（可选）组成。

## 现代风格

### 简约办公椅
```javascript
// 金属腿 + 皮革座面
builder.setBlock(0, 0, 0, 'iron_bars');      // 椅腿
builder.setBlock(0, 1, 0, 'black_carpet');   // 座面
builder.setBlock(0, 2, 0, 'black_wool');     // 靠背
```

### 吧台高脚椅
```javascript
builder.setBlock(0, 0, 0, 'chain');          // 金属支撑
builder.setBlock(0, 1, 0, 'chain');
builder.setBlock(0, 2, 0, 'polished_andesite_slab'); // 座面
```

### 现代沙发椅
- 座面: `white_concrete`, `light_gray_concrete`
- 靠背: `white_wool`, `light_gray_wool`
- 扶手: `quartz_slab`

## 中世纪/乡村风格

### 橡木餐椅
```javascript
// 经典木质椅子
builder.setBlock(0, 0, 0, 'oak_stairs');     // 座面（楼梯朝向调整）
builder.setBlock(0, 1, -1, 'oak_slab');      // 靠背
```

### 王座椅
```javascript
// 豪华王座
builder.setBlock(-1, 0, 0, 'dark_oak_stairs'); // 左扶手
builder.setBlock(1, 0, 0, 'dark_oak_stairs');  // 右扶手
builder.setBlock(0, 0, 0, 'red_carpet');       // 座垫
builder.setBlock(0, 1, -1, 'dark_oak_planks'); // 靠背
builder.setBlock(0, 2, -1, 'gold_block');      // 装饰顶
```

### 酒馆长凳
```javascript
builder.fill(0, 0, 0, 3, 0, 0, 'spruce_slab'); // 长条座面
builder.fill(0, 0, -1, 0, 0, -1, 'spruce_fence'); // 腿
builder.fill(3, 0, -1, 3, 0, -1, 'spruce_fence');
```

## 东方/亚洲风格

### 日式坐垫
```javascript
builder.setBlock(0, 0, 0, 'red_carpet');     // 坐垫
builder.setBlock(0, 0, 1, 'bamboo_mosaic_slab'); // 小桌
```

### 中式太师椅
```javascript
builder.setBlock(0, 0, 0, 'dark_oak_stairs');
builder.setBlock(0, 1, -1, 'dark_oak_trapdoor'); // 镂空靠背
builder.setBlock(-1, 0, 0, 'dark_oak_fence');    // 扶手
builder.setBlock(1, 0, 0, 'dark_oak_fence');
```

## 推荐方块

| 风格 | 座面 | 靠背 | 装饰 |
|------|------|------|------|
| 现代 | concrete, wool | wool, glass | iron_bars |
| 中世纪 | stairs, slab | planks, fence | carpet |
| 东方 | carpet, bamboo | trapdoor | lantern |
| 奇幻 | prismarine | end_stone | amethyst |
