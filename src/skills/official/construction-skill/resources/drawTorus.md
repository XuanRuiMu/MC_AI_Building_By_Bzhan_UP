---
name: drawTorus
description: 绘制圆环（甜甜圈形状），支持3D旋转
---

# builder.drawTorus(x, y, z, R, r, material, options?)

绘制圆环（甜甜圈形状），支持3D旋转。

## 参数
- `x, y, z`: 中心坐标
- `R`: 主半径（中心到管道中心的距离）
- `r`: 次半径（管道粗细）
- `material`: 方块类型
- `options`: `{ axis, noise, rotateX, rotateY, rotateZ }`

## 选项说明
- `axis: 'y'|'x'|'z'` - 圆环平面方向（简单轴向）
- `noise` - 有机形状
- `rotateX/Y/Z: 度数` - 任意角度3D旋转

## 示例
```javascript
// 水平圆环（光环）
builder.drawTorus(0, 20, 0, 6, 1, 'gold_block', { axis: 'y' });

// 垂直圆环（传送门框架）
builder.drawTorus(0, 5, 0, 5, 2, 'obsidian', { axis: 'x' });

// 装饰环
builder.drawTorus(10, 10, 10, 4, 1, 'prismarine');

// 倾斜的光环（3D旋转）
builder.drawTorus(0, 15, 0, 5, 1, 'gold_block', { rotateX: 30 });

// 任意角度的装饰环
builder.drawTorus(0, 10, 0, 6, 1, 'diamond_block', { rotateX: 45, rotateZ: 30 });
```
