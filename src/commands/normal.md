---
description: Revert the terminal to plain/normal in one go (no theme, no glass, no background, no banner)
---
Restore the user's ORIGINAL plain terminal in one step:
1. Copy `settings.cockpit-backup.json` over `settings.json` in
   `$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\`
   (this removes the themed profiles, background, glass, and banner — back to stock).
2. In `~/.claude/settings.json` set `"theme"` back to `"dark"`.
3. Validate both JSON files.

Then tell the user it's back to normal and to open a new terminal tab/window to see it.
Remind them they can say **"/ui fancy again"** to instantly restore the themed look (saved in `settings.cockpit-backup.json`).
