# OCometixLine

> OpenCode 状态栏插件 - 实时显示模型上下文限制、Git 状态和 Token 使用量

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

##这是一份Kimi-K2.5写的Readme
## Features

- **🎯 智能字体检测** - 自动检测系统是否安装 Nerd Font，智能切换图标显示
- **📊 Token 追踪** - 实时显示模型上下文使用量和限制（如 `45%-92K/256K`）
- **🔀 Git 集成** - 显示当前分支和仓库状态（✓ 干净 / ● 有修改）
- **🎨 双模式图标** - 支持 Nerd Font（  ⚡）和 Emoji（📁 📍 ⚡）两种显示风格
- **⚡ 零配置** - 开箱即用，自动检测环境，缓存字体检测结果
- **🔧 多模型支持** - 支持 Kimi K2.5、DeepSeek、GLM 等主流模型

## Install

```bash
npm install -g ocometixline
```

## Usage

### 作为 OpenCode 插件

使用 CLI 安装插件：

```bash
# 安装到 OpenCode
ocometixline install

# 从 OpenCode 卸载
ocometixline uninstall
```

然后在你的 `opencode.json` 配置中启用：

```json
{
  "plugins": ["OCometixLine"]
}
```

## Configuration

### 环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NERD_FONT` | `1` | 强制使用 Nerd Font 图标 |
| `NERD_FONT` | `0` | 强制使用 Emoji 图标 |

```bash
# 强制使用 Nerd Font
export NERD_FONT=1

# 强制使用 Emoji
export NERD_FONT=0
```

### 缓存机制

插件会缓存字体检测结果到 `~/.ocometixline/font-cache.json`，24 小时内无需重复检测。

如需重新检测：
```bash
rm ~/.ocometixline/font-cache.json
```

## HUD 显示格式

### 格式一：Nerd Font 模式
当系统检测到安装 Nerd Font 时显示：
```
 ~/.config/opencode/node_modules/OCometixLine |  master ✓ | ⚡ 45%-92K/256K
```

### 格式二：Emoji 模式
未检测到 Nerd Font 时自动回退：
```
📁 ~/.config/opencode/node_modules/OCometixLine | 📍 master ✓ | ⚡ 45%-92K/256K
```

### 显示内容说明
- **📁/ 目录** - 当前工作目录（自动简化为 `~`）
- **📍/ Git** - 分支名称 + 状态指示符（✓ 干净 / ● 有修改）
- **⚡ Token** - 上下文使用百分比、当前使用量/限制（如 `45%-92K/256K`）

## Supported Models

| 模型 | 上下文限制 |
|------|-----------|
| Kimi K2.5 / K2 | 256K |
| MiniMax 2.5 | 256K |
| GLM-5 | 200K |
| DeepSeek V3 / V3.2 | 128K |
| 默认 | 90K |

## Requirements

- Node.js >= 20
- OpenCode CLI
- Git（可选，用于 Git 状态显示）
- Nerd Font（可选，用于图标显示）

## Development

```bash
# 克隆仓库
git clone https://github.com/aitingtingya/OCometixLine.git
cd OCometixLine

# 安装依赖
npm install

# 本地测试
npm link
```

## License

MIT License - 详见 [LICENSE](LICENSE) 文件

## Acknowledgments

本项目借鉴并参考了以下开源项目：

- **[opencode-status-hud](https://github.com/Two-Weeks-Team/opencode-status-hud)** by Two-Weeks-Team
  - OpenCode 插件架构和 HUD 显示机制
  
- **[CCometixLine](https://github.com/Haleclipse/CCometixLine)** by Haleclipse
  - 状态栏功能设计灵感
