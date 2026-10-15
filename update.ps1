<#
.SYNOPSIS
  Update Deutsch Drill on Windows: downloads the new version (git pull), installs dependencies if needed,
  rebuilds and refreshes the Start-menu shortcut.

.DESCRIPTION
  In PowerShell, in the deutsch-drill folder:
    .\update.ps1
  Options:
    -Force   rebuild even when there is nothing new to download
  If Node.js is missing or too old, the setup script runs first and installs it.
  The steps themselves live in scripts\update.ts (shared with Linux and macOS: npm run update).
#>
param([switch]$Force)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$MinNode = [version]'22.18.0'

function Get-NodeVersion {
  try { return [version]((& node --version) -replace '^v', '') } catch { return $null }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'git is not installed. Install it with: winget install --id Git.Git -e   (then open a new PowerShell and run .\update.ps1 again)'
}

$node = Get-NodeVersion
if (-not $node -or $node -lt $MinNode) {
  Write-Host 'Node.js is missing or too old; running the setup script first.' -ForegroundColor Yellow
  & "$PSScriptRoot\scripts\setup-windows.ps1"
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

$updateArgs = @()
if ($Force) { $updateArgs += '--force' }
& node scripts/update.ts @updateArgs
exit $LASTEXITCODE
