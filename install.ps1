# Claude Cockpit — one-line installer (Windows).
#   irm https://raw.githubusercontent.com/kunal-7x/claude-cockpit/main/install.ps1 | iex
$ErrorActionPreference = "Stop"
$dir = Join-Path $HOME ".cockpit"
function Have($c) { return [bool](Get-Command $c -ErrorAction SilentlyContinue) }

Write-Host ""
Write-Host "  Claude Cockpit installer" -ForegroundColor Magenta

if (-not (Have node)) {
  Write-Host "  Node.js is required. Get it at https://nodejs.org , then re-run this command." -ForegroundColor Yellow
  exit 1
}

if (Have git) {
  if (Test-Path (Join-Path $dir ".git")) {
    Write-Host "  Updating existing copy..." -ForegroundColor Blue
    git -C $dir pull --ff-only
  } else {
    if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
    Write-Host "  Cloning..." -ForegroundColor Blue
    git clone --depth 1 https://github.com/kunal-7x/claude-cockpit.git $dir
  }
} else {
  Write-Host "  Downloading..." -ForegroundColor Blue
  $zip = Join-Path $env:TEMP "cockpit.zip"
  Invoke-WebRequest -Uri "https://github.com/kunal-7x/claude-cockpit/archive/refs/heads/main.zip" -OutFile $zip
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  Expand-Archive $zip -DestinationPath $env:TEMP -Force
  Move-Item (Join-Path $env:TEMP "claude-cockpit-main") $dir -Force
}

node (Join-Path $dir "bin\install.js")

# 'cockpit' command shim so `cockpit update` works in new terminals
$shim = Join-Path $dir "cockpit.cmd"
"@echo off`r`nnode `"%~dp0bin\update.js`" %*" | Out-File -FilePath $shim -Encoding ascii -Force
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$dir*") {
  [Environment]::SetEnvironmentVariable("Path", "$userPath;$dir", "User")
  Write-Host "  Added 'cockpit' command to PATH (open a new terminal to use it)." -ForegroundColor Blue
}
