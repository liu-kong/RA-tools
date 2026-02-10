@echo off
REM ============================================================================
REM RA-tools Setup Script for Windows
REM Renesas RA8P1 MCU AI Assisted Development Tools - Automated Setup Script
REM ============================================================================

setlocal enabledelayedexpansion

REM Color settings
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "RESET=[0m"

REM Project root directory
set "SCRIPT_DIR=%~dp0"
set "FSP_DOCS_URL=https://xget.xi-xu.me/gh/renesas/fsp/releases/download/v6.0.0/fsp_documentation_v6.0.0.zip"
set "FSP_DOCS_ZIP=%SCRIPT_DIR%fsp_documentation_v6.0.0.zip"
set "FSP_DOCS_DIR=%SCRIPT_DIR%fsp_documentation"
set "MCP_SERVER_DIR=%SCRIPT_DIR%mcp\fsp-mcp-server"

echo.
echo %BLUE%======================================================%RESET%
echo %BLUE%    RA-tools Automated Setup Script (Windows)%RESET%
echo %BLUE%======================================================%RESET%
echo.

REM ============================================================================
REM Step 1: Check Node.js
REM ============================================================================
echo %YELLOW%[1/5] Checking Node.js...%RESET%
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo %RED%Error: Node.js not found, please install Node.js first%RESET%
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo %GREEN%✓ Node.js installed: !NODE_VERSION!%RESET%
echo.

REM ============================================================================
REM Step 2: Download FSP Documentation
REM ============================================================================
echo %YELLOW%[2/5] Checking FSP Documentation...%RESET%
if exist "%FSP_DOCS_DIR%\v6.0.0" (
    echo %GREEN%✓ FSP documentation exists, skipping download%RESET%
) else (
    echo Downloading FSP documentation...
    echo From: %FSP_DOCS_URL%

   REM Check curl or wget
    where curl >nul 2>nul
    if %errorlevel% equ 0 (
        curl -L -o "%FSP_DOCS_ZIP%" "%FSP_DOCS_URL%"
    ) else (
        where wget >nul 2>nul
        if %errorlevel% equ 0 (
            wget -O "%FSP_DOCS_ZIP%" "%FSP_DOCS_URL%"
        ) else (
            echo %RED%Error: Neither curl nor wget found, please download manually%RESET%
            echo Download URL: %FSP_DOCS_URL%
            echo Extract to: %FSP_DOCS_DIR%
            pause
            exit /b 1
        )
    )

    if exist "%FSP_DOCS_ZIP%" (
        echo Extracting...
        powershell -Command "Expand-Archive -Path '%FSP_DOCS_ZIP%' -DestinationPath '%FSP_DOCS_DIR%' -Force"
        del "%FSP_DOCS_ZIP%"
        echo %GREEN%✓ FSP documentation extracted%RESET%
    ) else (
        echo %RED%Error: Documentation download failed%RESET%
        pause
        exit /b 1
    )
)
echo.

REM ============================================================================
REM Step 3: Install MCP Server Dependencies
REM ============================================================================
echo %YELLOW%[3/5] Installing MCP server dependencies...%RESET%
cd /d "%MCP_SERVER_DIR%"
if exist "package.json" (
    call npm install
    if %errorlevel% equ 0 (
        echo %GREEN%✓ Dependencies installed%RESET%
    ) else (
        echo %RED%Error: Dependency installation failed%RESET%
        pause
        exit /b 1
    )
) else (
    echo %RED%Error: package.json not found%RESET%
    pause
    exit /b 1
)
echo.

REM ============================================================================
REM Step 4: Build and Create Documentation Index
REM ============================================================================
echo %YELLOW%[4/5] Building and creating documentation index...%RESET%
cd /d "%MCP_SERVER_DIR%"

REM Build TypeScript
call npm run build
if %errorlevel% neq 0 (
    echo %RED%Error: Build failed%RESET%
    pause
    exit /b 1
)
echo %GREEN%✓ Build completed%RESET%

REM Create index
echo Creating documentation index (this may take a few minutes)...
call npx fsp-mcp-server index
if %errorlevel% neq 0 (
    echo %YELLOW%Warning: Index creation may have failed, please check documentation path%RESET%
) else (
    echo %GREEN%✓ Index created%RESET%
)
echo.

REM ============================================================================
REM Step 5: Install Claude Skill
REM ============================================================================
echo %YELLOW%[5/5] Installing Claude Skill...%RESET%
cd /d "%SCRIPT_DIR%"
where skills >nul 2>nul
if %errorlevel% equ 0 (
    call npx skills add skills/fsp-config-assistant
    if %errorlevel% equ 0 (
        echo %GREEN%✓ Skill installed%RESET%
    ) else (
        echo %YELLOW%Warning: Skill installation failed, may need manual installation%RESET%
    )
) else (
    echo %YELLOW%Note: Claude Code CLI not found, skipping Skill installation%RESET%
)
echo.

REM ============================================================================
REM Complete
REM ============================================================================
echo %GREEN%======================================================%RESET%
echo %GREEN%              Setup Complete!%RESET%
echo %GREEN%======================================================%RESET%
echo.
echo Next steps:
echo.
echo 1. Start MCP server:
echo    start-server.bat
echo    or:
echo    cd mcp\fsp-mcp-server
echo    npx fsp-mcp-server serve
echo.
echo 2. Configure Claude Desktop (optional):
echo    Edit %%USERPROFILE%%\AppData\Roaming\Claude\claude_desktop_config.json
echo.
echo 3. View documentation:
echo    type README.md
echo.
pause
