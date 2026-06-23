---
description: Show a clean tree of a folder so you can see your file structure
argument-hint: optional folder path (defaults to current)
---
Show the user a clean, readable tree of the folder in the arguments (or the current working directory if none).
- Prefer `eza --tree --level=2 --icons --git --group-directories-first` if eza is available; otherwise use Glob / a recursive listing.
- Collapse / skip noise: `node_modules`, `.git`, `dist`, `build`, `__pycache__`. Keep depth ~2–3 so it's scannable.
- Folders first, then files.
End by asking which file they want to open or edit — and remind them they can press **Ctrl+Shift+E** to open the visual file browser beside Claude.
