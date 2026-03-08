---
name: drawPyramid
description: 绘制方形金字塔，支持3D旋转
---

# builder.drawPyramid(x, y, z, baseSize, height, material, options?)

绘制方形金字塔，支持3D旋转。

## 参数
- `x, y, z`: 底部中心坐标
- `baseSize`: 底边长度
- `height`: 高度
- `material`: 方块类型
- `options`: `{ filled, noise, rotateX, rotateY, rotateZ }`

## 选项说明
- `filled: true` - 实心（默认）
- `filled: false` - 只有外壳
- `noise` - 有机不规则边缘
- `rotateX/Y/Z: 度数` - 任意角度3D旋转

## 示例
```javascript
// 沙漠金字塔
builder.drawPyramid(0, 0, 0, 20, 15, 'sandstone');

// 空心金字塔
builder.drawPyramid(0, 0, 0, 15, 10, 'stone_bricks', { filled: false });

// 风化金字塔
builder.drawPyramid(0, 0, 0, 18, 12, 'sandstone', {
    noise: { amount: 0.3, scale: 0.2 }
});

// 倾斜的金字塔装饰
builder.drawPyramid(0, 10, 0, 8, 6, 'gold_block', { rotateZ: 30 });

// 悬挂的倒金字塔
builder.drawPyramid(0, 20, 0, 10, 8, 'prismarine', { rotateX: 180 });
```
