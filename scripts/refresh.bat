@echo off
REM Refresh/Rebuild PaaS System for Windows

echo ==========================================
echo PaaS System Refresh
echo ==========================================

cd frontend

echo Updating npm packages...
call npm install

echo Building application...
call npm run build

echo.
echo ==========================================
echo Refresh Complete!
echo ==========================================
echo Application rebuilt. Run 'npm run dev' to start
echo.

pause
