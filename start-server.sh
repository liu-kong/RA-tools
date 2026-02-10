#!/bin/bash
# ============================================================================
# RA-tools MCP Server Start Script for Linux/Mac
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_SERVER_DIR="$SCRIPT_DIR/mcp/fsp-mcp-server"

echo ""
echo -e "${BLUE}======================================================${RESET}"
echo -e "${BLUE}     Starting FSP MCP Server${RESET}"
echo -e "${BLUE}======================================================${RESET}"
echo ""

# Check MCP server directory
if [ ! -d "$MCP_SERVER_DIR" ]; then
    echo -e "${YELLOW}Error: MCP server directory not found${RESET}"
    echo "Please run setup.sh first"
    exit 1
fi

cd "$MCP_SERVER_DIR"

# Check dist directory
if [ ! -f "dist/config.js" ]; then
    echo -e "${YELLOW}Error: Server not built, please run npm run build${RESET}"
    exit 1
fi

# Set environment variables (optional, can be overridden)
export FSP_DOCS_PATH="$SCRIPT_DIR/fsp_documentation"
export FSP_INDEX_PATH="$MCP_SERVER_DIR/dist"
export FSP_DEFAULT_VERSION="v6.0.0"

echo "Configuration:"
echo "  Docs path: $FSP_DOCS_PATH"
echo "  Index path: $FSP_INDEX_PATH"
echo "  Default version: $FSP_DEFAULT_VERSION"
echo ""
echo -e "${YELLOW}MCP Server starting... (Press Ctrl+C to stop)${RESET}"
echo ""

# Start server
npx fsp-mcp-server serve
