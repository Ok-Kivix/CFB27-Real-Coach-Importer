@echo off
REM Real Coaches — standalone launcher. Double-click, or run from a command prompt
REM with optional flags, e.g.:  run.cmd --dry-run
REM Uses the bundled Node runtime so nothing needs to be installed.
setlocal
set HERE=%~dp0
"%HERE%node\node.exe" "%HERE%index.js" %*
echo.
pause
