---
description: Update or reconfigure Claude Cockpit (pull new features, apply your config)
---
The user wants to manage their Claude Cockpit install. Be friendly and concise — they may be non-technical.

1. If they asked to change a setting (turn a feature on/off, change their brand name, logo, or status-line fields), edit `~/.claude/cockpit.config.json` to match what they asked. For status-line tweaks you can also edit `~/.claude/ui-config.json` directly.
2. Apply changes / pull the latest version by running the updater:
   - Windows: `node "$env:USERPROFILE\.cockpit\bin\update.js"`
   - macOS/Linux: `node ~/.cockpit/bin/update.js`
   (This is idempotent and safe — it preserves their other settings and secrets.)
3. Tell them what changed, and remind them to **restart Claude Code** if the status line or hooks changed.

If `~/.cockpit` doesn't exist, the one-line installer hasn't been run yet — point them to the README install command.
