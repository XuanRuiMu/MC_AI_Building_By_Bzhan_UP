---
name: construction_skill
description: 使用 VoxelBuilder API 生成 JavaScript 代码来建造结构。在建筑之务必使用此技能来查看和创建实际的建筑代码。
---

# 📝 建造技能

使用 VoxelBuilder API 生成 JavaScript 代码来建造建筑。

## VoxelBuilder API

### 基础方块操作
| 方法 | 用途 |
|------|------|
| `builder.set(x, y, z, block)` | 放置单个方块 |
| `builder.get(x, y, z)` | 获取指定位置方块 |
| `builder.fill(x1, y1, z1, x2, y2, z2, block)` | 填充立方体区域 |
| `builder.walls(x1, y1, z1, x2, y2, z2, block)` | 建四面墙（空心） |
| `builder.line(x1, y1, z1, x2, y2, z2, block)` | 画直线/斜线 |
| `builder.clear(...)` | 清空区域 |

### 分组与优先级
| 方法 | 用途 |
|------|------|
| `builder.beginGroup(name, { priority })` | 开始分组 |
| `builder.endGroup()` | 结束分组 |
| `builder.setPriority(n)` | 设置优先级 |

优先级: door=100, frame=95, windows=70, roof=60, walls=50, decor=20

### 门窗
| 方法 | 用途 |
|------|------|
| `builder.setDoor(x, y, z, type)` | 放置双格门 |

### 屋顶
| 方法 | 用途 |
|------|------|
| `builder.drawRoofBounds(x1,y,z1,x2,z2,h,style,mat,opts)` | 矩形屋顶 |
| `builder.drawPolyRoof(x,y,z,r,h,sides,style,mat)` | 多边形屋顶 |

style: straight/gambrel/arch/cone/dome/curve/steep
opts: { gable: '材料', ridge: '屋脊材料' }

### 几何体
| 方法 | 用途 |
|------|------|
| `builder.drawCylinder(x,y,z,r,h,mat,opts)` | 圆柱体 |
| `builder.drawSphere(x,y,z,r,mat,opts)` | 球体 |
| `builder.drawEllipsoid(x,y,z,rx,ry,rz,mat,opts)` | 椭球体 |
| `builder.drawPolygon(x,y,z,r,sides,h,mat,opts)` | 多边形柱 |
| `builder.drawPyramid(x,y,z,base,h,mat,opts)` | 金字塔 |
| `builder.drawTorus(x,y,z,R,r,mat,opts)` | 圆环 |

**通用 options:**
- `hollow`: 是否空心
- `thickness`: 壁厚
- `axis`: 'y'|'x'|'z' (简单轴向)
- `noise`: { amount, scale } (有机形状)
- `rotateX/Y/Z`: 任意角度旋转 (度数)

**旋转示例:**
```javascript
// 倾斜的手臂 (Z轴旋转45度)
builder.drawCylinder(x, y, z, 2, 8, 'oak_planks', { rotateZ: 45 });

// 倾斜的椭球 (用于人体部位)
builder.drawEllipsoid(x, y, z, 2, 5, 2, 'white_wool', { rotateZ: 30, rotateX: 15 });

// 倾斜的圆环 (光环效果)
builder.drawTorus(x, y, z, 5, 1, 'gold_block', { rotateX: 30 });
```

### 曲线与装饰
| 方法 | 用途 |
|------|------|
| `builder.drawBezier(points,mat,w)` | 贝塞尔曲线 |
| `builder.scatter(x1,y,z1,x2,z2,d,types)` | 2D散布花草 |
| `builder.scatter3D(...)` | 3D空间散布 |
| `builder.drawHanging(x,y,z,opts)` | 单点悬挂物 |
| `builder.drawHangingRing(x,y,z,r,opts)` | 环形悬挂 |
| `builder.drawSpiralStairs(x,y,z,r,h,mat)` | 螺旋楼梯 |

### 组件系统
| 方法 | 用途 |
|------|------|
| `builder.defineComponent(name,fn)` | 定义组件 |
| `builder.placeComponent(name,x,y,z)` | 放置组件 |

options: { rotateY: 0/90/180/270 }

### 方块属性语法
```
'stone'                              // 普通方块
'oak_stairs?facing=north'            // 楼梯朝向
'oak_door?facing=south,half=lower'   // 门下半
'oak_log?axis=x'                     // 原木横放
'lantern?hanging=true'               // 悬挂灯笼
```

## 使用方法

想了解具体用法，请使用 `read_subdoc` 查阅资源文档。
