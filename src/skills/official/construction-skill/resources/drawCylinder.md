---
name: drawCylinder
description: 绘制圆柱体，适合塔楼、柱子、树干、人体四肢
---

# builder.drawCylinder(x, y, z, radius, height, material, options?)

绘制圆柱体，适合塔楼、柱子、树干、人体四肢。

## 参数
- `x, y, z`: 中心底部坐标
- `radius`: 半径
- `height`: 高度
- `material`: 方块类型
- `options`: `{ hollow, thickness, axis, noise, rotateX, rotateY, rotateZ }`

## 选项说明
- `hollow: true` - 空心（可行走的塔楼）
- `thickness: 2` - 空心时的墙厚度
- `axis: 'y'|'x'|'z'` - 圆柱方向（简单轴向）
- `noise: { amount: 0.3, scale: 0.2 }` - 有机不规则形状
- `rotateX/Y/Z: 度数` - 任意角度3D旋转（用于倾斜的四肢等）

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

// 横向圆柱（管道）- 使用简单轴向
builder.drawCylinder(0, 5, 0, 2, 10, 'iron_block', { axis: 'x' });

// 倾斜的手臂（Z轴旋转45度）
builder.drawCylinder(0, 10, 0, 2, 8, 'white_wool', { rotateZ: 45 });

// 倾斜的腿（多轴旋转）
builder.drawCylinder(0, 0, 0, 2, 10, 'blue_wool', { rotateX: 15, rotateZ: -20 });
```
