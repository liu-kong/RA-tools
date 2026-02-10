#!/bin/bash
# ============================================================================
# RA-tools Setup Script for Linux/Mac
# Renesas RA8P1 MCU AI Assisted Development Tools - Automated Setup Script
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

# Project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FSP_DOCS_URL="https://xget.xi-xu.me/gh/renesas/fsp/releases/download/v6.0.0/fsp_documentation_v6.0.0.zip"
FSP_DOCS_ZIP="$SCRIPT_DIR/fsp_documentation_v6.0.0.zip"
FSP_DOCS_DIR="$SCRIPT_DIR/fsp_documentation"
MCP_SERVER_DIR="$SCRIPT_DIR/mcp/fsp-mcp-server"

echo ""
echo -e "${BLUE}======================================================${RESET}"
echo -e "${BLUE}    RA-tools Automated Setup Script (Linux/Mac)${RESET}"
echo -e "${BLUE}======================================================${RESET}"
echo ""

# ============================================================================
# Step 1: Check Node.js
# ============================================================================
echo -e "${YELLOW}[1/5] Checking Node.js...${RESET}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not found, please install Node.js first${RESET}"
    echo "Installation:"
    echo "  Ubuntu/Debian: sudo apt-get install nodejs npm"
    echo "  macOS: brew install node"
    echo "  Or visit: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${RESET}"
echo ""

# ============================================================================
# Step 2: Download FSP Documentation
# ============================================================================
echo -e "${YELLOW}[2/5] Checking FSP Documentation...${RESET}"
if [ -d "$FSP_DOCS_DIR/v6.0.0" ]; then
    echo -e "${GREEN}✓ FSP documentation exists, skipping download${RESET}"
else
    echo "Downloading FSP documentation..."
    echo "From: $FSP_DOCS_URL"

    # Check download tool
    if command -v wget &> /dev/null; then
        wget -O "$FSP_DOCS_ZIP" "$FSP_DOCS_URL"
    elif command -v curl &> /dev/null; then
        curl -L -o "$FSP_DOCS_ZIP" "$FSP_DOCS_URL"
    else
        echo -e "${RED}Error: Neither wget nor curl found, please download manually${RESET}"
        echo "Download URL: $FSP_DOCS_URL"
        echo "Extract to: $FSP_DOCS_DIR"
        exit 1
    fi

    if [ -f "$FSP_DOCS_ZIP" ]; then
        echo "Extracting..."
        mkdir -p "$FSP_DOCS_DIR"
        unzip -q "$FSP_DOCS_ZIP" -d "$FSP_DOCS_DIR"
        rm "$FSP_DOCS_ZIP"
        echo -e "${GREEN}✓ FSP documentation extracted${RESET}"
    else
        echo -e "${RED}Error: Documentation download failed${RESET}"
        exit 1
    fi
fi
echo ""

# ============================================================================
# Step 3: Install MCP Server Dependencies
# ============================================================================
echo -e "${YELLOW}[3/5] Installing MCP server dependencies...${RESET}"
cd "$MCP_SERVER_DIR"
if [ -f "package.json" ]; then
    if npm install; then
        echo -e "${GREEN}✓ Dependencies installed${RESET}"
    else
        echo -e "${RED}Error: Dependency installation failed${RESET}"
        exit 1
    fi
else
    echo -e "${RED}Error: package.json not found${RESET}"
    exit 1
fi
echo ""

# ============================================================================
# Step 4: Build and Create Documentation Index
# ============================================================================
echo -e "${YELLOW}[4/5] Building and creating documentation index...${RESET}"
cd "$MCP_SERVER_DIR"

# Build TypeScript
if npm run build; then
    echo -e "${GREEN}✓ Build completed${RESET}"
else
    echo -e "${RED}Error: Build failed${RESET}"
    exit 1
fi

# Create index
echo "Creating documentation index (this may take a few minutes)..."
if npx fsp-mcp-server index; then
    echo -e "${GREEN}✓ Index created${RESET}"
else
    echo -e "${YELLOW}Warning: Index creation may have failed, please check documentation path${RESET}"
fi
echo ""

# ============================================================================
# Step 5: Install Claude Skill
# ============================================================================
echo -e "${YELLOW}[5/5] Installing Claude Skill...${RESET}"
cd "$SCRIPT_DIR"
if command -v skills &> /dev/null; then
    if npx skills add skills/fsp-config-assistant; then
        echo -e "${GREEN}✓ Skill installed${RESET}"
    else
        echo -e "${YELLOW}Warning: Skill installation failed, may need manual installation${RESET}"
    fi
else
    echo -e "${YELLOW}Note: Claude Code CLI not found, skipping Skill installation${RESET}"
fi
echo ""

# ============================================================================
# Complete
# ============================================================================
echo -e "${GREEN}======================================================${RESET}"
echo -e "${GREEN}              Setup Complete!${RESET}"
echo -e "${GREEN}======================================================${RESET}"
echo ""
echo "Next steps:"
echo ""
echo "1. Start MCP server:"
echo "   ./start-server.sh"
echo "   or:"
echo "   cd mcp/fsp-mcp-server"
echo "   npx fsp-mcp-server serve"
echo ""
echo "2. Configure Claude Desktop (optional):"
echo "   Edit ~/.claude_desktop_config.json or"
echo "   ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
echo "3. View documentation:"
echo "   cat README.md"
echo ""
