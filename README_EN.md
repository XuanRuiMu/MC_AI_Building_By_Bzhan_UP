# MC AI Builder (Jimeng Edition)

> Generate Minecraft buildings with AI — describe or upload a reference image, preview in 3D in real time, and export to multiple formats ready for Minecraft. Personal fork of [Justcnds/mc-ai-builder](https://github.com/Justcnds/mc-ai-builder) with **Jimeng AI image-to-building** support.

[![Stars](https://img.shields.io/github/stars/XuanRuiMu/MC_AI_Building_By_Bzhan_UP?style=flat&logo=github)](https://github.com/XuanRuiMu/MC_AI_Building_By_Bzhan_UP/stargazers)
[![Forks](https://img.shields.io/github/forks/XuanRuiMu/MC_AI_Building_By_Bzhan_UP?style=flat&logo=github)](https://github.com/XuanRuiMu/MC_AI_Building_By_Bzhan_UP/forks)
[![License: GPL-3.0](https://img.shields.io/github/license/XuanRuiMu/MC_AI_Building_By_Bzhan_UP)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/XuanRuiMu/MC_AI_Building_By_Bzhan_UP)](https://github.com/XuanRuiMu/MC_AI_Building_By_Bzhan_UP/commits/main)
[![Issues](https://img.shields.io/github/issues/XuanRuiMu/MC_AI_Building_By_Bzhan_UP)](https://github.com/XuanRuiMu/MC_AI_Building_By_Bzhan_UP/issues)
[![Repo Size](https://img.shields.io/github/repo-size/XuanRuiMu/MC_AI_Building_By_Bzhan_UP)](https://github.com/XuanRuiMu/MC_AI_Building_By_Bzhan_UP)

> 🌐 [中文](README.md) ｜ English

---

## What is this?

The first title in the *Minecraft AI Creation Tools* series — an **AI building generator** for MC players and architects:

- Describe your dream building in **natural language** (Chinese or English), and the AI generates the plan;
- **Real-time 3D preview** in the browser — keep editing after generation;
- One-click **export to multiple formats ready for Minecraft**;
- This fork adds **Jimeng AI image-to-building**: upload a reference image and get a matching building instantly.

---

## Core features

| Feature | Description |
| --- | --- |
| 🏗️ Natural-language generation | Describe it in one sentence (e.g. "a medieval stone castle with 4 towers") and AI delivers a plan |
| 🖼️ Jimeng image-to-building (this fork) | Upload a reference image; Jimeng AI instantly builds a matching structure |
| 📐 Real-time 3D preview | Three.js WebGL preview; keep editing after generation |
| 🎨 26 building styles | Built-in style knowledge base, triggerable in Chinese or English |
| 🔀 Concurrent multi-plan | Generate several plans at once and compare |
| ↩️ Undo / redo | Full interaction history |
| 🕘 Session history | Revisit past generation sessions anytime |
| 📦 Multi-format export | WorldEdit schematics / Litematica projection / Axiom blueprint / data pack / single-command blocks |
| 🧱 Cross-version blocks | Automatic 1.8 – 1.21 block-name conversion |

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) + Tailwind CSS 4 |
| 3D preview | react-three-fiber + drei + Three.js (WebGL) |
| State | zustand + lucide-react |
| Backend | Express 5 (`server.js`, port 3001, CORS + 100MB body) |
| Jimeng proxy | Volcengine Jimeng vision service, HMAC-SHA256 signed (port 3002) |
| Desktop | Electron + electron-builder |

---

## Quick start

```bash
git clone https://github.com/XuanRuiMu/MC_AI_Building_By_Bzhan_UP.git
cd MC_AI_Building_By_Bzhan_UP

npm install

# Dev (auto-launches API on 3001 + Vite on 5173)
npm run dev
```

> Windows users can simply double-click `start.bat` (checks Node, installs deps, starts API + frontend). You'll need an AI API key on first use.

### Jimeng image-to-building (optional)

```bash
# Separate window: start the Jimeng AI proxy (port 3002)
start-jimeng-proxy.bat
```

---

## Agent skill system (SKILL.md)

The project ships a **declarative agent skill system**:

- 6 official skills: `planning` / `construction` / `decoration` / `inspection` / `quality` / `knowledge`;
- **User-defined skills** supported (`src/skills/user/`) to extend the AI's building abilities;
- The server auto-syncs official skills to the user area with version diffing; official skills are read-only, user skills editable.

---

## Directory structure

```text
MC_AI_Building_By_Bzhan_UP/
├── index.html            # App entry
├── vite.config.js        # Vite config (React + Tailwind)
├── server.js             # Express API (port 3001)
├── server-pkg.cjs        # pkg-packaged build (same logic as server.js)
├── src/                  # React frontend
│   ├── App.jsx           # Main app
│   ├── components/       # Components
│   ├── assets/ stores/ utils/
│   ├── skills/           # Agent skills (official + user + registry)
│   ├── structures/       # Building structure data
│   └── versions/         # Block-version compatibility
├── server/               # Jimeng AI proxy (jimeng-proxy.js)
├── public/               # Static assets
├── docs/                 # Video scripts, custom-script API docs & guide
├── scripts/              # Data scripts (official block data fetching, etc.)
├── output/               # scripts / sessions output
├── release/              # Desktop packaging (win-unpacked)
├── LICENSE               # GPL-3.0
└── start.bat / start-jimeng-proxy.bat / pack-web.bat
```

---

## License

[GPL-3.0](LICENSE) — a modified fork of [Justcnds/mc-ai-builder](https://github.com/Justcnds/mc-ai-builder), preserving the original attribution under the open-source license.

**Every building, generated by AI in seconds.**