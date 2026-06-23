---
description: Ship the current work live safely (test → commit → push → deploy → verify on the real edge)
---
Deploy the current work to production safely:
1. Run the project's tests/build; fix any failures before continuing.
2. Commit in small logical units; push the branch.
3. Open or merge the PR as appropriate, or run the project's deploy step.
4. VERIFY on the real, live edge that it actually works — not just per-component green reports.
5. Keep an immediate revert path; if anything looks off on the live flow, roll back first, debug second.
6. Report what deployed, the live URL/result, and anything only the user can confirm.
Treat the live pipeline as production: cautious, one change at a time.
