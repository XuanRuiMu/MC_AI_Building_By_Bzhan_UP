/**
 * Two-Step AI Generation: Planning + Building
 * 
 * IMPORTANT: Both steps share the SAME conversation context!
 * - Step 1 (Planning) sees: SYSTEM_PROMPT + Planning instructions
 * - Step 2 (Building) sees: Step 1's plan + Building instructions
 * 
 * This preserves context across both API calls.
 * 
 * NEW: Agent Mode with Skills is also available via agentLoop.js
 * NEW: Agent Mode V2 uses Anthropic Agent Skills standard (document-driven)
 */

import { VALID_BLOCKS_1_21 } from './validBlocks.js';
import { SYSTEM_PROMPT } from './prompts.js';
export { agentGenerateV2, runAgentLoopV2 } from './agentLoopV2.js';

// Planning instruction (appended to main SYSTEM_PROMPT)
const PLANNING_INSTRUCTION = `

---

# 🎯 PHASE 1: PLANNING MODE

Before writing any code, you must FIRST create a detailed building plan.
Output a JSON object with your decisions:

\`\`\`json
{
  "buildingName": "Descriptive name",
  "style": "architectural style",
  "size": {
    "category": "small|medium|large|massive",
    "width": 20,
    "depth": 20,
    "height": 15
  },
  "materials": {
    "primary": {
      "walls": ["block1", "block2"],
      "roof": ["stairs_block", "slab_block"],
      "floor": ["floor_block"],
      "frame": ["log_block"]
    },
    "secondary": {
      "accents": ["lantern", "chain"],
      "windows": ["glass_pane"],
      "doors": ["door_block"]
    },
    "decorative": ["flower_pot", "bookshelf"]
  },
  "structure": {
    "foundation": "Description of foundation",
    "mainBody": "Description of walls/body",
    "roof": "Roof type and technique",
    "features": ["chimney", "porch", "tower"]
  },
  "techniques": [
    "Technique 1 to apply",
    "Technique 2 to apply"
  ],
  "weathering": {
    "enabled": true,
    "description": "How to apply aging effects"
  },
  "components": [
    { "name": "component_name", "description": "what it does" }
  ]
}
\`\`\`

## AVAILABLE BLOCKS (Minecraft 1.21 Official)
Select materials ONLY from these valid blocks:
${Array.from(VALID_BLOCKS_1_21).slice(0, 300).join(', ')}
... (${VALID_BLOCKS_1_21.size} total blocks available)

OUTPUT ONLY THE JSON PLAN, no code yet!
`;

// Building instruction (for step 2)
const BUILDING_INSTRUCTION = `

---

# 🏗️ PHASE 2: BUILDING MODE

You have already created a plan. Now generate the JavaScript code.

**RULES:**
1. Use ONLY the materials you selected in the plan
2. Follow the structure and techniques you specified
3. Create the components you listed
4. Apply weathering if you enabled it
5. Match the dimensions you planned

Generate the JavaScript code now. Use the builder API as documented.
`;

// Refinement instruction (for step 3 - NEW!)
const REFINEMENT_INSTRUCTION = `

---

# 🔍 PHASE 3: QUALITY REFINEMENT

Review the code you just generated and CHECK for these common issues:

## STRUCTURAL INTEGRITY
- [ ] Are all walls fully closed? (No gaps or "leaky" walls)
- [ ] Are gable triangles filled under slanted roofs?
- [ ] Is the roof properly sealed on top?
- [ ] Is the floor complete with no holes?

## DETAIL COMPLETENESS
- [ ] Does the building have interior furniture/decorations if appropriate?
- [ ] Are windows properly placed with shutters/frames?
- [ ] Does the door have a proper entrance (porch, steps, overhang)?

## DECORATIVE ELEMENTS
- [ ] Are there climbing plants/vines on walls (if style permits)?
- [ ] Is there landscaping around the building (paths, plants, fences)?
- [ ] Are there atmospheric details (lanterns, flower pots, barrels)?

## PRIORITY SYSTEM
- [ ] Are structural elements (pillars, frames) using priority: 100?
- [ ] Are walls using priority: 50?
- [ ] Are decorations using appropriate lower priorities?

## CODE QUALITY
- [ ] Are components defined for reusable parts?
- [ ] Are groups properly named and organized?
- [ ] Is the code readable with comments?

**IF any issues are found, fix them in the code.**
**Output the COMPLETE refined code, not just patches.**
`;

// Quality check prompts for specific issues

/**
 * Create the combined system prompt for planning phase
 * Includes: Full building knowledge + Planning instructions
 */
export function createPlanningSystemPrompt() {
    return SYSTEM_PROMPT + PLANNING_INSTRUCTION;
}

/**
 * Parse the AI's planning response to extract JSON
 */
export function parsePlanningResponse(response) {
    try {
        let jsonStr = response;

        // Extract JSON from markdown code blocks
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        const plan = JSON.parse(jsonStr.trim());

        // Validate required fields
        if (!plan.buildingName || !plan.materials || !plan.size) {
            throw new Error('Missing required fields in plan');
        }

        // Validate materials against official block list
        const invalidBlocks = [];
        const validateMaterials = (obj, path = '') => {
            if (Array.isArray(obj)) {
                obj.forEach((block, i) => {
                    const cleanBlock = block.split('?')[0].split('[')[0];
                    if (!VALID_BLOCKS_1_21.has(cleanBlock)) {
                        invalidBlocks.push({ block: cleanBlock, path: `${path}[${i}]` });
                    }
                });
            } else if (typeof obj === 'object' && obj !== null) {
                Object.entries(obj).forEach(([key, value]) => {
                    validateMaterials(value, path ? `${path}.${key}` : key);
                });
            }
        };

        validateMaterials(plan.materials);

        if (invalidBlocks.length > 0) {
            console.warn('[Planning] Invalid blocks detected:', invalidBlocks);
            plan._warnings = invalidBlocks;
        }

        return plan;
    } catch (error) {
        console.error('[Planning] Failed to parse plan:', error);
        return null;
    }
}

/**
 * Full Two-Step Generation with Shared Context (Renamed: Precise Generation)
 * 
 * @param {string} userPrompt - User's building request
 * @param {string} apiKey - API key
 * @param {string} baseUrl - API base URL
 * @param {string} model - Model name
 * @param {Object} callbacks - { onPlanStart, onPlanReady, onBuildStart, onChunk }
 * @param {string} currentCode - Existing code context (optional)
 * @param {string} imageUrl - Optional image URL for vision models
 */
import { executeVoxelScript } from './sandbox.js';
import { applyCodeEdit, addLineNumbers } from './codeEditor.js';

/**
 * Smart merge code continuation - finds overlap and deduplicates
 * @param {string} original - The original truncated code
 * @param {string} continuation - The continuation from AI
 * @returns {string} - Merged code without duplicates
 */
function smartMergeCode(original, continuation) {
    if (!continuation || !continuation.trim()) return original;
    
    const originalLines = original.split('\n');
    const contLines = continuation.split('\n');
    
    // Try to find where the continuation actually starts (skip repeated lines)
    // Look for the first line in continuation that doesn't exist in the last N lines of original
    const searchWindow = Math.min(30, originalLines.length); // Look at last 30 lines
    const lastOriginalLines = originalLines.slice(-searchWindow);
    
    let startIndex = 0;
    for (let i = 0; i < contLines.length; i++) {
        const contLine = contLines[i].trim();
        if (!contLine) continue; // Skip empty lines
        
        // Check if this line exists in the tail of original
        const foundInOriginal = lastOriginalLines.some(origLine => 
            origLine.trim() === contLine && contLine.length > 5 // Only match non-trivial lines
        );
        
        if (!foundInOriginal) {
            // This is where new content starts
            startIndex = i;
            break;
        }
        startIndex = i + 1; // Skip this duplicate line
    }
    
    // If we skipped everything, just append (AI might have given completely new code)
    if (startIndex >= contLines.length) {
        console.log('[SmartMerge] All continuation lines were duplicates, appending anyway');
        return original + '\n' + continuation;
    }
    
    const newContent = contLines.slice(startIndex).join('\n');
    console.log(`[SmartMerge] Skipped ${startIndex} duplicate lines, merging ${contLines.length - startIndex} new lines`);
    
    return original + '\n' + newContent;
}

/**
 * Check if code appears to be truncated
 * @param {string} code - The generated code
 * @returns {boolean} - True if code appears truncated
 */
function checkCodeTruncation(code) {
    if (!code || code.length < 100) return false;
    
    const trimmedCode = code.trim();
    
    // Ends with incomplete syntax
    if (trimmedCode.endsWith(',') ||
        trimmedCode.endsWith('(') ||
        trimmedCode.endsWith('{') ||
        trimmedCode.endsWith('[') ||
        trimmedCode.endsWith(':') ||
        trimmedCode.endsWith('//')) {
        return true;
    }
    
    // Unbalanced brackets (more opens than closes)
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    
    if (openBraces > closeBraces + 1 || 
        openParens > closeParens + 1 ||
        openBrackets > closeBrackets + 1) {
        return true;
    }
    
    return false;
}

/**
 * Full Two-Step Generation with Shared Context (Autonomous Agent Mode)
 * Replaces simple linear generation with a Reason-Act-Verify loop.
 */
export async function twoStepGenerateWithContext(
    userPrompt,
    apiKey,
    baseUrl = 'https://api.openai.com/v1',
    model = 'gpt-4o-mini',
    callbacks = {},
    currentCode = null,
    imageUrl = null
) {
    const { onPlanStart, onPlanReady, onBuildStart, onChunk, onError, onStatus } = callbacks;

    if (!apiKey) throw new Error("API Key is missing.");

    // Helper for Status Updates
    const setStatus = (msg) => {
        console.log(`[Agent] ${msg}`);
        if (onStatus) onStatus(msg);
    };

    // ==========================================
    // SHARED CONVERSATION
    // ==========================================
    const conversation = [];

    // System prompt
    conversation.push({
        role: 'system',
        content: createPlanningSystemPrompt()
    });

    // Existing code context WITH LINE NUMBERS
    if (currentCode && currentCode.trim()) {
        const codeWithLineNumbers = addLineNumbers(currentCode);
        conversation.push({
            role: 'system',
            content: `[EXISTING STRUCTURE ON CANVAS - with line numbers]\n\`\`\`javascript\n${codeWithLineNumbers}\n\`\`\`\n\nUse <<<LINES:start-end ... >>> to replace lines, <<<INSERT:N ... >>> to insert after line N.`
        });
    }

    // ==========================================
    // STEP 1: PLANNING
    // ==========================================
    setStatus('Phase 1: Analyzing request & Planning...');

    if (onPlanStart) onPlanStart();

    const planningRequest = `I want to build: "${userPrompt}"\n\nFirst, create a detailed JSON building plan following the PHASE 1 instructions.`;

    if (imageUrl) {
        conversation.push({
            role: 'user',
            content: [
                { type: "text", text: planningRequest },
                { type: "image_url", image_url: { url: imageUrl } }
            ]
        });
    } else {
        conversation.push({
            role: 'user',
            content: planningRequest
        });
    }

    let plan = null;

    try {
        const planResponse = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: conversation,
                temperature: 0.7,
                max_tokens: 323840
            })
        });

        if (!planResponse.ok) {
            const error = await planResponse.json().catch(() => ({}));
            throw new Error(error.error?.message || `Planning failed: ${planResponse.statusText}`);
        }

        const planData = await planResponse.json();
        const planContent = planData.choices?.[0]?.message?.content || '';

        plan = parsePlanningResponse(planContent);

        if (!plan) {
            // If parsing failed, we can optionally retry mere, but for now just fail
            throw new Error('Failed to parse planning response');
        }

        conversation.push({
            role: 'assistant',
            content: planContent
        });

        if (onPlanReady) onPlanReady(plan);
        setStatus(`Plan verified: ${plan.buildingName}`);

    } catch (error) {
        console.error('[Two-Step] Planning error:', error);
        if (onError) onError('planning', error);
        throw error;
    }

    // ==========================================
    // STEP 2: AUTONOMOUS BUILDING LOOP (Self-Healing)
    // ==========================================
    if (onBuildStart) onBuildStart(plan);

    // Initial Build Instruction
    conversation.push({
        role: 'user',
        content: `Great plan! Now proceed to PHASE 2: Generate the JavaScript code based on your plan above.${BUILDING_INSTRUCTION}`
    });

    const MAX_RETRIES = 3;
    let attempts = 0;
    let success = false;
    let finalCode = '';
    let lastFailedCode = null; // Store last failed code for edit-based fixes

    while (attempts < MAX_RETRIES && !success) {
        attempts++;
        setStatus(attempts === 1 ? 'Phase 2: Generating Code...' : `Fixing Code (Attempt ${attempts}/${MAX_RETRIES})...`);

        try {
            // We use NON-STREAMING here to allow validation before showing user
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: conversation,
                    temperature: 0.7
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

            const data = await response.json();
            const generatedContent = data.choices?.[0]?.message?.content || '';

            // CRITICAL: Record the assistant's attempt in history so it knows what it wrote
            conversation.push({
                role: 'assistant',
                content: generatedContent
            });

            // Extract JS from Markdown
            let codeCandidate = generatedContent;
            const codeMatch = generatedContent.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
            if (codeMatch) {
                codeCandidate = codeMatch[1];
            }

            // Check if code appears truncated and request continuation
            if (checkCodeTruncation(codeCandidate)) {
                setStatus('Code truncated, requesting continuation...');
                console.log('[Two-Step] Code appears truncated, requesting continuation...');
                
                const lastLines = codeCandidate.split('\n').slice(-5).join('\n');
                conversation.push({
                    role: 'user',
                    content: `你的代码被截断了，请从以下位置继续生成（不要重复已有的代码）：\n\`\`\`\n${lastLines}\n\`\`\`\n请直接继续输出剩余的代码，不需要重新开始。`
                });
                
                const continueResponse = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: conversation,
                        temperature: 0.7
                    })
                });
                
                if (continueResponse.ok) {
                    const continueData = await continueResponse.json();
                    const continuation = continueData.choices?.[0]?.message?.content || '';
                    
                    // Extract code from continuation
                    const contCodeMatch = continuation.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
                    const contCode = contCodeMatch ? contCodeMatch[1] : continuation;
                    
                    // Smart merge: find overlap and deduplicate
                    // AI often repeats the last few lines, so we need to find where the new code actually starts
                    const mergedCode = smartMergeCode(codeCandidate, contCode);
                    codeCandidate = mergedCode;
                    
                    conversation.push({
                        role: 'assistant',
                        content: continuation
                    });
                    
                    console.log('[Two-Step] Continuation merged, total length:', codeCandidate.length);
                }
            }

            // --- EDITING SUPPORT (Line-number or Search/Replace) ---
            let finalScript = codeCandidate;
            const hasLineEdits = codeCandidate.includes('<<<LINES:') || codeCandidate.includes('<<<INSERT:') || codeCandidate.includes('<<<DELETE:');
            const hasSearchEdits = codeCandidate.includes('<<<SEARCH') || codeCandidate.includes('Search/Replace Block');
            
            // Use currentCode OR the last failed attempt as base for edits
            const baseCodeForEdits = currentCode || lastFailedCode;
            
            if (baseCodeForEdits && (hasLineEdits || hasSearchEdits)) {
                setStatus('Applying incremental edits...');
                try {
                    finalScript = applyCodeEdit(baseCodeForEdits, codeCandidate);
                    console.log('[Two-Step] After applying edits, finalScript length:', finalScript.length);
                    console.log('[Two-Step] finalScript has builder calls:', finalScript.includes('builder.'));
                } catch (e) {
                    console.warn('[Two-Step] Failed to apply edit:', e);
                    // If edit application fails, use the candidate as-is
                    finalScript = codeCandidate;
                }
            }
            
            // Store this attempt for potential retry edits
            lastFailedCode = finalScript;

            // ==========================================
            // PHASE 3: QUALITY REFINEMENT (BEFORE VALIDATION!)
            // ==========================================
            setStatus('Phase 3: Refining details...');

            // Ask AI to review and improve the code
            conversation.push({
                role: 'user',
                content: `Now proceed to PHASE 3: Review your code for quality and completeness issues, then fix any problems.${REFINEMENT_INSTRUCTION}`
            });

            try {
                const refineResponse = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: conversation,
                        temperature: 0.5 // Lower temperature for more focused refinement
                    })
                });

                if (refineResponse.ok) {
                    const refineData = await refineResponse.json();
                    const refinedContent = refineData.choices?.[0]?.message?.content || '';

                    // Check if AI provided refined code
                    const refinedCodeMatch = refinedContent.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
                    if (refinedCodeMatch) {
                        const refinedCode = refinedCodeMatch[1];
                        finalScript = refinedCode;
                        setStatus('Refinement complete!');
                    } else {
                        // AI said code is already good, no changes needed
                        setStatus('Code quality verified, no changes needed!');
                    }

                    conversation.push({
                        role: 'assistant',
                        content: refinedContent
                    });
                }
            } catch (refineErr) {
                // Refinement failed, just use original code
                console.warn('[Refinement] Phase 3 failed:', refineErr.message);
                setStatus('Refinement skipped, using original code');
            }

            // --- VALIDATION STAGE (NOW AFTER REFINEMENT!) ---
            setStatus(`Validating refined code...`);

            // Dry Run in Sandbox (Throw on error enabled!)
            const voxels = executeVoxelScript(finalScript, true);

            if (voxels.length === 0) {
                throw new Error("Code executed successfully but generated 0 blocks. Did you forget to call builder.set() or builder.fill()?");
            }

            setStatus(`Validation passed! ${voxels.length} blocks generated.`);

            // If we get here, the code is valid JS and generates blocks!
            success = true;
            finalCode = finalScript;

            // Manually trigger onChunk to show code to user (simulate stream)
            // We wrapper it in Markdown so the UI collapses it
            const mdStart = "Here is the verified construction script:\n```javascript\n";
            const mdEnd = "\n```";

            if (onChunk) onChunk(mdStart, mdStart);

            const chunkSize = 150;
            let currentStreamed = mdStart;

            for (let i = 0; i < finalCode.length; i += chunkSize) {
                const chunk = finalCode.slice(i, i + chunkSize);
                currentStreamed += chunk;
                if (onChunk) onChunk(chunk, currentStreamed);
                await new Promise(r => setTimeout(r, 5));
            }

            currentStreamed += mdEnd;
            if (onChunk) onChunk(mdEnd, currentStreamed);

            setStatus('Build verified & complete!');

            // Return the full markdown content as the result
            return { code: currentStreamed, plan };

        } catch (err) {
            console.warn(`[Autofix] Attempt ${attempts} failed:`, err.message);

            if (attempts >= MAX_RETRIES) {
                if (onError) onError('building', err);
                throw err;
            }

            // SMART FIX: Use line-based edits instead of regenerating entire code
            // Add line numbers to the failed code so AI can reference specific lines
            const codeWithLineNumbers = addLineNumbers(finalScript);
            
            // FEEDBACK LOOP with EDIT INSTRUCTIONS
            const errorMsg = `[SYSTEM ERROR]: The code failed validation.
Error: ${err.message}

Here is the current code WITH LINE NUMBERS:
\`\`\`javascript
${codeWithLineNumbers}
\`\`\`

⚠️ DO NOT regenerate the entire code! Use the edit format to fix ONLY the broken part:

**To replace lines 10-15:**
\`\`\`
<<<LINES:10-15
// your fixed code here
>>>
\`\`\`

**To insert after line 20:**
\`\`\`
<<<INSERT:20
// new code to add
>>>
\`\`\`

Analyze the error and output ONLY the minimal fix using the format above.`;

            conversation.push({
                role: 'user',
                content: errorMsg
            });

            setStatus(`Error detected (${err.message.substring(0, 50)}...). Auto-fixing...`);
        }
    }

    return {
        plan,
        code: finalCode,
        conversation
    };
}

// Legacy exports for compatibility
export const PLANNING_PROMPT = createPlanningSystemPrompt();

export function createPlanningMessages(userPrompt) {
    return [
        { role: 'system', content: createPlanningSystemPrompt() },
        { role: 'user', content: `Create a detailed building plan for: "${userPrompt}"` }
    ];
}

export function createBuildingPromptFromPlan(plan, originalPrompt) {
    return `Based on this plan:\n${JSON.stringify(plan, null, 2)}\n\nBuild: "${originalPrompt}"`;
}

export const TwoStepAI = {
    twoStepGenerateWithContext,
    createPlanningSystemPrompt,
    parsePlanningResponse,
    VALID_BLOCKS: VALID_BLOCKS_1_21
};

export default TwoStepAI;
