# Stop hook: quick reply = WAV ping; long task = ping + spoken summary.
# Logs every invocation to sound.log so we can verify it actually fires.
$ErrorActionPreference = 'SilentlyContinue'
$log = Join-Path $env:USERPROFILE ".claude\sound.log"
$LOG_MAX_BYTES = 256KB
function Log($m) {
  try {
    if ((Test-Path $log) -and (Get-Item $log).Length -gt $LOG_MAX_BYTES) {
      $tail = Get-Content $log -Tail 50 -Encoding utf8 -ErrorAction SilentlyContinue
      $header = "# log trimmed $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') (exceeded 256 KB)"
      ($header + "`n" + ($tail -join "`n")) | Set-Content $log -Encoding utf8 -ErrorAction SilentlyContinue
    }
    Add-Content -Path $log -Value ("{0}  {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) -Encoding utf8
  } catch {}
}

$sid = 'default'; $transcript = $null
try {
  $raw = [Console]::In.ReadToEnd()
  $j = $raw | ConvertFrom-Json
  if ($j.session_id) { $sid = $j.session_id }
  $transcript = $j.transcript_path
} catch {}

Log "Stop hook FIRED (sid=$sid)"

$elapsed = 0.0
try {
  $f = Join-Path $env:USERPROFILE ".claude\.timer-$sid"
  if (Test-Path $f) { $start = [long]((Get-Content $f -Raw).Trim()); $elapsed = ([DateTime]::UtcNow.Ticks - $start) / 10000000.0 }
} catch {}

function Play-Wav {
  $wavs = @(
    "$env:WINDIR\Media\Windows Notify System Generic.wav",
    "$env:WINDIR\Media\notify.wav",
    "$env:WINDIR\Media\chimes.wav",
    "$env:WINDIR\Media\ding.wav"
  )
  foreach ($w in $wavs) {
    if (Test-Path $w) { try { (New-Object System.Media.SoundPlayer $w).PlaySync(); Log "  WAV played ($w)"; return $true } catch { Log "  WAV FAIL: $_" } }
  }
  return $false
}
function Speak($t) {
  try { $v = New-Object -ComObject SAPI.SpVoice; [void]$v.Speak($t); Log "  SAPI spoke"; return $true } catch { Log "  SAPI FAIL: $_" }
  try { Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Speak($t); Log "  SystemSpeech spoke"; return $true } catch { Log "  SystemSpeech FAIL: $_" }
  return $false
}

$THRESHOLD = 60
if ($elapsed -lt $THRESHOLD) {
  Log "  quick path (elapsed=$([math]::Round($elapsed))s)"
  if (-not (Play-Wav)) { try { [console]::beep(880, 200); Log "  beep fallback" } catch { Log "  beep FAIL" } }
  exit 0
}

Log "  big path (elapsed=$([math]::Round($elapsed))s)"
$say = "All done. Come take a look."
try {
  if ($transcript -and (Test-Path $transcript)) {
    $lines = Get-Content $transcript -Tail 80 -Encoding UTF8
    for ($i = $lines.Count - 1; $i -ge 0; $i--) {
      try {
        $o = $lines[$i] | ConvertFrom-Json
        if ($o.type -eq 'assistant' -and $o.message.content) {
          $txt = ($o.message.content | Where-Object { $_.type -eq 'text' } | ForEach-Object { $_.text }) -join ' '
          if ($txt) { $txt = ($txt -replace '[^\x20-\x7E]', ' ' -replace '\s+', ' ').Trim(); if ($txt.Length -gt 160) { $txt = $txt.Substring(0, 160) }; if ($txt) { $say = $txt }; break }
        }
      } catch {}
    }
  }
} catch {}
Play-Wav | Out-Null
Speak $say | Out-Null
exit 0
