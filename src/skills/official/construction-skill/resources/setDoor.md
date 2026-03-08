---
name: setDoor
description: 放置门，自动清除前后方块
---

# builder.setDoor(x, y, z, doorType)

放置门，自动清除门前后的方块，优先级为 100（最高）。

## 参数
- `x, y, z`: 门下半部分的坐标
- `doorType`: 门类型，需要指定朝向

## 门类型示例
```
oak_door?facing=north
oak_door?facing=south
oak_door?facing=east
oak_door?facing=west
spruce_door?facing=south
dark_oak_door?facing=north
iron_door?facing=east
```

## 示例
```javascript
// 朝南的橡木门
builder.setDoor(5, 1, 0, 'oak_door?facing=south');

// 朝北的云杉门
builder.setDoor(3, 1, 10, 'spruce_door?facing=north');
```

## 注意
- 门会自动放置上下两格
- 门前后的方块会被自动清除（设为空气）
- 优先级 100，会覆盖任何其他方块（包括框架柱子）
