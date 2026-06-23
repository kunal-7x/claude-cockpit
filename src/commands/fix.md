---
description: Find the root cause of a problem and fix it (explore → diagnose → fix → verify)
argument-hint: the problem, bug, or error
---
The user reports a problem (in the arguments). Use systematic debugging — do NOT guess-and-patch:
1. Reproduce / locate the issue in the ACTUAL code (ground truth, not assumptions). Delegate searching to a subagent if broad.
2. Find the ROOT CAUSE, not the symptom.
3. Fix it with the smallest correct change.
4. Verify on the real flow — run the test or command that proves it works.
5. Report: what was actually wrong, what you changed (file:line), and how you verified it.
If it touches the live/earner pipeline, change cautiously — one box-mutating change with an immediate revert path. A working product beats a clever fix.
