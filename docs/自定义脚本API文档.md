# 自定义脚本 API 文档

## 📖 概述

自定义脚本允许你扩展 MC AI Builder 的功能，添加自己的分析和处理逻辑。

## ⚠️ 重要提示

**当前版本的自定义脚本功能存在以下限制：**

1. **无法访问内置工具函数**（如 `executeVoxelScript`）
2. **只能使用纯 JavaScript 标准库**
3. **在浏览器环境中执行**（不是 Node.js）
4. **无法使用 require/import**

因此，自定义脚本主要适用于**简单的文本分析和数据处理**。

---

## 📋 API 参考

### 函数签名

```javascript
function customScript(context, args) {
    // 你的代码
    return { success: true, result: { /* 数据 */ } };
}
```

### 参数说明

#### 1. `context` 对象

| 属性 | 类型 | 说明 |
|------|------|------|
| `context.currentCode` | `string` | 当前画布上的建筑代码（完整的 JavaScript 代码） |
| `context.userPrompt` | `string` | 用户的输入提示词 |
| `context.imageUrl` | `string \| null` | 参考图片的 URL（如果有） |
| `context.config` | `object` | 完整的配置对象 |

**config 对象包含：**
```javascript
{
    customSkills: [],           // 自定义技能列表
    customScripts: [],          // 自定义脚本列表
    officialScriptOverrides: {},// 官方脚本覆盖
    agentTools: [],             // 启用的工具
    agentWorkflow: [],          // 工作流配置
    // ... 其他设置
}
```

#### 2. `args` 数组

AI 调用脚本时传递的参数数组。

```javascript
// AI 调用示例：
// run_script({ script: "myScript", args: ["param1", "param2"] })

// 脚本中访问：
const param1 = args[0];
const param2 = args[1];
```

### 返回值格式

**成功：**
```javascript
return {
    success: true,
    result: {
        // 你的数据
        message: "操作成功",
        data: { /* ... */ }
    }
};
```

**失败：**
```javascript
return {
    success: false,
    error: "错误描述"
};
```

---

## 💡 实用示例

### 示例 1：统计方块数量

```javascript
// 统计代码中使用了多少个 builder.set() 调用
const code = context.currentCode || '';
const setCount = (code.match(/builder\.set\(/g) || []).length;
const fillCount = (code.match(/builder\.fill\(/g) || []).length;

return {
    success: true,
    result: {
        setBlocks: setCount,
        fillBlocks: fillCount,
        total: setCount + fillCount,
        message: `找到 ${setCount} 个单方块，${fillCount} 个填充区域`
    }
};
```

### 示例 2：检查建筑特征

```javascript
const code = context.currentCode || '';

// 检查是否包含特定元素
const features = {
    hasDoor: code.includes('door'),
    hasWindows: code.includes('glass') || code.includes('pane'),
    hasRoof: code.includes('drawRoof') || code.includes('stairs'),
    hasInterior: code.includes('bed') || code.includes('chest') || code.includes('furnace'),
    hasLighting: code.includes('lantern') || code.includes('torch')
};

const missingFeatures = [];
if (!features.hasDoor) missingFeatures.push('门');
if (!features.hasWindows) missingFeatures.push('窗户');
if (!features.hasRoof) missingFeatures.push('屋顶');
if (!features.hasInterior) missingFeatures.push('内饰');
if (!features.hasLighting) missingFeatures.push('照明');

return {
    success: true,
    result: {
        features,
        missingFeatures,
        completeness: (Object.values(features).filter(Boolean).length / 5 * 100).toFixed(0) + '%',
        message: missingFeatures.length > 0 
            ? `建筑缺少：${missingFeatures.join('、')}` 
            : '建筑特征完整'
    }
};
```

### 示例 3：提取方块类型列表

```javascript
const code = context.currentCode || '';

// 使用正则提取所有方块类型
const blockTypes = new Set();
const patterns = [
    /builder\.set\([^,]+,[^,]+,[^,]+,\s*['"]([^'"]+)['"]/g,
    /builder\.fill\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*['"]([^'"]+)['"]/g,
    /builder\.line\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*['"]([^'"]+)['"]/g
];

patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(code)) !== null) {
        blockTypes.add(match[1]);
    }
});

return {
    success: true,
    result: {
        blockTypes: Array.from(blockTypes).sort(),
        count: blockTypes.size,
        message: `使用了 ${blockTypes.size} 种不同的方块`
    }
};
```

### 示例 4：代码行数统计

```javascript
const code = context.currentCode || '';
const lines = code.split('\n');

const stats = {
    totalLines: lines.length,
    codeLines: lines.filter(l => l.trim() && !l.trim().startsWith('//')).length,
    commentLines: lines.filter(l => l.trim().startsWith('//')).length,
    emptyLines: lines.filter(l => !l.trim()).length
};

return {
    success: true,
    result: {
        ...stats,
        message: `代码共 ${stats.totalLines} 行（有效代码 ${stats.codeLines} 行）`
    }
};
```

### 示例 5：检查用户意图

```javascript
const prompt = context.userPrompt || '';
const promptLower = prompt.toLowerCase();

// 分析用户想要什么
const intent = {
    wantsModification: /修改|改|调整|优化/.test(prompt),
    wantsAddition: /添加|加上|增加/.test(prompt),
    wantsDeletion: /删除|去掉|移除/.test(prompt),
    wantsNewBuild: /新建|创建|生成|建造/.test(prompt),
    mentionsSize: /大|小|高|宽|长/.test(prompt),
    mentionsStyle: /风格|样式|类型/.test(prompt)
};

return {
    success: true,
    result: {
        intent,
        hasExistingCode: (context.currentCode || '').length > 0,
        recommendation: intent.wantsModification && !context.currentCode
            ? '用户想修改，但画布是空的，应该先生成建筑'
            : '意图分析完成',
        message: `用户意图：${Object.keys(intent).filter(k => intent[k]).join('、') || '未明确'}`
    }
};
```

---

## 🚫 限制和注意事项

### 不能做的事情

❌ **不能执行建筑代码**
```javascript
// ❌ 错误：无法访问 executeVoxelScript
const voxels = executeVoxelScript(code); // ReferenceError
```

❌ **不能访问 DOM**
```javascript
// ❌ 错误：脚本在隔离环境中运行
document.getElementById('test'); // 可能失败
```

❌ **不能使用异步操作**
```javascript
// ❌ 错误：不支持 async/await
async function test() { ... } // 不会等待
```

❌ **不能使用 Node.js 模块**
```javascript
// ❌ 错误：浏览器环境
const fs = require('fs'); // ReferenceError
```

### 可以做的事情

✅ **字符串处理**
```javascript
const code = context.currentCode;
const lines = code.split('\n');
const matches = code.match(/pattern/g);
```

✅ **正则表达式**
```javascript
const pattern = /builder\.set\([^)]+\)/g;
const matches = [...code.matchAll(pattern)];
```

✅ **数据分析**
```javascript
const stats = {
    count: items.length,
    average: items.reduce((a, b) => a + b, 0) / items.length
};
```

✅ **条件判断**
```javascript
if (code.includes('door')) {
    return { success: true, result: { hasDoor: true } };
}
```

---

## 🔧 调试技巧

### 技巧 1：返回调试信息

```javascript
// 返回所有可用的信息
return {
    success: true,
    result: {
        debug: {
            contextKeys: Object.keys(context),
            argsLength: args.length,
            codeLength: context.currentCode?.length || 0,
            promptLength: context.userPrompt?.length || 0
        }
    }
};
```

### 技巧 2：捕获错误

```javascript
try {
    // 你的代码
    const result = doSomething();
    return { success: true, result };
} catch (e) {
    return {
        success: false,
        error: `脚本错误: ${e.message}`,
        stack: e.stack
    };
}
```

### 技巧 3：分步返回

```javascript
const steps = [];

steps.push('步骤 1：解析代码');
const code = context.currentCode || '';

steps.push('步骤 2：统计方块');
const blockCount = (code.match(/builder\.set/g) || []).length;

steps.push('步骤 3：完成');

return {
    success: true,
    result: {
        blockCount,
        steps,
        message: '分析完成'
    }
};
```

---

## 📚 最佳实践

### 1. 始终检查输入

```javascript
const code = context.currentCode || '';
if (!code) {
    return {
        success: false,
        error: '画布上没有代码'
    };
}
```

### 2. 提供有意义的返回值

```javascript
// ❌ 不好
return { success: true, result: 42 };

// ✅ 好
return {
    success: true,
    result: {
        blockCount: 42,
        message: '找到 42 个方块',
        details: { /* ... */ }
    }
};
```

### 3. 处理边界情况

```javascript
const code = context.currentCode || '';
const lines = code.split('\n');

// 处理空代码
if (lines.length === 0 || lines.every(l => !l.trim())) {
    return {
        success: true,
        result: {
            isEmpty: true,
            message: '代码为空'
        }
    };
}
```

### 4. 使用描述性的变量名

```javascript
// ❌ 不好
const x = code.match(/a/g).length;

// ✅ 好
const doorCount = (code.match(/door/g) || []).length;
```

---

## 🎯 总结

自定义脚本适合用于：
- ✅ 代码文本分析
- ✅ 统计和计数
- ✅ 特征检测
- ✅ 简单的数据处理

不适合用于：
- ❌ 复杂的建筑代码执行
- ❌ 需要访问外部资源
- ❌ 需要异步操作
- ❌ 需要 Node.js 特性

如果需要更复杂的功能，建议直接修改 `src/utils/agentLoopV2.js` 添加硬编码脚本。

---

**文档版本：** 1.0  
**最后更新：** 2026-01-13
