---
name: drawSphere
description: 绘制球体
---

# builder.drawSphere(x, y, z, radius, material, options?)

绘制球体。

## 参数
- `x, y, z`: 球心坐标
- `radius`: 半径
- `material`: 方块类型
- `options`: `{ hollow, noise }`

## 选项说明
- `hollow: true` - 空心球体
- `noise: { amount: 0.3, scale: 0.2 }` - 有机不规则形状

## 示例
```javascript
// 实心球体
builder.drawSphere(10, 10, 10, 5, 'stone');

// 空心球体（穹顶房间）
builder.drawSphere(10, 10, 10, 8, 'glass', { hollow: true });

// 树冠（有机形状）
builder.drawSphere(5, 15, 5, 4, 'oak_leaves', {
    noise: { amount: 0.4, scale: 0.3 }
});

// 岩石球
builder.drawSphere(0, 5, 0, 6, 'cobblestone', {
    noise: { amount: 0.5, scale: 0.25 }
});
```
