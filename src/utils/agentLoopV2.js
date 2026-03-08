/**
 * Agent Loop V2 - Anthropic Agent Skills Standard (Browser Compatible)
 * 
 * This version implements the document-driven Agent Skills pattern:
 * - Skills are defined with SKILL.md content embedded
 * - Agent reads skill documentation to learn how to use them
 * - Progressive disclosure: only load what's needed
 * 
 * The Agent has access to:
 * - read_skill: Read a skill's documentation
 * - run_script: Execute skill operations
 * - generate_code: Output building code
 * - validate_code: Test code in sandbox
 * - complete: Finish the build
 */

import { SYSTEM_PROMPT } from './prompts.js';
import { VALID_BLOCKS_1_21 } from './validBlocks.js';
import { executeVoxelScript } from './sandbox.js';
import { STYLE_KNOWLEDGE, detectStyle, getAvailableStyles } from './styleKnowledge.js';
import { addLineNumbers } from './codeEditor.js';

// Max iterations to prevent infinite loops
const MAX_ITERATIONS = 20;

// ============================================================
// 🔧 DEBUG MODE - Controlled via Settings UI
// ============================================================
let DEBUG_MODE = false; // Will be set from App.jsx based on user settings

// Call this to enable/disable debug mode from outside
export function setAgentDebugMode(enabled) {
    DEBUG_MODE = enabled;
    if (enabled) {
        console.log('[🤖 Agent] Debug mode ENABLED - AI conversation will be logged to console');
    }
}

function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log('[🤖 Agent Debug]', ...args);
    }
}

function debugSection(title) {
    if (DEBUG_MODE) {
        console.log('\n' + '='.repeat(60));
        console.log(`[🤖 Agent] ${title}`);
        console.log('='.repeat(60));
    }
}

// ============================================================
// API RETRY CONFIGURATION
// ============================================================
const MAX_API_RETRIES = 3;
const API_RETRY_DELAY_MS = 1500;

/**
 * Fetch with automatic retry on transient errors
 * @param {string} url - API endpoint
 * @param {object} options - fetch options
 * @param {object} callbacks - for logging
 * @param {number} maxRetries - max retry attempts
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options, callbacks, maxRetries = MAX_API_RETRIES) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            // If successful or client error (4xx except 429), don't retry
            if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
                return response;
            }

            // Server errors (5xx) or rate limit (429) - should retry
            const errText = await response.text();
            lastError = new Error(`API Error ${response.status}: ${errText}`);

            if (attempt < maxRetries) {
                const delay = API_RETRY_DELAY_MS * attempt; // Exponential backoff
                console.warn(`[Agent] API error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
                callbacks?.onDevLog?.({
                    type: 'warning',
                    content: `⚠️ API Error (${response.status}), retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`
                });
                callbacks?.onStatus?.(`API Error, retrying (${attempt}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (err) {
            lastError = err;

            // Check if aborted - don't retry
            if (err.name === 'AbortError') {
                throw err;
            }

            // Network errors - should retry
            if (attempt < maxRetries) {
                const delay = API_RETRY_DELAY_MS * attempt;
                console.warn(`[Agent] Network error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, err.message);
                callbacks?.onDevLog?.({
                    type: 'warning',
                    content: `⚠️ Network error, retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`
                });
                callbacks?.onStatus?.(`Network error, retrying (${attempt}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // All retries exhausted
    throw lastError;
}

// ============================================================
// STREAMING API CALL
// ============================================================

/**
 * Call API with streaming and parse SSE events
 * @param {string} url - API endpoint
 * @param {object} options - fetch options (body will be modified to add stream:true)
 * @param {object} callbacks - for real-time logging
 * @param {AbortSignal} signal - abort signal
 * @returns {Promise<object>} - Complete message object
 */
async function fetchWithStream(url, options, callbacks, signal) {
    // Parse body and add stream: true
    const body = JSON.parse(options.body);
    body.stream = true;
    
    const response = await fetch(url, {
        ...options,
        body: JSON.stringify(body),
        signal
    });
    
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // Accumulated message
    let accumulatedContent = '';
    let accumulatedToolCalls = []; // Array of {id, type, function: {name, arguments}}
    let finishReason = null;
    
    // For real-time display
    let lastLoggedContent = '';
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta;
                    finishReason = parsed.choices?.[0]?.finish_reason || finishReason;
                    
                    if (!delta) continue;
                    
                    // Handle content delta
                    if (delta.content) {
                        accumulatedContent += delta.content;
                        
                        // Real-time log to dev console (throttled - every 50 chars or newline)
                        if (accumulatedContent.length - lastLoggedContent.length >= 50 || 
                            delta.content.includes('\n')) {
                            const newContent = accumulatedContent.slice(lastLoggedContent.length);
                            callbacks?.onDevLog?.({ 
                                type: 'stream', 
                                content: newContent,
                                accumulated: accumulatedContent
                            });
                            lastLoggedContent = accumulatedContent;
                        }
                    }
                    
                    // Handle tool_calls delta
                    if (delta.tool_calls) {
                        for (const tcDelta of delta.tool_calls) {
                            const idx = tcDelta.index;
                            
                            // Initialize tool call if new
                            if (!accumulatedToolCalls[idx]) {
                                accumulatedToolCalls[idx] = {
                                    id: tcDelta.id || '',
                                    type: tcDelta.type || 'function',
                                    function: {
                                        name: tcDelta.function?.name || '',
                                        arguments: ''
                                    },
                                    _logged: false // Track if we've logged the start
                                };
                            }
                            
                            // Update tool call
                            if (tcDelta.id) {
                                accumulatedToolCalls[idx].id = tcDelta.id;
                            }
                            if (tcDelta.function?.name) {
                                accumulatedToolCalls[idx].function.name = tcDelta.function.name;
                                // Log tool start when name is first received
                                if (!accumulatedToolCalls[idx]._logged) {
                                    accumulatedToolCalls[idx]._logged = true;
                                    callbacks?.onDevLog?.({ 
                                        type: 'stream_tool_start', 
                                        name: tcDelta.function.name 
                                    });
                                }
                            }
                            if (tcDelta.function?.arguments) {
                                accumulatedToolCalls[idx].function.arguments += tcDelta.function.arguments;
                                
                                // Stream tool arguments (for generate_code, show code being written)
                                const toolName = accumulatedToolCalls[idx].function.name;
                                if (toolName === 'generate_code' || toolName === 'modify_code') {
                                    callbacks?.onDevLog?.({ 
                                        type: 'stream_tool_args', 
                                        name: toolName,
                                        argsDelta: tcDelta.function.arguments
                                    });
                                }
                            }
                        }
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
    
    // Log any remaining content
    if (accumulatedContent.length > lastLoggedContent.length) {
        const newContent = accumulatedContent.slice(lastLoggedContent.length);
        callbacks?.onDevLog?.({ 
            type: 'stream', 
            content: newContent,
            accumulated: accumulatedContent
        });
    }
    
    // Build final message object (compatible with non-streaming format)
    const message = {
        role: 'assistant',
        content: accumulatedContent || null
    };
    
    if (accumulatedToolCalls.length > 0) {
        // Clean up internal tracking properties before sending to API
        // Also ensure id is not empty (generate one if needed)
        message.tool_calls = accumulatedToolCalls.map((tc, idx) => ({
            id: tc.id || `call_${Date.now()}_${idx}`,
            type: tc.type || 'function',
            function: {
                name: tc.function.name,
                arguments: tc.function.arguments
            }
        }));
    }
    
    // Debug: Log what we parsed from the stream
    console.log('[Stream Debug] Parsed message:', {
        hasContent: !!message.content,
        contentLength: message.content?.length || 0,
        toolCallsCount: message.tool_calls?.length || 0,
        toolNames: message.tool_calls?.map(tc => tc.function.name) || [],
        finishReason
    });
    
    return {
        choices: [{
            message,
            finish_reason: finishReason
        }]
    };
}

// ============================================================
// EMBEDDED SKILL DOCUMENTS (for browser compatibility)
// ============================================================

const SKILLS_DATABASE = {
    'knowledge-skill': {
        name: 'knowledge-skill',
        description: 'Search and retrieve architectural style knowledge. Use this FIRST when building anything new. Read the specific style document that matches the user\'s request.',
        content: `# 📚 Knowledge Skill

This skill provides access to the **Architectural Style Knowledge Base** with over 20 different building styles.

## IMPORTANT: Read the Specific Style Document!

Based on the user's request, read ONE of these style documents:

### 🏗️ Special Structure Types
| Style | Document | Keywords |
|-------|----------|----------|
| 雕像/生物 | \`resources/type_statue\` | statue, sculpture, dragon, 雕像 |
| 载具/机械 | \`resources/type_vehicle\` | ship, boat, plane, 船, 机甲 |
| 自然景观 | \`resources/type_landscape\` | tree, mountain, 树, 山 |

### 🏛️ Ancient & Classical
| Style | Document | Keywords |
|-------|----------|----------|
| 古典/古罗马 | \`resources/classical_roman\` | roman, greek, temple, 古希腊 |
| 沙漠/古埃及 | \`resources/desert_egyptian\` | desert, pyramid, sphinx, 金字塔 |

### ⛩️ Asian
| Style | Document | Keywords |
|-------|----------|----------|
| 日式神社 | \`resources/japanese_shrine\` | shrine, torii, 神社, 鸟居 |
| 日式民居 | \`resources/japanese_vernacular\` | japanese house, 日式小屋 |
| 日式城堡 | \`resources/japanese_castle\` | japanese castle, 天守阁 |
| 中式皇家 | \`resources/chinese_royal\` | palace, forbidden city, 故宫 |
| 中式园林 | \`resources/chinese_garden\` | garden, suzhou, 园林 |

### 🏰 Medieval & Rustic
| Style | Document | Keywords |
|-------|----------|----------|
| 哥特式 | \`resources/medieval_gothic\` | cathedral, church, 教堂 |
| 黑暗哥特 | \`resources/gothic_noir\` | horror, vampire, spooky, 鬼屋 |
| 中世纪城堡 | \`resources/medieval_castle\` | castle, fortress, 城堡 |
| 中世纪乡村 | \`resources/medieval_rustic\` | cottage, village, 小屋 |
| 乡村农场 | \`resources/rustic_farmhouse\` | barn, farm, stable, 农场 |
| 北欧/维京 | \`resources/nordic_viking\` | viking, longhouse, 维京 |

### 🏠 Modern & Industrial
| Style | Document | Keywords |
|-------|----------|----------|
| 现代极简 | \`resources/modern_minimalist\` | modern house, villa, 现代别墅 |
| 摩天大楼 | \`resources/modern_skyscraper\` | skyscraper, 摩天大楼 |
| 现代生态 | \`resources/modern_eco\` | eco, green, nature, 生态 |
| 蒸汽朋克 | \`resources/steampunk_industrial\` | steampunk, factory, 蒸汽朋克 |

### ✨ Fantasy
| Style | Document | Keywords |
|-------|----------|----------|
| 赛博朋克 | \`resources/cyberpunk\` | cyberpunk, neon, 赛博朋克 |
| 奇幻魔法 | \`resources/fantasy_magic\` | wizard, magic, 巫师 |
| 精灵/自然 | \`resources/fantasy_nature\` | elf, treehouse, 精灵 |
| 浮空岛 | \`resources/fantasy_floating\` | floating, sky, cloud, 浮空岛 |
| 水下 | \`resources/underwater_atlantis\` | underwater, atlantis, 水下 |

## How to Use

1. Identify the style from user's request
2. Read the matching document:
\`\`\`json
{ "name": "read_subdoc", "arguments": { "skill": "knowledge-skill", "doc": "resources/medieval_rustic" } }
\`\`\`
3. Apply the knowledge when generating code

**Default style if not specified: medieval_rustic**
`,
        // Generate subDocs dynamically from STYLE_KNOWLEDGE
        subDocs: Object.fromEntries(
            Object.entries(STYLE_KNOWLEDGE).map(([key, data]) => [
                `resources/${key}`,
                `---
name: ${key}
keywords: ${data.keywords.join(', ')}
---

# ${data.name}

${data.knowledge}
`
            ])
        )
    },
    'planning-skill': {
        name: 'planning-skill',
        description: 'Create building blueprints with dimensions, materials, and components.',
        content: `# 📐 Planning Skill

Create a blueprint before generating code.

## Size Guide
| Size | Width | Depth | Height |
|------|-------|-------|--------|
| tiny | 3 | 3 | 4 |
| small | 8 | 8 | 6 |
| medium | 15 | 15 | 10 |
| large | 30 | 30 | 20 |
| massive | 60 | 60 | 40 |
| colossal | 100 | 100 | 80 |

## Priority System
- frame: 100 (highest, never overwritten)
- windows/doors: 70
- roof: 60
- walls: 50
- decoration: 20
- foundation: 10

## Blueprint Template
\`\`\`json
{
  "name": "Building Name",
  "dimensions": { "width": 15, "depth": 15, "height": 10 },
  "components": ["foundation", "frame", "walls", "roof", "windows", "door"],
  "materials": { "walls": "stone_bricks", "roof": "dark_oak_stairs", "frame": "oak_log" }
}
\`\`\`
`
    },
    'construction-skill': {
        name: 'construction-skill',
        description: 'Generate JavaScript code using VoxelBuilder API.',
        content: `# 📝 Construction Skill

Generate building code using the VoxelBuilder API.

## Key Functions
\`\`\`javascript
builder.set(x, y, z, 'block');           // Single block
builder.fill(x1,y1,z1, x2,y2,z2, 'block'); // Fill area
builder.clear(x1,y1,z1, x2,y2,z2);       // Clear area (fill AIR)
builder.hollowBox(x1,y1,z1, x2,y2,z2, 'block'); // Hollow box
builder.line(x1,y1,z1, x2,y2,z2, 'block'); // Line
builder.walls(x1,y1,z1, x2,y2,z2, 'block'); // 4 walls (no floor/ceiling)

// ⭐ ROOF WITH AUTO-GABLE (推荐！)
builder.drawRoofBounds(x1, y, z1, x2, z2, height, 'straight', 'ROOF_DARK', { gable: 'white_terracotta' });

// 🎲 GEOMETRY WITH NOISE (有机形状)
builder.drawSphere(x, y, z, radius, 'stone', { noise: { amount: 0.3, scale: 0.3 } });
builder.drawCylinder(x, y, z, radius, height, 'oak_log', { noise: { amount: 0.2, scale: 0.2 } });
// amount: 0-1 (变形强度), scale: 0.1-1 (噪声频率，越小越平滑)

// Groups with priority
builder.beginGroup('name', { priority: 100 });
builder.endGroup();
\`\`\`

## 🎲 Noise Options (有机形状)
所有几何函数支持 noise 选项，让形状更自然不规则：
- \`drawSphere\`, \`drawEllipsoid\`, \`drawCylinder\`, \`drawTorus\`, \`drawPyramid\`, \`drawPolygon\`
- \`noise: { amount: 0.3, scale: 0.3 }\`
- 适合：岩石、树干、有机生物、自然地形

## ⚠️ ROOF GABLE - 重要！
**不要手动写山墙循环！** 使用 \`gable\` 选项让系统自动生成：
\`\`\`javascript
// ✅ 正确 - 使用 gable 选项
builder.drawRoofBounds(-1, WALL_HEIGHT, -1, WIDTH+1, DEPTH+1, 6, 'straight', 'ROOF_DARK', { gable: 'WALL_COBBLE' });

// ❌ 错误 - 不要手动写循环
for (let i = 0; i <= 5; i++) {
    builder.line(i, WALL_HEIGHT + i, 0, WIDTH - i, WALL_HEIGHT + i, 0, 'cobblestone');
}
\`\`\`

## Code Structure
1. Foundation (priority: 10)
2. Frame/Pillars (priority: 100)
3. Walls (priority: 50)
4. Roof with gable option (priority: 60)
5. Windows & Door (priority: 70)
6. Interior (priority: 20)
`
    },
    'quality-skill': {
        name: 'quality-skill',
        description: 'Validate code and check quality. Use before completing.',
        content: `# ✅ Quality Skill

Validate and check quality before completing.

## 🕵️ Detailed Inspection Checklist

### 1. 优先级与结构 (Priority & Structure)
- [ ] **Priority Check**: Are Pillars/Frame (Priority 100) preserved? Ensure walls or decorations do not overwrite structural columns.
- [ ] **Clipping**: Are objects clipping through walls?
- [ ] **Window Alignment**: Are windows correctly embedded IN the wall? (Glass should replace wall blocks, not float).
- [ ] **Gables**: Are roof gables filled?

### 2. 通行与空间 (Accessibility & Space)
- [ ] **Entrance Clearance**: Is the space *immediately* in front AND behind the door empty? Ensure no vines or furniture block entry.
- [ ] **Interior Fit**: Does furniture fit without clipping? Is there room to walk?

### 3. 细节与修饰 (Details & Polish)
- [ ] **Detail Eval**: Does it need more detail? (Interior/Exterior).
- [ ] **Depth**: Is the wall too flat? Add depth with trapdoors/stairs.
- [ ] **Lighting**: Is there lighting inside and out?

## Validation
Use \`validate_code\` to test code in sandbox.
Returns: { valid: true/false, blockCount: N, error: "..." }
`
    },

    'inspection-skill': {
        name: 'inspection-skill',
        description: 'Analyze scene for multi-structure placement (bounds check) and inspect code quality.',
        content: `# 🔍 Inspection Skill

This skill provides tools to **analyze and inspect** existing building code and structures.

## Available Operations

### 1. Analyze Scene Bounds (For Multi-Structure Placement)

**Use this when adding a NEW structure to an existing scene.**
It calculates the Bounding Box of the current build so you can place the next object without overlapping.

**Action:**
\`\`\`json
{
    "name": "run_script",
    "arguments": {
        "scriptName": "analyzeScene.js",
        "passCurrentCode": true
    }
}
\`\`\`

**Output:**
\`\`\`json
{
    "bounds": { "minX": 0, "maxX": 20, "maxZ": 20 },
    "size": { "width": 21, "height": 30 },
    "recommendation": "Place new structure at X=30"
}
\`\`\`
**Usage:** Use the \`size.height\` to match scales (e.g. if SpongeBob is 50 high, Patrick should be similar). Use \`maxX\` to determine start \`x\` for the next character.

### 2. Analyze Structure
Check for gaps, missing interiors, and other issues.
\`\`\`bash
node src/skills/inspection-skill/scripts/analyzeStructure.js
\`\`\`
`
    },
    'decoration-skill': {
        name: 'decoration-skill',
        description: 'Add vegetation, interior, and decorative elements.',
        content: `# 🎨 Decoration Skill

Add decorations to enhance buildings.

## Vegetation
\`\`\`javascript
builder.scatter(x1,y1,z1, x2,y2, density, ['poppy','dandelion']);
\`\`\`

## Interior Templates
- Bedroom: bed, chest, lantern
- Kitchen: smoker, cauldron, barrel
- Living: stairs (seats), crafting_table

## Weathering
- Mix mossy_cobblestone with cobblestone
- Add vines on walls
- Use cracked_stone_bricks
`
    }
};

/**
 * Generate the Agent System Prompt with Tools
 * @param {Object} config - Optional configuration
 * @param {Array} config.enabledTools - List of enabled tool IDs
 * @param {Array} config.workflow - Workflow step IDs (can include skill:xxx and script:xxx)
 * @param {string} config.customPrompt - Custom system prompt (if provided, replaces default)
 * @param {Array} config.customSkills - Custom skill definitions
 * @param {Array} config.customScripts - Custom script definitions
 */
function generateAgentPromptV2(config = {}) {
    const { enabledTools, workflow, customPrompt, customSkills = [], customScripts = [] } = config;
    
    // Default workflow if not specified
    const defaultWorkflow = ['generate_code', 'validate_code', 'modify_code', 'complete'];
    const activeWorkflow = workflow && workflow.length > 0 ? workflow : defaultWorkflow;
    
    // Default enabled tools (all tools)
    const defaultTools = Object.keys(AGENT_TOOLS_V2);
    const activeTools = enabledTools && enabledTools.length > 0 ? enabledTools : defaultTools;
    
    // Generate tools list
    const toolsList = activeTools
        .map(toolId => {
            const tool = AGENT_TOOLS_V2[toolId];
            return tool ? `- ${tool.name}: ${tool.description}` : null;
        })
        .filter(Boolean)
        .join('\n');

    // Build skill name mapping for workflow display
    const skillNameMap = {
        'construction-skill': '建筑构造',
        'knowledge-skill': '风格知识库',
        'quality-skill': '质量检查',
        'inspection-skill': '场景检查',
        'decoration-skill': '装饰技能',
        'planning-skill': '规划技能'
    };
    // Add custom skills to map
    customSkills.forEach(s => { skillNameMap[s.id] = s.name; });

    // Build script name mapping
    const scriptNameMap = {
        'analyzeStructure': '结构分析',
        'analyzeScene': '场景分析'
    };
    // Add custom scripts to map
    customScripts.forEach(s => { scriptNameMap[s.id] = s.name; });
    
    // Parse workflow steps - handle skill:xxx and script:xxx formats
    const parseWorkflowStep = (step) => {
        if (step.includes(':')) {
            const [type, id] = step.split(':');
            if (type === 'read_skill') {
                const name = skillNameMap[id] || id;
                return { type: 'skill', name: id, display: `📚 读取技能: ${name}` };
            } else if (type === 'run_script') {
                const name = scriptNameMap[id] || id;
                return { type: 'script', name: id, display: `⚙️ 执行脚本: ${name}` };
            }
        }
        return { type: 'tool', name: step, display: step };
    };
    
    // Generate workflow steps with proper formatting
    const workflowSteps = activeWorkflow
        .map((step, i) => {
            const parsed = parseWorkflowStep(step);
            return `${i + 1}. ${parsed.display}`;
        })
        .join('\n');
    
    // Generate detailed tool documentation for enabled tools
    const toolDocs = activeTools
        .map(toolId => {
            const tool = AGENT_TOOLS_V2[toolId];
            if (!tool) return null;
            
            // Generate example based on tool type
            let example = '';
            switch (toolId) {
                case 'read_skill':
                    example = `\`\`\`json\n{ "name": "read_skill", "arguments": { "skill": "knowledge-skill" } }\n\`\`\``;
                    break;
                case 'read_subdoc':
                    example = `\`\`\`json\n{ "name": "read_subdoc", "arguments": { "skill": "knowledge-skill", "doc": "resources/medieval_rustic" } }\n\`\`\``;
                    break;
                case 'run_script':
                    example = `\`\`\`json\n{ "name": "run_script", "arguments": { "script": "analyzeScene", "passCurrentCode": true } }\n\`\`\``;
                    break;
                case 'generate_code':
                    example = `\`\`\`json\n{ "name": "generate_code", "arguments": { "code": "builder.set(0,0,0,'stone');" } }\n\`\`\``;
                    break;
                case 'validate_code':
                    example = `\`\`\`json\n{ "name": "validate_code", "arguments": { "code": "builder.set(0,0,0,'stone');" } }\n\`\`\``;
                    break;
                case 'modify_code':
                    example = `\`\`\`json
// Replace lines 15-20:
{ "name": "modify_code", "arguments": { "action": "replace", "startLine": 15, "endLine": 20, "content": "// new code" } }

// Insert after line 10:
{ "name": "modify_code", "arguments": { "action": "insert", "startLine": 10, "content": "builder.set(5,1,5,'lantern');" } }

// Delete lines 25-28:
{ "name": "modify_code", "arguments": { "action": "delete", "startLine": 25, "endLine": 28 } }
\`\`\``;
                    break;
                case 'complete':
                    example = `\`\`\`json\n{ "name": "complete", "arguments": { "code": "...", "summary": "Built a medieval cottage" } }\n\`\`\``;
                    break;
            }
            
            return `### ${tool.name}\n${tool.description}\n${example}`;
        })
        .filter(Boolean)
        .join('\n\n');
    
    // Use custom prompt if provided, otherwise use SYSTEM_PROMPT from prompts.js
    const basePrompt = customPrompt || SYSTEM_PROMPT;
    
    // Generate dynamic workflow explanation based on actual workflow
    const workflowExplanations = {
        'generate_code': '生成建筑代码（从零开始创建）',
        'validate_code': '验证代码是否正确',
        'modify_code': '修改现有代码（需要画布上已有代码，或先用generate_code生成）',
        'complete': '完成构建'
    };
    
    const workflowDesc = activeWorkflow
        .map(step => {
            const parsed = parseWorkflowStep(step);
            if (parsed.type === 'skill') {
                return `- ${parsed.display}: 自动读取 ${parsed.name} 技能文档`;
            } else if (parsed.type === 'script') {
                return `- ${parsed.display}: 自动执行 ${parsed.name} 脚本`;
            } else {
                return `- ${step}: ${workflowExplanations[step] || step}`;
            }
        })
        .join('\n');
    
    // Check if modify_code is first in workflow (excluding skill/script steps)
    const toolSteps = activeWorkflow.filter(s => !s.includes(':'));
    const modifyFirst = toolSteps[0] === 'modify_code';
    const modifyFirstWarning = modifyFirst ? `
⚠️ **注意**: 你的工作流以 \`modify_code\` 开始。这意味着：
- 如果画布上已有代码，你可以直接修改它
- 如果画布上没有代码，\`modify_code\` 会失败，你需要先用 \`generate_code\` 生成代码
` : '';

    // Generate skill/script auto-execution instructions
    const autoSteps = activeWorkflow.filter(s => s.includes(':'));
    const autoStepsInstructions = autoSteps.length > 0 ? `
## 📋 自动执行步骤

以下步骤会在工作流中自动执行，你需要按顺序调用对应的工具：

${autoSteps.map(step => {
    const parsed = parseWorkflowStep(step);
    if (parsed.type === 'skill') {
        return `- **${parsed.display}**: 调用 \`read_skill\` 工具，参数 skill="${parsed.name}"`;
    } else {
        return `- **${parsed.display}**: 调用 \`run_script\` 工具，参数 script="${parsed.name}"`;
    }
}).join('\n')}
` : '';

    // Append agent-specific instructions
    return basePrompt + `

---

# 🤖 AGENT MODE (极致模式)

You are an autonomous building agent. Follow the workflow and use the available tools.

## 🛠️ AVAILABLE TOOLS

${toolDocs}

## 📖 WORKFLOW (按此顺序执行)

${workflowSteps}

**工作流说明:**
${workflowDesc}
${modifyFirstWarning}
${autoStepsInstructions}

## ⚠️ RULES

1. **You MUST call \`complete\` when finished**
2. **ALWAYS output a thought/reasoning sentence BEFORE calling any tool.**
3. **When \`generate_code\` or \`validate_code\` FAILS, use \`modify_code\` to FIX the error!**
   - ❌ **WRONG**: Regenerate entire code with \`generate_code\` again
   - ✅ **CORRECT**: Use \`modify_code\` to replace ONLY the broken lines
   - Example: Error at line 45 → use modify_code with startLine: 45
4. **NEVER regenerate 100+ lines of code just to fix 1 line!**

## 🎯 VALID MATERIALS
${Array.from(VALID_BLOCKS_1_21).slice(0, 60).join(', ')}
... (${VALID_BLOCKS_1_21.size} total)
${customSkills.length > 0 ? `

## 📝 CUSTOM SKILLS (用户自定义技能)
${customSkills.map(s => `- **${s.name}** (${s.id}): ${s.description}`).join('\n')}

使用 \`read_skill\` 工具读取自定义技能，参数为技能ID。
` : ''}${customScripts.length > 0 ? `

## 📜 CUSTOM SCRIPTS (用户自定义脚本)
${customScripts.map(s => `- **${s.name}** (${s.id}): ${s.description}`).join('\n')}

使用 \`run_script\` 工具执行自定义脚本，参数为脚本ID。
` : ''}
`;
}

/**
 * Generate the Agent Skills Mode System Prompt
 * AI autonomously decides which skills and scripts to use
 * @param {Object} config - Configuration
 * @param {Array} config.customSkills - Custom skill definitions
 * @param {Array} config.customScripts - Custom script definitions
 * @param {string} config.customPrompt - Custom system prompt (if provided, replaces default)
 */
function generateAgentSkillsPrompt(config = {}) {
    const { customPrompt, customSkills = [], customScripts = [] } = config;
    
    // Use custom prompt if provided, otherwise use SYSTEM_PROMPT from prompts.js
    const basePrompt = customPrompt || SYSTEM_PROMPT;
    
    // All available skills (official + custom)
    const officialSkills = [
        { id: 'knowledge-skill', name: '风格知识库', description: '各种建筑风格的材料、技术和设计原则。建造前先读取相关风格文档。' },
        { id: 'construction-skill', name: '建筑构造', description: 'VoxelBuilder API 使用指南和代码规范。' },
        { id: 'planning-skill', name: '规划技能', description: '建筑蓝图规划，尺寸和材料选择。' },
        { id: 'quality-skill', name: '质量检查', description: '结构质量分析，检测缺失的内饰、门窗等。' },
        { id: 'inspection-skill', name: '场景检查', description: '分析场景边界，用于多结构放置。' },
        { id: 'decoration-skill', name: '装饰技能', description: '装饰和细节指南，植被、内饰、风化效果。' }
    ];
    
    const allSkills = [...officialSkills, ...customSkills.map(s => ({ id: s.id, name: s.name, description: s.description }))];
    
    // All available scripts (official + custom)
    const officialScripts = [
        { id: 'analyzeScene', name: '场景分析', description: '分析当前场景的边界和尺寸，用于多结构放置时避免重叠。' },
        { id: 'analyzeStructure', name: '结构分析', description: '检查建筑质量，检测缺失的内饰、门窗、植被等。' }
    ];
    
    const allScripts = [...officialScripts, ...customScripts.map(s => ({ id: s.id, name: s.name, description: s.description }))];
    
    // Generate skills documentation
    const skillsDocs = allSkills.map(s => `- **${s.name}** (\`${s.id}\`): ${s.description}`).join('\n');
    
    // Generate scripts documentation
    const scriptsDocs = allScripts.map(s => `- **${s.name}** (\`${s.id}\`): ${s.description}`).join('\n');
    
    return basePrompt + `

---

# 🤖 AGENT SKILLS MODE (自主模式)

You are an autonomous building agent with access to skills and scripts. **You decide** which skills to read and which scripts to run based on the task.

## 📚 AVAILABLE SKILLS

Skills are documentation that teach you how to build. Use \`read_skill\` to read a skill's main document, and \`read_subdoc\` to read specific sub-documents.

${skillsDocs}

### How to use skills:
\`\`\`json
// Read a skill's main document
{ "name": "read_skill", "arguments": { "skill": "knowledge-skill" } }

// Read a specific sub-document (e.g., a style guide)
{ "name": "read_subdoc", "arguments": { "skill": "knowledge-skill", "doc": "resources/medieval_rustic" } }
\`\`\`

## ⚙️ AVAILABLE SCRIPTS

Scripts perform analysis and calculations. Use \`run_script\` to execute them.

${scriptsDocs}

### How to use scripts:
\`\`\`json
// Analyze scene bounds (for multi-structure placement)
{ "name": "run_script", "arguments": { "script": "analyzeScene", "passCurrentCode": true } }

// Check structure quality
{ "name": "run_script", "arguments": { "script": "analyzeStructure", "passCurrentCode": true } }
\`\`\`

## 🛠️ CORE TOOLS

- **generate_code**: Generate building code from scratch
- **modify_code**: Modify existing code (replace/insert/delete lines)
- **validate_code**: Test code in sandbox
- **complete**: Finish the build (REQUIRED at the end)

## 🎯 WORKFLOW GUIDELINES

**You decide the workflow based on the task.** Here are some common patterns:

### New Building:
1. Read relevant skill (e.g., \`knowledge-skill\` for style)
2. Read specific style document (e.g., \`resources/japanese_shrine\`)
3. Generate code
4. Validate and fix if needed
5. Complete

### Modify Existing:
1. Analyze scene if needed (\`analyzeScene\`)
2. Modify code
3. Validate
4. Complete

### Quality Check:
1. Run \`analyzeStructure\` script
2. Fix issues with \`modify_code\`
3. Complete

## ⚠️ RULES

1. **You MUST call \`complete\` when finished**
2. **Think before acting** - explain your reasoning before each tool call
3. **Read skills when needed** - don't guess, read the documentation
4. **Fix errors with modify_code** - don't regenerate entire code for small fixes
5. **Use scripts for analysis** - they provide accurate data about the scene

## 🎯 VALID MATERIALS
${Array.from(VALID_BLOCKS_1_21).slice(0, 60).join(', ')}
... (${VALID_BLOCKS_1_21.size} total)
`;
}

// ============================================================
// TOOL IMPLEMENTATIONS
// ============================================================

// Helper function to fetch skill files list from server
async function fetchSkillFiles(skillName) {
    try {
        const res = await fetch(`http://localhost:3001/api/skill-files/${skillName}`);
        if (res.ok) {
            const data = await res.json();
            return data.files || [];
        }
    } catch (e) {
        // Ignore error
    }
    return [];
}

const AGENT_TOOLS_V2 = {
    read_skill: {
        name: "read_skill",
        description: "Read a skill's documentation and get list of available sub-documents",
        parameters: {
            type: "object",
            properties: {
                skill: { type: "string", description: "Skill name (e.g., 'knowledge-skill')" }
            },
            required: ["skill"]
        },
        execute: async (args, context) => {
            // Get enabled tools from context
            const enabledTools = context?.config?.agentTools || [];
            const hasReadSubdoc = enabledTools.some(t => t === 'read_subdoc' || t.startsWith('read_subdoc:'));
            const hasRunScript = enabledTools.some(t => t === 'run_script' || t.startsWith('run_script:'));

            // Check for official skill override (user customized content)
            const officialSkillOverrides = context?.config?.officialSkillOverrides || {};
            const overrideContent = officialSkillOverrides[args.skill];
            
            // Get file list from server (now returns objects with path, name, description)
            const files = await fetchSkillFiles(args.skill);
            const allFiles = files.filter(f => f.path !== 'SKILL.md');
            
            // Separate resources and scripts
            const resourceFiles = allFiles.filter(f => f.path.startsWith('resources/'));
            const scriptFiles = allFiles.filter(f => f.path.startsWith('scripts/'));
            
            // Build available files section based on enabled tools
            const buildFilesSection = () => {
                const sections = [];
                
                if (hasReadSubdoc && resourceFiles.length > 0) {
                    const resourceList = resourceFiles.map(f => {
                        const docPath = f.path.replace('.md', '');
                        const desc = f.description ? ` - ${f.description}` : '';
                        return `- \`${docPath}\`${desc}`;
                    }).join('\n');
                    sections.push(`### 📄 Resources (use \`read_subdoc\`)\n${resourceList}`);
                }
                
                if (hasRunScript && scriptFiles.length > 0) {
                    const scriptList = scriptFiles.map(f => {
                        const scriptName = f.path.replace('scripts/', '').replace('.js', '');
                        const desc = f.description ? ` - ${f.description}` : '';
                        return `- \`${scriptName}\`${desc}`;
                    }).join('\n');
                    sections.push(`### ⚙️ Scripts (use \`run_script\`)\n${scriptList}`);
                }
                
                if (sections.length > 0) {
                    return `\n\n## 📂 Available Files\n\n${sections.join('\n\n')}`;
                }
                return '';
            };
            
            if (overrideContent) {
                return { 
                    success: true, 
                    content: overrideContent + buildFilesSection(),
                    source: 'official-override',
                    availableFiles: allFiles
                };
            }

            // Try API first (Live files)
            try {
                const res = await fetch(`http://localhost:3001/api/skill/${args.skill}`);
                if (res.ok) {
                    const data = await res.json();
                    let content = data.content + buildFilesSection();
                    return { success: true, content, source: 'live-file', availableFiles: allFiles };
                }
            } catch (e) {
                // Ignore API error, fall back to embedded
            }

            // Fallback to embedded
            const skill = SKILLS_DATABASE[args.skill];
            if (skill) {
                let content = skill.content + buildFilesSection();
                return { success: true, content, source: 'embedded', availableFiles: allFiles };
            }
            return { success: false, error: `Skill not found: ${args.skill}` };
        }
    },

    read_subdoc: {
        name: "read_subdoc",
        description: "Read additional documentation within a skill",
        parameters: {
            type: "object",
            properties: {
                skill: { type: "string" },
                doc: { type: "string" }
            },
            required: ["skill", "doc"]
        },
        execute: async (args) => {
            // Try API first (Live files)
            try {
                const res = await fetch(`http://localhost:3001/api/skill-doc/${args.skill}?doc=${args.doc}`);
                if (res.ok) {
                    const data = await res.json();
                    return { success: true, content: data.content, source: 'live-file' };
                }
            } catch (e) {
                // Ignore API error, fall back to embedded
            }

            // Fallback to embedded
            const skill = SKILLS_DATABASE[args.skill];
            if (skill?.subDocs?.[args.doc]) {
                return { success: true, content: skill.subDocs[args.doc], source: 'embedded' };
            }
            return { success: false, error: `Document not found: ${args.skill}/${args.doc}` };
        }
    },

    run_script: {
        name: "run_script",
        description: "Execute a skill operation",
        parameters: {
            type: "object",
            properties: {
                script: { type: "string", description: "Script name" },
                args: { type: "array", items: { type: "string" } }
            },
            required: ["script"]
        },
        execute: async (args, context) => {
            const scriptName = args.script;
            const scriptArgs = args.args || [];

            // Check for custom script first (from settings)
            const customScripts = context?.config?.customScripts || [];
            const customScript = customScripts.find(s => s.id === scriptName);
            if (customScript && customScript.content) {
                try {
                    // Execute custom script in a safe context
                    const scriptFn = new Function('context', 'args', customScript.content);
                    const result = scriptFn(context, scriptArgs);
                    return { success: true, result, source: 'custom-script' };
                } catch (e) {
                    return { success: false, error: `Custom script error: ${e.message}` };
                }
            }

            // Check for official script override (user customized content)
            const officialScriptOverrides = context?.config?.officialScriptOverrides || {};
            const overrideContent = officialScriptOverrides[scriptName];
            if (overrideContent) {
                try {
                    // Execute overridden script in a safe context
                    const scriptFn = new Function('context', 'args', overrideContent);
                    const result = scriptFn(context, scriptArgs);
                    return { success: true, result, source: 'official-override' };
                } catch (e) {
                    return { success: false, error: `Override script error: ${e.message}` };
                }
            }

            // === SCENE ANALYSIS: analyzeScene.js ===
            if (scriptName === 'analyzeScene.js' || scriptName === 'analyzeScene') {
                const code = context.currentCode || '';
                if (!code) {
                    return { success: false, error: 'No code found in context to analyze.' };
                }

                try {
                    // Use the existing sandbox executor to get voxels
                    const voxels = executeVoxelScript(code, true);

                    if (voxels.length === 0) {
                        return {
                            success: true,
                            result: { exists: false, message: "Scene is empty", bounds: null }
                        };
                    }

                    // Calculate Bounds
                    let minX = Infinity, maxX = -Infinity;
                    let minY = Infinity, maxY = -Infinity;
                    let minZ = Infinity, maxZ = -Infinity;

                    voxels.forEach(v => {
                        const [x, y, z] = v.position;
                        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
                    });

                    const bounds = { minX, maxX, minY, maxY, minZ, maxZ };
                    const size = {
                        width: maxX - minX + 1,
                        height: maxY - minY + 1,
                        depth: maxZ - minZ + 1
                    };
                    const center = {
                        x: Math.round((minX + maxX) / 2),
                        y: minY,
                        z: Math.round((minZ + maxZ) / 2)
                    };

                    return {
                        success: true,
                        result: {
                            exists: true,
                            blockCount: voxels.length,
                            bounds,
                            size,
                            center,
                            recommendation: `Existing structure bounds: X[${minX}, ${maxX}] Z[${minZ}, ${maxZ}]. Place new structure at least at X=${maxX + 5} or Z=${maxZ + 5} to avoid overlap.`
                        }
                    };

                } catch (e) {
                    return { success: false, error: `Analysis failed: ${e.message}` };
                }
            }

            // === QUALITY CHECK: analyzeStructure ===
            if (scriptName === 'analyzeStructure' || scriptName === 'analyzeStructure.js') {
                const code = scriptArgs[0] || context.currentCode || '';
                // Allow AI to pass options to skip certain checks (e.g. for trees, statues)
                // Usage: run_script('analyzeStructure', [code, { skip: ['interior', 'openings'] }])
                let options = scriptArgs[1] || {};

                // Handle case where options might be passed as a JSON string
                if (typeof options === 'string') {
                    try { options = JSON.parse(options); } catch (e) { options = {}; }
                }

                if (!code) {
                    return { success: false, error: 'No code provided for analysis' };
                }

                try {
                    // Execute the code to get voxels
                    const voxels = executeVoxelScript(code, true);

                    // Categorize blocks
                    const categories = {
                        interior: ['bed', 'chest', 'furnace', 'crafting_table', 'cauldron', 'barrel', 'lantern', 'lectern', 'bookshelf', 'smoker', 'anvil'],
                        nature: ['leaves', 'vine', 'grass', 'flower', 'poppy', 'dandelion', 'azalea', 'moss', 'fern', 'sapling'],
                        openings: ['door', 'glass', 'pane', 'trapdoor', 'iron_bars']
                    };

                    const counts = { interior: 0, nature: 0, openings: 0, total: voxels.length };

                    for (const voxel of voxels) {
                        const type = voxel.type.toLowerCase();
                        for (const [cat, keywords] of Object.entries(categories)) {
                            if (keywords.some(kw => type.includes(kw))) {
                                counts[cat]++;
                                break;
                            }
                        }
                    }

                    // Quality thresholds & Smart Contextual Feedback
                    const errors = [];
                    const codeLower = code.toLowerCase();
                    const skipList = Array.isArray(options.skip) ? options.skip : [];

                    // Check Interior (Unless skipped)
                    if (!skipList.includes('interior') && counts.interior < 3) {
                        let msg = 'Missing interior furniture (need at least 3 items: bed, chest, table, etc.)';
                        // Smart check: Did AI try to add them but they got overwritten?
                        if (codeLower.includes('bed') || codeLower.includes('chair') || codeLower.includes('table')) {
                            msg += ' [HINT: Keywords found in code but blocks are missing. Check PRIORITY! Is a Priority 100 wall/pillar overwriting your Priority 50 furniture?]';
                        }
                        errors.push(msg);
                    }

                    // Check Nature (Unless skipped)
                    if (!skipList.includes('nature') && counts.nature < 5) {
                        errors.push('Missing nature elements (need at least 5: flowers, grass, vines, etc.)');
                    }

                    // Check Openings (Unless skipped)
                    if (!skipList.includes('openings') && counts.openings < 2) {
                        let msg = 'Missing openings (need at least 2: door, windows)';
                        // Smart check for overwrite
                        if (codeLower.includes('door') || codeLower.includes('glass')) {
                            msg += ' [HINT: Keywords found in code but blocks are missing. Check PRIORITY! Is a solid wall overwriting your door/window?]';
                        }
                        errors.push(msg);
                    }

                    // If skipped, add a info note
                    const skippedMsg = skipList.length > 0 ? ` (Skipped checks: ${skipList.join(', ')})` : '';

                    return {
                        success: true,
                        result: {
                            valid: errors.length === 0,
                            blockCount: counts.total,
                            interiorCount: counts.interior,
                            natureCount: counts.nature,
                            openingsCount: counts.openings,
                            errors: errors,
                            message: errors.length === 0
                                ? '✅ Quality check passed!'
                                : `⚠️ Quality issues found: ${errors.join('; ')}`
                        }
                    };
                } catch (err) {
                    return { success: false, error: `Analysis failed: ${err.message}` };
                }
            }

            return { success: false, error: `Unknown script: ${scriptName}` };
        }
    },

    generate_code: {
        name: "generate_code",
        description: "Output building code",
        parameters: {
            type: "object",
            properties: {
                code: { type: "string", description: "JavaScript building code" }
            },
            required: ["code"]
        },
        execute: async (args, context) => { // Made async
            const code = args.code || '';
            
            // Check if code appears truncated (common signs)
            const isTruncated = (
                code.endsWith(',') ||
                code.endsWith('(') ||
                code.endsWith('{') ||
                code.endsWith('[') ||
                (code.split('{').length !== code.split('}').length) ||
                (code.split('(').length !== code.split(')').length)
            );
            
            if (isTruncated) {
                // Save partial code so AI can continue
                context.currentCode = code;
                const lastLines = code.split('\n').slice(-5).join('\n');
                const totalLines = code.split('\n').length;
                return {
                    success: false,
                    error: "Code appears truncated (incomplete brackets or trailing comma). The partial code has been saved.",
                    hint: `⚠️ CODE TRUNCATED! Use modify_code with action="insert" to append the remaining code after line ${totalLines}.`,
                    truncated: true,
                    savedCode: true,
                    lastLines: lastLines,
                    totalLines: totalLines,
                    instruction: "DO NOT call generate_code again! Use modify_code({ action: 'insert', startLine: " + totalLines + ", content: '...' }) to append the rest."
                };
            }
            
            // Always save code to context so modify_code can work even if validation fails
            context.currentCode = code;
            try {
                const voxels = executeVoxelScript(code, true);
                return { success: true, blockCount: voxels.length };
            } catch (err) {
                // Return error with hint to use modify_code instead of regenerating
                const lines = code.split('\n');
                // Try to find the error line number from the error message
                const lineMatch = err.message.match(/line (\d+)/i);
                const errorLine = lineMatch ? lineMatch[1] : 'the broken';
                return { 
                    success: false, 
                    error: err.message,
                    hint: `⚠️ DO NOT regenerate the entire code! Use modify_code with action="replace" to fix ONLY line ${errorLine}. Example: modify_code({ action: "replace", startLine: ${errorLine}, endLine: ${errorLine}, content: "fixed code" })`,
                    savedCode: true,
                    totalLines: lines.length
                };
            }
        }
    },

    modify_code: {
        name: "modify_code",
        description: "Modify existing code by line numbers. Actions: replace (replace lines), insert (insert after line), delete (delete lines).",
        parameters: {
            type: "object",
            properties: {
                action: { 
                    type: "string", 
                    enum: ["replace", "insert", "delete"],
                    description: "replace: replace lines X-Y with content. insert: insert content after line X. delete: delete lines X-Y."
                },
                startLine: { type: "number", description: "Starting line number (1-indexed)" },
                endLine: { type: "number", description: "Ending line number (for replace/delete). Optional for insert." },
                content: { type: "string", description: "New code content (for replace/insert)" }
            },
            required: ["action", "startLine"]
        },
        execute: async (args, context) => {
            // 如果没有代码，提示使用 generate_code
            if (!context.currentCode || !context.currentCode.trim()) {
                return { 
                    success: false, 
                    error: "No existing code to modify.",
                    hint: "Use generate_code first to create code, then you can modify it.",
                    action: "use_generate_code"  // 提示AI应该用哪个工具
                };
            }

            const lines = context.currentCode.split('\n');
            const { action, startLine, endLine, content } = args;
            
            // Validate line numbers
            if (startLine < 1 || startLine > lines.length + 1) {
                return { success: false, error: `Invalid startLine: ${startLine}. Code has ${lines.length} lines.` };
            }

            let newLines = [...lines];
            
            switch (action) {
                case 'replace': {
                    const end = endLine || startLine;
                    if (end < startLine || end > lines.length) {
                        return { success: false, error: `Invalid endLine: ${end}` };
                    }
                    const contentLines = content ? content.split('\n') : [];
                    // Replace lines startLine to endLine (1-indexed, inclusive)
                    newLines.splice(startLine - 1, end - startLine + 1, ...contentLines);
                    break;
                }
                case 'insert': {
                    const contentLines = content ? content.split('\n') : [];
                    // Insert after startLine
                    newLines.splice(startLine, 0, ...contentLines);
                    break;
                }
                case 'delete': {
                    const end = endLine || startLine;
                    if (end < startLine || end > lines.length) {
                        return { success: false, error: `Invalid endLine: ${end}` };
                    }
                    // Delete lines startLine to endLine
                    newLines.splice(startLine - 1, end - startLine + 1);
                    break;
                }
                default:
                    return { success: false, error: `Unknown action: ${action}` };
            }

            const newCode = newLines.join('\n');

            try {
                const voxels = executeVoxelScript(newCode, true);
                context.currentCode = newCode;
                return { 
                    success: true, 
                    valid: true, 
                    blockCount: voxels.length, 
                    message: `Code ${action}d successfully. Lines: ${startLine}${endLine ? `-${endLine}` : ''}`,
                    totalLines: newLines.length
                };
            } catch (err) {
                // Save the invalid code so the agent can fix it
                context.currentCode = newCode;
                return { success: false, error: `Modification resulted in invalid code: ${err.message}` };
            }
        }
    },

    validate_code: {
        name: "validate_code",
        description: "Validate code in sandbox. If no code is provided, validates the current code in context.",
        parameters: {
            type: "object",
            properties: {
                code: { type: "string", description: "Code to validate. If omitted, uses current code from context." }
            },
            required: []  // code is now optional
        },
        execute: async (args, context) => {
            // Use provided code or fall back to context
            const codeToValidate = args.code || context.currentCode;
            
            if (!codeToValidate || !codeToValidate.trim()) {
                return { 
                    success: false, 
                    valid: false, 
                    error: "No code to validate. Use generate_code or modify_code first.",
                    hint: "You must have code before validating. Use generate_code to create new code."
                };
            }
            
            try {
                const voxels = executeVoxelScript(codeToValidate, true);
                // Save validated code to context
                context.currentCode = codeToValidate;
                return { success: true, valid: true, blockCount: voxels.length };
            } catch (err) {
                return { 
                    success: false, 
                    valid: false, 
                    error: err.message,
                    hint: "⚠️ Use modify_code to fix the specific error instead of regenerating the entire code."
                };
            }
        }
    },

    complete: {
        name: "complete",
        description: "Mark build as complete. Requires code from generate_code or modify_code.",
        parameters: {
            type: "object",
            properties: {
                code: { type: "string", description: "Final code. If omitted, uses current code from context." },
                summary: { type: "string" },
                skipQualityChecks: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional. List of checks to skip (e.g. ['interior', 'openings']) for special structures like trees/statues."
                }
            },
            required: ["summary"]  // code is now optional, summary still required
        },
        execute: async (args, context) => {
            // Use provided code or fall back to context
            const finalCode = args.code || context.currentCode;
            
            if (!finalCode || !finalCode.trim()) {
                return {
                    success: false,
                    error: "No code to complete. Use generate_code or modify_code first.",
                    hint: "You must generate or modify code before completing the build."
                };
            }
            
            return {
                success: true,
                final: true,
                code: finalCode,
                summary: args.summary
            };
        }
    },
};

/**
 * Get tools schema for API
 * @param {Array} enabledTools - Optional list of enabled tool IDs
 */
function getToolsSchemaV2(enabledTools = null) {
    const tools = Object.values(AGENT_TOOLS_V2);
    const filteredTools = enabledTools 
        ? tools.filter(tool => enabledTools.includes(tool.name))
        : tools;
    
    return filteredTools.map(tool => ({
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }
    }));
}

/**
 * Execute a tool
 */
async function executeToolV2(toolName, args, context) {
    const tool = AGENT_TOOLS_V2[toolName];
    if (!tool) {
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
    return await tool.execute(args, context);
}

/**
 * Run the Agent Loop V2
 * @param {Array} conversationHistory - Optional. Existing conversation messages to continue from.
 * @param {Object} agentConfig - Optional. Agent configuration from settings.
 * @returns {Object} - { code, summary, messages } - includes updated conversation history
 */
export async function runAgentLoopV2(
    userPrompt,
    apiKey,
    baseUrl,
    model,
    callbacks,
    currentCode = null,
    imageUrl = null,
    signal = null,
    conversationHistory = null,
    agentConfig = null // NEW: Agent configuration from settings
) {
    // Build system prompt based on config
    const config = agentConfig || {};
    const basePrompt = config.agentSystemPrompt || SYSTEM_PROMPT;
    
    // Check if Agent Skills mode (autonomous mode)
    const isAgentSkillsMode = config.generationMode === 'agentSkills';
    
    let agentSystemPrompt;
    if (isAgentSkillsMode) {
        // Agent Skills mode: AI decides workflow autonomously
        agentSystemPrompt = generateAgentSkillsPrompt({
            customPrompt: config.agentSystemPrompt ? basePrompt : null,
            customSkills: config.customSkills || [],
            customScripts: config.customScripts || []
        });
    } else {
        // Workflow mode: Follow preset workflow steps
        agentSystemPrompt = basePrompt + generateAgentPromptV2({
            enabledTools: config.agentTools,
            workflow: config.agentWorkflow,
            customPrompt: config.agentSystemPrompt ? basePrompt : null,
            customSkills: config.customSkills || [],
            customScripts: config.customScripts || []
        });
    }
    
    // Get enabled tools (in Agent Skills mode, enable all tools)
    const enabledTools = isAgentSkillsMode ? null : (config.agentTools || null);

    const context = {
        currentCode: currentCode || '',
        userPrompt,
        imageUrl,
        config: config // Pass config to tools for custom skills/scripts
    };

    // Conversation history - use existing or start fresh
    // IMPORTANT: Filter out tool_calls and tool role messages to avoid API compatibility issues
    // Some APIs (Gemini, etc.) require special formatting for tool calls that doesn't persist well
    let messages = [];
    if (conversationHistory && conversationHistory.length > 0) {
        messages = conversationHistory
            .filter(msg => {
                // Keep user messages
                if (msg.role === 'user') return true;
                // Keep assistant messages ONLY if they have text content and NO tool_calls
                if (msg.role === 'assistant') {
                    const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
                    const hasContent = msg.content && msg.content.length > 0;
                    return hasContent && !hasToolCalls;
                }
                // Filter out 'tool' role messages (function results)
                return false;
            })
            .map(msg => {
                // Ensure assistant messages only have string content
                if (msg.role === 'assistant' && msg.content) {
                    return { role: 'assistant', content: String(msg.content) };
                }
                return msg;
            });
        console.log(`[Agent V2] Filtered conversation history: ${conversationHistory.length} -> ${messages.length} messages`);
    }

    // 如果有现有代码，添加到消息中让AI知道（带行号）
    if (currentCode && currentCode.trim()) {
        const codeWithLineNumbers = addLineNumbers(currentCode);
        const codePreview = codeWithLineNumbers.length > 3000 
            ? codeWithLineNumbers.substring(0, 3000) + '\n... (truncated, ' + currentCode.length + ' chars total)'
            : codeWithLineNumbers;
        messages.push({
            role: 'system',
            content: `[EXISTING CODE ON CANVAS - ${currentCode.split('\n').length} lines, ${currentCode.length} chars]
The user wants to MODIFY this existing structure. Use modify_code to make changes, NOT generate_code.

\`\`\`javascript
${codePreview}
\`\`\`

⚠️ IMPORTANT: Do NOT regenerate the entire code! Use modify_code with line numbers to make targeted changes.
Example: modify_code({ action: "replace", startLine: 15, endLine: 20, content: "new code here" })`
        });
    }

    // Add user request with optional image
    if (imageUrl) {
        messages.push({
            role: 'user',
            content: [
                { type: "text", text: userPrompt },
                { type: "image_url", image_url: { url: imageUrl } }
            ]
        });
    } else {
        messages.push({ role: 'user', content: userPrompt });
    }

    let iteration = 0;
    let finalResult = null;

    // Dev Console: Log system prompt and initial user message
    callbacks.onDevLog?.({ type: 'section', title: 'AGENT V2 SESSION STARTED' });
    callbacks.onDevLog?.({ type: 'system', content: agentSystemPrompt });
    if (currentCode) callbacks.onDevLog?.({ type: 'info', content: `📝 Existing code: ${currentCode.length} chars` });
    callbacks.onDevLog?.({ type: 'user', content: userPrompt });

    debugSection('AGENT V2 STARTED');
    debugLog('User Prompt:', userPrompt);
    if (currentCode) debugLog('Has Existing Code:', currentCode.length, 'chars');
    if (imageUrl) debugLog('Has Image URL:', imageUrl.substring(0, 50) + '...');

    callbacks.onStatus?.('🤖 Agent V2 Starting...');

    while (iteration < MAX_ITERATIONS && !finalResult) {
        // CHECK FOR ABORT
        if (signal?.aborted) {
            console.log('[Agent V2] Aborted by user.');
            callbacks.onStatus?.('🛑 Agent Stopped');
            callbacks.onDevLog?.({ type: 'info', content: '🛑 Agent Stopped by User' });
            throw new Error('AbortedByUser');
        }

        iteration++;

        callbacks.onThinking?.(iteration);
        callbacks.onStatus?.(`Thinking: Step ${iteration}`);

        try {
            // Build the messages array for this request
            const requestMessages = [
                { role: 'system', content: agentSystemPrompt },
                ...messages
            ];
            
            // Log the request to dev console
            callbacks.onDevLog?.({ 
                type: 'info', 
                content: `🔄 Calling API (iteration ${iteration})...\n📨 Messages: ${requestMessages.length} (system + ${messages.length} conversation)`,
                iteration 
            });
            
            // Log conversation messages (excluding system prompt which is already shown)
            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                const msgPreview = lastMsg.role === 'tool' 
                    ? `[tool result: ${lastMsg.name}]`
                    : lastMsg.role === 'assistant' && lastMsg.tool_calls
                        ? `[assistant with ${lastMsg.tool_calls.length} tool calls]`
                        : `[${lastMsg.role}]: ${String(lastMsg.content || '').substring(0, 100)}...`;
                callbacks.onDevLog?.({ 
                    type: 'info', 
                    content: `📝 Last message: ${msgPreview}`,
                    iteration 
                });
            }
            
            // Use non-streaming API call (streaming disabled due to Gemini thought_signature issues)
            callbacks.onDevLog?.({ type: 'info', content: '🔄 Calling API...' });
            callbacks.onStatus?.(`⏳ 等待 AI 响应中... (Step ${iteration})`);
            
            const response = await fetchWithRetry(
                `${baseUrl}/chat/completions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: requestMessages,
                        tools: getToolsSchemaV2(enabledTools),
                        tool_choice: 'auto',
                        max_tokens: config.maxTokens || 16384
                    }),
                    signal
                },
                callbacks
            );
            
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error ${response.status}: ${errText}`);
            }
            
            const data = await response.json();

            const aiMessage = data.choices[0].message;

            // Debug: Show AI response
            debugSection(`ITERATION ${iteration} - AI RESPONSE`);

            // Show AI thinking/reasoning text (if any)
            if (aiMessage.content) {
                debugLog('💭 AI Thinking:');
                console.log('%c' + aiMessage.content, 'color: #4ade80; font-style: italic;');
                // Dev Console: Log AI response
                callbacks.onDevLog?.({ type: 'ai', content: aiMessage.content, iteration });
            } else {
                debugLog('(No text content - AI went straight to tool calls)');
                callbacks.onDevLog?.({ type: 'ai', content: '(AI made tool calls without text response)', iteration });
            }

            // Show what tools the AI decided to call
            if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
                debugLog(`\n🔧 AI decided to call ${aiMessage.tool_calls.length} tool(s):`);
                aiMessage.tool_calls.forEach((tc, i) => {
                    console.log(`   ${i + 1}. ${tc.function.name}`);
                });
            }

            // Ensure content exists for API compatibility (Gemini requires text with tool calls)
            if (!aiMessage.content && aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
                aiMessage.content = "I will proceed with the tool execution.";
            }

            // Add AI response to history
            messages.push(aiMessage);

            // Check for tool calls
            if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
                const executedCalls = new Set();
                
                // Parse all tool calls first
                const parsedCalls = aiMessage.tool_calls.map(toolCall => {
                    const toolName = toolCall.function.name;
                    let toolArgs;
                    try {
                        toolArgs = JSON.parse(toolCall.function.arguments);
                    } catch {
                        toolArgs = {};
                    }
                    return { toolCall, toolName, toolArgs };
                });
                
                // Log all tool calls
                debugLog(`\n${'─'.repeat(40)}`);
                debugLog(`📞 TOOL CALLS: ${parsedCalls.length} tool(s) to execute in parallel`);
                parsedCalls.forEach(({ toolName, toolArgs }, i) => {
                    if (toolName === 'generate_code') {
                        debugLog(`  ${i + 1}. ${toolName} (${(toolArgs.code || '').length} chars)`);
                    } else if (toolName === 'read_skill') {
                        debugLog(`  ${i + 1}. ${toolName}: ${toolArgs.skill}`);
                    } else if (toolName === 'read_subdoc') {
                        debugLog(`  ${i + 1}. ${toolName}: ${toolArgs.skill}/${toolArgs.doc}`);
                    } else if (toolName === 'run_script') {
                        debugLog(`  ${i + 1}. ${toolName}: ${toolArgs.script}`);
                    } else {
                        debugLog(`  ${i + 1}. ${toolName}`);
                    }
                });
                
                // Deduplicate and filter
                const uniqueCalls = parsedCalls.filter(({ toolName, toolArgs }) => {
                    const callSignature = `${toolName}:${JSON.stringify(toolArgs)}`;
                    if (executedCalls.has(callSignature)) {
                        console.warn(`[Agent] Skipping duplicate tool call: ${toolName}`);
                        return false;
                    }
                    executedCalls.add(callSignature);
                    return true;
                });
                
                // Notify start for all tools
                uniqueCalls.forEach(({ toolName, toolArgs }) => {
                    callbacks.onDevLog?.({ type: 'tool_call', name: toolName, args: toolArgs, iteration });
                    callbacks.onSkillStart?.(toolName, toolArgs);
                    callbacks.onSkillDetail?.({
                        type: 'start',
                        iteration,
                        toolName,
                        toolArgs,
                        timestamp: Date.now()
                    });
                });
                
                callbacks.onStatus?.(`Executing ${uniqueCalls.length} tool(s) in parallel...`);
                
                // Execute all tools in parallel
                const results = await Promise.all(
                    uniqueCalls.map(async ({ toolCall, toolName, toolArgs }) => {
                        const result = await executeToolV2(toolName, toolArgs, context);
                        return { toolCall, toolName, toolArgs, result };
                    })
                );
                
                // Process results
                for (const { toolCall, toolName, toolArgs, result } of results) {
                    // Debug: Show tool result
                    debugLog(`\n📤 RESULT [${toolName}]: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);

                    // Show relevant result details based on tool type
                    if (result.blockCount !== undefined) {
                        debugLog(`   📦 Block Count: ${result.blockCount}`);
                    }
                    if (result.error) {
                        console.log('%c   ❌ Error: ' + result.error, 'color: #f87171;');
                    }
                    if (result.qualityReport) {
                        debugLog(`   📊 Quality Report:`);
                        console.log('      Valid:', result.qualityReport.valid);
                        console.log('      Interior:', result.qualityReport.interiorCount);
                        console.log('      Nature:', result.qualityReport.natureCount);
                        console.log('      Openings:', result.qualityReport.openingsCount);
                        if (result.qualityReport.errors && result.qualityReport.errors.length > 0) {
                            console.log('%c      Issues: ' + result.qualityReport.errors.join('; '), 'color: #fbbf24;');
                        }
                    }
                    // Show document content for read operations (first 500 chars)
                    if (result.content && (toolName === 'read_skill' || toolName === 'read_subdoc')) {
                        debugLog('   📄 Document Content (first 500 chars):');
                        console.log('%c' + result.content.substring(0, 500), 'color: #60a5fa; font-size: 11px;');
                        if (result.content.length > 500) {
                            console.log(`      ... (${result.content.length - 500} more chars)`);
                        }
                    }

                    // Dev Console: Log tool result
                    callbacks.onDevLog?.({ type: 'tool_result', name: toolName, result, iteration });

                    // Enhanced callback with result
                    callbacks.onSkillComplete?.(toolName, result);
                    callbacks.onStatus?.(result.success ? `SkillDone: ${toolName}` : `SkillError: ${toolName}`);

                    // Notify with detailed result
                    callbacks.onSkillDetail?.({
                        type: 'result',
                        iteration,
                        toolName,
                        toolArgs,
                        result,
                        timestamp: Date.now()
                    });

                    // Add tool result to history
                    const toolResult = {
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: toolName,
                        content: JSON.stringify(result)
                    };
                    
                    debugLog('📤 Adding tool result to messages:', {
                        tool_call_id: toolResult.tool_call_id,
                        name: toolResult.name,
                        contentLength: toolResult.content?.length
                    });
                    
                    messages.push(toolResult);

                    // Check if complete
                    if (result.final) {
                        finalResult = result;
                    }
                    
                    // AUTO-CONTINUE: If code was truncated, add a system hint to continue
                    if (result.truncated && toolName === 'generate_code') {
                        debugLog('⚠️ Code truncated! Adding auto-continue hint...');
                        callbacks.onDevLog?.({ 
                            type: 'warning', 
                            content: '⚠️ 代码被截断，自动提示AI继续生成...' 
                        });
                        callbacks.onStatus?.('Code truncated, prompting AI to continue...');
                        
                        messages.push({
                            role: 'user',
                            content: `⚠️ AUTO-CONTINUE: Your code was truncated at line ${result.totalLines}! The last 5 lines were:\n\`\`\`\n${result.lastLines}\n\`\`\`\n\nUse modify_code to APPEND the remaining code:\n{ "action": "insert", "startLine": ${result.totalLines}, "content": "...remaining code..." }\n\nDo NOT regenerate the entire code!`
                        });
                    }
                }
                
                // Break out of loop if we got a final result
                if (finalResult) {
                    break;
                }
            } else if (aiMessage.content) {
                // AI provided text response without tool call
                // This can cause the loop to stall - prompt AI to take action
                callbacks.onStatus?.(`Agent thinking...`);
                callbacks.onDevLog?.({ 
                    type: 'warning', 
                    content: '⚠️ AI 只返回了文字，没有调用工具，正在提示继续...' 
                });
                
                // Add a nudge to get AI to call a tool
                messages.push({
                    role: 'user',
                    content: '请继续执行工作流，调用下一个工具。如果已完成所有步骤，请调用 complete 工具完成构建。'
                });
            } else {
                // AI returned neither content nor tool_calls - this is unusual
                callbacks.onDevLog?.({ 
                    type: 'warning', 
                    content: '⚠️ AI 返回了空响应，正在重试...' 
                });
                callbacks.onStatus?.('Empty response, retrying...');
            }

        } catch (err) {
            callbacks.onError?.('agent', err);
            throw err;
        }
    }

    if (!finalResult) {
        // If we hit max iterations, use the last code we have
        finalResult = {
            code: context.currentCode,
            summary: "Build completed (max iterations reached)"
        };
        debugLog('⚠️ Max iterations reached!');
    }

    debugSection('AGENT COMPLETE');
    debugLog('Total Iterations:', iteration);
    debugLog('Summary:', finalResult.summary);
    debugLog('Code Length:', finalResult.code?.length || 0, 'chars');
    debugLog('Conversation History:', messages.length, 'messages');
    if (finalResult.qualityReport) {
        debugLog('Quality Report:', finalResult.qualityReport);
    }

    // Include messages in the result for conversation persistence
    finalResult.messages = messages;

    callbacks.onComplete?.(finalResult);
    callbacks.onStatus?.('Build complete!');

    // Stream the final code - REMOVED per user request for cleaner UI
    // if (callbacks.onChunk && finalResult.code) {
    //     const mdContent = `Here is the verified construction script:\n\`\`\`javascript\n${finalResult.code}\n\`\`\``;
    //     callbacks.onChunk(mdContent, mdContent);
    // }

    return finalResult;
}

/**
 * Wrapper for App.jsx compatibility
 * @param {Array} conversationHistory - Optional. Existing messages to continue conversation.
 * @param {Object} agentConfig - Optional. Agent configuration from settings.
 */
export async function agentGenerateV2(
    userPrompt,
    apiKey,
    baseUrl,
    model,
    callbacks,
    currentCode,
    imageUrl,
    signal,
    conversationHistory = null,
    agentConfig = null // NEW: Agent configuration
) {
    return runAgentLoopV2(userPrompt, apiKey, baseUrl, model, callbacks, currentCode, imageUrl, signal, conversationHistory, agentConfig);
}

export { generateAgentSkillsPrompt };

export default {
    runAgentLoopV2,
    agentGenerateV2,
    getToolsSchemaV2,
    executeToolV2,
    SKILLS_DATABASE,
    generateAgentSkillsPrompt
};
