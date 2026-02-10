@echo off
REM ============================================================================
REM RA-tools MCP Server Start Script for Windows
REM ============================================================================

setlocal enabledelayedexpansion

set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

set "SCRIPT_DIR=%~dp0"
set "MCP_SERVER_DIR=%SCRIPT_DIR%mcp\fsp-mcp-server"

echo.
echo %BLUE%======================================================%RESET%
echo %BLUE%     Starting FSP MCP Server%RESET%
echo %BLUE%======================================================%RESET%
echo.

REM Check MCP server directory
if not exist "%MCP_SERVER_DIR%" (
    echo %YELLOW%Error: MCP server directory not found%RESET%
    echo Please run setup.bat first
    pause
    exit /b 1
)

cd /d "%MCP_SERVER_DIR%"

REM Check dist directory
if not exist "dist\config.js" (
    echo %YELLOW%Error: Server not built, please run npm run build%RESET%
    pause
    exit /b 1
)

REM Set environment variables (optional, can be overridden)
set "FSP_DOCS_PATH=%SCRIPT_DIR%fsp_documentation"
set "FSP_INDEX_PATH=%MCP_SERVER_DIR%\dist"
set "FSP_DEFAULT_VERSION=v6.0.0"

echo Configuration:
echo   Docs path: !FSP_DOCS_PATH!
echo   Index path: !FSP_INDEX_PATH!
echo   Default version: !FSP_DEFAULT_VERSION!
echo.
echo %YELLOW%MCP Server starting... (Press Ctrl+C to stop)%RESET%
echo.

REM Start server
npx fsp-mcp-server serve
