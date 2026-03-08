---
name: 卫浴家具
description: 马桶、浴缸、洗手台等卫浴设备设计
---

# 🚿 卫浴家具设计参考

## 马桶

### 现代马桶
```javascript
builder.setBlock(0, 0, 0, 'quartz_block');             // 底座
builder.setBlock(0, 1, 0, 'quartz_stairs');            // 马桶座（楼梯朝后）
builder.setBlock(0, 1, -1, 'quartz_slab');             // 水箱
builder.setBlock(0, 0, 1, 'stone_button');             // 冲水按钮
```

### 简约马桶
```javascript
builder.setBlock(0, 0, 0, 'white_concrete');
builder.setBlock(0, 1, 0, 'cauldron');                 // 马桶圈
builder.setBlock(0, 1, -1, 'white_concrete');          // 水箱
```

### 蹲厕（亚洲风）
```javascript
builder.fill(0, 0, 0, 0, 0, 1, 'quartz_slab');         // 蹲坑
builder.setBlock(0, 0, 0, 'water');                    // 水
```

## 浴缸

### 现代浴缸
```javascript
builder.fill(0, 0, 0, 1, 1, 2, 'quartz_block');        // 浴缸外壳
builder.fill(0, 1, 0, 0, 1, 1, 'air');                 // 挖空内部
builder.setBlock(0, 0, 0, 'water');                    // 水
builder.setBlock(0, 0, 1, 'water');
builder.setBlock(1, 1, 0, 'lever');                    // 水龙头
```

### 爪足浴缸（复古）
```javascript
builder.fill(0, 1, 0, 1, 1, 2, 'white_terracotta');    // 浴缸
builder.setBlock(0, 0, 0, 'iron_bars');                // 爪足
builder.setBlock(1, 0, 0, 'iron_bars');
builder.setBlock(0, 0, 2, 'iron_bars');
builder.setBlock(1, 0, 2, 'iron_bars');
builder.setBlock(0, 1, 1, 'water');                    // 水
```

### 日式浴桶
```javascript
builder.drawCylinder(0, 0, 0, 1, 2, 'spruce_planks'); // 木桶
builder.setBlock(0, 0, 0, 'water');                    // 水
builder.setBlock(0, 1, 0, 'water');
```

### 按摩浴缸
```javascript
builder.fill(0, 0, 0, 2, 1, 2, 'black_concrete');      // 浴缸
builder.fill(1, 0, 1, 1, 0, 1, 'water');               // 水
builder.setBlock(0, 1, 0, 'sea_lantern');              // 灯光
builder.setBlock(2, 1, 0, 'sea_lantern');
```

## 淋浴

### 现代淋浴间
```javascript
// 底盘
builder.fill(0, 0, 0, 1, 0, 1, 'smooth_quartz');
// 玻璃围挡
builder.fill(0, 1, 0, 0, 2, 1, 'glass_pane');
builder.fill(0, 1, 0, 1, 2, 0, 'glass_pane');
// 花洒
builder.setBlock(1, 3, 1, 'iron_trapdoor');            // 花洒头
builder.setBlock(1, 2, 1, 'chain');                    // 花洒杆
```

### 雨淋花洒
```javascript
builder.fill(0, 3, 0, 1, 3, 1, 'iron_trapdoor');       // 大花洒
builder.setBlock(0, 2, 0, 'chain');
```

### 户外淋浴
```javascript
builder.fill(0, 0, 0, 0, 3, 0, 'oak_fence');           // 支柱
builder.setBlock(0, 3, 0, 'cauldron');                 // 花洒
builder.setBlock(0, 0, 1, 'stone_slab');               // 站台
```

## 洗手台

### 现代洗手台
```javascript
builder.fill(0, 1, 0, 1, 1, 0, 'smooth_quartz');       // 台面
builder.setBlock(0, 1, 0, 'cauldron');                 // 水槽
builder.setBlock(0, 2, -1, 'lever');                   // 水龙头
// 镜子
builder.fill(0, 2, -1, 1, 3, -1, 'glass');
```

### 双人洗手台
```javascript
builder.fill(0, 1, 0, 3, 1, 0, 'white_concrete');      // 长台面
builder.setBlock(0, 1, 0, 'cauldron');                 // 左水槽
builder.setBlock(3, 1, 0, 'cauldron');                 // 右水槽
builder.setBlock(0, 2, -1, 'tripwire_hook');           // 左龙头
builder.setBlock(3, 2, -1, 'tripwire_hook');           // 右龙头
// 大镜子
builder.fill(0, 2, -1, 3, 4, -1, 'glass');
```

### 台上盆
```javascript
builder.fill(0, 0, 0, 1, 1, 0, 'oak_planks');          // 柜体
builder.setBlock(0, 2, 0, 'flower_pot');               // 台上盆
builder.setBlock(0, 3, -1, 'lever');                   // 龙头
```

## 卫浴配件

### 毛巾架
```javascript
builder.fill(0, 2, 0, 1, 2, 0, 'iron_bars');           // 横杆
builder.setBlock(0, 1, 0, 'white_carpet');             // 毛巾
```

### 浴室镜柜
```javascript
builder.fill(0, 2, 0, 1, 3, 0, 'glass');               // 镜面
builder.fill(0, 2, -1, 1, 3, -1, 'oak_planks');        // 柜体
```

### 马桶刷架
```javascript
builder.setBlock(0, 0, 0, 'flower_pot');               // 刷架
```

### 卫生纸架
```javascript
builder.setBlock(0, 1, 0, 'tripwire_hook');            // 纸架
builder.setBlock(0, 1, 1, 'white_wool');               // 纸卷
```

### 浴帘
```javascript
builder.fill(0, 1, 0, 2, 3, 0, 'white_banner');        // 浴帘
builder.fill(0, 4, 0, 2, 4, 0, 'iron_bars');           // 帘杆
```

## 推荐方块

| 设备 | 主体 | 配件 | 风格 |
|------|------|------|------|
| 马桶 | quartz, concrete | button, lever | 现代 |
| 浴缸 | quartz, terracotta | water | 现代/复古 |
| 洗手台 | concrete, planks | cauldron, glass | 通用 |
| 淋浴 | glass_pane | iron_trapdoor | 现代 |
