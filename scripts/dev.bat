@echo off
REM Development environment startup script for Windows

echo Starting PaaS in development mode...

REM Create data directories
if not exist "data\projects" mkdir data\projects
if not exist "nginx-configs" mkdir nginx-configs

REM Start backend
echo Starting backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r requirements.txt

if not exist ".env" (
    copy .env.example .env
)

start "PaaS Backend" cmd /k "venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
cd ..

REM Start frontend
echo Starting frontend...
cd frontend

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

start "PaaS Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ==========================================
echo PaaS Development Environment Running
echo ==========================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Close the terminal windows to stop services
echo ==========================================

pause
