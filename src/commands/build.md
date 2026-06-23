---
description: Turn an idea into shipped work — full explore → design → build → test pipeline
argument-hint: what to build
---
The user wants to build something (in the arguments). Act as their autonomous founder + dev team and run the full production pipeline:
1. UNDERSTAND the ask; proactively infer the parts they didn't name (frontend, backend, data, security, integration).
2. EXPLORE the real codebase first (ground truth — don't assume or rebuild what exists). Delegate heavy search to a subagent.
3. DESIGN the approach briefly.
4. BUILD end-to-end: backend → a frontend control UI (full CRUD + test/preview) → data/migrations.
5. TEST/verify the REAL integrated flow, not per-component green.
6. Report what shipped, where, and anything only the user can verify themselves.
Work in small verified units; keep STATE.md/WORKLOG updated; commit per unit if it's a git repo. Make the small calls yourself — don't bounce them back. Reserve genuine forks for the AskUserQuestion tool (never prose questions).
