---
name: drawCylinder
description: 绘制圆柱体，适合塔楼、柱子、树干
---

# builder.drawCylinder(x, y, z, radius, height, material, options?)

绘制圆柱体，适合塔楼、柱子、树干。

## 参数
- `x, y, z`: 中心底部坐标
- `radius`: 半径
- `height`: 高度
- `material`: 方块类型
- `options`: `{ hollow, thickness, axis, noise }`

## 选项说明
- `hollow: true` - 空心（可行走的塔楼）
- `thickness: 2` - 空心时的墙厚度
- `axis: 'y'|'x'|'z'` - 圆柱方向
- `noise: { amount: 0.3, scale: 0.2 }` - 有机不规则形状

## 示例
```javascript
// 实心圆柱塔楼
builder.drawCylinder(10, 0, 10, 5, 15, 'stone_bricks');

// 空心塔楼（可进入）
builder.drawCylinder(10, 0, 10, 5, 15, 'stone_bricks', { hollow: true });

// 有机树干
builder.drawCylinder(0, 0, 0, 2, 10, 'oak_log', {
    noise: { amount: 0.3, scale: 0.2 }
});

// 横向圆柱（管道）
builder.drawCylinder(0, 5, 0, 2, 10, 'iron_block', { axis: 'x' });
```
