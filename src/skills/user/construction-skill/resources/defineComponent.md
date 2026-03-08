---
name: defineComponent
description: 定义可复用的组件模板
---

# builder.defineComponent(name, buildFn)

定义可复用的组件模板。

## 参数
- `name`: 组件名称
- `buildFn`: 构建函数 `(b, params) => { ... }`
  - `b`: 迷你 builder（坐标相对于组件原点）
  - `params`: 放置时传入的参数

## 示例
```javascript
// 定义窗户组件
builder.defineComponent('window', (b, params) => {
    const w = params.width || 2;
    const h = params.height || 2;
    b.fill(0, 0, 0, w-1, h-1, 0, 'glass_pane');
    // 窗框
    b.line(0, h, 0, w-1, h, 0, 'spruce_trapdoor?facing=north,open=true');
});

// 定义柱子组件
builder.defineComponent('pillar', (b, params) => {
    const h = params.height || 5;
    b.line(0, 0, 0, 0, h, 0, 'stone_bricks');
    b.set(0, h, 0, 'stone_brick_slab?type=top');
});

// 定义带参数的墙段
builder.defineComponent('wall_segment', (b, params) => {
    const w = params.width || 4;
    const h = params.height || 3;
    const mat = params.material || 'stone_bricks';
    b.fill(0, 0, 0, w-1, h-1, 0, mat);
});
```
