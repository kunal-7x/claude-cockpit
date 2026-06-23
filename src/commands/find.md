---
description: Search your files for text and show where it appears
argument-hint: the text/keyword to find
---
Search the project files for the text in the arguments.
- Use the Grep tool (ripgrep) for content search; use Glob for filename matches.
- Report matches as `file:line` with a short snippet of the matching line, grouped by file.
- Skip `node_modules`, `.git`, `build`, `dist`.
- If there are many matches, show the most relevant ~20 and state the total count.
Offer to open or edit any match directly.
