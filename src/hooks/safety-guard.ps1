# SAFETY GUARD — PreToolUse hook for Bash/PowerShell.
# Blocks only clearly CATASTROPHIC commands (even in bypass-permissions mode),
# while staying out of the way of all normal work. Exit 2 = block.
$ErrorActionPreference = 'SilentlyContinue'
try { $raw = [Console]::In.ReadToEnd() } catch { exit 0 }
if (-not $raw) { exit 0 }
try { $j = $raw | ConvertFrom-Json } catch { exit 0 }

$cmd = ''
try { if ($j.tool_input -and $j.tool_input.command) { $cmd = [string]$j.tool_input.command } } catch {}
if (-not $cmd) { exit 0 }
$c = $cmd.ToLower()

function Block($msg) {
  [Console]::Error.WriteLine("[SAFETY GUARD] BLOCKED: $msg. If this is truly intended, the user must run it manually outside Claude.")
  exit 2
}

# Recursive delete of a ROOT or HOME directory (rm -rf /, rm -rf ~, rm -rf c:\)
if ($c -match 'rm\s+-\S*r\S*\s+(/|~|/\*|\$home|c:\\)(\s|$)' -or
    $c -match 'rm\s+-\S*f\S*\s+(/|~|/\*|\$home|c:\\)(\s|$)') {
  Block "recursive delete of a root/home directory"
}
# Windows mass delete of a whole drive root (del /s ... c:\* , rd /s c:\)
if (($c -match '\bdel\b' -or $c -match '\brd\b' -or $c -match '\brmdir\b') -and
    $c -match '/s' -and $c -match '[a-z]:\\(\*|"|\s|$)') {
  Block "mass recursive delete of a drive root"
}
# Remove-Item -Recurse -Force against a protected location
if ($c -match 'remove-item' -and $c -match '-recurse' -and
    ($c -match 'c:\\(\s|$|\*|")' -or $c -match '\$home' -or $c -match '\.claude')) {
  Block "recursive force-delete of a protected location"
}
# Disk format / partitioning
if ($c -match '\bformat\s+[a-z]:' -or $c -match '\bdiskpart\b' -or $c -match '\bmkfs') {
  Block "disk format / partition operation"
}
# Writing straight to a raw disk device
if ($c -match 'dd\s+.*of=/dev/' -or $c -match '>\s*/dev/sd') {
  Block "writing directly to a raw disk device"
}
# Power state changes
if ($c -match '\bshutdown\b' -or $c -match 'stop-computer' -or $c -match 'restart-computer') {
  Block "shutting down or restarting the computer"
}
# Fork bomb
if ($cmd -match ':\(\)\s*\{') { Block "fork bomb" }
# Force-push to main/master
if ($c -match 'git\s+push' -and ($c -match '--force' -or $c -match '\s-f(\s|$)') -and $c -match '(main|master)') {
  Block "force-push to main/master (use a branch + PR instead)"
}
# Deleting the .claude configuration via rm
if ($c -match 'rm\s+-\S*r' -and $c -match '\.claude(\s|/|\\|$)') {
  Block "deleting the .claude configuration"
}

exit 0
