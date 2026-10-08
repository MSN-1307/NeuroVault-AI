@echo off
echo ========================================================
echo   Starting NeuroVault (AI Memory Platform)
echo ========================================================

echo [1/2] Launching FastAPI Backend on http://localhost:8000...
start "NeuroVault Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Launching React Frontend on http://localhost:5173...
start "NeuroVault Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Opening browser...
start http://localhost:5173
echo NeuroVault is running!
