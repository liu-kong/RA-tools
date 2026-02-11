# FSP MCP Server - npx Package

Renesas FSP 文档搜索和 RA8P1 引脚数据的 MCP 服务器 - 支持 npx 直接运行

## 新增功能

### 引脚数据查询工具

现在支持 RA8P1 MCU 的引脚信息查询：

- `get_pin_info` - 查询指定引脚的详细信息和所有可用功能
- `find_pins_by_function` - 按功能/信号查找可用引脚
- `get_function_description` - 获取引脚功能的详细描述
- `search_manual_toc` - 搜索 RA8P1 硬件手册目录

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

## 可用工具

### 文档搜索工具

| 工具 | 描述 |
| :--- | :--- |
| `search_docs` | 使用自然语言搜索 FSP 文档 |
| `list_modules` | 列出所有可用的 FSP 模块 |
| `get_api_reference` | 获取函数的详细 API 参考 |
| `find_examples` | 从文档中查找代码示例 |
| `get_module_info` | 获取模块概览 |
| `get_config_workflow` | 获取外设配置步骤 |
| `analyze_project_config` | 分析 FSP configuration.xml |

### 引脚数据工具

| 工具 | 描述 | 示例 |
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

## 数据统计

- **引脚数量**: 298 (BGA289)
- **功能类别**: 212 种
- **手册目录**: 2845 个条目
- **唯一信号**: 1015 个

## 发布到 npm

```bash
npm publish
```
