# Claude Cockpit — Feature Catalog

All 11 features are controlled by boolean keys in `~/.claude/cockpit.config.json` under the `features` object. Toggle any feature and run `cockpit update` to apply.

---

## Summary Table

| # | Feature | Config Key | Platform | Requirement |
|---|---------|-----------|----------|-------------|
| 1 | [Status Line](#1-status-line) | `statusline` | Cross-platform | Node.js >= 16 |
| 2 | [Sounds](#2-sounds) | `sounds` | Windows | — |
| 3 | [Voice](#3-voice) | `voice` | Windows | — |
| 4 | [Clipboard Image](#4-clipboard-image) | `clipboardImage` | Windows | — |
| 5 | [Banner](#5-banner) | `banner` | Windows | — |
| 6 | [Terminal Theme](#6-terminal-theme) | `terminalTheme` | Windows | Windows Terminal |
| 7 | [File Browser](#7-file-browser) | `fileBrowser` | Windows | yazi + micro |
| 8 | [Commands](#8-commands) | `commands` | Cross-platform | Node.js >= 16 |
| 9 | [Agents](#9-agents) | `agents` | Cross-platform | Node.js >= 16 |
| 10 | [Output Styles](#10-output-styles) | `outputStyles` | Cross-platform | Node.js >= 16 |
| 11 | [Safety Guard](#11-safety-guard) | `safetyGuard` | Cross-platform | Node.js >= 16 |

---

## 1. Status Line

**The hero feature.** A live, information-dense one-line status bar rendered in Claude Code's terminal. It is the primary reason most users install Claude Cockpit.

### What it looks like

```
🤖 Opus 4.8 · 🧠 239.1k /1M · 🔋 5 hour 8% · 🔋 weekly 29% · ✏ +577/-134 · ⌛ 14h56m · 🕐 12:55 · 📂 a
```

Each segment is independently toggleable via `statusline.show.*` config keys.

### What each segment means

| Segment | Meaning |
|---------|---------|
| `🤖 Opus 4.8` | Active model name |
| `🧠 239.1k /1M` | Real context tokens used vs your actual window size (e.g. 1M for Opus) |
| `🔋 5 hour 8%` | Percentage of your 5-hour usage limit consumed |
| `🔋 weekly 29%` | Percentage of your weekly usage limit consumed |
| `✏ +577/-134` | Lines added / lines removed in this session |
| `⌛ 14h56m` | Elapsed session timer |
| `🕐 12:55` | Live ticking clock (current local time) |
| `📂 a` | Current working directory (short name) |

### Key behaviors

- **Turns red with a warning** as context approaches the ~84% auto-compact threshold, so compaction never surprises you mid-task.
- **Crash-safe**: a fallback renderer ensures the line never goes blank, even if part of the data collection fails.
- **Live ticking**: the clock updates in real time. Note: `statusLine.refreshInterval` (in seconds) is read at startup — a Claude Code restart is needed to change the tick rate.
- Accurately reports **real token counts** rather than the percentage figure Claude Code shows by default (which was observed to lag and mislead).

### Config key

```json
"features": { "statusline": true }
```

### Fine-grained control

```json
"statusline": {
  "tokensCap": 1000000,
  "show": {
    "model": true,
    "ctx": true,
    "ctxCap": true,
    "bars": true,
    "limit5h": true,
    "limit7d": true,
    "resets": false,
    "cost": false,
    "burn": false,
    "timer": true,
    "clock": true,
    "clockSeconds": false,
    "edits": true,
    "dir": true,
    "branch": false,
    "pills": false
  }
}
```

Set `tokensCap` to match your subscription's actual context window. Each `show` key toggles an individual segment.

**Platform:** Cross-platform (Node.js)
**Requirement:** Node.js >= 16

---

## 2. Sounds

A subtle chime plays in your terminal whenever Claude finishes a turn. Useful when you step away from the screen while Claude is working and want an audio cue that it is ready for input.

- The chime is non-intrusive and short — it does not interrupt Claude's output.
- No external audio files are required; it uses Windows built-in audio APIs.

### Config key

```json
"features": { "sounds": true }
```

**Platform:** Windows
**Requirement:** None beyond the platform

---

## 3. Voice

Claude speaks its last message aloud using Windows built-in text-to-speech (TTS). It also announces `"Claude needs your permission"` when Claude Code raises a tool-use permission prompt — so you can hear when approval is needed without watching the screen.

- Uses the built-in Windows TTS engine; no external service, no network call.
- Reads the final assistant message after each turn completes.
- Permission-prompt announcements are immediate, even for long turns.

### Config key

```json
"features": { "voice": true }
```

**Platform:** Windows
**Requirement:** None beyond the platform

---

## 4. Clipboard Image

Take a screenshot (or copy any image), press `Ctrl+V` in Claude Code, and the image pastes inline into your message. Claude sees the image directly. Images are automatically downscaled before sending to reduce input token usage.

- A small background watcher process monitors the clipboard for image data.
- A login auto-start entry is registered so the watcher runs automatically on system startup.
- Downscaling is transparent — the original image in your clipboard is not modified.
- Eliminates the need to save screenshots to disk and reference file paths manually.

### Config key

```json
"features": { "clipboardImage": true }
```

**Platform:** Windows
**Requirement:** None beyond the platform

---

## 5. Banner

A rebrandable welcome banner is displayed when a new terminal session opens. By default it shows the Claude Cockpit ASCII logo and name. You can replace it with your own logo and brand name for personal or team use.

- ASCII art logo is loaded from `~/.claude/branding/logo.txt`.
- Brand name and tagline are pulled from the `brand` section of `cockpit.config.json`.
- To rebrand: update `brand.name` (and optionally `brand.tagline`, `brand.logoFile`) in your config, replace `logo.txt` with your own ASCII art, then run `cockpit update`.

### Config key

```json
"features": { "banner": true }
```

### Related brand config

```json
"brand": {
  "name": "Claude Cockpit",
  "tagline": "Your power-suite for Claude Code",
  "logoFile": "~/.claude/branding/logo.txt",
  "company": "",
  "showCompanyCredit": false
}
```

**Platform:** Windows
**Requirement:** None beyond the platform

---

## 6. Terminal Theme

Installs a neon "Cockpit Night" color scheme and profile into Windows Terminal. Also binds `Ctrl+Shift+E` to split the active pane into a side-by-side file browser view.

- The color scheme and profile are safe-merged into your Windows Terminal `settings.json` — a backup is written first, and your existing default profile is never changed.
- The split-pane keybinding is added alongside your existing keybindings, not replacing them.
- The theme is designed for extended Claude Code sessions: high-contrast, dark, easy on the eyes.

### Config key

```json
"features": { "terminalTheme": true }
```

**Platform:** Windows
**Requirement:** Windows Terminal (the modern Microsoft terminal app)

---

## 7. File Browser

Installs configuration for `yazi` (a terminal file manager) and `micro` (a terminal text editor) so you can browse, open, and edit files without leaving the terminal. Pairs well with the `Ctrl+Shift+E` split pane from the Terminal Theme feature.

- Configuration files for yazi and micro are placed in the appropriate locations so they work out of the box.
- See [`docs/file-browser.md`](file-browser.md) for keybinding reference and usage tips.

### Config key

```json
"features": { "fileBrowser": true }
```

**Platform:** Windows
**Requirement:** `yazi` and `micro` must be installed separately. See [docs/file-browser.md](file-browser.md) for installation instructions.

---

## 8. Commands

Installs 19 slash commands that are available inside Claude Code. These cover common workflows so you do not need to remember long prompts.

| Command | What it does |
|---------|-------------|
| `/ui` | Control terminal look and status line in plain English |
| `/powers` | Show the Claude Cockpit command center cheat sheet |
| `/files` | File browser shortcut |
| `/find` | Search for files or content |
| `/open` | Open a file in the editor |
| `/fix` | Fix the current error or issue |
| `/ship` | Run the full ship pipeline (build + test + commit + push) |
| `/deploy` | Deploy the current project |
| `/build` | Turn an idea into shipped work (explore → design → build → test) |
| `/brief` | 30-second orientation — where am I, what's done, what's next, what's broken |
| `/save` | Save current session state to disk |
| `/standup` | Generate a standup summary of recent work |
| `/spend` | Real money dashboard — spend today / this week / this month / all-time |
| `/health` | Quick project health check — what works, what's broken, what's missing |
| `/unstuck` | Diagnose and recover from being stuck |
| `/eli5` | Explain the current situation in plain, non-technical terms |
| `/normal` | Reset to default output mode |
| `/paste` | Paste an image from the clipboard so Claude can see it |
| `/dashboard` | Open the project dashboard |

### Config key

```json
"features": { "commands": true }
```

**Platform:** Cross-platform (Node.js)
**Requirement:** Node.js >= 16

---

## 9. Agents

Installs a built-in `explainer` subagent that explains code and error messages in plain English. Designed for non-technical users or anyone who wants a fast second opinion on an unfamiliar error or code block.

- Invoked automatically or on demand when Claude Code encounters an error.
- Returns plain-English explanations without requiring the user to craft a prompt.

### Config key

```json
"features": { "agents": true }
```

**Platform:** Cross-platform (Node.js)
**Requirement:** Node.js >= 16

---

## 10. Output Styles

Installs a "Founder Mode" output style. When active, Claude Code's responses are oriented toward product and business decisions — concise, action-oriented, and focused on outcomes rather than implementation detail. Useful when you want high-level guidance rather than code.

### Config key

```json
"features": { "outputStyles": true }
```

**Platform:** Cross-platform (Node.js)
**Requirement:** Node.js >= 16

---

## 11. Safety Guard

A `PreToolUse` hook that intercepts and blocks catastrophic commands before they execute. It acts as a last-resort guardrail against accidental or runaway destructive operations.

### Commands it blocks

- `rm -rf /` and variants (recursive deletes of root or home)
- Force-push to `main` or `master` (`git push --force` on protected branches)
- Disk format commands
- Deletion of your Claude Code config directory (`~/.claude`)
- System shutdown or reboot commands

### How it works

- Runs as a short, readable PowerShell `PreToolUse` hook registered in `settings.json`.
- Checks the tool call and its arguments before execution.
- If a blocked pattern is detected, the tool call is cancelled and a warning is shown — Claude Code does not execute the command.
- Does not affect normal operations; only targets the narrow set of irreversible destructive patterns.

### Config key

```json
"features": { "safetyGuard": true }
```

**Platform:** Cross-platform (the hook logic is portable; PowerShell Core is available on macOS/Linux)
**Requirement:** None beyond the platform

---

## Toggling Features

Edit `~/.claude/cockpit.config.json` directly, or run `cockpit configure` for an interactive menu. After any change, run:

```sh
cockpit update
```

This re-applies only the changed components idempotently. Your existing settings, API tokens, and any hooks you added manually are preserved.
