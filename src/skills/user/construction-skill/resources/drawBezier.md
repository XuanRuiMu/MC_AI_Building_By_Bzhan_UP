---
name: drawBezier
description: 通过控制点绘制平滑贝塞尔曲线
---

# builder.drawBezier(points, material, width?)

通过控制点绘制平滑贝塞尔曲线。

## 参数
- `points`: 控制点数组 `[{x,y,z}, ...]`（3或4个点）
- `material`: 方块类型
- `width`: 线宽（默认1）

## 曲线类型
- 3个点：二次贝塞尔曲线
- 4个点：三次贝塞尔曲线

## 示例
```javascript
// 悬挂的锁链（二次曲线）
builder.drawBezier([
    {x: 0, y: 10, z: 0},
    {x: 5, y: 5, z: 0},   // 下垂点
    {x: 10, y: 10, z: 0}
], 'chain');

// S形曲线（三次曲线）
builder.drawBezier([
    {x: 0, y: 0, z: 0},
    {x: 3, y: 5, z: 0},
    {x: 7, y: 5, z: 0},
    {x: 10, y: 10, z: 0}
], 'oak_log');

// 藤蔓根系
builder.drawBezier([
    {x: 5, y: 10, z: 5},
    {x: 3, y: 5, z: 3},
    {x: 0, y: 0, z: 0}
], 'oak_log');
```
