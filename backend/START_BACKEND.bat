@echo off
echo ========================================
echo Starting Attendance Product Backend
echo ========================================
echo.

cd /d "%~dp0"

echo Checking setup...
python setup_and_run.py

pause
