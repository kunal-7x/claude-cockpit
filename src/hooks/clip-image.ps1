# Saves the current clipboard image to a PNG and prints its path (or NO_IMAGE).
# Used by the /paste command.
$ErrorActionPreference = 'SilentlyContinue'
$clipDir = Join-Path $env:USERPROFILE ".claude\clipboard"
if (-not (Test-Path $clipDir)) { New-Item -ItemType Directory -Path $clipDir -Force | Out-Null }

$img = $null
try { $img = Get-Clipboard -Format Image } catch {}
if ($img) {
  Add-Type -AssemblyName System.Drawing
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $p = Join-Path $clipDir "paste-$stamp.png"
  $img.Save($p, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output $p
  return
}

# Fall back to a copied image FILE (Ctrl+C on a file in Explorer)
$files = $null
try { $files = Get-Clipboard -Format FileDropList } catch {}
if ($files) {
  foreach ($f in $files) {
    $fp = [string]$f
    if ($fp -match '\.(png|jpe?g|gif|webp|bmp)$' -and (Test-Path $fp)) { Write-Output $fp; return }
  }
}
Write-Output "NO_IMAGE"
