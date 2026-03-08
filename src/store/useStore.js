import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { processVoxels } from '../utils/architectureEngine';
import { executeVoxelScript } from '../utils/sandbox';

// Server-first storage: localStorage only stores minimal settings
// All session data (blocks, messages, snapshots) stored on server
const minimalStorage = {
    getItem: (name) => {
        try {
            const data = localStorage.getItem(name);
            return data;
        } catch (e) {
            console.warn('Failed to read from localStorage:', e);
            return null;
        }
    },
    setItem: (name, value) => {
        try {
            localStorage.setItem(name, value);
        } catch (e) {
            console.warn('[Storage] Failed to save settings:', e);
        }
    },
    removeItem: (name) => {
        try {
            localStorage.removeItem(name);
        } catch (e) {
            console.warn('Failed to remove from localStorage:', e);
        }
    }
};

const useStore = create(
    persist(
        (set, get) => ({
            // View State
            language: 'zh',
            setLanguage: (lang) => set({ language: lang }),
            viewMode: 'mc',
            setViewMode: (mode) => set({ viewMode: mode }),
            controlMode: 'orbit', // 'orbit' | 'minecraft'
            setControlMode: (mode) => set({ controlMode: mode }),
            isFlying: false,
            setIsFlying: (isFlying) => set({ isFlying }),
            isLocked: false,
            setIsLocked: (isLocked) => set({ isLocked }),
            flySpeed: 1.0, // Speed multiplier (x0.1 to x10, log scale)
            setFlySpeed: (speed) => set({ flySpeed: Math.max(0.1, Math.min(10, Math.round(speed * 100) / 100)) }),

            // Chat History Undo/Redo - INCREMENTAL SNAPSHOTS
            // First snapshot is 'full', subsequent ones are 'incremental' (only diffs)
            chatSnapshots: [], // Array of full or incremental snapshots
            snapshotIndex: -1, // Current position in snapshot history
            maxSnapshots: 1000, // With incremental, we can store many more!

            // Last generated code - saved in snapshots for undo/redo
            lastGeneratedCode: null,
            setLastGeneratedCode: (code) => set({ lastGeneratedCode: code }),

            // Helper: Create a diff between two states
            _createDiff: (oldState, newState) => {
                // Helper to create a content fingerprint for a block
                const getBlockHash = (b) => `${b.id}|${b.type}|${b.position.join(',')}|${JSON.stringify(b.properties || {})}`;

                // Create maps for O(1) lookup
                const oldBlockMap = new Map(oldState.blocks.map(b => [b.id, b]));
                const newBlockMap = new Map(newState.blocks.map(b => [b.id, b]));

                const blocksAdded = [];
                const blocksRemoved = [];

                // 1. Detect Removed Blocks (In old but not in new)
                for (const oldBlock of oldState.blocks) {
                    if (!newBlockMap.has(oldBlock.id)) {
                        blocksRemoved.push(oldBlock.id);
                    }
                }

                // 2. Detect Added or Modified Blocks
                for (const newBlock of newState.blocks) {
                    const oldBlock = oldBlockMap.get(newBlock.id);
                    if (!oldBlock) {
                        // New ID = Added
                        blocksAdded.push(newBlock);
                    } else if (getBlockHash(newBlock) !== getBlockHash(oldBlock)) {
                        // Same ID but different content = Modified
                        // Treat as remove + add
                        blocksRemoved.push(oldBlock.id);
                        blocksAdded.push(newBlock);
                    }
                }

                // Find added/removed semantic voxels by content hash
                // Semantic voxels don't always have stable IDs, so we rely on position/content
                const getVoxelHash = (v) => `${v.position.join(',')}|${v.type}`;
                const oldVoxelHashes = new Set(oldState.semanticVoxels.map(getVoxelHash));
                const newVoxelHashes = new Set(newState.semanticVoxels.map(getVoxelHash));

                const voxelsAdded = newState.semanticVoxels.filter(v => !oldVoxelHashes.has(getVoxelHash(v)));
                const voxelsRemoved = oldState.semanticVoxels
                    .filter(v => !newVoxelHashes.has(getVoxelHash(v)))
                    // For voxels, we might verify by position if needed, but hash-based removal is tricky without IDs
                    // Simpler strategy: Just store the position keys for removal, assuming strict position mapping
                    .map(v => `${v.position[0]},${v.position[1]},${v.position[2]}`);

                // Messages: 检测消息内容的变化（包括 variants 的变化）
                // 创建消息的哈希来检测变化
                const getMessageHash = (m) => JSON.stringify({
                    role: m.role,
                    content: m.content,
                    id: m.id,
                    variants: m.variants ? m.variants.length : 0,
                    activeVariantIndex: m.activeVariantIndex,
                    concurrencyCount: m.concurrencyCount
                });
                
                // 检查现有消息是否有变化
                const minLen = Math.min(oldState.messages.length, newState.messages.length);
                let messagesModified = false;
                for (let i = 0; i < minLen; i++) {
                    if (getMessageHash(oldState.messages[i]) !== getMessageHash(newState.messages[i])) {
                        messagesModified = true;
                        break;
                    }
                }
                
                // 如果消息有修改，保存完整的消息数组
                // 否则只保存新增/删除的消息
                let messagesAdded = [];
                let messagesRemoved = 0;
                let fullMessages = null;
                
                if (messagesModified) {
                    // 消息内容有变化，保存完整的消息数组
                    fullMessages = [...newState.messages];
                } else {
                    // 只保存增量
                    messagesAdded = newState.messages.slice(oldState.messages.length);
                    messagesRemoved = oldState.messages.length - (newState.messages.length - messagesAdded.length);
                }

                // Code: track if lastGeneratedCode changed
                const codeChanged = oldState.lastGeneratedCode !== newState.lastGeneratedCode;

                return {
                    type: 'incremental',
                    blocksAdded,
                    blocksRemoved, // IDs of removed blocks
                    voxelsAdded,
                    voxelsRemoved, // Position keys of removed voxels
                    messagesAdded,
                    messagesRemoved: Math.max(0, messagesRemoved),
                    fullMessages, // 如果消息有修改，保存完整数组
                    // Only store code if it changed (to save space)
                    ...(codeChanged ? { lastGeneratedCode: newState.lastGeneratedCode } : {})
                };
            },

            // Helper: Rebuild state from snapshots up to targetIndex
            _rebuildStateFromSnapshots: (snapshots, targetIndex) => {
                if (targetIndex < 0 || targetIndex >= snapshots.length) return null;

                // Find the most recent full snapshot at or before targetIndex
                let baseIndex = targetIndex;
                while (baseIndex > 0 && snapshots[baseIndex].type === 'incremental') {
                    baseIndex--;
                }

                // Start with the base full snapshot
                const baseSnapshot = snapshots[baseIndex];
                if (!baseSnapshot || baseSnapshot.type !== 'full') return null;

                let state = {
                    messages: [...baseSnapshot.messages],
                    blocks: [...baseSnapshot.blocks],
                    semanticVoxels: [...baseSnapshot.semanticVoxels],
                    lastGeneratedCode: baseSnapshot.lastGeneratedCode || null
                };

                // Apply incremental diffs from baseIndex+1 to targetIndex
                for (let i = baseIndex + 1; i <= targetIndex; i++) {
                    const diff = snapshots[i];
                    if (diff.type !== 'incremental') continue;

                    // Apply block changes
                    if (diff.blocksRemoved?.length > 0) {
                        const removeSet = new Set(diff.blocksRemoved);
                        state.blocks = state.blocks.filter(b => !removeSet.has(b.id));
                    }
                    if (diff.blocksAdded?.length > 0) {
                        state.blocks = [...state.blocks, ...diff.blocksAdded];
                    }

                    // Apply voxel changes
                    if (diff.voxelsRemoved?.length > 0) {
                        const removeSet = new Set(diff.voxelsRemoved);
                        state.semanticVoxels = state.semanticVoxels.filter(v =>
                            !removeSet.has(`${v.position[0]},${v.position[1]},${v.position[2]}`));
                    }
                    if (diff.voxelsAdded?.length > 0) {
                        state.semanticVoxels = [...state.semanticVoxels, ...diff.voxelsAdded];
                    }

                    // Apply message changes
                    if (diff.fullMessages) {
                        // 如果有完整的消息数组，直接使用
                        state.messages = [...diff.fullMessages];
                    } else {
                        // 否则应用增量变化
                        if (diff.messagesRemoved > 0) {
                            state.messages = state.messages.slice(0, -diff.messagesRemoved);
                        }
                        if (diff.messagesAdded?.length > 0) {
                            state.messages = [...state.messages, ...diff.messagesAdded];
                        }
                    }

                    // Apply code changes (only if present in diff)
                    if ('lastGeneratedCode' in diff) {
                        state.lastGeneratedCode = diff.lastGeneratedCode;
                    }
                }

                return state;
            },

            pushChatSnapshot: (beforeState = null) => {
                // IMPORTANT: Get fresh state to ensure we have the latest snapshotIndex
                const state = get();
                const currentIndex = state.snapshotIndex;
                const currentSnapshots = state.chatSnapshots;

                // DEBUG: Log the state before truncation
                console.log('[pushChatSnapshot] Before:', {
                    snapshotIndex: currentIndex,
                    totalSnapshots: currentSnapshots.length,
                    willTruncateTo: currentIndex + 1,
                    snapshotTypes: currentSnapshots.map(s => s.type)
                });

                // CRITICAL: Truncate future snapshots when user is at an earlier position
                // This implements "branching" - when you undo and make a new action, future history is discarded
                // If snapshotIndex is -1 (no snapshots yet), slice(0, 0) gives empty array - correct!
                // If snapshotIndex is 0 (at first snapshot), slice(0, 1) keeps first snapshot - correct!
                let newSnapshots = currentSnapshots.slice(0, currentIndex + 1);

                // DEBUG: Log after truncation
                console.log('[pushChatSnapshot] After truncation:', {
                    newSnapshotsLength: newSnapshots.length,
                    truncatedCount: currentSnapshots.length - newSnapshots.length
                });

                // If this is the FIRST snapshot ever, save the "before" state first
                if (newSnapshots.length === 0) {
                    if (beforeState) {
                        // Use provided beforeState
                        newSnapshots.push({
                            type: 'full',
                            messages: [...beforeState.messages],
                            blocks: [...beforeState.blocks],
                            semanticVoxels: [...beforeState.semanticVoxels],
                            lastGeneratedCode: beforeState.lastGeneratedCode || null
                        });
                    } else {
                        // No beforeState provided, create initial empty state
                        newSnapshots.push({
                            type: 'full',
                            messages: [],
                            blocks: [],
                            semanticVoxels: [],
                            lastGeneratedCode: null
                        });
                    }
                }

                // Get the previous state to diff against
                const prevState = newSnapshots.length > 0
                    ? get()._rebuildStateFromSnapshots(newSnapshots, newSnapshots.length - 1)
                    : null;

                if (prevState) {
                    // Create incremental diff
                    const currentState = {
                        messages: state.currentMessages,
                        blocks: state.blocks,
                        semanticVoxels: state.semanticVoxels,
                        lastGeneratedCode: state.lastGeneratedCode
                    };
                    const diff = get()._createDiff(prevState, currentState);
                    
                    // Only add snapshot if there are actual changes
                    const hasChanges = diff.blocksAdded?.length > 0 || 
                                       diff.blocksRemoved?.length > 0 ||
                                       diff.voxelsAdded?.length > 0 ||
                                       diff.voxelsRemoved?.length > 0 ||
                                       diff.messagesAdded?.length > 0 ||
                                       diff.messagesRemoved > 0 ||
                                       ('lastGeneratedCode' in diff);
                    
                    if (hasChanges) {
                        newSnapshots.push(diff);
                    } else {
                        console.log('[pushChatSnapshot] No changes detected, skipping snapshot');
                    }
                } else {
                    // No previous state, save as full snapshot
                    newSnapshots.push({
                        type: 'full',
                        messages: [...state.currentMessages],
                        blocks: [...state.blocks],
                        semanticVoxels: [...state.semanticVoxels],
                        lastGeneratedCode: state.lastGeneratedCode
                    });
                }

                // Create a new full checkpoint every 50 snapshots for faster rebuilds
                if (newSnapshots.length > 0 && newSnapshots.length % 50 === 0) {
                    const lastSnapshot = newSnapshots[newSnapshots.length - 1];
                    if (lastSnapshot.type === 'incremental') {
                        const rebuilt = get()._rebuildStateFromSnapshots(newSnapshots, newSnapshots.length - 1);
                        if (rebuilt) {
                            newSnapshots[newSnapshots.length - 1] = {
                                type: 'full',
                                messages: rebuilt.messages,
                                blocks: rebuilt.blocks,
                                semanticVoxels: rebuilt.semanticVoxels,
                                lastGeneratedCode: rebuilt.lastGeneratedCode
                            };
                        }
                    }
                }

                // Keep only the last N snapshots
                if (newSnapshots.length > state.maxSnapshots) {
                    // When trimming, ensure we keep full snapshots at boundaries
                    const trimCount = newSnapshots.length - state.maxSnapshots;
                    newSnapshots = newSnapshots.slice(trimCount);

                    // Ensure first snapshot is full
                    if (newSnapshots.length > 0 && newSnapshots[0].type === 'incremental') {
                        const rebuilt = get()._rebuildStateFromSnapshots(
                            state.chatSnapshots,
                            trimCount
                        );
                        if (rebuilt) {
                            newSnapshots[0] = {
                                type: 'full',
                                messages: rebuilt.messages,
                                blocks: rebuilt.blocks,
                                semanticVoxels: rebuilt.semanticVoxels,
                                lastGeneratedCode: rebuilt.lastGeneratedCode
                            };
                        }
                    }
                }

                set({
                    chatSnapshots: newSnapshots,
                    snapshotIndex: newSnapshots.length - 1
                });
                
                // DEBUG: Log final state after push AND verify it was applied
                const verifyState = get();
                console.log('[pushChatSnapshot] Final state:', {
                    newSnapshotIndex: newSnapshots.length - 1,
                    totalSnapshots: newSnapshots.length,
                    snapshotTypes: newSnapshots.map(s => s.type),
                    // Verify the state was actually updated
                    verifiedIndex: verifyState.snapshotIndex,
                    verifiedLength: verifyState.chatSnapshots.length
                });
            },

            undoChat: () => {
                const state = get();
                console.log('[undoChat] Current state:', {
                    snapshotIndex: state.snapshotIndex,
                    totalSnapshots: state.chatSnapshots.length,
                    canUndo: state.snapshotIndex > 0
                });
                
                if (state.snapshotIndex <= 0) return false; // Nothing to undo

                const newIndex = state.snapshotIndex - 1;
                const rebuilt = get()._rebuildStateFromSnapshots(state.chatSnapshots, newIndex);

                if (rebuilt) {
                    // 找到最后一条有 variants 的 AI 消息
                    const lastAiMsgWithVariants = [...rebuilt.messages].reverse().find(
                        m => m.role === 'ai' && m.variants && m.variants.length > 1
                    );
                    
                    // 如果有变体消息，使用选中变体的 blocks
                    let finalBlocks = rebuilt.blocks;
                    let finalVoxels = rebuilt.semanticVoxels;
                    
                    if (lastAiMsgWithVariants) {
                        const activeIndex = lastAiMsgWithVariants.activeVariantIndex || 0;
                        const activeVariant = lastAiMsgWithVariants.variants[activeIndex];
                        if (activeVariant && activeVariant.blocks) {
                            finalBlocks = activeVariant.blocks;
                            finalVoxels = activeVariant.semanticVoxels || rebuilt.semanticVoxels;
                            console.log(`[undoChat] Using variant ${activeIndex} blocks`);
                        }
                    }
                    
                    console.log('[undoChat] Moving to index:', newIndex, 'code:', rebuilt.lastGeneratedCode ? 'yes' : 'no');
                    set({
                        currentMessages: rebuilt.messages,
                        blocks: finalBlocks,
                        semanticVoxels: finalVoxels,
                        snapshotIndex: newIndex,
                        lastGeneratedCode: rebuilt.lastGeneratedCode,
                        apiConversationHistory: [] // Clear API history on undo to prevent stale context
                    });
                    // Save the new snapshotIndex to session
                    get().saveCurrentSession();
                    return true;
                }
                return false;
            },

            redoChat: () => {
                const state = get();
                console.log('[redoChat] Current state:', {
                    snapshotIndex: state.snapshotIndex,
                    totalSnapshots: state.chatSnapshots.length,
                    canRedo: state.snapshotIndex < state.chatSnapshots.length - 1
                });
                
                if (state.snapshotIndex >= state.chatSnapshots.length - 1) return false; // Nothing to redo

                const newIndex = state.snapshotIndex + 1;
                const rebuilt = get()._rebuildStateFromSnapshots(state.chatSnapshots, newIndex);

                if (rebuilt) {
                    // 找到最后一条有 variants 的 AI 消息
                    const lastAiMsgWithVariants = [...rebuilt.messages].reverse().find(
                        m => m.role === 'ai' && m.variants && m.variants.length > 1
                    );
                    
                    // 如果有变体消息，使用选中变体的 blocks
                    let finalBlocks = rebuilt.blocks;
                    let finalVoxels = rebuilt.semanticVoxels;
                    
                    if (lastAiMsgWithVariants) {
                        const activeIndex = lastAiMsgWithVariants.activeVariantIndex || 0;
                        const activeVariant = lastAiMsgWithVariants.variants[activeIndex];
                        if (activeVariant && activeVariant.blocks) {
                            finalBlocks = activeVariant.blocks;
                            finalVoxels = activeVariant.semanticVoxels || rebuilt.semanticVoxels;
                            console.log(`[redoChat] Using variant ${activeIndex} blocks`);
                        }
                    }
                    
                    console.log('[redoChat] Moving to index:', newIndex, 'code:', rebuilt.lastGeneratedCode ? 'yes' : 'no');
                    set({
                        currentMessages: rebuilt.messages,
                        blocks: finalBlocks,
                        semanticVoxels: finalVoxels,
                        snapshotIndex: newIndex,
                        lastGeneratedCode: rebuilt.lastGeneratedCode,
                        apiConversationHistory: [] // Clear API history on redo to prevent stale context
                    });
                    // Save the new snapshotIndex to session
                    get().saveCurrentSession();
                    return true;
                }
                return false;
            },

            // Jump to a specific snapshot by index
            jumpToSnapshot: (targetIndex) => {
                const state = get();
                if (targetIndex < 0 || targetIndex >= state.chatSnapshots.length) return false;

                const rebuilt = get()._rebuildStateFromSnapshots(state.chatSnapshots, targetIndex);
                if (rebuilt) {
                    // 找到最后一条有 variants 的 AI 消息
                    const lastAiMsgWithVariants = [...rebuilt.messages].reverse().find(
                        m => m.role === 'ai' && m.variants && m.variants.length > 1
                    );
                    
                    // 如果有变体消息，使用选中变体的 blocks
                    let finalBlocks = rebuilt.blocks;
                    let finalVoxels = rebuilt.semanticVoxels;
                    
                    if (lastAiMsgWithVariants) {
                        const activeIndex = lastAiMsgWithVariants.activeVariantIndex || 0;
                        const activeVariant = lastAiMsgWithVariants.variants[activeIndex];
                        if (activeVariant && activeVariant.blocks) {
                            finalBlocks = activeVariant.blocks;
                            finalVoxels = activeVariant.semanticVoxels || rebuilt.semanticVoxels;
                            console.log(`[jumpToSnapshot] Using variant ${activeIndex} blocks`);
                        }
                    }
                    
                    set({
                        currentMessages: rebuilt.messages,
                        blocks: finalBlocks,
                        semanticVoxels: finalVoxels,
                        snapshotIndex: targetIndex,
                        lastGeneratedCode: rebuilt.lastGeneratedCode,
                        apiConversationHistory: [] // Clear API history on jump
                    });
                    return true;
                }
                return false;
            },

            canUndoChat: () => get().snapshotIndex > 0,
            canRedoChat: () => get().snapshotIndex < get().chatSnapshots.length - 1,

            // Multi-selection State
            selectedBlockIds: [],
            anchorBlockId: null,

            selectBlock: (id, modifiers = {}) => {
                const { ctrlKey = false, shiftKey = false } = modifiers;
                const state = get();
                const currentSelection = state.selectedBlockIds;
                const anchorId = state.anchorBlockId;

                if (shiftKey && anchorId !== null) {
                    const anchorBlock = state.blocks.find(b => b.id === anchorId);
                    const targetBlock = state.blocks.find(b => b.id === id);

                    if (anchorBlock && targetBlock) {
                        const minX = Math.min(anchorBlock.position[0], targetBlock.position[0]);
                        const maxX = Math.max(anchorBlock.position[0], targetBlock.position[0]);
                        const minY = Math.min(anchorBlock.position[1], targetBlock.position[1]);
                        const maxY = Math.max(anchorBlock.position[1], targetBlock.position[1]);
                        const minZ = Math.min(anchorBlock.position[2], targetBlock.position[2]);
                        const maxZ = Math.max(anchorBlock.position[2], targetBlock.position[2]);

                        const rangeIds = state.blocks
                            .filter(b =>
                                b.position[0] >= minX && b.position[0] <= maxX &&
                                b.position[1] >= minY && b.position[1] <= maxY &&
                                b.position[2] >= minZ && b.position[2] <= maxZ
                            )
                            .map(b => b.id);

                        if (ctrlKey) {
                            const merged = new Set([...currentSelection, ...rangeIds]);
                            set({ selectedBlockIds: Array.from(merged) });
                        } else {
                            set({ selectedBlockIds: rangeIds });
                        }
                    }
                } else if (ctrlKey) {
                    const isSelected = currentSelection.includes(id);
                    if (isSelected) {
                        set({
                            selectedBlockIds: currentSelection.filter(bid => bid !== id)
                        });
                    } else {
                        set({
                            selectedBlockIds: [...currentSelection, id],
                            anchorBlockId: id
                        });
                    }
                } else {
                    set({
                        selectedBlockIds: [id],
                        anchorBlockId: id
                    });
                }
            },

            clearSelection: () => set({ selectedBlockIds: [], anchorBlockId: null }),

            get selectedBlockId() {
                return get().selectedBlockIds[0] || null;
            },

            // ============ BLOCK EDIT HISTORY (for manual edits like drag/move) ============
            // Separate from chatSnapshots - this is for quick undo of block manipulations
            blockEditHistory: [],
            blockEditHistoryIndex: -1,
            MAX_BLOCK_EDIT_HISTORY: 50,

            pushHistory: () => {
                const state = get();
                const snapshot = {
                    blocks: JSON.parse(JSON.stringify(state.blocks)),
                    timestamp: Date.now()
                };
                
                // Truncate future history if we're not at the end
                const newHistory = state.blockEditHistory.slice(0, state.blockEditHistoryIndex + 1);
                newHistory.push(snapshot);
                
                // Limit history size
                if (newHistory.length > state.MAX_BLOCK_EDIT_HISTORY) {
                    newHistory.shift();
                }
                
                set({
                    blockEditHistory: newHistory,
                    blockEditHistoryIndex: newHistory.length - 1
                });
                
                console.log('[pushHistory] Saved block state, history length:', newHistory.length);
            },

            undo: () => {
                const state = get();
                if (state.blockEditHistoryIndex <= 0) {
                    console.log('[undo] Nothing to undo');
                    return false;
                }
                
                const newIndex = state.blockEditHistoryIndex - 1;
                const snapshot = state.blockEditHistory[newIndex];
                
                if (snapshot) {
                    set({
                        blocks: JSON.parse(JSON.stringify(snapshot.blocks)),
                        blockEditHistoryIndex: newIndex
                    });
                    console.log('[undo] Restored to index:', newIndex);
                    return true;
                }
                return false;
            },

            redo: () => {
                const state = get();
                if (state.blockEditHistoryIndex >= state.blockEditHistory.length - 1) {
                    console.log('[redo] Nothing to redo');
                    return false;
                }
                
                const newIndex = state.blockEditHistoryIndex + 1;
                const snapshot = state.blockEditHistory[newIndex];
                
                if (snapshot) {
                    set({
                        blocks: JSON.parse(JSON.stringify(snapshot.blocks)),
                        blockEditHistoryIndex: newIndex
                    });
                    console.log('[redo] Restored to index:', newIndex);
                    return true;
                }
                return false;
            },

            canUndo: () => get().blockEditHistoryIndex > 0,
            canRedo: () => get().blockEditHistoryIndex < get().blockEditHistory.length - 1,

            // ============ BLOCK OPERATIONS ============
            updateBlockProperties: (blockIds, changes) => {
                const state = get();
                const beforeState = {
                    messages: state.currentMessages,
                    blocks: state.blocks,
                    semanticVoxels: state.semanticVoxels
                };

                const newBlocks = state.blocks.map(block => {
                    if (blockIds.includes(block.id)) {
                        return { ...block, ...changes };
                    }
                    return block;
                });
                set({ blocks: newBlocks });

                get().pushChatSnapshot(beforeState);
                get().saveCurrentSession();
            },

            deleteBlocks: (blockIds) => {
                const state = get();
                const beforeState = {
                    messages: state.currentMessages,
                    blocks: state.blocks,
                    semanticVoxels: state.semanticVoxels
                };

                const newBlocks = state.blocks.filter(b => !blockIds.includes(b.id));
                set({ blocks: newBlocks, selectedBlockIds: [] });

                get().pushChatSnapshot(beforeState);
                get().saveCurrentSession();
            },

            rotateBlocks: (blockIds, clockwise = true) => {
                const state = get();
                const beforeState = {
                    messages: state.currentMessages,
                    blocks: state.blocks,
                    semanticVoxels: state.semanticVoxels
                };

                const rotationMap = clockwise
                    ? { north: 'east', east: 'south', south: 'west', west: 'north' }
                    : { north: 'west', west: 'south', south: 'east', east: 'north' };

                const newBlocks = state.blocks.map(block => {
                    if (blockIds.includes(block.id) && block.properties) {
                        let newProps = block.properties;
                        const facingMatch = block.properties.match(/facing=(\w+)/);
                        if (facingMatch) {
                            const currentFacing = facingMatch[1];
                            const newFacing = rotationMap[currentFacing] || currentFacing;
                            newProps = block.properties.replace(/facing=\w+/, `facing=${newFacing}`);
                        }
                        return { ...block, properties: newProps };
                    }
                    return block;
                });
                set({ blocks: newBlocks });

                get().pushChatSnapshot(beforeState);
                get().saveCurrentSession();
            },

            flipBlocks: (blockIds, axis) => {
                const state = get();
                const beforeState = {
                    messages: state.currentMessages,
                    blocks: state.blocks,
                    semanticVoxels: state.semanticVoxels
                };

                const newBlocks = state.blocks.map(block => {
                    if (blockIds.includes(block.id) && block.properties) {
                        let newProps = block.properties;
                        if (axis === 'vertical') {
                            if (newProps.includes('half=bottom')) newProps = newProps.replace('half=bottom', 'half=top');
                            else if (newProps.includes('half=top')) newProps = newProps.replace('half=top', 'half=bottom');
                            else newProps = newProps ? newProps + ',half=top' : 'half=top';
                        } else if (axis === 'horizontal-x') {
                            if (newProps.includes('facing=east')) newProps = newProps.replace('facing=east', 'facing=west');
                            else if (newProps.includes('facing=west')) newProps = newProps.replace('facing=west', 'facing=east');
                        } else if (axis === 'horizontal-z') {
                            if (newProps.includes('facing=north')) newProps = newProps.replace('facing=north', 'facing=south');
                            else if (newProps.includes('facing=south')) newProps = newProps.replace('facing=south', 'facing=north');
                        }
                        return { ...block, properties: newProps };
                    }
                    return block;
                });
                set({ blocks: newBlocks });

                get().pushChatSnapshot(beforeState);
                get().saveCurrentSession();
            },

            moveBlocks: (blockIds, dx, dy, dz) => {
                const state = get();
                const beforeState = {
                    messages: state.currentMessages,
                    blocks: state.blocks,
                    semanticVoxels: state.semanticVoxels
                };

                const newBlocks = state.blocks.map(block => {
                    if (blockIds.includes(block.id)) {
                        return {
                            ...block,
                            position: [
                                Math.round(block.position[0] + dx),
                                Math.round(block.position[1] + dy),
                                Math.round(block.position[2] + dz)
                            ]
                        };
                    }
                    return block;
                });

                const newSemanticVoxels = state.semanticVoxels.map(v => {
                    const isMoved = state.blocks.some(b =>
                        blockIds.includes(b.id) &&
                        Math.abs(b.position[0] - v.position[0]) < 0.1 &&
                        Math.abs(b.position[1] - v.position[1]) < 0.1 &&
                        Math.abs(b.position[2] - v.position[2]) < 0.1
                    );
                    if (isMoved) {
                        return {
                            ...v,
                            position: [
                                Math.round(v.position[0] + dx),
                                Math.round(v.position[1] + dy),
                                Math.round(v.position[2] + dz)
                            ]
                        };
                    }
                    return v;
                });

                set({ blocks: newBlocks, semanticVoxels: newSemanticVoxels });

                get().pushChatSnapshot(beforeState);
                get().saveCurrentSession();
            },

            updateBlocksPosition: (blockIds, dx, dy, dz) => {
                const state = get();
                const blockIdSet = new Set(blockIds);

                const newBlocks = state.blocks.map(block => {
                    if (blockIdSet.has(block.id)) {
                        return {
                            ...block,
                            position: [
                                block.position[0] + dx,
                                block.position[1] + dy,
                                block.position[2] + dz
                            ]
                        };
                    }
                    return block;
                });
                set({ blocks: newBlocks });
            },

            finalizeBlocksPosition: (blockIds) => {
                const state = get();
                const blockIdSet = new Set(blockIds);
                const oldToNewPosMap = new Map();

                const newBlocks = state.blocks.map(block => {
                    if (blockIdSet.has(block.id)) {
                        const newPos = [
                            Math.round(block.position[0]),
                            Math.round(block.position[1]),
                            Math.round(block.position[2])
                        ];
                        const oldKey = `${block.position[0].toFixed(1)},${block.position[1].toFixed(1)},${block.position[2].toFixed(1)}`;
                        oldToNewPosMap.set(oldKey, newPos);
                        return { ...block, position: newPos };
                    }
                    return block;
                });

                const newSemanticVoxels = state.semanticVoxels.map(v => {
                    const posKey = `${v.position[0].toFixed(1)},${v.position[1].toFixed(1)},${v.position[2].toFixed(1)}`;
                    const newPos = oldToNewPosMap.get(posKey);
                    if (newPos) return { ...v, position: newPos };
                    return v;
                });

                set({ blocks: newBlocks, semanticVoxels: newSemanticVoxels });

                get().pushChatSnapshot(); // Diff against previous state (before drag)
                get().saveCurrentSession();
            },

            // Current Canvas State
            semanticVoxels: [],
            blocks: [],

            // Session State
            sessions: [],
            currentSessionId: null,
            currentMessages: [],
            apiConversationHistory: [], // API conversation history for multi-turn context

            // Concurrent Generation State (runtime only, not persisted)
            currentConcurrentGeneration: null, // { messageId, count, completed, variants: [] }

            // Actions
            startConcurrentGeneration: (messageId, count, mode = 'fast') => {
                set({
                    currentConcurrentGeneration: {
                        messageId,
                        count,
                        completed: 0,
                        mode, // 'fast' | 'workflow' | 'agentSkills'
                        activeViewIndex: 0, // 当前查看的变体索引（agent 模式用）
                        variants: Array(count).fill(null).map((_, i) => ({
                            id: `variant-${i}`,
                            status: 'generating',
                            content: '',
                            blocks: [],
                            semanticVoxels: [],
                            generatedAt: 0,
                            agentSteps: [] // agent 模式的工作流程步骤
                        }))
                    }
                });
            },

            updateVariant: (variantId, data) => {
                const state = get();
                if (!state.currentConcurrentGeneration) return;
                
                const { messageId, variants: oldVariants, mode } = state.currentConcurrentGeneration;
                const isAgentMode = mode === 'workflow' || mode === 'agentSkills';
                
                // 更新变体
                const newVariants = oldVariants.map(v =>
                    v.id === variantId ? { ...v, ...data } : v
                );
                
                // 检查是否是第一个完成的变体
                const wasFirstCompleted = !oldVariants.some(v => v.status === 'done');
                const isNowCompleted = data.status === 'done';
                const isFirstCompleted = wasFirstCompleted && isNowCompleted;
                
                // 排序逻辑：agent 模式保持自然顺序，fast 模式按完成时间排序
                let sortedVariants;
                if (isAgentMode) {
                    // Agent 模式：保持自然顺序（1, 2, 3, 4）
                    sortedVariants = newVariants;
                } else {
                    // Fast 模式：按完成时间排序（已完成的在前）
                    sortedVariants = [...newVariants].sort((a, b) => {
                        if (a.status === 'done' && b.status !== 'done') return -1;
                        if (a.status !== 'done' && b.status === 'done') return 1;
                        if (a.status === 'done' && b.status === 'done') {
                            return a.generatedAt - b.generatedAt;
                        }
                        return 0;
                    });
                }
                
                // 如果是第一个完成的变体，立即更新消息和 3D 场景（仅 fast 模式）
                if (isFirstCompleted && data.blocks && !isAgentMode) {
                    console.log(`[updateVariant] First variant completed (fast mode), updating scene`);
                    set({
                        currentConcurrentGeneration: {
                            ...state.currentConcurrentGeneration,
                            variants: sortedVariants,
                            completed: sortedVariants.filter(v => v.status !== 'generating').length
                        },
                        // 更新消息，显示第一个完成的变体
                        currentMessages: state.currentMessages.map(msg => 
                            msg.id === messageId
                                ? {
                                    ...msg,
                                    variants: sortedVariants,
                                    activeVariantIndex: 0,
                                    concurrencyCount: sortedVariants.length,
                                    content: data.content
                                }
                                : msg
                        ),
                        // 更新 3D 场景
                        blocks: data.blocks,
                        semanticVoxels: data.semanticVoxels || []
                    });
                } else {
                    // 不是第一个完成的，或者是 agent 模式，只更新变体状态
                    set({
                        currentConcurrentGeneration: {
                            ...state.currentConcurrentGeneration,
                            variants: sortedVariants,
                            completed: sortedVariants.filter(v => v.status !== 'generating').length
                        },
                        // 更新消息中的 variants（但不改变 activeVariantIndex 和 3D 场景）
                        currentMessages: state.currentMessages.map(msg => 
                            msg.id === messageId
                                ? {
                                    ...msg,
                                    variants: sortedVariants,
                                    concurrencyCount: sortedVariants.length
                                }
                                : msg
                        )
                    });
                }
            },

            finalizeConcurrentGeneration: () => {
                const state = get();
                if (!state.currentConcurrentGeneration) return;

                const { messageId, variants, mode } = state.currentConcurrentGeneration;
                const isAgentMode = mode === 'workflow' || mode === 'agentSkills';

                // 排序逻辑：agent 模式保持自然顺序，fast 模式按完成时间排序
                let sortedVariants;
                if (isAgentMode) {
                    // Agent 模式：保持自然顺序
                    sortedVariants = variants;
                } else {
                    // Fast 模式：按完成时间排序（已完成的在前）
                    sortedVariants = [...variants].sort((a, b) => {
                        if (a.status === 'done' && b.status !== 'done') return -1;
                        if (a.status !== 'done' && b.status === 'done') return 1;
                        if (a.status === 'done' && b.status === 'done') {
                            return a.generatedAt - b.generatedAt;
                        }
                        return 0;
                    });
                }

                // 清理之前消息的 variants（只保留选中的）
                // 当前消息的 variants 已经在 updateVariant 中更新了
                set(st => ({
                    currentMessages: st.currentMessages.map(msg => {
                        // 当前消息：确保 variants 是最终排序后的
                        if (msg.id === messageId) {
                            return {
                                ...msg,
                                variants: sortedVariants,
                                activeVariantIndex: msg.activeVariantIndex || 0,
                                concurrencyCount: sortedVariants.length
                            };
                        }
                        
                        // 之前的 AI 消息：清理 variants，只保留选中的
                        if (msg.role === 'ai' && msg.variants && msg.variants.length > 1) {
                            const activeVariant = msg.variants[msg.activeVariantIndex || 0];
                            return {
                                ...msg,
                                variants: undefined,
                                activeVariantIndex: undefined,
                                concurrencyCount: undefined,
                                content: activeVariant.content
                            };
                        }
                        
                        return msg;
                    }),
                    currentConcurrentGeneration: null
                }));

                get().saveCurrentSession();
            },

            clearConcurrentGeneration: () => {
                set({ currentConcurrentGeneration: null });
            },

            // 更新变体的 agentSteps（agent 模式专用）
            updateVariantAgentSteps: (variantId, stepUpdater) => {
                const state = get();
                if (!state.currentConcurrentGeneration) return;
                
                const newVariants = state.currentConcurrentGeneration.variants.map(v => {
                    if (v.id === variantId) {
                        const newSteps = typeof stepUpdater === 'function' 
                            ? stepUpdater(v.agentSteps || [])
                            : stepUpdater;
                        return { ...v, agentSteps: newSteps };
                    }
                    return v;
                });
                
                set({
                    currentConcurrentGeneration: {
                        ...state.currentConcurrentGeneration,
                        variants: newVariants
                    }
                });
            },

            // 设置当前查看的变体索引（agent 模式专用）
            setActiveViewIndex: (index) => {
                const state = get();
                if (!state.currentConcurrentGeneration) return;
                
                set({
                    currentConcurrentGeneration: {
                        ...state.currentConcurrentGeneration,
                        activeViewIndex: index
                    }
                });
            },

            // Actions
            createNewSession: () => {
                const newId = Date.now().toString();
                const newSession = {
                    id: newId,
                    title: 'New Project',
                    messages: [],
                    blocks: [],
                    semanticVoxels: [],
                    chatSnapshots: [],
                    snapshotIndex: -1,
                    apiConversationHistory: [], // NEW: Store API conversation for multi-turn context
                    devLogs: [], // Dev console logs
                    timestamp: Date.now()
                };
                set(state => {
                    // Save current session's snapshots before switching
                    const updatedSessions = state.currentSessionId
                        ? state.sessions.map(s => s.id === state.currentSessionId
                            ? { ...s, chatSnapshots: state.chatSnapshots, snapshotIndex: state.snapshotIndex, devLogs: state.devLogs }
                            : s)
                        : state.sessions;

                    // No limit on sessions - all stored on server
                    const sessions = [newSession, ...updatedSessions];
                    return {
                        sessions,
                        currentSessionId: newId,
                        currentMessages: [],
                        blocks: [],
                        semanticVoxels: [],
                        chatSnapshots: [],
                        snapshotIndex: -1,
                        apiConversationHistory: [], // Reset API conversation for new session
                        devLogs: [], // Reset dev console logs for new session
                        selectedBlockIds: [],
                        anchorBlockId: null
                    };
                });
                return newId;
            },

            switchSession: async (sessionId) => {
                const state = get();

                // Save current session's snapshots and API conversation before switching
                if (state.currentSessionId && state.currentSessionId !== sessionId) {
                    // Update sessions array with current snapshots and API conversation
                    set(st => ({
                        sessions: st.sessions.map(s => s.id === st.currentSessionId
                            ? {
                                ...s,
                                chatSnapshots: st.chatSnapshots,
                                snapshotIndex: st.snapshotIndex,
                                apiConversationHistory: st.apiConversationHistory || [], // Save API conversation
                                devLogs: st.devLogs || [] // Save dev console logs
                            }
                            : s)
                    }));

                    // Persist to server/localStorage
                    await get().saveCurrentSession();
                    console.log('[Session] Saved current session before switching');
                }

                // Show loading state
                set({ isLoadingSession: true });

                // Helper function to sync blocks with active variant
                const syncBlocksWithActiveVariant = (messages, defaultBlocks, defaultVoxels) => {
                    // 找到最后一条有 variants 的 AI 消息
                    const lastAiMsgWithVariants = [...messages].reverse().find(
                        m => m.role === 'ai' && m.variants && m.variants.length > 1
                    );
                    
                    if (lastAiMsgWithVariants) {
                        const activeIndex = lastAiMsgWithVariants.activeVariantIndex || 0;
                        const activeVariant = lastAiMsgWithVariants.variants[activeIndex];
                        if (activeVariant && activeVariant.blocks) {
                            console.log(`[switchSession] Using variant ${activeIndex} blocks`);
                            return {
                                blocks: activeVariant.blocks,
                                semanticVoxels: activeVariant.semanticVoxels || defaultVoxels
                            };
                        }
                    }
                    return { blocks: defaultBlocks, semanticVoxels: defaultVoxels };
                };

                try {
                    const res = await fetch(`http://localhost:3001/api/session/${sessionId}`);
                    if (res.ok) {
                        const remoteSession = await res.json();
                        const messages = remoteSession.messages || [];
                        const { blocks, semanticVoxels } = syncBlocksWithActiveVariant(
                            messages,
                            remoteSession.blocks || [],
                            remoteSession.semanticVoxels || []
                        );
                        
                        set({
                            currentSessionId: sessionId,
                            currentMessages: messages,
                            blocks,
                            semanticVoxels,
                            // Load session's undo/redo history
                            chatSnapshots: remoteSession.chatSnapshots || [],
                            snapshotIndex: remoteSession.snapshotIndex ?? -1,
                            // Load API conversation history
                            apiConversationHistory: remoteSession.apiConversationHistory || [],
                            // Load dev console logs
                            devLogs: remoteSession.devLogs || [],
                            selectedBlockIds: [],
                            anchorBlockId: null,
                            isLoadingSession: false
                        });
                        return;
                    }
                } catch (e) { console.warn(`Server switch failed for ${sessionId}:`, e); }

                // Fallback to local session
                const session = get().sessions.find(s => s.id === sessionId);
                if (session) {
                    const messages = session.messages || [];
                    const { blocks, semanticVoxels } = syncBlocksWithActiveVariant(
                        messages,
                        session.blocks || [],
                        session.semanticVoxels || []
                    );
                    
                    set({
                        currentSessionId: sessionId,
                        currentMessages: messages,
                        blocks,
                        semanticVoxels,
                        // Load session's undo/redo history
                        chatSnapshots: session.chatSnapshots || [],
                        snapshotIndex: session.snapshotIndex ?? -1,
                        // Load API conversation history
                        apiConversationHistory: session.apiConversationHistory || [],
                        // Load dev console logs
                        devLogs: session.devLogs || [],
                        selectedBlockIds: [],
                        anchorBlockId: null,
                        isLoadingSession: false
                    });
                } else {
                    set({ isLoadingSession: false });
                }
            },

            syncSessions: async () => {
                try {
                    const res = await fetch('http://localhost:3001/api/sessions');
                    if (!res.ok) return;
                    const remoteSessions = await res.json();
                    set(state => {
                        const localMap = new Map(state.sessions.map(s => [s.id, s]));
                        const mergedSessions = [...state.sessions];

                        remoteSessions.forEach(remote => {
                            // Only add if ID doesn't exist locally
                            // AND handle potential duplication of empty "New Project" sessions
                            if (!localMap.has(remote.id)) {
                                // Use remote session data including blocks
                                mergedSessions.push({
                                    id: remote.id,
                                    title: remote.title || 'Synced Session',
                                    timestamp: remote.timestamp,
                                    messages: remote.messages || [],
                                    blocks: remote.blocks || [],
                                    semanticVoxels: remote.semanticVoxels || [],
                                    chatSnapshots: remote.chatSnapshots || [],
                                    snapshotIndex: remote.snapshotIndex ?? -1,
                                    apiConversationHistory: remote.apiConversationHistory || [],
                                    devLogs: remote.devLogs || []
                                });
                            } else {
                                // Update existing session with remote data if remote is newer
                                const localSession = localMap.get(remote.id);
                                if (remote.timestamp > (localSession.timestamp || 0)) {
                                    const idx = mergedSessions.findIndex(s => s.id === remote.id);
                                    if (idx !== -1) {
                                        mergedSessions[idx] = {
                                            ...mergedSessions[idx],
                                            ...remote,
                                            blocks: remote.blocks || mergedSessions[idx].blocks || []
                                        };
                                    }
                                }
                            }
                        });

                        // Sort by newest first
                        mergedSessions.sort((a, b) => b.timestamp - a.timestamp);
                        return { sessions: mergedSessions };
                    });
                } catch (e) { console.warn('Failed to sync sessions:', e); }
            },

            deleteSession: async (sessionId) => {
                // Optimistic UI Update first
                set(state => {
                    const newSessions = state.sessions.filter(s => s.id !== sessionId);
                    let nextId = state.currentSessionId;
                    let nextMsgs = state.currentMessages;
                    let nextBlocks = state.blocks;
                    let nextVoxels = state.semanticVoxels;

                    if (sessionId === state.currentSessionId) {
                        if (newSessions.length > 0) {
                            const s = newSessions[0];
                            nextId = s.id; nextMsgs = s.messages; nextBlocks = s.blocks; nextVoxels = s.semanticVoxels;
                        } else {
                            nextId = null; nextMsgs = []; nextBlocks = []; nextVoxels = [];
                        }
                    }

                    return {
                        sessions: newSessions,
                        currentSessionId: nextId,
                        currentMessages: nextMsgs,
                        blocks: nextBlocks,
                        semanticVoxels: nextVoxels
                    };
                });

                // Server side delete
                try {
                    await fetch(`http://localhost:3001/api/session/${sessionId}`, { method: 'DELETE' });
                } catch (e) {
                    console.error('Failed to delete session from server:', e);
                }
            },

            updateCurrentMessages: (updater) => {
                set(state => {
                    if (!state.currentSessionId) {
                        const newId = Date.now().toString();
                        const newSession = {
                            id: newId, title: 'New Project', messages: [], blocks: [], semanticVoxels: [], timestamp: Date.now()
                        };
                        state.sessions = [newSession, ...state.sessions];
                        state.currentSessionId = newId;
                        state.currentMessages = [];
                    }
                    const currentMsgs = state.currentMessages;
                    const newMessages = typeof updater === 'function' ? updater(currentMsgs) : updater;
                    return { currentMessages: newMessages };
                });
                get().saveCurrentSession();
            },

            saveCurrentSession: () => set(state => {
                if (!state.currentSessionId) return {};
                let title = state.sessions.find(s => s.id === state.currentSessionId)?.title || 'Project';
                if (title === 'New Project' && state.currentMessages.length > 0) {
                    const firstUserMsg = state.currentMessages.find(m => m.role === 'user');
                    if (firstUserMsg) {
                        let contentStr = typeof firstUserMsg.content === 'string' ? firstUserMsg.content : 'Multimodal Input';
                        title = contentStr.slice(0, 24) + (contentStr.length > 24 ? '...' : '');
                    }
                }

                // 清理消息中的大数据（agentSteps）以减少存储大小
                const cleanMessages = state.currentMessages.map(msg => {
                    if (!msg.variants) return msg;
                    return {
                        ...msg,
                        variants: msg.variants.map(v => {
                            // 移除 agentSteps，它们太大了且不需要持久化
                            const { agentSteps, ...cleanVariant } = v;
                            return cleanVariant;
                        })
                    };
                });

                // 清理 chatSnapshots 中的 agentSteps
                const cleanSnapshots = (state.chatSnapshots || []).map(snapshot => {
                    if (!snapshot.messages) return snapshot;
                    return {
                        ...snapshot,
                        messages: snapshot.messages.map(msg => {
                            if (!msg.variants) return msg;
                            return {
                                ...msg,
                                variants: msg.variants.map(v => {
                                    const { agentSteps, ...cleanVariant } = v;
                                    return cleanVariant;
                                })
                            };
                        })
                    };
                });

                const updatedSessions = state.sessions.map(s =>
                    s.id === state.currentSessionId ? {
                        ...s,
                        title,
                        blocks: state.blocks,
                        semanticVoxels: state.semanticVoxels,
                        messages: cleanMessages,
                        chatSnapshots: cleanSnapshots,
                        snapshotIndex: state.snapshotIndex,
                        apiConversationHistory: state.apiConversationHistory || [], // Save API conversation
                        devLogs: state.devLogs || [], // Save dev console logs
                        timestamp: Date.now()
                    } : s
                );

                const currentSessionData = updatedSessions.find(s => s.id === state.currentSessionId);
                if (currentSessionData) {
                    try {
                        const jsonData = JSON.stringify(currentSessionData);
                        fetch('http://localhost:3001/api/save-session', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: jsonData
                        }).catch(err => console.error('Save Failed:', err));
                    } catch (err) {
                        console.error('JSON stringify failed (data too large):', err);
                    }
                }
                return { sessions: updatedSessions };
            }),

            setBlocks: (blocks) => set({ blocks }),
            setSemanticVoxels: (semanticVoxels) => set({ semanticVoxels }),
            startStreamingSession: () => { },

            // Diff-based block update: compare old and new voxels, only update differences
            addBlocksFromStream: (fullContent, throwOnError = false) => {
                if (!fullContent.includes('builder.')) return 0;
                
                // Execute the FULL code to get the complete new state
                // Pass throwOnError to allow auto-fix logic to catch errors
                const newVoxels = executeVoxelScript(fullContent, throwOnError);
                if (newVoxels.length === 0) {
                    if (throwOnError) {
                        throw new Error('Code executed but produced no blocks');
                    }
                    return 0;
                }
                
                // Build a map from ALL voxels (including AIR) to get final state at each position
                // AIR blocks are used to "erase" previously placed blocks (e.g., hollow out interiors)
                const finalStateMap = new Map();
                newVoxels.forEach(v => {
                    const key = `${v.position[0]},${v.position[1]},${v.position[2]}`;
                    finalStateMap.set(key, v); // Later blocks overwrite earlier ones at same position
                });
                
                // Now filter: keep non-AIR blocks from the final state
                // AIR positions mean "nothing here" - they remove blocks that were placed earlier
                const newVoxelsFiltered = [];
                finalStateMap.forEach((v, key) => {
                    if (v.type !== 'AIR') {
                        newVoxelsFiltered.push(v);
                    }
                });
                
                const currentVoxels = get().semanticVoxels;
                
                // Build maps for O(1) lookup
                const oldMap = new Map();
                const newMap = new Map();
                
                currentVoxels.forEach(v => {
                    const key = `${v.position[0]},${v.position[1]},${v.position[2]}`;
                    oldMap.set(key, v);
                });
                
                newVoxelsFiltered.forEach(v => {
                    const key = `${v.position[0]},${v.position[1]},${v.position[2]}`;
                    newMap.set(key, v);
                });
                
                // Calculate diff
                const toAdd = [];
                const toRemove = [];
                const toUpdate = [];
                let unchanged = 0;
                
                // Check new voxels: add or update
                newMap.forEach((newV, key) => {
                    const oldV = oldMap.get(key);
                    if (!oldV) {
                        toAdd.push(newV);
                    } else {
                        // Compare type and properties
                        const propsEqual = JSON.stringify(oldV.properties || {}) === JSON.stringify(newV.properties || {});
                        if (oldV.type !== newV.type || !propsEqual) {
                            toUpdate.push(newV);
                        } else {
                            unchanged++;
                        }
                    }
                });
                
                // Check removed voxels: in old but not in new
                oldMap.forEach((oldV, key) => {
                    if (!newMap.has(key)) {
                        toRemove.push(key);
                    }
                });
                
                console.log(`[Voxel Diff] Add: ${toAdd.length}, Remove: ${toRemove.length}, Update: ${toUpdate.length}, Unchanged: ${unchanged}`);
                
                // Apply diff to create final voxel list
                const finalVoxels = [];
                
                // Keep unchanged voxels from old
                currentVoxels.forEach(v => {
                    const key = `${v.position[0]},${v.position[1]},${v.position[2]}`;
                    if (newMap.has(key) && !toUpdate.some(u => 
                        u.position[0] === v.position[0] && 
                        u.position[1] === v.position[1] && 
                        u.position[2] === v.position[2]
                    )) {
                        // Keep unchanged
                        finalVoxels.push(v);
                    }
                });
                
                // Add new and updated voxels
                toAdd.forEach(v => finalVoxels.push(v));
                toUpdate.forEach(v => finalVoxels.push(v));
                
                // Process to detailed blocks
                const detailedBlocks = processVoxels(finalVoxels, 'DEFAULT');
                set({ semanticVoxels: finalVoxels, blocks: detailedBlocks });
                get().saveCurrentSession();
                
                return toAdd.length + toUpdate.length + toRemove.length;
            },

            clearBlocks: () => set({ blocks: [], semanticVoxels: [] }),
            clearAllSessions: () => set({ sessions: [], currentSessionId: null, currentMessages: [], blocks: [], semanticVoxels: [], apiConversationHistory: [] }),
            addBlocksFromText: () => 0,

            // API Conversation History Management
            setApiConversationHistory: (history) => {
                set({ apiConversationHistory: history });
                get().saveCurrentSession(); // Auto-save when conversation updates
            },

            // Dev Console Logs (per session)
            devLogs: [],
            setDevLogs: (updater) => {
                set(state => {
                    const newLogs = typeof updater === 'function' ? updater(state.devLogs) : updater;
                    return { devLogs: newLogs };
                });
            },
            addDevLog: (log) => {
                set(state => ({ devLogs: [...state.devLogs, log] }));
            },
            clearDevLogs: () => {
                set({ devLogs: [] });
            },

            // Persistent Agent Workflow State
            agentSteps: [],
            setAgentSteps: (updater) => {
                set(state => {
                    const newSteps = typeof updater === 'function' ? updater(state.agentSteps) : updater;
                    return { agentSteps: newSteps };
                });
            },

            // Loading state for session switching
            isLoadingSession: false,
            setIsLoadingSession: (loading) => set({ isLoadingSession: loading })
        }),
        {
            name: 'mc-ai-builder-settings',
            storage: minimalStorage,
            // Only persist language - always start with new session
            partialize: (state) => ({
                language: state.language
            }),
        }
    )
);

export default useStore;
