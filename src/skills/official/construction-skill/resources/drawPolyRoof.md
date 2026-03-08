---
name: drawPolyRoof
description: 绘制多边形/圆锥形屋顶，适合塔楼
---

# builder.drawPolyRoof(x, y, z, radius, height, sides, style, material)

绘制多边形/圆锥形屋顶，适合塔楼。

## 参数
- `x, y, z`: 中心底部坐标
- `radius`: 底部半径
- `height`: 屋顶高度
- `sides`: 边数（4=金字塔, 8=八角, 20=圆锥）
- `style`: 样式
- `material`: 楼梯方块类型

## 样式说明
- `cone`: 直锥形（巫师塔、城堡炮塔）
- `dome`: 半球形穹顶（教堂、神殿）
- `curve`: 亚洲/奇幻曲线（宝塔）
- `steep`: 尖锐哥特式尖塔

## 示例
```javascript
// 城堡塔楼圆锥屋顶
builder.drawPolyRoof(5, 20, 5, 4, 6, 20, 'cone', 'dark_oak_stairs');

// 八角形瞭望塔
builder.drawPolyRoof(10, 15, 10, 5, 4, 8, 'curve', 'spruce_stairs');

// 穹顶
builder.drawPolyRoof(0, 10, 0, 6, 5, 20, 'dome', 'stone_brick_stairs');

// 金字塔形
builder.drawPolyRoof(0, 0, 0, 10, 8, 4, 'cone', 'sandstone_stairs');
```
