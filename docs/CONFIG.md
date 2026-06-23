# cockpit.config.json — Full Reference

Your editable config lives at `~/.claude/cockpit.config.json` and **survives every `cockpit update`**. The installer never overwrites it. A canonical starting point ships with the repo at `config.example.json`.

---

## Top-level structure

```json
{
  "brand": { ... },
  "features": { ... },
  "statusline": { ... }
}
```

---

## `brand` — Identity & branding

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `name` | `string` | `"Claude Cockpit"` | Your brand name. Rendered in the welcome banner, slash-command headers, and anywhere `{{BRAND}}` appears in installed templates. |
| `tagline` | `string` | `"Power-suite for Claude Code"` | One-line subtitle shown beneath the logo in the banner. |
| `logoFile` | `string` | `"~/.claude/branding/logo.txt"` | Path to a plain-text ASCII/ANSI art file used as the banner logo. Replace this file to fully rebrand the visual. |
| `company` | `string` | `""` | Your company or team name. Substituted for `{{COMPANY}}` in templates. Optional — leave blank if not needed. |
| `showCompanyCredit` | `boolean` | `true` | When `true`, shows a small "Powered by Claude Cockpit" line in the banner. Set to `false` to remove it for a clean white-label look. |

---

## `features` — Enable / disable components

All values are `boolean`. Set to `false` to disable a feature; run `cockpit update` to apply.

| Key | Default | Platform | Description |
|-----|---------|----------|-------------|
| `statusline` | `true` | Cross-platform | Live status line: real context tokens, usage limits with battery bars, session timer, lines edited, clock, git branch, and more. Turns red near the ~84% auto-compact point so compaction never surprises you. Crash-safe — can never render blank. |
| `sounds` | `true` | Windows | Plays a subtle chime when Claude finishes a response turn. |
| `voice` | `false` | Windows | Speaks Claude's last message aloud via built-in TTS, and announces "Claude needs your permission" on permission prompts. |
| `clipboardImage` | `true` | Windows | Press Ctrl+V with a screenshot on the clipboard to paste the image inline into your message. Claude sees it. Images are auto-downscaled to save input tokens. Runs a small background watcher with a login auto-start entry. |
| `banner` | `true` | Windows | Shows your ASCII logo + brand name as a welcome banner each time a terminal opens. Fully rebrandable via `brand.*` keys. |
| `terminalTheme` | `true` | Windows | Installs the "Cockpit Night" neon color scheme and a matching profile into Windows Terminal, plus a Ctrl+Shift+E shortcut to split the pane into a file browser. Never changes your default profile; backs up your existing settings first. |
| `fileBrowser` | `false` | All (needs deps) | Installs config for the `yazi` terminal file manager and `micro` editor. Requires `yazi` and `micro` to be installed separately — see `docs/file-browser.md`. |
| `commands` | `true` | Cross-platform | Installs 18 slash commands inside Claude Code: `/ui`, `/powers`, `/files`, `/find`, `/open`, `/fix`, `/ship`, `/deploy`, `/build`, `/brief`, `/save`, `/standup`, `/spend`, `/health`, `/unstuck`, `/eli5`, `/normal`, `/paste`, `/dashboard`. |
| `agents` | `true` | Cross-platform | Installs an `explainer` subagent that explains code and errors in plain English on demand. |
| `outputStyles` | `true` | Cross-platform | Enables the "Founder Mode" output style for more decisive, structured responses. |
| `safetyGuard` | `true` | Cross-platform | A `PreToolUse` hook that blocks catastrophic commands: `rm -rf /`, force-push to `main`, disk format, deleting your Claude config dir, system shutdown, and similar. |

---

## `statusline` — Status line configuration

Controls the live status line rendered by the `statusline` feature. Settings here are ignored if `features.statusline` is `false`.

### `statusline.tokensCap`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `tokensCap` | `number` | `1000000` | Your real context-window size in tokens. The status line uses this as the denominator (e.g., "239k / 1M"). Set this to match your actual Claude plan limit for accurate percentage and warning calculations. |

---

### `statusline.show` — Per-field visibility flags

Each flag is a `boolean`. Set to `false` to hide that field from the status line. All fields default to `true` unless noted.

| Key | Default | What it shows |
|-----|---------|---------------|
| `model` | `true` | The active Claude model name (e.g., `claude-sonnet-4-5`). |
| `effort` | `true` | The current thinking/effort level when extended thinking is active. |
| `ctx` | `true` | Current context token count (e.g., `239k`). |
| `ctxCap` | `true` | Your token cap as configured in `tokensCap` (e.g., `/ 1M`). |
| `bars` | `true` | Visual battery-bar fill that turns red near the auto-compact threshold (~84%). |
| `limit5h` | `true` | Your 5-hour rolling usage limit with a visual bar. |
| `limit7d` | `true` | Your 7-day rolling usage limit with a visual bar. |
| `resets` | `true` | Time until the next usage-limit reset. |
| `cost` | `true` | Estimated session cost so far. |
| `burn` | `true` | Current token burn rate (tokens per minute). |
| `timer` | `true` | Elapsed session time (hh:mm:ss). |
| `clock` | `true` | Current local time. |
| `clockSeconds` | `false` | Show seconds in the clock display. Off by default to reduce visual noise. |
| `edits` | `true` | Lines added and removed this session (`+N / -N`). |
| `dir` | `true` | The current working directory (basename). |
| `branch` | `true` | Active git branch name, when inside a git repo. |
| `pills` | `true` | Compact "pill" badges for quick-glance status indicators. |

---

## Full example

```json
{
  "brand": {
    "name": "Claude Cockpit",
    "tagline": "Power-suite for Claude Code",
    "logoFile": "~/.claude/branding/logo.txt",
    "company": "",
    "showCompanyCredit": true
  },
  "features": {
    "statusline": true,
    "sounds": true,
    "voice": false,
    "clipboardImage": true,
    "banner": true,
    "terminalTheme": true,
    "fileBrowser": false,
    "commands": true,
    "agents": true,
    "outputStyles": true,
    "safetyGuard": true
  },
  "statusline": {
    "tokensCap": 1000000,
    "show": {
      "model": true,
      "effort": true,
      "ctx": true,
      "ctxCap": true,
      "bars": true,
      "limit5h": true,
      "limit7d": true,
      "resets": true,
      "cost": true,
      "burn": true,
      "timer": true,
      "clock": true,
      "clockSeconds": false,
      "edits": true,
      "dir": true,
      "branch": true,
      "pills": true
    }
  }
}
```

---

## Applying changes

After editing `~/.claude/cockpit.config.json`, run:

```
cockpit update
```

This re-applies your config idempotently. Your edits and any secrets in `settings.json` are preserved.
