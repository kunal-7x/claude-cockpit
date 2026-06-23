# UserPromptSubmit hook: if a NEW image is in the clipboard, auto-save it and
# tell Claude to read it. Runs every message but fast-exits when there's no image.
$ErrorActionPreference = 'SilentlyContinue'
try { $null = [Console]::In.ReadToEnd() } catch {}

$img = $null
try { $img = Get-Clipboard -Format Image } catch {}
if (-not $img) { exit 0 }   # no image -> nothing to do (fast path)

$clipDir = Join-Path $env:USERPROFILE ".claude\clipboard"
$stateFile = Join-Path $clipDir ".lasthash"
try {
  Add-Type -AssemblyName System.Drawing
  if (-not (Test-Path $clipDir)) { New-Item -ItemType Directory -Path $clipDir -Force | Out-Null }
  $ms = New-Object System.IO.MemoryStream
  $img.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $bytes = $ms.ToArray(); $ms.Dispose()

  # Hash so the SAME image isn't attached again on later messages.
  $sha = [System.Security.Cryptography.SHA1]::Create()
  $key = ([System.BitConverter]::ToString($sha.ComputeHash($bytes)) -replace '-', '').Substring(0, 16)
  $last = ''
  if (Test-Path $stateFile) { $last = (Get-Content $stateFile -Raw).Trim() }

  if ($key -ne $last) {
    $path = Join-Path $clipDir "clip-$key.png"
    [System.IO.File]::WriteAllBytes($path, $bytes)
    Set-Content -Path $stateFile -Value $key -NoNewline
    Write-Output "[clipboard image] The user has an image in their clipboard; it was auto-saved to: $path"
    Write-Output "ACTION: Use the Read tool on that exact path now to view the image, then address what the user is asking about it."
  }
} catch {}
exit 0
