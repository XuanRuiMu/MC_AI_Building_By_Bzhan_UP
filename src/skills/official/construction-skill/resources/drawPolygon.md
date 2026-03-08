---
name: drawPolygon
description: 绘制正多边形柱体（八角形、六边形等），支持3D旋转
---

# builder.drawPolygon(x, y, z, radius, sides, height, material, options?)

绘制正多边形柱体（棱柱），支持3D旋转。

## 参数
- `x, y, z`: 中心底部坐标
- `radius`: 外接圆半径
- `sides`: 边数（3=三角, 6=六边, 8=八边）
- `height`: 高度
- `material`: 方块类型
- `options`: `{ hollow, thickness, rotation, rotateX, rotateY, rotateZ, noise }`

## 选项说明
- `hollow: true` - 空心
- `thickness: 2` - 墙厚度
- `rotation: 45` - Y轴旋转角度（度）- 简单旋转
- `rotateX/Y/Z: 度数` - 任意角度3D旋转
- `noise` - 有机形状

## 示例
```javascript
// 八角形塔楼
builder.drawPolygon(0, 0, 0, 5, 8, 15, 'stone_bricks');

// 空心八角塔（可进入）
builder.drawPolygon(0, 0, 0, 6, 8, 15, 'stone_bricks', { hollow: true });

// 六边形蜂巢
builder.drawPolygon(10, 5, 10, 3, 6, 4, 'honeycomb_block');

// 旋转45度的方形（Y轴简单旋转）
builder.drawPolygon(0, 0, 0, 5, 4, 10, 'quartz_block', { rotation: 45 });

// 倾斜的八角柱（3D旋转）
builder.drawPolygon(0, 10, 0, 4, 8, 8, 'stone_bricks', { rotateZ: 30 });

// 倾斜的三角柱
builder.drawPolygon(0, 5, 0, 3, 3, 6, 'prismarine', { rotateX: 45, rotateZ: 15 });
```
