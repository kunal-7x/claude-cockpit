# Architecture

This document describes how Claude Cockpit is built and how its parts fit together.

---

## Directory Layout

```
claude-cockpit/               # the repo (cloned to ~/.cockpit at install time)
├── bin/
│   ├── install.js            # idempotent installer — copies files into ~/.claude
│   └── update.js             # 'cockpit update' entry point
├── src/
│   ├── statusline/           # live status line (cross-platform Node)
│   ├── sounds/               # chime on Claude turn-end (Windows)
│   ├── voice/                # TTS hooks (Windows)
│   ├── clipboardImage/       # Ctrl+V image paste watcher (Windows)
│   ├── banner/               # rebrandable welcome banner (Windows)
│   ├── terminalTheme/        # Windows Terminal color scheme + fragment
│   ├── fileBrowser/          # yazi + micro configs
│   ├── commands/             # 18 slash commands (.md files)
│   ├── agents/               # explainer subagent
│   ├── outputStyles/         # Founder Mode output style
│   └── safetyGuard/          # PreToolUse catastrophic-command blocker
├── docs/                     # documentation (this file lives here)
├── config.example.json       # template — copied to ~/.claude/cockpit.config.json
├── install.ps1               # Windows one-liner bootstrap
├── install.sh                # Mac/Linux one-liner bootstrap
└── .gitignore                # blocks env/pat/key/token/settings.json from commits
```

---

## Two Directories: `~/.cockpit` vs `~/.claude`

| Directory | Role |
|---|---|
| `~/.cockpit` | The repo clone. Contains source files, installer, docs, and git history. Updated by `git pull` on `cockpit update`. Never directly used by Claude Code. |
| `~/.claude` | Claude Code's config directory. The only directory Claude Code reads. Cockpit copies its enabled components here. Overridable with the `CLAUDE_CONFIG_DIR` environment variable. |

This separation means the repo can be updated freely without risk of corrupting Claude Code's live config. The installer is always the bridge between the two.

---

## `bin/install.js` — The Installer

`install.js` is the core of Cockpit. It runs at initial install and again on every `cockpit update`. It is fully idempotent.

### Feature-Gated Copying

The installer reads `~/.claude/cockpit.config.json` (or `config.example.json` on first run) and checks the `features` object. Each feature maps to a directory under `src/`. If a feature is `true`, its files are copied into `~/.claude`; if `false`, any previously installed files for that feature are removed.

```
features.statusline  → src/statusline/   → ~/.claude/statusline/
features.commands    → src/commands/     → ~/.claude/commands/
features.safetyGuard → src/safetyGuard/  → ~/.claude/hooks/
...
```

This means enabling or disabling a feature is a single boolean change in `cockpit.config.json` followed by `cockpit update`.

### `{{TOKEN}}` Substitution

Some source files contain placeholder tokens that the installer replaces with the user's brand values before copying:

| Token | Replaced with |
|---|---|
| `{{BRAND}}` | `brand.name` from `cockpit.config.json` |
| `{{COMPANY}}` | `brand.company` from `cockpit.config.json` |

This allows the banner, welcome text, and other user-visible strings to reflect a custom brand name without modifying source files.

### `settings.json` Safe-Merge

Claude Code's `~/.claude/settings.json` holds API tokens, model preferences, and existing hooks. Cockpit must add its own entries without destroying any of these.

The safe-merge algorithm:

1. Read the existing `settings.json` (if present)
2. Write a backup to `settings.json.cockpit-backup` (overwrites any previous backup)
3. Parse both the existing file and Cockpit's additions as JSON objects
4. Deep-merge: Cockpit's keys are written in; all other keys are left exactly as they were
5. Write the merged result back to `settings.json`

Keys Cockpit manages: the status line configuration block, and the hook entries for each enabled feature (e.g. the `safetyGuard` PreToolUse hook, the `sounds` PostToolUse hook). All other keys — including API tokens, the active model, and any user-added hooks — are untouched.

### Windows Terminal Fragment Merge

If `features.terminalTheme` is enabled, the installer also writes a JSON fragment into Windows Terminal's `fragments` directory. This adds the "Cockpit Night" color scheme and profile without modifying the user's `settings.json` for Windows Terminal (which would risk breaking their existing profiles). The installer writes a backup of the fragment file before any modification.

---

## `bin/update.js` — The Update Command

`cockpit update` runs `update.js`, which:

1. `cd`s into `~/.cockpit`
2. Runs `git pull origin main`
3. Calls `bin/install.js` (the same idempotent installer used at first install)

The result is: new source files arrive via git, then the installer propagates only the enabled ones into `~/.claude`, re-applying token substitution and safe-merging `settings.json`. The user's config and secrets are untouched throughout.

---

## Config Flow

```
config.example.json          (repo — template, committed)
        │
        │  copied on first install (never overwritten after)
        ▼
~/.claude/cockpit.config.json  (user's live config — survives all updates)
        │
        │  read by bin/install.js on every install/update
        ▼
  feature flags → which src/ dirs get copied into ~/.claude
  brand values  → {{TOKEN}} substitution in copied files
  statusline{}  → copied into the status line component config
```

Users edit `~/.claude/cockpit.config.json` to change features or branding. They then run `cockpit update` (or `cockpit configure` for an interactive flow) to apply the change.

---

## `src/` Component Layout

Each subdirectory under `src/` is a self-contained component. A component typically contains:

- The runtime file(s) that get copied into `~/.claude` (hooks, slash command `.md` files, Node scripts)
- A `manifest.json` (read by the installer) listing which files to copy and where
- Optionally, a `README.md` with component-specific notes

Components do not import each other at runtime. The only shared runtime dependency is Node.js >= 16, used by the status line and the installer itself.

### Cross-Platform Components

The following components work on Windows, macOS, and Linux:

- `statusline` — pure Node.js, no platform APIs
- `commands` — plain Markdown slash command files
- `agents` — plain Markdown subagent files
- `outputStyles` — plain Markdown style files
- `safetyGuard` — Node.js hook script

### Windows-Only Components

- `sounds` — uses Windows TTS / audio APIs
- `voice` — uses Windows built-in TTS
- `clipboardImage` — uses Windows clipboard APIs + a background watcher process + a login auto-start registry entry
- `banner` — PowerShell terminal banner
- `terminalTheme` — Windows Terminal JSON fragment
- `fileBrowser` — yazi + micro config files (cross-platform tools, but the integration is currently Windows-focused)

Full macOS/Linux support for the Windows-only components is on the roadmap.

---

## Security Model

- **Zero telemetry.** No analytics, no phone-home, no tracking. The only outbound network call Cockpit ever makes is `git pull` during `cockpit update`.
- **Secrets never leave the machine.** `settings.json` (which contains API keys) is in `.gitignore`. The repo ships `config.example.json`, never a real config with credentials.
- **Auditable install scripts.** `install.ps1` and `install.sh` are short bootstrap scripts. Users can read them before piping to a shell, or clone the repo and run `node bin/install.js` directly.
- **Non-destructive by design.** The installer backs up `settings.json` before touching it, and the safe-merge never removes keys it did not add. `cockpit uninstall` restores the backup.
