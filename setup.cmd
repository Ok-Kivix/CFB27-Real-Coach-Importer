@echo off
setlocal enabledelayedexpansion
set HERE=%~dp0
echo === CFB27 Real Coach Importer - setup ===
echo.
echo Installing dependencies (requires Node.js 20+ from https://nodejs.org)...
call npm install --prefix "%HERE%." --no-audit --no-fund
if errorlevel 1 goto :fail
if not exist "%HERE%node" mkdir "%HERE%node"
for /f "delims=" %%i in ('where node') do (
  copy /Y "%%i" "%HERE%node\node.exe" >nul
  goto :done
)
:done
echo.
echo Setup complete. Double-click run.cmd to use the tool.
pause
exit /b 0
:fail
echo.
echo Setup failed. Make sure Node.js is installed and on your PATH.
pause
exit /b 1
