---
description: 30-second orientation — where am I, what's done, what's next, what's broken
---
Give the user a fast "where am I" briefing on the current project. Gather ground truth (delegate the heavy reading to a subagent to save context):
- Read WORKLOG.md, STATE.md, ORCHESTRATOR.md (whichever exist), and recent `git log --oneline -10` + `git status`.
- Skim any START_HERE.md / PROJECT_BRAIN.md notes.

Then report concisely in plain language (~10 lines max):
- 📍 **Where things stand** (what was last worked on)
- ✅ **Done recently**
- 🔄 **In progress** (the one IN-PROGRESS item, if any)
- 👉 **Next 1–3 steps**
- ⚠️ **Anything broken or risky**

End with a single recommended next action. No fluff — this is a get-oriented-fast briefing.
