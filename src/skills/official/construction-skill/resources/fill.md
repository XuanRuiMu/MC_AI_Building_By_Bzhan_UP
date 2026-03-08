---
name: fill
description: 填充实心立方体区域
---

# builder.fill(x1, y1, z1, x2, y2, z2, block)

填充实心立方体区域。

## 参数
- `x1, y1, z1`: 起点坐标
- `x2, y2, z2`: 终点坐标
- `block`: 方块类型

## 示例
```javascript
// 填充一个 5x3x5 的石头立方体
builder.fill(0, 0, 0, 5, 3, 5, 'stone');

// 创建地板
builder.fill(0, 0, 0, 10, 0, 10, 'oak_planks');

// 创建实心墙
builder.fill(0, 0, 0, 10, 5, 0, 'stone_bricks');
```
