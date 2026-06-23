---
description: Control your terminal look & status line in plain English (opacity, glass, background, what shows)
argument-hint: e.g. "more transparent", "hide the cost", "remove background", "bigger font", "fancy again"
---
The user wants to adjust their terminal UI. Read their request in the arguments and APPLY it by editing files. Two control surfaces:

**1. Status-line content** — edit `~/.claude/ui-config.json`, the `show` flags (true/false):
`dir, branch, model, effort, ctx, bars, limit5h, limit7d, resets, cost, burn, timer, clock, clockSeconds, edits`.
Takes effect within ~1 second, no restart.

**2. Terminal look** — edit the "✨ Claude Code" profile in
`$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json`:
- transparency → `opacity` (0–100; lower = more see-through)
- glass blur → `useAcrylic` true/false  (NOTE: acrylic=true HIDES the background image + border frame)
- background/border → `backgroundImage` (set to `""` to remove) and `backgroundImageOpacity`
- font size → profile `font.size`
Validate the JSON after editing. WT applies on a new tab/window.

**Presets:**
- "remove background" → `backgroundImage` = `""`
- "pure glass" → `useAcrylic` true + `backgroundImage` `""`
- "more transparent" → lower `opacity` ~12 · "more solid" → raise it
- "bigger/smaller font" → adjust `font.size`
- "fancy again" → copy `settings.cockpit-backup.json` over `settings.json`
- "normal/plain" → run the same steps as the `/normal` command

After applying, confirm in ONE short friendly sentence what changed (and that a new tab may be needed). Keep `settings.cockpit-backup.json` intact.
