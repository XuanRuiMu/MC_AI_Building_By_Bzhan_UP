---
name: setPriority
description: 设置后续方块的优先级
---

# builder.setPriority(priority)

设置后续方块的优先级（不使用分组时）。

## 参数
- `priority`: 数字，越高越不容易被覆盖

## 示例
```javascript
builder.setPriority(100);
builder.set(5, 0, 0, 'oak_door?facing=south');
builder.setPriority(0);  // 重置
```
