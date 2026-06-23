# Clipboard image watcher (with logging).
# On a new clipboard image: optionally DOWNSCALE its resolution (the real token
# saver — Claude bills by pixels), save a PNG, and put the file PATH on the
# clipboard alongside the image. Compression controlled by ui-config.json.
$ErrorActionPreference = 'SilentlyContinue'
$log = Join-Path $env:USERPROFILE ".claude\clip-watch.log"
function Log($m) { try { Add-Content -Path $log -Value ("{0}  {1}" -f (Get-Date -Format 'HH:mm:ss'), $m) -Encoding utf8 } catch {} }

$mutex = New-Object System.Threading.Mutex($false, "ClaudeCockpitClipWatch")
if (-not $mutex.WaitOne(0)) { Log "another instance running - exit"; exit }

try { Add-Type -AssemblyName System.Windows.Forms } catch { Log "WinForms load FAIL: $_"; exit }
try { Add-Type -AssemblyName System.Drawing } catch { Log "Drawing load FAIL: $_" }

$apt = [System.Threading.Thread]::CurrentThread.GetApartmentState()
Log "watcher STARTED (apartment=$apt)"

$clipDir = Join-Path $env:USERPROFILE ".claude\clipboard"
if (-not (Test-Path $clipDir)) { New-Item -ItemType Directory -Path $clipDir -Force | Out-Null }
$cfgPath = Join-Path $env:USERPROFILE ".claude\ui-config.json"

while ($true) {
  try {
    if ([System.Windows.Forms.Clipboard]::ContainsImage()) {
      $already = $false
      if ([System.Windows.Forms.Clipboard]::ContainsText()) {
        $t = [System.Windows.Forms.Clipboard]::GetText()
        if ($t -and $t.StartsWith($clipDir)) { $already = $true }
      }
      if (-not $already) {
        Log "new image detected"
        $img = [System.Windows.Forms.Clipboard]::GetImage()
        if ($img) {
          $compress = $true; $maxDim = 1280
          try {
            $cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json
            if ($null -ne $cfg.compressImages) { $compress = [bool]$cfg.compressImages }
            if ($cfg.maxImageDim) { $maxDim = [int]$cfg.maxImageDim }
          } catch { Log "config read fail: $_" }

          $toSave = $img
          $resized = $null
          $longEdge = [math]::Max($img.Width, $img.Height)
          if ($compress -and $longEdge -gt $maxDim) {
            $scale = $maxDim / $longEdge
            $nw = [int]($img.Width * $scale); $nh = [int]($img.Height * $scale)
            $resized = New-Object System.Drawing.Bitmap($nw, $nh)
            $g = [System.Drawing.Graphics]::FromImage($resized)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.DrawImage($img, 0, 0, $nw, $nh)
            $g.Dispose()
            $toSave = $resized
            Log "resized ${($img.Width)}x$($img.Height) -> ${nw}x${nh}"
          }

          $stamp = Get-Date -Format 'HHmmss'
          $rand = [System.IO.Path]::GetRandomFileName().Substring(0, 4)
          $path = Join-Path $clipDir "shot-$stamp-$rand.png"
          $toSave.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

          $do = New-Object System.Windows.Forms.DataObject
          $do.SetImage($img)
          $do.SetText($path)
          [System.Windows.Forms.Clipboard]::SetDataObject($do, $true)
          Log "saved + clipboard set: $path"

          if ($resized) { $resized.Dispose() }
          $img.Dispose()
        } else { Log "GetImage returned null" }
      }
    }
  } catch { Log "loop error: $_" }
  Start-Sleep -Milliseconds 700
}
