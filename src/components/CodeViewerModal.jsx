import React from 'react';
import { X, Copy, Check } from 'lucide-react';

export default function CodeViewerModal({ isOpen, onClose, code, title }) {
    const [copied, setCopied] = React.useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
                    <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                        <span className="text-blue-400">JS</span>
                        {title || 'Generated Voxel Script'}
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="p-1.5 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                            title="Copy Code"
                        >
                            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Code Content */}
                <div className="flex-1 overflow-auto custom-scrollbar bg-[#1e1e1e] p-4">
                    <pre className="font-mono text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap break-words">
                        {code}
                    </pre>
                </div>

                {/* Footer info */}
                <div className="px-4 py-2 border-t border-white/5 bg-white/5 text-[10px] text-neutral-500 flex justify-between">
                    <span>{code.split('\n').length} lines</span>
                    <span>JavaScript Voxel API</span>
                </div>
            </div>
        </div>
    );
}
