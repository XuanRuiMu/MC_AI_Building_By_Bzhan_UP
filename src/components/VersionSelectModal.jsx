import { useState, useRef, useEffect } from 'react';
import { X, Gamepad2, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { VERSION_GROUPS, DATAPACK_VERSIONS } from '../utils/versionConfig';

export default function VersionSelectModal({ isOpen, onClose, onSelect, exportType }) {
    const [selectedVersion, setSelectedVersion] = useState('1.21');
    const [fileName, setFileName] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const finalName = fileName.trim() || 'my_structure';
        onSelect(selectedVersion, finalName);
    };

    // Use filtered versions for datapack export
    const availableVersions = exportType === 'datapack' ? DATAPACK_VERSIONS : VERSION_GROUPS;
    const selectedConfig = availableVersions.find(v => v.id === selectedVersion) || VERSION_GROUPS.find(v => v.id === selectedVersion);

    const isDatapack = exportType === 'datapack';

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center font-sans p-4">
            <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-visible animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <Gamepad2 size={20} className="text-blue-400" />
                        <h2 className="text-lg font-bold text-white tracking-wide">导出设置</h2>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* File Name Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                            {isDatapack ? '结构名称' : '文件名'}
                        </label>
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase())}
                            placeholder="my_structure"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-neutral-600"
                            autoFocus
                        />
                        <p className="text-[10px] text-neutral-600">
                            {isDatapack ? '仅允许小写字母、数字和下划线' : '仅允许字母、数字、下划线和连字符'}
                        </p>
                    </div>

                    {/* Version Dropdown - Custom */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Minecraft 版本</label>
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full flex items-center justify-between bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all focus:outline-none focus:border-blue-500/50"
                            >
                                <span className="font-medium">
                                    {selectedConfig?.label}
                                    {selectedConfig?.isLatest && <span className="text-green-400 ml-2 text-xs">(推荐)</span>}
                                </span>
                                <ChevronDown size={16} className={`text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto">
                                    {availableVersions.map((version) => (
                                        <button
                                            key={version.id}
                                            onClick={() => {
                                                setSelectedVersion(version.id);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors ${
                                                selectedVersion === version.id ? 'bg-blue-500/20 text-white' : 'text-neutral-300'
                                            }`}
                                        >
                                            <span>
                                                {version.label}
                                                {version.isLatest && <span className="text-green-400 ml-2 text-xs">(推荐)</span>}
                                                {version.isLegacy && <span className="text-yellow-400 ml-2 text-xs">(Legacy)</span>}
                                            </span>
                                            {selectedVersion === version.id && <Check size={14} className="text-blue-400" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warning for legacy versions */}
                    {selectedConfig?.isLegacy && (
                        <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20 flex items-start gap-2">
                            <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-yellow-300">
                                <span className="font-bold">注意：</span> 旧版本使用数字方块ID格式。部分新方块将被自动替换为兼容方块。
                            </p>
                        </div>
                    )}

                    {/* Datapack command preview */}
                    {isDatapack && (
                        <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                            <p className="text-xs text-emerald-300">
                                <span className="font-bold">命令预览:</span>
                                <code className="font-mono ml-2">/function {fileName || 'my_structure'}:build</code>
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                    >
                        导出
                    </button>
                </div>
            </div>
        </div>
    );
}
