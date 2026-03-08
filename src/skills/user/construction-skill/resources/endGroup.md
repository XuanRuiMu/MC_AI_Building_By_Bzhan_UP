---
name: endGroup
description: 结束当前分组
---

# builder.endGroup()

结束当前分组，优先级重置为默认值 0。

## 示例
```javascript
builder.beginGroup('roof', { priority: 60 });
// ... 屋顶代码 ...
builder.endGroup();  // 优先级重置为 0
```
