import React, { useState } from 'react';
import { X, Package, Info } from 'lucide-react';
import { VERSION_GROUPS } from '../utils/versionConfig';

export default function ExportDatapackModal({ isOpen, onClose, onConfirm, selectedVersion = '1.21' }) {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const versionConfig = VERSION_GROUPS.find(v => v.id === selectedVersion) || VERSION_GROUPS[0];

    const handleConfirm = () => {
        const finalName = name.trim() || 'my_structure';
        onConfirm(finalName, selectedVersion);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center font-sans p-4">
            <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <Package size={20} className="text-emerald-400" />
                        <h2 className="text-lg font-bold text-white tracking-wide">导出数据包</h2>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Version Badge */}
                    <div className="flex items-center gap-2 bg-blue-500/10 rounded-lg px-3 py-2 border border-blue-500/20">
                        <Info size={14} className="text-blue-400" />
                        <span className="text-xs text-blue-300">
                            目标版本: <span className="font-bold text-white">{versionConfig.label}</span>
                            <span className="text-blue-400 ml-2">pack_format: {versionConfig.packFormat}</span>
                        </span>
                    </div>

                    <p className="text-sm text-neutral-400">
                        输入结构名称，将用于 <span className="text-white font-mono bg-white/10 px-1 rounded">/function namespace:build</span> 命令。
                    </p>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">结构名称</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                            placeholder="my_structure"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-neutral-700"
                            autoFocus
                        />
                        <p className="text-[10px] text-neutral-600">
                            仅允许小写字母、数字和下划线。
                        </p>
                    </div>

                    <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                        <p className="text-xs text-emerald-300">
                            <span className="font-bold">命令预览:</span>
                            <br />
                            <code className="font-mono">/function {name || 'my_structure'}:build</code>
                        </p>
                    </div>
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
                        className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                    >
                        下载数据包
                    </button>
                </div>
            </div>
        </div>
    );
}
