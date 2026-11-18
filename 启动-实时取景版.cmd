@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js not found. You can still open index.html directly -
  echo   the camera will use the system camera app instead of live preview.
  echo.
  pause
  exit /b 1
)
echo.
echo   Starting local server for live camera preview...
node serve.js
pause
