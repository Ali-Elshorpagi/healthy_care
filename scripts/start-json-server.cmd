@echo off
setlocal enabledelayedexpansion

rem Starts json-server for the project database on http://localhost:3000

set "NPX=%ProgramFiles%\nodejs\npx.cmd"
if not exist "%NPX%" (
  echo [ERROR] Node.js is not installed or not found at: "%NPX%"
  echo Install Node.js LTS first, then retry.
  exit /b 1
)

set "DB=%~dp0..\Src\database\db.json"
if not exist "%DB%" (
  echo [ERROR] Database file not found: "%DB%"
  echo Make sure you run this from the repo (it uses a relative path).
  exit /b 1
)

echo Starting JSON Server...
echo DB: %DB%
echo URL: http://localhost:3000/users
echo.

"%NPX%" json-server@1.0.0-beta.3 --watch "%DB%" --port 3000
