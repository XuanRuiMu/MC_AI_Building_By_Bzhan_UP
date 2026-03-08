---
name: scatter3D
description: 在3D空间内随机散布方块
---

# builder.scatter3D(x1, y1, z1, x2, y2, z2, density, types, options?)

在3D空间内随机散布方块（适合墙面藤蔓、洞穴装饰）。

## 参数
- `x1, y1, z1, x2, y2, z2`: 立方体范围
- `density`: 密度 0.0-1.0
- `types`: 方块类型（字符串或数组）
- `options`: `{ requireSupport: true }`

## 示例
```javascript
// 墙面藤蔓
builder.scatter3D(0, 0, 0, 0, 10, 10, 0.2, 'vine');

// 洞穴发光浆果
builder.scatter3D(0, 0, 0, 20, 15, 20, 0.03, 'glow_lichen');

// 树叶间的萤火虫（发光方块）
builder.scatter3D(3, 12, 3, 7, 18, 7, 0.05, 'sea_lantern');
```
