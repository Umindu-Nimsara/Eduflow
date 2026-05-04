@echo off
echo ========================================
echo   Starting LOCAL Development Mode
echo ========================================
echo.
echo Backend: Local (http://10.214.148.69:5000)
echo.

REM Start backend
echo [1/2] Starting Local Backend...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

REM Start frontend with local config
echo [2/2] Starting Frontend (Local Mode)...
cd frontend
copy /Y .env.development .env.local >nul
npm start

pause
