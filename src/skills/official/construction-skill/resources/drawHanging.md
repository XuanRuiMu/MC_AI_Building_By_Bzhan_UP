---
name: drawHanging
description: 从指定点向下悬挂元素（藤蔓、锁链等）
---

# builder.drawHanging(x, y, z, options)

从指定点向下悬挂元素（藤蔓、锁链、树叶等）。

## 参数
- `x, y, z`: 起始点（顶部）
- `options`: 配置对象

## 选项说明
- `length`: 平均长度（默认5）
- `lengthVariation`: 长度随机变化（默认3）
- `count`: 悬挂条数（默认1）
- `spread`: 水平扩散范围（默认0）
- `type`: 方块类型（字符串或数组）
- `tipType`: 末端使用不同方块
- `sway`: 水平摆动幅度（默认0）
- `swayDirection`: 摆动方向 'random'|'north'|'south'|'east'|'west'

## 示例
```javascript
// 单条藤蔓
builder.drawHanging(5, 15, 5, {
    length: 8,
    type: 'vine'
});

// 多条悬挂树叶（垂柳效果）
builder.drawHanging(10, 20, 10, {
    length: 6,
    lengthVariation: 3,
    count: 5,
    spread: 2,
    type: 'oak_leaves',
    sway: 1
});

// 锁链吊灯
builder.drawHanging(5, 10, 5, {
    length: 4,
    type: 'chain',
    tipType: 'lantern'
});
```
