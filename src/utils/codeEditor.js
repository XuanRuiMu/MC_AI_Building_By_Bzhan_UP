/**
 * Utility to apply AI-generated edits to existing code strings.
 * Supports two formats:
 * 1. Line-number based: <<<LINES:10-25 ... >>> (preferred, more reliable)
 * 2. Search/Replace: <<<SEARCH ... === ... >>> (legacy)
 */

export function applyCodeEdit(originalCode, editInstruction) {
    console.log('[applyCodeEdit] Called with:', {
        originalCodeLength: originalCode?.length,
        editInstructionLength: editInstruction?.length,
        hasLinesMarker: editInstruction?.includes('<<<LINES:'),
        hasInsertMarker: editInstruction?.includes('<<<INSERT:'),
        hasSearchMarker: editInstruction?.includes('<<<SEARCH')
    });
    
    if (!originalCode) return editInstruction;

    // First, try line-number based edits (more reliable)
    const lineEdits = extractLineEdits(editInstruction);
    console.log('[applyCodeEdit] Extracted line edits:', lineEdits.length);
    
    if (lineEdits.length > 0) {
        const result = applyLineEdits(originalCode, lineEdits);
        console.log('[applyCodeEdit] Applied line edits, result length:', result.length);
        return result;
    }

    // Fall back to search/replace edits
    const searchEdits = extractSearchEdits(editInstruction);
    console.log('[applyCodeEdit] Extracted search edits:', searchEdits.length);
    
    if (searchEdits.length === 0) {
        // No edits found - check if it's a full rewrite
        if (editInstruction.includes('builder.beginGroup') || editInstruction.split('\n').length > 10) {
            console.log('[applyCodeEdit] No edits found, treating as full rewrite');
            return editInstruction;
        }
        console.log('[applyCodeEdit] No edits found, returning original');
        return originalCode;
    }

    return applySearchEdits(originalCode, searchEdits);
}

/**
 * Add line numbers to code for AI reference
 * @param {string} code - Original code
 * @returns {string} - Code with line numbers prefixed
 */
export function addLineNumbers(code) {
    if (!code) return '';
    const lines = code.split('\n');
    const padWidth = String(lines.length).length;
    return lines.map((line, i) => {
        const lineNum = String(i + 1).padStart(padWidth, ' ');
        return `${lineNum}| ${line}`;
    }).join('\n');
}

/**
 * Extract line-number based edits
 * Format: <<<LINES:startLine-endLine
 * new code here
 * >>>
 * 
 * Or for insertion: <<<INSERT:afterLine
 * new code to insert
 * >>>
 * 
 * Or for deletion: <<<DELETE:startLine-endLine>>>
 */
function extractLineEdits(text) {
    const edits = [];
    
    // First, try to extract code from ALL markdown code blocks
    // This handles cases where AI wraps edits in ```javascript ... ```
    let processText = text;
    
    // Find all code blocks that contain edit instructions
    const codeBlockRegex = /```(?:javascript|js)?\s*([\s\S]*?)```/g;
    let codeBlockMatch;
    let extractedBlocks = [];
    
    while ((codeBlockMatch = codeBlockRegex.exec(text)) !== null) {
        const blockContent = codeBlockMatch[1];
        if (blockContent.includes('<<<LINES:') || blockContent.includes('<<<INSERT:') || blockContent.includes('<<<DELETE:')) {
            extractedBlocks.push(blockContent);
        }
    }
    
    if (extractedBlocks.length > 0) {
        // Combine all code blocks with edit instructions
        processText = extractedBlocks.join('\n\n');
        console.log(`[extractLineEdits] Extracted ${extractedBlocks.length} code block(s) with edit instructions`);
    }
    
    console.log('[extractLineEdits] Input text preview:', processText.substring(0, 300));
    
    // Match LINES replacement: <<<LINES:10-25 ... >>>
    // More flexible regex: allow optional newline/whitespace after line numbers
    const linesRegex = /<<<LINES:(\d+)-(\d+)[\s\n]*([\s\S]*?)>>>/g;
    let match;
    while ((match = linesRegex.exec(processText)) !== null) {
        const newCode = match[3].trim();
        console.log(`[extractLineEdits] Found LINES:${match[1]}-${match[2]}, code length: ${newCode.length}`);
        edits.push({
            type: 'replace',
            startLine: parseInt(match[1]),
            endLine: parseInt(match[2]),
            newCode: newCode
        });
    }
    
    // Match INSERT: <<<INSERT:10 ... >>>
    const insertRegex = /<<<INSERT:(\d+)[\s\n]*([\s\S]*?)>>>/g;
    while ((match = insertRegex.exec(processText)) !== null) {
        const newCode = match[2].trim();
        console.log(`[extractLineEdits] Found INSERT:${match[1]}, code length: ${newCode.length}`);
        edits.push({
            type: 'insert',
            afterLine: parseInt(match[1]),
            newCode: newCode
        });
    }
    
    // Match DELETE: <<<DELETE:10-25>>>
    const deleteRegex = /<<<DELETE:(\d+)-(\d+)>>>/g;
    while ((match = deleteRegex.exec(processText)) !== null) {
        console.log(`[extractLineEdits] Found DELETE:${match[1]}-${match[2]}`);
        edits.push({
            type: 'delete',
            startLine: parseInt(match[1]),
            endLine: parseInt(match[2])
        });
    }
    
    // If no edits found but text contains markers, try alternative parsing
    if (edits.length === 0 && (processText.includes('<<<LINES:') || processText.includes('<<<INSERT:'))) {
        console.warn('[extractLineEdits] Standard regex failed, trying alternative parsing...');
        
        // Try to find <<<LINES:X-Y followed by any content until >>> or end
        const altLinesRegex = /<<<LINES:(\d+)-(\d+)([\s\S]*?)(?:>>>|$)/g;
        while ((match = altLinesRegex.exec(processText)) !== null) {
            let newCode = match[3];
            // Remove trailing >>> if present
            newCode = newCode.replace(/>>>$/, '').trim();
            if (newCode) {
                console.log(`[extractLineEdits] Alt parse found LINES:${match[1]}-${match[2]}`);
                edits.push({
                    type: 'replace',
                    startLine: parseInt(match[1]),
                    endLine: parseInt(match[2]),
                    newCode: newCode
                });
            }
        }
        
        const altInsertRegex = /<<<INSERT:(\d+)([\s\S]*?)(?:>>>|$)/g;
        while ((match = altInsertRegex.exec(processText)) !== null) {
            let newCode = match[2];
            newCode = newCode.replace(/>>>$/, '').trim();
            if (newCode) {
                console.log(`[extractLineEdits] Alt parse found INSERT:${match[1]}`);
                edits.push({
                    type: 'insert',
                    afterLine: parseInt(match[1]),
                    newCode: newCode
                });
            }
        }
    }
    
    console.log(`[extractLineEdits] Total edits found: ${edits.length}`);
    
    // Sort edits by line number (descending) to apply from bottom to top
    // This prevents line number shifts from affecting subsequent edits
    edits.sort((a, b) => {
        const lineA = a.startLine || a.afterLine || 0;
        const lineB = b.startLine || b.afterLine || 0;
        return lineB - lineA;
    });
    
    return edits;
}

/**
 * Apply line-number based edits
 */
function applyLineEdits(originalCode, edits) {
    // First, clean any existing edit markers from the original code
    let cleanedCode = originalCode
        .replace(/<<<LINES:\d+-\d+[\s\S]*?>>>/g, '')
        .replace(/<<<INSERT:\d+[\s\S]*?>>>/g, '')
        .replace(/<<<DELETE:\d+-\d+>>>/g, '')
        .trim();
    
    let lines = cleanedCode.split('\n');
    let appliedCount = 0;
    const appendedCode = []; // For edits that exceed line count
    
    console.log(`[CodeEditor] Original code has ${lines.length} lines`);
    console.log(`[CodeEditor] Edits to apply:`, edits.map(e => ({
        type: e.type,
        line: e.startLine || e.afterLine,
        endLine: e.endLine
    })));
    
    for (const edit of edits) {
        try {
            if (edit.type === 'replace') {
                // Replace lines startLine to endLine (1-indexed)
                const start = edit.startLine - 1; // Convert to 0-indexed
                const end = edit.endLine; // endLine is inclusive, slice end is exclusive
                
                // If start line exceeds code length, treat as append
                if (start >= lines.length) {
                    console.log(`[CodeEditor] Line ${edit.startLine} exceeds code length ${lines.length}, treating as append`);
                    appendedCode.push(edit.newCode);
                    appliedCount++;
                    continue;
                }
                
                // Validate line numbers
                if (start < 0) {
                    console.warn(`[CodeEditor] Invalid start line ${edit.startLine}`);
                    continue;
                }
                
                const newLines = edit.newCode.split('\n');
                const deleteCount = Math.min(end, lines.length) - start;
                lines.splice(start, deleteCount, ...newLines);
                appliedCount++;
                console.log(`[CodeEditor] Replaced lines ${edit.startLine}-${edit.endLine} with ${newLines.length} new lines`);
            } else if (edit.type === 'insert') {
                // Insert after specified line
                const insertAt = Math.min(edit.afterLine, lines.length); // Clamp to valid range
                const newLines = edit.newCode.split('\n');
                lines.splice(insertAt, 0, ...newLines);
                appliedCount++;
                console.log(`[CodeEditor] Inserted ${newLines.length} lines after line ${edit.afterLine}`);
            } else if (edit.type === 'delete') {
                // Delete lines startLine to endLine
                const start = edit.startLine - 1;
                if (start >= lines.length) {
                    console.warn(`[CodeEditor] Delete start line ${edit.startLine} exceeds code length, skipping`);
                    continue;
                }
                const count = Math.min(edit.endLine - edit.startLine + 1, lines.length - start);
                lines.splice(start, count);
                appliedCount++;
                console.log(`[CodeEditor] Deleted lines ${edit.startLine}-${edit.endLine}`);
            }
        } catch (e) {
            console.warn(`[CodeEditor] Failed to apply edit:`, edit, e);
        }
    }
    
    // Append any code that was meant for lines beyond the original
    if (appendedCode.length > 0) {
        lines.push('', ...appendedCode.flatMap(code => code.split('\n')));
        console.log(`[CodeEditor] Appended ${appendedCode.length} code blocks to end`);
    }
    
    const result = lines.join('\n');
    console.log(`[CodeEditor] Applied ${appliedCount}/${edits.length} line edits. Result has ${lines.length} lines`);
    console.log(`[CodeEditor] Result preview (first 200 chars):`, result.substring(0, 200));
    return result;
}

/**
 * Extract search/replace edits (legacy format)
 */
function extractSearchEdits(text) {
    const edits = [];
    const regex = /<<<SEARCH\s*([\s\S]*?)\s*===\s*([\s\S]*?)\s*>>>/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        edits.push({
            search: match[1],
            replace: match[2]
        });
    }
    return edits;
}

/**
 * Apply search/replace edits (legacy)
 */
function applySearchEdits(originalCode, edits) {
    let newCode = originalCode;
    let appliedCount = 0;

    for (const edit of edits) {
        const { search, replace } = edit;

        // 1. Try Exact Match
        if (newCode.includes(search)) {
            newCode = newCode.replace(search, replace);
            appliedCount++;
            continue;
        }

        // 2. Try Trimmed Match
        const searchTrim = search.trim();
        const idx = newCode.indexOf(searchTrim);
        if (idx !== -1) {
            newCode = newCode.replace(searchTrim, replace.trim());
            appliedCount++;
            continue;
        }

        // 3. Normalized Match (ignore whitespace differences)
        const normalizeWhitespace = (str) => str.replace(/\s+/g, ' ').trim();
        const searchNorm = normalizeWhitespace(search);
        let found = false;
        const lines = newCode.split('\n');
        const searchLines = search.trim().split('\n');
        
        for (let i = 0; i <= lines.length - searchLines.length; i++) {
            const candidateBlock = lines.slice(i, i + searchLines.length).join('\n');
            if (normalizeWhitespace(candidateBlock) === searchNorm) {
                const before = lines.slice(0, i).join('\n');
                const after = lines.slice(i + searchLines.length).join('\n');
                newCode = [before, replace.trim(), after].filter(Boolean).join('\n');
                appliedCount++;
                found = true;
                break;
            }
        }
        
        if (!found) {
            console.warn('[CodeEditor] Search block not found:', search.substring(0, 50) + '...');
        }
    }

    // Fallback if all edits failed
    if (appliedCount === 0 && edits.length > 0) {
        console.warn('[CodeEditor] All search edits failed!');
        const allReplaceCode = edits.map(e => e.replace.trim()).join('\n\n');
        const hasVariables = /const\s+\w+\s*=/.test(allReplaceCode);
        const hasBuilderCalls = allReplaceCode.includes('builder.');
        if (hasVariables && hasBuilderCalls && allReplaceCode.split('\n').length > 10) {
            return allReplaceCode;
        }
        return originalCode;
    }

    console.log(`[CodeEditor] Applied ${appliedCount}/${edits.length} search edits.`);
    return newCode;
}
