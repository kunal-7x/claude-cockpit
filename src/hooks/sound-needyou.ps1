# Notification hook: WAV + spoken alert when Claude needs your input. Logs to sound.log.
$ErrorActionPreference = 'SilentlyContinue'
$log = Join-Path $env:USERPROFILE ".claude\sound.log"
function Log($m) { try { Add-Content -Path $log -Value ("{0}  NEEDYOU {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) -Encoding utf8 } catch {} }
try { $null = [Console]::In.ReadToEnd() } catch {}
Log "Notification hook FIRED"

$wavs = @(
  "$env:WINDIR\Media\Windows Notify System Generic.wav",
  "$env:WINDIR\Media\notify.wav",
  "$env:WINDIR\Media\chimes.wav",
  "$env:WINDIR\Media\ding.wav"
)
foreach ($w in $wavs) {
  if (Test-Path $w) { try { (New-Object System.Media.SoundPlayer $w).PlaySync(); Log "  WAV played"; break } catch { Log "  WAV FAIL: $_" } }
}
try { $v = New-Object -ComObject SAPI.SpVoice; [void]$v.Speak("Claude needs your permission. Please come back."); Log "  SAPI spoke" }
catch { Log "  SAPI FAIL: $_"; try { Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak("Claude needs your permission") } catch {} }
exit 0
