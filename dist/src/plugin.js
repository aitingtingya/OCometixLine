// OCometixLine - OpenCode Custom Statusline Plugin
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

// 模型上下文限制（不区分大小写）
const MODEL_CONTEXT_LIMITS = {
  'glm5': 200000,
  'glm-5': 200000,
  'kimi-k2.5': 256000,
  'kimi-k2': 256000,
  'kimi': 256000,
  'minimax-2.5': 256000,
  'minimax': 256000,
  'deepseek-v3.2': 128000,
  'deepseek-v3': 128000,
  'deepseek': 128000
};

// 图标配置
// context: 上下文栏目，计算 input + output（不含 reasoning）
// consumption: Token消耗栏目，计算累计的 input + output + reasoning
const ICONS = {
  nerd: {
    folder: '\uf114',
    git: '\uf418',
    context: '\uf0e7',
    consumption: '\uf472'
  },
  fallback: {
    folder: '\ud83d\udcc1',
    git: '\ud83d\udccd',
    context: '\u26a1',
    consumption: '\ud83d\udcca'
  }
};

// 缓存文件路径
const CACHE_FILE = path.join(homedir(), '.ocometixline', 'font-cache.json');
const USAGE_FILE = path.join(homedir(), '.ocometixline', 'session-usage.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24小时

// 常见 Nerd Font 字体名称模式
const NERD_FONT_PATTERNS = [
  'Nerd Font',
  'NF',
  'Caskaydia',
  'JetBrainsMono',
  'Fira Code',
  'FiraCode',
  'Hack',
  'Meslo',
  'Source Code Pro',
  'Ubuntu Mono',
  'DejaVu Sans Mono',
  'Inconsolata',
  'Monoid',
  'Terminus',
  'Droid Sans Mono',
  'Roboto Mono',
  'Noto Sans Mono',
  'Liberation Mono',
  'Fantasque Sans Mono',
  'Iosevka'
];

// 获取缓存的字体检测结果
function getCachedFontStatus() {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    
    const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    const now = Date.now();
    
    // 检查缓存是否过期
    if (now - cache.timestamp > CACHE_TTL_MS) {
      return null;
    }
    
    return cache.hasNerdFont;
  } catch (e) {
    return null;
  }
}

// 保存字体检测结果到缓存
function setCachedFontStatus(hasNerdFont) {
  try {
    const cacheDir = path.dirname(CACHE_FILE);
    if (!existsSync(cacheDir)) {
      execSync(`mkdir -p "${cacheDir}"`, { windowsHide: true });
    }
    
    const cache = {
      hasNerdFont,
      timestamp: Date.now(),
      platform: process.platform
    };
    
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (e) {
    // 缓存失败静默处理
  }
}

// 加载会话累计消耗
function loadCumulativeConsumption(sessionID) {
  try {
    if (!existsSync(USAGE_FILE)) return 0;
    
    const data = JSON.parse(readFileSync(USAGE_FILE, 'utf8'));
    const session = data.sessions?.[sessionID];
    
    if (session) {
      return session.cumulativeConsumption || 0;
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

// 保存会话累计消耗
function saveCumulativeConsumption(sessionID, consumption, messageID) {
  try {
    const cacheDir = path.dirname(USAGE_FILE);
    if (!existsSync(cacheDir)) {
      execSync(`mkdir -p "${cacheDir}"`, { windowsHide: true });
    }
    
    let data = { sessions: {} };
    if (existsSync(USAGE_FILE)) {
      data = JSON.parse(readFileSync(USAGE_FILE, 'utf8'));
    }
    
    data.sessions[sessionID] = {
      cumulativeConsumption: consumption,
      lastMessageID: messageID,
      lastUpdated: Date.now()
    };
    
    writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    // 保存失败静默处理
  }
}

// 获取上次处理的消息ID（用于防重复）
function getLastMessageID(sessionID) {
  try {
    if (!existsSync(USAGE_FILE)) return null;
    
    const data = JSON.parse(readFileSync(USAGE_FILE, 'utf8'));
    return data.sessions?.[sessionID]?.lastMessageID || null;
  } catch (e) {
    return null;
  }
}

// 检测 Windows 系统是否安装了 Nerd Font
function detectNerdFontWindows() {
  try {
    // 使用 PowerShell 查询注册表中的字体
    const command = `powershell.exe -Command "Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts' | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name"`;
    
    const output = execSync(command, { 
      encoding: 'utf8', 
      timeout: 5000,
      windowsHide: true 
    });
    
    // 检查是否包含 Nerd Font 模式
    const hasNerdFont = NERD_FONT_PATTERNS.some(pattern => 
      output.toLowerCase().includes(pattern.toLowerCase())
    );
    
    return hasNerdFont;
  } catch (e) {
    return false;
  }
}

// 检测 macOS/Linux 系统是否安装了 Nerd Font
function detectNerdFontUnix() {
  try {
    // 使用 fc-list 命令列出所有字体
    const output = execSync('fc-list : family', { 
      encoding: 'utf8', 
      timeout: 5000 
    });
    
    // 检查是否包含 Nerd Font 模式
    const hasNerdFont = NERD_FONT_PATTERNS.some(pattern => 
      output.toLowerCase().includes(pattern.toLowerCase())
    );
    
    return hasNerdFont;
  } catch (e) {
    return false;
  }
}

// 通过系统字体检测 Nerd Font
function detectNerdFontViaSystem() {
  if (process.platform === 'win32') {
    return detectNerdFontWindows();
  } else {
    return detectNerdFontUnix();
  }
}

function hasNerdFont() {
  // 如果用户明确设置了环境变量，优先使用
  if (process.env.NERD_FONT === '1') {
    return true;
  }
  if (process.env.NERD_FONT === '0') {
    return false;
  }
  
  // 尝试从缓存读取
  const cached = getCachedFontStatus();
  if (cached !== null) {
    return cached;
  }
  
  // 执行系统字体检测
  const detected = detectNerdFontViaSystem();
  
  // 缓存结果
  setCachedFontStatus(detected);
  
  return detected;
}

// Git 信息缓存
let gitInfoCache = null;
let gitInfoCacheDir = null;

function getGitInfo(directory) {
  // 如果目录没变且缓存存在，直接返回缓存
  if (gitInfoCache && gitInfoCacheDir === directory) {
    return gitInfoCache;
  }
  
  try {
    // 获取分支名
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
      cwd: directory, encoding: 'utf8', timeout: 3000
    }).trim();
    
    // 获取 git status 判断 clean/dirty
    let status = '';
    try {
      const porcelain = execSync('git status --porcelain', {
        cwd: directory, encoding: 'utf8', timeout: 1000
      });
      status = porcelain.length === 0 ? '✓' : '●';
    } catch (e) {
      status = '';
    }
    
    // 更新缓存
    gitInfoCache = { branch, status };
    gitInfoCacheDir = directory;
    
    return gitInfoCache;
  } catch (e) {
    return null;
  }
}

function formatDirectory(fullPath) {
  if (!fullPath) return '';
  const home = process.env.HOME || process.env.USERPROFILE || '';
  let simplified = fullPath.replace(home, '~');
  simplified = simplified.replace(/\\/g, '/');
  return simplified;
}

function asFiniteNumber(value) {
  return Number.isFinite(value) ? value : 0;
}

function formatCompactTokens(value) {
  const safe = Math.max(0, Math.trunc(asFiniteNumber(value)));
  if (safe >= 1000000) {
    return `${(safe / 1000000).toFixed(safe >= 10000000 ? 0 : 1)}M`;
  }
  if (safe >= 1000) {
    return `${Math.round(safe / 1000)}K`;
  }
  return `${safe}`;
}

function resolveModelContextLimit(modelID) {
  if (!modelID) return 90000;
  const lowerModel = modelID.toLowerCase();
  for (const [pattern, limit] of Object.entries(MODEL_CONTEXT_LIMITS)) {
    if (lowerModel.includes(pattern.toLowerCase())) {
      return limit;
    }
  }
  return 90000;
}

function buildStatusLine(ctx, message, cumulativeConsumption) {
  const icons = hasNerdFont() ? ICONS.nerd : ICONS.fallback;
  const directory = formatDirectory(ctx.directory || '');
  const gitInfo = getGitInfo(ctx.directory || '');
  
  // Git 显示：分支 + 状态（✓/●）
  const gitDisplay = gitInfo
    ? `${icons.git} ${gitInfo.branch}${gitInfo.status ? ' ' + gitInfo.status : ''}`
    : '';
  
  const contextLimit = resolveModelContextLimit(message.modelID || '');
  
  // 上下文：本条消息的 input + output（不含 reasoning）
  const contextUsed = asFiniteNumber(message.tokens?.input || 0) + 
                     asFiniteNumber(message.tokens?.output || 0);
  const contextPercent = Math.min(100, Math.round((contextUsed / contextLimit) * 100));
  
  // 上下文显示：闪电图标，格式为 55%-140K/256K
  const contextDisplay = `${icons.context} ${contextPercent}%-${formatCompactTokens(contextUsed)}/${formatCompactTokens(contextLimit)}`;
  
  // Token消耗显示：柱状图图标，显示会话累计值
  const consumptionDisplay = `${icons.consumption} ${formatCompactTokens(cumulativeConsumption)}`;
  
  const parts = [
    `${icons.folder} ${directory}`,
    gitDisplay,
    contextDisplay,
    consumptionDisplay
  ].filter(Boolean);

  return parts.join(' | ');
}

// 匹配末尾所有连续的引用块状态栏
// [^\n]+ 匹配所有非换行字符，包括 emoji 和 Nerd Font 图标
const STATUS_LINE_RE = /(\n\n> [^\n]+)+$/;

function appendOrReplaceStatusLine(text, statusLine) {
  // 移除末尾所有已有的状态栏引用块
  const cleanText = text.replace(STATUS_LINE_RE, '').trim();
  // 追加新的状态栏
  return `${cleanText}\n\n> ${statusLine}`;
}

function toSessionKey(sessionID) {
  return sessionID ?? '__global__';
}

export function createOCometixLineHooks(ctx) {
  const sessionRuntimes = new Map();
  const MAX_SESSION_ENTRIES = 50;
  
  function pruneMap(map) {
    if (map.size <= MAX_SESSION_ENTRIES) return;
    const excess = map.size - MAX_SESSION_ENTRIES;
    const iter = map.keys();
    for (let i = 0; i < excess; i++) {
      const key = iter.next().value;
      if (key !== undefined) map.delete(key);
    }
  }
  
  function getOrCreateRuntime(sessionKey) {
    let runtime = sessionRuntimes.get(sessionKey);
    if (!runtime) {
      runtime = { 
        seenAssistantMessages: new Set(),
        usageByMessageID: new Map(),
        outputAugmentedMessages: new Set(),
        lastCompletedUsage: null,
        cumulativeConsumption: loadCumulativeConsumption(sessionKey)
      };
      sessionRuntimes.set(sessionKey, runtime);
      pruneMap(sessionRuntimes);
    }
    return runtime;
  }
  
  return {
    event: async (input) => {
      try {
        if (input.event.type !== 'message.updated') {
          return;
        }
        
        const message = input.event.properties.info;
        if (message.role !== 'assistant') {
          return;
        }
        
        const sessionKey = toSessionKey(message.sessionID);
        const runtime = getOrCreateRuntime(sessionKey);
        
        // 本条消息的 token 用量
        const messageInput = asFiniteNumber(message.tokens?.input ?? 0);
        const messageOutput = asFiniteNumber(message.tokens?.output ?? 0);
        const messageReasoning = asFiniteNumber(message.tokens?.reasoning ?? 0);
        
        // 上下文：只计算 input + output（用于显示本条）
        const contextUsedTokens = messageInput + messageOutput;
        
        // Token消耗：计算本条的总消耗（input + output + reasoning）
        const messageConsumption = messageInput + messageOutput + messageReasoning;
        
        // 【调整时序】先检查是否完成且 token 已计算
        if (typeof message.time?.completed !== 'number') {
          return;  // 未完成，不存储
        }
        
        // 【调整时序】检查 token 是否已计算（不为0）
        if (contextUsedTokens === 0) {
          return;  // token 未计算，不存储
        }
        
        const contextLimitTokens = Math.max(resolveModelContextLimit(message.modelID), contextUsedTokens);
        
        // 【调整时序】此时才存储（确保数据正确）
        runtime.usageByMessageID.set(message.id, {
          modelID: message.modelID,
          contextUsedTokens,
          contextLimitTokens,
          messageConsumption,
          tokens: {
            input: messageInput,
            output: messageOutput,
            reasoning: messageReasoning
          }
        });
        
        // 检查是否已经处理过此完成消息（防重复）
        if (runtime.seenAssistantMessages.has(message.id)) {
          return;
        }
        runtime.seenAssistantMessages.add(message.id);
        
        // 检查是否已经累加过（从磁盘读取 lastMessageID）
        const lastProcessedID = getLastMessageID(sessionKey);
        if (lastProcessedID !== message.id) {
          // 累加到会话累计值
          runtime.cumulativeConsumption += messageConsumption;
          // 保存到磁盘
          saveCumulativeConsumption(sessionKey, runtime.cumulativeConsumption, message.id);
        }
        
        // 【调整时序】设置 lastCompletedUsage（此时一定正确）
        const completedUsage = runtime.usageByMessageID.get(message.id);
        if (completedUsage && completedUsage.contextUsedTokens > 0) {
          runtime.lastCompletedUsage = completedUsage;
        }
      } catch (e) {
        // 错误静默处理
      }
    },
    
    "experimental.text.complete": async (input, output) => {
      try {
        const sessionKey = toSessionKey(input.sessionID);
        const runtime = getOrCreateRuntime(sessionKey);
        
        // 检查是否已经在 output 中追加过
        if (runtime.outputAugmentedMessages.has(input.messageID)) {
          return;
        }
        runtime.outputAugmentedMessages.add(input.messageID);
        
        // 【调整时序】从 usageByMessageID 获取数据
        const usage = runtime.usageByMessageID.get(input.messageID);
        
        // 【调整时序】如果未存储或仍为0，不显示（等待下次更新）
        if (!usage || usage.contextUsedTokens === 0) {
          return;
        }
        
        // 【调整时序】直接使用存储的数据（不再使用 lastCompletedUsage 备选）
        const statusLine = buildStatusLine(ctx, {
          modelID: usage.modelID,
          tokens: usage.tokens
        }, runtime.cumulativeConsumption);
        
        // 替换或追加状态栏（如果已存在则替换，避免重复）
        output.text = appendOrReplaceStatusLine(output.text, statusLine);
      } catch (e) {
        // 错误静默处理
      }
    }
  };
}

export const OCometixLinePlugin = async (ctx) => {
  return createOCometixLineHooks(ctx);
};

export default OCometixLinePlugin;
