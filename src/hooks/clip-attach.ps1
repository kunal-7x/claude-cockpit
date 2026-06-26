# UserPromptSubmit hook — attach a clipboard image ONLY when the user actually pasted it.
# clip-watch saves each new clipboard image and puts its file PATH on the clipboard, so pressing
# Ctrl+V drops that path into the prompt. We attach an image ONLY when such a path is present in the
# submitted prompt. We do NOT read the clipboard here — doing that made screenshots auto-attach to
# every message (and every other open session) with no paste at all.
$ErrorActionPreference = 'SilentlyContinue'
$raw = ''
try { $raw = [Console]::In.ReadToEnd() } catch {}

# Pull the prompt text from the hook's stdin JSON (fall back to the raw text).
$prompt = ''
try { $j = $raw | ConvertFrom-Json; if ($j.prompt) { $prompt = [string]$j.prompt } } catch {}
if (-not $prompt) { $prompt = $raw }
if (-not $prompt) { exit 0 }

# Only clip-watch produces these paths; their presence in the prompt means an explicit Ctrl+V paste.
$clipDir = Join-Path $env:USERPROFILE ".claude\clipboard"
$pattern = [Regex]::Escape($clipDir) + '[\\/][^\s"'']+\.png'
$found = [Regex]::Matches($prompt, $pattern)
if ($found.Count -eq 0) { exit 0 }   # nothing pasted -> do nothing (no auto-attach)

$seen = @{}
foreach ($m in $found) {
  $p = $m.Value
  if ($seen.ContainsKey($p)) { continue }
  $seen[$p] = $true
  if (Test-Path $p) {
    Write-Output "[pasted image] The user pasted an image. Read it now with the Read tool at this exact path: $p"
  }
}
exit 0
