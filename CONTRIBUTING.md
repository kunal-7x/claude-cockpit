# Contributing to Claude Cockpit

Thank you for your interest in contributing. Claude Cockpit is a modular power-suite for Claude Code, and every improvement — bug fix, new feature, documentation clarification — makes it better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Repository Layout](#repository-layout)
- [How to Add a Feature](#how-to-add-a-feature)
- [Testing Your Changes](#testing-your-changes)
- [Code Style](#code-style)
- [Submitting a Pull Request](#submitting-a-pull-request)

---

## Code of Conduct

This project follows the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.

---

## Getting Started

1. **Fork** the repository on GitHub: `github.com/kunal-7x/claude-cockpit`
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/claude-cockpit.git
   cd claude-cockpit
   ```
3. **Create a branch** for your work. Use a descriptive name:
   ```bash
   git checkout -b feat/my-feature
   # or
   git checkout -b fix/issue-123
   ```
4. Make your changes, test them (see [Testing](#testing-your-changes)), then open a pull request against `main`.

Node.js >= 16 is the only runtime requirement. There are no `npm install` steps — the project intentionally has zero runtime dependencies.

---

## Repository Layout

```
claude-cockpit/
├── bin/
│   └── install.js          # Installer: copies enabled components into ~/.claude
├── src/
│   ├── statusline/         # Feature: live context/token status line
│   ├── sounds/             # Feature: completion chime (Windows)
│   ├── voice/              # Feature: TTS readback (Windows)
│   ├── clipboardImage/     # Feature: Ctrl+V image paste (Windows)
│   ├── banner/             # Feature: rebrandable welcome banner (Windows)
│   ├── terminalTheme/      # Feature: Cockpit Night color scheme (Windows)
│   ├── fileBrowser/        # Feature: yazi + micro configs
│   ├── commands/           # Feature: 18 slash commands
│   ├── agents/             # Feature: explainer subagent
│   ├── outputStyles/       # Feature: Founder Mode output style
│   └── safetyGuard/        # Feature: PreToolUse catastrophic-command blocker
├── docs/                   # Per-feature documentation
├── config.example.json     # Template copied to ~/.claude/cockpit.config.json
├── install.ps1             # Windows bootstrap (clones repo, calls install.js)
├── install.sh              # Mac/Linux bootstrap
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── CHANGELOG.md
└── README.md
```

Each directory under `src/` maps to exactly one boolean feature flag in `cockpit.config.json -> features{}`. The installer in `bin/install.js` reads that config and copies only the enabled feature directories into the user's `~/.claude` folder.

---

## How to Add a Feature

Follow these four steps. Do not skip any of them — the installer, the config schema, and the docs all need to stay in sync.

### 1. Create your feature directory under `src/`

```
src/my-feature/
├── README.md          # What it does, requirements, screenshots if applicable
└── <your files>       # Hooks, scripts, slash commands, config fragments, etc.
```

Keep files self-contained. A feature should not reach into another feature's directory at runtime. If two features share logic, extract it to `src/shared/` and document the dependency.

### 2. Add a feature flag to the config schema

In `config.example.json`, add your feature key (camelCase) to the `features` object with a default value of `false` (opt-in) or `true` if it is universally safe and useful:

```json
{
  "features": {
    "myFeature": false
  }
}
```

Update the `CONFIG SCHEMA` section of `README.md` to document the new key.

### 3. Add a copy step in `bin/install.js`

The installer iterates over enabled features and copies their `src/<feature>/` contents into the target `~/.claude` directory. Add your feature to the features map so the installer handles it:

```js
// In bin/install.js, add to the FEATURES map:
{ key: 'myFeature', srcDir: 'my-feature', description: 'Short description' }
```

The installer must remain idempotent: running it twice must produce the same result as running it once. If your feature writes to external config files (e.g. Windows Terminal settings), follow the existing safe-merge pattern used by `terminalTheme` — read, merge, write, never overwrite blindly.

### 4. Write or update documentation

- Add `docs/my-feature.md` with usage, requirements, and any platform notes.
- Reference it from the main `README.md` feature table.
- If the feature is platform-restricted, mark it clearly: `(Windows only)`, `(macOS/Linux)`, etc.

---

## Testing Your Changes

Claude Cockpit ships with a sandbox mode so you can test the installer without touching your real `~/.claude` directory.

### Sandbox install

```bash
# Create a temporary target directory
mkdir /tmp/cockpit-test-config   # Mac/Linux

# Run the installer pointed at the temp dir
COCKPIT_SANDBOX=1 CLAUDE_CONFIG_DIR=/tmp/cockpit-test-config node bin/install.js
```

On Windows (PowerShell):

```powershell
$env:COCKPIT_SANDBOX = "1"
$env:CLAUDE_CONFIG_DIR = "$env:TEMP\cockpit-test-config"
node bin/install.js
```

The installer respects `CLAUDE_CONFIG_DIR` as the target instead of `~/.claude`, and `COCKPIT_SANDBOX=1` enables verbose logging and skips any system-level side effects (e.g. Windows Terminal profile mutations, login auto-start entries).

### What to verify

- The files you expect appear in the temp `CLAUDE_CONFIG_DIR`.
- Running the installer a second time produces no errors and no duplicate entries.
- Your feature's hook or script works correctly when invoked manually.
- If your feature modifies external config (e.g. Windows Terminal settings), verify the backup file is created and the merge is clean.

### Platform notes

If your change is Windows-only, test on Windows. If it claims to be cross-platform, test on at least one non-Windows platform (or note in your PR that you cannot and ask a maintainer to verify).

---

## Code Style

These rules are non-negotiable because they protect every user who runs the one-line install:

| Rule | Rationale |
|------|-----------|
| **Zero runtime dependencies** | The installer runs before `npm install` is even possible. Every file must work with Node.js built-ins only. |
| **Cross-platform awareness** | Use `path.join()` and `os.homedir()`, never hardcoded `/` or `\` separators. Check `process.platform` before running Windows-only code. |
| **Sanitize personal paths in output** | Never log or print the full value of `~`, `HOME`, `USERPROFILE`, or any path that contains a username. Replace with `~` in all user-facing messages. |
| **No telemetry, no network calls** | The only allowed outbound network call is `cockpit update` (a git pull). Features must never phone home. |
| **Readable hooks** | PowerShell hooks must be short, commented, and auditable by a non-expert. Avoid clever one-liners that obscure intent. |
| **Idempotent installs** | Every write to an external file must be safe-merge, never overwrite. Backups before mutations. |
| **No secrets in the repo** | `.gitignore` already blocks env/pat/key/token files and `settings.json`. Never commit real config. |

Code formatting: 2-space indentation, single quotes in JavaScript, clear variable names. There is no linter enforced yet — use good judgment.

---

## Submitting a Pull Request

1. Ensure your branch is up to date with `main`.
2. Confirm sandbox install passes with no errors.
3. Open a PR with a clear title and description:
   - **What** the change does.
   - **Why** it is needed.
   - **Platform** it applies to.
   - **How you tested it** (paste the sandbox command you ran and its output summary).
4. For new features, confirm that all four steps under [How to Add a Feature](#how-to-add-a-feature) are complete.
5. A maintainer will review and may request changes. Please respond within a reasonable time or the PR may be closed.

For bug reports or feature requests that you are not implementing yourself, open a GitHub Issue with as much detail as possible: platform, Node version, Claude Code version, and the exact error or behavior.

Thank you for making Claude Cockpit better.
