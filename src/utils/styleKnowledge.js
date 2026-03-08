/**
 * Style Knowledge Base
 * 建筑风格知识库 - 用于在AI生成代码前注入专业建筑知识
 * Refined into granular sub-categories for precise generation
 */

export const STYLE_KNOWLEDGE = {
  // ============ 特殊结构类型 (Structure Types) ============
  // ⚠️ 优先级最高：如果用户想要雕像，不应套用建筑规则

  // Type 1. 雕像/生物 (Statue)
  type_statue: {
    keywords: ['statue', 'sculpture', 'figure', 'mob', 'dragon', 'animal', 'human', 'player', 'monster', '雕像', '雕塑', '人像', '生物', '巨龙', '怪物', '手办', '模型'],
    name: '雕像/生物构建 (Statue/Organic)',
    knowledge: `
## 🗿 雕像与有机体构建专业知识
- **核心逻辑**: **这不是建筑！** 不要造房间、墙壁或屋顶。这是**有机雕塑**。
- **构建原则**:
  - **体块法 (Blocking)**: 先用简单几何体(Box)概括头部、躯干、四肢，再进行细化。
  - **平滑处理**: 必须使用 **Stairs (楼梯)** 和 **Slabs (半砖)** 来模拟曲线和肌肉纹理。
  - **比例**:
    - 人物: 头身比 1:7 或 1:8。
    - 巨龙: 翼展通常是身体长度的 1.5 倍。
- **推荐材料**:
  - 皮肤/肌肉: Terracotta (各种肤色), Smooth Sandstone, Quartz.
  - 细节: Buttons (眼睛), Walls (手指/爪子).
- **代码技巧**:
  - 使用 \`builder.set(x,y,z)\` 进行精细的体素堆叠，而不是 \`hollowBox\`。
`
  },

  // Type 2. 交通工具 (Vehicle)
  type_vehicle: {
    keywords: ['ship', 'boat', 'car', 'truck', 'plane', 'airplane', 'helicopter', 'spaceship', 'train', '船', '汽车', '飞机', '飞船', '火车', '战舰', '高达', '机甲'],
    name: '载具/机械风格 (Vehicle/Mecha)',
    knowledge: `
## 🚢 载具与机械构建专业知识
- **核心特征**: 具有方向性，流线型或机械感。
- **海船 (Ship)**:
  - 船体是**U型或V型**曲线，不是矩形盒子！
  - 必须有龙骨 (Keel) 和 肋骨 (Ribs)。
  - 帆 (Sails): 使用 White Wool，要有被风吹鼓的曲面感。
- **飞机/飞船**:
  - 流线型机身，使用 Stairs/Slabs 减少空气阻力感。
  - 机翼要有厚度变化。
- **机甲 (Mecha)**:
  - 强调关节 (Joints) 连接。
  - 使用 Iron Block, Anvil, Grindstone 增加机械细节。
`
  },

  // Type 3. 自然景观 (Landscape)
  type_landscape: {
    keywords: ['tree', 'mountain', 'river', 'waterfall', 'cave', 'terrain', 'island', '树', '山', '河', '瀑布', '洞穴', '地形', '岛屿', '造景'],
    name: '自然景观 (Nature/Landscape)',
    knowledge: `
## 🌳 自然景观构建专业知识
- **核心特征**: 随机、有机、无直线。
- **树木 (Trees)**:
  - **树干**: 根部粗壮，向上分叉。不要造直直的柱子！
  - **树冠**: 使用 Leaves 球体叠加，或者不规则散布。
- **地形 (Terrain)**:
  - 使用 **Noise (噪声)** 函数或随机高度生成山脉。
  - 混合材质: Grass, Dirt, Coarse Dirt, Moss。
- **水体**:
  - 瀑布要有冲击产生的水花 (White Stained Glass / Cobweb)。
`
  },

  // ============ 日式风格 (Japanese) ============

  // 1. 日式-神社/寺庙 (Religious) - 红色主调，复杂斗拱
  japanese_shrine: {
    keywords: ['japanese shrine', 'japanese temple', 'shinto', 'torii', 'shrine', '神社', '日式寺庙', '鸟居', '大社', '神宫'],
    name: '日式神社风格 (Japanese Shrine)',
    knowledge: `
## ⛩️ 日式神社/寺庙专业知识
- **核心特征**: 宗教建筑，强调神圣感。使用朱红色（Vermilion）和白色。
- **严禁**: 不要建成普通民居或城堡。
- **材料**:
  - 柱子/鸟居: Red Concrete (朱红) 或 Stripped Dark Oak (古刹)
  - 墙体: White Concrete / White Terracotta (白墙)
  - 屋顶: Dark Prismarine Stairs (青铜锈色) 或 Deepslate Tile (黑瓦)
  - 装饰: Gold Block (金饰), Lanterns
- **结构细节**:
  - **鸟居 (Torii)**: 必须有入口鸟居。
  - **斗拱**: 极为复杂，多层出挑。
  - **屋顶**: 必须是入母屋顶(Irimoya)或唐破风(Karahafu)，曲线明显。
  - **基座**: 较高的石砌基座。
`
  },

  // 2. 日式-民居/茶室 (Vernacular) - 原木主调，朴素自然
  japanese_vernacular: {
    keywords: ['japanese house', 'japanese home', 'japanese cottage', 'minka', 'machiya', 'tea house', 'ryokan', '日式小屋', '日式民居', '日式住宅', '茶室', '町屋', '和风住宅', '日式家'],
    name: '日式民居风格 (Japanese Minka)',
    knowledge: `
## 🏡 日式民居(Minka/Machiya)专业知识
- **核心特征**: 朴素、自然、生活化。**绝不要**使用红色混凝土（那是神社专用的）！
- **材料**:
  - 柱梁: Dark Oak / Spruce Logs (深色原木)
  - 墙面: White Terracotta (白灰泥) 或 Spruce Planks (木板墙)
  - 屋顶: Deepslate Tile Stairs (黑瓦) 或 Hay Bale (茅草)
  - 窗户: Spruce Trapdoor (格子窗/障子)
  - 地面: Spruce Planks / Striped Birch (模拟榻榻米)
- **结构细节**:
  - **缘侧 (Engawa)**: 房屋周围必须有一圈架空的木质走廊。
  - **架空**: 建筑底部抬高 1 格，下方用 Stone Bricks 或 Cobblestone。
  - **屋顶**: 简单的切妻(Gable)或寄栋(Hip)屋顶，坡度适中。
  - **入口**: 也是推拉门，没有鸟居。
`
  },

  // 3. 日式-城堡 (Castle) - 军事要塞，白色高墙
  japanese_castle: {
    keywords: ['japanese castle', 'himeji', 'donjon', 'tenshu', '日式城堡', '天守阁', '城郭', '本丸'],
    name: '日式城堡风格 (Japanese Castle)',
    knowledge: `
## 🏯 日式城堡(天守阁)专业知识
- **核心特征**: 巨大的军事防御建筑，层层堆叠，白色主调。
- **材料**:
  - 基座 (Ishigaki): Stone / Andesite / Mossy Cobblestone (大斜坡石墙)
  - 墙体: White Concrete (涂笼)
  - 屋顶: Deepslate Tile Stairs (黑瓦) + Gold Block (屋脊装饰)
- **结构细节**:
  - **多层屋檐**: 每一层都有独立的屋檐，且层层内缩。
  - **千鸟破风**: 屋顶上附加三角形的装饰性小屋顶。
  - **石垣**: 底部有极其巨大的曲面石墙基座（扇形坡度）。
`
  },

  // 4. 日式-通用 (General Fallback)
  japanese_general: {
    keywords: ['japanese', 'japan', 'nippon', 'oriental', '日式', '日本', '和风', '东洋'],
    name: '日式通用风格 (General Japanese)',
    knowledge: `
## 🇯🇵 日式通用建筑风格
- **注意**: 用户未指定具体类型（神社/民居/城堡）。
- **默认策略**: 采用**日式民居/庭院**的混合风格，偏向生活化，避免过于庄重的宗教色彩。
- **通用元素**:
  - 木构架 (Timber Frame)
  - 瓦屋顶 (Tiled Roof)
  - 庭院 (Garden) 元素
  - 避免大面积鲜艳色彩，保持自然色调。
`
  },

  // ============ 中式风格 (Chinese) ============

  // 5. 中式-皇家/宫殿 (Royal)
  chinese_royal: {
    keywords: ['chinese palace', 'forbidden city', 'imperial', 'chinese temple', '中式宫殿', '紫禁城', '故宫', '皇宫', '大殿', '中式庙宇'],
    name: '中式皇家风格 (Chinese Royal)',
    knowledge: `
## �️ 中式皇家建筑专业知识
- **核心特征**: 宏大、威严、等级森严。红墙黄瓦。
- **材料**:
  - 柱子: Stripped Dark Oak / Red Concrete (红柱)
  - 墙体: Red Terracotta / Red Concrete (红墙)
  - 屋顶: Gold Block / Yellow Terracotta (黄琉璃瓦)
  - 台基: Smooth Stone / Quartz (汉白玉须弥座)
- **结构细节**:
  - **庑殿/歇山顶**: 极其巨大的屋顶，屋檐深远。
  - **斗拱**: 必须有显著的斗拱层。
  - **开间**: 面阔极大（9间或11间）。
  - **彩画**: 梁枋使用青绿冷色调装饰 (Cyan/Green Terracotta)。
`
  },

  // 6. 中式-园林/民居 (Garden/Vernacular)
  chinese_garden: {
    keywords: ['chinese garden', 'suzhou', 'chinese house', 'siheyuan', '中式园林', '苏州园林', '江南', '四合院', '中式民居', '徽派'],
    name: '中式园林/民居风格 (Chinese Garden)',
    knowledge: `
## 🎋 中式园林/江南民居专业知识
- **核心特征**: 清雅、曲折、移步换景。粉墙黛瓦。
- **材料**:
  - 墙体: White Concrete (粉墙)
  - 屋顶: Gray Concrete / Deepslate Tile (黛瓦)
  - 装饰: Dark Oak Fence (木窗/挂落)
- **结构细节**:
  - **马头墙**: 山墙高出屋面，呈阶梯状。
  - **园林要素**: 必须结合 假山(Cobblestone)、水池、月洞门。
  - **漏窗**: 墙上要有几何图案的镂空窗。
  - **游廊**: 连接各个建筑的曲折走廊。
`
  },

  // ============ 中世纪风格 (Medieval) ============

  // 7. 中世纪-哥特 (Gothic)
  medieval_gothic: {
    keywords: ['cathedral', 'church', 'gothic', 'spire', 'abbey', '教堂', '大教堂', '哥特', '尖塔', '修道院'],
    name: '哥特式风格 (Gothic)',
    knowledge: `
## ⛪ 哥特式建筑专业知识
- **核心特征**: 垂直向上，尖拱，神圣。
- **材料**: Stone Bricks, Cobblestone, Stained Glass.
- **结构细节**:
  - **尖拱**: 门窗顶部必须是尖的 (Pointed Arch)。
  - **飞扶壁 (Flying Buttress)**: 外部支撑结构。
  - **玫瑰窗**: 正立面巨大的圆形花窗。
  - **高耸**: 甚至是极其夸张的高度宽比。
`
  },

  // 8. 中世纪-城堡 (Castle)
  medieval_castle: {
    keywords: ['castle', 'fortress', 'wall', 'keep', 'tower', 'citadel', '城堡', '要塞', '城墙', '塔楼', '堡垒'],
    name: '中世纪城堡风格 (Medieval Castle)',
    knowledge: `
## 🏰 中世纪城堡专业知识 (Medieval Castle)
- **核心特征**: 防御性、厚重、封闭。但拒绝千篇一律！
- **Random Architectural Variations (Pick ONE!)**: 
  1. **The Concentric Fortress**: Symmetrical, square keep in center, surrounded by lower outer walls.
  2. **The Asymmetrical Hill-Fort**: Adapts to terrain, irregular shape, towers of DIFFERENT heights.
  3. **The Palatial Keep**: Tall, complex roof lines, more decorative windows, less defensive.
- **材料**: Stone Bricks (Main), Cobblestone (Base/Weathering), Spruce (Roofs/Hoardings).
- **Randomization Tips**:
  - **Tower Shapes**: Don't use 4 identical round towers. Mix Square and Round!
  - **Height Variation**: The Keep MUST be significantly taller than walls.
  - **Asymmetry**: Offset the gatehouse, don't put it perfectly in the middle.
- **结构细节**:
  - **Crenellations**: 垛口凹凸。
  - **Hoardings**: 木质外挑走廊 (machicolations)。
  - **Machicolations**: 挑出的石质落石孔。
`
  },

  // 9. 中世纪-乡村 (Rustic)
  medieval_rustic: {
    keywords: ['medieval house', 'cottage', 'village', 'cabin', 'farmhouse', 'tavern', 'inn', '中世纪小屋', '村庄', '小屋', '农舍', '酒馆', '旅店', '木屋'],
    name: '中世纪乡村风格 (Medieval Rustic)',
    knowledge: `
## 🛖 中世纪乡村风格专业知识
- **核心特征**: 温馨、粗犷、不对称。
- **材料**:
  - 框架: Oak / Spruce Logs (原木框架)
  - 墙体: White Wool / Birch Planks (半木结构) 或 Cobblestone (基座)
  - 屋顶: Spruce / Dark Oak Stairs (A字顶)
- **结构细节**:
  - **悬挑**: 二楼通常比一楼向外突出 (Jettying)。
  - **烟囱**: 必须有显著的石质烟囱。
  - **各种屋顶**: 坡度较陡，可能有阁楼窗 (Dormer)。
  - **做旧**: 混合使用 Mossy variants。
`
  },

  // ============ 现代风格 (Modern) ============

  // 10. 现代-极简/住宅 (Minimalist)
  modern_minimalist: {
    keywords: ['modern house', 'villa', 'minimalist', 'modern home', 'mansion', 'bauhaus', '现代别墅', '现代住宅', '极简', '豪宅', '包豪斯', '现代小屋'],
    name: '现代极简风格 (Modern Minimalist)',
    knowledge: `
## � 现代极简建筑专业知识
- **核心特征**: 几何感、白色主调、大玻璃。Less is More.
- **材料**: White Concrete, Quartz, Cyan Terracotta (灰色), Glass Panes.
- **结构细节**:
  - **平屋顶**: 或者极其平缓的单坡顶。
  - **大悬挑**: 阳台或房间悬空挑出。
  - **落地窗**: 巨大的透明玻璃面。
  - **无装饰**: 避免任何复杂的纹理或雕花。
`
  },

  // 11. 现代-摩天大楼 (Skyscraper)
  modern_skyscraper: {
    keywords: ['skyscraper', 'highrise', 'office building', 'tower block', 'city', '摩天大楼', '写字楼', '办公楼', '大厦', '城市建筑'],
    name: '现代摩天大楼 (Modern Skyscraper)',
    knowledge: `
## 🏙️ 现代摩天大楼专业知识
- **核心特征**: 高度、垂直线条、玻璃幕墙。
- **材料**: Glass (全玻璃幕墙), Iron Block/Gray Concrete (骨架)。
- **结构细节**:
  - **核心筒**: 内部坚实的电梯井结构。
  - **幕墙**: 或者是水平条窗，或者是全玻璃覆盖。
  - **退台**: 随着高度增加，建筑体积逐级内缩。
  - **顶部**: 特殊的顶部造型或天线。
`
  },

  // ============ 幻想与科幻 (Fantasy & Sci-Fi) ============

  // 12. 赛博朋克 (Cyberpunk)
  cyberpunk: {
    keywords: ['cyberpunk', 'neon', 'futuristic', 'sci-fi', '2077', '赛博朋克', '霓虹', '科幻', '未来', '赛博'],
    name: '赛博朋克风格 (Cyberpunk)',
    knowledge: `
## 🌃 赛博朋克风格专业知识
- **核心特征**: 高科技低生活 (High Tech, Low Life)。黑暗与霓虹的对比。
- **材料**: Black Concrete (背景), End Rod / Sea Lantern / Stained Glass (霓虹灯), Iron Bars (管道)。
- **配色**: 青色 (Cyan) + 品红 (Magenta) + 黄色。
- **结构细节**:
  - **巨型结构**: 压抑的巨型建筑体量。
  - **混乱**: 附加的违章建筑、管道、广告牌。
  - **全息广告**: 浮空的玻璃和发光方块。
`
  },

  // 13. 幻想-魔法 (Magic)
  fantasy_magic: {
    keywords: ['wizard', 'magic', 'sorcerer', 'mage', 'tower', 'fantasy', '巫师', '魔法', '法师', '魔塔', '奇幻'],
    name: '奇幻魔法风格 (Fantasy Magic)',
    knowledge: `
## ✨ 魔法/巫师建筑专业知识
- **核心特征**: 把不可能变成可能。反重力、神秘色彩。
- **材料**: Deepslate, Blackstone, Purple/Blue Wool, Amethyst.
- **结构细节**:
  - **浮空**: 悬浮的岛屿或水晶。
  - **螺旋**: 扭曲的塔楼造型。
  - **尖顶**: 极其夸张弯曲的屋顶。
  - **特效**: 使用 Beacon 光束或 End Rod 粒子。
`
  },

  // 14. 幻想-自然 (Nature/Elf)
  fantasy_nature: {
    keywords: ['elf', 'elven', 'fairy', 'treehouse', 'organic', 'nature', '精灵', '树屋', '仙境', '自然', '森林'],
    name: '精灵/自然风格 (Elven Nature)',
    knowledge: `
## 🌿 精灵/自然建筑专业知识
- **核心特征**: 与自然融为一体，有机曲线。
- **材料**: Living Wood (Logs), Leaves, Moss Block, Quartz (精灵石), Glowstone.
- **结构细节**:
  - **生长感**: 建筑像植物一样生长，避免直线。
  - **树屋**: 依托于巨树构建。
  - **发光植物**: 大量使用 Shroomlight 或隐藏光源。
  - **拱桥**: 优雅细长的连接桥。
`
  }
};

/**
 * 检测用户输入中的建筑风格
 * @param {string} userMessage - 用户输入的消息
 * @returns {object|null} - 匹配到的风格对象，或null
 */
export function detectStyle(userMessage) {
  const lowerMessage = userMessage.toLowerCase();

  // Iterate through defined styles. ORDER MATTERS in the object above!
  // Specific styles are defined first, so they match first.
  for (const [styleKey, styleData] of Object.entries(STYLE_KNOWLEDGE)) {
    for (const keyword of styleData.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return {
          key: styleKey,
          name: styleData.name,
          knowledge: styleData.knowledge
        };
      }
    }
  }

  return null;
}

/**
 * 获取所有可用的风格列表
 */
export function getAvailableStyles() {
  return Object.entries(STYLE_KNOWLEDGE).map(([key, data]) => ({
    key,
    name: data.name,
    keywords: data.keywords
  }));
}
