param(
    [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'

# Ensure Node is available in this session
$nodeBin = Join-Path $env:ProgramFiles 'nodejs'
$npxCmd = Join-Path $nodeBin 'npx.cmd'

if (-not (Test-Path $npxCmd)) {
    throw "Node.js is not installed or not found at '$npxCmd'. Install Node.js LTS then retry."
}

$env:Path = "$nodeBin;$env:Path"

$repoRoot = Split-Path -Parent $PSScriptRoot
$dbPath = Join-Path $repoRoot 'Src\database\db.json'

if (-not (Test-Path $dbPath)) {
    throw "Database file not found: $dbPath"
}

Write-Host "Starting JSON Server..." -ForegroundColor Cyan
Write-Host "DB:   $dbPath"
Write-Host "Port: $Port"
Write-Host "URL:  http://localhost:$Port/users"
Write-Host ""

npx json-server@1.0.0-beta.3 --watch "$dbPath" --port $Port
