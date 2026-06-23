# Updating Claude Cockpit

## For Users

### How to Update

Run the update command from any terminal:

```
cockpit update
```

Or, from inside Claude Code, use the slash command:

```
/cockpit
```

Both are idempotent — safe to run as many times as you like. The update pulls the latest code from GitHub and re-applies your configuration. Your settings, secrets, and customizations are never touched.

### What the Update Does

1. Pulls the latest commits from `main` into `~/.cockpit` (the local clone)
2. Runs `bin/install.js` again — copies only the components you have enabled into `~/.claude`
3. Re-applies `{{BRAND}}` / `{{COMPANY}}` token substitution from your current `cockpit.config.json`
4. Safe-merges `~/.claude/settings.json` (see below)
5. Re-merges the Windows Terminal fragment if `terminalTheme` is enabled

### What Is Preserved

| Item | Preserved? |
|---|---|
| `~/.claude/cockpit.config.json` — your feature flags and brand settings | Yes, always |
| `~/.claude/settings.json` — your API keys, existing hooks, Claude settings | Yes — safe-merged |
| `~/.claude/settings.json.cockpit-backup` — the pre-install snapshot | Yes, kept as-is |
| `~/.claude/branding/logo.txt` — your custom ASCII logo | Yes |
| All secrets and tokens | Yes — never read, never committed, never sent anywhere |

Safe-merge means: Cockpit reads your existing `settings.json`, adds or updates only its own keys (status line config, cockpit hooks), and writes the result back. Your existing hooks, API tokens, model preferences, and any other keys are left exactly as they were.

### Pinning to a Specific Version

If you want to stay on a particular release, pin the local clone to a tag:

```bash
cd ~/.cockpit
git checkout v1.2.0   # replace with the tag you want
node bin/install.js
```

To go back to tracking latest:

```bash
cd ~/.cockpit
git checkout main
git pull
node bin/install.js
```

### Rolling Back

Every install and update creates (or refreshes) `~/.claude/settings.json.cockpit-backup` before touching `settings.json`. To restore:

1. Open `~/.claude/`
2. Copy `settings.json.cockpit-backup` over `settings.json`
3. Restart Claude Code

To fully undo Cockpit:

```
cockpit uninstall
```

This removes all Cockpit-managed files from `~/.claude` and restores `settings.json` from the backup.

---

## For Maintainers

### Shipping an Update to Users

1. Commit and push your changes to the `main` branch on `github.com/kunal-7x/claude-cockpit`
2. That's it — no release pipeline or package publish needed

Users get the update the next time they run `cockpit update` or `/cockpit`. Because the update is a plain `git pull`, the full commit history is available and users can inspect exactly what changed.

### Versioning

Tag releases with a semver tag (`v1.2.3`) for users who want to pin. Annotate the tag with a short changelog:

```bash
git tag -a v1.2.0 -m "Add fileBrowser feature, fix status line on Windows 11"
git push origin v1.2.0
```

### Backward Compatibility Rules

- `cockpit.config.json` schema changes must be additive. New feature keys should default to `false` (opt-in) so existing user configs continue to work without modification.
- `{{TOKEN}}` substitutions in source files must remain stable; renaming a token is a breaking change.
- `settings.json` safe-merge logic must never remove keys it did not add.
- If a file previously copied by the installer is removed from the repo, `bin/install.js` should also remove it from `~/.claude` on the next update — do not leave orphan files.

### Testing an Update Locally

```bash
cd ~/.cockpit
git pull
node bin/install.js --dry-run   # preview what would change
node bin/install.js             # apply
cockpit doctor                  # verify health
```
