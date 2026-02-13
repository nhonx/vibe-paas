@echo off
REM Reset Projects - Wipe out all existing projects for Windows
REM WARNING: This will delete all projects, containers, and data!

echo ==========================================
echo PaaS Projects Reset
echo ==========================================
echo.
echo WARNING: This will:
echo   - Stop and remove all project containers
echo   - Delete all project files
echo   - Clear the database
echo   - Remove all Nginx configurations
echo.
set /p CONFIRM="Are you sure you want to continue? (yes/no): "

if not "%CONFIRM%"=="yes" (
    echo Reset cancelled.
    exit /b 0
)

echo.
set /p FINAL_CONFIRM="Type 'DELETE ALL PROJECTS' to confirm: "

if not "%FINAL_CONFIRM%"=="DELETE ALL PROJECTS" (
    echo Reset cancelled.
    exit /b 0
)

echo.
echo Starting reset process...

REM Stop all paas containers
echo Stopping all PaaS containers...
for /f "tokens=*" %%i in ('docker ps -a --filter "name=paas-" --format "{{.Names}}"') do (
    echo   Stopping %%i...
    docker stop %%i 2>nul
    echo   Removing %%i...
    docker rm %%i 2>nul
)

REM Remove all paas images
echo Removing PaaS Docker images...
for /f "tokens=*" %%i in ('docker images --filter "reference=paas-*" --format "{{.Repository}}:{{.Tag}}"') do (
    echo   Removing %%i...
    docker rmi %%i 2>nul
)

REM Remove project files
if exist "data\projects" (
    echo Removing project files...
    rmdir /s /q "data\projects" 2>nul
    mkdir "data\projects"
    echo   Project files removed
)

REM Remove database
if exist "data\paas.db" (
    echo Removing database...
    del /f /q "data\paas.db" 2>nul
    del /f /q "data\paas.db-shm" 2>nul
    del /f /q "data\paas.db-wal" 2>nul
    echo   Database removed
)

REM Remove Nginx configurations
if exist "nginx-configs" (
    echo Removing Nginx configurations...
    del /f /q "nginx-configs\*.conf" 2>nul
    echo   Nginx configs removed
)

echo.
echo ==========================================
echo Reset Complete!
echo ==========================================
echo All projects have been removed.
echo The system is ready for new deployments.
echo.
echo Summary:
echo   - Containers: Stopped and removed
echo   - Images: Removed
echo   - Project files: Deleted
echo   - Database: Cleared
echo   - Nginx configs: Removed
echo.

pause
