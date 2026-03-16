# OCometixLine

> OpenCode 状态栏插件 - 实时显示模型、Git 状态、上下文信息和费用追踪

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Credits & Acknowledgments

本项目借鉴并参考了以下开源项目：

### 代码借鉴
- **[opencode-status-hud](https://github.com/Two-Weeks-Team/opencode-status-hud)** by Two-Weeks-Team
  - 借鉴了其 OpenCode 插件架构和 HUD 显示机制
  - **在此基础上使用 OpenCode + Kimi K2.5 进行改写和优化**
  - 遵循 MIT 许可证

### 功能灵感
- **[CCometixLine](https://github.com/Haleclipse/CCometixLine)** by Haleclipse
  - 功能设计参考了其状态栏显示逻辑
  - 包括 Git 集成、模型显示、上下文追踪等功能的灵感来源
  - 遵循 MIT 许可证

## Features

- **实时上下文追踪** - 显示当前目录、Git 状态和 Token 使用量
- **Git 集成** - 显示当前分支、仓库状态（干净/有修改）
- **图标支持** - 使用 emoji 和 Nerd Font 图标提供直观的视觉指示
- **多模型支持** - 支持 Kimi K2.5 及其他主流模型
- **零配置** - 开箱即用，自动检测环境

## Install

```bash
npm install -g ocometixline
```

## Usage

### 作为 OpenCode 插件

在你的 OpenCode 配置中启用此插件：

```bash
opencode --install-plugin ocometixline
```

### CLI 模式

```bash
# 显示当前状态
ocometixline status

# 查看帮助
ocometixline --help
```

## Configuration

插件会自动检测以下信息：
- 当前 Git 仓库和分支
- 使用的 AI 模型
- Token 使用量

无需额外配置即可使用。

## HUD 显示格式

根据终端是否支持 [Nerd Font](https://www.nerdfonts.com/)，插件会自动选择显示格式：

### 格式一：Nerd Font 模式（推荐）
当终端支持 Nerd Font 时显示：
```
 ~/project |  main ✓ |  45%-92K/256K
```

### 格式二：Emoji 模式
当终端不支持 Nerd Font 时自动回退：
```
📁 ~/project | 📍 main ✓ | ⚡ 45%-92K/256K
```

### 显示内容说明
- **📁 目录** - 当前工作目录（自动简化为 `~` 或文件夹名）
- **📍 Git 状态** - 分支名称和状态指示符（✓ 干净 / ● 有修改）
- **⚡ Token 使用** - 上下文使用百分比和具体数值（如 `45%-92K/256K`）

### 强制切换显示模式
可以通过环境变量强制指定：
```bash
# 强制使用 Nerd Font 格式
export NERD_FONT=1

# 强制使用 Emoji 格式
export NERD_FONT=0
```

## Requirements

- Node.js >= 20
- OpenCode CLI
- Git (可选，用于 Git 状态显示)

## Development

```bash
# 克隆仓库
git clone <your-repo-url>
cd ocometixline

# 安装依赖
npm install

# 构建
npm run build

# 本地测试
npm link
```

## License

MIT License - 详见 [LICENSE](LICENSE) 文件

## Acknowledgments

感谢以下项目的贡献者们：
- [Two-Weeks-Team](https://github.com/Two-Weeks-Team) 提供的 opencode-status-hud 代码基础
- [Haleclipse](https://github.com/Haleclipse) 提供的 CCometixLine 功能灵感
