---
name: drawSpiralStairs
description: 绘制螺旋楼梯
---

# builder.drawSpiralStairs(x, y, z, radius, height, material, options?)

绘制螺旋楼梯。

## 参数
- `x, y, z`: 中心底部坐标
- `radius`: 楼梯半径
- `height`: 总高度
- `material`: 楼梯方块类型
- `options`: 配置对象

## 选项说明
- `width`: 台阶宽度（默认2）
- `turns`: 旋转圈数（默认1）
- `clockwise`: 顺时针（默认true）
- `pillar`: 是否添加中央柱子
- `pillarType`: 柱子材料

## 示例
```javascript
// 基础螺旋楼梯
builder.drawSpiralStairs(5, 0, 5, 3, 10, 'oak_stairs');

// 宽楼梯带中央柱
builder.drawSpiralStairs(10, 0, 10, 4, 15, 'stone_brick_stairs', {
    width: 2,
    turns: 2,
    pillar: true,
    pillarType: 'stone_bricks'
});

// 逆时针楼梯
builder.drawSpiralStairs(0, 0, 0, 3, 8, 'dark_oak_stairs', {
    clockwise: false
});
```
