<#
.SYNOPSIS
  Set up Deutsch Drill on Windows: installs Node.js if needed, builds the app and adds a Start-menu shortcut.

.DESCRIPTION
  Run from the cloned repo, in PowerShell:
    powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
  Options:
    -Desktop     also put a shortcut on the desktop
    -Uninstall   remove the shortcuts (your settings and progress in %APPDATA%\deutsch-drill are kept)
  To update later: node scripts\update.ts (or run this script again after `git pull`).
#>
param([switch]$Desktop, [switch]$Uninstall)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
# Node runs the TypeScript sources directly; that needs 22.18 or newer.
$MinNode = [version]'22.18.0'

function Get-NodeVersion {
  try { return [version]((& node --version) -replace '^v', '') } catch { return $null }
}

function Update-SessionPath {
  # winget changes the PATH for new terminals; pull it into this one too.
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

function Invoke-Step([string]$What, [scriptblock]$Command) {
  Write-Host "==> $What" -ForegroundColor Cyan
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "$What failed (exit code $LASTEXITCODE)." }
}

if ($Uninstall) {
  Invoke-Step 'Removing shortcuts' { node scripts/install-app.ts --uninstall }
  exit 0
}

$node = Get-NodeVersion
if (-not $node -or $node -lt $MinNode) {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "Node.js $MinNode or newer is required and winget isn't available. Install Node.js LTS from https://nodejs.org, then run this script again."
  }
  if ($node) { Write-Host "Node.js $node is too old (need $MinNode or newer)." }
  Write-Host '==> Installing Node.js LTS with winget' -ForegroundColor Cyan
  & winget install --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) {
    # Already installed through winget but outdated: upgrade instead.
    & winget upgrade --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements
  }
  Update-SessionPath
  $node = Get-NodeVersion
  if (-not $node -or $node -lt $MinNode) {
    throw "Node.js $MinNode or newer still isn't available (found: $node). Close this window, open a new PowerShell and run the script again."
  }
}
Write-Host "Using Node.js $node"

# npm.cmd rather than npm: the npm.ps1 wrapper can be blocked by the execution policy.
Invoke-Step 'Installing dependencies' { npm.cmd ci }
Invoke-Step 'Building the app' { npm.cmd run build }
$installArgs = @()
if ($Desktop) { $installArgs += '--desktop' }
Invoke-Step 'Adding the Start-menu shortcut' { node scripts/install-app.ts @installArgs }

Write-Host ''
Write-Host 'Done. Start "Deutsch Drill" from the Start menu.' -ForegroundColor Green
Write-Host "Settings and verb files: $env:APPDATA\deutsch-drill"
