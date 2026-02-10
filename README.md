# RA-tools

Renesas RA8P1 MCU AI 辅助开发工具集

## 快速开始

### 1. 下载 FSP 文档

下载并解压 FSP v6.0.0 文档到当前目录：

```bash
# 下载
wget https://xget.xi-xu.me/gh/renesas/fsp/releases/download/v6.0.0/fsp_documentation_v6.0.0.zip

# 或直接下载后解压到当前目录
# 目录结构: RA-tools/fsp_documentation/v6.0.0/
```

### 2. 创建文档索引

索引文件将保存在 `npx-package/dist/` 目录下：

```bash
npx fsp-mcp-server index
```

### 3. 启动 MCP 服务器

```bash
npx fsp-mcp-server serve
```

### 4. 安装 Claude Skill

```bash
npx skills add skills/fsp-config-assistant
```

## 配置 Claude

在 `C:\Users\<用户>\AppData\Roaming\Claude\claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "fsp-docs": {
      "type": "stdio",
      "command": "npx",
      "args": ["fsp-mcp-server", "serve"],
      "env": {
        "FSP_DOCS_PATH": "F:\\projects\\fsp-mcp\\RA-tools\\fsp_documentation",
        "FSP_INDEX_PATH": "F:\\projects\\fsp-mcp\\npx-package\\dist",
        "FSP_DEFAULT_VERSION": "v6.0.0"
      }
    }
  }
}
```
例如：
```json
    "fsp-docs": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "F:\\projects\\fsp-mcp\\npx-package\\dist\\server.js"
      ],
      "env": {
        "FSP_DOCS_PATH": "F:\\projects\\fsp-mcp\\fsp_documentation",
        "FSP_DEFAULT_VERSION": "v6.0.0"
      }
    }
```

## 目录结构

```
RA-tools/
├── fsp_documentation/v6.0.0/    # FSP 官方文档
├── npx-package/
│   ├── src/                      # 源代码
│   ├── dist/                     # 索引文件存储位置
│   └── package.json
└── skills/fsp-config-assistant/  # 配置助手 Skill
```
