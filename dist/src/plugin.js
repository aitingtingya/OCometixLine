// OCometixLine - OpenCode Custom Statusline Plugin
import { execSync } from 'child_process';
import { appendFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

// 日志文件路径
const LOG_FILE = path.join(homedir(), 'ocometixline-debug.log');

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    appendFileSync(LOG_FILE, logMessage);
  } catch (e) {
    // 如果日志写入失败，静默处理
  }
}

// 记录插件文件被加载
log('Plugin file loaded');

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
const ICONS = {
  nerd: {
    folder: '\uf114',
    git: '\uf418',
    usage: '\uf472',
    token: '\uf0f6'
  },
  fallback: {
    folder: '\ud83d\udcc1',
    git: '\ud83d\udccd',
    usage: '%',
    token: '\u26a1'
  }
};

function hasNerdFont() {
  // 如果用户明确设置了环境变量，优先使用
  if (process.env.NERD_FONT === '1') return true;
  if (process.env.NERD_FONT === '0') return false;
  
  const termProgram = process.env.TERM_PROGRAM || '';
  const term = process.env.TERM || '';
  
  // 已知的支持 Nerd Font 的终端
  const knownNerdTerminals = [
    'Windows Terminal',
    'iTerm',
    'kitty',
    'alacritty',
    'Alacritty',
    'WezTerm',
    'wezterm',
    'mintty',  // Git Bash
    'MINGW',
    'MSYS'
  ];
  
  if (knownNerdTerminals.some(t => termProgram.includes(t) || term.includes(t))) {
    return true;
  }
  
  // 检查终端特定的环境变量
  if (process.env.KITTY_WINDOW_ID) return true;
  if (process.env.WEZTERM_PANE) return true;
  if (process.env.ALACRITTY_SOCKET) return true;
  if (process.env.VTE_VERSION) return true;
  
  // Windows 上的 PowerShell 和 Windows Terminal 通常支持
  if (process.platform === 'win32') {
    // 检查是否在 Windows Terminal 中
    if (process.env.WT_SESSION) return true;
    // 检查是否在 PowerShell 中
    if (process.env.PSModulePath) return true;
    // 默认在 Windows 上假设支持
    return true;
  }
  
  return false;
}

// Git 信息缓存
let gitInfoCache = null;
let gitInfoCacheDir = null;

function getGitInfo(directory) {
  log(`getGitInfo called with directory: ${directory}`);
  
  // 如果目录没变且缓存存在，直接返回缓存
  if (gitInfoCache && gitInfoCacheDir === directory) {
    log(`Using cached Git info: ${gitInfoCache.branch} ${gitInfoCache.status || ''}`);
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
      log(`Git status: ${porcelain.length === 0 ? 'clean' : 'dirty'}`);
    } catch (e) {
      log(`Git status check failed: ${e.message}`);
      status = '';
    }
    
    log(`Git branch found: ${branch} ${status}`);
    
    // 更新缓存
    gitInfoCache = { branch, status };
    gitInfoCacheDir = directory;
    
    return gitInfoCache;
  } catch (e) {
    log(`Git command failed: ${e.message}`);
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

function buildStatusLine(ctx, message) {
  const icons = hasNerdFont() ? ICONS.nerd : ICONS.fallback;
  const directory = formatDirectory(ctx.directory || '');
  const gitInfo = getGitInfo(ctx.directory || '');
  
  // Git 显示：分支 + 状态（✓/●）
  const gitDisplay = gitInfo 
    ? `${icons.git} ${gitInfo.branch}${gitInfo.status ? ' ' + gitInfo.status : ''}`
    : '';
  
  const contextLimit = resolveModelContextLimit(message.modelID || '');
  const contextUsed = asFiniteNumber(message.tokens?.input || 0) + 
                     asFiniteNumber(message.tokens?.output || 0) + 
                     asFiniteNumber(message.tokens?.reasoning || 0);
  const contextPercent = Math.min(100, Math.round((contextUsed / contextLimit) * 100));
  
  // 合并 Token 显示：使用饼堆图标，格式为 55%-140K/256K
  const tokenDisplay = `${icons.token} ${contextPercent}%-${formatCompactTokens(contextUsed)}/${formatCompactTokens(contextLimit)}`;
  
  const parts = [
    `${icons.folder} ${directory}`,
    gitDisplay,
    tokenDisplay
  ].filter(Boolean);
  
  return parts.join(' | ');
}

// 匹配状态栏的正则表达式（匹配新格式：... |  58%-149K/256K）
const STATUS_LINE_RE = /\n\n> .+\|.+\d+%-\d+[KM]?\/\d+[KM]?$/;

function appendOrReplaceStatusLine(text, statusLine) {
  // 如果已经存在状态栏，替换它
  if (STATUS_LINE_RE.test(text)) {
    return text.replace(STATUS_LINE_RE, `\n\n> ${statusLine}`);
  }
  // 否则追加新的状态栏
  return `${text.trim()}\n\n> ${statusLine}`;
}

function toSessionKey(sessionID) {
  return sessionID ?? '__global__';
}

function resolveContextUsedTokens(tokens) {
  const total = asFiniteNumber(tokens?.total ?? 0);
  if (total > 0) {
    return Math.max(0, Math.trunc(total));
  }
  const fallback = asFiniteNumber(tokens?.input ?? 0) + 
                  asFiniteNumber(tokens?.output ?? 0) + 
                  asFiniteNumber(tokens?.reasoning ?? 0);
  return Math.max(0, Math.trunc(fallback));
}

export function createOCometixLineHooks(ctx) {
  log('createOCometixLineHooks called');
  
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
        lastCompletedUsage: null
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
        
        // 计算 contextUsedTokens
        const contextUsedTokens = resolveContextUsedTokens(message.tokens);
        const contextLimitTokens = Math.max(resolveModelContextLimit(message.modelID), contextUsedTokens);
        
        // 存储到 usageByMessageID（不检查 seenAssistantMessages，每次更新都可能包含新数据）
        runtime.usageByMessageID.set(message.id, {
          modelID: message.modelID,
          contextUsedTokens,
          contextLimitTokens,
          tokens: {
            input: asFiniteNumber(message.tokens?.input ?? 0),
            output: asFiniteNumber(message.tokens?.output ?? 0),
            reasoning: asFiniteNumber(message.tokens?.reasoning ?? 0)
          }
        });
        
        // 检查消息是否已完成
        if (typeof message.time?.completed !== 'number') {
          return;
        }
        
        // 检查是否已经处理过此完成消息
        if (runtime.seenAssistantMessages.has(message.id)) {
          return;
        }
        runtime.seenAssistantMessages.add(message.id);
        
        // 获取刚存储的数据
        const completedUsage = runtime.usageByMessageID.get(message.id);
        if (completedUsage && completedUsage.contextUsedTokens > 0) {
          runtime.lastCompletedUsage = completedUsage;
        }
      } catch (e) {
        log(`event hook error: ${e.message}`);
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
        
        // 从 usageByMessageID 获取数据
        const currentUsage = runtime.usageByMessageID.get(input.messageID) ?? null;
        let usage = null;
        
        if (currentUsage !== null) {
          if (currentUsage.contextUsedTokens > 0) {
            // 有有效数据，直接使用
            usage = currentUsage;
          } else if (runtime.lastCompletedUsage !== null) {
            // 当前数据为 0，使用上一次的有效数据作为备选
            usage = {
              ...currentUsage,
              contextUsedTokens: runtime.lastCompletedUsage.contextUsedTokens,
              contextLimitTokens: runtime.lastCompletedUsage.contextLimitTokens,
              tokens: runtime.lastCompletedUsage.tokens
            };
          } else {
            // 没有备选数据，使用当前数据
            usage = currentUsage;
          }
        }
        
        if (usage === null) {
          log(`No usage data found for message ${input.messageID}`);
          return;
        }
        
        // 构建状态栏
        const statusLine = buildStatusLine(ctx, {
          modelID: usage.modelID,
          tokens: usage.tokens
        });
        
        log(`Updating status line: ${statusLine}`);
        
        // 替换或追加状态栏（如果已存在则替换，避免重复）
        output.text = appendOrReplaceStatusLine(output.text, statusLine);
      } catch (e) {
        log(`experimental.text.complete error: ${e.message}`);
      }
    }
  };
}

export const OCometixLinePlugin = async (ctx) => {
  log(`OCometixLinePlugin initialized`);
  log(`ctx keys: ${Object.keys(ctx || {}).join(', ')}`);
  log(`ctx.client exists: ${!!ctx.client}`);
  log(`ctx.directory: ${ctx.directory}`);
  return createOCometixLineHooks(ctx);
};

export default OCometixLinePlugin;
