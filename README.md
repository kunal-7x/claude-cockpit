<div align="center">

# ✨ Claude Cockpit

### The setup that makes Claude Code feel like a cockpit, not a chat box.

**A live status line that shows real tokens · sound + voice alerts · paste screenshots straight in · a neon terminal · an in-terminal file browser · 19 pro commands — installed in one command, fully yours to rebrand, and updated with one more.**

[![License: MIT](https://img.shields.io/badge/License-MIT-c792ea.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%C2%B7%20macOS%20%C2%B7%20Linux-82aaff.svg)](#install)
[![Made for Claude Code](https://img.shields.io/badge/for-Claude%20Code-86e1fc.svg)](https://claude.com/claude-code)
[![Stars](https://img.shields.io/github/stars/kunal-7x/claude-cockpit?style=social)](https://github.com/kunal-7x/claude-cockpit/stargazers)

</div>

```text
▌ 🤖 Opus 4.8 max · 🧠 270.3k /1M ▰▱▱▱▱ · 🔋 5 hour 11% ▰▱▱▱▱ · 🔋 weekly 51% ▰▰▰▱▱ · ✏ +39/-37 · ⌛ 4m29s · 🕐 08:35:55 · 📂 a
```
<div align="center"><sub>Your live status line — real token count vs. the actual auto-compact point, your rate limits, edits, a session timer and a ticking clock. Updates every second.</sub></div>

---

## Why

Setting Claude Code up to feel *pro* takes days of fiddling — status lines, hooks, sounds, themes, clipboard, commands. **Claude Cockpit is all of it, done.** One command installs it. One command updates it. Everything is a toggle, and the whole thing is yours to rebrand with your own logo.

## ⚡ Install

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/kunal-7x/claude-cockpit/main/install.ps1 | iex
```

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/kunal-7x/claude-cockpit/main/install.sh | sh
```

> Requires [Node.js](https://nodejs.org) (Claude Code already needs it). Then **restart Claude Code** — done.

## ✨ What you get

| | Feature | What it does |
|---|---|---|
| 🧠 | **Live status line** | Real **token count vs the true auto-compact point** (no more "94% then it compacts" surprise), 5-hour + weekly limits, edits, timer, live clock. Bulletproof — never blanks. |
| 🔔 | **Sound + voice alerts** | A chime when Claude finishes; it *speaks* the result on long tasks; a different sound when it needs your permission. |
| 📋 | **Paste screenshots inline** | Copy any image → **Ctrl+V** → it's attached. Auto-downscaled to save tokens. No command, no "what do you see". |
| 🎨 | **Neon terminal** | A tuned "Cockpit Night" theme + glass terminal + a branded welcome banner — only for Claude Code, not your other terminals. |
| 🗂️ | **In-terminal file browser** | **Ctrl+Shift+E** opens a visual file tree beside Claude (yazi + micro) — browse, open, edit, save, search. No IDE. |
| ⚡ | **19 pro commands** | `/ui` `/powers` `/files` `/find` `/fix` `/ship` `/save` `/brief` `/eli5` `/health` `/spend` `/unstuck` … |
| 🧩 | **Agents + output styles** | A plain-English `/explainer` agent and a "Founder Mode" output style. |
| 🛡️ | **Safety guard** | A hook that blocks catastrophic commands (`rm -rf /`, force-push to main, deleting your config…). |

## 🎛️ Make it yours

Everything lives in one file: **`~/.claude/cockpit.config.json`**.

```jsonc
{
  "brand": {
    "name": "Your Company",            // shown big in the banner
    "logoFile": "branding/logo.txt",   // ← drop YOUR ASCII/text logo here
    "company": "Your Company",
    "showCompanyCredit": true          // small credit, bottom-right
  },
  "features": {
    "statusline": true, "sounds": true, "voice": true,
    "clipboardImage": true, "terminalTheme": true, "fileBrowser": true,
    "commands": true, "agents": true, "outputStyles": true, "safetyGuard": true
  }
}
```

- **Your logo, front and centre.** Replace `~/.claude/branding/logo.txt` with your own — it shows on every session.
- **Pick what you want.** Flip any feature to `false` and it won't be installed.
- **Tune the status line.** Inside Claude, just say `/ui` ("hide the clock", "show cost", "shorten it") — it edits the config for you.
- Apply changes any time with **`cockpit update`** (or `/cockpit` inside Claude).

## 🔄 One-command updates

When new features ship, pull them into your machine without redoing anything:

```bash
cockpit update      # or run /cockpit inside Claude Code
```

It re-applies your config, keeps your branding, and **never touches your other settings** — the installer is idempotent and safe to run any time.

## 🔒 Safe by design

- The installer **merges** into your `~/.claude/settings.json` — your existing settings, API keys and tokens are **preserved** (a backup is written to `settings.json.cockpit-backup`).
- It only ever changes the keys it owns. Your Windows Terminal default profile is left alone.
- **No secret ever enters this repo** (enforced by `.gitignore` + CI secret-scan).

## 🧹 Uninstall

```bash
node ~/.cockpit/bin/uninstall.js     # restores your settings backup and removes Cockpit files
```

## 🗺️ Platform support

| Feature | Windows | macOS / Linux |
|---|:---:|:---:|
| Status line · commands · agents · output styles | ✅ | ✅ |
| Sounds · voice · clipboard · banner · terminal theme · file browser | ✅ | 🔜 |

The universal parts (the status line alone is worth it) work everywhere; the rich Windows experience is first-class today, with macOS/Linux parity on the roadmap. PRs welcome.

## 🤝 Contributing

Issues and PRs welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md). New commands, themes, and OS support are especially appreciated.

## 📜 License

[MIT](LICENSE) · Crafted with care by **FAMIT**.

<div align="center"><sub>If Claude Cockpit makes your day faster, drop a ⭐ — it genuinely helps.</sub></div>
