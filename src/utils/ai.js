/**
 * AI Service for communicating with LLM APIs (OpenAI Compatible)
 * Supports streaming responses for real-time block rendering
 */

import { detectStyle } from './styleKnowledge';
import { SYSTEM_PROMPT } from './prompts.js';
import { addLineNumbers } from './codeEditor.js';

export { SYSTEM_PROMPT }; // Re-export for compatibility


/**
 * Fetch AI response with streaming support
 * @param {string} userPrompt - User's prompt
 * @param {string} apiKey - OpenAI API Key
 * @param {string} baseUrl - Base URL
 * @param {string} model - Model name
 * @param {Array} history - Chat history (UI messages, used if apiHistory is not provided)
 * @param {Function} onChunk - Callback for streaming chunks (chunk, fullContent) -> void
 * @param {string} currentCode - Existing code for modification context
 * @param {string} imageUrl - Vision input image URL
 * @param {Array} apiHistory - API-level conversation history (takes precedence over history)
 * @returns {Object} { content: string, messages: Array } - Response content and updated API history
 */
export const fetchAIResponseStream = async (
    userPrompt,
    apiKey,
    baseUrl = 'https://api.openai.com/v1',
    model = 'gpt-3.5-turbo',
    history = [],
    onChunk = null,
    currentCode = null,
    imageUrl = null,
    apiHistory = null  // NEW: API-level conversation history
) => {
    if (!apiKey) throw new Error("API Key is missing.");

    // Detect architectural style from user prompt and inject specialized knowledge
    const detectedStyle = detectStyle(userPrompt);
    let enhancedSystemPrompt = SYSTEM_PROMPT;

    if (detectedStyle) {
        console.log(`[AI] Detected style: ${detectedStyle.name}`);
        enhancedSystemPrompt = SYSTEM_PROMPT + `

---

# 🎨 DETECTED STYLE: ${detectedStyle.name.toUpperCase()}
The user wants to build in the **${detectedStyle.name}** style. 
Apply the following specialized architectural knowledge:

${detectedStyle.knowledge}
`;
    }

    // Build messages array
    const messages = [
        { role: 'system', content: enhancedSystemPrompt }
    ];

    // If there's existing code, inject it as context WITH LINE NUMBERS
    if (currentCode && currentCode.trim()) {
        const codeWithLineNumbers = addLineNumbers(currentCode);
        messages.push({
            role: 'system',
            content: `## ⚠️ MODIFICATION MODE

**EXISTING CODE (with line numbers for reference):**
\`\`\`javascript
${codeWithLineNumbers}
\`\`\`

**YOUR TASK:** Modify the structure based on user request.

**USE LINE-NUMBER BASED EDITS:**
- Replace lines: \`<<<LINES:10-15\n...new code...\n>>>\`
- Insert after line: \`<<<INSERT:20\n...new code...\n>>>\`
- Delete lines: \`<<<DELETE:5-8>>>\`

**RULES:**
1. Use line numbers shown above to specify which lines to modify
2. LINES:start-end replaces lines start through end (inclusive)
3. INSERT:N inserts new code AFTER line N
4. Multiple edit blocks can be used
5. For very large changes, output the complete modified script

**COMMON MODIFICATIONS:**

For "change roof to X material":
\`\`\`javascript
// First clear old roof, then build new one
builder.fill(x1, roofY, z1, x2, roofY + roofHeight, z2, 'AIR');
builder.drawRoofBounds(x1, roofY, z1, x2, z2, height, 'straight', 'NEW_MATERIAL_stairs');
\`\`\`

For "add windows":
\`\`\`javascript
builder.set(x, y, z, 'glass_pane');
\`\`\`

For "make taller":
\`\`\`javascript
// Add new layer on top
builder.fill(x1, topY, z1, x2, topY + 2, z2, 'WALL_MATERIAL');
\`\`\`

**NOW OUTPUT ONLY EXECUTABLE CODE:**`
        });
    }

    // Use API history if provided, otherwise fall back to UI history
    if (apiHistory && apiHistory.length > 0) {
        // Filter to only include user/assistant messages (skip system messages)
        const conversationMessages = apiHistory.filter(m => m.role === 'user' || m.role === 'assistant');
        messages.push(...conversationMessages);
        console.log('[AI Stream] Using API conversation history:', conversationMessages.length, 'messages');
    } else {
        // Fallback: clean UI history
        const cleanHistory = history
            .filter(m => m.role === 'user' || m.role === 'ai' || m.role === 'assistant')
            .map(m => ({
                role: m.role === 'ai' ? 'assistant' : m.role,
                content: m.content
            }));
        messages.push(...cleanHistory);
    }

    // Add User Prompt (Text OR Multimodal)
    const userMessage = imageUrl ? {
        role: 'user',
        content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageUrl } }
        ]
    } : { role: 'user', content: userPrompt };

    messages.push(userMessage);

    console.log('[AI Stream] Sending request to:', `${baseUrl}/chat/completions`);

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: 8152,
                stream: true
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Failed to fetch from AI: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullContent = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.replace("data: ", "").trim();
                    if (dataStr === "[DONE]") break;
                    try {
                        const data = JSON.parse(dataStr);
                        const content = data.choices[0]?.delta?.content || "";
                        if (content) {
                            fullContent += content;
                            if (onChunk) onChunk(content, fullContent);
                        }
                    } catch (e) {
                        // ignore parse errors for partial chunks
                    }
                }
            }
        }

        // Build updated conversation history for next turn
        // Only include user/assistant messages (not system prompts with code)
        const updatedHistory = apiHistory ? [...apiHistory] : [];
        updatedHistory.push({ role: 'user', content: userPrompt });
        updatedHistory.push({ role: 'assistant', content: fullContent });

        // Check if code appears truncated (common signs)
        const isTruncated = checkCodeTruncation(fullContent);

        // Return both content and updated history
        return { 
            content: fullContent, 
            messages: updatedHistory,
            truncated: isTruncated,
            lastLines: isTruncated ? fullContent.split('\n').slice(-5).join('\n') : null
        };
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};

/**
 * Check if code appears to be truncated
 * @param {string} content - The generated content
 * @returns {boolean} - True if code appears truncated
 */
function checkCodeTruncation(content) {
    if (!content || content.length < 100) return false;
    
    // Extract code from markdown if present
    const codeMatch = content.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1] : content;
    
    // Check for obvious truncation signs
    const trimmedCode = code.trim();
    
    // Ends with incomplete syntax
    if (trimmedCode.endsWith(',') ||
        trimmedCode.endsWith('(') ||
        trimmedCode.endsWith('{') ||
        trimmedCode.endsWith('[') ||
        trimmedCode.endsWith(':') ||
        trimmedCode.endsWith('//') ||
        trimmedCode.endsWith('/*') ||
        trimmedCode.endsWith('+') ||
        trimmedCode.endsWith('-') ||
        trimmedCode.endsWith('*') ||
        trimmedCode.endsWith('=') ||
        trimmedCode.endsWith('&&') ||
        trimmedCode.endsWith('||')) {
        console.log('[AI] Truncation detected: ends with incomplete syntax');
        return true;
    }
    
    // Unbalanced brackets (more opens than closes)
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    
    if (openBraces > closeBraces + 1) {
        console.log(`[AI] Truncation detected: unbalanced braces { ${openBraces} vs } ${closeBraces}`);
        return true;
    }
    if (openParens > closeParens + 1) {
        console.log(`[AI] Truncation detected: unbalanced parens ( ${openParens} vs ) ${closeParens}`);
        return true;
    }
    if (openBrackets > closeBrackets + 1) {
        console.log(`[AI] Truncation detected: unbalanced brackets [ ${openBrackets} vs ] ${closeBrackets}`);
        return true;
    }
    
    // Check if markdown code block is not closed
    const codeBlockOpens = (content.match(/```/g) || []).length;
    if (codeBlockOpens % 2 !== 0) {
        console.log('[AI] Truncation detected: unclosed markdown code block');
        return true;
    }
    
    // Check for incomplete function/loop definitions
    const lastLine = trimmedCode.split('\n').pop()?.trim() || '';
    if (lastLine.match(/^(for|while|if|else|function|const|let|var|builder\.)\s*\(/) && !lastLine.includes(')')) {
        console.log('[AI] Truncation detected: incomplete statement on last line');
        return true;
    }
    
    return false;
}

/**
 * Generate image from text prompt
 */
export const generateImage = async (
    prompt,
    apiKey,
    baseUrl = 'https://api.openai.com/v1',
    model = 'dall-e-3'
) => {
    if (!apiKey) throw new Error("API Key is missing.");

    console.log('[AI Image] Generating:', prompt);

    try {
        const response = await fetch(`${baseUrl}/images/generations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                response_format: "url" // or "b64_json" if needed
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Image Gen Failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data[0].url;
    } catch (error) {
        console.error("Image Gen Error:", error);
        throw error;
    }
};

/**
 * Legacy non-streaming fetch (kept for compatibility)
 */
export const fetchAIResponse = async (userPrompt, apiKey, baseUrl = 'https://api.openai.com/v1', model = 'gpt-3.5-turbo', history = []) => {
    return fetchAIResponseStream(userPrompt, apiKey, baseUrl, model, history, null);
};

// ============ GENERATION MODES ============
// Mode 1: Fast Generation (fetchAIResponseStream) - Direct code generation
// Mode 2: Precise Generation (twoStepGenerateWithContext) - Planning + Building phases

import {
    PLANNING_PROMPT,
    parsePlanningResponse,
    createBuildingPromptFromPlan,
    twoStepGenerateWithContext,
    createPlanningSystemPrompt
} from './twoStepAI.js';

// Re-export with "Precise" terminology for clarity
export const generatePreciseBuild = twoStepGenerateWithContext;
export { twoStepGenerateWithContext } from './twoStepAI.js';

/**
 * Step 1: Generate a building plan (no code, just JSON analysis)
 * @returns {Promise<Object>} The parsed plan object
 */
export const generateBuildingPlan = async (
    userPrompt,
    apiKey,
    baseUrl = 'https://api.openai.com/v1',
    model = 'gpt-4o-mini',
    onProgress = null
) => {
    if (!apiKey) throw new Error("API Key is missing.");

    console.log('[AI Planning] Starting planning phase for:', userPrompt);

    const messages = [
        { role: 'system', content: PLANNING_PROMPT },
        { role: 'user', content: `Create a detailed building plan for: "${userPrompt}"` }
    ];

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 323840
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Planning failed: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        console.log('[AI Planning] Raw response:', content.slice(0, 200) + '...');

        const plan = parsePlanningResponse(content);

        if (!plan) {
            throw new Error('Failed to parse planning response');
        }

        console.log('[AI Planning] Plan generated:', plan.buildingName);
        return plan;

    } catch (error) {
        console.error('[AI Planning] Error:', error);
        throw error;
    }
};

/**
 * Step 2: Generate building code based on a plan
 * Uses streaming for real-time rendering
 */
export const generateBuildingFromPlan = async (
    plan,
    originalPrompt,
    apiKey,
    baseUrl = 'https://api.openai.com/v1',
    model = 'gpt-4o-mini',
    onChunk = null,
    currentCode = null
) => {
    // Create enhanced prompt with plan context
    const planContext = createBuildingPromptFromPlan(plan, originalPrompt);

    console.log('[AI Building] Starting build phase with plan:', plan.buildingName);

    // Use the regular streaming function but with plan-enhanced prompt
    return fetchAIResponseStream(
        planContext,
        apiKey,
        baseUrl,
        model,
        [], // No history needed, plan contains all context
        onChunk,
        currentCode,
        null
    );
};

/**
 * Full two-step generation (convenience function)
 * Calls planning, then building
 */
export const twoStepGenerate = async (
    userPrompt,
    apiKey,
    baseUrl = 'https://api.openai.com/v1',
    model = 'gpt-4o-mini',
    onPlanReady = null,
    onChunk = null,
    currentCode = null
) => {
    // Step 1: Planning
    const plan = await generateBuildingPlan(userPrompt, apiKey, baseUrl, model);

    // Callback with plan
    if (onPlanReady) {
        onPlanReady(plan);
    }

    // Step 2: Building
    const result = await generateBuildingFromPlan(
        plan,
        userPrompt,
        apiKey,
        baseUrl,
        model,
        onChunk,
        currentCode
    );

    return { plan, code: result };
};
