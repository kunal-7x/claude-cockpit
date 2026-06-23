## Summary

<!-- What does this PR do? Link any related issues: Closes #NNN -->

## Checklist

- [ ] Tested with the sandbox installer (`COCKPIT_SANDBOX=1 CLAUDE_CONFIG_DIR=$(mktemp -d) node bin/install.js` exits 0)
- [ ] No secrets, API tokens, or personal config committed (check `.gitignore` covers any new sensitive files)
- [ ] Documentation updated if behavior changed (README, feature table, `docs/`)
- [ ] Cross-platform impact considered — changes to Node files work on Windows, macOS, and Linux; PowerShell/Windows-only changes are clearly scoped and documented
- [ ] JSON files are valid (CI validates all `*.json` automatically)
- [ ] JavaScript files pass `node --check` (CI validates `bin/*.js` and `src/statusline.js`)

## Testing notes

<!-- Describe how you verified the change locally. Include OS, Node version, and any manual steps. -->
