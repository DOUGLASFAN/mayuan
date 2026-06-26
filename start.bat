@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo   ╭────────────────────────────────────────╮
echo   │   马克思主义原理 · 刷题复习系统       │
echo   ╰────────────────────────────────────────╯
echo.
echo   启动中...
echo.

start http://localhost:3000
node server.js

pause
