---
description: Open a visual browser dashboard of your projects (health, recent work, power-ups, commands)
---
Build and open a visual browser dashboard for the user. Keep it FAST (skip slow tools like ccusage unless asked).

1. Gather quickly:
   - Recent `WORKLOG.md` entries (last ~10 lines) if present.
   - `git status` + `git log --oneline -5` for the current project (skip if not a git repo).
   - Last few lines of `~/.claude/sessions.log` if present.

2. Generate ONE self-contained HTML file at `~/.claude/dashboard.html` (inline CSS, no external deps) in the "Cockpit Night" look:
   - Background `#0C0F1A`, text `#C6D0F5`; accents violet `#C792EA`, blue `#82AAFF`, cyan `#86E1FC`, lime `#C3E88D`, amber `#FFC777`.
   - Header: "✨ Cockpit Command Center" + today's date.
   - Rounded cards with subtle glow + generous spacing (distinctive, not templated): **Recent Work**, **Project Status** (git), **Quick Commands** (/build, /fix, /ship, /deploy, /spend, /brief, /ui, /powers).
   - Make it genuinely good-looking — clear type hierarchy, breathing room.

3. Open it: run (PowerShell) `Start-Process "$env:USERPROFILE\.claude\dashboard.html"`.

4. Tell the user it's open in their browser and that running `/dashboard` again refreshes it with current data.
