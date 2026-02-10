# RA-tools

Renesas RA8P1 MCU AI Assisted Development Tools

## Quick Start

### 1. Download FSP Documentation

Download and extract FSP v6.0.0 documentation to current directory:

```bash
# Download (Linux/Mac)
wget https://xget.xi-xu.me/gh/renesas/fsp/releases/download/v6.0.0/fsp_documentation_v6.0.0.zip

# Or download directly from browser and extract to current directory
# Directory structure: RA-tools/fsp_documentation/v6.0.0/
```

### 2. Configure Environment Variables

Copy the template file and modify according to your environment:

**Linux/Mac:**

```bash
cd mcp/fsp-mcp-server
cp .env.template .env
nano .env  # Edit paths according to your environment
```

**Windows (PowerShell):**

```powershell
cd mcp\fsp-mcp-server
copy .env.template .env
notepad .env  # Edit paths according to your environment
```

Key configuration items in `.env`:

```env
# Path to FSP documentation directory
FSP_DOCS_PATH=F:/projects/fsp-mcp/RA-tools/fsp_documentation

# Path to SDK (for searching example projects)
SDK_PATH=F:/projects/fsp-mcp/sdk-bsp-ra8p1-titan-board-main

# Default FSP version
FSP_DEFAULT_VERSION=v6.0.0
```

Or set environment variables manually (see below).

### 3. Install Dependencies

```bash
cd mcp/fsp-mcp-server
npm install
npm run build
```

### 4. Create Documentation Index

Index files will be saved in `mcp/fsp-mcp-server/dist/` directory.

**Using .env file (Recommended):**

```bash
cd mcp/fsp-mcp-server
node dist/cli.js index
```

**Or set environment variables manually:**

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

Expected output:
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

### 5. Start MCP Server

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

### 6. Install Claude Skill

```bash
cd ../..
npx skills add skills/fsp-config-assistant
```

## Configure Claude Desktop

Add to `C:\Users\<user>\.claude.json` (Windows)

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

**Linux/Mac paths:**
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

## Directory Structure

```
RA-tools/
├── fsp_documentation/v6.0.0/    # FSP official documentation (downloaded)
├── sdk-bsp-ra8p1-titan-board-main/  # SDK example projects
│   └── project/                 # Example projects
│       ├── Titan_basic_blink_led/
│       ├── Titan_basic_buzzer/
│       ├── Titan_basic_key_irq/
│       ├── Titan_component_flash_fs/
│       └── Titan_component_netutils/
├── mcp/fsp-mcp-server/          # MCP server
│   ├── src/                      # Source code
│   ├── dist/                     # Compiled files and index storage
│   │   ├── server.js             # MCP server entry
│   │   ├── cli.js                # CLI entry
│   │   └── fsp_v6_0_0_index.jsonl # Document index (~9.6MB)
│   ├── .env.template             # Environment variables template
│   └── package.json
├── skills/fsp-config-assistant/  # Configuration assistant Skill
│   └── SKILL.md
```

## Available MCP Tools

| Tool | Description |
| :--- | :--- |
| `search_docs` | Search FSP documentation using natural language |
| `list_modules` | List all available FSP modules |
| `get_api_reference` | Get detailed API reference for functions |
| `find_examples` | Find code examples from documentation |
| `search_sdk_examples` | Search SDK example projects |
| `get_module_info` | Get module overview |
| `get_config_workflow` | Get peripheral configuration steps |
| `analyze_project_config` | Analyze FSP configuration.xml |

## SDK Example Projects

SDK example projects are indexed from `SDK_PATH/project/*/README_zh.md`. Available examples:

| Project | Description |
| :--- | :--- |
| `Titan_basic_blink_led` | GPIO LED control |
| `Titan_basic_buzzer` | GPT PWM buzzer control |
| `Titan_basic_key_irq` | ICU IRQ external interrupt |
| `Titan_component_flash_fs` | OSPI Flash, FAL, LittleFS |
| `Titan_component_netutils` | WiFi, LWIP, SDHI |


## Troubleshooting

### Index creation fails

- Ensure FSP documentation is downloaded and extracted
- Check that `fsp_documentation/v6.0.0/` directory exists
- Verify environment variables are set correctly

### Server won't start

- Ensure `npm run build` was executed

- Check that `dist/server.js` exists

- Verify Node.js version >= 18.0.0

### Claude can't find MCP tools

- Verify Claude Desktop configuration file path
- Check that file paths use double backslashes on Windows (`\\`)
- Restart Claude Desktop after configuration changes


