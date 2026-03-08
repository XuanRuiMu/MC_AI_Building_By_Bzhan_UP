---
name: clear
description: 清除区域内的方块或重置画布
---

# builder.clear(x1?, y1?, z1?, x2?, y2?, z2?)

清除区域内的方块（设为空气）或重置整个画布。

## 参数
- 无参数：重置整个 builder 状态
- 有参数：清除指定区域（填充为 AIR）

## 示例
```javascript
// 重置整个画布
builder.clear();

// 清除指定区域
builder.clear(0, 0, 0, 10, 10, 10);

// 挖空房间内部
builder.fill(0, 0, 0, 10, 5, 10, 'stone_bricks');  // 先建实心
builder.clear(1, 1, 1, 9, 4, 9);                    // 再挖空内部
```
