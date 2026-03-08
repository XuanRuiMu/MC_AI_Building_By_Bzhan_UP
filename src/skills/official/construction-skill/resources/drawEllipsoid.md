---
name: drawEllipsoid
description: 绘制椭球体（三轴半径不同的球），支持任意角度旋转
---

# builder.drawEllipsoid(x, y, z, rx, ry, rz, material, options?)

绘制椭球体（三轴半径不同的球），支持任意角度旋转。

## 参数
- `x, y, z`: 中心坐标
- `rx, ry, rz`: 三个轴的半径
- `material`: 方块类型
- `options`: `{ hollow, noise, rotateX, rotateY, rotateZ }`

## 选项说明
- `hollow: true` - 空心
- `noise: { amount, scale }` - 有机形状
- `rotateX/Y/Z: 度数` - 任意角度3D旋转

## 形状变化
- `rx = ry = rz`: 球体
- `ry < rx, rz`: 扁平穹顶
- `ry > rx, rz`: 高蛋形

## 示例
```javascript
// 扁平树冠
builder.drawEllipsoid(10, 15, 10, 6, 3, 6, 'oak_leaves');

// 高蛋形
builder.drawEllipsoid(5, 5, 5, 3, 6, 3, 'white_wool');

// 空心穹顶建筑
builder.drawEllipsoid(0, 0, 0, 10, 8, 10, 'stone_bricks', { hollow: true });

// 有机岩石
builder.drawEllipsoid(0, 5, 0, 5, 4, 6, 'mossy_cobblestone', {
    noise: { amount: 0.4, scale: 0.3 }
});

// 倾斜的手臂（人体建模）
builder.drawEllipsoid(0, 10, 0, 2, 5, 2, 'white_wool', { rotateZ: 45 });

// 倾斜的头部
builder.drawEllipsoid(0, 20, 0, 3, 4, 3, 'white_wool', { rotateX: 15, rotateZ: 10 });
```
