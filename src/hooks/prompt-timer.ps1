# UserPromptSubmit hook: silently record when the user sent a message,
# so the Stop hook can tell a quick reply from a long task.
# MUST print nothing to stdout (UserPromptSubmit stdout is added to context).
$ErrorActionPreference = 'SilentlyContinue'
$sid = 'default'
try {
  $raw = [Console]::In.ReadToEnd()
  $j = $raw | ConvertFrom-Json
  if ($j.session_id) { $sid = $j.session_id }
} catch {}
try {
  $f = Join-Path $env:USERPROFILE ".claude\.timer-$sid"
  Set-Content -Path $f -Value ([DateTime]::UtcNow.Ticks) -Encoding ascii -NoNewline
} catch {}
exit 0
