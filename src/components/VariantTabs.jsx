import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * VariantTabs 组件 - 显示并发生成结果的标签页导航
 * @param {Object} props
 * @param {Array} props.variants - 所有变体数据
 * @param {number} props.activeIndex - 当前选中的索引
 * @param {Function} props.onSwitch - 切换回调 (index) => void
 * @param {boolean} props.isSwitching - 是否正在切换中
 * @param {string} props.mode - 生成模式 ('fast' | 'workflow' | 'agentSkills')
 */
export default function VariantTabs({ variants, activeIndex, onSwitch, isSwitching = false, mode = 'fast' }) {
  if (!variants || variants.length <= 1) {
    return null; // 只有一个变体时不显示标签页
  }

  const isAgentMode = mode === 'workflow' || mode === 'agentSkills';

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3 px-3 py-2 bg-neutral-800/50 border border-white/5 rounded-lg max-w-full overflow-hidden">
      {variants.map((variant, index) => {
        const isActive = index === activeIndex;
        const isGenerating = variant.status === 'generating';
        const isError = variant.status === 'error';
        // Agent 模式下生成中也可以切换，Fast 模式下生成中不能切换
        const isDisabled = isAgentMode ? isSwitching : (isGenerating || isSwitching);

        return (
          <button
            key={variant.id}
            onClick={() => !isDisabled && onSwitch(index)}
            disabled={isDisabled}
            className={`
              relative px-3 py-1.5 rounded-md text-xs font-medium transition-all flex-shrink-0
              ${isActive
                ? isAgentMode
                  ? 'bg-purple-500/10 border border-purple-500 text-purple-400'
                  : 'bg-orange-500/10 border border-orange-500 text-orange-400'
                : 'bg-neutral-900/50 border border-white/5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isError ? 'border-red-500/50 text-red-400' : ''}
            `}
          >
            <div className="flex items-center gap-1">
              <span>{index + 1}</span>
              {isGenerating && (
                <Loader2 size={12} className={`animate-spin ${isAgentMode ? 'text-purple-400' : 'text-cyan-400'}`} />
              )}
              {isError && (
                <AlertCircle size={12} className="text-red-400" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
