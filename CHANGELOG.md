# Changelog

All notable changes to Claude Cockpit are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Full macOS/Linux port for the Windows-only features (sounds, voice, clipboardImage, banner, terminalTheme)
- `cockpit doctor` command — health check reporting Node version, settings.json status, hook integrity, and status line configuration
- Additional slash commands based on community feedback
- `cockpit configure` interactive wizard for feature selection and branding setup
- Homebrew formula and WinGet manifest for bootstrap without curl/irm

---

## [0.1.0] — 2025-07-01 — Initial public release

First public release of Claude Cockpit. Installs via a single `irm | iex` (Windows) or `curl | bash` (Mac/Linux) command. The installer clones the repo to `~/.cockpit`, copies enabled components into `~/.claude`, and safe-merges into your existing `settings.json` without touching your API tokens or existing hooks.

### Added

#### Core installer
- `bin/install.js` — zero-dependency Node.js installer; reads `cockpit.config.json`, copies only enabled feature directories into `~/.claude` (or `CLAUDE_CONFIG_DIR`), and performs a safe-merge of `settings.json` (backs up to `settings.json.cockpit-backup` before writing)
- `install.ps1` — Windows bootstrap: clones repo to `~/.cockpit`, calls `node bin/install.js`
- `install.sh` — Mac/Linux bootstrap: equivalent shell script
- `config.example.json` — full config template with all feature flags, brand fields, and status line options; copied to `~/.claude/cockpit.config.json` on first install and never overwritten on update
- `cockpit update` CLI command — `git pull` + idempotent reinstall; user config and secrets are untouched
- `cockpit uninstall` CLI command — removes cockpit files and restores `settings.json` from backup
- `COCKPIT_SANDBOX=1` env var — redirects install to `CLAUDE_CONFIG_DIR` for safe testing without touching `~/.claude`

#### Feature 1 — Status line (`statusline`)
- Live one-line status bar showing real context tokens vs your actual window size (e.g. `239k / 1M`), 5-hour and weekly usage limits with battery-bar visualization, lines-edited counter (`+/-`), session timer, and live ticking clock
- Turns red with a warning label when approaching the ~84% auto-compact threshold so compaction never arrives as a surprise
- Crash-safe: falls back to a minimal display rather than rendering blank
- Cross-platform (Node.js); configurable via `statusline{}` block in `cockpit.config.json`

#### Feature 2 — Sounds (`sounds`)
- Plays a subtle chime when Claude finishes a turn (Windows)

#### Feature 3 — Voice (`voice`)
- Reads Claude's last message aloud via built-in Windows TTS
- Announces "Claude needs your permission" on tool-use permission prompts (Windows)

#### Feature 4 — Clipboard image paste (`clipboardImage`)
- Take a screenshot, press Ctrl+V; the image is pasted inline into your Claude Code message and Claude sees it
- Auto-downscales images to reduce input token cost
- Runs a small background watcher; adds a login auto-start entry so it is available in every session (Windows)

#### Feature 5 — Banner (`banner`)
- Displays a rebrandable ASCII welcome banner (your logo + name) when a terminal opens
- Brand name and logo controlled via `brand{}` config and `~/.claude/branding/logo.txt` (Windows)

#### Feature 6 — Terminal theme (`terminalTheme`)
- Installs the "Cockpit Night" neon color scheme and a matching Windows Terminal profile
- Adds Ctrl+Shift+E shortcut to split the terminal pane into a file browser
- Safe-merges into Windows Terminal `settings.json`; writes a backup; never changes your default profile (Windows)

#### Feature 7 — File browser (`fileBrowser`)
- Config files for the `yazi` terminal file manager and `micro` editor, enabling in-terminal file browsing and editing
- Requires `yazi` and `micro` to be installed separately (see `docs/file-browser.md`)

#### Feature 8 — Slash commands (`commands`)
- 18 slash commands available inside Claude Code: `/ui`, `/powers`, `/files`, `/find`, `/open`, `/fix`, `/ship`, `/deploy`, `/build`, `/brief`, `/save`, `/standup`, `/spend`, `/health`, `/unstuck`, `/eli5`, `/normal`, `/paste`, `/dashboard`
- Cross-platform

#### Feature 9 — Agents (`agents`)
- An `explainer` subagent that explains code and error messages in plain English
- Cross-platform

#### Feature 10 — Output styles (`outputStyles`)
- "Founder Mode" output style for concise, high-signal responses

#### Feature 11 — Safety guard (`safetyGuard`)
- `PreToolUse` hook that blocks catastrophic commands before they execute: `rm -rf /`, force-push to `main`, disk format commands, deletion of the Claude config directory, system shutdown, and similar irreversible operations
- Cross-platform

### Security
- Zero telemetry: no network calls are made except during `cockpit update` (a `git pull`)
- `.gitignore` blocks env files, key/token files, and `settings.json` to prevent accidental secret commits
- The repo ships `config.example.json`, never a real `settings.json`
- One-line bootstrap scripts are short and auditable; users can inspect them or clone the repo and run `node bin/install.js` manually

---

[Unreleased]: https://github.com/kunal-7x/claude-cockpit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kunal-7x/claude-cockpit/releases/tag/v0.1.0
