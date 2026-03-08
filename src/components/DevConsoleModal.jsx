import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Terminal, Copy, Trash2, ChevronDown, ChevronRight, Move, ArrowDown } from 'lucide-react';

export default function DevConsoleModal({ isOpen, onClose, logs, onClear }) {
    const scrollRef = useRef(null);
    const windowRef = useRef(null);

    // Window position & size
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [size, setSize] = useState({ width: 600, height: 500 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeEdge, setResizeEdge] = useState(null); // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [autoScroll, setAutoScroll] = useState(true);
    
    // Collapsed messages state: { [turnIndex]: boolean }
    const [collapsedTurns, setCollapsedTurns] = useState({});
    // Collapsed long messages: { [logIndex]: boolean }
    const [collapsedLogs, setCollapsedLogs] = useState({});

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isOpen, autoScroll]);

    // Drag handlers
    const handleMouseDown = (e) => {
        if (windowRef.current && e.target.closest('.drag-handle')) {
            setIsDragging(true);
            const rect = windowRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    // Resize handlers
    const handleResizeStart = (e, edge) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeEdge(edge);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) {
                setPosition({
                    x: Math.max(0, e.clientX - dragOffset.x),
                    y: Math.max(0, e.clientY - dragOffset.y)
                });
            } else if (isResizing && windowRef.current) {
                const rect = windowRef.current.getBoundingClientRect();
                const minWidth = 400;
                const minHeight = 300;
                
                let newWidth = size.width;
                let newHeight = size.height;
                let newX = position.x;
                let newY = position.y;

                if (resizeEdge.includes('e')) {
                    newWidth = Math.max(minWidth, e.clientX - rect.left);
                }
                if (resizeEdge.includes('w')) {
                    const delta = rect.left - e.clientX;
                    newWidth = Math.max(minWidth, size.width + delta);
                    if (newWidth > minWidth) newX = e.clientX;
                }
                if (resizeEdge.includes('s')) {
                    newHeight = Math.max(minHeight, e.clientY - rect.top);
                }
                if (resizeEdge.includes('n')) {
                    const delta = rect.top - e.clientY;
                    newHeight = Math.max(minHeight, size.height + delta);
                    if (newHeight > minHeight) newY = e.clientY;
                }

                setSize({ width: newWidth, height: newHeight });
                setPosition({ x: newX, y: newY });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            setResizeEdge(null);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragOffset, resizeEdge, size, position]);

    // Group logs by turn (each USER message starts a new turn)
    const groupedLogs = useCallback(() => {
        const turns = [];
        let currentTurn = null;
        let turnIndex = 0;

        logs.forEach((log, index) => {
            if (log.type === 'user' || log.type === 'section') {
                // Start a new turn
                if (currentTurn) {
                    turns.push(currentTurn);
                }
                turnIndex++;
                currentTurn = {
                    turnIndex,
                    userMessage: log.type === 'user' ? log.content : log.title,
                    isSection: log.type === 'section',
                    logs: [{ ...log, originalIndex: index }]
                };
            } else if (currentTurn) {
                currentTurn.logs.push({ ...log, originalIndex: index });
            } else {
                // Logs before first user message
                if (!currentTurn) {
                    turnIndex++;
                    currentTurn = {
                        turnIndex,
                        userMessage: '初始化',
                        isSection: false,
                        logs: []
                    };
                }
                currentTurn.logs.push({ ...log, originalIndex: index });
            }
        });

        if (currentTurn) {
            turns.push(currentTurn);
        }

        return turns;
    }, [logs]);

    const toggleTurn = (turnIndex) => {
        setCollapsedTurns(prev => ({
            ...prev,
            [turnIndex]: !prev[turnIndex]
        }));
    };

    const toggleLog = (logIndex) => {
        setCollapsedLogs(prev => {
            const current = prev[logIndex];
            // undefined/true (collapsed) -> false (expanded)
            // false (expanded) -> true (collapsed)
            return {
                ...prev,
                [logIndex]: current === false ? true : false
            };
        });
    };

    if (!isOpen) return null;

    const handleCopy = () => {
        const text = logs.map(log => {
            if (log.type === 'section') return `\n${'='.repeat(60)}\n${log.title}\n${'='.repeat(60)}`;
            if (log.type === 'system') return `[SYSTEM PROMPT]\n${log.content}`;
            if (log.type === 'user') return `[USER]\n${log.content}`;
            if (log.type === 'ai') return `[AI]\n${log.content}`;
            if (log.type === 'tool_call') return `[TOOL CALL: ${log.name}]\n${JSON.stringify(log.args, null, 2)}`;
            if (log.type === 'tool_result') return `[TOOL RESULT: ${log.name}]\n${JSON.stringify(log.result, null, 2)}`;
            if (log.type === 'code') return `[CODE]\n${log.content}`;
            if (log.type === 'error') return `[ERROR]\n${log.content}`;
            return log.content || '';
        }).join('\n\n');
        navigator.clipboard.writeText(text);
    };

    const getLogStyle = (type) => {
        switch (type) {
            case 'section': return 'text-orange-400 font-bold text-sm border-b border-orange-500/30 pb-2 mb-2 mt-4';
            case 'system': return 'text-purple-400 bg-purple-500/10 border-l-2 border-purple-500';
            case 'user': return 'text-cyan-400 bg-cyan-500/10 border-l-2 border-cyan-500';
            case 'ai': return 'text-green-400 bg-green-500/10 border-l-2 border-green-500';
            case 'ai_streaming': return 'text-green-300 bg-green-500/5 border-l-2 border-green-400 animate-pulse';
            case 'stream': return 'text-green-300 bg-green-500/5 border-l-2 border-green-400';
            case 'stream_tool_start': return 'text-yellow-300 bg-yellow-500/10 border-l-2 border-yellow-400';
            case 'stream_tool_args': return 'text-amber-300 bg-amber-500/5 border-l-2 border-amber-400 font-mono';
            case 'tool_call': return 'text-yellow-400 bg-yellow-500/10 border-l-2 border-yellow-500';
            case 'tool_result': return 'text-blue-400 bg-blue-500/10 border-l-2 border-blue-500';
            case 'code': return 'text-amber-300 bg-black/40 border border-amber-500/20 font-mono text-xs';
            case 'error': return 'text-red-400 bg-red-500/10 border-l-2 border-red-500';
            case 'info': return 'text-neutral-400 bg-neutral-500/5 border-l-2 border-neutral-500';
            case 'warning': return 'text-orange-400 bg-orange-500/10 border-l-2 border-orange-500';
            default: return 'text-neutral-300';
        }
    };

    const getLogLabel = (type) => {
        switch (type) {
            case 'system': return '📋 SYSTEM PROMPT';
            case 'user': return '👤 USER';
            case 'ai': return '🤖 AI RESPONSE';
            case 'ai_streaming': return '🤖 AI GENERATING...';
            case 'stream': return '💭 AI THINKING';
            case 'stream_tool_start': return '🔧 TOOL STARTING';
            case 'stream_tool_args': return '⚡ GENERATING';
            case 'tool_call': return '📞 TOOL CALL';
            case 'tool_result': return '📤 TOOL RESULT';
            case 'code': return '📝 CODE';
            case 'error': return '❌ ERROR';
            case 'info': return 'ℹ️ INFO';
            case 'warning': return '⚠️ WARNING';
            default: return '';
        }
    };

    // Check if content is long (more than 5 lines or 300 chars)
    const isLongContent = (content) => {
        if (!content) return false;
        const str = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        return str.split('\n').length > 5 || str.length > 300;
    };

    // Truncate content for preview
    const truncateContent = (content, maxLines = 3) => {
        if (!content) return '';
        const str = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        const lines = str.split('\n');
        if (lines.length <= maxLines) return str;
        return lines.slice(0, maxLines).join('\n') + '\n...';
    };

    const turns = groupedLogs();

    // Resize edge components
    const ResizeEdge = ({ edge, cursor, className }) => (
        <div
            onMouseDown={(e) => handleResizeStart(e, edge)}
            className={`absolute ${className} hover:bg-orange-500/30 transition-colors`}
            style={{ cursor }}
        />
    );

    return (
        <div
            ref={windowRef}
            onMouseDown={handleMouseDown}
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
            className="fixed z-[9999] flex flex-col rounded-xl overflow-hidden border border-orange-500/30 bg-[#0a0a0a]/95 backdrop-blur shadow-2xl shadow-black/50"
        >
            {/* Resize edges */}
            <ResizeEdge edge="n" cursor="ns-resize" className="top-0 left-2 right-2 h-1" />
            <ResizeEdge edge="s" cursor="ns-resize" className="bottom-0 left-2 right-2 h-1" />
            <ResizeEdge edge="e" cursor="ew-resize" className="right-0 top-2 bottom-2 w-1" />
            <ResizeEdge edge="w" cursor="ew-resize" className="left-0 top-2 bottom-2 w-1" />
            <ResizeEdge edge="ne" cursor="nesw-resize" className="top-0 right-0 w-3 h-3" />
            <ResizeEdge edge="nw" cursor="nwse-resize" className="top-0 left-0 w-3 h-3" />
            <ResizeEdge edge="se" cursor="nwse-resize" className="bottom-0 right-0 w-3 h-3" />
            <ResizeEdge edge="sw" cursor="nesw-resize" className="bottom-0 left-0 w-3 h-3" />

            {/* Header / Drag Handle */}
            <div className="drag-handle px-3 py-2 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-orange-900/40 to-black/60 shrink-0 cursor-grab active:cursor-grabbing select-none hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-500/20 p-1 rounded">
                        <Terminal size={14} className="text-orange-500" />
                    </div>
                    <h2 className="text-xs font-bold text-neutral-200 tracking-wide">DEV CONSOLE</h2>
                    <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded-full font-mono">
                        {turns.length} 轮
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={`p-1.5 rounded transition-colors mr-2 ${autoScroll ? 'text-green-400 bg-green-500/10' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}
                        title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
                    >
                        <ArrowDown size={14} className={autoScroll ? "" : "opacity-50"} />
                    </button>
                    <div className="flex items-center gap-1 pr-2 border-r border-white/5 mr-2">
                        <Move size={12} className="text-neutral-600" />
                        <span className="text-[10px] text-neutral-600">Drag</span>
                    </div>
                    <button onClick={handleCopy} className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/10 rounded transition-colors" title="Copy All">
                        <Copy size={12} />
                    </button>
                    <button onClick={onClear} className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Clear Log">
                        <Trash2 size={12} />
                    </button>
                    <button onClick={onClose} className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/10 rounded transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Log Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[11px] custom-scrollbar select-text">
                {turns.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                        <Terminal size={32} className="mb-3 opacity-20" />
                        <p>Waiting for Agent tasks...</p>
                    </div>
                ) : (
                    turns.map((turn, tIdx) => {
                        const isCollapsed = collapsedTurns[turn.turnIndex];
                        const isLastTurn = tIdx === turns.length - 1;
                        
                        return (
                            <div key={turn.turnIndex} className="border border-white/5 rounded-lg overflow-hidden">
                                {/* Turn Header - Clickable to collapse */}
                                <div
                                    onClick={() => !isLastTurn && toggleTurn(turn.turnIndex)}
                                    className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${
                                        turn.isSection 
                                            ? 'from-orange-900/30 to-transparent' 
                                            : 'from-cyan-900/20 to-transparent'
                                    } ${!isLastTurn ? 'cursor-pointer hover:bg-white/5' : ''} transition-colors`}
                                >
                                    {!isLastTurn && (
                                        isCollapsed 
                                            ? <ChevronRight size={14} className="text-neutral-500" />
                                            : <ChevronDown size={14} className="text-neutral-500" />
                                    )}
                                    <span className="text-[10px] font-bold text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">
                                        #{turn.turnIndex}
                                    </span>
                                    <span className={`text-xs font-medium truncate flex-1 ${turn.isSection ? 'text-orange-400' : 'text-cyan-400'}`}>
                                        {turn.isSection ? `📋 ${turn.userMessage}` : `👤 ${turn.userMessage?.slice(0, 50)}${turn.userMessage?.length > 50 ? '...' : ''}`}
                                    </span>
                                    <span className="text-[10px] text-neutral-600">
                                        {turn.logs.length} 条
                                    </span>
                                </div>

                                {/* Turn Content */}
                                {(!isCollapsed || isLastTurn) && (
                                    <div className="p-2 space-y-2 bg-black/20">
                                        {turn.logs.map((log) => {
                                            let content;
                                            if (log.type === 'tool_call') {
                                                content = log.args ? JSON.stringify(log.args, null, 2) : '';
                                            } else if (log.type === 'tool_result') {
                                                content = log.result ? JSON.stringify(log.result, null, 2) : '';
                                            } else {
                                                // Ensure content is always a string
                                                const rawContent = log.content;
                                                if (rawContent === null || rawContent === undefined) {
                                                    content = '';
                                                } else if (typeof rawContent === 'string') {
                                                    content = rawContent;
                                                } else {
                                                    content = JSON.stringify(rawContent, null, 2);
                                                }
                                            }
                                            const isLong = isLongContent(content) || log.type === 'tool_call' || log.type === 'tool_result';
                                            const isLogCollapsed = collapsedLogs[log.originalIndex];

                                            // Skip user message in content since it's in header
                                            if (log.type === 'user' || log.type === 'section') return null;

                                            return (
                                                <div key={log.originalIndex} className={`p-2 rounded ${getLogStyle(log.type)}`}>
                                                    <div className="flex items-center gap-2 mb-1 opacity-70 border-b border-white/5 pb-1">
                                                        <span className="font-bold uppercase tracking-wider text-[10px]">{getLogLabel(log.type)}</span>
                                                        {log.name && <span className="font-normal text-neutral-400 text-[10px]">{log.name}</span>}
                                                        <span className="ml-auto text-neutral-600 text-[9px]">#{turn.turnIndex}</span>
                                                        {isLong && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleLog(log.originalIndex); }}
                                                                className="text-[9px] text-neutral-500 hover:text-white px-1 py-0.5 rounded bg-white/5 hover:bg-white/10"
                                                            >
                                                                {isLogCollapsed ? '展开' : '折叠'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <pre className="whitespace-pre-wrap break-words leading-relaxed font-mono text-[10px]">
                                                        {/* 流式输出时展开，完成后自动折叠（除非用户手动展开） */}
                                                        {(() => {
                                                            // Ensure we always render a string
                                                            const displayContent = log.type === 'ai_streaming'
                                                                ? content
                                                                : isLong && isLogCollapsed !== false
                                                                    ? truncateContent(content)
                                                                    : content;
                                                            // Final safety check
                                                            if (typeof displayContent === 'string') return displayContent;
                                                            if (displayContent === null || displayContent === undefined) return '';
                                                            return JSON.stringify(displayContent, null, 2);
                                                        })()}
                                                    </pre>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
