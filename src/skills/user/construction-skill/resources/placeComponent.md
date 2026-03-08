---
name: placeComponent
description: 放置已定义的组件实例，支持旋转
---

# builder.placeComponent(name, x, y, z, params?, options?)

放置已定义的组件实例。

## 参数
- `name`: 组件名称
- `x, y, z`: 放置位置（组件原点对齐到此坐标）
- `params`: 传给组件的参数对象
- `options`: `{ rotateY: 0|90|180|270 }`

## 旋转说明
- `rotateY: 0` - 不旋转（默认）
- `rotateY: 90` - 顺时针90度
- `rotateY: 180` - 180度
- `rotateY: 270` - 逆时针90度

旋转会自动调整方块的 `facing` 属性。

## 示例
```javascript
// 先定义组件
builder.defineComponent('window', (b, params) => {
    b.fill(0, 0, 0, 1, 1, 0, 'glass_pane');
});

// 在不同位置放置
builder.placeComponent('window', 3, 2, 0);   // 南墙
builder.placeComponent('window', 7, 2, 0);   // 南墙

// 旋转放置到其他墙
builder.placeComponent('window', 0, 2, 3, {}, { rotateY: 90 });   // 西墙
builder.placeComponent('window', 10, 2, 3, {}, { rotateY: 270 }); // 东墙

// 带参数放置
builder.placeComponent('wall_segment', 0, 0, 0, {
    width: 6,
    height: 4,
    material: 'white_terracotta'
});
```
