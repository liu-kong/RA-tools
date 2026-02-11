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

### 2. 配置环境变量

复制模板文件并根据您的环境进行修改：

**Linux/Mac:**

```bash
cd mcp/fsp-mcp-server
cp .env.template .env
nano .env  # 根据您的环境编辑路径
```

**Windows (PowerShell):**

```powershell
cd mcp\fsp-mcp-server
copy .env.template .env
notepad .env  # 根据您的环境编辑路径
```

`.env` 文件中的关键配置项：

```env
# FSP 文档目录路径
FSP_DOCS_PATH=F:/projects/fsp-mcp/RA-tools/fsp_documentation

# SDK 路径（用于搜索示例项目）
SDK_PATH=F:/projects/fsp-mcp/sdk-bsp-ra8p1-titan-board-main

# 默认 FSP 版本
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
        "SDK_PATH": "F:\\projects\\fsp-mcp\\sdk-bsp-ra8p1-titan-board-main",
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
        "SDK_PATH": "/home/user/projects/fsp-mcp/sdk-bsp-ra8p1-titan-board-main",
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
├── sdk-bsp-ra8p1-titan-board-main/  # SDK 示例项目
│   └── project/                 # 示例项目
│       ├── Titan_basic_blink_led/
│       ├── Titan_basic_buzzer/
│       ├── Titan_basic_key_irq/
│       ├── Titan_component_flash_fs/
│       └── Titan_component_netutils/
├── mcp/fsp-mcp-server/          # MCP 服务器
│   ├── src/                      # 源代码
│   ├── dist/                     # 编译文件和索引存储
│   │   ├── server.js             # MCP 服务器入口
│   │   ├── cli.js                # CLI 入口
│   │   ├── fsp_v6_0_0_index.jsonl # 文档索引 (~9.6MB)
│   │   └── data/                 # 引脚数据文件
│   │       ├── pins.json        # 引脚映射 (~58KB)
│   │       ├── pin_functions.json # 功能描述 (~27KB)
│   │       └── toc_flat.json    # 手册目录 (~265KB)
│   ├── .env.template             # 环境变量模板
│   └── package.json
├── skills/fsp-config-assistant/  # 配置助手 Skill
│   └── SKILL.md

```

## 可用的 MCP 工具

### 文档搜索工具

| 工具 | 描述 |
| :--- | :--- |
| `search_docs` | 使用自然语言搜索 FSP 文档 |
| `list_modules` | 列出所有可用的 FSP 模块 |
| `get_api_reference` | 获取函数的详细 API 参考 |
| `find_examples` | 从文档中查找代码示例 |
| `search_sdk_examples` | 搜索 SDK 示例项目 |
| `get_module_info` | 获取模块概览 |
| `get_config_workflow` | 获取外设配置步骤 |
| `analyze_project_config` | 分析 FSP configuration.xml |
| :--- | :--- | :--- |
| `get_pin_info` | 查询指定引脚的详细信息 | `A1`, `B12`, `M5` |
| `find_pins_by_function` | 按功能查找引脚 | `SCI0_TXD`, `P000`, `UART0` |
| `get_function_description` | 获取功能描述 | `VCC_01`, `XTAL`, `CLKOUT` |
| `search_manual_toc` | 搜索硬件手册 | `clock`, `DMA`, `ADC` |

### 引脚数据示例

```text
# 查询 A1 引脚信息
get_pin_info("A1")
# 返回: 8 个功能类别 (电源、IO端口、外部总线等)

# 查找 SCI0 相关引脚
find_pins_by_function("SCI0")
# 返回: U11, U12

# 获取电源引脚描述
get_function_description("VCC_01")
# 返回: 电源引脚连接说明

# 搜索手册中关于时钟的内容
search_manual_toc("clock")
# 返回: 相关章节和页码
```

### 数据统计

- **引脚数量**: 298 (BGA289)
- **功能类别**: 212 种
- **手册目录**: 2845 个条目
- **唯一信号**: 1015 个

## SDK 示例项目

SDK 示例项目从 `SDK_PATH/project/*/README_zh.md` 索引。可用示例：

| 项目 | 描述 |
| :--- | :--- |
| `Titan_basic_blink_led` | GPIO LED 控制 |
| `Titan_basic_buzzer` | GPT PWM 蜂鸣器控制 |
| `Titan_basic_key_irq` | ICU IRQ 外部中断 |
| `Titan_component_flash_fs` | OSPI Flash、FAL、LittleFS |
| `Titan_component_netutils` | WiFi、LWIP、SDHI |

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
