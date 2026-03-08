const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// pkg 打包时的路径处理
const BASE_PATH = process.pkg ? path.dirname(process.execPath) : __dirname;

/**
 * Safely read a file with automatic encoding detection.
 */
function readFileWithEncoding(filePath) {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        return buffer.slice(2).toString('utf16le');
    }
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return buffer.slice(3).toString('utf-8');
    }
    return buffer.toString('utf-8');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// 静态文件服务
const DIST_DIR = path.join(BASE_PATH, 'dist');
if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
}

// Ensure directories exist
const STRUCTURES_DIR = path.join(BASE_PATH, 'src', 'structures');
if (!fs.existsSync(STRUCTURES_DIR)) {
    fs.mkdirSync(STRUCTURES_DIR, { recursive: true });
}

// Skills directories
const SKILLS_BASE_DIR = path.join(BASE_PATH, 'src', 'skills');
const OFFICIAL_SKILLS_DIR = path.join(SKILLS_BASE_DIR, 'official');
const USER_SKILLS_DIR = path.join(SKILLS_BASE_DIR, 'user');

if (!fs.existsSync(USER_SKILLS_DIR)) {
    fs.mkdirSync(USER_SKILLS_DIR, { recursive: true });
}

// Recursive directory copy
function copyDirRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Sync official skills to user
function syncOfficialToUser() {
    if (!fs.existsSync(OFFICIAL_SKILLS_DIR)) return;
    const officialSkills = fs.readdirSync(OFFICIAL_SKILLS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory()).map(d => d.name);
    for (const skillName of officialSkills) {
        const userSkillDir = path.join(USER_SKILLS_DIR, skillName);
        const officialSkillDir = path.join(OFFICIAL_SKILLS_DIR, skillName);
        if (!fs.existsSync(userSkillDir)) {
            copyDirRecursive(officialSkillDir, userSkillDir);
            console.log(`📦 Synced official skill to user: ${skillName}`);
        }
    }
}
syncOfficialToUser();

// Helper functions
function isOfficialSkill(skillId) {
    return fs.existsSync(path.join(OFFICIAL_SKILLS_DIR, skillId));
}

function isOfficialFile(skillId, filePath) {
    return fs.existsSync(path.join(OFFICIAL_SKILLS_DIR, skillId, filePath));
}

function filesAreDifferent(file1, file2) {
    if (!fs.existsSync(file1) || !fs.existsSync(file2)) return true;
    const content1 = readFileWithEncoding(file1).replace(/\r\n/g, '\n').trim();
    const content2 = readFileWithEncoding(file2).replace(/\r\n/g, '\n').trim();
    return content1 !== content2;
}

function isSkillModified(skillId) {
    if (!isOfficialSkill(skillId)) return false;
    const officialDir = path.join(OFFICIAL_SKILLS_DIR, skillId);
    const userDir = path.join(USER_SKILLS_DIR, skillId);
    if (!fs.existsSync(userDir)) return false;
    const compareDir = (officialPath, userPath) => {
        if (!fs.existsSync(officialPath)) return false;
        const entries = fs.readdirSync(officialPath, { withFileTypes: true });
        for (const entry of entries) {
            const officialFile = path.join(officialPath, entry.name);
            const userFile = path.join(userPath, entry.name);
            if (entry.isDirectory()) {
                if (compareDir(officialFile, userFile)) return true;
            } else {
                if (filesAreDifferent(officialFile, userFile)) return true;
            }
        }
        return false;
    };
    return compareDir(officialDir, userDir);
}

function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return {};
    const frontmatter = match[1];
    const result = {};
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
    if (nameMatch) result.name = nameMatch[1].trim();
    if (descMatch) result.description = descMatch[1].trim();
    return result;
}


// ============ SKILLS API ============
app.get('/api/skills', (req, res) => {
    try {
        const skillDirs = fs.readdirSync(USER_SKILLS_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory()).map(d => d.name);
        const skills = [];
        for (const dir of skillDirs) {
            const skillMdPath = path.join(USER_SKILLS_DIR, dir, 'SKILL.md');
            if (fs.existsSync(skillMdPath)) {
                const content = readFileWithEncoding(skillMdPath);
                const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
                if (match) {
                    const frontmatter = match[1];
                    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
                    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
                    const isOfficial = isOfficialSkill(dir);
                    skills.push({
                        directory: dir,
                        name: nameMatch ? nameMatch[1].trim() : dir,
                        description: descMatch ? descMatch[1].trim() : '',
                        isOfficial: isOfficial,
                        isModified: isOfficial ? isSkillModified(dir) : false
                    });
                }
            }
        }
        res.json(skills);
    } catch (err) {
        console.error('Error listing skills:', err);
        res.status(500).json({ error: 'Failed to list skills' });
    }
});

app.post('/api/skill', (req, res) => {
    const { id, name, description, content, icon } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'Missing id or name' });
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const skillDir = path.join(USER_SKILLS_DIR, safeId);
    if (fs.existsSync(skillDir)) return res.status(409).json({ error: `Skill already exists: ${safeId}` });
    try {
        fs.mkdirSync(skillDir, { recursive: true });
        fs.mkdirSync(path.join(skillDir, 'resources'), { recursive: true });
        fs.mkdirSync(path.join(skillDir, 'scripts'), { recursive: true });
        const skillMdContent = `---\nname: ${name}\ndescription: ${description || '自定义技能'}\nicon: ${icon || '📝'}\n---\n\n# ${name}\n\n${content || ''}\n`;
        fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMdContent, 'utf8');
        console.log(`✅ Custom skill created: ${safeId}`);
        res.json({ success: true, id: safeId });
    } catch (err) {
        console.error('Error creating skill:', err);
        res.status(500).json({ error: `Failed to create skill: ${err.message}` });
    }
});

app.delete('/api/skill/:skillId', (req, res) => {
    const { skillId } = req.params;
    const skillDir = path.join(USER_SKILLS_DIR, skillId);
    if (!fs.existsSync(skillDir)) return res.status(404).json({ error: `Skill not found: ${skillId}` });
    if (isOfficialSkill(skillId)) return res.status(403).json({ error: '不能删除官方技能' });
    try {
        fs.rmSync(skillDir, { recursive: true, force: true });
        console.log(`🗑️ Custom skill deleted: ${skillId}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting skill:', err);
        res.status(500).json({ error: `Failed to delete skill: ${err.message}` });
    }
});

app.get('/api/skill/:skillName', (req, res) => {
    const { skillName } = req.params;
    const skillMdPath = path.join(USER_SKILLS_DIR, skillName, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) return res.status(404).json({ error: `Skill not found: ${skillName}` });
    try {
        const content = readFileWithEncoding(skillMdPath);
        res.json({ success: true, content });
    } catch (err) {
        res.status(500).json({ error: `Failed to read skill: ${err.message}` });
    }
});

app.get('/api/skill-doc/:skillName', (req, res) => {
    const { skillName } = req.params;
    const docPath = req.query.doc;
    if (!docPath) {
        const skillMdPath = path.join(USER_SKILLS_DIR, skillName, 'SKILL.md');
        if (!fs.existsSync(skillMdPath)) return res.status(404).json({ error: `Skill not found: ${skillName}` });
        const content = readFileWithEncoding(skillMdPath);
        return res.json({ success: true, content });
    }
    const safePath = docPath.replace(/\.\./g, '');
    let filePath = path.join(USER_SKILLS_DIR, skillName, `${safePath}.md`);
    if (!fs.existsSync(filePath)) filePath = path.join(USER_SKILLS_DIR, skillName, `${safePath}.js`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: `Document not found: ${skillName}/${safePath}` });
    try {
        const content = readFileWithEncoding(filePath);
        res.json({ success: true, content });
    } catch (err) {
        res.status(500).json({ error: `Failed to read document: ${err.message}` });
    }
});

app.get('/api/skill-files/:skillName', (req, res) => {
    const { skillName } = req.params;
    const skillDir = path.join(USER_SKILLS_DIR, skillName);
    if (!fs.existsSync(skillDir)) return res.status(404).json({ error: `Skill not found: ${skillName}` });
    try {
        const listFiles = (dir, prefix = '') => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            let files = [];
            for (const entry of entries) {
                const fullPath = path.join(prefix, entry.name);
                if (entry.isDirectory()) {
                    files = files.concat(listFiles(path.join(dir, entry.name), fullPath));
                } else if (entry.name.endsWith('.md') || entry.name.endsWith('.js')) {
                    const filePath = path.join(dir, entry.name);
                    const isOfficial = isOfficialFile(skillName, fullPath);
                    let isModified = false;
                    if (isOfficial) {
                        const officialPath = path.join(OFFICIAL_SKILLS_DIR, skillName, fullPath);
                        const userPath = path.join(USER_SKILLS_DIR, skillName, fullPath);
                        isModified = filesAreDifferent(officialPath, userPath);
                    }
                    try {
                        const content = readFileWithEncoding(filePath);
                        const meta = parseFrontmatter(content);
                        files.push({ path: fullPath, name: meta.name || entry.name.replace(/\.(md|js)$/, ''), description: meta.description || '', isOfficial, isModified });
                    } catch (e) {
                        files.push({ path: fullPath, name: entry.name.replace(/\.(md|js)$/, ''), description: '', isOfficial, isModified });
                    }
                }
            }
            return files;
        };
        const files = listFiles(skillDir);
        res.json({ success: true, files });
    } catch (err) {
        res.status(500).json({ error: `Failed to list files: ${err.message}` });
    }
});

app.post('/api/skill-file/:skillName', (req, res) => {
    const { skillName } = req.params;
    const { filePath, content } = req.body;
    if (!filePath || content === undefined) return res.status(400).json({ error: 'Missing filePath or content' });
    const safePath = filePath.replace(/\.\./g, '').replace(/^\//, '');
    const fullPath = path.join(USER_SKILLS_DIR, skillName, safePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    try {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Skill file saved: ${skillName}/${safePath}`);
        res.json({ success: true, path: `${skillName}/${safePath}` });
    } catch (err) {
        console.error('Error saving skill file:', err);
        res.status(500).json({ error: `Failed to save file: ${err.message}` });
    }
});

app.delete('/api/skill-file/:skillName', (req, res) => {
    const { skillName } = req.params;
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'Missing filePath' });
    const safePath = filePath.replace(/\.\./g, '').replace(/^\//, '');
    if (isOfficialFile(skillName, safePath)) return res.status(403).json({ error: '不能删除官方文件' });
    const fullPath = path.join(USER_SKILLS_DIR, skillName, safePath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: `File not found: ${skillName}/${safePath}` });
    try {
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Skill file deleted: ${skillName}/${safePath}`);
        res.json({ success: true, path: `${skillName}/${safePath}` });
    } catch (err) {
        console.error('Error deleting skill file:', err);
        res.status(500).json({ error: `Failed to delete file: ${err.message}` });
    }
});

app.post('/api/skill-restore/:skillName', (req, res) => {
    const { skillName } = req.params;
    const { filePath } = req.body;
    if (!isOfficialSkill(skillName)) return res.status(400).json({ error: '只有官方技能可以恢复默认' });
    try {
        if (filePath) {
            const safePath = filePath.replace(/\.\./g, '').replace(/^\//, '');
            const officialPath = path.join(OFFICIAL_SKILLS_DIR, skillName, safePath);
            const userPath = path.join(USER_SKILLS_DIR, skillName, safePath);
            if (!fs.existsSync(officialPath)) return res.status(404).json({ error: `Official file not found: ${safePath}` });
            const dir = path.dirname(userPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.copyFileSync(officialPath, userPath);
            console.log(`🔄 Restored file to default: ${skillName}/${safePath}`);
        } else {
            const officialDir = path.join(OFFICIAL_SKILLS_DIR, skillName);
            const userDir = path.join(USER_SKILLS_DIR, skillName);
            if (fs.existsSync(userDir)) fs.rmSync(userDir, { recursive: true, force: true });
            copyDirRecursive(officialDir, userDir);
            console.log(`🔄 Restored skill to default: ${skillName}`);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Error restoring default:', err);
        res.status(500).json({ error: `Failed to restore: ${err.message}` });
    }
});

app.get('/api/skill-official/:skillName', (req, res) => {
    const { skillName } = req.params;
    const filePath = req.query.file;
    if (!isOfficialSkill(skillName)) return res.status(404).json({ error: `Not an official skill: ${skillName}` });
    try {
        let targetPath = filePath 
            ? path.join(OFFICIAL_SKILLS_DIR, skillName, filePath.replace(/\.\./g, '').replace(/^\//, ''))
            : path.join(OFFICIAL_SKILLS_DIR, skillName, 'SKILL.md');
        if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'Official file not found' });
        const content = readFileWithEncoding(targetPath);
        res.json({ success: true, content });
    } catch (err) {
        res.status(500).json({ error: `Failed to read official file: ${err.message}` });
    }
});


// ============ SCRIPT API ============
const SCRIPT_SKILL_MAP = { 'analyzeStructure': 'quality-skill', 'analyzeScene': 'inspection-skill' };

app.get('/api/script/:scriptId', (req, res) => {
    const { scriptId } = req.params;
    const skillName = SCRIPT_SKILL_MAP[scriptId];
    if (!skillName) return res.status(404).json({ error: `Unknown script: ${scriptId}` });
    const scriptPath = path.join(USER_SKILLS_DIR, skillName, 'scripts', `${scriptId}.js`);
    if (!fs.existsSync(scriptPath)) return res.status(404).json({ error: `Script not found: ${scriptId}` });
    try {
        const content = readFileWithEncoding(scriptPath);
        res.json({ success: true, content, skillName, scriptId });
    } catch (err) {
        res.status(500).json({ error: `Failed to read script: ${err.message}` });
    }
});

// ============ STRUCTURE API ============
app.post('/api/save-structure', (req, res) => {
    const { name, voxels } = req.body;
    if (!name || !voxels) return res.status(400).json({ error: 'Missing name or voxels data' });
    const safeName = name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${safeName}_${timestamp}.json`;
    const filePath = path.join(STRUCTURES_DIR, filename);
    const fileContent = JSON.stringify({ name, created: new Date().toISOString(), voxels }, null, 2);
    fs.writeFile(filePath, fileContent, (err) => {
        if (err) {
            console.error('Error saving file:', err);
            return res.status(500).json({ error: 'Failed to save file' });
        }
        console.log(`✅ Structure saved: ${filename}`);
        res.json({ success: true, filename, path: filePath });
    });
});

app.get('/api/structures', (req, res) => {
    fs.readdir(STRUCTURES_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to list structures' });
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        res.json(jsonFiles);
    });
});

// ============ SCRIPT AUTO-SAVE ============
const SCRIPTS_DIR = path.join(BASE_PATH, 'output', 'scripts');
if (!fs.existsSync(SCRIPTS_DIR)) fs.mkdirSync(SCRIPTS_DIR, { recursive: true });

app.post('/api/save-script', (req, res) => {
    const { prompt, code, sessionId } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing code content' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const shortPrompt = (prompt || 'script').slice(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${shortPrompt}_${timestamp}.js`;
    const filePath = path.join(SCRIPTS_DIR, filename);
    const fileContent = `/**\n * AI Architect - Generated Script\n * Prompt: ${prompt || 'N/A'}\n * Session: ${sessionId || 'N/A'}\n * Generated: ${new Date().toISOString()}\n */\n\n${code}\n`;
    fs.writeFile(filePath, fileContent, 'utf8', (err) => {
        if (err) {
            console.error('Error saving script:', err);
            return res.status(500).json({ error: 'Failed to save script' });
        }
        console.log(`📜 Script saved: ${filename}`);
        res.json({ success: true, filename, path: filePath });
    });
});

// ============ SESSION STORAGE (Split Storage) ============
const SESSIONS_DIR = path.join(BASE_PATH, 'output', 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

function getSessionDir(sessionId) { return path.join(SESSIONS_DIR, sessionId); }
function ensureSessionDir(sessionId) {
    const dir = getSessionDir(sessionId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

app.post('/api/save-session', (req, res) => {
    const { id, title, messages, blocks, semanticVoxels, chatSnapshots, snapshotIndex, apiConversationHistory, devLogs, timestamp } = req.body;
    if (!id) return res.status(400).json({ error: 'Session ID required' });
    try {
        const sessionDir = ensureSessionDir(id);
        const metaData = {
            id, title: title || 'Untitled Session', timestamp: timestamp || Date.now(),
            messageCount: messages?.length || 0, blockCount: blocks?.length || 0,
            hasBlocks: blocks && blocks.length > 0, hasSnapshots: chatSnapshots && chatSnapshots.length > 0
        };
        fs.writeFileSync(path.join(sessionDir, 'meta.json'), JSON.stringify(metaData, null, 2));
        if (messages) fs.writeFileSync(path.join(sessionDir, 'messages.json'), JSON.stringify(messages));
        if (blocks) fs.writeFileSync(path.join(sessionDir, 'blocks.json'), JSON.stringify(blocks));
        if (semanticVoxels) fs.writeFileSync(path.join(sessionDir, 'voxels.json'), JSON.stringify(semanticVoxels));
        if (chatSnapshots) fs.writeFileSync(path.join(sessionDir, 'snapshots.json'), JSON.stringify(chatSnapshots));
        fs.writeFileSync(path.join(sessionDir, 'state.json'), JSON.stringify({
            snapshotIndex: snapshotIndex ?? -1, apiConversationHistory: apiConversationHistory || [], devLogs: devLogs || []
        }));
        res.json({ success: true, id });
    } catch (err) {
        console.error('Error saving session:', err);
        res.status(500).json({ error: 'Failed to save session' });
    }
});

app.get('/api/sessions', (req, res) => {
    fs.readdir(SESSIONS_DIR, { withFileTypes: true }, (err, entries) => {
        if (err) return res.status(500).json({ error: 'Failed to list sessions' });
        const sessions = [];
        entries.forEach(entry => {
            if (entry.isDirectory()) {
                const metaPath = path.join(SESSIONS_DIR, entry.name, 'meta.json');
                if (fs.existsSync(metaPath)) {
                    try {
                        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                        sessions.push({ id: meta.id, title: meta.title, timestamp: meta.timestamp, messageCount: meta.messageCount || 0, blockCount: meta.blockCount || 0 });
                    } catch (e) { }
                }
            } else if (entry.isFile() && entry.name.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(path.join(SESSIONS_DIR, entry.name), 'utf-8');
                    const data = JSON.parse(content);
                    sessions.push({ id: data.id, title: data.title, timestamp: data.timestamp, messageCount: data.messages?.length || 0, blockCount: data.blocks?.length || 0 });
                } catch (e) { }
            }
        });
        sessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        res.json(sessions);
    });
});

app.get('/api/session/:id', (req, res) => {
    const { id } = req.params;
    const sessionDir = getSessionDir(id);
    if (fs.existsSync(path.join(sessionDir, 'meta.json'))) {
        try {
            const meta = JSON.parse(fs.readFileSync(path.join(sessionDir, 'meta.json'), 'utf8'));
            const messages = fs.existsSync(path.join(sessionDir, 'messages.json')) ? JSON.parse(fs.readFileSync(path.join(sessionDir, 'messages.json'), 'utf8')) : [];
            const blocks = fs.existsSync(path.join(sessionDir, 'blocks.json')) ? JSON.parse(fs.readFileSync(path.join(sessionDir, 'blocks.json'), 'utf8')) : [];
            const semanticVoxels = fs.existsSync(path.join(sessionDir, 'voxels.json')) ? JSON.parse(fs.readFileSync(path.join(sessionDir, 'voxels.json'), 'utf8')) : [];
            const chatSnapshots = fs.existsSync(path.join(sessionDir, 'snapshots.json')) ? JSON.parse(fs.readFileSync(path.join(sessionDir, 'snapshots.json'), 'utf8')) : [];
            const state = fs.existsSync(path.join(sessionDir, 'state.json')) ? JSON.parse(fs.readFileSync(path.join(sessionDir, 'state.json'), 'utf8')) : {};
            res.json({ ...meta, messages, blocks, semanticVoxels, chatSnapshots, snapshotIndex: state.snapshotIndex ?? -1, apiConversationHistory: state.apiConversationHistory || [], devLogs: state.devLogs || [] });
        } catch (err) {
            console.error('Error reading session:', err);
            res.status(500).json({ error: 'Failed to read session' });
        }
    } else {
        const oldFilePath = path.join(SESSIONS_DIR, `${id}.json`);
        if (fs.existsSync(oldFilePath)) {
            try { res.json(JSON.parse(fs.readFileSync(oldFilePath, 'utf8'))); }
            catch (err) { res.status(500).json({ error: 'Failed to read session' }); }
        } else { res.status(404).json({ error: 'Session not found' }); }
    }
});

app.delete('/api/session/:id', (req, res) => {
    const { id } = req.params;
    const sessionDir = getSessionDir(id);
    const oldFilePath = path.join(SESSIONS_DIR, `${id}.json`);
    try {
        if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        console.log(`🗑️ Session deleted: ${id}`);
        res.json({ success: true, id });
    } catch (err) {
        console.error('Error deleting session:', err);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

// ============ 心跳检测 ============
let lastHeartbeat = Date.now();
const HEARTBEAT_TIMEOUT = 10000;

// ============ VERSION API ============
const VERSIONS_DIR = path.join(BASE_PATH, 'src', 'versions');

app.get('/api/versions', (req, res) => {
    try {
        if (!fs.existsSync(VERSIONS_DIR)) {
            return res.json({ versions: [], latest: null });
        }
        const versionDirs = fs.readdirSync(VERSIONS_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory()).map(d => d.name)
            .sort((a, b) => b.localeCompare(a));
        const versions = [];
        for (const ver of versionDirs) {
            const changelogPath = path.join(VERSIONS_DIR, ver, 'CHANGELOG.md');
            if (fs.existsSync(changelogPath)) {
                const content = readFileWithEncoding(changelogPath);
                const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
                let meta = { version: ver, date: ver, title: '' };
                if (match) {
                    const frontmatter = match[1];
                    const versionMatch = frontmatter.match(/^version:\s*(.+)$/m);
                    const dateMatch = frontmatter.match(/^date:\s*(.+)$/m);
                    const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
                    if (versionMatch) meta.version = versionMatch[1].trim();
                    if (dateMatch) meta.date = dateMatch[1].trim();
                    if (titleMatch) meta.title = titleMatch[1].trim();
                }
                const bodyContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
                versions.push({ ...meta, content: bodyContent });
            }
        }
        res.json({ versions, latest: versions.length > 0 ? versions[0] : null });
    } catch (err) {
        console.error('Error reading versions:', err);
        res.status(500).json({ error: 'Failed to read versions' });
    }
});

app.get('/api/heartbeat', (req, res) => {
    lastHeartbeat = Date.now();
    res.json({ status: 'ok' });
});

if (process.env.AUTO_EXIT === 'true') {
    setInterval(() => {
        if (Date.now() - lastHeartbeat > HEARTBEAT_TIMEOUT) {
            console.log('💤 No heartbeat detected, shutting down...');
            process.exit(0);
        }
    }, 5000);
}

// SPA fallback - 所有未匹配的路由返回 index.html
app.use((req, res, next) => {
    // 只处理 GET 请求，且不是 API 路由
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        const indexPath = path.join(DIST_DIR, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    next();
});

app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📁 Official skills: ${OFFICIAL_SKILLS_DIR}`);
    console.log(`📂 User skills: ${USER_SKILLS_DIR}`);
    
    // 自动打开浏览器
    if (process.env.AUTO_OPEN === 'true') {
        const url = `http://localhost:${PORT}`;
        console.log(`🌐 Opening browser: ${url}`);
        const { exec } = require('child_process');
        exec(`start ${url}`);
    }
});
