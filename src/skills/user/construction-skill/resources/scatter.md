---
name: scatter
description: 在2D平面上随机散布方块
---

# builder.scatter(x1, y, z1, x2, z2, density, types, options?)

在2D平面上随机散布方块（适合地面装饰）。

## 参数
- `x1, z1, x2, z2`: 平面范围
- `y`: 放置高度
- `density`: 密度 0.0-1.0
- `types`: 方块类型（字符串或数组）
- `options`: `{ requireSupport: true }`

## 选项说明
- `requireSupport: true` - 只在有支撑的位置放置（默认）
- `requireSupport: false` - 忽略支撑检查

## 示例
```javascript
// 草地上的花
builder.scatter(0, 1, 0, 20, 20, 0.15, ['grass', 'poppy', 'dandelion']);

// 稀疏的蘑菇
builder.scatter(0, 1, 0, 15, 15, 0.05, ['red_mushroom', 'brown_mushroom']);

// 地毯装饰
builder.scatter(1, 1, 1, 9, 9, 0.3, ['white_carpet', 'light_gray_carpet']);
```
