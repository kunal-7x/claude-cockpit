# Clipboard image watcher (with logging).
# On a new clipboard image: optionally DOWNSCALE its resolution (the real token
# saver — Claude bills by pixels), save a PNG, and put the file PATH on the
# clipboard alongside the image. Compression controlled by ui-config.json.
$ErrorActionPreference = 'SilentlyContinue'
$log = Join-Path $env:USERPROFILE ".claude\clip-watch.log"
$LOG_MAX_BYTES = 256KB
function Log($m) {
  try {
    # Cap log at ~256 KB — trim to last 50 lines before appending
    if ((Test-Path $log) -and (Get-Item $log).Length -gt $LOG_MAX_BYTES) {
      $tail = Get-Content $log -Tail 50 -Encoding utf8 -ErrorAction SilentlyContinue
      $header = "# log trimmed $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') (exceeded 256 KB)"
      ($header + "`n" + ($tail -join "`n")) | Set-Content $log -Encoding utf8 -ErrorAction SilentlyContinue
    }
    Add-Content -Path $log -Value ("{0}  {1}" -f (Get-Date -Format 'HH:mm:ss'), $m) -Encoding utf8
  } catch {}
}

$mutex = New-Object System.Threading.Mutex($false, "ClaudeCockpitClipWatch")
if (-not $mutex.WaitOne(0)) { Log "another instance running - exit"; exit }

# Stop-flag path — cockpit uninstall drops this file to signal a clean exit
$stopFlag = Join-Path $env:USERPROFILE ".claude\.cockpit-clip-stop"

try { Add-Type -AssemblyName System.Windows.Forms } catch { Log "WinForms load FAIL: $_"; exit }
try { Add-Type -AssemblyName System.Drawing } catch { Log "Drawing load FAIL: $_" }

$apt = [System.Threading.Thread]::CurrentThread.GetApartmentState()
Log "watcher STARTED (apartment=$apt)"

$clipDir = Join-Path $env:USERPROFILE ".claude\clipboard"
if (-not (Test-Path $clipDir)) { New-Item -ItemType Directory -Path $clipDir -Force | Out-Null }
$cfgPath = Join-Path $env:USERPROFILE ".claude\ui-config.json"

# Retention: track when we last ran cleanup (~hourly)
$lastCleanup = [DateTime]::MinValue

while ($true) {
  # --- STOP FLAG CHECK ---
  try {
    if (Test-Path $stopFlag) {
      Remove-Item $stopFlag -Force -ErrorAction SilentlyContinue
      Log "stop flag detected — exiting cleanly"
      break
    }
  } catch {}

  # --- RETENTION: delete PNGs older than 7 days, at most once per hour ---
  try {
    if (([DateTime]::UtcNow - $lastCleanup).TotalHours -ge 1) {
      $cutoff = (Get-Date).AddDays(-7)
      Get-ChildItem -Path $clipDir -Filter '*.png' -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -lt $cutoff } |
        ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue; Log "purged old file: $($_.Name)" }
      $lastCleanup = [DateTime]::UtcNow
    }
  } catch { Log "retention cleanup error: $_" }

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

# Release the mutex so a fresh instance can start immediately after a clean stop
try { $mutex.ReleaseMutex() } catch {}
Log "watcher STOPPED"
