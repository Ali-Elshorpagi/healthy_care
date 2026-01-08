@echo off
echo Starting JSON Server for Healthy Care Application
echo.
echo Starting Users Database on port 8877...
start "Users DB (Port 8877)" cmd /k "json-server --watch Src/database/users.json --port 8877"
timeout /t 2 /nobreak >nul

echo Starting Appointments Database on port 8876...
start "Appointments DB (Port 8876)" cmd /k "json-server --watch Src/database/appointments.json --port 8876"
timeout /t 2 /nobreak >nul

echo Starting Ratings Database on port 8874...
start "Ratings DB (Port 8874)" cmd /k "json-server --watch Src/database/ratings.json --port 8874"
timeout /t 2 /nobreak >nul

echo Starting Medical Records Database on port 8875...
start "Medical Records DB (Port 8875)" cmd /k "json-server --watch Src/database/medical_records.json --port 8875"
timeout /t 2 /nobreak >nul

echo Starting Schedules Database on port 8873...
start "Schedules DB (Port 8873)" cmd /k "json-server --watch Src/database/schedules.json --port 8873"
timeout /t 2 /nobreak >nul

echo Starting FAQs Database on port 8872...
start "FAQs DB (Port 8872)" cmd /k "json-server --watch Src/database/faqs.json --port 8872"

echo.
echo ===============================================
echo All JSON Servers are starting...
echo.
echo Users API: http://localhost:8877/users
echo Appointments API: http://localhost:8876/appointments
echo Ratings API: http://localhost:8874/ratings
echo Medical Records API: http://localhost:8875/records
echo Schedules API: http://localhost:8873/schedules
echo FAQs API: http://localhost:8872/faqs
echo.
echo Press any key to stop all servers...
echo ===============================================
pause >nul

taskkill /FI "WINDOWTITLE eq Users DB (Port 8877)*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Appointments DB (Port 8876)*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Ratings DB (Port 8874)*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Medical Records DB (Port 8875)*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Schedules DB (Port 8873)*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq FAQs DB (Port 8872)*" /T /F >nul 2>&1

echo.
echo All servers stopped.
pause
