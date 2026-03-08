/**
 * Skills Registry - Anthropic Agent Skills Standard
 * 
 * This module loads all installed skills and provides their metadata
 * for the Agent's system prompt.
 * 
 * Each skill is a directory containing:
 * - SKILL.md: Main documentation with YAML frontmatter (name, description)
 * - Additional .md files: Reference documentation
 * - scripts/: Executable code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All installed skill directories
const SKILL_DIRS = [
    'knowledge-skill',
    'planning-skill',
    'construction-skill',
    'inspection-skill',
    'decoration-skill',
    'quality-skill'
];

/**
 * Parse YAML frontmatter from a SKILL.md file
 */
function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = match[1];
    const result = {};

    // Simple YAML parsing for name and description
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

    if (nameMatch) result.name = nameMatch[1].trim();
    if (descMatch) result.description = descMatch[1].trim();

    return result;
}

/**
 * Load metadata for all installed skills
 * Returns an array of { name, description, path } objects
 */
export function loadSkillsMetadata() {
    const skills = [];

    for (const skillDir of SKILL_DIRS) {
        const skillPath = path.join(__dirname, skillDir);
        const skillMdPath = path.join(skillPath, 'SKILL.md');

        try {
            if (fs.existsSync(skillMdPath)) {
                const content = fs.readFileSync(skillMdPath, 'utf-8');
                const metadata = parseFrontmatter(content);

                if (metadata && metadata.name && metadata.description) {
                    skills.push({
                        name: metadata.name,
                        description: metadata.description,
                        path: `src/skills/${skillDir}/SKILL.md`,
                        directory: skillDir
                    });
                }
            }
        } catch (err) {
            console.error(`Error loading skill ${skillDir}:`, err.message);
        }
    }

    return skills;
}

/**
 * Generate the skills section for the Agent's system prompt
 * This is the "progressive disclosure" first level - only names and descriptions
 */
export function generateSkillsPrompt() {
    const skills = loadSkillsMetadata();

    let prompt = `
## 📚 INSTALLED SKILLS

You have access to the following skills. To use a skill, read its SKILL.md file.

| Skill | Description | Path |
|-------|-------------|------|
`;

    for (const skill of skills) {
        prompt += `| ${skill.name} | ${skill.description.substring(0, 80)}... | \`${skill.path}\` |\n`;
    }

    prompt += `
### How to Use Skills

1. **Discover**: Read this table to find the relevant skill
2. **Load**: Use the read_file tool to read the skill's SKILL.md: \`read_file("${skills[0]?.path || 'src/skills/skill-name/SKILL.md'}")\`
3. **Learn**: The SKILL.md contains detailed instructions and may reference additional files
4. **Execute**: Follow the instructions in SKILL.md (run scripts, use templates, etc.)

### Example

\`\`\`
User: Build a medieval cottage

Agent Thinking: 
- I need architectural knowledge first
- Reading knowledge_skill...

Action: read_file("src/skills/knowledge-skill/SKILL.md")
\`\`\`
`;

    return prompt;
}

/**
 * Get the content of a skill's file
 */
export function readSkillFile(relativePath) {
    // Handle paths like "src/skills/knowledge-skill/SKILL.md"
    const cleanPath = relativePath.replace(/^src\/skills\//, '');
    const fullPath = path.join(__dirname, cleanPath);

    try {
        return fs.readFileSync(fullPath, 'utf-8');
    } catch (err) {
        return `Error reading file: ${err.message}`;
    }
}

/**
 * List all files in a skill directory
 */
export function listSkillFiles(skillName) {
    const skillPath = path.join(__dirname, skillName);

    try {
        const files = fs.readdirSync(skillPath, { recursive: true });
        return files.map(f => `src/skills/${skillName}/${f}`);
    } catch (err) {
        return [];
    }
}

// Export loadable skills for the main agent
export const SKILLS_METADATA = loadSkillsMetadata();
export const SKILLS_PROMPT = generateSkillsPrompt();

export default {
    loadSkillsMetadata,
    generateSkillsPrompt,
    readSkillFile,
    listSkillFiles,
    SKILLS_METADATA,
    SKILLS_PROMPT
};
