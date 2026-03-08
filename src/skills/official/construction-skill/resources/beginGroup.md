---
name: beginGroup
description: 开始一个逻辑分组，设置优先级
---

# builder.beginGroup(name, options?)

开始一个逻辑分组，后续方块都属于这个组。

## 参数
- `name`: 分组名称
- `options`: `{ priority: number }`

## 优先级参考
- door = 100（最高，门总是覆盖其他）
- frame = 95（框架）
- windows = 70（窗户）
- roof = 60（屋顶）
- walls = 50（墙体）
- decor = 20（装饰）
- 0 = 默认

## 示例
```javascript
builder.beginGroup('frame', { priority: 95 });
builder.line(0, 0, 0, 0, 5, 0, 'oak_log');
builder.line(10, 0, 0, 10, 5, 0, 'oak_log');
builder.endGroup();

builder.beginGroup('walls', { priority: 50 });
builder.fill(1, 0, 0, 9, 5, 0, 'white_terracotta');
builder.endGroup();
```
