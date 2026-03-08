/**
 * BlockToolsPanel - Right-side panel for block operations
 * Appears when blocks are selected. Provides rotation, flip, delete, etc.
 */
import React, { useEffect } from 'react';
import useStore from '../store/useStore';
import './BlockToolsPanel.css';

export default function BlockToolsPanel() {
    const selectedBlockIds = useStore((state) => state.selectedBlockIds);
    const blocks = useStore((state) => state.blocks);
    const deleteBlocks = useStore((state) => state.deleteBlocks);
    const rotateBlocks = useStore((state) => state.rotateBlocks);
    const flipBlocks = useStore((state) => state.flipBlocks);
    const undo = useStore((state) => state.undo);
    const redo = useStore((state) => state.redo);
    const canUndo = useStore((state) => state.canUndo);
    const canRedo = useStore((state) => state.canRedo);
    const blockEditHistory = useStore((state) => state.blockEditHistory);
    const blockEditHistoryIndex = useStore((state) => state.blockEditHistoryIndex);
    const clearSelection = useStore((state) => state.clearSelection);
    const controlMode = useStore((state) => state.controlMode);

    // Get selected blocks data
    const selectedBlocks = blocks.filter(b => selectedBlockIds.includes(b.id));

    // Check if any selected block is a stair
    const hasStairs = selectedBlocks.some(b => b.type?.includes('stairs'));

    // Keyboard shortcut for undo (Ctrl+Z) - only in orbit mode
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Disable all editing shortcuts in GAME mode
            if (controlMode === 'minecraft') return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            // Redo: Ctrl+Shift+Z or Ctrl+Y
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redo();
            }
            // Delete key
            if (e.key === 'Delete' && selectedBlockIds.length > 0) {
                e.preventDefault();
                deleteBlocks(selectedBlockIds);
            }
            // Escape to clear selection
            if (e.key === 'Escape') {
                clearSelection();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, deleteBlocks, selectedBlockIds, clearSelection, controlMode]);

    // Don't show if nothing selected OR if in GAME mode
    if (selectedBlockIds.length === 0 || controlMode === 'minecraft') {
        return null;
    }

    return (
        <div className="block-tools-panel">
            <div className="panel-header">
                <h3>🔧 Block Tools</h3>
                <span className="selection-count">{selectedBlockIds.length} selected</span>
            </div>

            {/* Selected block info */}
            <div className="panel-section">
                <div className="section-title">Selection</div>
                <div className="block-types">
                    {[...new Set(selectedBlocks.map(b => b.type))].slice(0, 5).map(type => (
                        <span key={type} className="block-type-tag">{type}</span>
                    ))}
                    {[...new Set(selectedBlocks.map(b => b.type))].length > 5 && (
                        <span className="block-type-tag">+{[...new Set(selectedBlocks.map(b => b.type))].length - 5} more</span>
                    )}
                </div>
            </div>

            {/* Stair-specific controls */}
            {hasStairs && (
                <div className="panel-section">
                    <div className="section-title">⬆️ Stair Transform</div>

                    <div className="button-group">
                        <button
                            className="tool-btn"
                            onClick={() => rotateBlocks(selectedBlockIds, false)}
                            title="Rotate Counter-clockwise (↺)"
                        >
                            ↺ CCW
                        </button>
                        <button
                            className="tool-btn"
                            onClick={() => rotateBlocks(selectedBlockIds, true)}
                            title="Rotate Clockwise (↻)"
                        >
                            ↻ CW
                        </button>
                    </div>

                    <div className="button-group">
                        <button
                            className="tool-btn"
                            onClick={() => flipBlocks(selectedBlockIds, 'vertical')}
                            title="Flip Up/Down"
                        >
                            ⇅ Up/Down
                        </button>
                    </div>

                    <div className="button-group">
                        <button
                            className="tool-btn"
                            onClick={() => flipBlocks(selectedBlockIds, 'horizontal-x')}
                            title="Flip East/West"
                        >
                            ⇆ E/W
                        </button>
                        <button
                            className="tool-btn"
                            onClick={() => flipBlocks(selectedBlockIds, 'horizontal-z')}
                            title="Flip North/South"
                        >
                            ⇄ N/S
                        </button>
                    </div>
                </div>
            )}

            {/* General actions */}
            <div className="panel-section">
                <div className="section-title">🛠️ Actions</div>

                <button
                    className="tool-btn danger"
                    onClick={() => deleteBlocks(selectedBlockIds)}
                >
                    🗑️ Delete ({selectedBlockIds.length})
                </button>

                <button
                    className="tool-btn secondary"
                    onClick={clearSelection}
                >
                    ✕ Clear Selection
                </button>
            </div>

            {/* Undo/Redo */}
            <div className="panel-section">
                <div className="section-title">↩️ History</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        className="tool-btn"
                        onClick={undo}
                        disabled={!canUndo()}
                        style={{ flex: 1 }}
                    >
                        ↩️ Undo
                    </button>
                    <button
                        className="tool-btn"
                        onClick={redo}
                        disabled={!canRedo()}
                        style={{ flex: 1 }}
                    >
                        ↪️ Redo
                    </button>
                </div>
                <div className="history-count">
                    {blockEditHistoryIndex + 1} / {blockEditHistory.length} steps
                </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="panel-section hints">
                <div className="hint">Delete: <kbd>Del</kbd></div>
                <div className="hint">Undo: <kbd>Ctrl</kbd>+<kbd>Z</kbd></div>
                <div className="hint">Redo: <kbd>Ctrl</kbd>+<kbd>Y</kbd></div>
                <div className="hint">Deselect: <kbd>Esc</kbd></div>
                <div className="hint">Move: <kbd>Gizmo Axis</kbd></div>
            </div>
        </div>
    );
}
