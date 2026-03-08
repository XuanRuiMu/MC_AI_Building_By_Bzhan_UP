---
name: get
description: 获取指定位置的方块类型
---

# builder.get(x, y, z)

获取指定位置的方块类型。

## 参数
- `x, y, z`: 坐标位置

## 返回值
- 方块类型字符串，如果为空则返回 `null`

## 示例
```javascript
const block = builder.get(5, 3, 2);
if (block === 'stone') {
    // 该位置是石头
}

// 检查位置是否为空
if (!builder.get(x, y, z)) {
    builder.set(x, y, z, 'cobblestone');
}
```
