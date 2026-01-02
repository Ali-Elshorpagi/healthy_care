param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$Email = "admin@healthycare.local",
    [string]$PasswordPlain = "admin123",
    [string]$FullName = "System Admin"
)

function Get-Sha256Hex([string]$text) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $sha.ComputeHash($bytes)
    return ([System.BitConverter]::ToString($hashBytes)).Replace('-', '').ToLower()
}

$hashed = Get-Sha256Hex $PasswordPlain

Write-Host "Seeding admin user..." -ForegroundColor Cyan
Write-Host "Email:    $Email"
Write-Host "Password: $PasswordPlain" -ForegroundColor Yellow
Write-Host "Hash:     $hashed"

# Check if exists
$existing = Invoke-RestMethod -Method Get -Uri "$BaseUrl/users?email=$([uri]::EscapeDataString($Email))"
if ($existing -and $existing.Count -gt 0) {
    Write-Host "Admin already exists. Nothing to do." -ForegroundColor Green
    exit 0
}

$admin = [ordered]@{
    id        = "a_$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
    role      = "admin"
    fullName  = $FullName
    email     = $Email
    password  = $hashed
    createdAt = (Get-Date).ToUniversalTime().ToString("o")
}

Invoke-RestMethod -Method Post -Uri "$BaseUrl/users" -ContentType "application/json" -Body ($admin | ConvertTo-Json)
Write-Host "Admin created successfully." -ForegroundColor Green
