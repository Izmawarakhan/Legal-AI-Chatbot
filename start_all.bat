@echo off
:: Request admin elevation automatically
NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Requesting admin rights...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ============================================
echo   QanoonAI - Starting All Services
echo ============================================
echo.

:: Step 1: Kill any stuck cloudflared processes
echo [1/5] Cleaning up old tunnel processes...
taskkill /f /im cloudflared.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Step 2: Stop and remove broken cloudflared Windows service
echo [2/5] Removing broken tunnel service...
sc stop cloudflared >nul 2>&1
sc delete cloudflared >nul 2>&1
timeout /t 2 /nobreak >nul

:: Step 3: Start Cloudflare Tunnel (as current user, not SYSTEM)
echo [3/5] Starting Cloudflare Tunnel...
start "Cloudflare Tunnel" /min "C:\Program Files (x86)\cloudflared\cloudflared.exe" --config "C:\Users\user\.cloudflared\config.yml" tunnel run qanoon-ai
timeout /t 3 /nobreak >nul

:: Step 4: Start Backend API
echo [4/5] Starting Backend API (port 8001)...
start "QanoonAI Backend" cmd /k "cd /d D:\FYP\qanoonai-backend\qanoonai-backend && uvicorn main:app --port 8001"
timeout /t 2 /nobreak >nul

:: Start Chatbot Engine
echo [4/5] Starting Chatbot Engine (port 8000)...
start "QanoonAI Chatbot" cmd /k "cd /d ""D:\FYP\Version 2\Chatbot"" && uvicorn Api:app --port 8000"
timeout /t 2 /nobreak >nul

:: Step 5: Start Frontend
echo [5/5] Starting Frontend (port 5173)...
start "QanoonAI Frontend" cmd /k "cd /d D:\FYP\qanoonai-frontend\qanoonai-frontend && npm run dev"

echo.
echo ============================================
echo  All services starting!
echo ============================================
echo  Local:
echo    Frontend  : http://localhost:5173
echo    Backend   : http://localhost:8001
echo    Chatbot   : http://localhost:8000
echo.
echo  Live:
echo    Site      : https://fyp.creoation.com
echo    API       : https://api.creoation.com
echo    Chatbot   : https://chatbot.creoation.com
echo.
echo  Wait ~90 seconds for chatbot to load FAISS.
echo ============================================
echo.
pause
