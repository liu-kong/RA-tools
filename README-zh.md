# RA-tools

瑞萨 RA8P1 MCU AI 辅助开发工具集

## 快速开始

### 1. 下载 FSP 文档

下载并解压 FSP v6.0.0 文档到当前目录：

```bash
# 下载 (Linux/Mac)
wget https://xget.xi-xu.me/gh/renesas/fsp/releases/download/v6.0.0/fsp_documentation_v6.0.0.zip

# 或直接从浏览器下载后解压到当前目录
# 目录结构: RA-tools/fsp_documentation/v6.0.0/
```

### 2. 配置环境变量（可选）

编辑 RA-tools 根目录下的 `.env` 文件：

```env
FSP_DOCS_PATH=F:/projects/fsp-mcp/RA-tools/fsp_documentation
FSP_INDEX_PATH=F:/projects/fsp-mcp/RA-tools/mcp/fsp-mcp-server/dist
FSP_DEFAULT_VERSION=v6.0.0
```

或手动设置环境变量（见下方）。

### 3. 安装依赖

```bash
cd mcp/fsp-mcp-server
npm install
npm run build
```

### 4. 创建文档索引

索引文件将保存在 `mcp/fsp-mcp-server/dist/` 目录下。

**使用 .env 文件（推荐）：**

```bash
cd mcp/fsp-mcp-server
node dist/cli.js index
```

**或手动设置环境变量：**

**Linux/Mac:**

```bash
export FSP_DOCS_PATH="$(pwd)/../fsp_documentation"
export FSP_INDEX_PATH="$(pwd)/dist"
node dist/cli.js index
```

**Windows (CMD):**

```cmd
cd mcp\fsp-mcp-server
set FSP_DOCS_PATH=%CD%\..\fsp_documentation
set FSP_INDEX_PATH=%CD%\dist
node dist\cli.js index
```

**Windows (PowerShell):**

```powershell
cd mcp\fsp-mcp-server
$env:FSP_DOCS_PATH = "$(Get-Location)\..\fsp_documentation"
$env:FSP_INDEX_PATH = "$(Get-Location)\dist"
node dist\cli.js index
```

预期输出：

```
Indexing FSP documentation version v6.0.0...
Documentation path: .../fsp_documentation/v6.0.0
Found 1281 HTML files to process
...
Indexing complete:
  - Indexed 637 files
  - Extracted 9889 sections
  - Index saved to .../dist/fsp_v6_0_0_index.jsonl
```

### 5. 启动 MCP 服务器

**使用 .env 文件（推荐）：**

```bash
cd mcp/fsp-mcp-server
node dist/cli.js serve
```

**或手动设置环境变量：**

**Linux/Mac:**

```bash
export FSP_DOCS_PATH="$(pwd)/../fsp_documentation"
export FSP_INDEX_PATH="$(pwd)/dist"
node dist/cli.js serve
```

**Windows:**

```cmd
set FSP_DOCS_PATH=%CD%\..\fsp_documentation
set FSP_INDEX_PATH=%CD%\dist
node dist\cli.js serve
```

### 6. 安装 Claude Skill

```bash
cd ../..
npx skills add skills/fsp-config-assistant
```

## 配置 Claude Desktop

在 `C:\Users\<user>\.claude.json` 中添加：

```json
{
  "mcpServers": {
    "fsp-docs": {
      "type": "stdio",
      "command": "node",
      "args": ["F:\\projects\\fsp-mcp\\RA-tools\\mcp\\fsp-mcp-server\\dist\\server.js"],
      "env": {
        "FSP_DOCS_PATH": "F:\\projects\\fsp-mcp\\RA-tools\\fsp_documentation",
        "FSP_INDEX_PATH": "F:\\projects\\fsp-mcp\\RA-tools\\mcp\\fsp-mcp-server\\dist",
        "FSP_DEFAULT_VERSION": "v6.0.0"
      }
    }
  }
}
```

**Linux/Mac 路径示例：**

```json
{
  "mcpServers": {
    "fsp-docs": {
      "type": "stdio",
      "command": "node",
      "args": ["/home/user/projects/fsp-mcp/RA-tools/mcp/fsp-mcp-server/dist/server.js"],
      "env": {
        "FSP_DOCS_PATH": "/home/user/projects/fsp-mcp/RA-tools/fsp_documentation",
        "FSP_INDEX_PATH": "/home/user/projects/fsp-mcp/RA-tools/mcp/fsp-mcp-server/dist",
        "FSP_DEFAULT_VERSION": "v6.0.0"
      }
    }
  }
}
```

## 目录结构

```
RA-tools/
├── fsp_documentation/v6.0.0/    # FSP 官方文档（下载后）
├── mcp/fsp-mcp-server/          # MCP 服务器
│   ├── src/                      # 源代码
│   ├── dist/                     # 编译文件和索引存储
│   │   ├── server.js             # MCP 服务器入口
│   │   ├── cli.js                # CLI 入口
│   │   └── fsp_v6_0_0_index.jsonl # 文档索引 (~9.6MB)
│   └── package.json
├── skills/fsp-config-assistant/  # 配置助手 Skill
│   └── SKILL.md
├── .env                          # 环境变量配置
├── setup.sh                      # 自动安装脚本 (Linux/Mac)
├── setup.bat                     # 自动安装脚本 (Windows)
├── start-server.sh               # 启动服务器脚本 (Linux/Mac)
└── start-server.bat              # 启动服务器脚本 (Windows)
```

## 可用的 MCP 工具

| 工具 | 描述 |
| :--- | :--- |
| `search_docs` | 使用自然语言搜索 FSP 文档 |
| `list_modules` | 列出所有可用的 FSP 模块 |
| `get_api_reference` | 获取函数的详细 API 参考 |
| `find_examples` | 查找代码示例 |
| `get_module_info` | 获取模块概览 |
| `get_config_workflow` | 获取外设配置步骤 |
| `analyze_project_config` | 分析 FSP configuration.xml |

## 验证

运行验证脚本检查项目状态：

**Linux/Mac:**

```bash
./verify.sh
```

**Windows:**

```cmd
verify.bat
```

## 故障排查

### 索引创建失败

- 确保已下载并解压 FSP 文档
- 检查 `fsp_documentation/v6.0.0/` 目录是否存在
- 验证环境变量设置是否正确

### 服务器无法启动

- 确保已执行 `npm run build`

- 检查 `dist/server.js` 是否存在

- 验证 Node.js 版本 >= 18.0.0

### Claude 找不到 MCP 工具

- 验证 Claude Desktop 配置文件路径
- 检查 Windows 上的文件路径是否使用双反斜杠 (`\\`)
- 配置更改后重启 Claude Desktop

## 索引统计

- **处理的 HTML 文件数:** 1281
- **索引的文件数:** 637
- **提取的段落数:** 9889
- **索引文件大小:** ~9.6MB
- **支持的 FSP 版本:** v6.0.0
