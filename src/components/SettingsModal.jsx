import { useState, useEffect } from 'react';
import { X, Globe, Cpu, MousePointer2, Eye, Settings, Save, Trash2, Download, Link, Unlink, Rocket, Wrench, GripVertical, RotateCcw, FileText, Plus, ChevronDown, BookOpen, Code, Edit3, ChevronRight, Info, ExternalLink, Users, Calendar, Layers } from 'lucide-react';
import { SYSTEM_PROMPT } from '../utils/prompts.js';

// Default Agent V2 workflow steps - 简化版：修改 → 完成
const DEFAULT_WORKFLOW = [
    { id: 'modify_code', name: 'modify_code', description: '用搜索/替换修改代码' },
    { id: 'complete', name: 'complete', description: '完成构建' }
];

// Default enabled tools - 只启用核心工具
const DEFAULT_ENABLED_TOOLS = ['generate_code', 'modify_code', 'complete'];

// All available tools (基础工具) - 只有这些会出现在下拉菜单
const BASE_TOOLS = [
    { id: 'read_skill', name: 'read_skill', description: '读取技能文档', icon: '📖', needsParam: true, paramType: 'skill' },
    { id: 'read_subdoc', name: 'read_subdoc', description: '读取子文档', icon: '📑' },
    // { id: 'run_script', name: 'run_script', description: '执行脚本操作', icon: '⚙️', needsParam: true, paramType: 'script' }, // TODO: 暂时禁用脚本功能
    { id: 'generate_code', name: 'generate_code', description: '生成建筑代码', icon: '✨' },
    { id: 'validate_code', name: 'validate_code', description: '在沙盒中验证代码', icon: '🧪' },
    { id: 'modify_code', name: 'modify_code', description: '用搜索/替换修改代码', icon: '✏️' },
    { id: 'complete', name: 'complete', description: '完成构建', icon: '✅' }
];

// 官方技能列表 (不可删除)
const OFFICIAL_SKILLS = [
    { id: 'construction-skill', name: '建筑构造', description: '建筑代码生成指南', icon: '🏗️', official: true },
    { id: 'knowledge-skill', name: '风格知识库', description: '各种建筑风格参考', icon: '📚', official: true },
    { id: 'quality-skill', name: '质量检查', description: '结构质量分析', icon: '✅', official: true },
    { id: 'inspection-skill', name: '场景检查', description: '场景分析工具', icon: '🔍', official: true },
    { id: 'decoration-skill', name: '装饰技能', description: '装饰和细节指南', icon: '🎨', official: true },
    { id: 'planning-skill', name: '规划技能', description: '建筑规划指南', icon: '📐', official: true }
];

// 官方脚本列表 (不可删除) - TODO: 暂时禁用脚本功能
const OFFICIAL_SCRIPTS = [
    // { id: 'analyzeStructure', name: '结构分析', description: '分析建筑结构完整性', icon: '🔬', official: true },
    // { id: 'analyzeScene', name: '场景分析', description: '分析当前场景', icon: '🎬', official: true }
];

// 合并所有可用项目 (用于启用工具)
const ALL_TOOLS = [...BASE_TOOLS];

// Preset prompts
const PRESET_PROMPTS = {
    default: {
        name: '默认 (快速模式)',
        prompt: SYSTEM_PROMPT
    },
    minimal: {
        name: '精简版',
        prompt: `You are a Voxel Architect. Generate JavaScript code using the builder API to create 3D structures.

## Key API:
- builder.set(x, y, z, 'block')
- builder.fill(x1,y1,z1, x2,y2,z2, 'block')
- builder.drawRoofBounds(x1, y, z1, x2, z2, height, 'style', 'block')
- builder.beginGroup('name', { priority: N }) / builder.endGroup()

## Priority: 100=frame, 70=openings, 60=roof, 50=walls, 20=interior

Generate complete, working code. Use components for reusable parts.`
    }
};

export default function SettingsModal({ isOpen, onClose, onSave, initialSettings, language, setLanguage }) {
    const [settings, setSettings] = useState(() => {
        const defaults = {
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-3.5-turbo',
            maxTokens: 16384,
            mouseSensitivity: 1.0,
            fov: 75,
            generationMode: 'fast',
            agentVersion: 'v2',
            debugMode: false,
            agentTools: DEFAULT_ENABLED_TOOLS,
            agentWorkflow: DEFAULT_WORKFLOW.map(w => w.id),
            agentSystemPrompt: SYSTEM_PROMPT,
            customSkills: [],
            customScripts: [],
            officialSkillOverrides: {},
            officialScriptOverrides: {},
            customResources: [],
            concurrencyCount: 1  // 新增：默认并发数为 1
        };
        
        if (!initialSettings) return defaults;
        
        // 合并时确保关键字段有默认值
        return {
            ...defaults,
            ...initialSettings,
            agentWorkflow: (initialSettings.agentWorkflow && initialSettings.agentWorkflow.length > 0) 
                ? initialSettings.agentWorkflow 
                : DEFAULT_WORKFLOW.map(w => w.id),
            agentTools: initialSettings.agentTools || DEFAULT_ENABLED_TOOLS
        };
    });

    const [activeTab, setActiveTab] = useState('interface');
    const [savedProfiles, setSavedProfiles] = useState([]);
    const [profileName, setProfileName] = useState('');
    const [isAddStepOpen, setIsAddStepOpen] = useState(false);
    const [workflowError, setWorkflowError] = useState('');
    
    // 二级选择状态
    const [pendingTool, setPendingTool] = useState(null); // 等待选择参数的工具
    
    // 编辑技能/脚本状态
    const [editingSkill, setEditingSkill] = useState(null);
    const [editingScript, setEditingScript] = useState(null);
    const [originalSkillData, setOriginalSkillData] = useState(null); // 服务器原始数据（name, description, content）
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillDesc, setNewSkillDesc] = useState('');
    const [newSkillContent, setNewSkillContent] = useState('');
    const [newScriptName, setNewScriptName] = useState('');
    const [newScriptDesc, setNewScriptDesc] = useState('');
    const [newScriptContent, setNewScriptContent] = useState('');
    const [newResourceName, setNewResourceName] = useState('');
    const [newResourceDesc, setNewResourceDesc] = useState('');
    const [newResourceContent, setNewResourceContent] = useState('');
    const [showAddScript, setShowAddScript] = useState(false);
    const [showAddResource, setShowAddResource] = useState(false);
    
    // 技能详情视图状态
    const [selectedSkill, setSelectedSkill] = useState(null); // 当前选中的技能
    const [skillDetailTab, setSkillDetailTab] = useState('doc'); // 'doc' | 'scripts' | 'resources'
    const [skillResources, setSkillResources] = useState([]); // 技能的子文档列表
    const [skillScripts, setSkillScripts] = useState([]); // 技能的脚本列表
    const [loadingSkillDetail, setLoadingSkillDetail] = useState(false);
    const [userFiles, setUserFiles] = useState([]); // 用户创建的文件列表（可删除）
    
    // 从服务器加载的技能列表
    const [serverSkills, setServerSkills] = useState([]);

    // 确认弹窗状态
    const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }

    // 版本信息状态
    const [versionInfo, setVersionInfo] = useState({ versions: [], latest: null });
    const [expandedVersions, setExpandedVersions] = useState({}); // 展开的版本
    const [isLoadingVersions, setIsLoadingVersions] = useState(false); // 加载版本信息状态

    // 脚本到技能的映射
    const SCRIPT_SKILL_MAP = {
        'analyzeStructure': 'quality-skill',
        'analyzeScene': 'inspection-skill'
    };
    
    // 从服务器加载技能列表
    const loadOfficialSkills = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/skills');
            if (res.ok) {
                const skills = await res.json();
                // 转换格式，添加 icon
                const iconMap = {
                    'construction-skill': '🏗️',
                    'knowledge-skill': '📚',
                    'quality-skill': '✅',
                    'inspection-skill': '🔍',
                    'decoration-skill': '🎨',
                    'planning-skill': '📐'
                };
                const formattedSkills = skills.map(s => ({
                    id: s.directory,
                    name: s.name,
                    description: s.description,
                    icon: iconMap[s.directory] || '📝',
                    isOfficial: s.isOfficial,
                    isModified: s.isModified
                }));
                setServerSkills(formattedSkills);
            }
        } catch (e) {
            console.error('Failed to load skills:', e);
        }
    };
    
    // 组件挂载时加载技能列表
    useEffect(() => {
        loadOfficialSkills();
    }, []);

    // 加载版本信息
    const loadVersionInfo = async () => {
        setIsLoadingVersions(true);
        try {
            const res = await fetch('http://localhost:3001/api/versions');
            if (res.ok) {
                const data = await res.json();
                setVersionInfo(data);
                // 默认展开最新版本
                if (data.latest) {
                    setExpandedVersions({ [data.latest.version]: true });
                }
            }
        } catch (e) {
            console.error('Failed to load version info:', e);
        } finally {
            setIsLoadingVersions(false);
        }
    };

    // 切换到关于选项卡时加载版本信息
    useEffect(() => {
        if (activeTab === 'about') {
            loadVersionInfo();
        }
    }, [activeTab]);

    // 加载技能详情（脚本和子文档）
    const loadSkillDetail = async (skill) => {
        setSelectedSkill(skill);
        setSkillDetailTab('doc');
        setLoadingSkillDetail(true);
        setSkillResources([]);
        setSkillScripts([]);
        setUserFiles([]);
        
        let loadedScripts = [];
        let loadedResources = [];
        let officialFiles = []; // 官方文件列表（不可删除）
        let modifiedFiles = []; // 已修改的文件列表
        
        try {
            // 加载技能的文件列表（包含 isOfficial 和 isModified 字段）
            const res = await fetch(`http://localhost:3001/api/skill-files/${skill.id}`);
            if (res.ok) {
                const data = await res.json();
                const files = data.files || [];
                
                // 分类文件，同时记录官方文件和已修改文件
                for (const f of files) {
                    const normalizedPath = (f.path || f).replace(/\\/g, '/');
                    if (normalizedPath.startsWith('resources/')) {
                        loadedResources.push(normalizedPath);
                    } else if (normalizedPath.startsWith('scripts/')) {
                        loadedScripts.push(normalizedPath);
                    }
                    // 记录官方文件（用于判断是否可删除）
                    if (f.isOfficial) {
                        officialFiles.push(normalizedPath);
                    }
                    // 记录已修改的文件
                    if (f.isModified) {
                        modifiedFiles.push(normalizedPath);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load skill files:', e);
        }
        
        setSkillResources(loadedResources);
        setSkillScripts(loadedScripts);
        // userFiles 现在存储的是"非官方文件"（可删除的文件）
        // 通过排除官方文件来得到
        const allFiles = [...loadedResources, ...loadedScripts];
        setUserFiles(allFiles.filter(f => !officialFiles.includes(f)));
        // 保存已修改文件列表到 state（复用 state 或新增）
        // 这里我们用一个技巧：把 modifiedFiles 存到 selectedSkill 里
        setSelectedSkill(prev => ({ ...prev, modifiedFiles }));
        setLoadingSkillDetail(false);
    };

    // 打开官方技能编辑 - 从服务器加载内容
    const openOfficialSkillEdit = async (skill) => {
        // 先显示加载状态
        setEditingSkill({
            ...skill,
            official: skill.isOfficial,
            content: '',
            isLoading: true
        });
        setOriginalSkillData(null);
        
        // 从服务器加载当前内容和元数据
        let serverContent = '';
        let serverBodyContent = ''; // 去掉 frontmatter 的正文内容
        let serverName = skill.name;
        let serverDesc = skill.description;
        
        // 官方原始内容（用于恢复默认）
        let officialBodyContent = '';
        let officialName = skill.name;
        let officialDesc = skill.description;
        
        try {
            // 获取用户目录的技能内容
            const contentRes = await fetch(`http://localhost:3001/api/skill/${skill.id}`);
            if (contentRes.ok) {
                const data = await contentRes.json();
                serverContent = data.content || '';
                
                // 从 SKILL.md 的 frontmatter 解析 name 和 description，并提取正文
                const frontmatterMatch = serverContent.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]*([\s\S]*)$/);
                if (frontmatterMatch) {
                    const frontmatter = frontmatterMatch[1];
                    serverBodyContent = frontmatterMatch[2].trim();
                    const nameMatch = frontmatter.match(/name:\s*(.+)/);
                    const descMatch = frontmatter.match(/description:\s*(.+)/);
                    if (nameMatch) serverName = nameMatch[1].trim();
                    if (descMatch) serverDesc = descMatch[1].trim();
                } else {
                    serverBodyContent = serverContent;
                }
            }
            
            // 如果是官方技能，获取官方原始内容用于恢复默认
            if (skill.isOfficial) {
                const officialRes = await fetch(`http://localhost:3001/api/skill-official/${skill.id}`);
                if (officialRes.ok) {
                    const officialData = await officialRes.json();
                    const officialContent = officialData.content || '';
                    
                    const officialMatch = officialContent.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]*([\s\S]*)$/);
                    if (officialMatch) {
                        const frontmatter = officialMatch[1];
                        officialBodyContent = officialMatch[2].trim();
                        const nameMatch = frontmatter.match(/name:\s*(.+)/);
                        const descMatch = frontmatter.match(/description:\s*(.+)/);
                        if (nameMatch) officialName = nameMatch[1].trim();
                        if (descMatch) officialDesc = descMatch[1].trim();
                    } else {
                        officialBodyContent = officialContent;
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load skill content:', e);
        }
        
        // 保存官方原始数据用于恢复默认
        if (skill.isOfficial) {
            setOriginalSkillData({
                name: officialName,
                description: officialDesc,
                content: officialBodyContent
            });
        } else {
            setOriginalSkillData(null);
        }
        
        // 显示用户目录的当前内容
        setEditingSkill({
            ...skill,
            official: skill.isOfficial,
            name: serverName,
            description: serverDesc,
            content: serverBodyContent,
            isLoading: false
        });
    };

    // 打开官方脚本编辑 - 从服务器加载内容（和技能一样）
    const openOfficialScriptEdit = async (script) => {
        // 先显示加载状态
        setEditingScript({
            ...script,
            official: true,
            content: '',
            isLoading: true
        });
        setOriginalSkillData(null);
        
        // 从服务器加载原始内容
        let serverContent = '';
        
        try {
            const contentRes = await fetch(`http://localhost:3001/api/script/${script.id}`);
            if (contentRes.ok) {
                const data = await contentRes.json();
                serverContent = data.content || '';
            }
        } catch (e) {
            console.error('Failed to load script content:', e);
        }
        
        // 保存原始数据用于恢复默认
        setOriginalSkillData({
            name: script.name,
            description: script.description,
            content: serverContent
        });
        
        // 如果用户有覆盖内容则显示覆盖内容，否则显示服务器原始内容
        const overrideContent = settings.officialScriptOverrides?.[script.id];
        setEditingScript({
            ...script,
            official: true,
            content: overrideContent !== undefined ? overrideContent : serverContent,
            isLoading: false
        });
    };

    // 获取所有技能（从服务器加载）
    const getAllSkills = () => {
        return serverSkills;
    };

    // 获取所有脚本（官方 + 自定义）
    const getAllScripts = () => {
        const custom = (settings.customScripts || []).map(s => ({ ...s, official: false }));
        return [...OFFICIAL_SCRIPTS, ...custom];
    };

    // 解析工作流步骤显示
    const parseWorkflowStep = (stepId) => {
        // 检查是否是带参数的步骤 (如 read_skill:construction-skill)
        if (stepId.includes(':')) {
            const [toolId, param] = stepId.split(':');
            const tool = BASE_TOOLS.find(t => t.id === toolId);
            if (toolId === 'read_skill') {
                const skill = getAllSkills().find(s => s.id === param);
                return {
                    id: stepId,
                    name: `${tool?.name || toolId}`,
                    param: skill?.name || param,
                    description: skill?.description || '',
                    icon: skill?.icon || '📖',
                    fullDisplay: `📖 ${skill?.name || param}`
                };
            } else if (toolId === 'run_script') {
                const script = getAllScripts().find(s => s.id === param);
                return {
                    id: stepId,
                    name: `${tool?.name || toolId}`,
                    param: script?.name || param,
                    description: script?.description || '',
                    icon: script?.icon || '⚙️',
                    fullDisplay: `⚙️ ${script?.name || param}`
                };
            }
        }
        // 普通工具
        const tool = BASE_TOOLS.find(t => t.id === stepId);
        return {
            id: stepId,
            name: tool?.name || stepId,
            description: tool?.description || '',
            icon: tool?.icon || '❓',
            fullDisplay: `${tool?.icon || '❓'} ${tool?.name || stepId}`
        };
    };


    // 校验工作流顺序
    const validateWorkflow = (workflow) => {
        if (!workflow || workflow.length === 0) {
            return { valid: false, error: '工作流不能为空' };
        }

        // 过滤出工具步骤（提取基础工具ID）
        const toolSteps = workflow.map(step => step.includes(':') ? step.split(':')[0] : step);

        // 必须包含 complete
        if (!toolSteps.includes('complete')) {
            return { valid: false, error: '工作流必须包含 "complete"' };
        }

        const needsCode = ['validate_code', 'complete', 'modify_code'];
        const producesCode = ['generate_code', 'modify_code'];

        let hasCodeProducer = false;

        for (let i = 0; i < toolSteps.length; i++) {
            const step = toolSteps[i];
            if (producesCode.includes(step)) {
                hasCodeProducer = true;
            }
            if (needsCode.includes(step) && !hasCodeProducer) {
                return {
                    valid: false,
                    error: `"${step}" 前面必须有 "generate_code" 或 "modify_code"`
                };
            }
        }

        return { valid: true, error: '' };
    };

    // 处理保存
    const handleSave = () => {
        const validation = validateWorkflow(settings.agentWorkflow);
        if (!validation.valid) {
            setWorkflowError(validation.error);
            setActiveTab('agentConfig');
            return;
        }
        setWorkflowError('');
        onSave(settings);
    };

    // 添加工作流步骤
    const addWorkflowStep = (toolId, param = null) => {
        const workflow = [...(settings.agentWorkflow || DEFAULT_WORKFLOW.map(w => w.id))];
        const stepId = param ? `${toolId}:${param}` : toolId;
        workflow.push(stepId);
        setSettings(prev => ({ ...prev, agentWorkflow: workflow }));
        setIsAddStepOpen(false);
        setPendingTool(null);
        setWorkflowError('');
    };

    // 添加自定义技能 (保存到服务器文件系统)
    const addCustomSkill = async () => {
        if (!newSkillName.trim()) return;
        
        // 生成 skill id (转换为 kebab-case)
        const skillId = newSkillName.trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9_-]/g, '');
        
        try {
            const res = await fetch('http://localhost:3001/api/skill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: skillId,
                    name: newSkillName.trim(),
                    description: newSkillDesc.trim() || '自定义技能',
                    content: newSkillContent.trim(),
                    icon: '📝'
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                // 刷新技能列表
                await loadOfficialSkills();
                setNewSkillName('');
                setNewSkillDesc('');
                setNewSkillContent('');
            } else {
                const err = await res.json();
                alert(`创建失败: ${err.error}`);
            }
        } catch (e) {
            alert(`创建失败: ${e.message}`);
        }
    };

    // 删除自定义技能 (从服务器文件系统删除)
    const deleteCustomSkill = async (skillId) => {
        setConfirmDialog({
            message: '确定要删除这个技能吗？这将删除技能及其所有资源文件。',
            onConfirm: async () => {
                try {
                    const res = await fetch(`http://localhost:3001/api/skill/${skillId}`, {
                        method: 'DELETE'
                    });
                    
                    if (res.ok) {
                        // 刷新技能列表
                        await loadOfficialSkills();
                    } else {
                        const err = await res.json();
                        alert(`删除失败: ${err.error}`);
                    }
                } catch (e) {
                    alert(`删除失败: ${e.message}`);
                }
                setConfirmDialog(null);
            },
            onCancel: () => setConfirmDialog(null)
        });
    };

    // 添加自定义脚本
    const addCustomScript = () => {
        if (!newScriptName.trim()) return;
        const newScript = {
            id: `custom-${Date.now()}`,
            name: newScriptName.trim(),
            description: newScriptDesc.trim() || '自定义脚本',
            content: newScriptContent.trim(),
            icon: '📜'
        };
        setSettings(prev => ({
            ...prev,
            customScripts: [...(prev.customScripts || []), newScript]
        }));
        setNewScriptName('');
        setNewScriptDesc('');
        setNewScriptContent('');
    };

    // 添加技能内脚本 (保存到服务器文件系统)
    const addSkillScript = async () => {
        if (!newScriptName.trim() || !selectedSkill) return;
        const fileName = `${newScriptName.trim().replace(/\s+/g, '_')}.js`;
        const filePath = `scripts/${fileName}`;
        const content = newScriptContent.trim() || '// 脚本代码\n';
        
        try {
            const res = await fetch(`http://localhost:3001/api/skill-file/${selectedSkill.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath, content, isNew: true })
            });
            if (res.ok) {
                // 添加到本地列表显示
                setSkillScripts(prev => [...prev, filePath]);
                // 添加到用户文件列表（可删除）
                setUserFiles(prev => [...prev, filePath]);
                setNewScriptName('');
                setNewScriptDesc('');
                setNewScriptContent('');
                setShowAddScript(false);
            } else {
                const err = await res.json();
                alert(`保存失败: ${err.error}`);
            }
        } catch (e) {
            alert(`保存失败: ${e.message}`);
        }
    };

    // 添加技能内参考文档 (保存到服务器文件系统)
    const addSkillResource = async () => {
        if (!newResourceName.trim() || !selectedSkill) return;
        const fileName = `${newResourceName.trim().replace(/\s+/g, '_')}.md`;
        const filePath = `resources/${fileName}`;
        // 生成带 frontmatter 的内容
        const content = `---
name: ${newResourceName.trim()}
description: ${newResourceDesc.trim() || '自定义参考文档'}
---

${newResourceContent.trim() || '# 参考文档\n'}`;
        
        try {
            const res = await fetch(`http://localhost:3001/api/skill-file/${selectedSkill.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath, content, isNew: true })
            });
            if (res.ok) {
                // 添加到本地列表显示
                setSkillResources(prev => [...prev, filePath]);
                // 添加到用户文件列表（可删除）
                setUserFiles(prev => [...prev, filePath]);
                setNewResourceName('');
                setNewResourceDesc('');
                setNewResourceContent('');
                setShowAddResource(false);
            } else {
                const err = await res.json();
                alert(`保存失败: ${err.error}`);
            }
        } catch (e) {
            alert(`保存失败: ${e.message}`);
        }
    };

    // 删除脚本 (从服务器文件系统删除)
    const deleteSkillScript = (skillId, filePath) => {
        setConfirmDialog({
            message: '确定要删除这个脚本吗？',
            onConfirm: async () => {
                try {
                    const res = await fetch(`http://localhost:3001/api/skill-file/${skillId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filePath })
                    });
                    if (res.ok) {
                        setSkillScripts(prev => prev.filter(s => s !== filePath));
                    }
                } catch (e) {
                    console.error('删除失败:', e);
                }
                setConfirmDialog(null);
            }
        });
    };

    // 删除参考文档 (从服务器文件系统删除)
    const deleteSkillResource = (skillId, filePath) => {
        setConfirmDialog({
            message: '确定要删除这个参考文档吗？',
            onConfirm: async () => {
                try {
                    const res = await fetch(`http://localhost:3001/api/skill-file/${skillId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filePath })
                    });
                    if (res.ok) {
                        setSkillResources(prev => prev.filter(r => r !== filePath));
                    }
                } catch (e) {
                    console.error('删除失败:', e);
                }
                setConfirmDialog(null);
            }
        });
    };

    // 保存文件内容到服务器
    const saveSkillFile = async (skillId, filePath, content) => {
        try {
            const res = await fetch(`http://localhost:3001/api/skill-file/${skillId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath, content })
            });
            return res.ok;
        } catch (e) {
            console.error('Failed to save file:', e);
            return false;
        }
    };

    useEffect(() => {
        const loaded = localStorage.getItem('mc_ai_api_profiles');
        if (loaded) {
            try {
                setSavedProfiles(JSON.parse(loaded));
            } catch (e) {
                console.error('Failed to parse profiles', e);
            }
        }
    }, []);

    const handleSaveProfile = () => {
        if (!profileName.trim()) return;
        if (savedProfiles.length >= 5) return;

        const newProfile = {
            id: Date.now(),
            name: profileName.trim(),
            data: {
                apiKey: settings.apiKey,
                baseUrl: settings.baseUrl,
                model: settings.model,
                imageModel: settings.imageModel
            }
        };

        const nextProfiles = [...savedProfiles, newProfile];
        setSavedProfiles(nextProfiles);
        localStorage.setItem('mc_ai_api_profiles', JSON.stringify(nextProfiles));
        setProfileName('');
    };

    const handleLoadProfile = (profile) => {
        setConfirmDialog({
            message: language === 'zh' ? '确定要覆盖当前设置吗？' : 'Overwrite current settings?',
            onConfirm: () => {
                setSettings(prev => ({
                    ...prev,
                    apiKey: profile.data.apiKey,
                    baseUrl: profile.data.baseUrl,
                    model: profile.data.model,
                    imageModel: profile.data.imageModel
                }));
                setConfirmDialog(null);
            }
        });
    };

    const handleDeleteProfile = (id) => {
        const nextProfiles = savedProfiles.filter(p => p.id !== id);
        setSavedProfiles(nextProfiles);
        localStorage.setItem('mc_ai_api_profiles', JSON.stringify(nextProfiles));
    };

    useEffect(() => {
        if (isOpen && initialSettings) {
            setSettings(prev => ({
                ...prev,
                ...initialSettings,
                mouseSensitivity: initialSettings.mouseSensitivity ?? 1.0,
                fov: initialSettings.fov ?? 75,
                customSkills: initialSettings.customSkills || [],
                customScripts: initialSettings.customScripts || [],
                officialSkillOverrides: initialSettings.officialSkillOverrides || {},
                officialScriptOverrides: initialSettings.officialScriptOverrides || {},
                customResources: initialSettings.customResources || [],
                // 关键：确保工作流有值
                agentWorkflow: (initialSettings.agentWorkflow && initialSettings.agentWorkflow.length > 0) 
                    ? initialSettings.agentWorkflow 
                    : DEFAULT_WORKFLOW.map(w => w.id),
                agentTools: initialSettings.agentTools || DEFAULT_ENABLED_TOOLS
            }));
        }
    }, [isOpen, initialSettings]);

    if (!isOpen) return null;

    const t = (key) => {
        const translations = {
            en: {
                title: 'Global Settings',
                interface: 'Interface',
                camera: 'View & Camera',
                api: 'API Configuration',
                sensitivity: 'Mouse Sensitivity',
                fov: 'Field of View',
                cancel: 'Cancel',
                save: 'Save Changes',
                language: 'Language',
                interfaceDesc: 'Customize the look and feel of the application.',
                cameraDesc: 'Adjust how you view and navigate the 3D world.',
                apiDesc: 'Configure AI model connections and endpoints.',
                optional: 'Optional',
                modelName: 'Model Name',
                maxTokens: 'Max Tokens',
                maxTokensDesc: 'Maximum tokens per API response (1024-200000)',
                imageModel: 'Image Gen Model',
                apiKey: 'API Key',
                baseUrl: 'Base URL',
                profiles: 'Saved Profiles',
                saveProfile: 'Save',
                profileNamePlaceholder: 'Profile Name',
                noProfiles: 'No saved profiles',
                load: 'Load',
                delete: 'Delete',
                imageSameApi: 'Same as above',
                imageSeparateApi: 'Separate API',
                imageApiKey: 'Image API Key',
                imageBaseUrl: 'Image API URL',
                modeSelection: 'Default Mode',
                modeSelectionDesc: 'Default mode when opening the page.',
                modeSettings: 'Mode Settings',
                modeFast: 'Fast',
                modeFastDesc: 'Direct generation. Faster but less structured.',
                modeAgent: 'Custom',
                modeAgentDesc: 'Customizable AI workflow with configurable tools.',
                modeWorkflow: 'Custom',
                modeWorkflowDesc: 'Configurable AI workflow with preset steps.',
                modeAgentSkills: 'Autonomous',
                modeAgentSkillsDesc: 'AI autonomously decides which skills and scripts to use.',
                debugMode: 'Developer Mode',
                debugModeDesc: 'Show AI conversation logs in browser console (F12)',
                agentConfig: 'Custom Mode',
                agentConfigDesc: 'Configure tools, workflow and system prompt.',
                skillsManagement: 'Skills Management',
                skillsManagementDesc: 'Manage skills, scripts and reference documents.',
                customSkills: 'Custom Skills',
                customSkillsDesc: 'Manage skill documents for AI reference.',
                customScripts: 'Custom Scripts',
                customScriptsDesc: 'Manage analysis scripts.',
                enabledTools: 'Enabled Tools',
                workflow: 'Workflow Steps',
                systemPrompt: 'System Prompt',
                resetDefault: 'Reset Default',
                presets: 'Presets',
                dragToReorder: 'Drag to reorder',
                selectSkill: 'Select Skill',
                selectScript: 'Select Script',
                addSkill: 'Add Skill',
                addScript: 'Add Script',
                skillName: 'Skill Name',
                skillDesc: 'Description',
                skillContent: 'Content (Markdown)',
                scriptName: 'Script Name',
                scriptDesc: 'Description',
                scriptContent: 'Script Code',
                official: 'Official',
                custom: 'Custom',
                scripts: 'Scripts',
                resources: 'Resources',
                viewSkillDetail: 'View Details',
                belongsTo: 'Belongs to',
                about: 'About',
                aboutDesc: 'Version info, links and changelog.',
                author: 'Author',
                version: 'Version',
                links: 'Links',
                changelog: 'Changelog',
                qqGroup: 'QQ Group',
                bilibili: 'Bilibili',
                noChangelog: 'No changelog available'
            },
            zh: {
                title: '全局设置',
                interface: '界面设置',
                camera: '视角设置',
                api: 'API 设置',
                sensitivity: '鼠标灵敏度',
                fov: '视野范围',
                cancel: '取消',
                save: '保存更改',
                language: '界面语言',
                interfaceDesc: '自定义应用程序的外观和语言。',
                cameraDesc: '调整在 3D 世界中的查看和导航方式。',
                apiDesc: '配置 AI 模型连接和端点。',
                optional: '可选',
                modelName: '模型名称',
                maxTokens: '最大 Token 数',
                maxTokensDesc: '每次 API 响应的最大 Token 数量 (1024-200000)',
                imageModel: '生图模型',
                apiKey: 'API Key',
                baseUrl: 'API 地址',
                profiles: '预设配置',
                saveProfile: '保存',
                profileNamePlaceholder: '配置名称',
                noProfiles: '暂无保存的配置',
                load: '读取',
                delete: '删除',
                imageSameApi: '与上面相同',
                imageSeparateApi: '独立配置',
                imageApiKey: '生图 API Key',
                imageBaseUrl: '生图 API 地址',
                modeSelection: '默认模式',
                modeSelectionDesc: '打开页面时的默认模式。',
                modeSettings: '模式设置',
                modeFast: '快速',
                modeFastDesc: '直接生成，速度快但结构化较弱。',
                modeAgent: '自定义',
                modeAgentDesc: '可配置的 AI 工作流，支持自定义工具组合。',
                modeWorkflow: '自定义',
                modeWorkflowDesc: '可配置的 AI 工作流，按预设步骤执行。',
                modeAgentSkills: '自主',
                modeAgentSkillsDesc: 'AI 自主决策，根据任务自动选择技能和脚本。',
                debugMode: '开发者模式',
                debugModeDesc: '在浏览器控制台显示 AI 对话日志 (F12)',
                agentConfig: '自定义模式',
                agentConfigDesc: '配置工具、工作流程和系统提示词。',
                skillsManagement: '技能管理',
                skillsManagementDesc: '管理技能、脚本和参考文档。',
                customSkills: '自定义技能',
                customSkillsDesc: '管理 AI 可参考的技能文档。',
                customScripts: '自定义脚本',
                customScriptsDesc: '管理分析脚本。',
                enabledTools: '启用的工具',
                workflow: '工作流程',
                systemPrompt: '系统提示词',
                resetDefault: '恢复默认',
                presets: '预设',
                dragToReorder: '拖动排序',
                selectSkill: '选择技能',
                selectScript: '选择脚本',
                addSkill: '添加技能',
                addScript: '添加脚本',
                skillName: '技能名称',
                skillDesc: '描述',
                skillContent: '内容 (Markdown)',
                scriptName: '脚本名称',
                scriptDesc: '描述',
                scriptContent: '脚本代码',
                official: '官方',
                custom: '自定义',
                scripts: '脚本',
                resources: '参考文档',
                viewSkillDetail: '查看详情',
                belongsTo: '所属技能',
                about: '关于',
                aboutDesc: '版本信息、相关链接和更新日志。',
                author: '作者',
                version: '版本',
                links: '相关链接',
                changelog: '更新日志',
                qqGroup: 'QQ 群',
                bilibili: 'B站',
                noChangelog: '暂无更新日志'
            }
        };
        const activeLang = language || 'zh';
        return (translations[activeLang] && translations[activeLang][key]) || key;
    };

    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === id
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );


    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center font-sans p-4 animate-in fade-in duration-200">
            {/* 确认弹窗 */}
            {confirmDialog && (
                <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center">
                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-5 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-150">
                        <p className="text-sm text-neutral-200 mb-4">{confirmDialog.message}</p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setConfirmDialog(null)}
                                className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmDialog.onConfirm}
                                className="px-4 py-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden relative flex flex-col h-[85vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                    <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                        <Settings size={18} className="text-orange-500" />
                        {t('title')}
                    </h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-1/3 border-r border-white/5 bg-black/20 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                        <TabButton id="interface" icon={Globe} label={t('interface')} />
                        <TabButton id="mode" icon={Rocket} label={t('modeSettings')} />
                        <TabButton id="agentConfig" icon={Wrench} label={t('agentConfig')} />
                        <TabButton id="customSkills" icon={BookOpen} label={t('skillsManagement')} />
                        <TabButton id="api" icon={Cpu} label={t('api')} />
                        <TabButton id="about" icon={Info} label={t('about')} />

                        <div className="mt-8 px-4 text-[10px] text-neutral-600 leading-relaxed">
                            {activeTab === 'interface' && t('interfaceDesc')}
                            {activeTab === 'mode' && t('modeSelectionDesc')}
                            {activeTab === 'agentConfig' && t('agentConfigDesc')}
                            {activeTab === 'customSkills' && t('skillsManagementDesc')}
                            {activeTab === 'api' && t('apiDesc')}
                            {activeTab === 'about' && t('aboutDesc')}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-neutral-900/30">

                        {/* Interface Settings */}
                        {activeTab === 'interface' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                                <div>
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 block">
                                        {t('language')}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setLanguage('en')}
                                            className={`py-3 px-4 text-sm font-medium rounded-xl border transition-all flex items-center justify-center gap-2 ${language === 'en'
                                                ? 'bg-white/10 border-orange-500/50 text-white shadow-lg shadow-orange-500/10'
                                                : 'bg-black/20 border-white/5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
                                                }`}
                                        >
                                            <span className="text-lg">🇺🇸</span> English
                                        </button>
                                        <button
                                            onClick={() => setLanguage('zh')}
                                            className={`py-3 px-4 text-sm font-medium rounded-xl border transition-all flex items-center justify-center gap-2 ${language === 'zh'
                                                ? 'bg-white/10 border-orange-500/50 text-white shadow-lg shadow-orange-500/10'
                                                : 'bg-black/20 border-white/5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
                                                }`}
                                        >
                                            <span className="text-lg">🇨🇳</span> 中文
                                        </button>
                                    </div>
                                </div>

                                {/* Camera Settings */}
                                <div className="pt-6 border-t border-white/5 space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                                                <MousePointer2 size={16} className="text-cyan-400" />
                                                {t('sensitivity')}
                                            </label>
                                            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                                                {settings.mouseSensitivity?.toFixed(1) || '1.0'}x
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="2.0"
                                            step="0.1"
                                            value={settings.mouseSensitivity || 1.0}
                                            onChange={(e) => setSettings({ ...settings, mouseSensitivity: parseFloat(e.target.value) })}
                                            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                                                <Eye size={16} className="text-purple-400" />
                                                {t('fov')}
                                            </label>
                                            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                                                {settings.fov || 75}°
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="30"
                                            max="120"
                                            step="5"
                                            value={settings.fov || 75}
                                            onChange={(e) => setSettings({ ...settings, fov: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mode Selection */}
                        {activeTab === 'mode' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                                <div>
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 block">
                                        {t('modeSelection')}
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            onClick={() => setSettings(prev => ({ ...prev, generationMode: 'fast' }))}
                                            className={`py-4 px-3 text-sm font-medium rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${settings.generationMode === 'fast'
                                                ? 'bg-white/10 border-yellow-500/50 text-white shadow-lg shadow-yellow-500/10'
                                                : 'bg-black/20 border-white/5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
                                                }`}
                                        >
                                            <span className="text-2xl">⚡</span>
                                            <span>{t('modeFast')}</span>
                                        </button>
                                        <button
                                            onClick={() => setSettings(prev => ({ ...prev, generationMode: 'workflow' }))}
                                            className={`py-4 px-3 text-sm font-medium rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${settings.generationMode === 'workflow' || settings.generationMode === 'agent'
                                                ? 'bg-white/10 border-purple-500/50 text-white shadow-lg shadow-purple-500/10'
                                                : 'bg-black/20 border-white/5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
                                                }`}
                                        >
                                            <span className="text-2xl">🛠️</span>
                                            <span>{t('modeWorkflow')}</span>
                                        </button>
                                        <button
                                            onClick={() => setSettings(prev => ({ ...prev, generationMode: 'agentSkills' }))}
                                            className={`py-4 px-3 text-sm font-medium rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${settings.generationMode === 'agentSkills'
                                                ? 'bg-white/10 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10'
                                                : 'bg-black/20 border-white/5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
                                                }`}
                                        >
                                            <span className="text-2xl">🤖</span>
                                            <span>{t('modeAgentSkills')}</span>
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-neutral-500 mt-2 px-1">
                                        {settings.generationMode === 'fast' && t('modeFastDesc')}
                                        {(settings.generationMode === 'workflow' || settings.generationMode === 'agent') && t('modeWorkflowDesc')}
                                        {settings.generationMode === 'agentSkills' && t('modeAgentSkillsDesc')}
                                    </p>
                                </div>

                                {/* Developer Mode Toggle */}
                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">🛠️</span>
                                            <div>
                                                <div className="text-sm font-medium text-neutral-200">{t('debugMode')}</div>
                                                <div className="text-[10px] text-neutral-500">{t('debugModeDesc')}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSettings(prev => ({ ...prev, debugMode: !prev.debugMode }))}
                                            className={`relative w-12 h-6 rounded-full transition-all ${settings.debugMode ? 'bg-orange-500' : 'bg-neutral-700'}`}
                                        >
                                            <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all shadow-md ${settings.debugMode ? 'left-6' : 'left-0.5'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">⚡</span>
                                            <div>
                                                <div className="text-sm font-medium text-neutral-200">
                                                    {language === 'zh' ? '修改时自动快速模式' : 'Auto Fast Modify'}
                                                </div>
                                                <div className="text-[10px] text-neutral-500">
                                                    {language === 'zh' ? '第二次修改时自动切换到快速模式' : 'Auto switch to fast mode for modifications'}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSettings(prev => ({ ...prev, autoFastModify: prev.autoFastModify === false ? true : false }))}
                                            className={`relative w-12 h-6 rounded-full transition-all ${settings.autoFastModify !== false ? 'bg-yellow-500' : 'bg-neutral-700'}`}
                                        >
                                            <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all shadow-md ${settings.autoFastModify !== false ? 'left-6' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Agent Config */}
                        {activeTab === 'agentConfig' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                                {/* Enabled Tools */}
                                <div>
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 block">
                                        {t('enabledTools')}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ALL_TOOLS.map(tool => {
                                            const isEnabled = settings.agentTools?.includes(tool.id) ?? true;
                                            return (
                                                <button
                                                    key={tool.id}
                                                    onClick={() => {
                                                        const currentTools = settings.agentTools || ALL_TOOLS.map(t => t.id);
                                                        const newTools = isEnabled
                                                            ? currentTools.filter(t => t !== tool.id)
                                                            : [...currentTools, tool.id];
                                                        setSettings(prev => ({ ...prev, agentTools: newTools }));
                                                    }}
                                                    className={`p-2 text-xs rounded-lg border transition-all text-left ${isEnabled
                                                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                        : 'bg-black/20 border-white/5 text-neutral-500'
                                                        }`}
                                                >
                                                    <div className="font-mono font-medium flex items-center gap-1">
                                                        <span>{tool.icon}</span>
                                                        {tool.name}
                                                    </div>
                                                    <div className="text-[10px] opacity-70">{tool.description}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Workflow */}
                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                            {t('workflow')}
                                        </label>
                                        <span className="text-[10px] text-neutral-600">{t('dragToReorder')}</span>
                                    </div>
                                    
                                    {workflowError && (
                                        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-start gap-2">
                                            <span className="text-red-500 mt-0.5">⚠️</span>
                                            <span>{workflowError}</span>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2">
                                        {(settings.agentWorkflow || DEFAULT_WORKFLOW.map(w => w.id)).map((stepId, index) => {
                                            const step = parseWorkflowStep(stepId);
                                            return (
                                                <div
                                                    key={`${stepId}-${index}`}
                                                    draggable
                                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                                        const toIndex = index;
                                                        if (fromIndex !== toIndex) {
                                                            const workflow = [...(settings.agentWorkflow || DEFAULT_WORKFLOW.map(w => w.id))];
                                                            const [moved] = workflow.splice(fromIndex, 1);
                                                            workflow.splice(toIndex, 0, moved);
                                                            setSettings(prev => ({ ...prev, agentWorkflow: workflow }));
                                                            setWorkflowError('');
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 p-2 bg-black/30 border border-white/5 rounded-lg cursor-move hover:border-orange-500/30 transition-all group"
                                                >
                                                    <GripVertical size={14} className="text-neutral-600 group-hover:text-orange-400" />
                                                    <span className="text-orange-400 font-mono text-xs w-5">{index + 1}.</span>
                                                    <span className="text-sm">{step.icon}</span>
                                                    <span className="text-sm text-neutral-200 font-mono">{step.name}</span>
                                                    {step.param && (
                                                        <>
                                                            <ChevronRight size={12} className="text-neutral-600" />
                                                            <span className="text-sm text-blue-400">{step.param}</span>
                                                        </>
                                                    )}
                                                    <span className="text-[10px] text-neutral-500 ml-auto">{step.description}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const workflow = [...(settings.agentWorkflow || DEFAULT_WORKFLOW.map(w => w.id))];
                                                            workflow.splice(index, 1);
                                                            setSettings(prev => ({ ...prev, agentWorkflow: workflow }));
                                                            setWorkflowError('');
                                                        }}
                                                        className="p-1 hover:bg-red-500/20 hover:text-red-400 text-neutral-600 rounded transition-colors"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Add step dropdown - 只显示基础工具 */}
                                    <div className="mt-2 relative">
                                        <button
                                            onClick={() => { setIsAddStepOpen(!isAddStepOpen); setPendingTool(null); }}
                                            className="w-full flex items-center justify-between bg-black/40 border border-white/10 hover:border-orange-500/30 rounded-lg px-3 py-2 text-xs text-neutral-400 transition-colors"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Plus size={12} className="text-orange-400" />
                                                {pendingTool ? `选择${pendingTool.paramType === 'skill' ? '技能' : '脚本'}...` : '添加步骤...'}
                                            </span>
                                            <ChevronDown size={14} className={`transition-transform ${isAddStepOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isAddStepOpen && !pendingTool && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden animate-in slide-in-from-top-2 duration-150 max-h-60 overflow-y-auto custom-scrollbar">
                                                {BASE_TOOLS.map(tool => (
                                                    <button
                                                        key={tool.id}
                                                        onClick={() => {
                                                            if (tool.needsParam) {
                                                                setPendingTool(tool);
                                                            } else {
                                                                addWorkflowStep(tool.id);
                                                            }
                                                        }}
                                                        className="w-full px-3 py-2 text-left text-xs hover:bg-orange-500/10 transition-colors flex items-center gap-2 group"
                                                    >
                                                        <span>{tool.icon}</span>
                                                        <span className="font-mono text-neutral-200 group-hover:text-orange-400">{tool.name}</span>
                                                        {tool.needsParam && <ChevronRight size={12} className="text-neutral-600" />}
                                                        <span className="text-[10px] text-neutral-500 ml-auto">{tool.description}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* 二级选择：技能 */}
                                        {isAddStepOpen && pendingTool?.paramType === 'skill' && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden animate-in slide-in-from-top-2 duration-150 max-h-60 overflow-y-auto custom-scrollbar">
                                                <div className="px-3 py-1.5 text-[10px] text-neutral-500 bg-black/50 sticky top-0 flex items-center justify-between">
                                                    <span>📚 {t('selectSkill')}</span>
                                                    <button onClick={() => setPendingTool(null)} className="text-neutral-600 hover:text-white">
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                                {getAllSkills().map(skill => (
                                                    <button
                                                        key={skill.id}
                                                        onClick={() => addWorkflowStep('read_skill', skill.id)}
                                                        className="w-full px-3 py-2 text-left text-xs hover:bg-blue-500/10 transition-colors flex items-center gap-2 group"
                                                    >
                                                        <span>{skill.icon}</span>
                                                        <span className="text-neutral-200 group-hover:text-blue-400">{skill.name}</span>
                                                        {skill.official && <span className="text-[8px] px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded">{t('official')}</span>}
                                                        <span className="text-[10px] text-neutral-500 ml-auto">{skill.description}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* 二级选择：脚本 */}
                                        {isAddStepOpen && pendingTool?.paramType === 'script' && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden animate-in slide-in-from-top-2 duration-150 max-h-60 overflow-y-auto custom-scrollbar">
                                                <div className="px-3 py-1.5 text-[10px] text-neutral-500 bg-black/50 sticky top-0 flex items-center justify-between">
                                                    <span>⚙️ {t('selectScript')}</span>
                                                    <button onClick={() => setPendingTool(null)} className="text-neutral-600 hover:text-white">
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                                {getAllScripts().map(script => (
                                                    <button
                                                        key={script.id}
                                                        onClick={() => addWorkflowStep('run_script', script.id)}
                                                        className="w-full px-3 py-2 text-left text-xs hover:bg-green-500/10 transition-colors flex items-center gap-2 group"
                                                    >
                                                        <span>{script.icon}</span>
                                                        <span className="text-neutral-200 group-hover:text-green-400">{script.name}</span>
                                                        {script.official && <span className="text-[8px] px-1 py-0.5 bg-green-500/20 text-green-400 rounded">{t('official')}</span>}
                                                        <span className="text-[10px] text-neutral-500 ml-auto">{script.description}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setSettings(prev => ({ ...prev, agentWorkflow: DEFAULT_WORKFLOW.map(w => w.id) }))}
                                        className="mt-2 px-3 py-1.5 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        <RotateCcw size={10} />
                                        {t('resetDefault')}
                                    </button>
                                </div>

                                {/* System Prompt */}
                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={12} />
                                            {t('systemPrompt')}
                                        </label>
                                        <div className="flex gap-1">
                                            {Object.entries(PRESET_PROMPTS).map(([key, preset]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setSettings(prev => ({ ...prev, agentSystemPrompt: preset.prompt }))}
                                                    className="px-2 py-1 text-[10px] bg-neutral-800 hover:bg-orange-500/20 hover:text-orange-400 text-neutral-500 rounded transition-colors"
                                                >
                                                    {preset.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea
                                        value={settings.agentSystemPrompt !== undefined ? settings.agentSystemPrompt : SYSTEM_PROMPT}
                                        onChange={(e) => setSettings(prev => ({ ...prev, agentSystemPrompt: e.target.value }))}
                                        className="w-full h-48 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono outline-none focus:border-orange-500/50 resize-none custom-scrollbar"
                                        placeholder="System prompt..."
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] text-neutral-600">
                                            {(settings.agentSystemPrompt !== undefined ? settings.agentSystemPrompt : SYSTEM_PROMPT).length} 字符
                                        </span>
                                        <button
                                            onClick={() => setSettings(prev => ({ ...prev, agentSystemPrompt: SYSTEM_PROMPT }))}
                                            className="px-3 py-1.5 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg flex items-center gap-1 transition-colors"
                                        >
                                            <RotateCcw size={10} />
                                            {t('resetDefault')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Custom Skills */}
                        {activeTab === 'customSkills' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                                {/* 编辑技能弹窗 */}
                                {editingSkill && (
                                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                                        <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                                <span className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                                                    {editingSkill.isSubdoc ? '📄 编辑参考文档' : (editingSkill.official ? '📚 编辑官方技能' : '✏️ 编辑自定义技能')}
                                                    {editingSkill.isLoading && <span className="text-[10px] text-blue-400 animate-pulse">加载中...</span>}
                                                </span>
                                                <button onClick={() => { setEditingSkill(null); setOriginalSkillData(null); }} className="text-neutral-500 hover:text-white">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="p-4 space-y-3 overflow-y-auto flex-1">
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="text-[10px] text-neutral-500 mb-1 block">名称 {(editingSkill.isSubdoc ? !userFiles.includes(editingSkill.filePath) : editingSkill.official) && <span className="text-yellow-500">(不可修改)</span>}</label>
                                                        <input
                                                            type="text"
                                                            value={editingSkill.name}
                                                            onChange={(e) => {
                                                                const isOfficialFile = editingSkill.isSubdoc ? !userFiles.includes(editingSkill.filePath) : editingSkill.official;
                                                                if (!isOfficialFile) setEditingSkill({...editingSkill, name: e.target.value});
                                                            }}
                                                            disabled={editingSkill.isSubdoc ? !userFiles.includes(editingSkill.filePath) : editingSkill.official}
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-neutral-500 mb-1 block">描述 {(editingSkill.isSubdoc ? !userFiles.includes(editingSkill.filePath) : editingSkill.official) && <span className="text-yellow-500">(不可修改)</span>}</label>
                                                        <textarea
                                                            value={editingSkill.description}
                                                            onChange={(e) => {
                                                                const isOfficialFile = editingSkill.isSubdoc ? !userFiles.includes(editingSkill.filePath) : editingSkill.official;
                                                                if (!isOfficialFile) setEditingSkill({...editingSkill, description: e.target.value});
                                                            }}
                                                            disabled={editingSkill.isSubdoc ? !userFiles.includes(editingSkill.filePath) : editingSkill.official}
                                                            className="w-full h-16 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-neutral-500 mb-1 block">内容 (Markdown)</label>
                                                    <textarea
                                                        value={editingSkill.content || ''}
                                                        onChange={(e) => setEditingSkill({...editingSkill, content: e.target.value})}
                                                        placeholder={editingSkill.isLoading ? '正在加载...' : ''}
                                                        disabled={editingSkill.isLoading}
                                                        className="w-full h-64 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono outline-none focus:border-orange-500/50 resize-none custom-scrollbar disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="px-4 py-3 border-t border-white/5 flex justify-between">
                                                <div className="flex gap-2">
                                                    {/* 恢复默认按钮：官方文件（非用户创建）才显示 */}
                                                    {originalSkillData && (
                                                        // 子文档：不在用户文件列表中才显示（即官方文件）
                                                        // 主文档：官方技能才显示
                                                        (editingSkill.isSubdoc ? !userFiles.includes(editingSkill.filePath) : editingSkill.official)
                                                    ) && (
                                                        <button
                                                            onClick={() => setEditingSkill({
                                                                ...editingSkill, 
                                                                content: originalSkillData.content,
                                                                name: originalSkillData.name,
                                                                description: originalSkillData.description
                                                            })}
                                                            className="px-3 py-1.5 text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <RotateCcw size={12} />
                                                            恢复默认
                                                        </button>
                                                    )}
                                                    {editingSkill.isSubdoc && editingSkill.filePath && userFiles.includes(editingSkill.filePath) && (
                                                        <button
                                                            onClick={() => {
                                                                const skillId = editingSkill.id.split('/')[0];
                                                                deleteSkillResource(skillId, editingSkill.filePath);
                                                                setEditingSkill(null);
                                                            }}
                                                            className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <Trash2 size={12} />
                                                            删除
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setEditingSkill(null); setOriginalSkillData(null); }}
                                                        className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                                                    >
                                                        取消
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (editingSkill.isSubdoc && editingSkill.filePath) {
                                                                // 保存参考文档到服务器
                                                                const skillId = editingSkill.id.split('/')[0];
                                                                const content = `---
name: ${editingSkill.name}
description: ${editingSkill.description}
---

${editingSkill.content}`;
                                                                const success = await saveSkillFile(skillId, editingSkill.filePath, content);
                                                                if (!success) {
                                                                    alert('保存失败');
                                                                    return;
                                                                }
                                                                // 刷新技能列表以更新 isModified 状态
                                                                await loadOfficialSkills();
                                                                // 刷新技能详情以更新文件的 isModified 状态
                                                                if (selectedSkill) {
                                                                    await loadSkillDetail(selectedSkill);
                                                                }
                                                            } else if (editingSkill.official) {
                                                                // 保存官方技能 SKILL.md 到服务器
                                                                const content = `---
name: ${editingSkill.name}
description: ${editingSkill.description}
---

${editingSkill.content}`;
                                                                const success = await saveSkillFile(editingSkill.id, 'SKILL.md', content);
                                                                if (!success) {
                                                                    alert('保存失败');
                                                                    return;
                                                                }
                                                                // 刷新技能列表以更新 isModified 状态
                                                                await loadOfficialSkills();
                                                            } else {
                                                                // 自定义技能保存到 localStorage
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    customSkills: prev.customSkills.map(s => 
                                                                        s.id === editingSkill.id ? editingSkill : s
                                                                    )
                                                                }));
                                                            }
                                                            setEditingSkill(null);
                                                            setOriginalSkillData(null);
                                                        }}
                                                        disabled={editingSkill.isLoading}
                                                        className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 text-blue-400 rounded-lg transition-colors"
                                                    >
                                                        保存
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 编辑脚本弹窗 */}
                                {editingScript && (
                                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                                        <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                                <span className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                                                    ⚙️ 编辑脚本
                                                    {editingScript.isLoading && <span className="text-[10px] text-green-400 animate-pulse">加载中...</span>}
                                                </span>
                                                <button onClick={() => { setEditingScript(null); setOriginalSkillData(null); }} className="text-neutral-500 hover:text-white">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="p-4 space-y-3 overflow-y-auto flex-1">
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="text-[10px] text-neutral-500 mb-1 block">名称 {(!editingScript.filePath || !userFiles.includes(editingScript.filePath)) && <span className="text-yellow-500">(不可修改)</span>}</label>
                                                        <input
                                                            type="text"
                                                            value={editingScript.name}
                                                            onChange={(e) => {
                                                                if (editingScript.filePath && userFiles.includes(editingScript.filePath)) {
                                                                    setEditingScript({...editingScript, name: e.target.value});
                                                                }
                                                            }}
                                                            disabled={!editingScript.filePath || !userFiles.includes(editingScript.filePath)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-neutral-500 mb-1 block">描述 {(!editingScript.filePath || !userFiles.includes(editingScript.filePath)) && <span className="text-yellow-500">(不可修改)</span>}</label>
                                                        <input
                                                            type="text"
                                                            value={editingScript.description}
                                                            onChange={(e) => {
                                                                if (editingScript.filePath && userFiles.includes(editingScript.filePath)) {
                                                                    setEditingScript({...editingScript, description: e.target.value});
                                                                }
                                                            }}
                                                            disabled={!editingScript.filePath || !userFiles.includes(editingScript.filePath)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-neutral-500 mb-1 block">脚本代码 (JavaScript)</label>
                                                    <textarea
                                                        value={editingScript.content || ''}
                                                        onChange={(e) => setEditingScript({...editingScript, content: e.target.value})}
                                                        placeholder={editingScript.isLoading ? '正在加载...' : ''}
                                                        disabled={editingScript.isLoading}
                                                        className="w-full h-72 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-green-300 font-mono outline-none focus:border-green-500/50 resize-none custom-scrollbar disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="px-4 py-3 border-t border-white/5 flex justify-between">
                                                <div className="flex gap-2">
                                                    {/* 恢复默认按钮：官方脚本（非用户创建）才显示 */}
                                                    {originalSkillData && (
                                                        editingScript.filePath ? !userFiles.includes(editingScript.filePath) : editingScript.official
                                                    ) && (
                                                        <button
                                                            onClick={() => setEditingScript({
                                                                ...editingScript, 
                                                                content: originalSkillData.content
                                                            })}
                                                            className="px-3 py-1.5 text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <RotateCcw size={12} />
                                                            恢复默认
                                                        </button>
                                                    )}
                                                    {editingScript.filePath && userFiles.includes(editingScript.filePath) && (
                                                        <button
                                                            onClick={() => {
                                                                const skillId = editingScript.id.split('/')[0];
                                                                deleteSkillScript(skillId, editingScript.filePath);
                                                                setEditingScript(null);
                                                            }}
                                                            className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <Trash2 size={12} />
                                                            删除
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setEditingScript(null); setOriginalSkillData(null); }}
                                                        className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                                                    >
                                                        取消
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (editingScript.filePath) {
                                                                // 保存脚本到服务器
                                                                const skillId = editingScript.id.split('/')[0];
                                                                // 如果是用户创建的脚本，添加 frontmatter 保存名称和描述
                                                                let contentToSave = editingScript.content;
                                                                if (userFiles.includes(editingScript.filePath)) {
                                                                    // 移除现有的 frontmatter（如果有）
                                                                    const contentWithoutFrontmatter = contentToSave.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
                                                                    // 添加新的 frontmatter
                                                                    contentToSave = `---
name: ${editingScript.name}
description: ${editingScript.description}
---

${contentWithoutFrontmatter}`;
                                                                }
                                                                const success = await saveSkillFile(skillId, editingScript.filePath, contentToSave);
                                                                if (!success) {
                                                                    alert('保存失败');
                                                                    return;
                                                                }
                                                                // 刷新技能列表以更新 isModified 状态
                                                                await loadOfficialSkills();
                                                                // 刷新技能详情以更新文件的 isModified 状态
                                                                if (selectedSkill) {
                                                                    await loadSkillDetail(selectedSkill);
                                                                }
                                                            }
                                                            setEditingScript(null);
                                                            setOriginalSkillData(null);
                                                        }}
                                                        disabled={editingScript.isLoading}
                                                        className="px-3 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 text-green-400 rounded-lg transition-colors"
                                                    >
                                                        保存
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 官方技能列表 */}
                                {!selectedSkill ? (
                                    <>
                                    <div>
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                            📚 {t('official')}
                                        </label>
                                        <div className="space-y-2">
                                            {serverSkills.filter(s => s.isOfficial).map(skill => {
                                                return (
                                                    <div 
                                                        key={skill.id} 
                                                        className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg cursor-pointer hover:bg-blue-500/10 transition-colors"
                                                        onClick={() => loadSkillDetail(skill)}
                                                    >
                                                        <span className="text-lg">{skill.icon}</span>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                                                                {skill.name}
                                                                {skill.isModified && <span className="text-[8px] px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">已自定义</span>}
                                                            </div>
                                                            <div className="text-[10px] text-neutral-500">{skill.id}</div>
                                                        </div>
                                                        <span className="text-[10px] text-neutral-500">{skill.description}</span>
                                                        <ChevronRight size={14} className="text-neutral-600" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                {/* 自定义技能列表 */}
                                <div className="pt-4 border-t border-white/5">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                        📝 {t('custom')}
                                    </label>
                                    <div className="space-y-2">
                                        {serverSkills.filter(s => !s.isOfficial).map(skill => (
                                            <div 
                                                key={skill.id} 
                                                className="flex items-center gap-3 p-3 bg-black/30 border border-white/5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors group"
                                                onClick={() => loadSkillDetail(skill)}
                                            >
                                                <span className="text-lg shrink-0">{skill.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-neutral-200">{skill.name}</div>
                                                    <div className="text-[10px] text-neutral-500">{skill.id}</div>
                                                </div>
                                                <span className="text-[10px] text-neutral-500">{skill.description}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteCustomSkill(skill.id); }}
                                                    className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-neutral-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <ChevronRight size={14} className="text-neutral-600" />
                                            </div>
                                        ))}
                                        {serverSkills.filter(s => !s.isOfficial).length === 0 && (
                                            <div className="text-[11px] text-neutral-600 text-center py-4 border border-dashed border-white/10 rounded-lg">
                                                暂无自定义技能
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 添加新技能 */}
                                <div className="pt-4 border-t border-white/5">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                        <Plus size={12} />
                                        {t('addSkill')}
                                    </label>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                value={newSkillName}
                                                onChange={(e) => setNewSkillName(e.target.value)}
                                                placeholder={t('skillName')}
                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-orange-500/50"
                                            />
                                            <input
                                                type="text"
                                                value={newSkillDesc}
                                                onChange={(e) => setNewSkillDesc(e.target.value)}
                                                placeholder={t('skillDesc')}
                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-orange-500/50"
                                            />
                                        </div>
                                        <textarea
                                            value={newSkillContent}
                                            onChange={(e) => setNewSkillContent(e.target.value)}
                                            placeholder={t('skillContent')}
                                            className="w-full h-32 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono outline-none focus:border-orange-500/50 resize-none custom-scrollbar"
                                        />
                                        <button
                                            onClick={addCustomSkill}
                                            disabled={!newSkillName.trim()}
                                            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-blue-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Plus size={14} />
                                            {t('addSkill')}
                                        </button>
                                    </div>
                                </div>
                                    </>
                                ) : (
                                    /* 技能详情视图 */
                                    <div className="space-y-4">
                                        {/* 返回按钮和标题 */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => { setSelectedSkill(null); setSkillResources([]); setSkillScripts([]); }}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <ChevronRight size={16} className="text-neutral-400 rotate-180" />
                                            </button>
                                            <span className="text-xl">{selectedSkill.icon}</span>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-neutral-200">{selectedSkill.name}</div>
                                                <div className="text-[10px] text-neutral-500">{selectedSkill.id}</div>
                                            </div>
                                            {/* 全部恢复默认按钮 - 只对官方技能显示 */}
                                            {selectedSkill.isOfficial && (
                                                <button
                                                    onClick={() => {
                                                        setConfirmDialog({
                                                            message: `确定要将「${selectedSkill.name}」的所有文件恢复为官方默认吗？这将覆盖你的所有修改。`,
                                                            onConfirm: async () => {
                                                                try {
                                                                    const res = await fetch(`http://localhost:3001/api/skill-restore/${selectedSkill.id}`, {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({})
                                                                    });
                                                                    if (res.ok) {
                                                                        // 重新加载技能列表（更新 isModified 状态）
                                                                        await loadOfficialSkills();
                                                                        // 重新加载技能详情
                                                                        await loadSkillDetail(selectedSkill);
                                                                    } else {
                                                                        const err = await res.json();
                                                                        alert(`恢复失败: ${err.error}`);
                                                                    }
                                                                } catch (e) {
                                                                    alert(`恢复失败: ${e.message}`);
                                                                }
                                                                setConfirmDialog(null);
                                                            }
                                                        });
                                                    }}
                                                    className="px-3 py-1.5 text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors flex items-center gap-1"
                                                >
                                                    <RotateCcw size={12} />
                                                    全部恢复默认
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openOfficialSkillEdit(selectedSkill)}
                                                className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <Edit3 size={12} />
                                                编辑文档
                                            </button>
                                        </div>

                                        {/* Tab 切换 */}
                                        <div className="flex gap-1 bg-black/30 p-1 rounded-lg">
                                            <button
                                                onClick={() => setSkillDetailTab('doc')}
                                                className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                                                    skillDetailTab === 'doc' 
                                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                                        : 'text-neutral-500 hover:text-neutral-300'
                                                }`}
                                            >
                                                <FileText size={12} />
                                                文档
                                            </button>
                                            <button
                                                disabled={true}
                                                title="脚本功能暂时禁用，敬请期待"
                                                className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 opacity-40 cursor-not-allowed text-neutral-600`}
                                            >
                                                <Code size={12} />
                                                脚本 (即将推出)
                                            </button>
                                            <button
                                                onClick={() => setSkillDetailTab('resources')}
                                                className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                                                    skillDetailTab === 'resources' 
                                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                                                        : 'text-neutral-500 hover:text-neutral-300'
                                                }`}
                                            >
                                                <BookOpen size={12} />
                                                参考文档 {skillResources.length > 0 && `(${skillResources.length})`}
                                            </button>
                                        </div>

                                        {/* 加载中 */}
                                        {loadingSkillDetail && (
                                            <div className="text-center py-8 text-neutral-500 text-xs animate-pulse">
                                                加载中...
                                            </div>
                                        )}

                                        {/* 文档 Tab */}
                                        {!loadingSkillDetail && skillDetailTab === 'doc' && (
                                            <div className="p-4 bg-black/30 border border-white/5 rounded-lg">
                                                <div className="text-[10px] text-neutral-500 mb-2">{selectedSkill.description}</div>
                                                <div className="text-xs text-neutral-400">
                                                    点击右上角"编辑文档"按钮查看和编辑 SKILL.md 内容
                                                </div>
                                            </div>
                                        )}

                                        {/* 脚本 Tab */}
                                        {!loadingSkillDetail && skillDetailTab === 'scripts' && (
                                            <div className="space-y-3">
                                                {/* 脚本列表 */}
                                                <div className="space-y-2">
                                                    {skillScripts.length === 0 ? (
                                                        <div className="text-[11px] text-neutral-600 text-center py-6 border border-dashed border-white/10 rounded-lg">
                                                            此技能没有脚本
                                                        </div>
                                                    ) : (
                                                        skillScripts.map((scriptPath, idx) => {
                                                            const normalizedPath = scriptPath.replace(/\\/g, '/');
                                                            const scriptName = normalizedPath.replace('scripts/', '').replace('.js', '');
                                                            const officialScript = OFFICIAL_SCRIPTS.find(s => s.id === scriptName);
                                                            const isOfficialFile = !userFiles.includes(normalizedPath);
                                                            
                                                            return (
                                                                <div 
                                                                    key={idx}
                                                                    className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg cursor-pointer hover:bg-green-500/10 transition-colors group"
                                                                    onClick={async () => {
                                                                        // 从服务器加载脚本内容
                                                                        try {
                                                                            const res = await fetch(`http://localhost:3001/api/skill-doc/${selectedSkill.id}?doc=${normalizedPath.replace('.js', '')}`);
                                                                            if (res.ok) {
                                                                                const data = await res.json();
                                                                                setEditingScript({
                                                                                    id: `${selectedSkill.id}/${normalizedPath}`,
                                                                                    name: officialScript?.name || scriptName,
                                                                                    description: officialScript?.description || '',
                                                                                    content: data.content || '',
                                                                                    official: isOfficialFile,
                                                                                    filePath: normalizedPath
                                                                                });
                                                                                
                                                                                // 如果是官方文件，加载官方原始内容用于恢复默认
                                                                                if (isOfficialFile && selectedSkill.isOfficial) {
                                                                                    try {
                                                                                        const officialRes = await fetch(`http://localhost:3001/api/skill-official/${selectedSkill.id}?file=${normalizedPath}`);
                                                                                        if (officialRes.ok) {
                                                                                            const officialData = await officialRes.json();
                                                                                            setOriginalSkillData({
                                                                                                name: officialScript?.name || scriptName,
                                                                                                description: officialScript?.description || '',
                                                                                                content: officialData.content || ''
                                                                                            });
                                                                                        } else {
                                                                                            setOriginalSkillData(null);
                                                                                        }
                                                                                    } catch (e) {
                                                                                        setOriginalSkillData(null);
                                                                                    }
                                                                                } else {
                                                                                    setOriginalSkillData(null);
                                                                                }
                                                                            }
                                                                        } catch (e) {
                                                                            console.error('Failed to load script:', e);
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className="text-lg">{officialScript?.icon || '📜'}</span>
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                                                                            {officialScript?.name || scriptName}
                                                                            {!userFiles.includes(normalizedPath) && (
                                                                                <span className="text-[8px] px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded">官方</span>
                                                                            )}
                                                                            {selectedSkill.modifiedFiles?.includes(normalizedPath) && (
                                                                                <span className="text-[8px] px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">已自定义</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-[10px] text-neutral-500">{normalizedPath}</div>
                                                                    </div>
                                                                    <span className="text-[10px] text-neutral-500">
                                                                        {officialScript?.description || ''}
                                                                    </span>
                                                                    {userFiles.includes(normalizedPath) && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                deleteSkillScript(selectedSkill.id, normalizedPath);
                                                                            }}
                                                                            className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-neutral-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                    <Edit3 size={14} className="text-neutral-600" />
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>

                                                {/* 添加脚本按钮/表单 */}
                                                {!showAddScript ? (
                                                    <button
                                                        onClick={() => setShowAddScript(true)}
                                                        className="w-full py-2 border border-dashed border-green-500/30 rounded-lg text-xs text-green-400 hover:bg-green-500/10 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Plus size={12} />
                                                        添加脚本
                                                    </button>
                                                ) : (
                                                    <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg space-y-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input
                                                                type="text"
                                                                value={newScriptName}
                                                                onChange={(e) => setNewScriptName(e.target.value)}
                                                                placeholder="脚本名称"
                                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-green-500/50"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={newScriptDesc}
                                                                onChange={(e) => setNewScriptDesc(e.target.value)}
                                                                placeholder="描述"
                                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-green-500/50"
                                                            />
                                                        </div>
                                                        <textarea
                                                            value={newScriptContent}
                                                            onChange={(e) => setNewScriptContent(e.target.value)}
                                                            placeholder="// 脚本代码"
                                                            className="w-full h-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-green-300 font-mono outline-none focus:border-green-500/50 resize-none"
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                onClick={() => { setShowAddScript(false); setNewScriptName(''); setNewScriptDesc(''); setNewScriptContent(''); }}
                                                                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                                                            >
                                                                取消
                                                            </button>
                                                            <button
                                                                onClick={addSkillScript}
                                                                disabled={!newScriptName.trim()}
                                                                className="px-3 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 disabled:opacity-30 text-green-400 rounded-lg transition-colors"
                                                            >
                                                                添加
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 参考文档 Tab */}
                                        {!loadingSkillDetail && skillDetailTab === 'resources' && (
                                            <div className="space-y-3">
                                                {/* 参考文档列表 */}
                                                <div className="space-y-2">
                                                    {skillResources.length === 0 ? (
                                                        <div className="text-[11px] text-neutral-600 text-center py-6 border border-dashed border-white/10 rounded-lg">
                                                            此技能没有参考文档
                                                        </div>
                                                    ) : (
                                                        skillResources.map((resourcePath, idx) => {
                                                            const normalizedPath = resourcePath.replace(/\\/g, '/');
                                                            const resourceName = normalizedPath.replace('resources/', '').replace('.md', '');
                                                            
                                                            return (
                                                                <div 
                                                                    key={idx}
                                                                    className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg cursor-pointer hover:bg-purple-500/10 transition-colors group"
                                                                    onClick={async () => {
                                                                        // 从服务器加载文档内容
                                                                        try {
                                                                            const docPath = normalizedPath.replace('.md', '');
                                                                            const res = await fetch(`http://localhost:3001/api/skill-doc/${selectedSkill.id}?doc=${docPath}`);
                                                                            if (res.ok) {
                                                                                const data = await res.json();
                                                                                let content = data.content || '';
                                                                                let docName = resourceName;
                                                                                let docDesc = '';
                                                                                const fmMatch = content.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]*([\s\S]*)$/);
                                                                                if (fmMatch) {
                                                                                    const fm = fmMatch[1];
                                                                                    content = fmMatch[2].trim();
                                                                                    const nameM = fm.match(/name:\s*(.+)/);
                                                                                    const descM = fm.match(/description:\s*(.+)/);
                                                                                    if (nameM) docName = nameM[1].trim();
                                                                                    if (descM) docDesc = descM[1].trim();
                                                                                }
                                                                                
                                                                                // 判断是否是官方文件
                                                                                const isOfficialFile = !userFiles.includes(normalizedPath);
                                                                                
                                                                                setEditingSkill({
                                                                                    id: `${selectedSkill.id}/${normalizedPath}`,
                                                                                    name: docName,
                                                                                    description: docDesc,
                                                                                    content: content,
                                                                                    official: isOfficialFile,
                                                                                    isSubdoc: true,
                                                                                    filePath: normalizedPath
                                                                                });
                                                                                
                                                                                // 如果是官方文件，加载官方原始内容用于恢复默认
                                                                                if (isOfficialFile && selectedSkill.isOfficial) {
                                                                                    try {
                                                                                        const officialRes = await fetch(`http://localhost:3001/api/skill-official/${selectedSkill.id}?file=${normalizedPath}`);
                                                                                        if (officialRes.ok) {
                                                                                            const officialData = await officialRes.json();
                                                                                            let officialContent = officialData.content || '';
                                                                                            let officialName = docName;
                                                                                            let officialDesc = docDesc;
                                                                                            const officialFmMatch = officialContent.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]*([\s\S]*)$/);
                                                                                            if (officialFmMatch) {
                                                                                                const fm = officialFmMatch[1];
                                                                                                officialContent = officialFmMatch[2].trim();
                                                                                                const nameM = fm.match(/name:\s*(.+)/);
                                                                                                const descM = fm.match(/description:\s*(.+)/);
                                                                                                if (nameM) officialName = nameM[1].trim();
                                                                                                if (descM) officialDesc = descM[1].trim();
                                                                                            }
                                                                                            setOriginalSkillData({
                                                                                                name: officialName,
                                                                                                description: officialDesc,
                                                                                                content: officialContent
                                                                                            });
                                                                                        } else {
                                                                                            setOriginalSkillData(null);
                                                                                        }
                                                                                    } catch (e) {
                                                                                        setOriginalSkillData(null);
                                                                                    }
                                                                                } else {
                                                                                    setOriginalSkillData(null);
                                                                                }
                                                                            }
                                                                        } catch (e) {
                                                                            console.error('Failed to load subdoc:', e);
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className="text-lg">📄</span>
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                                                                            {resourceName.replace(/_/g, ' ')}
                                                                            {!userFiles.includes(normalizedPath) && (
                                                                                <span className="text-[8px] px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded">官方</span>
                                                                            )}
                                                                            {selectedSkill.modifiedFiles?.includes(normalizedPath) && (
                                                                                <span className="text-[8px] px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">已自定义</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-[10px] text-neutral-500">{normalizedPath}</div>
                                                                    </div>
                                                                    {userFiles.includes(normalizedPath) && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                deleteSkillResource(selectedSkill.id, normalizedPath);
                                                                            }}
                                                                            className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-neutral-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                    <Edit3 size={14} className="text-neutral-600" />
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>

                                                {/* 添加参考文档按钮/表单 */}
                                                {!showAddResource ? (
                                                    <button
                                                        onClick={() => setShowAddResource(true)}
                                                        className="w-full py-2 border border-dashed border-purple-500/30 rounded-lg text-xs text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Plus size={12} />
                                                        添加参考文档
                                                    </button>
                                                ) : (
                                                    <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg space-y-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input
                                                                type="text"
                                                                value={newResourceName}
                                                                onChange={(e) => setNewResourceName(e.target.value)}
                                                                placeholder="文档名称"
                                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-purple-500/50"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={newResourceDesc}
                                                                onChange={(e) => setNewResourceDesc(e.target.value)}
                                                                placeholder="描述"
                                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-purple-500/50"
                                                            />
                                                        </div>
                                                        <textarea
                                                            value={newResourceContent}
                                                            onChange={(e) => setNewResourceContent(e.target.value)}
                                                            placeholder="# 参考文档内容 (Markdown)"
                                                            className="w-full h-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono outline-none focus:border-purple-500/50 resize-none"
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                onClick={() => { setShowAddResource(false); setNewResourceName(''); setNewResourceDesc(''); setNewResourceContent(''); }}
                                                                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                                                            >
                                                                取消
                                                            </button>
                                                            <button
                                                                onClick={addSkillResource}
                                                                disabled={!newResourceName.trim()}
                                                                className="px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-30 text-purple-400 rounded-lg transition-colors"
                                                            >
                                                                添加
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}


                        {/* API Settings */}
                        {activeTab === 'api' && (
                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300 fade-in">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-400 block">{t('baseUrl')}</label>
                                    <input
                                        type="text"
                                        value={settings.baseUrl}
                                        onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-700 font-mono"
                                        placeholder="https://api.openai.com/v1"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-400 block">{t('apiKey')}</label>
                                    <input
                                        type="password"
                                        value={settings.apiKey}
                                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-700 font-mono"
                                        placeholder="sk-..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-400 block">{t('modelName')}</label>
                                    <input
                                        type="text"
                                        value={settings.model}
                                        onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-700 font-mono"
                                        placeholder="claude-3-5-sonnet-20241022"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-400 block">{t('maxTokens')}</label>
                                    <input
                                        type="number"
                                        value={settings.maxTokens || 16384}
                                        onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) || 16384 })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-700 font-mono"
                                        placeholder="16384"
                                        min="1024"
                                        max="200000"
                                    />
                                    <p className="text-[10px] text-neutral-600">{t('maxTokensDesc')}</p>
                                </div>

                                {/* AI Concurrency Settings */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-400">
                                        {language === 'zh' ? 'AI 并发数' : 'AI Concurrency'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="8"
                                        value={settings.concurrencyCount || 1}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            if (value >= 1 && value <= 8) {
                                                setSettings({ ...settings, concurrencyCount: value });
                                            }
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-700 font-mono"
                                        placeholder="1"
                                    />
                                    <p className="text-[10px] text-neutral-600">
                                        {language === 'zh' 
                                            ? '每次生成多少个不同的方案（1-8）。设为 1 时保持现有行为。' 
                                            : 'How many different variants to generate (1-8). Set to 1 for current behavior.'}
                                    </p>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-neutral-400 flex items-center gap-2">
                                            {t('imageModel')}
                                            <span className="text-[10px] text-neutral-600 italic font-normal">({t('optional')})</span>
                                        </label>
                                        <div className="flex gap-1 bg-black/30 rounded-lg p-0.5">
                                            <button
                                                onClick={() => setSettings({ ...settings, imageUseSameApi: true })}
                                                className={`px-2 py-1 text-[10px] rounded-md flex items-center gap-1 transition-all ${settings.imageUseSameApi !== false
                                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                    : 'text-neutral-500 hover:text-neutral-300'
                                                    }`}
                                            >
                                                <Link size={10} />
                                                {t('imageSameApi')}
                                            </button>
                                            <button
                                                onClick={() => setSettings({ ...settings, imageUseSameApi: false })}
                                                className={`px-2 py-1 text-[10px] rounded-md flex items-center gap-1 transition-all ${settings.imageUseSameApi === false
                                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                    : 'text-neutral-500 hover:text-neutral-300'
                                                    }`}
                                            >
                                                <Unlink size={10} />
                                                {t('imageSeparateApi')}
                                            </button>
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        value={settings.imageModel || ''}
                                        onChange={(e) => setSettings({ ...settings, imageModel: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-700 font-mono"
                                        placeholder="stabilityai/stable-diffusion-3-5-large"
                                    />

                                    {settings.imageUseSameApi === false && (
                                        <div className="space-y-2 pl-3 border-l-2 border-purple-500/30 animate-in slide-in-from-top-2 duration-200">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-medium text-purple-400/80 block">{t('imageBaseUrl')}</label>
                                                <input
                                                    type="text"
                                                    value={settings.imageBaseUrl || ''}
                                                    onChange={(e) => setSettings({ ...settings, imageBaseUrl: e.target.value })}
                                                    className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:border-purple-500/50 outline-none transition-all placeholder:text-neutral-700 font-mono"
                                                    placeholder="https://api.siliconflow.cn/v1"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-medium text-purple-400/80 block">{t('imageApiKey')}</label>
                                                <input
                                                    type="password"
                                                    value={settings.imageApiKey || ''}
                                                    onChange={(e) => setSettings({ ...settings, imageApiKey: e.target.value })}
                                                    className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:border-purple-500/50 outline-none transition-all placeholder:text-neutral-700 font-mono"
                                                    placeholder="sk-..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{t('profiles')}</label>
                                        <span className="text-[10px] text-neutral-600">{savedProfiles.length}/5</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                            placeholder={t('profileNamePlaceholder')}
                                            maxLength={20}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-orange-500/50 placeholder:text-neutral-700 transition-all"
                                        />
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={savedProfiles.length >= 5 || !profileName.trim()}
                                            className="px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-neutral-300 transition-colors border border-white/5 hover:border-white/10"
                                            title={t('saveProfile')}
                                        >
                                            <Save size={14} />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {savedProfiles.map(profile => (
                                            <div key={profile.id} className="flex items-center justify-between p-2.5 rounded-lg bg-black/20 border border-white/5 group hover:border-white/10 transition-colors">
                                                <span className="text-xs text-neutral-300 truncate max-w-[140px] font-mono">{profile.name}</span>
                                                <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleLoadProfile(profile)}
                                                        className="p-1.5 hover:bg-orange-500/20 hover:text-orange-400 text-neutral-500 rounded-md transition-colors"
                                                        title={t('load')}
                                                    >
                                                        <Download size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProfile(profile.id)}
                                                        className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-neutral-500 rounded-md transition-colors"
                                                        title={t('delete')}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {savedProfiles.length === 0 && (
                                            <div className="text-[10px] text-neutral-700 text-center py-3 border border-dashed border-white/5 rounded-lg">
                                                {t('noProfiles')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* About Tab */}
                        {activeTab === 'about' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                                {/* 作者信息 */}
                                <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20">
                                    <div className="flex items-center gap-3 mb-3">
                                        <img 
                                            src="/author-avatar.jpg" 
                                            alt="没钱买面包のcn"
                                            className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/30"
                                        />
                                        <div>
                                            <div className="text-xs text-neutral-500">{t('author')}</div>
                                            <div className="text-sm font-medium text-white">没钱买面包のcn</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                                        <Calendar size={12} />
                                        <span>{t('version')}: {versionInfo.latest?.version || 'v1.0.0'}</span>
                                    </div>
                                </div>

                                {/* 相关链接 */}
                                <div>
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 block">
                                        {t('links')}
                                    </label>
                                    <div className="space-y-2">
                                        <a
                                            href="https://space.bilibili.com/78004199"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 transition-colors group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                                <span className="text-lg">📺</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-pink-300">{t('bilibili')}</div>
                                                <div className="text-[10px] text-neutral-500">@没钱买面包のcn</div>
                                            </div>
                                            <ExternalLink size={14} className="text-neutral-600 group-hover:text-pink-400 transition-colors" />
                                        </a>
                                        <a 
                                            href="https://qm.qq.com/q/G1jTMME2gq" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors group cursor-pointer"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <span className="text-lg">💬</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-blue-300">{t('qqGroup')}</div>
                                                <div className="text-[10px] text-neutral-500 font-mono">364721875</div>
                                            </div>
                                            <ExternalLink size={14} className="text-neutral-600 group-hover:text-blue-400 transition-colors" />
                                        </a>
                                    </div>
                                </div>

                                {/* 更新日志 */}
                                <div>
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 block">
                                        {t('changelog')}
                                    </label>
                                    <div className="space-y-2">
                                        {isLoadingVersions ? (
                                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                                <div className="relative w-10 h-10">
                                                    <div className="absolute inset-0 border-2 border-orange-500/20 rounded-full"></div>
                                                    <div className="absolute inset-0 border-2 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
                                                </div>
                                                <span className="text-xs text-neutral-500">{t('loading') || '加载中...'}</span>
                                            </div>
                                        ) : versionInfo.versions.length === 0 ? (
                                            <div className="text-xs text-neutral-600 text-center py-4 border border-dashed border-white/10 rounded-lg">
                                                {t('noChangelog')}
                                            </div>
                                        ) : (
                                            versionInfo.versions.map((ver, idx) => (
                                                <div key={ver.version} className="rounded-lg border border-white/10 overflow-hidden">
                                                    <button
                                                        onClick={() => setExpandedVersions(prev => ({
                                                            ...prev,
                                                            [ver.version]: !prev[ver.version]
                                                        }))}
                                                        className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-mono px-2 py-0.5 rounded ${idx === 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-neutral-400'}`}>
                                                                {ver.version}
                                                            </span>
                                                            {ver.title && (
                                                                <span className="text-xs text-neutral-300">{ver.title}</span>
                                                            )}
                                                        </div>
                                                        <ChevronDown 
                                                            size={14} 
                                                            className={`text-neutral-500 transition-transform ${expandedVersions[ver.version] ? 'rotate-180' : ''}`} 
                                                        />
                                                    </button>
                                                    {expandedVersions[ver.version] && (
                                                        <div className="p-3 bg-black/20 text-xs text-neutral-400 whitespace-pre-wrap border-t border-white/5">
                                                            {ver.content || t('noChangelog')}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-orange-900/20 transition-all active:scale-95"
                    >
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
