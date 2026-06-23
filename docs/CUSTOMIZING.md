# Customizing Claude Cockpit

Claude Cockpit is built to be yours. This guide walks through the most common personalizations: setting your brand name, swapping the logo, toggling features on and off, and tuning the status line — all without touching anything that could break your existing Claude Code setup.

Every change lives in one file: `~/.claude/cockpit.config.json`. Edit it, run `cockpit update`, done.

---

## 1. Set your brand name

Open `~/.claude/cockpit.config.json` and update the `brand` block:

```json
"brand": {
  "name": "My Dev Suite",
  "tagline": "Built for speed.",
  "company": "Acme Corp",
  "showCompanyCredit": false
}
```

- **`name`** — appears in the welcome banner and all slash-command headers.
- **`tagline`** — one-line subtitle under the logo.
- **`company`** — optional team or company name.
- **`showCompanyCredit`** — set to `false` to remove the "Powered by Claude Cockpit" footnote for a clean white-label look.

Apply it:

```
cockpit update
```

Open a new terminal and the banner will show your name.

---

## 2. Swap the ASCII logo

The banner logo is just a plain `.txt` file at the path set by `brand.logoFile` (default: `~/.claude/branding/logo.txt`).

**To replace it:**

1. Create your ASCII art in any text editor — or generate one at [ascii-art-generator.org](https://www.ascii-art-generator.org) or [patorjk.com/software/taag](https://patorjk.com/software/taag).
2. Save it as a `.txt` file, e.g. `~/.claude/branding/logo.txt` (overwrite the existing file), or save it somewhere else and update the path.
3. If you saved it to a different path, update your config:

```json
"brand": {
  "logoFile": "~/.claude/branding/my-logo.txt"
}
```

4. Run `cockpit update`.

The installer substitutes `{{BRAND}}` and `{{COMPANY}}` tokens at install time, so those placeholders in any template files will automatically use your configured values.

---

## 3. Turn features on or off

All features are booleans in the `features` block. Set any to `false` to disable it, `true` to enable it.

```json
"features": {
  "statusline": true,
  "sounds": false,
  "voice": false,
  "clipboardImage": true,
  "banner": true,
  "terminalTheme": false,
  "fileBrowser": false,
  "commands": true,
  "agents": true,
  "outputStyles": true,
  "safetyGuard": true
}
```

**Common adjustments:**

- **Minimal setup** — keep `statusline`, `commands`, and `safetyGuard` on; turn everything else off.
- **Voice off by default** — `voice` is `false` out of the box; enable it if you want Claude to read responses aloud (Windows only).
- **No Windows Terminal changes** — set `terminalTheme: false` if you manage your terminal theme yourself.
- **File browser** — `fileBrowser` requires `yazi` and `micro` installed separately before enabling. See `docs/file-browser.md`.

After any change, run:

```
cockpit update
```

---

## 4. Customize the status line

The status line shows a live stream of context tokens, usage limits, session cost, timer, clock, git branch, and more. You can hide any field you don't want.

### Set your real token cap

By default the status line assumes a 1,000,000-token context window. Set this to match your actual Claude plan:

```json
"statusline": {
  "tokensCap": 200000
}
```

This makes the percentage fill and the red warning near the auto-compact threshold (~84%) accurate for your plan.

### Hide specific fields

Every field in `statusline.show` is a boolean flag:

```json
"statusline": {
  "tokensCap": 1000000,
  "show": {
    "clock": false,
    "clockSeconds": false,
    "cost": false,
    "burn": false,
    "effort": false
  }
}
```

Fields you omit from `show` remain at their defaults (all `true` except `clockSeconds` which defaults to `false`). You only need to list the fields you want to change.

**Example: minimal status line** — just tokens, bars, timer, and branch:

```json
"statusline": {
  "tokensCap": 1000000,
  "show": {
    "model": false,
    "effort": false,
    "ctxCap": true,
    "bars": true,
    "limit5h": false,
    "limit7d": false,
    "resets": false,
    "cost": false,
    "burn": false,
    "timer": true,
    "clock": false,
    "clockSeconds": false,
    "edits": false,
    "dir": false,
    "branch": true,
    "pills": false
  }
}
```

### Using the /ui command (no JSON editing required)

If you prefer plain English over editing JSON, open Claude Code and use the `/ui` command:

```
/ui hide cost and burn rate
/ui show only tokens, bars, timer, and branch
/ui turn on clock seconds
```

The `/ui` command updates `statusline.show` in your config file and runs `cockpit update` for you. It's the same result as editing the JSON — just friendlier for non-technical users.

---

## 5. Apply your changes

Any time you edit `~/.claude/cockpit.config.json`, run:

```
cockpit update
```

This command:
- Pulls the latest version of Cockpit from GitHub.
- Re-applies all enabled features using your current config.
- Preserves your edits, API keys, and any existing `settings.json` entries — nothing is overwritten destructively.
- Safe-merges Cockpit's hooks with any hooks you already have.

You can also trigger an update from inside Claude Code with the `/cockpit` slash command — useful if you don't have a separate terminal open.

---

## 6. Full customized example

Here is a complete `cockpit.config.json` for a rebranded minimal setup with a focused status line:

```json
{
  "brand": {
    "name": "Acme Dev Suite",
    "tagline": "Engineering at Acme speed.",
    "logoFile": "~/.claude/branding/acme-logo.txt",
    "company": "Acme Corp",
    "showCompanyCredit": false
  },
  "features": {
    "statusline": true,
    "sounds": false,
    "voice": false,
    "clipboardImage": true,
    "banner": true,
    "terminalTheme": false,
    "fileBrowser": false,
    "commands": true,
    "agents": true,
    "outputStyles": false,
    "safetyGuard": true
  },
  "statusline": {
    "tokensCap": 200000,
    "show": {
      "model": true,
      "effort": false,
      "ctx": true,
      "ctxCap": true,
      "bars": true,
      "limit5h": true,
      "limit7d": false,
      "resets": true,
      "cost": false,
      "burn": false,
      "timer": true,
      "clock": true,
      "clockSeconds": false,
      "edits": true,
      "dir": true,
      "branch": true,
      "pills": true
    }
  }
}
```

---

## Tips

- **Config survives updates.** `cockpit update` never touches your `cockpit.config.json`. Make it yours permanently.
- **Zero telemetry.** The only network call Cockpit ever makes is the `git pull` inside `cockpit update`. Nothing phones home.
- **Settings backup.** The installer backs up your existing `~/.claude/settings.json` to `settings.json.cockpit-backup` before touching it. If anything looks wrong, your original is there.
- **Full reference.** See `docs/CONFIG.md` for a table of every key, type, default, and description.
