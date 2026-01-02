@echo off
echo Starting JSON Server for Healthy Care Application
echo.
echo Starting Users Database on port 8877...
start "Users DB (Port 8877)" cmd /k "json-server --watch Src/database/users.json --port 8877"
timeout /t 2 /nobreak >nul

echo Starting Appointments Database on port 8876...
start "Appointments DB (Port 8876)" cmd /k "json-server --watch Src/database/appointments.json --port 8876"
timeout /t 2 /nobreak >nul

echo Starting Medical Records Database on port 8875...
start "Medical Records DB (Port 8875)" cmd /k "json-server --watch Src/database/medical_records.json --port 8875"

echo.
echo ===============================================
echo All JSON Servers are starting...
echo.
echo Users API: http://localhost:8877/users
echo Appointments API: http://localhost:8876/appointments
echo Medical Records API: http://localhost:8875/records
echo.
echo Press any key to stop all servers...
echo ===============================================
pause >nul

taskkill /FI "WINDOWTITLE eq Users DB (Port 8877)*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Appointments DB (Port 8876)*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Medical Records DB (Port 8875)*" /T /F >nul 2>&1

echo.
echo All servers stopped.
pause
