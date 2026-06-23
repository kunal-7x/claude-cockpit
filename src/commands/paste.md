---
description: Paste an image from your clipboard so Claude can see it (screenshot, copied picture, etc.)
---
The user wants to attach whatever image is currently in their clipboard.

1. Run: `powershell -NoProfile -ExecutionPolicy Bypass -STA -File "$env:USERPROFILE\.claude\clip-image.ps1"`
   It saves the clipboard image to a PNG and prints the file path (or `NO_IMAGE`).
2. If it printed a path, use the **Read** tool on that exact path to view the image, then respond to what the user asked about it.
3. If it printed `NO_IMAGE`, tell them their clipboard has no image yet — ask them to take a screenshot (**Win + Shift + S**) or copy an image, then run `/paste` again.

Keep it smooth and friendly.
