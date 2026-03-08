import React from 'react';
import useStore from '../store/useStore';
import { X, BoxSelect, Tag } from 'lucide-react';

export default function PropertiesPanel() {
    const selectedBlockId = useStore((state) => state.selectedBlockId);
    const blocks = useStore((state) => state.blocks);
    const updateBlock = useStore((state) => state.updateBlock);
    const clearSelection = () => useStore.getState().selectBlock(null);

    const selectedBlock = blocks.find(b => b.id === selectedBlockId);

    if (!selectedBlock) return null;

    return (
        <div className="absolute top-6 right-6 w-72 bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-orange-400">
                    <BoxSelect size={16} />
                    <span className="text-sm font-bold tracking-wide text-white">BLOCK EDIT</span>
                </div>
                <button onClick={clearSelection} className="text-neutral-500 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-5">

                {/* ID & Pos */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <label className="text-[10px] text-neutral-500 font-bold block mb-1">ID</label>
                        <div className="font-mono text-xs text-neutral-300">#{selectedBlock.id}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <label className="text-[10px] text-neutral-500 font-bold block mb-1">POS</label>
                        <div className="font-mono text-xs text-neutral-300">
                            {`<${selectedBlock.position.join(',')}>`}
                        </div>
                    </div>
                </div>

                {/* Type Input */}
                <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-2">
                        <Tag size={12} /> TYPE
                    </label>
                    <input
                        type="text"
                        value={selectedBlock.type || ''}
                        onChange={(e) => updateBlock(selectedBlock.id, { type: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                </div>

                {/* Properties Input */}
                <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-2">PROPERTIES</label>
                    <textarea
                        rows={2}
                        value={(!selectedBlock.properties || selectedBlock.properties === 0) ? '' : selectedBlock.properties}
                        onChange={(e) => updateBlock(selectedBlock.id, { properties: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 font-mono focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                        placeholder="facing=north"
                    />
                </div>

            </div>
        </div>
    );
}
