# MC AI Builder · AI 建筑师（即梦版）

> 用 AI 生成 Minecraft 建筑的桌面工具 —— 自然语言描述 / 参考图生成 3D 建筑，并导出为 Minecraft 可用的多种格式。本仓库为 [Justcnds/mc-ai-builder](https://github.com/Justcnds/mc-ai-builder) 的个人修改版，**额外支持即梦 AI 即时传输图片生成建筑**。

[![Stars](https://img.shields.io/github/stars/XuanRuiMu/MC_AI_Building_By_Bzhan_UP?style=flat&logo=github)](https://github.com/XuanRuiMu/MC_AI_Building_By_Bzhan_UP/stargazers)
[![Forks](https://img.shields.io/github/forks/XuanRuiMu/MC_AI_Building_By_Bzhan_UP?style=flat&logo=github)](https://github.com/XuanRuiMu/MC_AI_Building_By_Bzhan_UP/forks)
[![License: GPL-3.0](https://img.shields.io/github/license/XuanRuiMu/MC_AI_Building_By_Bzhan_UP)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/XuanRuiMu/MC_AI_Building_By_Bzhan_UP)](https://github.com/XuanRuiMu/MC_AI_Building_By_Bzhan_UP/commits/main)
[![Issues](https://img.shields.io/github/issues/XuanRuiMu/MC_AI_Building_By_Bzhan_UP)](https://github.com/XuanRuiMu/MC_AI_Building_By_Bzhan_UP/issues)
[![Repo Size](https://img.shields.io/github/repo-size/XuanRuiMu/MC_AI_Building_By_Bzhan_UP)](https://github.com/XuanRuiMu/MC_AI_Building_By_Bzhan_UP)

---

## 这是什么？

《Minecraft AI 创作工具》系列第一作（B站「MC AI 创作工具」）—— 一个给 MC 玩家和建筑师的 **AI 建筑生成器**：

- 用**自然语言**描述你想要的建筑（中文 / 英文均可），AI 直接生成建筑方案；
- 在浏览器里 **3D 实时预览**，边看边改；
- 一键导出成 Minecraft 可直接使用的**多种格式**；
- 本修改版额外支持 **即梦 AI 图生建筑**：上传参考图，即时生成对应风格的建筑。

---

## 核心功能

| 功能 | 说明 |
| --- | --- |
| 🏗️ 自然语言生成 | 用一句话描述建筑（如「中世纪石制城堡，带 4 座塔楼」），AI 出方案 |
| 🖼️ 即梦图生建筑（本版特色）| 上传参考图，即梦 AI 即时生成图片对应建筑 |
| 📐 实时 3D 预览 | Three.js WebGL 预览，生成后可继续修改 |
| 🎨 26 种建筑风格 | 内置建筑风格知识库，中英文均可触发 |
| 🔀 并发生成多方案 | 同时生成多个方案对比挑选 |
| ↩️ 撤销重做 | 交互过程可撤销 / 重做 |
| 🕘 历史会话 | 保留历史生成会话，随时回看 |
| 📦 多格式导出 | WorldEdit 原理图 / Litematica 投影 / Axiom 蓝图 / 数据包 / 单指令方块 |
| 🧱 跨版本兼容 | 1.8 – 1.21 版本方块名自动转换 |

---

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) + Tailwind CSS 4 |
| 3D 预览 | react-three-fiber + drei + Three.js（WebGL）|
| 状态 | zustand + lucide-react |
| 后端 | Express 5（`server.js`，端口 3001，CORS + 100MB body）|
| 即梦代理 | 火山引擎即梦视觉服务，HMAC-SHA256 签名（端口 3002）|
| 桌面打包 | Electron + electron-builder |

---

## 快速开始

```bash
# 克隆
git clone https://github.com/XuanRuiMu/MC_AI_Building_By_Bzhan_UP.git
cd MC_AI_Building_By_Bzhan_UP

# 安装依赖
npm install

# 启动开发模式（自动拉起 API 服务 3001 + Vite 5173）
npm run dev
```

> Windows 用户也可直接双击根目录的 `start.bat`（自动检查 Node、安装依赖、启动 API 与前端）。首次使用需配置 AI API Key。

### 即梦图生建筑（可选）

```bash
# 另开窗口启动即梦 AI 代理服务（端口 3002）
start-jimeng-proxy.bat
```

---

## Agent 技能系统（SKILL.md）

项目内置一套**声明式 Agent 技能系统**：

- 官方内置 6 项技能：`planning`（规划）/ `construction`（建造）/ `decoration`（装饰）/ `inspection`（质检）/ `quality`（质量）/ `knowledge`（知识库）；
- 支持**用户自定义技能**（`src/skills/user/`），可扩展 AI 的建筑能力；
- 服务端自动将官方技能同步到用户区并做版本比对，官方技能只读、用户技能可改。

---

## 目录结构

```text
MC_AI_Building_By_Bzhan_UP/
├── index.html              # 应用入口
├── vite.config.js          # Vite 配置（React + Tailwind）
├── server.js               # Express API 服务（端口 3001）
├── server-pkg.cjs          # pkg 打包版（与 server.js 同逻辑）
├── src/                    # React 前端源码
│   ├── App.jsx             # 主应用
│   ├── components/         # 组件
│   ├── assets/ stores/ utils/
│   ├── skills/             # Agent 技能（official 官方 + user 自定义 + registry）
│   ├── structures/         # 建筑结构数据
│   └── versions/           # 方块版本兼容处理
├── server/                 # 即梦 AI 代理（jimeng-proxy.js）
├── public/                 # 静态资源（头像 / minecraft 素材）
├── docs/                   # 视频宣发文案、自定义脚本 API 文档与使用指南
├── scripts/                # 数据脚本（官方方块数据抓取等）
├── output/                 # scripts / sessions 输出目录
├── release/                # 桌面打包产物（win-unpacked）
├── LICENSE                 # GPL-3.0
└── start.bat / start-jimeng-proxy.bat / pack-web.bat
```

---

## B站配套内容

本仓库配套 B站「Minecraft AI 创作工具」系列视频，`docs/` 下包含视频宣发文案与使用教程（[视频宣发文案.md](docs/)）。

---

## 许可证

[GPL-3.0](LICENSE) —— 基于 [Justcnds/mc-ai-builder](https://github.com/Justcnds/mc-ai-builder) 修改，遵循开源协议保留原始归属。

**让每个建筑，都能用 AI 秒出。**