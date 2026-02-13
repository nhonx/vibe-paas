@echo off
REM Development environment startup script for Windows

echo Starting PaaS in development mode...

REM Create data directories
if not exist "data\projects" mkdir data\projects
if not exist "nginx-configs" mkdir nginx-configs

REM Start application
echo Starting Next.js application...
cd frontend

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

if not exist ".env.local" (
    echo DOMAIN=launch.me > .env.local
    echo NGINX_CONFIG_PATH=../nginx-configs >> .env.local
    echo PROJECTS_BASE_PATH=../data/projects >> .env.local
    echo PORT_RANGE_START=10000 >> .env.local
    echo PORT_RANGE_END=20000 >> .env.local
)

start "PaaS Application" cmd /k "npm run dev"
cd ..

echo.
echo ==========================================
echo PaaS Development Environment Running
echo ==========================================
echo Application: http://localhost:3000
echo API: http://localhost:3000/api
echo.
echo Close the terminal window to stop
echo ==========================================

pause
