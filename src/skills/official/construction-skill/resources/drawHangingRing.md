---
name: drawHangingRing
description: 在圆环范围内创建悬挂元素（适合垂柳）
---

# builder.drawHangingRing(x, y, z, radius, options)

在圆环范围内创建悬挂元素（非常适合垂柳树冠）。

## 参数
- `x, y, z`: 圆心坐标
- `radius`: 环的半径
- `options`: 配置对象（继承 drawHanging 的所有选项）

## 额外选项
- `density`: 悬挂密度 0.0-1.0（默认0.5）
- `innerRadius`: 内圈半径（默认0，填满整个圆）

## 示例
```javascript
// 垂柳树
function buildWillowTree(x, z) {
    // 树干
    builder.line(x, 1, z, x, 15, z, 'oak_log');
    // 树冠
    builder.drawSphere(x, 15, z, 5, 'oak_leaves');
    // 垂柳效果
    builder.drawHangingRing(x, 17, z, 6, {
        length: 8,
        lengthVariation: 4,
        density: 0.6,
        type: 'oak_leaves',
        sway: 1.5,
        swayDirection: 'random'
    });
}

// 吊灯环
builder.drawHangingRing(10, 15, 10, 4, {
    length: 3,
    density: 0.8,
    type: 'chain',
    tipType: 'lantern',
    innerRadius: 3  // 只在外圈
});
```
