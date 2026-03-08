---
name: walls
description: 只画4面墙（无地板天花板）
---

# builder.walls(x1, y1, z1, x2, y2, z2, block)

只画4面墙（无地板和天花板）。

## 参数
- `x1, y1, z1`: 起点坐标
- `x2, y2, z2`: 终点坐标
- `block`: 方块类型

## 与 fill 的区别
- `fill`: 填充整个立方体（实心）
- `walls`: 只画四面墙（空心，无顶无底）

## 示例
```javascript
// 创建一个房间的四面墙
builder.walls(0, 0, 0, 10, 5, 10, 'stone_bricks');

// 先画墙，再填地板
builder.walls(0, 1, 0, 10, 5, 10, 'white_terracotta');
builder.fill(1, 0, 1, 9, 0, 9, 'oak_planks');
```
