---
name: line
description: 在两点之间画直线
---

# builder.line(x1, y1, z1, x2, y2, z2, block)

在两点之间画直线。

## 参数
- `x1, y1, z1`: 起点坐标
- `x2, y2, z2`: 终点坐标
- `block`: 方块类型

## 示例
```javascript
// 垂直柱子
builder.line(0, 0, 0, 0, 10, 0, 'oak_log');

// 水平横梁（指定轴向）
builder.line(0, 5, 0, 10, 5, 0, 'oak_log?axis=x');

// 斜线
builder.line(0, 0, 0, 5, 5, 5, 'stone');
```
