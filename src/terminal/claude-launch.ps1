# Claude Cockpit — session banner.
# Rebrand WITHOUT reinstalling: edit branding/logo.txt (your logo) and cockpit.config.json (name/company).
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "SilentlyContinue"
$E = [char]27
$ccHome = "{{CLAUDE_HOME}}"

# Defaults (overridden by cockpit.config.json at runtime)
$brand = "Claude Cockpit"; $tagline = "Supercharged Claude Code"; $company = "FAMIT"; $showCredit = $true
$logoFile = Join-Path $ccHome "branding/logo.txt"
try {
  $cfg = Get-Content (Join-Path $ccHome "cockpit.config.json") -Raw | ConvertFrom-Json
  if ($cfg.brand.name)    { $brand    = $cfg.brand.name }
  if ($cfg.brand.tagline) { $tagline  = $cfg.brand.tagline }
  if ($cfg.brand.company) { $company  = $cfg.brand.company }
  if ($null -ne $cfg.brand.showCompanyCredit) { $showCredit = [bool]$cfg.brand.showCompanyCredit }
  if ($cfg.brand.logoFile){ $logoFile = Join-Path $ccHome $cfg.brand.logoFile }
} catch {}

$grad  = @("$E[38;2;134;225;252m","$E[38;2;130;170;255m","$E[38;2;150;160;255m","$E[38;2;170;150;240m","$E[38;2;199;146;234m","$E[38;2;199;146;234m")
$dim   = "$E[38;2;125;135;178m"
$faint = "$E[38;2;90;96;130m"
$rst   = "$E[0m"

Write-Host ""
$logo = @(Get-Content $logoFile -ErrorAction SilentlyContinue)
if ($logo.Count -gt 0) {
  for ($i = 0; $i -lt $logo.Count; $i++) {
    $c = $grad[[Math]::Min($i, $grad.Count - 1)]
    Write-Host ($c + $logo[$i] + $rst)
  }
} else {
  Write-Host ($grad[4] + "  " + $brand + $rst)
}
Write-Host ""
Write-Host ("  $dim$tagline   " + [char]183 + "   " + (Get-Date -Format "ddd dd MMM  HH:mm") + $rst)
Write-Host ("  ${dim}Ctrl+Shift+E files   " + [char]183 + "   /ui look   " + [char]183 + "   /powers commands   " + [char]183 + "   /paste image$rst")

# Subtle company credit, bottom-right
if ($showCredit -and $company) {
  $w = [Console]::WindowWidth; if (-not $w -or $w -lt 20) { $w = 90 }
  $credit = "by $company"
  $pad = [Math]::Max(0, $w - $credit.Length - 2)
  Write-Host ((" " * $pad) + "$faint$credit$rst")
}
Write-Host ""

# Launch Claude Code (resolve dynamically — works on any machine)
$claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
if (-not $claude) {
  foreach ($p in @("$env:USERPROFILE\.local\bin\claude.exe", "$env:LOCALAPPDATA\Programs\claude\claude.exe", "$env:APPDATA\npm\claude.cmd")) {
    if (Test-Path $p) { $claude = $p; break }
  }
}
if ($claude) { & $claude $args } else { Write-Host "${dim}Claude Code not found on PATH — install it, then reopen this terminal.$rst" }
