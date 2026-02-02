@echo off
cd /d "e:\important projects\Attendence-Product\backend"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
