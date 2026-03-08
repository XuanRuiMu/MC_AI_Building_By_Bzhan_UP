---
name: set
description: 放置单个方块
---

# builder.set(x, y, z, block, options?)

放置单个方块。

## 参数
- `x, y, z`: 坐标位置
- `block`: 方块类型字符串
- `options`: 可选 `{ priority: number }`

## 方块属性语法
```javascript
'stone'                              // 基础方块
'oak_stairs?facing=north'            // 带朝向
'oak_door?facing=south,half=lower'   // 多属性
'oak_log?axis=x'                     // 轴向
'lantern?hanging=true'               // 悬挂
'spruce_trapdoor?facing=west,open=true'
```

## 示例
```javascript
builder.set(0, 0, 0, 'stone');
builder.set(5, 3, 2, 'oak_stairs?facing=north');
builder.set(0, 5, 0, 'lantern?hanging=true', { priority: 50 });
```
