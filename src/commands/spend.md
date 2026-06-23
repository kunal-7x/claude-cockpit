---
description: Real money dashboard — your Claude Code spend today / this week / this month / all-time
---
Show the user a clean spending dashboard built from their REAL usage data.

1. Run: `npx -y ccusage@latest daily --json` (it reads the ~/.claude transcripts; first run may take ~30-60s — that's normal).
2. Parse the JSON. The array of days is at `.daily`. Inspect an entry's keys to find the cost field (e.g. `totalCost`) and the date field, then use them.
3. Present a tidy dashboard with light emoji and a table:
   - 💸 **Today**
   - 📆 **Last 7 days**
   - 🗓️ **Last 30 days**
   - 💰 **All-time total**
   - 🔥 **Average per day**
4. Finish with ONE plain-English takeaway (e.g. "You're averaging ~$X/day — your biggest day was $Y on <date>").

If ccusage fails or returns nothing, fall back to reporting the current session cost and say all-time data wasn't available. Never dump raw JSON at the user. Keep it concise and friendly.
