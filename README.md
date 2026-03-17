# OCometixLine

> OpenCode 状态栏插件 - 实时显示模型上下文限制、Git 状态和 Token 使用量

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 这是一份 AI 写的 Readme
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

状态栏分为四个栏目：**目录** | **Git** | **上下文** | **Token消耗**

### 格式一：Nerd Font 模式
当系统检测到安装 Nerd Font 时显示：
```
📁 ~/.config/opencode/node_modules/OCometixLine | 📍 master ✓ | ⚡ 45%-92K/256K | 📊 519K
```

### 格式二：Emoji 模式
未检测到 Nerd Font 时自动回退：
```
📁 ~/.config/opencode/node_modules/OCometixLine | 📍 master ✓ | ⚡ 45%-92K/256K | 📊 519K
```

### 栏目说明

| 栏目 | 图标 | 说明 | 示例 |
|------|------|------|------|
| 目录 | 📁 | 当前工作目录（自动简化为 `~`） | `~/project` |
| Git | 📍 | 分支名称 + 状态（✓ 干净 / ● 有修改） | `master ✓` |
| 上下文 | ⚡ | 使用百分比-当前使用量/限制 | `45%-92K/256K` |
| Token消耗 | 📊 | 会话累计消耗（input + output + reasoning） | `519K` |

### 上下文 vs Token消耗

- **上下文栏目**：显示上一条已完成消息的 `input + output`（不含 reasoning），用于了解当前上下文使用情况
- **Token消耗栏目**：显示当前会话的累计总消耗，包含 `input + output + reasoning`

## 安装 Nerd Font（推荐）

为了获得最佳图标显示效果，建议安装 Nerd Font。

### Windows

1. 访问 [Nerd Fonts 下载页](https://www.nerdfonts.com/font-downloads)
2. 下载喜欢的字体（推荐：CaskaydiaCove、JetBrainsMono、FiraCode、Hack）
3. 解压后右键字体文件 → 安装
4. 在终端设置中选择已安装的 Nerd Font

**PowerShell 一键安装**（需要管理员权限）：
```powershell
# 安装 Cascadia Code Nerd Font
winget install Microsoft.CascadiaCode
```

### macOS

```bash
# 使用 Homebrew 安装
brew install --cask font-hack-nerd-font

# 其他推荐字体
brew install --cask font-jetbrains-mono-nerd-font
brew install --cask font-fira-code-nerd-font
brew install --cask font-caskaydia-cove-nerd-font
```

### Linux

```bash
# Ubuntu/Debian
sudo apt install fonts-hack-nerd-font

# Arch Linux
sudo pacman -S ttf-hack-nerd

# Fedora
sudo dnf install hack-fonts
```

**手动安装**：
```bash
mkdir -p ~/.local/share/fonts
cd ~/.local/share/fonts
# 下载 Hack Nerd Font（可替换为其他字体）
wget https://github.com/ryanoasis/nerd-fonts/releases/download/v3.3.0/Hack.zip
unzip Hack.zip && rm Hack.zip
fc-cache -fv
```

### 验证安装

安装 Nerd Font 后，需要在终端设置中将字体切换为已安装的 Nerd Font。

清除插件缓存后重启终端：
```bash
rm ~/.ocometixline/font-cache.json
```

或者强制启用 Nerd Font 图标：
```bash
export NERD_FONT=1
```

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
