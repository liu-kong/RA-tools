# FSP MCP Server - npx Package

Renesas FSP 文档搜索的 MCP 服务器 - 支持 npx 直接运行

## 安装使用

```bash
# 全局安装
npm install -g fsp-mcp-server

# 或直接使用 npx（推荐）
npx fsp-mcp-server serve
```

## 配置 Claude Desktop

在 `C:\Users\<用户>\.claude.json` 中添加：

```json
{
  "mcpServers": {
    "fsp-docs": {
      "type": "stdio",
      "command": "npx",
      "args": ["fsp-mcp-server", "serve"],
      "env": {
        "FSP_DOCS_PATH": "你的文档路径",
        "FSP_DEFAULT_VERSION": "v6.0.0"
      }
    }
  }
}
```

## 命令

```bash
npx fsp-mcp-server index              # 创建索引
npx fsp-mcp-server serve              # 启动服务器
npx fsp-mcp-server index --list-versions  # 列出版本
```

## 发布到 npm

```bash
npm publish
```
