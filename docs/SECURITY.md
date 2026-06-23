# Security & Privacy — Claude Cockpit

This document is the authoritative reference for how Claude Cockpit interacts with your system, your data, and the network. Read it before installing, especially if you manage a team machine or a regulated environment.

---

## Table of Contents

1. [What the installer reads and writes](#1-what-the-installer-reads-and-writes)
2. [The safe-merge guarantee](#2-the-safe-merge-guarantee)
3. [Zero telemetry](#3-zero-telemetry)
4. [Network access — exactly one call](#4-network-access--exactly-one-call)
5. [The curl|bash / irm|iex consideration](#5-the-curlbash--irmiex-consideration)
6. [How to audit the code](#6-how-to-audit-the-code)
7. [What each hook does](#7-what-each-hook-does)
8. [Secrets and the `.gitignore` boundary](#8-secrets-and-the-gitignore-boundary)
9. [Branding and third-party code](#9-branding-and-third-party-code)
10. [Platform surface area](#10-platform-surface-area)

---

## 1. What the installer reads and writes

### Reads

| Path | Why |
|------|-----|
| `~/.claude/settings.json` | Inspected to detect existing hooks and status-line config before merging |
| `~/.claude/cockpit.config.json` | Your feature selections and brand config (created on first run if absent) |
| `%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_*\LocalState\settings.json` | Read only when `terminalTheme` feature is enabled — to discover existing profiles before merging |

### Writes (first install)

| Path | What is written |
|------|----------------|
| `~/.cockpit/` | Full clone of this repo (source of truth for all cockpit files) |
| `~/.claude/cockpit.config.json` | Copied from `config.example.json`; you edit this to configure cockpit |
| `~/.claude/settings.json` | **Safe-merged** (see §2) — never replaced wholesale. Note: the `statusLine` key is always (re)set on install/update to stay in sync with your cockpit config; if you had your own `statusLine` block it is replaced. Your original is preserved in the `.cockpit-backup`. |
| `~/.claude/settings.json.cockpit-backup` | Verbatim snapshot of your settings.json taken immediately before the first merge (overwritten once per install/update — restore this file to undo any merge) |
| `~/.claude/statusline.js` | Status line renderer script |
| `~/.claude/ui-config.json` | Status line display config |
| `~/.claude/hooks/*.ps1` | Individual hook files (one per enabled Windows feature; see §7) |
| `~/.claude/claude-launch.ps1` | Claude Code launch wrapper (Windows) |
| `~/.claude/commands/` | The 20 slash-command `.md` files (only if `commands` feature is enabled) |
| `~/.claude/branding/logo.txt` | Default ASCII logo (only if `banner` feature is enabled; replace freely) |
| `~/.claude/agents/explainer.md` | Explainer subagent definition (only if `agents` feature is enabled) |
| `~/.claude/output-styles/` | Output style files (only if `outputStyles` feature is enabled) |
| `~/.config/micro/settings.json` | micro editor config (only if `fileBrowser` is enabled; existing file backed up to `*.cockpit-backup` first) |
| `%APPDATA%\yazi\config\yazi.toml` (Windows) or `~/.config/yazi/yazi.toml` (macOS/Linux) | yazi file browser config (only if `fileBrowser` is enabled; existing file backed up to `*.cockpit-backup` first) |
| Windows Terminal `settings.json` | Cockpit Night color scheme + profile entry + `Ctrl+Shift+E` keybinding added (only if `terminalTheme` is enabled; backed up to `.cockpit-backup` first; your default profile is not changed) |
| `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\cockpit-clip-watch.vbs` | VBScript auto-start entry for the clipboard image watcher (only if `clipboardImage` is enabled; this is a Startup folder entry, **not** a registry `Run` key) |

**PATH:** The bootstrap (`install.ps1`) appends `~/.cockpit` to the per-user `PATH` environment variable so the `cockpit` command is available globally. This is a one-time, persistent change to your user PATH.

**Logs:** Hooks may write small log files under `~/.claude/` (e.g. `sound.log`). Clipboard images captured by the watcher are saved under `~/.claude/clipboard/` and are automatically pruned after 7 days.

### Writes (subsequent `cockpit update`)

`cockpit update` runs a `git pull` inside `~/.cockpit/`, then re-runs `bin/install.js` with your existing `cockpit.config.json`. Only cockpit-owned files are touched. Your config and your Claude API tokens are never modified. Hook registrations are added idempotently — pre-existing identical hooks are not duplicated.

### What the installer never touches

- Your Claude API key or any environment variable holding a secret
- Your `CLAUDE.md` file (cockpit does **not** append to it)
- Any file outside `~/.claude/`, `~/.cockpit/`, Windows Terminal settings, the Startup folder entry, micro/yazi config dirs, and the per-user PATH listed above

---

## 2. The safe-merge guarantee

`settings.json` is the most sensitive file Claude Code owns. Claude Cockpit **never overwrites it**. The merge algorithm:

1. Read the current file and parse it as JSON.
2. Take a verbatim backup to `settings.json.cockpit-backup`.
3. For every key cockpit needs to add or update (status line hook, safety guard hook, etc.), check whether the key already exists.
   - If it exists and is identical — no-op.
   - If it exists and differs — cockpit's value is applied; the old value is recorded in the backup so you can diff and restore.
   - If it does not exist — the key is inserted.
4. All keys cockpit did not touch are left byte-for-byte unchanged.
5. The merged file is written atomically (temp file + rename).

`cockpit uninstall` reads the backup and restores it, then removes all cockpit-owned files.

**Audit the merge yourself:** the function is `mergeSettings()` in `bin/install.js`. It is intentionally short and commented. To preview all planned writes without making any changes, run:

```bash
node bin/install.js --dry-run
```

This prints every file that would be written and exits without modifying anything.

---

## 3. Zero telemetry

Claude Cockpit contains **no analytics, no telemetry, no crash reporting, and no usage tracking** of any kind.

- No HTTP calls are made from hooks, status-line scripts, slash commands, or the installer — except the single `git pull` during `cockpit update` (see §4).
- No data is sent to the maintainer, to Anthropic, or to any third party.
- There are no pixels, beacons, or fingerprinting techniques anywhere in the codebase.
- The status-line reads token counts from Claude Code's own process environment — it does not transmit them anywhere.

You can verify this with a simple search:

```bash
# Clone the repo, then:
grep -r "fetch\|axios\|http\|https\|XMLHttpRequest\|curl\|Invoke-WebRequest\|Invoke-RestMethod" ~/.cockpit/bin ~/.cockpit/hooks ~/.cockpit/commands
```

The only hits you will find are in `install.sh` / `install.ps1` (the bootstrap that clones the repo once) and in `cockpit update` (the git pull).

---

## 4. Network access — exactly one call

**Normal operation (no update running):** zero network calls. The status line, all hooks, all slash commands, and the clipboard watcher run entirely offline.

**`cockpit update` (explicitly user-initiated):**

| Call | To | What it does |
|------|----|-------------|
| `git pull` | `github.com/kunal-7x/claude-cockpit` | Fetches the latest commits over HTTPS. No authentication; public repo. |

That is the complete list. No other outbound connections are made at any time. In particular, `cockpit configure` makes **no network calls** — it is a local interactive menu that edits `cockpit.config.json` only.

If you run Claude Cockpit in an air-gapped or locked-down environment, simply never run `cockpit update` and disable outbound HTTPS to GitHub — everything else continues to work from the local `~/.cockpit/` clone.

---

## 5. The curl|bash / irm|iex consideration

The one-line installers are:

```
# Windows
irm https://raw.githubusercontent.com/kunal-7x/claude-cockpit/main/install.ps1 | iex

# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/kunal-7x/claude-cockpit/main/install.sh | bash
```

Piping a script from the internet directly into a shell is convenient but transfers implicit trust to the remote server. Here is an honest assessment and the safer alternatives.

### What the risk actually is

| Threat | Reality for this project |
|--------|--------------------------|
| **Script is tampered in transit** | The download is over HTTPS (TLS). A man-in-the-middle that can break GitHub's TLS can do far worse things to you. Low risk in practice. |
| **GitHub account is compromised** | If the maintainer's GitHub account or the repo is taken over, a malicious script could be pushed. This is the real residual risk with any curl\|bash pattern. |
| **Script does unexpected things** | `install.ps1` and `install.sh` are short and auditable (see §6). They do exactly two things: install dependencies (Node check) and clone the repo, then hand off to `bin/install.js`. |

### Safer alternatives (no trust required)

**Option A — Read the script first, then decide:**

```powershell
# Windows: download and inspect before running
irm https://raw.githubusercontent.com/kunal-7x/claude-cockpit/main/install.ps1 | Out-File install.ps1
notepad install.ps1   # read it
.\install.ps1         # run it only if satisfied
```

```bash
# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/kunal-7x/claude-cockpit/main/install.sh -o install.sh
less install.sh       # read it
bash install.sh       # run it only if satisfied
```

**Option B — Clone and run manually (most auditable):**

```bash
git clone https://github.com/kunal-7x/claude-cockpit.git ~/.cockpit
cd ~/.cockpit
node bin/install.js
```

This gives you the full source tree before any code runs. You can inspect every file at leisure, then run the installer yourself.

**Option C — Pin to a specific commit (reproducible, tamper-evident):**

```powershell
# Replace <SHA> with the commit hash you have reviewed
irm https://raw.githubusercontent.com/kunal-7x/claude-cockpit/<SHA>/install.ps1 | iex
```

Commit SHAs are immutable on GitHub — if the file at that SHA changes, the SHA changes.

---

## 6. How to audit the code

The codebase is small by design. A thorough audit takes under an hour.

### Key files to read

| File | What it does |
|------|-------------|
| `install.ps1` | Windows bootstrap: checks Node, clones repo, runs `node bin/install.js` |
| `install.sh` | macOS/Linux bootstrap: same, using bash |
| `bin/install.js` | Main installer: reads `cockpit.config.json`, safe-merges `settings.json`, copies hooks/commands/agents into `~/.claude/` |
| `hooks/safetyGuard.ps1` | PreToolUse hook — the only hook that intercepts tool calls |
| `hooks/statusLine.js` | PostToolUse / Stop hook — reads token counts, renders the status line |
| `hooks/sounds.ps1` | Stop hook — plays a system chime |
| `hooks/voice.ps1` | Stop hook + PromptForInput hook — calls Windows TTS |
| `hooks/clipboardWatcher.ps1` | Background process — polls clipboard for images |
| `config.example.json` | The config schema with all defaults |

### Audit approach

1. Clone the repo: `git clone https://github.com/kunal-7x/claude-cockpit.git`
2. Read `install.ps1` / `install.sh` — confirm they only install Node and clone the repo.
3. Read `bin/install.js` — confirm `mergeSettings()` and the file copy list.
4. Read each hook file — confirm no network calls, no data exfiltration.
5. Run `grep -r "http\|fetch\|curl\|Invoke-Web" .` to spot any outbound calls.
6. Run the installer in dry-run mode to preview all planned writes before any change is made: `node bin/install.js --dry-run`

---

## 7. What each hook does

Claude Code hooks are scripts that run at defined points in Claude's turn lifecycle. Every cockpit hook is a separate file in `~/.claude/hooks/`. Here is exactly what each one does.

### `statusLine.js` — Stop + PostToolUse hook

**Trigger:** runs after every Claude turn ends and after every tool call.

**What it does:**
- Reads `CLAUDE_CONTEXT_TOKENS`, `CLAUDE_MAX_TOKENS`, and related environment variables that Claude Code injects into hook processes.
- Computes usage bars, session timer, and edit counts from those values.
- Writes a single formatted line to stdout (which Claude Code displays in the terminal status area).
- Makes **no system calls, no file writes, no network calls**.

**Data touched:** read-only access to environment variables provided by Claude Code. Nothing is stored.

### `safetyGuard.ps1` — PreToolUse hook

**Trigger:** runs before every tool call Claude attempts.

**What it does:**
- Reads the `CLAUDE_TOOL_NAME` and `CLAUDE_TOOL_INPUT` environment variables.
- Checks the proposed command against a blocklist of catastrophic patterns: `rm -rf /`, force-push to `main`, disk format commands, deletion of `~/.claude`, system shutdown/reboot, and similar irreversible operations.
- If a match is found: prints a warning and exits with code 1, which causes Claude Code to abort the tool call and surface the reason to the user.
- If no match: exits with code 0 and the tool call proceeds normally.

**Data touched:** read-only inspection of tool input strings. Nothing is logged, stored, or transmitted.

### `sounds.ps1` — Stop hook

**Trigger:** runs after every Claude turn ends (Windows only).

**What it does:** calls `[System.Media.SystemSounds]::Asterisk.Play()` — a built-in Windows system sound. No audio files are downloaded or created.

### `voice.ps1` — Stop hook + PromptForInput hook

**Trigger:** Stop (after Claude's turn) and PromptForInput (when Claude requests permission).

**What it does:**
- Stop: reads the **tail of the Claude transcript file** (the path is provided by Claude Code in the hook's stdin JSON) to extract the last assistant message, then passes it to the Windows `System.Speech.Synthesis.SpeechSynthesizer` COM object (built-in, no install required).
- PromptForInput: speaks a fixed string: "Claude needs your permission."

**Data touched:** reads a local Claude transcript file (path provided by Claude Code). No data is stored or transmitted.

### `clipboardWatcher.ps1` — Background process (autostart)

**Trigger:** started at Windows login via a VBScript file placed in the Windows Startup folder (`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\cockpit-clip-watch.vbs`). This is **not** a registry `Run` key.

**What it does:**
- Polls the Windows clipboard every 500 ms for image content.
- When an image is detected: saves it to `~/.claude/clipboard/`, downscales it if it exceeds the token-budget threshold (to reduce input tokens), and writes the file path to a well-known location that Claude Code reads when you paste in the terminal.
- The watcher process runs entirely locally. No images leave your machine.

**Data touched:** clipboard image data (local only). Image files are saved under `~/.claude/clipboard/` and are automatically pruned after **7 days**.

### Banner hook — SessionStart hook

**Trigger:** runs when a new Claude Code session starts.

**What it does:** prints the ASCII logo from `~/.claude/branding/logo.txt` to stdout. No logic, no data access.

---

## 8. Secrets and the `.gitignore` boundary

The repo's `.gitignore` is configured to prevent accidental secret commits:

```
# Never committed
.env
*.env
settings.json
**/settings.json
*.pat
*.key
*.token
*secret*
*credential*
```

`config.example.json` is committed (it contains no real values). Your actual `~/.claude/cockpit.config.json` and your `~/.claude/settings.json` (which may hold your Claude API key) live outside the repo and are never committed.

If you fork this repo and customize it, be careful not to copy your real `settings.json` or `.env` files into the fork.

---

## 9. Branding and third-party code

Claude Cockpit contains no third-party JavaScript dependencies in the critical install path (`bin/install.js` uses only Node.js built-ins). The status-line script (`hooks/statusLine.js`) also uses only built-ins.

The only external runtime dependency is **Node.js >= 16**, which you install separately. The cockpit installer does not download or bundle Node.

---

## 10. Platform surface area

| Feature | Platform | Extra surface |
|---------|----------|--------------|
| Status line | Cross-platform | None — Node built-ins only |
| Slash commands | Cross-platform | None — Markdown files |
| Agents | Cross-platform | None — Markdown files |
| Sounds | Windows only | Windows system sound API (built-in) |
| Voice | Windows only | Windows Speech API (built-in) + local transcript file read |
| Clipboard image | Windows only | Clipboard API + `~/.claude/clipboard/` writes (pruned after 7 days) + Startup folder VBS entry |
| Banner | Windows only | File read (logo.txt) |
| Terminal theme | Windows only | Windows Terminal settings.json write |
| Safety guard | Windows only | PowerShell hook — best-effort blocker, not a hard security boundary |

Features not listed for your platform are simply not installed — the installer checks `process.platform` and skips them silently.

---

*Last updated: 2026-06-23. Questions or concerns? See [SECURITY.md](../SECURITY.md) in the repo root to report a vulnerability privately.*
