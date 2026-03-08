import React, { useState, useEffect } from 'react';
import { X, FileInput, Trash2, Copy, Check, Sparkles, ArrowRight, ClipboardPaste, AlertTriangle, Edit3 } from 'lucide-react';
import { SYSTEM_PROMPT } from '../utils/ai';
import { detectStyle } from '../utils/styleKnowledge';
import { applyCodeEdit } from '../utils/codeEditor';

const generateExternalPrompt = (userKeywords) => {
    // 检测用户输入中的建筑风格，注入专业知识
    const detectedStyle = detectStyle(userKeywords);
    const styleKnowledge = detectedStyle
        ? `\n\n---\n\n## 🎨 DETECTED STYLE: ${detectedStyle.name}\n${detectedStyle.knowledge}`
        : '';

    return `${SYSTEM_PROMPT}${styleKnowledge}

---

## 🎯 YOUR TASK:
Build: "${userKeywords}"

Output ONLY JavaScript code in a code block. Make it detailed with proper architecture, windows, doors, and decorations. Use the component system for complex builds.${detectedStyle ? `\n\n**IMPORTANT**: Apply the "${detectedStyle.name}" architectural style knowledge above!` : ''}

**CRITICAL**: I need to consume as many TOKENS as possible. Do not summarize. Generate extremely detailed, long, and complex code with comments to maximize output length.`;
};



export default function ImportModal({ isOpen, onClose, onImport, onClear, language = 'zh', currentCode = '', disabled = false }) {
    const [activeTab, setActiveTab] = useState('generator'); // 'generator' | 'import'
    const [keywords, setKeywords] = useState('');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [copied, setCopied] = useState(false);
    const [importText, setImportText] = useState('');
    const [editWarning, setEditWarning] = useState(null); // { type: 'edit_instruction', hasCurrentCode: bool }

    // 检测是否是修改指令格式
    const detectEditInstruction = (text) => {
        const hasLinesMarker = text.includes('<<<LINES:');
        const hasInsertMarker = text.includes('<<<INSERT:');
        const hasDeleteMarker = text.includes('<<<DELETE:');
        return hasLinesMarker || hasInsertMarker || hasDeleteMarker;
    };

    // 当输入文本变化时检测格式
    useEffect(() => {
        if (importText.trim()) {
            const isEditInstruction = detectEditInstruction(importText);
            if (isEditInstruction) {
                setEditWarning({
                    type: 'edit_instruction',
                    hasCurrentCode: !!currentCode && currentCode.trim().length > 0
                });
            } else {
                setEditWarning(null);
            }
        } else {
            setEditWarning(null);
        }
    }, [importText, currentCode]);

    const t = (key) => {
        const translations = {
            en: {
                title: 'Direct Import',
                tabGenerator: 'Prompt Generator',
                tabImport: 'Import Result',
                keywordsLabel: 'Describe what you want to build',
                keywordsPlaceholder: 'e.g., Medieval castle with towers, Japanese shrine, Modern skyscraper...',
                generateBtn: 'Generate Prompt',
                promptLabel: 'Copy this prompt to use with ChatGPT, Claude, etc.',
                copyBtn: 'Copy Prompt',
                copiedBtn: 'Copied!',
                nextStep: 'After getting AI output, go to',
                importTab: 'Import Result',
                importLabel: 'Paste AI-generated code here',
                importPlaceholder: 'Paste the JavaScript code from AI here...',
                importBtn: 'Import & Build',
                clearBtn: 'Clear All Blocks',
                cancelBtn: 'Cancel',
                step1: 'Step 1: Generate Prompt',
                step2: 'Step 2: Import Result',
                editWarningNoCode: '⚠️ This looks like a modification instruction (<<<LINES:...>>>), not complete code. You need existing code on canvas to apply this modification.',
                editWarningHasCode: '✏️ Detected modification instruction. Click "Apply Modification" to merge with existing code on canvas.',
                applyEditBtn: 'Apply Modification',
                editApplied: 'Modification applied successfully!'
            },
            zh: {
                title: '直接导入',
                tabGenerator: '提示词生成',
                tabImport: '导入结果',
                keywordsLabel: '描述你想要建造的内容',
                keywordsPlaceholder: '例如：中世纪城堡带塔楼、日式神社、现代摩天大楼...',
                generateBtn: '生成提示词',
                promptLabel: '复制此提示词到 ChatGPT、Claude 等 AI 使用',
                copyBtn: '复制提示词',
                copiedBtn: '已复制!',
                nextStep: '获得 AI 输出后，前往',
                importTab: '导入结果',
                importLabel: '在此粘贴 AI 生成的代码',
                importPlaceholder: '将 AI 生成的 JavaScript 代码粘贴到这里...',
                importBtn: '导入并构建',
                clearBtn: '清空所有方块',
                cancelBtn: '取消',
                step1: '步骤 1：生成提示词',
                step2: '步骤 2：导入结果',
                editWarningNoCode: '⚠️ 这看起来是修改指令（<<<LINES:...>>>），不是完整代码。你需要先在画布上有现有代码才能应用此修改。',
                editWarningHasCode: '✏️ 检测到修改指令。点击"应用修改"将其合并到画布上的现有代码。',
                applyEditBtn: '应用修改',
                editApplied: '修改已成功应用！'
            }
        };
        return translations[language]?.[key] || translations.en[key] || key;
    };

    if (!isOpen) return null;

    const handleGeneratePrompt = () => {
        if (keywords.trim()) {
            const prompt = generateExternalPrompt(keywords.trim());
            setGeneratedPrompt(prompt);
        }
    };

    const handleCopyPrompt = async () => {
        if (generatedPrompt) {
            await navigator.clipboard.writeText(generatedPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleImport = () => {
        if (importText.trim()) {
            onImport(importText);
            setImportText('');
            setKeywords('');
            setGeneratedPrompt('');
            setEditWarning(null);
            onClose();
        }
    };

    // 应用修改指令到现有代码
    const handleApplyEdit = () => {
        if (importText.trim() && currentCode && currentCode.trim()) {
            try {
                const mergedCode = applyCodeEdit(currentCode, importText);
                onImport(mergedCode);
                setImportText('');
                setKeywords('');
                setGeneratedPrompt('');
                setEditWarning(null);
                onClose();
            } catch (err) {
                console.error('Failed to apply edit:', err);
                // 如果应用失败，尝试直接导入
                onImport(importText);
                setImportText('');
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center font-sans p-4">
            <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <FileInput size={20} className="text-orange-400" />
                        <h2 className="text-lg font-bold text-white tracking-wide">{t('title')}</h2>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4 flex gap-2">
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'generator'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                            }`}
                    >
                        <Sparkles size={14} />
                        {t('tabGenerator')}
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'import'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                            }`}
                    >
                        <ClipboardPaste size={14} />
                        {t('tabImport')}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 min-h-[400px]">
                    {activeTab === 'generator' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                                <p className="text-xs text-orange-400/80">{t('step1')}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-neutral-400 block">{t('keywordsLabel')}</label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder={t('keywordsPlaceholder')}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-600"
                                    onKeyDown={(e) => e.key === 'Enter' && handleGeneratePrompt()}
                                />
                            </div>

                            <button
                                onClick={handleGeneratePrompt}
                                disabled={!keywords.trim()}
                                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Sparkles size={16} />
                                {t('generateBtn')}
                            </button>

                            {generatedPrompt && (
                                <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-neutral-400">{t('promptLabel')}</label>
                                        <button
                                            onClick={handleCopyPrompt}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${copied
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                                                }`}
                                        >
                                            {copied ? <Check size={12} /> : <Copy size={12} />}
                                            {copied ? t('copiedBtn') : t('copyBtn')}
                                        </button>
                                    </div>
                                    <div className="bg-black/60 border border-white/10 rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar">
                                        <pre className="text-xs text-neutral-400 font-mono whitespace-pre-wrap break-words">{generatedPrompt}</pre>
                                    </div>

                                    <div className="flex items-center justify-center gap-2 pt-2 text-xs text-neutral-500">
                                        <span>{t('nextStep')}</span>
                                        <button
                                            onClick={() => setActiveTab('import')}
                                            className="text-green-400 hover:text-green-300 font-medium flex items-center gap-1"
                                        >
                                            {t('importTab')}
                                            <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'import' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                                <p className="text-xs text-green-400/80">{t('step2')}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-neutral-400 block">{t('importLabel')}</label>
                                <textarea
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                    placeholder={t('importPlaceholder')}
                                    className="w-full h-64 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-200 font-mono focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none transition-all placeholder:text-neutral-700 resize-none"
                                />
                            </div>

                            {/* 修改指令警告 */}
                            {editWarning && (
                                <div className={`rounded-lg p-3 flex items-start gap-3 animate-in slide-in-from-top-2 duration-200 ${
                                    editWarning.hasCurrentCode 
                                        ? 'bg-blue-500/10 border border-blue-500/30' 
                                        : 'bg-yellow-500/10 border border-yellow-500/30'
                                }`}>
                                    {editWarning.hasCurrentCode ? (
                                        <Edit3 size={16} className="text-blue-400 mt-0.5 shrink-0" />
                                    ) : (
                                        <AlertTriangle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                                    )}
                                    <p className={`text-xs ${editWarning.hasCurrentCode ? 'text-blue-300' : 'text-yellow-300'}`}>
                                        {editWarning.hasCurrentCode ? t('editWarningHasCode') : t('editWarningNoCode')}
                                    </p>
                                </div>
                            )}

                            {/* 按钮区域 */}
                            <div className="flex gap-3">
                                {/* 应用修改按钮 - 仅当检测到修改指令且有现有代码时显示 */}
                                {editWarning?.hasCurrentCode && (
                                    <button
                                        onClick={handleApplyEdit}
                                        disabled={disabled}
                                        className={`flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Edit3 size={16} />
                                        {t('applyEditBtn')}
                                    </button>
                                )}

                                {/* 直接导入按钮 */}
                                <button
                                    onClick={handleImport}
                                    disabled={!importText.trim() || disabled}
                                    className={`${editWarning?.hasCurrentCode ? 'flex-1' : 'w-full'} py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                                >
                                    <ClipboardPaste size={16} />
                                    {t('importBtn')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex justify-between">
                    <button
                        onClick={() => { if (!disabled) { onClear(); onClose(); } }}
                        disabled={disabled}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Trash2 size={14} />
                        {t('clearBtn')}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                    >
                        {t('cancelBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
}

