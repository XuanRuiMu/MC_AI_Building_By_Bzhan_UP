---
name: 沙发设计
description: 单人沙发、双人沙发、L型沙发等各种沙发设计
---

# 🛋️ 沙发设计参考

## 单人沙发

### 现代单人沙发
```javascript
builder.setBlock(0, 0, 0, 'white_wool');               // 座垫
builder.setBlock(0, 0, -1, 'white_wool');              // 靠背
builder.setBlock(0, 1, -1, 'white_wool');              // 靠背上部
builder.setBlock(-1, 0, 0, 'quartz_slab');             // 左扶手
builder.setBlock(1, 0, 0, 'quartz_slab');              // 右扶手
```

### 皮质单人椅
```javascript
builder.setBlock(0, 0, 0, 'brown_wool');               // 座垫
builder.setBlock(0, 0, -1, 'brown_wool');              // 靠背
builder.setBlock(0, 1, -1, 'brown_wool');
builder.setBlock(-1, 0, 0, 'dark_oak_slab');           // 木质扶手
builder.setBlock(1, 0, 0, 'dark_oak_slab');
```

### 懒人沙发/豆袋
```javascript
builder.setBlock(0, 0, 0, 'red_wool');                 // 主体
builder.setBlock(0, 0, -1, 'red_wool');                // 靠背（低矮）
```

## 双人沙发

### 现代双人沙发
```javascript
// 座垫
builder.fill(0, 0, 0, 1, 0, 0, 'gray_wool');
// 靠背
builder.fill(0, 0, -1, 1, 1, -1, 'gray_wool');
// 扶手
builder.setBlock(-1, 0, 0, 'gray_concrete');
builder.setBlock(2, 0, 0, 'gray_concrete');
```

### 复古双人沙发
```javascript
builder.fill(0, 0, 0, 1, 0, 0, 'green_wool');          // 座垫
builder.fill(0, 0, -1, 1, 1, -1, 'green_wool');        // 靠背
builder.setBlock(-1, 0, 0, 'dark_oak_stairs');         // 弧形扶手
builder.setBlock(2, 0, 0, 'dark_oak_stairs');
builder.setBlock(-1, 0, -1, 'dark_oak_planks');        // 扶手后部
builder.setBlock(2, 0, -1, 'dark_oak_planks');
```

### 情侣沙发
```javascript
builder.fill(0, 0, 0, 1, 0, 0, 'pink_wool');
builder.fill(0, 0, -1, 1, 1, -1, 'pink_wool');
builder.setBlock(0, 0, 0, 'red_carpet');               // 心形装饰
```

## 三人沙发

### 标准三人沙发
```javascript
// 座垫
builder.fill(0, 0, 0, 2, 0, 0, 'light_gray_wool');
// 靠背
builder.fill(0, 0, -1, 2, 1, -1, 'light_gray_wool');
// 扶手
builder.fill(-1, 0, -1, -1, 0, 0, 'light_gray_concrete');
builder.fill(3, 0, -1, 3, 0, 0, 'light_gray_concrete');
```

### 带躺椅三人沙发
```javascript
// 主体
builder.fill(0, 0, 0, 2, 0, 0, 'white_wool');
builder.fill(0, 0, -1, 2, 1, -1, 'white_wool');
// 躺椅延伸
builder.fill(3, 0, 0, 3, 0, 1, 'white_wool');
builder.setBlock(3, 0, -1, 'white_wool');
```

## L型沙发

### 现代L型沙发
```javascript
// 长边
builder.fill(0, 0, 0, 3, 0, 0, 'gray_wool');           // 座垫
builder.fill(0, 0, -1, 3, 1, -1, 'gray_wool');         // 靠背
// 短边（转角）
builder.fill(0, 0, 1, 0, 0, 2, 'gray_wool');           // 座垫
builder.fill(-1, 0, 1, -1, 1, 2, 'gray_wool');         // 靠背
// 扶手
builder.setBlock(4, 0, 0, 'gray_concrete');
builder.setBlock(-1, 0, 3, 'gray_concrete');
```

### 大型转角沙发
```javascript
// 主体L型
builder.fill(0, 0, 0, 4, 0, 0, 'brown_wool');
builder.fill(0, 0, -1, 4, 1, -1, 'brown_wool');
builder.fill(0, 0, 1, 0, 0, 3, 'brown_wool');
builder.fill(-1, 0, 1, -1, 1, 3, 'brown_wool');
// 转角座位
builder.setBlock(0, 0, 0, 'brown_wool');
// 扶手
builder.fill(5, 0, -1, 5, 0, 0, 'dark_oak_slab');
builder.fill(-1, 0, 4, 0, 0, 4, 'dark_oak_slab');
```

## 沙发床

### 可展开沙发床
```javascript
// 沙发状态
builder.fill(0, 0, 0, 2, 0, 0, 'blue_wool');
builder.fill(0, 0, -1, 2, 1, -1, 'blue_wool');
// 展开后（床状态）
// builder.fill(0, 0, 0, 2, 0, 2, 'blue_wool');
```

## 户外沙发

### 藤编沙发
```javascript
builder.fill(0, 0, 0, 1, 0, 0, 'white_wool');          // 坐垫
builder.fill(0, 0, -1, 1, 1, -1, 'stripped_bamboo_block'); // 藤编靠背
builder.setBlock(-1, 0, 0, 'bamboo_fence');            // 扶手
builder.setBlock(2, 0, 0, 'bamboo_fence');
```

### 石质长椅
```javascript
builder.fill(0, 0, 0, 3, 0, 0, 'smooth_stone_slab');   // 座面
builder.setBlock(0, 0, -1, 'stone_brick_wall');        // 支撑
builder.setBlock(3, 0, -1, 'stone_brick_wall');
```

## 沙发配件

### 抱枕
```javascript
builder.setBlock(0, 1, 0, 'white_carpet');             // 小抱枕
builder.setBlock(1, 1, 0, 'red_carpet');               // 彩色抱枕
```

### 沙发毯
```javascript
builder.fill(0, 1, 0, 1, 1, 0, 'light_gray_carpet');   // 搭毯
```

### 边几
```javascript
builder.setBlock(2, 0, 0, 'oak_slab');                 // 小边几
builder.setBlock(2, 1, 0, 'lantern');                  // 台灯
```

## 推荐方块

| 风格 | 座垫 | 靠背 | 扶手 |
|------|------|------|------|
| 现代 | wool, concrete | wool | concrete, quartz |
| 复古 | wool | wool | dark_oak, stairs |
| 皮质 | brown_wool | brown_wool | dark_oak |
| 户外 | wool | bamboo, stripped_log | fence |
| 奢华 | red_wool, gold | wool | gold_block |
