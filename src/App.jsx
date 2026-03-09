import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Grid, Environment } from '@react-three/drei';
import { Settings, Send, Box, Download, Layers, Sparkles, Sun, Moon, FileInput, Trash2, Copy, History, Clock, FileCode, Terminal, ChevronDown, ChevronUp, MessageSquarePlus, Image as ImageIcon, Palette, Undo2, Redo2, Package, Square, Rocket, Zap, Ruler, X, Wrench } from 'lucide-react';
import useStore from './store/useStore';
import VoxelWorld from './components/VoxelWorld';
import PropertiesPanel from './components/PropertiesPanel';
import SettingsModal from './components/SettingsModal';
import CodeViewerModal from './components/CodeViewerModal';
import ImageViewerModal from './components/ImageViewerModal';
import BlockToolsPanel from './components/BlockToolsPanel';
import VariantTabs from './components/VariantTabs';
import { generateStructureCommand } from './utils/parser';
import { generateOneCommand, exportToMcFunction, exportToNBTStructure, exportToWorldEdit, exportToLitematica, exportToAxiom, exportToDatapack } from './utils/exporter';
import ImportModal from './components/ImportModal';
import VersionSelectModal from './components/VersionSelectModal';
import { fetchAIResponseStream, generateImage, generatePreciseBuild } from './utils/ai';
import { applyCodeEdit } from './utils/codeEditor';
import { agentGenerateV2 } from './utils/twoStepAI';
import { setAgentDebugMode } from './utils/agentLoopV2';
import DevConsoleModal from './components/DevConsoleModal';

import MinecraftControls from './components/MinecraftControls';
import MinecraftHUD from './components/MinecraftHUD';
import { MousePointer2, Plane } from 'lucide-react';

/**
 * @typedef {Object} Variant
 * @property {string} id - 唯一标识符
 * @property {string} content - AI 响应内容
 * @property {Array} blocks - 方块数据
 * @property {Array} semanticVoxels - 语义体素数据
 * @property {'generating'|'done'|'error'} status - 生成状态
 * @property {string} [error] - 错误信息（如果有）
 * @property {number} generatedAt - 完成时间戳（用于排序）
 */

/**
 * @typedef {Object} Message
 * @property {'user'|'ai'|'system'} role - 消息角色
 * @property {string} content - 消息内容
 * @property {string} [id] - 消息唯一标识
 * @property {Array<Variant>} [variants] - 并发生成的所有变体
 * @property {number} [activeVariantIndex] - 当前选中的变体索引
 * @property {number} [concurrencyCount] - 并发数（用于判断是否显示标签页）
 * @property {boolean} [hasScript] - 是否有脚本
 * @property {string} [imageUrl] - 图片 URL
 * @property {Array<string>} [imageUrls] - 多个图片 URL
 */

const TRANSLATIONS = {
  en: {
    appTitle: 'AI Architect',
    newChat: 'New Chat',
    directImport: 'Direct Import',
    settings: 'Settings',
    export: 'Export',
    completeDatapack: 'Complete Datapack',
    readyZip: 'Ready-to-use ZIP file',
    oneCommand: 'One Command Block',
    copyClipboard: 'Copy to Clipboard (Max 32k)',
    nbtStructure: 'NBT Structure',
    vanillaStructure: 'Vanilla Structure Block',
    worldEdit: 'WorldEdit Schematic',
    forWorldEdit: 'For WEMOD / WorldEdit',
    litematica: 'Litematica',
    schematicMod: 'Schematic MOD',
    axiomBlueprint: 'Axiom Blueprint',
    axiomMod: 'Axiom MOD Format',
    chat: 'CHAT',
    sessions: 'SESSIONS',
    directCode: 'Direct Code',
    visualMode: 'Visual Mode',
    placeholder: 'Describe your vision...',
    day: 'DAY',
    night: 'NIGHT',
    blueprint: 'BLUEPRINT',
    minecraft: 'MINECRAFT',
    orbit: 'ORBIT',
    orbitDesc: 'Orbit View (Editor)',
    game: 'GAME',
    gameDesc: 'Minecraft View (First Person)',
    blocks: 'BLOCKS',
    generating: 'Generating blocks in real-time...',
    noSessions: 'No sessions yet.',
    undo: 'Undo',
    redo: 'Redo',
    viewScript: 'View Script',
    buildStructure: 'Build This Structure',
    new: 'New',
    confirmDelete: 'Are you sure you want to delete this session?',
    delete: 'Delete',
    cancel: 'Cancel',
    success: 'Success',
    stopped: 'Generation stopped',
    uploadImage: 'Upload Image'
  },
  zh: {
    appTitle: 'AI 建筑师',
    newChat: '新对话',
    directImport: '直接导入',
    settings: '设置',
    export: '导出',
    completeDatapack: '完整数据包',
    readyZip: '即用型 ZIP 文件',
    oneCommand: '单指令方块',
    copyClipboard: '复制到剪贴板 (最大 32k)',
    nbtStructure: 'NBT 结构文件',
    vanillaStructure: '原版结构方块专用',
    worldEdit: 'WorldEdit 原理图',
    forWorldEdit: '适用于 WEMOD / WorldEdit',
    litematica: '投影材质 (Litematica)',
    schematicMod: '投影模组专用',
    axiomBlueprint: 'Axiom 蓝图',
    axiomMod: 'Axiom 模组格式',
    chat: '对话',
    sessions: '历史会话',
    directCode: '建造模式',
    visualMode: '视觉模式',
    placeholder: '描述你的构想...',
    day: '白昼',
    night: '夜晚',
    blueprint: '蓝图视图',
    minecraft: '实景视图',
    orbit: '编辑视角',
    orbitDesc: '轨道视图 (编辑器)',
    game: '游戏视角',
    gameDesc: '可以像在游戏里一样移动',
    blocks: '方块数',
    generating: '正在实时生成方块...',
    noSessions: '暂元历史会话',
    undo: '撤销',
    redo: '重做',
    viewScript: '查看脚本',
    buildStructure: '构建此结构',
    new: '新',
    confirmDelete: '确定要删除此会话吗？',
    delete: '删除',
    cancel: '取消',
    success: '成功',
    stopped: '已停止生成',
    uploadImage: '上传图片'
  }
};

/**
 * 简单的 Markdown 渲染函数
 * 支持：粗体、斜体、标题、列表、行内代码
 */
function renderMarkdown(text) {
  if (!text) return null;
  
  // 先移除代码块（已经单独处理）
  const withoutCodeBlocks = text.replace(/```[\s\S]*?```/g, '✨ [Generated Script Executed]');
  
  // 分割成行
  const lines = withoutCodeBlocks.split('\n');
  
  return lines.map((line, lineIndex) => {
    // 处理标题 - 明显的字体大小差异
    if (line.startsWith('### ')) {
      return <div key={lineIndex} style={{ fontSize: '1.1rem', fontWeight: 600 }} className="text-orange-300 mt-3 mb-1">{processInlineMarkdown(line.slice(4))}</div>;
    }
    if (line.startsWith('## ')) {
      return <div key={lineIndex} style={{ fontSize: '1.5rem', fontWeight: 700 }} className="text-orange-200 mt-4 mb-2">{processInlineMarkdown(line.slice(3))}</div>;
    }
    if (line.startsWith('# ')) {
      return <div key={lineIndex} style={{ fontSize: '2rem', fontWeight: 700 }} className="text-orange-100 mt-5 mb-3">{processInlineMarkdown(line.slice(2))}</div>;
    }
    
    // 处理列表项
    if (line.match(/^\d+\.\s/)) {
      return <div key={lineIndex} className="ml-4 my-0.5">{processInlineMarkdown(line)}</div>;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <div key={lineIndex} className="ml-4 my-0.5">• {processInlineMarkdown(line.slice(2))}</div>;
    }
    
    // 空行
    if (line.trim() === '') {
      return <div key={lineIndex} className="h-2" />;
    }
    
    // 普通行
    return <div key={lineIndex}>{processInlineMarkdown(line)}</div>;
  });
}

/**
 * 处理行内 Markdown（粗体、斜体、行内代码）
 */
function processInlineMarkdown(text) {
  if (!text) return text;
  
  const parts = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.length > 0) {
    // 粗体 **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // 斜体 *text* 或 _text_
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/);
    // 行内代码 `code`
    const codeMatch = remaining.match(/`([^`]+)`/);
    
    // 找到最早出现的匹配
    const matches = [
      boldMatch ? { type: 'bold', match: boldMatch, index: remaining.indexOf(boldMatch[0]) } : null,
      italicMatch ? { type: 'italic', match: italicMatch, index: remaining.indexOf(italicMatch[0]) } : null,
      codeMatch ? { type: 'code', match: codeMatch, index: remaining.indexOf(codeMatch[0]) } : null,
    ].filter(m => m !== null).sort((a, b) => a.index - b.index);
    
    if (matches.length === 0) {
      // 没有更多匹配，添加剩余文本
      parts.push(remaining);
      break;
    }
    
    const firstMatch = matches[0];
    
    // 添加匹配之前的文本
    if (firstMatch.index > 0) {
      parts.push(remaining.slice(0, firstMatch.index));
    }
    
    // 添加格式化的内容
    if (firstMatch.type === 'bold') {
      parts.push(<strong key={key++} className="font-bold text-white">{firstMatch.match[1]}</strong>);
    } else if (firstMatch.type === 'italic') {
      parts.push(<em key={key++} className="italic">{firstMatch.match[1] || firstMatch.match[2]}</em>);
    } else if (firstMatch.type === 'code') {
      parts.push(<code key={key++} className="px-1.5 py-0.5 bg-black/30 rounded text-orange-300 font-mono text-xs">{firstMatch.match[1]}</code>);
    }
    
    // 更新剩余文本
    remaining = remaining.slice(firstMatch.index + firstMatch.match[0].length);
  }
  
  return parts.length > 0 ? parts : text;
}

// Component to dynamically update camera FOV when settings change
function CameraUpdater({ fov }) {
  const { camera } = useThree();

  useEffect(() => {
    if (camera && fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);

  return null;
}

function App() {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isVersionSelectOpen, setIsVersionSelectOpen] = useState(false); // Version selection modal
  const [selectedExportType, setSelectedExportType] = useState(null); // 'datapack', 'occ', 'nbt', etc.
  const [selectedVersion, setSelectedVersion] = useState('1.21'); // Selected MC version
  const [isDayMode, setIsDayMode] = useState(true);
  const [streamingText, setStreamingText] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  // agentSteps is now in useStore
  const [expandedSteps, setExpandedSteps] = useState(new Set()); // Track which steps are expanded
  const [isWorkflowCollapsed, setIsWorkflowCollapsed] = useState(false); // New: Collapse workflow after completion
  const [currentBlueprint, setCurrentBlueprint] = useState(null); // Stores {style, size} for blueprint card inside workflow
  const [referenceImageUrl, setReferenceImageUrl] = useState(null); // Stores the last generated image context
  // lastGeneratedCode is now in useStore for undo/redo support
  const [toasts, setToasts] = useState([]);
  // devLogs is now in useStore for persistence
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false); // Dev console modal visibility
  const [attachedImages, setAttachedImages] = useState([]); // User uploaded images for Vision API (max 3)
  const [viewingImage, setViewingImage] = useState(null); // Image URL for fullscreen viewer
  // Note: apiConversationHistory is now managed by useStore for persistence
  const controlsRef = useRef();

  const abortControllerRef = useRef(null);
  const lastInputRef = useRef('');
  const fileInputRef = useRef(null); // Ref for hidden file input
  const textareaRef = useRef(null); // Ref for textarea to reset height

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (PNG/JPG)', 'error');
      return;
    }
    // Limit size if needed (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image is too large (Max 5MB)', 'error');
      return;
    }
    // Max 3 images
    if (attachedImages.length >= 3) {
      showToast('Maximum 3 images allowed', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setAttachedImages(prev => [...prev, e.target.result]);
      showToast('Image attached', 'success');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        handleImageFile(file);
        e.preventDefault(); // Prevent pasting the binary code
        break;
      }
    }
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const {
    addBlocksFromStream, startStreamingSession,
    blocks, clearBlocks, viewMode, setViewMode,
    sessions, currentSessionId, currentMessages, updateCurrentMessages,
    createNewSession, switchSession, deleteSession, syncSessions,
    controlMode, setControlMode, clearSelection,
    pushChatSnapshot, undoChat, redoChat, snapshotIndex, chatSnapshots, jumpToSnapshot,
    language, setLanguage, setBlocks, setSemanticVoxels,
    apiConversationHistory, setApiConversationHistory, // API conversation from store
    agentSteps, setAgentSteps, // Persistent agent workflow steps
    devLogs, setDevLogs, clearDevLogs, // Dev console logs from store
    lastGeneratedCode, setLastGeneratedCode, // Code from store for undo/redo
    isLoadingSession // Loading state for session switching
  } = useStore();

  const t = (key) => TRANSLATIONS[language][key] || key;

  // Auto-focus camera on structure center when it changes
  useEffect(() => {
    // ONLY focus if we have actual blocks and the store is not empty and in Orbit mode
    if (controlMode === 'orbit' && blocks && blocks.length > 0 && controlsRef.current) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      let valid = false;

      blocks.forEach(b => {
        if (b.position && Array.isArray(b.position)) {
          const [x, y, z] = b.position;
          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
            valid = true;
          }
        }
      });

      // Prevention: If we didn't find any valid positions, DON'T move the camera
      if (valid) {
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;

        // Smoothly move the target
        controlsRef.current.target.set(centerX, centerY, centerZ);
        controlsRef.current.update();
      }
    }
  }, [blocks.length, controlMode]); // Re-center when block count changes or mode switches back to orbit

  const [isVisualMode, setIsVisualMode] = useState(false);
  const [generationMode, setGenerationMode] = useState(() => {
    const saved = localStorage.getItem('mc-ai-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.generationMode) return parsed.generationMode;
      } catch (e) {
        console.warn('Failed to parse settings for generation mode', e);
      }
    }
    return 'fast'; // Default to Fast mode
  });
  const [viewingCode, setViewingCode] = useState(null); // Code string to view in modal
  const [apiSettings, setApiSettings] = useState(() => {
    const saved = localStorage.getItem('mc-ai-settings');
    // Ensure all settings have defaults
    const defaults = {
      apiKey: '',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'Pro/moonshotai/Kimi-K2.5',
      imageModel: 'dall-e-3',
      imageProvider: 'jimeng',  // 默认使用即梦AI
      jimengAccessKeyId: 'AKLTODdiN2IyNDEzMzg4NGI0YjgwOTAxNTVhMDk1ODQwY2Q',    // 即梦AI Access Key ID
      jimengSecretAccessKey: 'WVRVNE1HUTFOR0ZpWlRnMk5HTXpPRGszT0dReE5HVXdNemM1TkRNNFpUaw==', // 即梦AI Secret Access Key
      generationMode: 'fast', // Default to Fast mode
      mouseSensitivity: 1.0,
      fov: 75,
      debugMode: false,
      concurrencyCount: 1  // 新增：默认并发数为 1
    };
    
    let merged;
    if (saved) {
      const parsed = JSON.parse(saved);
      // 特殊处理：如果 localStorage 中没有即梦AI相关字段，使用默认值
      merged = {
        ...defaults,
        ...parsed,
        // 强制使用默认的即梦AI配置（除非用户明确在设置中修改过）
        imageProvider: parsed.imageProvider || defaults.imageProvider,
        jimengAccessKeyId: parsed.jimengAccessKeyId || defaults.jimengAccessKeyId,
        jimengSecretAccessKey: parsed.jimengSecretAccessKey || defaults.jimengSecretAccessKey
      };
    } else {
      merged = defaults;
    }
    
    // Apply debug mode on initial load
    setAgentDebugMode(merged.debugMode === true);
    return merged;
  });

  const messages = currentMessages;
  const setMessages = updateCurrentMessages;

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load sessions from server on mount
    const init = async () => {
      await syncSessions();
      setIsInitialized(true);
    };
    init();
    
    // 心跳检测 - 告诉服务器网页还活着
    const heartbeatInterval = setInterval(() => {
      fetch('http://localhost:3001/api/heartbeat').catch(() => {});
    }, 3000);
    
    return () => clearInterval(heartbeatInterval);
  }, [syncSessions]);

  useEffect(() => {
    if (!isInitialized) return;

    if (!currentSessionId && sessions.length === 0) {
      createNewSession();
    }
    if (!currentSessionId && sessions.length > 0) {
      switchSession(sessions[0].id);
    }
  }, [isInitialized, currentSessionId, sessions, createNewSession, switchSession]);

  // Note: apiConversationHistory is now loaded/saved per-session by the store
  // No need to manually clear it on session change
  const messagesEndRef = useRef(null);
  const sessionsListRef = useRef(null); // Ref for sessions list to scroll to selected session

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSaveSettings = (newSettings) => {
    // 清理 baseUrl 中的反引号
    if (newSettings.baseUrl) {
      newSettings.baseUrl = newSettings.baseUrl.replace(/`/g, '').trim();
    }
    console.log('Saving settings:', newSettings);
    setApiSettings(newSettings);
    localStorage.setItem('mc-ai-settings', JSON.stringify(newSettings));
    // Apply debug mode setting to agent
    setAgentDebugMode(newSettings.debugMode === true);

    // Note: generationMode in settings is the "default mode" for new sessions
    // It does NOT immediately change the current mode

    setIsSettingsOpen(false);
  };

  // Handle stop generation
  const handleStop = () => {
    // 检查是否有并发请求（abortControllerRef 可能是数组）
    if (abortControllerRef.current) {
      if (Array.isArray(abortControllerRef.current)) {
        // 并发请求：取消所有
        abortControllerRef.current.forEach(controller => {
          controller.abort();
        });
      } else {
        // 单次请求：取消单个
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = null;
    }
    
    // 清理并发生成状态
    const { clearConcurrentGeneration } = useStore.getState();
    clearConcurrentGeneration();
    
    setIsProcessing(false);
    setStreamingText('');
    // Restore user's last input
    if (lastInputRef.current) {
      setInputText(lastInputRef.current);
      lastInputRef.current = '';
    }
    // Remove the "Generating..." system message
    setMessages(p => p.filter(m =>
      typeof m.content !== 'string' ||
      (!m.content.startsWith('🔄') && !m.content.startsWith('🎨'))
    ));
    showToast(t('stopped'), 'info');
  };

  // Handle undo with stop - stops generation if in progress, then undoes
  const handleUndoWithStop = () => {
    // If AI is generating, stop it first
    if (isProcessing) {
      handleStop();
    }
    // Then perform undo
    undoChat();
  };

  /**
   * 生成单个变体（快速模式）
   */
  const generateVariantFast = async (userMessage, variantIndex, signal, currentCode = null, imageUrl = null) => {
    const variantId = `variant-${variantIndex}`;
    const { updateVariant, startStreamingSession, addBlocksFromStream } = useStore.getState();

    try {
      let content = '';

      // 调用 AI API
      const result = await fetchAIResponseStream(
        userMessage,
        apiSettings.apiKey,
        apiSettings.baseUrl,
        apiSettings.model,
        messages,
        (chunk) => {
          content += chunk;
          updateVariant(variantId, { content });
        },
        currentCode,
        imageUrl,
        apiConversationHistory
      );

      if (signal.aborted) {
        updateVariant(variantId, { status: 'error', error: '已取消' });
        return;
      }

      let finalCode = result.content || result;
      
      if (currentCode && (finalCode.includes('<<<LINES:') || finalCode.includes('<<<INSERT:') || finalCode.includes('<<<DELETE:'))) {
        try {
          finalCode = applyCodeEdit(currentCode, finalCode);
        } catch (editError) {
          console.error(`[Variant ${variantIndex}] Failed to apply edits:`, editError);
        }
      }

      const state = useStore.getState();
      const isFirstCompleted = !state.currentConcurrentGeneration?.variants?.some(v => v.status === 'done');
      
      let generatedBlocks = [];
      let generatedVoxels = [];
      let generatedCount = 0;
      
      if (isFirstCompleted) {
        startStreamingSession();
        generatedCount = addBlocksFromStream(finalCode);
        const newState = useStore.getState();
        generatedBlocks = [...newState.blocks];
        generatedVoxels = [...newState.semanticVoxels];
      } else {
        const { executeVoxelScript } = await import('./utils/sandbox.js');
        const { processVoxels } = await import('./utils/architectureEngine.js');
        const rawVoxels = executeVoxelScript(finalCode);
        
        const finalStateMap = new Map();
        rawVoxels.forEach(v => {
          const key = `${v.position[0]},${v.position[1]},${v.position[2]}`;
          finalStateMap.set(key, v);
        });
        
        const filteredVoxels = [];
        finalStateMap.forEach((v) => {
          if (v.type !== 'AIR') {
            filteredVoxels.push(v);
          }
        });
        
        generatedBlocks = processVoxels(filteredVoxels, 'DEFAULT');
        generatedVoxels = filteredVoxels;
        generatedCount = generatedBlocks.length;
      }

      let contentWithCodeBlock;
      const codeBlockMarker = '```';
      if (finalCode.includes(codeBlockMarker)) {
        contentWithCodeBlock = finalCode;
      } else {
        contentWithCodeBlock = codeBlockMarker + 'javascript\n' + finalCode + '\n' + codeBlockMarker;
      }
      
      updateVariant(variantId, {
        status: 'done',
        content: contentWithCodeBlock,
        blocks: generatedBlocks,
        semanticVoxels: generatedVoxels,
        generatedAt: Date.now()
      });

      console.log(`[Variant ${variantIndex}] Fast mode: Generated ${generatedCount} blocks`);

    } catch (error) {
      console.error(`[Variant ${variantIndex}] Failed:`, error);
      updateVariant(variantId, { status: 'error', error: error.message, generatedAt: Date.now() });
    }
  };

  /**
   * 生成单个变体（Agent 模式）
   */
  const generateVariantAgent = async (userMessage, variantIndex, signal, currentCode = null, imageUrl = null, effectiveMode = 'workflow') => {
    const variantId = `variant-${variantIndex}`;
    const { updateVariant, updateVariantAgentSteps, addBlocksFromStream } = useStore.getState();

    // 初始化 agentSteps
    updateVariantAgentSteps(variantId, [{
      id: 'init',
      label: `🚀 变体 ${variantIndex + 1} 初始化中...`,
      status: 'done'
    }]);

    try {
      const result = await agentGenerateV2(
        userMessage,
        apiSettings.apiKey,
        apiSettings.baseUrl,
        apiSettings.model,
        {
          onStatus: (msg) => {
            updateVariantAgentSteps(variantId, (prev) => {
              const last = prev[prev.length - 1];

              if (msg.startsWith('Skill:')) {
                const skillName = msg.replace('Skill:', '').trim();
                const skillLabel = getSkillLabelForVariant(skillName);
                if (last && last.status === 'running') {
                  return [...prev.slice(0, -1), { ...last, status: 'done' },
                    { id: `skill_${Date.now()}`, label: skillLabel, skillName, status: 'running' }];
                }
                return [...prev, { id: `skill_${Date.now()}`, label: skillLabel, skillName, status: 'running' }];
              }

              if (msg.startsWith('SkillDone:')) {
                if (last && last.status === 'running') {
                  return [...prev.slice(0, -1), { ...last, label: `${last.label} ✓`, status: 'done' }];
                }
              }

              if (msg.startsWith('SkillError:')) {
                if (last && last.status === 'running') {
                  return [...prev.slice(0, -1), { ...last, label: `${last.label} ⚠️`, status: 'error' }];
                }
              }

              if (msg.startsWith('Thinking:')) {
                const stepInfo = msg.replace('Thinking:', '').trim();
                const iterNum = stepInfo.replace(/Step\s*/i, '').trim();
                const thinkingId = `thinking_${iterNum}`;
                
                if (last && last.status === 'running' && !last.id.startsWith('thinking')) {
                  return [...prev.slice(0, -1), { ...last, status: 'done' },
                    { id: thinkingId, label: `🧠 思考中 (迭代 ${iterNum})`, status: 'running' }];
                }
                
                const existingThinking = prev.find(s => s.id === thinkingId);
                if (existingThinking) return prev;
                
                return [...prev, { id: thinkingId, label: `🧠 思考中 (迭代 ${iterNum})`, status: 'running' }];
              }

              return prev;
            });
          },
          onThinking: (iteration) => {
            // 已在 onStatus 中处理
          },
          onSkillStart: (skillName, args) => {
            // 已在 onStatus 中处理
          },
          onSkillDetail: (detail) => {
            updateVariantAgentSteps(variantId, (prev) => {
              const newSteps = [...prev];
              for (let i = newSteps.length - 1; i >= 0; i--) {
                const step = newSteps[i];
                if (step.skillName === detail.toolName || (step.status === 'running' && !step.skillName)) {
                  if (!step.details) step.details = [];
                  step.details.push(detail);
                  break;
                }
              }
              return newSteps;
            });
          },
          onDevLog: (log) => {
            // 捕获 AI 的思考内容
            if (log.type === 'ai' && log.content && log.iteration) {
              updateVariantAgentSteps(variantId, (prev) => {
                const newSteps = [...prev];
                // 找到对应迭代的思考步骤
                const thinkingId = `thinking_${log.iteration}`;
                const thinkingStep = newSteps.find(s => s.id === thinkingId);
                if (thinkingStep) {
                  thinkingStep.aiThinking = log.content;
                } else {
                  // 如果还没有思考步骤，找最后一个 running 的步骤
                  const lastRunning = newSteps.findLast(s => s.status === 'running');
                  if (lastRunning) {
                    lastRunning.aiThinking = log.content;
                  }
                }
                return newSteps;
              });
            }
          }
        },
        currentCode,
        imageUrl,
        signal,
        apiConversationHistory,
        {
          generationMode: effectiveMode,
          agentTools: apiSettings.agentTools,
          agentWorkflow: apiSettings.agentWorkflow,
          agentSystemPrompt: apiSettings.agentSystemPrompt,
          customSkills: apiSettings.customSkills || [],
          customScripts: apiSettings.customScripts || [],
          maxTokens: apiSettings.maxTokens,
          officialSkillOverrides: apiSettings.officialSkillOverrides || {},
          officialScriptOverrides: apiSettings.officialScriptOverrides || {},
        }
      );

      if (signal.aborted) {
        updateVariant(variantId, { status: 'error', error: '已取消' });
        return;
      }

      // 标记所有步骤完成
      updateVariantAgentSteps(variantId, (prev) => 
        prev.map(s => s.status === 'running' ? { ...s, status: 'done' } : s)
      );

      const finalCode = result.code || '';
      
      // 执行代码获取方块
      const { executeVoxelScript } = await import('./utils/sandbox.js');
      const { processVoxels } = await import('./utils/architectureEngine.js');
      const rawVoxels = executeVoxelScript(finalCode);
      
      const finalStateMap = new Map();
      rawVoxels.forEach(v => {
        const key = `${v.position[0]},${v.position[1]},${v.position[2]}`;
        finalStateMap.set(key, v);
      });
      
      const filteredVoxels = [];
      finalStateMap.forEach((v) => {
        if (v.type !== 'AIR') {
          filteredVoxels.push(v);
        }
      });
      
      const generatedBlocks = processVoxels(filteredVoxels, 'DEFAULT');

      let contentWithCodeBlock;
      const codeBlockMarker = '```';
      if (finalCode.includes(codeBlockMarker)) {
        contentWithCodeBlock = finalCode;
      } else {
        contentWithCodeBlock = codeBlockMarker + 'javascript\n' + finalCode + '\n' + codeBlockMarker;
      }

      // 添加 AI 的总结文本
      const summary = result.summary || '';
      const fullContent = summary ? `${summary}\n\n${contentWithCodeBlock}` : contentWithCodeBlock;
      
      updateVariant(variantId, {
        status: 'done',
        content: fullContent,
        blocks: generatedBlocks,
        semanticVoxels: filteredVoxels,
        generatedAt: Date.now()
      });

      console.log(`[Variant ${variantIndex}] Agent mode: Generated ${generatedBlocks.length} blocks`);

    } catch (error) {
      console.error(`[Variant ${variantIndex}] Agent mode failed:`, error);
      updateVariantAgentSteps(variantId, (prev) => {
        const newSteps = [...prev];
        if (newSteps.length > 0) {
          newSteps[newSteps.length - 1].status = 'error';
        }
        return newSteps;
      });
      updateVariant(variantId, { status: 'error', error: error.message, generatedAt: Date.now() });
    }
  };

  // Helper: 获取技能标签
  const getSkillLabelForVariant = (skillName) => {
    const labels = {
      'read_skill': '📖 读取技能文档',
      'read_subdoc': '📑 读取子文档',
      'run_script': '⚙️ 运行脚本',
      'generate_code': '📝 生成代码',
      'modify_code': '✏️ 修改代码',
      'complete': '🎉 完成构建'
    };
    return labels[skillName] || `🔧 ${skillName}`;
  };

  /**
   * 生成单个变体（根据模式选择）
   */
  const generateVariant = async (userMessage, variantIndex, signal, currentCode = null, imageUrl = null, effectiveMode = 'fast') => {
    if (effectiveMode === 'workflow' || effectiveMode === 'agentSkills') {
      return generateVariantAgent(userMessage, variantIndex, signal, currentCode, imageUrl, effectiveMode);
    } else {
      return generateVariantFast(userMessage, variantIndex, signal, currentCode, imageUrl);
    }
  };

  /**
   * 处理变体切换
   * @param {string} messageId - 消息 ID
   * @param {number} newIndex - 新的变体索引
   */
  const handleVariantSwitch = (messageId, newIndex) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.variants) return;

    const variant = message.variants[newIndex];
    if (!variant || variant.status !== 'done') return;

    // 更新消息的 activeVariantIndex 和 content
    setMessages(msgs => msgs.map(m =>
      m.id === messageId
        ? { ...m, activeVariantIndex: newIndex, content: variant.content }
        : m
    ));

    // 更新 3D 场景
    setBlocks(variant.blocks);
    setSemanticVoxels(variant.semanticVoxels);
    
    // 从 variant.content 中提取代码并更新 lastGeneratedCode
    // 这样下次生成时会基于当前选中的变体
    try {
      const codeMatch = variant.content.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        setLastGeneratedCode(codeMatch[1].trim());
        console.log(`[VariantSwitch] Updated lastGeneratedCode from variant ${newIndex}`);
      } else {
        // 如果没有代码块，可能整个 content 就是代码
        // 或者使用 variant.content 作为代码
        setLastGeneratedCode(variant.content);
        console.log(`[VariantSwitch] Updated lastGeneratedCode (no code block found)`);
      }
    } catch (error) {
      console.error('[VariantSwitch] Failed to extract code:', error);
    }
  };

  const handleSend = async (overridePrompt = null, imageUrl = null) => {
    // FIX: If handleSend is called from onClick, overridePrompt will be the Event object.
    // We must act as if it is null in that case.
    const actualPrompt = (typeof overridePrompt === 'string') ? overridePrompt : null;

    // Check if we have anything to send (text, override prompt, passed image, or attached images)
    const hasContent = (inputText.trim()) || actualPrompt || imageUrl || attachedImages.length > 0;
    if (!hasContent || isProcessing) return;

    const userMessage = actualPrompt || inputText.trim();

    // Save user input for potential restore on stop
    if (!actualPrompt) {
      lastInputRef.current = inputText.trim();
      setInputText('');
      setAttachedImages([]); // Clear attached images after sending
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    setIsProcessing(true);
    setStreamingText('');

    // IMMEDIATELY push snapshot when user sends message
    // This truncates future history and creates a checkpoint BEFORE any changes
    // Capture the "before" state for the first snapshot
    const beforeState = chatSnapshots.length === 0 ? {
      messages: [...messages],
      blocks: [...blocks],
      semanticVoxels: useStore.getState().semanticVoxels || []
    } : null;
    
    // NOTE: We no longer push snapshot here - only truncate future history
    // The actual snapshot will be pushed AFTER generation completes
    // This prevents double-snapshot issues when undoing/redoing
    if (chatSnapshots.length > 0 && snapshotIndex < chatSnapshots.length - 1) {
      // User is at an earlier position, truncate future history
      // This is handled inside pushChatSnapshot, but we need to ensure
      // the truncation happens before any state changes
      console.log('[handleSend] Will truncate future history on next pushChatSnapshot');
    }

    // Update Chat UI immediately
    if (!imageUrl) {
      const newMsg = { role: 'user', content: userMessage };
      if (attachedImages.length > 0) {
        newMsg.imageUrls = attachedImages; // Store as array
        newMsg.imageUrl = attachedImages[0]; // Keep first one for backward compatibility
      }
      setMessages(p => [...p, newMsg]);
    }

    // ============ 并发生成逻辑 ============
    // 注意：创意模式（Visual Mode）不使用并发生成
    const concurrencyCount = apiSettings.concurrencyCount || 1;
    
    // 确定实际使用的生成模式
    const effectiveMode = generationMode;
    const isAgentMode = effectiveMode === 'workflow' || effectiveMode === 'agentSkills';
    
    // 创意模式跳过并发生成逻辑
    const shouldUseConcurrent = concurrencyCount > 1 && !isVisualMode;
    
    // 并发数为 1 或创意模式：完全保持现有逻辑
    if (!shouldUseConcurrent) {
      // 继续执行现有的单次生成逻辑（下面的代码）
    } else {
      // 并发数 > 1：执行并发生成流程
      console.log(`[Concurrent] Starting ${concurrencyCount} concurrent generations, mode: ${effectiveMode}`);
      
      const messageId = `msg-${Date.now()}`;
      const { startConcurrentGeneration, finalizeConcurrentGeneration } = useStore.getState();
      
      // 添加一个占位的 AI 消息，用于后续更新
      const aiMessage = {
        id: messageId,
        role: 'ai',
        content: '生成中...',
        variants: [],
        concurrencyCount,
        generationMode: effectiveMode // 保存生成模式
      };
      setMessages(p => [...p, aiMessage]);
      
      // 初始化并发生成状态（传递模式）
      startConcurrentGeneration(messageId, concurrencyCount, effectiveMode);
      
      // Agent 模式：初始化工作流程动画显示
      if (isAgentMode) {
        setIsWorkflowCollapsed(false);
      }
      
      // 创建多个 AbortController
      const abortControllers = Array(concurrencyCount).fill(null)
        .map(() => new AbortController());
      
      // 保存到 ref（用于停止功能）
      abortControllerRef.current = abortControllers;
      
      // 获取当前代码（用于修改）
      const currentCode = lastGeneratedCode;
      const activeImageUrl = imageUrl || (attachedImages.length > 0 ? attachedImages[0] : null);
      
      // 并行发起 API 请求（传递生成模式）
      const promises = Array(concurrencyCount).fill(null).map((_, index) => {
        return generateVariant(
          userMessage,
          index,
          abortControllers[index].signal,
          currentCode,
          activeImageUrl,
          effectiveMode // 传递生成模式
        );
      });
      
      // 等待所有请求完成（或失败）
      await Promise.allSettled(promises);
      
      // 完成并发生成（同时清理之前消息的 variants）
      finalizeConcurrentGeneration();
      
      // Agent 模式完成后折叠工作流程
      if (isAgentMode) {
        setIsWorkflowCollapsed(true);
      }
      
      // 等待一个微任务，确保 store 更新完成
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // 保存快照（此时之前消息的 variants 已经被清理）
      pushChatSnapshot();
      
      setIsProcessing(false);
      abortControllerRef.current = null;
      
      return; // 提前返回，不执行下面的单次生成逻辑
    }

    // VISUAL MODE FLOW: If logic is Visual Mode AND we don't have an image yet
    if (isVisualMode && !imageUrl && !actualPrompt && attachedImages.length === 0) {
      // DEBUG LOGGING START
      if (apiSettings.debugMode) {
        setDevLogs(p => [...p, { type: 'user', content: userMessage }]);
      }

      setMessages(p => [...p, { role: 'system', content: '🎨 Generating Concept Art...' }]);

      try {
        // Optimize Prompt for Voxel Structure Generation
        const optimizedPrompt = `Minecraft voxel style, isometric view of ${userMessage}. Pure white background, single isolated object, no terrain, no clouds, no text, cut out, high resolution`;

        // 强制使用即梦AI配置
        const imageProvider = 'jimeng';
        const jimengConfig = {
          accessKeyId: 'AKLTODdiN2IyNDEzMzg4NGI0YjgwOTAxNTVhMDk1ODQwY2Q',
          secretAccessKey: 'WVRVNE1HUTFOR0ZpWlRnMk5HTXpPRGszT0dReE5HVXdNemM1TkRNNFpUaw=='
        };
        
        console.log('[Image Gen] Provider:', imageProvider);
        console.log('[Image Gen] AccessKeyId:', jimengConfig.accessKeyId.substring(0, 20) + '...');
        
        // Log the internal prompt usage
        if (apiSettings.debugMode) {
          setDevLogs(p => [...p, {
            type: 'tool_call',
            name: 'jimeng-ai',
            args: { prompt: optimizedPrompt, provider: imageProvider }
          }]);
        }
        
        const generatedUrl = await generateImage(
          optimizedPrompt,
          apiSettings.apiKey,
          apiSettings.baseUrl,
          apiSettings.imageModel || 'dall-e-3',
          imageProvider,
          jimengConfig
        );

        // Log result
        if (apiSettings.debugMode) {
          setDevLogs(p => [...p, {
            type: 'tool_result',
            name: 'jimeng-ai',
            result: { success: true, url: generatedUrl }
          }]);
        }

        // 检查是否是即梦AI控制台链接（查询接口不可用时返回）
        const isJimengConsoleLink = generatedUrl.includes('console.volcengine.com');

        // Add Assistant Message with Image and "Build" Action
        setMessages(p => {
          const clean = p.filter(m => (typeof m.content === 'string' && !m.content.startsWith('🎨')) || Array.isArray(m.content));
          
          if (isJimengConsoleLink) {
            // 即梦AI控制台链接 - 显示特殊消息
            return [...clean, {
              role: 'ai',
              content: `✅ 图片生成任务已提交到即梦AI！\n\n由于即梦AI 4.0 查询接口限制，请前往控制台查看生成的图片：\n${generatedUrl}\n\n任务ID: ${generatedUrl.includes('task_id') ? '见控制台' : '已提交'}`,
              originalPrompt: userMessage
            }];
          } else {
            // 正常图片URL - 显示图片
            return [...clean, {
              role: 'ai',
              content: `Here is a concept for "${userMessage}". Click build to construct it.`,
              imageUrl: generatedUrl,
              originalPrompt: userMessage
            }];
          }
        });

        // Store the image URL for future modifications (如果不是控制台链接)
        if (!isJimengConsoleLink) {
          setReferenceImageUrl(generatedUrl);
        }

        // Save snapshot AFTER successful image generation (captures AI response + generated content)
        pushChatSnapshot();
      } catch (e) {
        if (apiSettings.debugMode) {
          setDevLogs(p => [...p, { type: 'error', content: `Image Generation Failed: ${e.message}` }]);
        }
        setMessages(p => [...p.filter(m => typeof m.content === 'string' && !m.content.startsWith('🎨')), { role: 'system', content: `❌ Image Gen Error: ${e.message}` }]);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // ============ API KEY VALIDATION ============
    // Check if API key is configured before proceeding with code generation
    if (!apiSettings.apiKey || apiSettings.apiKey.trim() === '') {
      setMessages(p => [...p, { 
        role: 'system', 
        content: '❌ API Key 未配置！请点击右上角的设置按钮 ⚙️ 配置你的 API Key。\n\n支持 OpenAI、DeepSeek、硅基流动等兼容 OpenAI 格式的 API。' 
      }]);
      setIsProcessing(false);
      return;
    }

    // Helper function to convert skill names to readable labels
    // Shows both the skill name and a description
    const getSkillLabel = (skillName) => {
      const labels = {
        // V1 Agent Skills (Function Calling)
        'search_style_knowledge': { icon: '📚', desc: 'Searching Knowledge Base' },
        'list_available_styles': { icon: '📋', desc: 'Listing Available Styles' },
        'plan_structure': { icon: '📐', desc: 'Planning Blueprint' },
        'view_current_code': { icon: '👁️', desc: 'Viewing Current Code' },
        'analyze_structure': { icon: '🔍', desc: 'Analyzing Structure' },
        'generate_full_code': { icon: '📝', desc: 'Generating Code' },
        'modify_code': { icon: '✏️', desc: 'Modifying Code' },
        'add_component': { icon: '🧩', desc: 'Adding Component' },
        'validate_code': { icon: '✅', desc: 'Validating Code' },
        'refine_code': { icon: '🔍', desc: 'Refining Quality' },
        'check_structural_integrity': { icon: '🏗️', desc: 'Checking Integrity' },
        'add_vegetation': { icon: '🌿', desc: 'Adding Vegetation' },
        'add_interior': { icon: '🛋️', desc: 'Adding Interior' },
        'finalize_build': { icon: '🎉', desc: 'Finalizing Build' },
        // V2 Agent Skills (Anthropic Document-Driven)
        'read_skill': { icon: '📖', desc: 'Reading Main Skill' },
        'read_subdoc': { icon: '📑', desc: 'Reading Sub-Document' },
        'run_script': { icon: '⚙️', desc: 'Running Script' },
        'generate_code': { icon: '📝', desc: 'Generating Code' },
        'complete': { icon: '🎉', desc: 'Completing Build' }
      };
      const info = labels[skillName];
      if (info) {
        return `${info.icon} ${info.desc} (${skillName})`;
      }
      return `🔧 ${skillName}`;
    };

    // CODE GEN FLOW (Direct or after Image confirmation)
    setMessages(p => [...p, { role: 'system', content: '🔄 Generating Structure...' }]);

    try {
      startStreamingSession();
      let content = '';
      let generatedCount = 0; // Fix scope issue: Define here so it's accessible everywhere
      let effectiveMode = generationMode; // Track actual mode used (may change for modifications)

      // Extract the last AI response containing code using FRESH store state
      const freshMessages = useStore.getState().currentMessages;

      // 1. Prioritize explicitly stored code from last generation (handles Agent V2 summary cases)
      let currentCode = lastGeneratedCode;

      // 2. If not found, search message history (Legacy/Direct mode fallback)
      if (!currentCode) {
        // Find last AI message that contains code (either in text or in tool arguments)
        const lastCodeMessage = [...freshMessages].reverse().find(m => {
          if (m.role !== 'ai') return false;
          // Check text content
          if (typeof m.content === 'string' && m.content.includes('builder.')) return true;
          // Check V2 Agent Tool Calls
          if (m.tool_calls && Array.isArray(m.tool_calls)) {
            return m.tool_calls.some(tc =>
              (tc.function?.name === 'complete' || tc.function?.name === 'generate_code') &&
              tc.function?.arguments &&
              (typeof tc.function.arguments === 'string' ? tc.function.arguments.includes('builder.') : tc.function.arguments.code)
            );
          }
          return false;
        });

        if (lastCodeMessage) {
          if (typeof lastCodeMessage.content === 'string' && lastCodeMessage.content.includes('builder.')) {
            currentCode = lastCodeMessage.content;
          } else if (lastCodeMessage.tool_calls) {
            const codeTool = lastCodeMessage.tool_calls.find(tc =>
              (tc.function?.name === 'complete' || tc.function?.name === 'generate_code')
            );
            if (codeTool) {
              let args = codeTool.function.arguments;
              if (typeof args === 'string') {
                try { args = JSON.parse(args); } catch (e) { }
              }
              if (args && args.code) currentCode = args.code;
            }
          }
        }
      }

      if (apiSettings.apiKey) {
        // Use the passed imageUrl, attached images, or fall back to the stored reference image
        const activeImageUrls = imageUrl ? [imageUrl] : (attachedImages.length > 0 ? attachedImages : (referenceImageUrl ? [referenceImageUrl] : []));
        const activeImageUrl = activeImageUrls[0] || null; // Primary image for backward compatibility

        // Use the new generationMode state (not apiSettings)
        // For modifications, auto-switch to fast mode (if enabled in settings)
        effectiveMode = generationMode; // Reset to UI selection
        if (currentCode && generationMode === 'agent' && apiSettings.autoFastModify !== false) {
          effectiveMode = 'fast';
          showToast('⚡ 修改模式: 自动切换到快速模式以节省Token', 'info');
          console.log('[App] Auto-switched to fast mode for modification (has existing code)');
        }

        console.log('[App] Generation Mode:', {
          uiMode: generationMode,
          effectiveMode,
          hasCurrentCode: !!currentCode,
          hasImageUrl: !!activeImageUrl
        });

        if (effectiveMode === 'precise') {
          // ============ PRECISE GENERATION (Two-Step with Planning) ============
          setAgentSteps([{ id: 'init', label: 'Initializing AI Architect...', status: 'done' }]);

          // Dev Console: Log Precise mode start
          if (apiSettings.debugMode) {
            setDevLogs(prev => [...prev, { type: 'user', content: userMessage }]);
            if (currentCode) {
              setDevLogs(prev => [...prev, { type: 'info', content: `📝 Modifying existing code (${currentCode.length} chars)` }]);
            }
          }

          // Note: We don't add "Planning" status message to main chat anymore, 
          // the big Agent Card will handle the UI.

          const result = await generatePreciseBuild(
            userMessage,
            apiSettings.apiKey,
            apiSettings.baseUrl,
            apiSettings.model,
            {
              onPlanStart: () => {
                setAgentSteps(prev => [...prev, { id: 'plan', label: 'Drafting Architectural Blueprint', status: 'running' }]);
                if (apiSettings.debugMode) {
                  setDevLogs(prev => [...prev, { type: 'info', content: '📐 Planning phase started...' }]);
                }
              },
              onPlanReady: (plan) => {
                // Mark plan done
                setAgentSteps(prev => prev.map(s => s.id === 'plan' ? { ...s, status: 'done' } : s));
                // Store blueprint for display inside the Agent Workflow card
                setCurrentBlueprint({
                  style: plan.style,
                  dimensions: `${plan.size.width}x${plan.size.depth}x${plan.size.height}`
                });
                if (apiSettings.debugMode) {
                  setDevLogs(prev => [...prev, {
                    type: 'tool_result',
                    name: 'Blueprint',
                    result: {
                      name: plan.buildingName,
                      style: plan.style,
                      size: plan.size,
                      materials: plan.materials
                    }
                  }]);
                }
              },
              onBuildStart: () => {
                setAgentSteps(prev => [...prev, { id: 'code', label: 'Generating Voxel Code', status: 'running' }]);
                if (apiSettings.debugMode) {
                  setDevLogs(prev => [...prev, { type: 'info', content: '🔨 Code generation started...' }]);
                }
              },
              onStatus: (msg) => {
                // Dev Console: Log status updates
                if (apiSettings.debugMode) {
                  setDevLogs(prev => [...prev, { type: 'info', content: msg }]);
                }

                // Intelligent Step Management based on string content
                setAgentSteps(prev => {
                  const last = prev[prev.length - 1];

                  // 1. Detection: Phase 3 Refinement (after code generation)
                  if (msg.includes('Phase 3') || msg.includes('Refining details')) {
                    if (last.id === 'code') return [...prev.slice(0, -1), { ...last, status: 'done' }, { id: 'refine', label: 'Refining Details & Quality Check', status: 'running' }];
                  }

                  // 2. Detection: Refinement results
                  if (msg.includes('Refinement complete')) {
                    return prev.map(s => s.id === 'refine' ? { ...s, status: 'done' } : s);
                  }
                  if (msg.includes('no changes needed') || msg.includes('quality verified')) {
                    return prev.map(s => s.id === 'refine' ? { ...s, label: 'Quality Verified ✓', status: 'done' } : s);
                  }
                  if (msg.includes('Refinement skipped')) {
                    return prev.map(s => s.id === 'refine' ? { ...s, label: 'Refinement Skipped', status: 'done' } : s);
                  }

                  // 3. Detection: Validation (now AFTER refinement)
                  if (msg.includes('Validating')) {
                    if (last.id === 'refine') return [...prev.slice(0, -1), { ...last, status: 'done' }, { id: 'validate', label: 'Verifying in Sandbox Environment', status: 'running' }];
                    if (last.id === 'code') return [...prev.slice(0, -1), { ...last, status: 'done' }, { id: 'validate', label: 'Verifying in Sandbox Environment', status: 'running' }];
                    if (last.id === 'fix') return [...prev.slice(0, -1), { ...last, status: 'done' }, { id: 'validate_fix', label: 'Re-verifying Logic', status: 'running' }];
                  }

                  // 4. Detection: Validation passed
                  if (msg.includes('Validation passed')) {
                    return prev.map(s => s.id === 'validate' || s.id === 'validate_fix' ? { ...s, label: msg, status: 'done' } : s);
                  }

                  // 5. Detection: Auto-fixing
                  if (msg.includes('Error detected') || msg.includes('Fixing')) {
                    const errorMsg = msg.split('(')[1]?.split(')')[0] || 'Logic Error';
                    const newSteps = [...prev];
                    // Fail the running step
                    newSteps[newSteps.length - 1].status = 'error';
                    newSteps[newSteps.length - 1].label += ` (${errorMsg})`;
                    // Add fix step
                    newSteps.push({ id: 'fix', label: 'Auto-Correcting Code...', status: 'running' });
                    return newSteps;
                  }

                  // 5. Detection: Success
                  if (msg.includes('verified') || msg.includes('complete')) {
                    return prev.map(s => s.status === 'running' ? { ...s, status: 'done' } : s);
                  }

                  // 6. Detection: Edit/Patch
                  if (msg.includes('Applying incremental')) {
                    return [...prev, { id: 'patch', label: 'Applying Incremental Patch', status: 'running' }];
                  }

                  return prev;
                });
              },
              onChunk: (chunk) => {
                content += chunk;
                // If we are streaming code, ensure 'code' step is running if exists
                setStreamingText(content);
              },
              onError: (phase, error) => {
                setAgentSteps(prev => {
                  const newSteps = [...prev];
                  if (newSteps.length > 0) newSteps[newSteps.length - 1].status = 'error';
                  return newSteps;
                });
                setMessages(p => [...p, { role: 'system', content: `❌ Error: ${error.message}` }]);
                if (apiSettings.debugMode) {
                  setDevLogs(prev => [...prev, { type: 'error', content: `${phase}: ${error.message}` }]);
                }
              }
            },
            currentCode,
            activeImageUrl
          );

          if (!result || !result.code) throw new Error("Precise generation failed to produce code.");
          if (!content) content = result.code;

          // Dev Console: Log final code
          if (apiSettings.debugMode) {
            setDevLogs(prev => [...prev, { type: 'ai', content: content }]);
          }

          // Final Cleanup: Ensure all steps are done
          setAgentSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'done' } : s));

          // Auto-switch to fast mode after first generation
          setGenerationMode('fast');
          console.log('[App] Auto-switched to fast mode after Precise generation');

        } else if (effectiveMode === 'agent' || effectiveMode === 'workflow' || effectiveMode === 'agentSkills') {
          // ============ AGENT MODE / 极致模式 (Always V2) ============
          const isV2 = true; // 极致模式固定使用 V2
          setIsWorkflowCollapsed(false); // Auto expand when starting new task
          setAgentSteps([{
            id: 'init',
            label: '🚀 Initializing Ultimate Mode (Agent V2)...',
            status: 'done'
          }]);

          // Always use Agent V2 for Ultimate mode
          const agentFn = agentGenerateV2;

          // If debug mode is enabled, add section marker and open the console
          if (apiSettings.debugMode) {
            console.log('[App] Debug Mode is ON');
            setDevLogs(prev => [...prev, { type: 'user', content: userMessage }]);
          } else {
            console.log('[App] Debug Mode is OFF');
          }

          const result = await agentFn(
            userMessage,
            apiSettings.apiKey,
            apiSettings.baseUrl,
            apiSettings.model,
            {
              onStatus: (msg) => {
                setAgentSteps(prev => {
                  const last = prev[prev.length - 1];

                  // Skill started
                  if (msg.startsWith('Skill:')) {
                    const skillName = msg.replace('Skill:', '').trim();
                    const skillLabel = getSkillLabel(skillName);
                    // Show both skill name and description
                    const displayLabel = `${skillLabel}`;
                    const skillInfo = { skillName }; // Store skill name for later
                    // Complete previous step if running
                    if (last && last.status === 'running') {
                      return [...prev.slice(0, -1), { ...last, status: 'done' },
                      { id: `skill_${Date.now()}`, label: displayLabel, skillName, status: 'running' }];
                    }
                    return [...prev, { id: `skill_${Date.now()}`, label: displayLabel, skillName, status: 'running' }];
                  }

                  // Skill completed successfully
                  if (msg.startsWith('SkillDone:')) {
                    const info = msg.replace('SkillDone:', '').trim();
                    if (last && last.status === 'running') {
                      return [...prev.slice(0, -1), { ...last, label: `${last.label} ✓`, status: 'done' }];
                    }
                  }

                  // Skill error
                  if (msg.startsWith('SkillError:')) {
                    const errorInfo = msg.replace('SkillError:', '').trim();
                    if (last && last.status === 'running') {
                      return [...prev.slice(0, -1), { ...last, label: `${last.label} ⚠️`, status: 'error' }];
                    }
                  }

                  // Thinking step
                  if (msg.startsWith('Thinking:')) {
                    const stepInfo = msg.replace('Thinking:', '').trim();
                    const iterNum = stepInfo.replace(/Step\s*/i, '').trim();
                    const thinkingId = `thinking_${iterNum}`;

                    // Complete previous running step if any
                    if (last && last.status === 'running' && !last.id.startsWith('thinking')) {
                      return [...prev.slice(0, -1), { ...last, status: 'done' },
                      { id: thinkingId, label: `🧠 思考中 (迭代 ${iterNum})`, status: 'running' }];
                    }

                    // Check if we already have this thinking step
                    const existingThinking = prev.find(s => s.id === thinkingId);
                    if (existingThinking) {
                      return prev; // Already have this step
                    }

                    // Add new thinking step
                    return [...prev, { id: thinkingId, label: `🧠 思考中 (迭代 ${iterNum})`, status: 'running' }];
                  }

                  // Build complete
                  if (msg.includes('complete')) {
                    return prev.map(s => s.status === 'running' ? { ...s, status: 'done' } : s);
                  }

                  return prev;
                });
              },
              onSkillDetail: (detail) => {
                setAgentSteps(prev => {
                  // Find the step this detail belongs to
                  const newSteps = [...prev];
                  // Find the most recent step with matching toolName or the last running step
                  for (let i = newSteps.length - 1; i >= 0; i--) {
                    const step = newSteps[i];
                    if (step.skillName === detail.toolName || (step.status === 'running' && !step.skillName)) {
                      if (!step.details) step.details = [];
                      step.details.push(detail);
                      break;
                    }
                  }
                  return newSteps;
                });
              },
              onChunk: (chunk) => {
                content = chunk;
                setStreamingText(content);
              },
              onError: (phase, error) => {
                setAgentSteps(prev => {
                  const newSteps = [...prev];
                  if (newSteps.length > 0) newSteps[newSteps.length - 1].status = 'error';
                  return newSteps;
                });
                setMessages(p => [...p, { role: 'system', content: `❌ Agent Error: ${error.message}` }]);
                // Also log to dev console
                setDevLogs(prev => [...prev, { type: 'error', content: `${phase}: ${error.message}` }]);
              },
              // Dev Console logging callback - Always provide function, check mode inside
              onDevLog: (log) => {
                // If we receive a log, it means the agent wants to tell us something
                // Log to dev console if debug mode is enabled
                if (apiSettings.debugMode) {
                  setDevLogs(prev => {
                    // Handle streaming logs - merge consecutive stream logs
                    if (log.type === 'stream') {
                      // Find and update existing stream log, or add new one
                      const lastIdx = prev.length - 1;
                      if (lastIdx >= 0 && prev[lastIdx].type === 'stream') {
                        // Update existing stream log with accumulated content
                        const updated = [...prev];
                        updated[lastIdx] = { ...updated[lastIdx], content: log.accumulated || log.content };
                        return updated;
                      }
                      return [...prev, { type: 'stream', content: log.content }];
                    }
                    
                    // Handle tool argument streaming - merge into single log
                    if (log.type === 'stream_tool_args') {
                      const lastIdx = prev.length - 1;
                      if (lastIdx >= 0 && prev[lastIdx].type === 'stream_tool_args' && prev[lastIdx].name === log.name) {
                        const updated = [...prev];
                        updated[lastIdx] = { 
                          ...updated[lastIdx], 
                          content: (updated[lastIdx].content || '') + log.argsDelta 
                        };
                        return updated;
                      }
                      return [...prev, { type: 'stream_tool_args', name: log.name, content: log.argsDelta }];
                    }
                    
                    // Handle tool start - just add it
                    if (log.type === 'stream_tool_start') {
                      return [...prev, { type: 'stream_tool_start', name: log.name, content: `🔧 Starting tool: ${log.name}` }];
                    }
                    
                    // For other log types, just append
                    return [...prev, log];
                  });
                }
              }
            },
            currentCode,
            activeImageUrl,
            abortControllerRef.current?.signal, // Pass AbortSignal for stop functionality
            isV2 ? apiConversationHistory : null, // Pass conversation history for V2 only
            // Pass agent configuration from settings
            {
              generationMode: generationMode, // Add generation mode for Agent Skills mode detection
              agentTools: apiSettings.agentTools,
              agentWorkflow: apiSettings.agentWorkflow,
              agentSystemPrompt: apiSettings.agentSystemPrompt,
              customSkills: apiSettings.customSkills || [],
              customScripts: apiSettings.customScripts || [],
              officialSkillOverrides: apiSettings.officialSkillOverrides || {},
              officialScriptOverrides: apiSettings.officialScriptOverrides || {},
              maxTokens: apiSettings.maxTokens || 16384
            }
          );

          if (!result || !result.code) throw new Error("Agent generation failed to produce code.");
          content = result.code;
          setLastGeneratedCode(content); // Save for "View Script" button

          // Update conversation history if returned (V2 only)
          if (isV2 && result.messages) {
            setApiConversationHistory(result.messages);
            console.log('[App] Updated API conversation history:', result.messages.length, 'messages');
          }

          // Final Cleanup
          setAgentSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'done' } : s));
          setIsWorkflowCollapsed(true); // Auto collapse on completion

          // Auto-switch to fast mode after first generation
          setGenerationMode('fast');
          console.log('[App] Auto-switched to fast mode after Ultimate generation');

        } else {
          // ============ FAST GENERATION (Direct) ============
          // Dev Console: Log Fast mode start
          if (apiSettings.debugMode) {
            setDevLogs(prev => [...prev, { type: 'user', content: userMessage }]);
            if (currentCode) {
              setDevLogs(prev => [...prev, { type: 'info', content: `📝 Modifying existing code (${currentCode.length} chars)` }]);
            }
            if (apiConversationHistory?.length > 0) {
              setDevLogs(prev => [...prev, { type: 'info', content: `💬 Using ${apiConversationHistory.length} messages from conversation history` }]);
            }
          }

          // Now with API conversation history support for better context
          const result = await fetchAIResponseStream(
            userMessage,
            apiSettings.apiKey,
            apiSettings.baseUrl,
            apiSettings.model,
            messages, // Fallback UI history
            (chunk) => {
              content += chunk;
              setStreamingText(content);
              // Dev Console: Stream AI response
              if (apiSettings.debugMode && content.length < 5000) {
                // Don't update too frequently for performance
                if (content.length % 500 < 50) {
                  setDevLogs(prev => {
                    const filtered = prev.filter(l => l.type !== 'ai_streaming');
                    return [...filtered, { type: 'ai_streaming', content: content }];
                  });
                }
              }
            },
            currentCode, // Pass existing code for context
            activeImageUrl, // Pass Image URL for Vision models
            apiConversationHistory // Pass API conversation history
          );

          // Handle new return format: { content, messages }
          content = result.content || result; // Backward compatibility

          // Update API conversation history if returned
          if (result.messages) {
            setApiConversationHistory(result.messages);
            console.log('[App] Updated API conversation history (Fast Mode):', result.messages.length, 'messages');
          }

          // Check if code was truncated and auto-continue (with retry limit)
          let continueAttempts = 0;
          const MAX_CONTINUE_ATTEMPTS = 3;
          let currentHistory = result.messages;
          
          while (result.truncated && continueAttempts < MAX_CONTINUE_ATTEMPTS) {
            continueAttempts++;
            console.log(`[App] Code appears truncated, requesting continuation (attempt ${continueAttempts}/${MAX_CONTINUE_ATTEMPTS})...`);
            if (apiSettings.debugMode) {
              setDevLogs(prev => [...prev, { type: 'warning', content: `⚠️ 代码被截断，正在请求继续生成 (${continueAttempts}/${MAX_CONTINUE_ATTEMPTS})...` }]);
            }
            setStreamingText(content + '\n\n// 🔄 继续生成中...');
            
            // Get last lines for context
            const lastLines = content.split('\n').slice(-8).join('\n');
            
            // Request continuation with the updated history
            const continueResult = await fetchAIResponseStream(
              `你的代码被截断了，请从以下位置继续生成（不要重复已有的代码，直接从断点继续）：\n\`\`\`\n${lastLines}\n\`\`\`\n请直接继续输出剩余的代码，不需要任何解释。`,
              apiSettings.apiKey,
              apiSettings.baseUrl,
              apiSettings.model,
              messages,
              (chunk) => {
                content += chunk;
                setStreamingText(content);
              },
              null, // Don't pass currentCode for continuation
              null, // No image for continuation
              currentHistory // Use updated conversation history
            );
            
            // Merge the continuation
            const continuation = continueResult.content || continueResult;
            content = content + '\n' + continuation;
            
            // Update history for next iteration
            if (continueResult.messages) {
              currentHistory = continueResult.messages;
              setApiConversationHistory(continueResult.messages);
            }
            
            // Check if still truncated
            result.truncated = continueResult.truncated;
            
            console.log(`[App] Continuation ${continueAttempts} received, total length: ${content.length}, still truncated: ${result.truncated}`);
          }
          
          if (continueAttempts > 0) {
            console.log(`[App] Continuation complete after ${continueAttempts} attempts, final length: ${content.length}`);
            if (apiSettings.debugMode) {
              setDevLogs(prev => [...prev, { type: 'info', content: `✅ 代码续写完成，共 ${continueAttempts} 次续写` }]);
            }
          }

          // Dev Console: Log final AI response
          if (apiSettings.debugMode) {
            setDevLogs(prev => {
              const filtered = prev.filter(l => l.type !== 'ai_streaming');
              return [...filtered, { type: 'ai', content: content }];
            });
          }
        }

        // generatedCount is defined at top scope now
        try {
          // CHECK: If request was aborted, don't execute the code
          if (!abortControllerRef.current) {
            console.log('[App] Request was aborted, skipping code execution');
            return;
          }
          
          // Apply code edits if AI returned edit format (<<<LINES:, <<<INSERT:, etc.)
          let finalCode = content;
          const hasLineEdits = content.includes('<<<LINES:') || content.includes('<<<INSERT:') || content.includes('<<<DELETE:');
          const hasSearchEdits = content.includes('<<<SEARCH');
          
          console.log('[App] Edit detection:', { hasLineEdits, hasSearchEdits, hasCurrentCode: !!currentCode });
          
          if (currentCode && (hasLineEdits || hasSearchEdits)) {
            console.log('[App] Applying code edits to existing code...');
            console.log('[App] Current code length:', currentCode.length);
            console.log('[App] AI response preview:', content.substring(0, 500));
            try {
              finalCode = applyCodeEdit(currentCode, content);
              console.log('[App] Code edits applied, result length:', finalCode.length);
              // Log if the code actually changed
              if (finalCode === currentCode) {
                console.warn('[App] WARNING: Code unchanged after edit!');
              }
            } catch (e) {
              console.warn('[App] Failed to apply code edits:', e);
            }
          }
          
          // CHECK AGAIN: If request was aborted during code processing, don't execute
          if (!abortControllerRef.current) {
            console.log('[App] Request was aborted during processing, skipping block generation');
            return;
          }
          
          // ============ AUTO-FIX LOGIC FOR FAST MODE ============
          // Try to execute code, if it fails with syntax error, silently ask AI to fix it
          const MAX_AUTO_FIX_ATTEMPTS = 2;
          let autoFixAttempts = 0;
          let executionError = null;
          
          while (autoFixAttempts <= MAX_AUTO_FIX_ATTEMPTS) {
            try {
              generatedCount = addBlocksFromStream(finalCode, true); // throwOnError = true for auto-fix
              executionError = null; // Success, clear error
              break; // Exit loop on success
            } catch (err) {
              executionError = err;
              autoFixAttempts++;
              
              // Check if we should try to auto-fix (silently)
              if (autoFixAttempts <= MAX_AUTO_FIX_ATTEMPTS && effectiveMode === 'fast') {
                console.log(`[App] Code execution failed (attempt ${autoFixAttempts}/${MAX_AUTO_FIX_ATTEMPTS}), requesting AI fix...`);
                
                if (apiSettings.debugMode) {
                  setDevLogs(prev => [...prev, { 
                    type: 'warning', 
                    content: `⚠️ 代码执行错误: ${err.message}\n正在请求 AI 修复...` 
                  }]);
                }
                
                // Request AI to fix the error
                const fixPrompt = `你生成的代码有错误，无法执行。请修复以下问题：

**错误信息：**
\`\`\`
${err.message}
\`\`\`

**原始代码：**
\`\`\`javascript
${finalCode}
\`\`\`

请直接输出修复后的完整代码，不需要解释。确保代码可以正确执行。`;

                try {
                  let fixedContent = '';
                  const fixResult = await fetchAIResponseStream(
                    fixPrompt,
                    apiSettings.apiKey,
                    apiSettings.baseUrl,
                    apiSettings.model,
                    [], // Don't use history for fix request
                    (chunk) => {
                      fixedContent += chunk;
                      setStreamingText(fixedContent);
                    },
                    null, // No current code context
                    null, // No image
                    null  // No conversation history
                  );
                  
                  finalCode = fixResult.content || fixResult;
                  
                  if (apiSettings.debugMode) {
                    setDevLogs(prev => [...prev, { 
                      type: 'info', 
                      content: `🔧 AI 返回修复后的代码 (${finalCode.length} chars)` 
                    }]);
                  }
                  
                  // Continue loop to try executing the fixed code
                } catch (fixErr) {
                  console.error('[App] Auto-fix request failed:', fixErr);
                  if (apiSettings.debugMode) {
                    setDevLogs(prev => [...prev, { type: 'error', content: `修复请求失败: ${fixErr.message}` }]);
                  }
                  break; // Exit loop if fix request fails
                }
              } else {
                break; // Exit loop if max attempts reached or not in fast mode
              }
            }
          }
          
          // Handle final result
          if (executionError) {
            // All fix attempts failed - show simple error message
            console.error('[App] Code execution failed after all attempts:', executionError);
            setMessages(p => [...p, { role: 'system', content: `❌ Script Error: ${executionError.message}` }]);
          } else if (generatedCount === 0) {
            setMessages(p => [...p, { role: 'system', content: '⚠️ Code executed but no blocks were placed.' }]);
            console.log('[App] Generated content (0 blocks):', finalCode.substring(0, 500));
          } else {
            // Success! (silently fixed if needed, no extra messages)
            if (autoFixAttempts > 0 && apiSettings.debugMode) {
              setDevLogs(prev => [...prev, { type: 'info', content: `✅ 代码自动修复成功！共 ${autoFixAttempts} 次尝试` }]);
            }
            
            // 🔧 FIX: Save the COMPLETE code state after modification
            // If this was a modification (we had existing code), save the merged result
            if (currentCode && (hasLineEdits || hasSearchEdits)) {
              setLastGeneratedCode(finalCode);
              console.log('[App] Saved merged code after edit application');
            } else if (currentCode && effectiveMode === 'fast') {
              // The full code state is: old code + new modifications
              const mergedCode = `// === Original Code ===\n${currentCode}\n\n// === Modifications ===\n${content}`;
              setLastGeneratedCode(mergedCode);
              console.log('[App] Merged code saved for fast modification mode');
            } else {
              setLastGeneratedCode(finalCode);
            }

            // Auto-save script
            fetch('http://localhost:3001/api/save-script', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: userMessage,
                code: finalCode,
                sessionId: currentSessionId
              })
            }).catch(err => console.warn('Script save failed:', err));
          }
        } catch (err) {
          console.error(err);
          setMessages(p => [...p, { role: 'system', content: `❌ Script Error: ${err.message}` }]);
        }
      }

      // Add message to chat - but DON'T dump full code in Agent/Precise mode
      setMessages(p => {
        const clean = p.filter(m => (typeof m.content === 'string' && !m.content.startsWith('🔄')) || Array.isArray(m.content));

        // In Agent/Precise mode, show a summary instead of full code (user sees "View Script" button in workflow card)
        // Use effectiveMode which is the actual mode used for this generation
        const isAgentMode = effectiveMode === 'agent' || effectiveMode === 'workflow' || effectiveMode === 'agentSkills' || effectiveMode === 'precise';
        if (isAgentMode) {
          // Use the actual generated count from this run
          return [...clean, { role: 'ai', content: `✅ 建筑生成完成！共 ${generatedCount} 个方块。`, hasScript: true }];
        }

        // In Direct/Fast mode - check if response contains edit format
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const hasEditFormat = contentStr.includes('<<<LINES:') || contentStr.includes('<<<INSERT:') || contentStr.includes('<<<DELETE:') || contentStr.includes('<<<SEARCH');
        if (hasEditFormat) {
          // Don't show raw edit instructions, show a summary instead
          return [...clean, { role: 'ai', content: `✅ 修改完成！共 ${generatedCount} 个方块。`, hasScript: true }];
        }

        // In Direct/Fast mode, show code as before (which has its own View Script button)
        return [...clean, { role: 'ai', content: contentStr }];
      });
      setStreamingText('');

      // Save snapshot AFTER successful code generation (captures AI response + generated blocks)
      pushChatSnapshot();
    } catch (e) {
      // Provide user-friendly error messages for common API errors
      let errorMessage = e.message;
      
      // Check for common API error patterns
      if (e.message.includes('401') || e.message.includes('Unauthorized') || e.message.includes('Invalid API Key')) {
        errorMessage = '❌ API Key 无效！请检查你的 API Key 是否正确。\n\n点击右上角设置 ⚙️ 重新配置。';
      } else if (e.message.includes('403') || e.message.includes('Forbidden')) {
        errorMessage = '❌ API 访问被拒绝！可能是 API Key 权限不足或已过期。';
      } else if (e.message.includes('429') || e.message.includes('Rate limit')) {
        errorMessage = '⚠️ API 请求过于频繁，请稍后再试。';
      } else if (e.message.includes('500') || e.message.includes('502') || e.message.includes('503')) {
        errorMessage = '⚠️ API 服务器暂时不可用，请稍后再试。';
      } else if (e.message.includes('network') || e.message.includes('fetch') || e.message.includes('Failed to fetch')) {
        errorMessage = '❌ 网络连接失败！请检查：\n1. 网络是否正常\n2. API Base URL 是否正确\n3. 是否需要代理/VPN';
      } else if (e.message.includes('model')) {
        errorMessage = `❌ 模型错误：${e.message}\n\n请在设置中检查模型名称是否正确。`;
      }
      
      setMessages(p => [...p.filter(m => typeof m.content === 'string' && !m.content.startsWith('🔄')), { role: 'system', content: errorMessage }]);
      setStreamingText('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (!blocks.length) return;
    const cmds = generateStructureCommand(blocks);
    navigator.clipboard.writeText(cmds).then(() => alert(`Copied ${blocks.length} commands!`));
  };

  const handleDirectImport = (text) => {
    if (!text || !text.trim()) {
      setMessages(p => [...p, { role: 'system', content: '⚠️ No code to import.' }]);
      return;
    }

    try {
      startStreamingSession();
      const count = addBlocksFromStream(text);

      if (count > 0) {
        setMessages(p => [...p, { role: 'system', content: `✅ Successfully imported ${count} blocks!` }]);
      } else {
        setMessages(p => [...p, { role: 'system', content: '⚠️ Code executed but no blocks were placed. Make sure your code uses builder.set() or builder.fill().' }]);
      }
    } catch (err) {
      console.error('Import Error:', err);
      setMessages(p => [...p, { role: 'system', content: `❌ Import Error: ${err.message}` }]);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-white font-sans overflow-hidden selection:bg-orange-500/30">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        initialSettings={apiSettings}
        language={language}
        setLanguage={setLanguage}
      />
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(text) => !isLoadingSession && handleDirectImport(text)}
        onClear={() => {
          if (isLoadingSession) return;
          clearBlocks();
          setSemanticVoxels([]);
          pushChatSnapshot(); // Create snapshot for clearing
        }}
        language={language}
        currentCode={lastGeneratedCode}
        disabled={isLoadingSession}
      />

      {/* Version Selection Modal - 合并了版本选择和文件名输入 */}
      <VersionSelectModal
        isOpen={isVersionSelectOpen}
        onClose={() => {
          setIsVersionSelectOpen(false);
          setSelectedExportType(null);
        }}
        exportType={selectedExportType}
        onSelect={(version, fileName) => {
          setSelectedVersion(version);
          setIsVersionSelectOpen(false);
          
          // Handle different export types after version selection
          if (selectedExportType === 'datapack') {
            // Datapack 使用结构名称
            exportToDatapack(blocks, fileName, version);
            showToast(`数据包 "${fileName}" 下载中... (${version})`, 'success');
            setSelectedExportType(null);
          } else if (selectedExportType === 'occ') {
            // One Command Block - copy to clipboard
            const cmd = generateOneCommand(blocks, version);
            const limit = 32767;
            navigator.clipboard.writeText(cmd).then(() => {
              if (cmd.length > limit) {
                showToast(`已复制! 但命令超过32k限制 (${cmd.length}字符)`, 'error');
              } else {
                showToast(`已复制到剪贴板! (${version})`, 'success');
              }
            }).catch(err => {
              showToast('复制失败: ' + err.message, 'error');
            });
            setSelectedExportType(null);
          } else if (selectedExportType === 'nbt') {
            exportToNBTStructure(blocks, fileName, version);
            showToast(`NBT结构文件 "${fileName}" 下载中... (${version})`, 'success');
            setSelectedExportType(null);
          } else if (selectedExportType === 'worldedit') {
            exportToWorldEdit(blocks, fileName, version);
            showToast(`WorldEdit原理图 "${fileName}" 下载中... (${version})`, 'success');
            setSelectedExportType(null);
          } else if (selectedExportType === 'litematica') {
            exportToLitematica(blocks, fileName, version);
            showToast(`Litematica文件 "${fileName}" 下载中... (${version})`, 'success');
            setSelectedExportType(null);
          } else if (selectedExportType === 'axiom') {
            exportToAxiom(blocks, fileName, version);
            showToast(`Axiom蓝图 "${fileName}" 下载中... (${version})`, 'success');
            setSelectedExportType(null);
          }
        }}
      />



      {/* Sidebar */}
      <div className="w-[480px] flex flex-col z-20 relative bg-neutral-900/40 backdrop-blur-2xl border-r border-white/5 shadow-2xl">

        {/* Header - high z-index for dropdown to appear above content */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-white/5 backdrop-blur-sm relative z-[200]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Box size={18} className="text-white" />
            </div>
            <h1 className="font-heading font-bold text-lg tracking-tight text-white/90">
              {t('appTitle')}
            </h1>
            <button
              onClick={() => { createNewSession(); setActiveTab('chat'); setReferenceImageUrl(null); setAgentSteps([]); setCurrentBlueprint(null); setLastGeneratedCode(null); }}
              className="p-1.5 text-orange-400 hover:text-white hover:bg-white/10 rounded-lg transition-all ml-1"
              title={t('newChat')}
            >
              <MessageSquarePlus size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title={t('directImport')}
            >
              <FileInput size={18} />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)} // Settings now includes Language
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title={t('settings')}
            >
              <Settings size={18} />
            </button>
            <div className="relative z-[100]">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg border border-white/5 transition-colors"
              >
                <Download size={14} />
                {t('export')}
                <ChevronDown size={12} className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExportMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col py-1 max-h-[500px] overflow-y-auto">
                  {/* Complete Datapack - RECOMMENDED */}
                  <button
                    onClick={() => {
                      setSelectedExportType('datapack');
                      setIsVersionSelectOpen(true);
                      setIsExportMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left text-xs font-medium text-neutral-300 hover:text-white transition-colors"
                  >
                    <Package size={14} className="text-emerald-400" />
                    <div>
                      <div className="text-white flex items-center gap-1">
                        {t('completeDatapack')}
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">{t('new')}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500">{t('readyZip')}</div>
                    </div>
                  </button>

                  {/* One Command Block */}
                  <button
                    onClick={() => {
                      setSelectedExportType('occ');
                      setIsVersionSelectOpen(true);
                      setIsExportMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left text-xs font-medium text-neutral-300 hover:text-white transition-colors border-t border-white/5"
                  >
                    <Terminal size={14} className="text-green-400" />
                    <div>
                      <div className="text-white">{t('oneCommand')}</div>
                      <div className="text-[10px] text-neutral-500">{t('copyClipboard')}</div>
                    </div>
                  </button>

                  {/* NBT Structure */}
                  <button
                    onClick={() => {
                      setSelectedExportType('nbt');
                      setIsVersionSelectOpen(true);
                      setIsExportMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left text-xs font-medium text-neutral-300 hover:text-white transition-colors border-t border-white/5"
                  >
                    <Box size={14} className="text-purple-400" />
                    <div>
                      <div className="text-white">{t('nbtStructure')}</div>
                      <div className="text-[10px] text-neutral-500">{t('vanillaStructure')}</div>
                    </div>
                  </button>

                  {/* WorldEdit Schematic */}
                  <button
                    onClick={() => {
                      setSelectedExportType('worldedit');
                      setIsVersionSelectOpen(true);
                      setIsExportMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left text-xs font-medium text-neutral-300 hover:text-white transition-colors border-t border-white/5"
                  >
                    <Layers size={14} className="text-yellow-400" />
                    <div>
                      <div className="text-white">{t('worldEdit')}</div>
                      <div className="text-[10px] text-neutral-500">{t('forWorldEdit')}</div>
                    </div>
                  </button>

                  {/* Litematica */}
                  <button
                    onClick={() => {
                      setSelectedExportType('litematica');
                      setIsVersionSelectOpen(true);
                      setIsExportMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left text-xs font-medium text-neutral-300 hover:text-white transition-colors border-t border-white/5"
                  >
                    <Copy size={14} className="text-cyan-400" />
                    <div>
                      <div className="text-white">{t('litematica')}</div>
                      <div className="text-[10px] text-neutral-500">{t('schematicMod')}</div>
                    </div>
                  </button>

                  {/* Axiom Blueprint */}
                  <button
                    onClick={() => {
                      setSelectedExportType('axiom');
                      setIsVersionSelectOpen(true);
                      setIsExportMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left text-xs font-medium text-neutral-300 hover:text-white transition-colors border-t border-white/5"
                  >
                    <Sparkles size={14} className="text-pink-400" />
                    <div>
                      <div className="text-white">{t('axiomBlueprint')}</div>
                      <div className="text-[10px] text-neutral-500">{t('axiomMod')}</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-white/5">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-xs font-bold tracking-wide transition-colors ${activeTab === 'chat' ? 'text-white border-b-2 border-orange-500 bg-white/5' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            {t('chat')}
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              // 延迟滚动到当前选中的会话位置
              setTimeout(() => {
                if (sessionsListRef.current && currentSessionId) {
                  const selectedItem = sessionsListRef.current.querySelector(`[data-session-id="${currentSessionId}"]`);
                  if (selectedItem) {
                    selectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }
              }, 50);
            }}
            className={`flex-1 py-3 text-xs font-bold tracking-wide transition-colors ${activeTab === 'history' ? 'text-white border-b-2 border-orange-500 bg-white/5' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            {t('sessions')}
          </button>
        </div>

        {/* Content Area */}
        {
          activeTab === 'chat' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800">
              {(() => {
                // Count user messages to map to snapshot indices
                // snapshot[0] = before first action (empty)
                // snapshot[1] = after first AI response
                // etc.
                let userMsgCount = 0;

                return messages.map((msg, i) => {
                  // For user messages, track which "action" this was
                  const isUserMsg = msg.role === 'user';
                  if (isUserMsg) userMsgCount++;

                  // The snapshot index for this message is userMsgCount
                  // (because snapshot[n] = state after n-th AI response)
                  const msgSnapshotIndex = isUserMsg ? userMsgCount : null;
                  const canRevert = isUserMsg && msgSnapshotIndex !== null &&
                    msgSnapshotIndex < chatSnapshots.length &&
                    msgSnapshotIndex !== snapshotIndex;

                  // Skip rendering blueprint messages in chat - they are now shown in the Agent Workflow card
                  if (msg.role === 'assistant' && msg.content.startsWith('**📋 Blueprint:**')) {
                    return null;
                  }

                  return (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} group`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-orange-500/20' : 'bg-neutral-800'}`}>
                        {msg.role === 'user' ? <Sparkles size={14} className="text-orange-400" /> : <Box size={14} className="text-neutral-400" />}
                      </div>

                      {/* Revert button for user messages */}
                      {isUserMsg && chatSnapshots.length > 1 && (
                        <button
                          onClick={() => {
                            // Jump to the snapshot BEFORE this message (to undo this message and everything after)
                            const targetIndex = msgSnapshotIndex - 1;
                            if (targetIndex >= 0) {
                              jumpToSnapshot(targetIndex);
                            }
                          }}
                          className={`self-center p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${msgSnapshotIndex - 1 < snapshotIndex
                            ? 'text-amber-400 hover:bg-amber-500/20 hover:text-amber-300'
                            : 'text-neutral-500 hover:bg-neutral-700'
                            }`}
                          title={`Revert to before this message (Step ${msgSnapshotIndex - 1})`}
                        >
                          <Undo2 size={14} />
                        </button>
                      )}

                      <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex-1`}>
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                          ? 'bg-gradient-to-br from-orange-600/90 to-amber-700/90 text-white rounded-tr-sm shadow-lg shadow-orange-900/20 border border-orange-400/20'
                          : msg.role === 'system'
                            ? 'text-neutral-500 text-xs italic'
                            : 'bg-neutral-800/50 backdrop-blur border border-white/5 text-neutral-200 rounded-tl-sm'
                          }`}>
                          {(() => {
                            let contentStr = '';
                            if (Array.isArray(msg.content)) {
                              contentStr = msg.content.find(c => c.type === 'text')?.text || '';
                            } else if (typeof msg.content === 'object' && msg.content !== null) {
                              contentStr = JSON.stringify(msg.content);
                            } else {
                              contentStr = String(msg.content || '');
                            }
                            
                            // Check if this message has a script (either embedded or via hasScript flag)
                            const hasCodeBlock = contentStr.match(/```[\s\S]*?```/);
                            const hasScriptFlag = msg.hasScript;
                            
                            return (
                              <div className="flex flex-col gap-2">
                                <div className="leading-relaxed">
                                  {renderMarkdown(contentStr)}
                                </div>
                                {(hasCodeBlock || hasScriptFlag) && (
                                  <button
                                    onClick={() => {
                                      if (hasCodeBlock) {
                                        const match = contentStr.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
                                        if (match && match[1]) {
                                          setViewingCode(match[1]);
                                        }
                                      } else if (hasScriptFlag && lastGeneratedCode) {
                                        // Use the saved lastGeneratedCode for edit-based responses
                                        setViewingCode(lastGeneratedCode);
                                      }
                                    }}
                                    className="self-start px-3 py-1.5 bg-neutral-900/50 hover:bg-neutral-900 border border-white/10 rounded-lg text-xs font-mono text-neutral-400 hover:text-orange-400 transition-colors flex items-center gap-2"
                                  >
                                    <FileCode size={14} /> View Script
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                          {/* Show user-uploaded images (multiple) */}
                          {msg.role === 'user' && msg.imageUrls && msg.imageUrls.length > 0 && (
                            <div className={`mt-3 ${msg.imageUrls.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
                              {msg.imageUrls.map((imgUrl, imgIdx) => (
                                <img 
                                  key={imgIdx} 
                                  src={imgUrl} 
                                  alt={`Attached image ${imgIdx + 1}`} 
                                  className="w-full rounded-lg border border-white/10 cursor-zoom-in hover:opacity-90 transition-opacity" 
                                  onClick={() => setViewingImage(imgUrl)}
                                  title="点击放大查看"
                                />
                              ))}
                            </div>
                          )}
                          {/* Show AI-generated image with Build button (only for AI messages with originalPrompt) */}
                          {msg.role === 'ai' && msg.imageUrl && msg.originalPrompt && (
                            <div className="mt-3">
                              <img 
                                src={msg.imageUrl} 
                                alt="Generated Concept" 
                                className="w-full rounded-xl border border-white/10 mb-3 cursor-zoom-in hover:opacity-90 transition-opacity" 
                                onClick={() => setViewingImage(msg.imageUrl)}
                                title="点击放大查看"
                              />
                              <button
                                onClick={() => {
                                  setIsVisualMode(false); // Switch to direct code mode
                                  handleSend(msg.originalPrompt, msg.imageUrl);
                                }}
                                className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg font-bold text-xs shadow-lg shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                <Box size={14} /> {t('buildStructure')}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Variant Tabs - 只在 AI 消息且并发数 > 1 时显示 */}
                        {msg.role === 'ai' && msg.variants && msg.concurrencyCount > 1 && (
                          <VariantTabs
                            variants={msg.variants}
                            activeIndex={msg.activeVariantIndex || 0}
                            onSwitch={(newIndex) => handleVariantSwitch(msg.id, newIndex)}
                            mode={msg.generationMode || 'fast'}
                          />
                        )}
                      </div>
                    </div>
                  );
                });
              })()}

              {/* === AI AGENT WORKFLOW CARD (并发 Agent 模式) === */}
              {(() => {
                const concurrentGen = useStore.getState().currentConcurrentGeneration;
                const isAgentConcurrent = concurrentGen && (concurrentGen.mode === 'workflow' || concurrentGen.mode === 'agentSkills');
                
                if (isAgentConcurrent) {
                  const activeViewIndex = concurrentGen.activeViewIndex || 0;
                  const activeVariant = concurrentGen.variants[activeViewIndex];
                  const variantSteps = activeVariant?.agentSteps || [];
                  
                  if (variantSteps.length > 0 || concurrentGen.variants.some(v => v.agentSteps?.length > 0)) {
                    return (
                      <div className="mt-6 mb-2 mx-1 border border-white/10 rounded-xl bg-neutral-900/80 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header */}
                        <div
                          onClick={() => setIsWorkflowCollapsed(prev => !prev)}
                          className="bg-white/5 px-4 py-2.5 text-[10px] font-bold tracking-widest text-neutral-500 border-b border-white/5 flex justify-between items-center backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles size={12} className="text-purple-500" />
                            <span>AI ARCHITECT WORKFLOW</span>
                            {isProcessing ? (
                              <span className="flex items-center gap-1.5 text-purple-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                                <span>RUNNING</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-green-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                <span>COMPLETE</span>
                              </span>
                            )}
                          </span>
                          <div className="text-neutral-500">
                            {isWorkflowCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                          </div>
                        </div>

                        {/* Variant Tabs for Agent Mode */}
                        {!isWorkflowCollapsed && (
                          <>
                            <div className="px-4 py-2 bg-black/20 border-b border-white/5 flex gap-1 flex-wrap">
                              {concurrentGen.variants.map((variant, idx) => {
                                const isActive = idx === activeViewIndex;
                                const variantStatus = variant.status;
                                const hasSteps = variant.agentSteps?.length > 0;
                                
                                let statusIcon = '⏳';
                                let statusColor = 'text-neutral-500';
                                if (variantStatus === 'done') {
                                  statusIcon = '✓';
                                  statusColor = 'text-green-500';
                                } else if (variantStatus === 'error') {
                                  statusIcon = '✕';
                                  statusColor = 'text-red-500';
                                } else if (hasSteps) {
                                  statusIcon = '🔄';
                                  statusColor = 'text-purple-400';
                                }
                                
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const { setActiveViewIndex } = useStore.getState();
                                      setActiveViewIndex(idx);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                      isActive
                                        ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                                        : 'bg-white/5 text-neutral-400 hover:bg-white/10 border border-transparent'
                                    }`}
                                  >
                                    <span className={statusColor}>{statusIcon}</span> 变体 {idx + 1}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Steps List for Active Variant */}
                            <div className="p-4 space-y-2 font-mono text-xs">
                              {variantSteps.length === 0 ? (
                                <div className="text-neutral-500 text-center py-4">等待初始化...</div>
                              ) : (
                                variantSteps.map((step, idx) => {
                                  let Icon = <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />;
                                  let colorClass = "text-neutral-500";
                                  const hasDetails = (step.details && step.details.length > 0) || step.aiThinking;
                                  const isExpanded = expandedSteps.has(step.id);

                                  if (step.status === 'running') {
                                    Icon = <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />;
                                    colorClass = "text-purple-200 font-bold";
                                  } else if (step.status === 'done') {
                                    Icon = <div className="text-green-500">✓</div>;
                                    colorClass = "text-neutral-400";
                                  } else if (step.status === 'error') {
                                    Icon = <div className="text-red-500">✕</div>;
                                    colorClass = "text-red-400";
                                  }

                                  const toggleExpand = () => {
                                    setExpandedSteps(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(step.id)) {
                                        newSet.delete(step.id);
                                      } else {
                                        newSet.add(step.id);
                                      }
                                      return newSet;
                                    });
                                  };

                                  return (
                                    <div key={idx} className="animate-in slide-in-from-left-2 duration-300">
                                      {/* Step Header */}
                                      <div
                                        className={`flex items-center gap-3 transition-all duration-300 ${step.status === 'running' ? 'translate-x-1' : ''} ${hasDetails ? 'cursor-pointer hover:bg-white/5 rounded-lg py-1 px-1 -mx-1' : ''}`}
                                        onClick={hasDetails ? toggleExpand : undefined}
                                      >
                                        <div className="w-5 flex justify-center">{Icon}</div>
                                        <span className={`flex-1 ${colorClass}`}>{step.label}</span>
                                        {hasDetails && (
                                          <div className="text-neutral-600 transition-transform duration-200">
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                          </div>
                                        )}
                                      </div>

                                      {/* Collapsible Details */}
                                      {hasDetails && isExpanded && (
                                        <div className="ml-8 mt-2 mb-3 bg-black/40 border border-white/5 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                          {/* AI Thinking Content */}
                                          {step.aiThinking && (
                                            <div className="border-b border-white/5">
                                              <div className="px-3 py-2 bg-purple-900/20 text-[10px] text-purple-300 flex items-center gap-1">
                                                <span>💭</span>
                                                <span>AI 思考</span>
                                              </div>
                                              <div className="px-3 py-2 text-[10px] max-h-48 overflow-y-auto">
                                                <pre className="text-neutral-300 whitespace-pre-wrap break-words">
                                                  {step.aiThinking.substring(0, 1000)}
                                                  {step.aiThinking.length > 1000 && '...'}
                                                </pre>
                                              </div>
                                            </div>
                                          )}
                                          {/* Tool Details */}
                                          {step.details && step.details.map((detail, dIdx) => (
                                            <div key={dIdx} className="border-b border-white/5 last:border-b-0">
                                              {/* Detail Header */}
                                              <div className="px-3 py-2 bg-white/5 text-[10px] text-neutral-500 flex justify-between">
                                                <span>
                                                  {detail.type === 'start' ? '📥 调用' : '📤 结果'}
                                                  {' '}
                                                  <span className="text-purple-400">{detail.toolName}</span>
                                                </span>
                                                <span className="text-neutral-600">Step {detail.iteration}</span>
                                              </div>

                                              {/* Arguments or Result */}
                                              <div className="px-3 py-2 text-[10px] max-h-48 overflow-y-auto">
                                                {detail.type === 'start' && detail.toolArgs && (
                                                  <div>
                                                    <div className="text-neutral-500 mb-1">参数:</div>
                                                    <pre className="text-neutral-300 whitespace-pre-wrap break-words">
                                                      {JSON.stringify(detail.toolArgs, null, 2)}
                                                    </pre>
                                                  </div>
                                                )}
                                                {detail.type === 'result' && detail.result && (
                                                  <div>
                                                    <div className={`mb-1 ${detail.result.success ? 'text-green-500' : 'text-red-500'}`}>
                                                      {detail.result.success ? '✓ 成功' : '✕ 失败'}
                                                    </div>
                                                    {detail.result.content && (
                                                      <pre className="text-neutral-400 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                                        {detail.result.content.substring(0, 500)}
                                                        {detail.result.content.length > 500 && '...'}
                                                      </pre>
                                                    )}
                                                    {detail.result.blockCount !== undefined && (
                                                      <div className="text-purple-400 mt-1">
                                                        方块数: {detail.result.blockCount}
                                                      </div>
                                                    )}
                                                    {detail.result.error && (
                                                      <div className="text-red-400 mt-1">
                                                        错误: {detail.result.error}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  }
                }
                return null;
              })()}

              {/* === AI AGENT WORKFLOW CARD (单次生成模式) === */}
              {agentSteps.length > 0 && !(useStore.getState().currentConcurrentGeneration?.mode === 'workflow' || useStore.getState().currentConcurrentGeneration?.mode === 'agentSkills') && (
                <div className="mt-6 mb-2 mx-1 border border-white/10 rounded-xl bg-neutral-900/80 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Header - Clickable to Collapse */}
                  <div
                    onClick={() => setIsWorkflowCollapsed(prev => !prev)}
                    className="bg-white/5 px-4 py-2.5 text-[10px] font-bold tracking-widest text-neutral-500 border-b border-white/5 flex justify-between items-center backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={12} className="text-orange-500" />
                      <span>AI ARCHITECT WORKFLOW</span>
                      {isWorkflowCollapsed && (
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 font-normal normal-case tracking-normal">
                          {agentSteps.length} steps
                        </span>
                      )}
                      {isProcessing ? (
                        <span className="flex items-center gap-1.5 text-orange-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                          <span>RUNNING</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-green-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          <span>COMPLETE</span>
                        </span>
                      )}
                    </span>
                    <div className="text-neutral-500">
                      {isWorkflowCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  {!isWorkflowCollapsed && (
                    <>
                      {/* Blueprint Card - Inside the Workflow Box */}
                      {currentBlueprint && (
                        <div className="mx-4 mt-4 bg-[#0f1219] border border-blue-500/20 rounded-md overflow-hidden shadow-lg shadow-blue-900/10">
                          {/* Compact Header */}
                          <div className="bg-blue-900/20 border-b border-blue-500/10 px-3 py-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-sm"></div>
                              <span className="text-[9px] uppercase tracking-widest font-bold text-blue-300">Blueprint</span>
                            </div>
                            <div className="text-[9px] font-mono text-blue-500/70">v1.0</div>
                          </div>
                          {/* Content - Compact Layout */}
                          <div className="px-3 py-2.5">
                            <div className="flex flex-col gap-1">
                              <div className="text-xs font-medium text-blue-100 font-mono leading-tight">{currentBlueprint.style}</div>
                              <div className="flex items-center gap-1.5 mt-1 border-t border-blue-500/10 pt-1.5">
                                <span className="text-[9px] text-blue-500 uppercase">Size</span>
                                <div className="text-[10px] font-bold text-white font-mono flex items-center gap-1.5">
                                  ({currentBlueprint.dimensions})
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Steps List */}
                      <div className="p-4 space-y-2 font-mono text-xs">
                        {agentSteps.map((step, idx) => {
                          // Icons based on status
                          let Icon = <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />;
                          let colorClass = "text-neutral-500";
                          const hasDetails = step.details && step.details.length > 0;
                          const isExpanded = expandedSteps.has(step.id);

                          if (step.status === 'running') {
                            Icon = <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />;
                            colorClass = "text-orange-200 font-bold";
                          } else if (step.status === 'done') {
                            Icon = <div className="text-green-500">✓</div>;
                            colorClass = "text-neutral-400";
                          } else if (step.status === 'error') {
                            Icon = <div className="text-red-500">✕</div>;
                            colorClass = "text-red-400";
                          }

                          // Get display label with step number
                          const stepNumber = idx + 1;
                          const displayLabel = step.label.startsWith('🧠') ? step.label : step.label;

                          // Toggle expand/collapse
                          const toggleExpand = () => {
                            setExpandedSteps(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(step.id)) {
                                newSet.delete(step.id);
                              } else {
                                newSet.add(step.id);
                              }
                              return newSet;
                            });
                          };

                          return (
                            <div key={idx} className="animate-in slide-in-from-left-2 duration-300">
                              {/* Step Header */}
                              <div
                                className={`flex items-center gap-3 transition-all duration-300 ${step.status === 'running' ? 'translate-x-1' : ''} ${hasDetails ? 'cursor-pointer hover:bg-white/5 rounded-lg py-1 px-1 -mx-1' : ''}`}
                                onClick={hasDetails ? toggleExpand : undefined}
                              >
                                <div className="w-5 flex justify-center">{Icon}</div>
                                <span className={`flex-1 ${colorClass}`}>
                                  {displayLabel}
                                </span>
                                {hasDetails && (
                                  <div className="text-neutral-600 transition-transform duration-200">
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </div>
                                )}
                              </div>

                              {/* Collapsible Details */}
                              {hasDetails && isExpanded && (
                                <div className="ml-8 mt-2 mb-3 bg-black/40 border border-white/5 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                  {step.details.map((detail, dIdx) => (
                                    <div key={dIdx} className="border-b border-white/5 last:border-b-0">
                                      {/* Detail Header */}
                                      <div className="px-3 py-2 bg-white/5 text-[10px] text-neutral-500 flex justify-between">
                                        <span>
                                          {detail.type === 'start' ? '📥 调用' : '📤 结果'}
                                          {' '}
                                          <span className="text-cyan-400">{detail.toolName}</span>
                                        </span>
                                        <span className="text-neutral-600">Step {detail.iteration}</span>
                                      </div>

                                      {/* Arguments or Result */}
                                      <div className="px-3 py-2 text-[10px] max-h-48 overflow-y-auto">
                                        {detail.type === 'start' && detail.toolArgs && (
                                          <div>
                                            <div className="text-neutral-500 mb-1">参数:</div>
                                            <pre className="text-neutral-300 whitespace-pre-wrap break-words">
                                              {JSON.stringify(detail.toolArgs, null, 2)}
                                            </pre>
                                          </div>
                                        )}
                                        {detail.type === 'result' && detail.result && (
                                          <div>
                                            <div className={`mb-1 ${detail.result.success ? 'text-green-500' : 'text-red-500'}`}>
                                              {detail.result.success ? '✓ 成功' : '✕ 失败'}
                                            </div>
                                            {detail.result.content && (
                                              <pre className="text-neutral-400 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                                {detail.result.content.substring(0, 500)}
                                                {detail.result.content.length > 500 && '...'}
                                              </pre>
                                            )}
                                            {detail.result.blockCount !== undefined && (
                                              <div className="text-cyan-400 mt-1">
                                                方块数: {detail.result.blockCount}
                                              </div>
                                            )}
                                            {detail.result.error && (
                                              <div className="text-red-400 mt-1">
                                                错误: {detail.result.error}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* View Final Script Button - Only show when complete */}
                        {!isProcessing && lastGeneratedCode && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <button
                              onClick={() => setViewingCode(lastGeneratedCode)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600/20 to-amber-600/20 hover:from-orange-600/30 hover:to-amber-600/30 border border-orange-500/30 rounded-lg text-orange-300 hover:text-orange-200 text-xs font-bold transition-all"
                            >
                              <FileCode size={14} />
                              View Final Script
                            </button>
                          </div>
                        )}

                        {/* Pending Next Step Ghost (Optional visual flair) */}
                        {isProcessing && (
                          <div className="flex items-center gap-3 opacity-30 pt-1">
                            <div className="w-5 flex justify-center"><div className="w-1 h-1 rounded-full bg-neutral-600" /></div>
                            <span className="text-neutral-600 italic">...</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

          ) : (
            <div ref={sessionsListRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800">
              {sessions.length === 0 && (
                <div className="text-center py-10 text-neutral-600 text-sm">
                  <History size={24} className="mx-auto mb-2 opacity-50" />
                  {t('noSessions')}
                </div>
              )}
              {/* 去重 sessions，防止 key 重复警告 */}
              {[...new Map(sessions.map(s => [s.id, s])).values()].map(s => (
                <div
                  key={s.id}
                  data-session-id={s.id}
                  onClick={() => { switchSession(s.id); setActiveTab('chat'); setLastGeneratedCode(null); setAgentSteps([]); setCurrentBlueprint(null); }}
                  className={`group cursor-pointer border p-3 rounded-xl transition-all relative overflow-hidden flex justify-between items-center ${currentSessionId === s.id
                    ? 'bg-neutral-800 border-orange-500/30'
                    : 'bg-neutral-900/50 hover:bg-neutral-800 border-white/5'
                    }`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className={`font-medium text-sm line-clamp-1 ${currentSessionId === s.id ? 'text-orange-100' : 'text-neutral-300'}`}>
                      {s.title}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-1 flex items-center gap-2">
                      <span>{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                      <span>{s.blockCount ?? (s.blocks ? s.blocks.length : 0)} Blocks</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (sessionToDelete?.id === s.id) {
                        deleteSession(s.id);
                        setSessionToDelete(null);
                        showToast(t('delete') + ' ' + t('success'), 'success');
                      } else {
                        setSessionToDelete(s);
                        clearTimeout(window.deleteTimeout);
                        window.deleteTimeout = setTimeout(() => {
                          setSessionToDelete(current => (current?.id === s.id ? null : current));
                        }, 3000);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-all ${sessionToDelete?.id === s.id
                      ? 'bg-red-500 text-white opacity-100 shadow-lg scale-110 ring-2 ring-red-500/30 font-bold text-[10px] w-auto px-2'
                      : 'text-neutral-500 hover:text-red-400 hover:bg-neutral-700/50 opacity-0 group-hover:opacity-100'
                      }`}
                  >
                    {sessionToDelete?.id === s.id ? t('delete') : <Trash2 size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )
        }

        <div className="p-5 border-t border-white/5 bg-neutral-900/30 backdrop-blur-lg">
          {/* Mode Toggle */}
          {/* Mode Toggle Groups */}
          <div className="flex justify-center mb-3 items-center gap-3">
            {/* Group 1: Visualization Mode */}
            <div className="bg-neutral-900/80 p-1 rounded-lg flex border border-white/10 shadow-sm">
              <button
                onClick={() => setIsVisualMode(false)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${!isVisualMode ? 'bg-neutral-700 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
                title={t('directCode')}
              >
                <Terminal size={12} /> {t('directCode')}
              </button>
              <button
                onClick={() => setIsVisualMode(true)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${isVisualMode ? 'bg-pink-600/20 text-pink-300 border border-pink-500/30 shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
                title={t('visualMode')}
              >
                <Palette size={12} /> {t('visualMode')}
              </button>
            </div>

            {/* Group 2: Generation Mode - 只在建造模式下显示 */}
            <div 
              className={`flex items-center gap-3 transition-all duration-300 ease-in-out overflow-hidden ${
                isVisualMode 
                  ? 'max-w-0 opacity-0 scale-95' 
                  : 'max-w-[500px] opacity-100 scale-100'
              }`}
            >
              {/* Separator */}
              <div className="h-4 w-px bg-white/10 flex-shrink-0"></div>

              <div className="bg-neutral-900/80 p-1 rounded-lg flex border border-white/10 shadow-sm flex-shrink-0">
                <button
                  onClick={() => setGenerationMode('fast')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${generationMode === 'fast' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
                  title="Fast Mode: Direct code generation, best for modifications"
                >
                  <Zap size={12} /> 快速
                </button>
                <button
                  onClick={() => setGenerationMode('workflow')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${generationMode === 'workflow' || generationMode === 'agent' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
                  title="Workflow Mode: Configurable AI workflow with preset steps"
                >
                  <Wrench size={12} /> 自定义
                </button>
                <button
                  onClick={() => setGenerationMode('agentSkills')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${generationMode === 'agentSkills' ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
                  title="Agent Skills Mode: AI autonomously decides which skills to use"
                >
                  🤖 自主
                </button>
              </div>
            </div>
          </div>

          {/* Reference Image Indicator - REMOVED: Now works silently in background */}

          {/* Quick Undo/Redo Controls */}
          {chatSnapshots.length > 1 && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <button
                onClick={handleUndoWithStop}
                disabled={snapshotIndex <= 0 || isLoadingSession}
                className={`p-1.5 rounded-lg transition-all ${snapshotIndex > 0 && !isLoadingSession
                  ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                  : 'text-neutral-700 cursor-not-allowed'
                  }`}
                title="Undo (or click ↩ on any message above)"
              >
                <Undo2 size={16} />
              </button>
              <span className="text-[10px] text-neutral-600 font-mono">
                {snapshotIndex}/{chatSnapshots.length - 1}
              </span>
              <button
                onClick={redoChat}
                disabled={snapshotIndex >= chatSnapshots.length - 1 || isLoadingSession}
                className={`p-1.5 rounded-lg transition-all ${snapshotIndex < chatSnapshots.length - 1 && !isLoadingSession
                  ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                  : 'text-neutral-700 cursor-not-allowed'
                  }`}
                title="Redo"
              >
                <Redo2 size={16} />
              </button>
            </div>
          )}

          <div className="relative group">
            {/* Image Previews - Above the input */}
            {attachedImages.length > 0 && (
              <div className="mb-2 p-2 bg-neutral-800/80 border border-white/10 rounded-lg flex items-center gap-2 flex-wrap">
                {attachedImages.map((img, index) => (
                  <div key={index} className="relative group/img">
                    <img src={img} className="h-16 w-auto rounded border border-white/10 object-cover" alt={`Upload ${index + 1}`} />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all opacity-0 group-hover/img:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {attachedImages.length < 3 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-16 w-16 rounded border border-dashed border-white/20 hover:border-orange-500/50 flex items-center justify-center text-neutral-500 hover:text-orange-400 transition-all"
                  >
                    <ImageIcon size={20} />
                  </button>
                )}
              </div>
            )}

            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => handleImageFile(e.target.files?.[0])}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className={`absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-orange-400 hover:bg-white/5 rounded-lg transition-all flex items-center justify-center p-1 ${attachedImages.length >= 3 || isLoadingSession ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={attachedImages.length >= 3 ? 'Maximum 3 images' : t('uploadImage')}
                disabled={attachedImages.length >= 3 || isLoadingSession}
              >
                <ImageIcon size={18} />
              </button>

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onPaste={handlePaste}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files || []);
                  files.forEach(file => {
                    if (file.type.startsWith('image/')) {
                      handleImageFile(file);
                    }
                  });
                }}
                onDragOver={(e) => e.preventDefault()}
                placeholder={isLoadingSession ? '加载中...' : t('placeholder')}
                rows={1}
                disabled={isLoadingSession}
                className={`w-full bg-neutral-950/50 border border-white/10 rounded-xl pl-12 pr-14 py-3 focus:outline-none focus:border-orange-500/50 focus:bg-neutral-900/80 transition-all text-sm font-medium placeholder:text-neutral-600 shadow-inner resize-none overflow-y-auto ${isLoadingSession ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ minHeight: '48px', maxHeight: '200px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
              />
              {isProcessing ? (
                <button
                  onClick={handleStop}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/20"
                  title="Stop generation"
                >
                  <Square size={12} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={isLoadingSession}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-orange-500/80 hover:bg-orange-500 text-white flex items-center justify-center transition-all shadow-md ${isLoadingSession ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Send size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div >

      {/* 3D Viewport */}
      <div
        className="flex-1 relative bg-gradient-to-b from-[#0f172a] to-[#010101]"
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={(e) => { if (e.button === 2) e.preventDefault(); }}
        onDragStart={(e) => e.preventDefault()}
      >

        {/* HUD Overlay */}
        <div className="absolute top-6 left-6 z-10 flex gap-2">
          <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-neutral-400 pointer-events-none">
            <Layers size={12} className="text-orange-400" />
            <span>{t('blocks')}: {blocks.length}</span>
          </div>
          <button
            onClick={() => setIsDayMode(!isDayMode)}
            className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-neutral-400 hover:text-white hover:border-orange-500/50 transition-all"
          >
            {isDayMode ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} className="text-blue-400" />}
            <span>{isDayMode ? t('day') : t('night')}</span>
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'mc' ? 'blueprint' : 'mc')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${viewMode === 'blueprint'
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
              : 'bg-neutral-900/80 border-white/10 text-neutral-400 hover:text-white'
              }`}
          >
            <Layers size={14} className={viewMode === 'blueprint' ? "text-blue-400" : "text-neutral-400"} />
            <span>{viewMode === 'blueprint' ? t('blueprint') : t('minecraft')}</span>
          </button>
        </div >

        {/* Control Mode Toggles */}
        <div className="absolute top-6 right-6 z-10 flex gap-2">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setControlMode('orbit');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all shadow-lg ${controlMode === 'orbit'
              ? 'bg-orange-600 border-orange-400 text-white scale-105'
              : 'bg-neutral-900/80 border-white/10 text-neutral-400 hover:bg-neutral-800'
              }`}
            title={t('orbitDesc')}
          >
            <MousePointer2 size={14} />
            {t('orbit')}
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              clearSelection(); // Clear any selection before entering GAME mode
              setControlMode('minecraft');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all shadow-lg ${controlMode === 'minecraft'
              ? 'bg-green-600 border-green-400 text-white scale-105'
              : 'bg-neutral-900/80 border-white/10 text-neutral-400 hover:bg-neutral-800'
              }`}
            title={t('gameDesc')}
          >
            <Plane size={14} />
            {t('game')}
          </button>
        </div >

        <PropertiesPanel />

        <MinecraftHUD />

        <Canvas camera={{ position: [10, 8, 10], fov: apiSettings.fov || 75 }} shadows className="cursor-grab active:cursor-grabbing">
          <color attach="background" args={[isDayMode ? '#a8d5f0' : '#0a0a0a']} />
          <fog attach="fog" args={[isDayMode ? '#a8d5f0' : '#0a0a0a', 30, 100]} />

          <ambientLight intensity={isDayMode ? 1.5 : 0.8} />
          <directionalLight position={[10, 30, 10]} intensity={isDayMode ? 2 : 0.5} color={isDayMode ? '#fff8e0' : '#aabbff'} />

          {!isDayMode && <Stars radius={100} depth={50} count={3000} factor={3} saturation={0} fade />}
          <Grid infiniteGrid sectionColor={isDayMode ? '#888' : '#333'} cellColor={isDayMode ? '#666' : '#1a1a1a'} fadeDistance={60} />

          {controlMode === 'orbit' ? (
            <OrbitControls
              ref={controlsRef}
              makeDefault
              minDistance={2}
              maxDistance={100}
              enableDamping
              dampingFactor={0.1}
              rotateSpeed={apiSettings.mouseSensitivity || 1.0}
              panSpeed={apiSettings.mouseSensitivity || 1.0}
              zoomSpeed={apiSettings.mouseSensitivity || 1.0}
              mouseButtons={{
                LEFT: 0,
                MIDDLE: 2,
                RIGHT: 1
              }}
              enabled={!isLoadingSession}
            />
          ) : (
            <MinecraftControls />
          )}

          <CameraUpdater fov={apiSettings.fov || 75} />
          <VoxelWorld />
        </Canvas>

        {/* Loading Overlay for Session Switching */}
        {isLoadingSession && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-8 h-8 border-2 border-neutral-600 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Footer Info */}
        <div className="absolute bottom-6 right-6 flex gap-4 text-[10px] font-bold tracking-widest text-neutral-600 pointer-events-none select-none">
          {controlMode === 'orbit' ? (
            <>
              <span>L-CLICK ROTATE</span>
              <span>M-CLICK PAN</span>
              <span>SCROLL ZOOM</span>
            </>
          ) : (
            <>
              <span>WASD MOVE</span>
              <span>SPACE JUMP/FLY</span>
              <span>ESC UNLOCK</span>
            </>
          )}
        </div>
      </div >


      <CodeViewerModal
        isOpen={!!viewingCode}
        onClose={() => setViewingCode(null)}
        code={viewingCode || ''}
      />

      {/* Developer Console Toggle Button (Only specific to Debug Mode) */}
      {apiSettings.debugMode && (
        <button
          onClick={() => setIsDevConsoleOpen(prev => !prev)}
          className={`fixed bottom-24 right-6 z-[9000] p-3 rounded-full shadow-2xl transition-all duration-200 hover:scale-110 ${isDevConsoleOpen
            ? 'bg-orange-500 text-white shadow-orange-500/50 rotate-0'
            : 'bg-neutral-800 text-neutral-400 border border-white/10 hover:text-white hover:border-orange-500/50'
            }`}
          title="Toggle Developer Console"
        >
          <Terminal size={20} />
          {devLogs.length > 0 && !isDevConsoleOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      )}

      {/* Developer Console Modal - shows complete AI conversation */}
      <DevConsoleModal
        isOpen={isDevConsoleOpen}
        onClose={() => setIsDevConsoleOpen(false)}
        logs={devLogs}
        onClear={clearDevLogs}
      />

      {/* Block Tools Panel - appears when blocks are selected */}
      <BlockToolsPanel />
      {/* Toast Notifications */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-3 items-center pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-6 py-3 rounded-full border shadow-2xl backdrop-blur-xl animate-slide-up pointer-events-auto
              ${toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'}
            `}
          >
            {toast.type === 'success' ? <Package size={16} /> : <Box size={16} />}
            <span className="text-sm font-medium whitespace-nowrap">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Image Viewer Modal - fullscreen image with zoom and pan */}
      <ImageViewerModal
        isOpen={!!viewingImage}
        onClose={() => setViewingImage(null)}
        imageUrl={viewingImage}
      />
    </div >
  );
}

export default App;
