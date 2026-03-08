---
name: quality_skill
description: 建筑质量检查。验证代码语法、检查结构问题、确保细节完整。
---

# ✅ Quality Skill

建筑质量检查和代码验证。

## 使用时机

- 代码生成后验证
- 完成构建前的最终检查
- 排查错误时

## 检查清单

### 结构完整性
- [ ] 墙体闭合无缝隙
- [ ] 屋顶下的三角形山墙已填充
- [ ] 地基完整

### 细节完整性
- [ ] 窗户有百叶窗/窗框
- [ ] 门有台阶/门廊
- [ ] 内部有家具（如果是可居住建筑）

### 优先级系统
- 框架/柱子: priority 95-100
- 窗户/门: priority 70-100
- 屋顶: priority 60
- 墙体: priority 50
- 装饰: priority 20
- 地基: priority 10

## 常见问题
**空荡内部**: 添加家具、灯笼、地毯

**无窗框**: 用活板门做百叶窗
```javascript
builder.set(x-1, y, z, 'trapdoor?facing=east,open=true');
builder.set(x+1, y, z, 'trapdoor?facing=west,open=true');
```
