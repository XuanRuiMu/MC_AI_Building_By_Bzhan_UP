---
name: drawRoofBounds
description: 绘制矩形屋顶，支持山墙自动填充和屋脊装饰
---

# builder.drawRoofBounds(x1, y, z1, x2, z2, height, style, material, options?)

绘制矩形屋顶，自动处理楼梯朝向和山墙填充。

## 参数
- `x1, z1, x2, z2`: 屋顶底部边界
- `y`: 屋顶起始高度
- `height`: 屋顶高度（控制坡度）
- `style`: 样式 'straight' | 'gambrel' | 'arch'
- `material`: 楼梯方块类型
- `options`:
  - `gable`: 山墙填充材料
  - `gableOffset`: 山墙偏移（默认1）
  - `ridge`: 屋脊装饰材料（如 'dark_oak_slab'），自动沿屋顶峰线放置

## 坡度计算
- `height = halfWidth` → 45°（标准）
- `height > halfWidth` → 更陡（哥特式）
- `height < halfWidth` → 更缓（现代）

## 样式说明
- `straight`: 标准A字形三角屋顶
- `gambrel`: 谷仓风格双坡屋顶
- `arch`: 圆弧形屋顶

## 示例
```javascript
// 标准45度屋顶，带山墙和屋脊装饰
builder.drawRoofBounds(0, 10, 0, 10, 8, 5, 'straight', 'dark_oak_stairs', {
    gable: 'spruce_planks',
    ridge: 'dark_oak_slab'  // 自动在屋顶峰线放置屋脊
});

// 陡峭哥特式屋顶
builder.drawRoofBounds(0, 10, 0, 10, 8, 8, 'straight', 'stone_brick_stairs');

// 谷仓风格
builder.drawRoofBounds(0, 10, 0, 12, 10, 6, 'gambrel', 'spruce_stairs');
```
