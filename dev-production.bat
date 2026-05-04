@echo off
echo ========================================
echo   Starting PRODUCTION Development Mode
echo ========================================
echo.
echo Backend: Render (https://eduflow-backend.onrender.com)
echo.

REM Start frontend with production config
echo Starting Frontend (Production Mode)...
cd frontend
copy /Y .env.production .env.local >nul
npm start

pause
