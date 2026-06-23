# Security Policy

## Supported Versions

Claude Cockpit follows a **rolling release** model. Only the latest version on the `main` branch receives security fixes.

| Version / Branch | Supported |
|-----------------|-----------|
| `main` (latest) | Yes |
| Any pinned older commit | No — please update to `main` |

If you are running a pinned commit and cannot update, mention this in your report and we will assess on a case-by-case basis.

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.** Public issues expose the vulnerability to everyone before a fix is available.

### Preferred method — GitHub private security advisory

1. Go to **[github.com/kunal-7x/claude-cockpit/security/advisories/new](https://github.com/kunal-7x/claude-cockpit/security/advisories/new)**.
2. Fill in the title, description, and affected versions.
3. Submit. The advisory is private — only you and the maintainer (@kunal-7x) can see it until it is published.

GitHub's advisory system supports back-and-forth discussion, draft patches, and coordinated disclosure timelines, all within the private channel.

### Alternative — direct email

If for any reason the advisory form does not work for you, email **axcrioinfra@gmail.com** with the subject line `[claude-cockpit SECURITY]`. Include as much detail as you can: the vulnerability class, steps to reproduce, potential impact, and any proof-of-concept code.

---

## What to include in your report

A good report helps us reproduce and fix the issue quickly:

- **Vulnerability class** (e.g., command injection, path traversal, privilege escalation, supply-chain risk)
- **Affected component** (installer, a specific hook, the update mechanism, etc.)
- **Steps to reproduce** — the more specific the better
- **Impact** — what can an attacker do, and under what conditions?
- **Suggested fix** — optional, but welcome
- **Your preferred credit** — how you would like to be acknowledged (name, handle, or anonymous)

---

## Responsible Disclosure Expectations

We commit to:

- **Acknowledge** your report within **3 business days**.
- **Provide an initial assessment** (confirmed / not confirmed / needs more info) within **7 business days**.
- **Keep you informed** of progress. If a fix takes longer than expected, we will tell you why.
- **Credit you** in the advisory and in the changelog when the fix is published, unless you prefer to remain anonymous.
- **Not pursue legal action** against researchers who act in good faith under these guidelines.

We ask that you:

- Give us a **reasonable time to fix** the issue before publishing details publicly. We aim for a 30-day turnaround for most issues; complex supply-chain issues may need 90 days. We will negotiate a timeline with you.
- **Avoid accessing, modifying, or deleting user data** during research.
- **Limit testing to your own installations** — do not test against other users' machines.
- **Avoid denial-of-service** techniques.

---

## Scope

### In scope

- The installer (`install.ps1`, `install.sh`, `bin/install.js`) — injection, privilege escalation, malicious file writes
- Hook scripts — unintended code execution, data exfiltration, sandbox escapes
- The `cockpit update` flow — supply-chain attacks, untrusted code execution
- The `safetyGuard` hook — bypasses that allow blocked commands to run
- The clipboard watcher — unauthorized clipboard access or image exfiltration
- The safe-merge logic — scenarios where a merge could overwrite user secrets
- The `.gitignore` boundary — scenarios where secrets could be inadvertently committed

### Out of scope

- Issues in **Claude Code itself** (Anthropic's CLI) — report those to Anthropic directly
- Issues in **Node.js**, **Windows Terminal**, or **Windows** — report those to the respective vendors
- Vulnerabilities that require the attacker to already have write access to `~/.claude/` or `~/.cockpit/` (that access is already equivalent to code execution)
- Social-engineering attacks (e.g., tricking a user into running a fake cockpit command)
- The curl|bash / irm|iex bootstrapping pattern itself — this is an acknowledged trade-off documented in [docs/SECURITY.md](docs/SECURITY.md#5-the-curlbash--irmiex-consideration) with safer alternatives provided

---

## Security Architecture Summary

For a full explanation of what the installer reads and writes, the safe-merge guarantee, the zero-telemetry policy, and what each hook does, see **[docs/SECURITY.md](docs/SECURITY.md)**.

Short version:

- **Zero telemetry.** No analytics, no crash reporting, no usage tracking. Ever.
- **One network call.** Only `cockpit update` makes an outbound connection (a `git pull` to GitHub over HTTPS). Normal operation is fully offline.
- **Safe-merge, not overwrite.** Your `settings.json`, API tokens, and existing hooks are never replaced — only cockpit's own keys are added, idempotently.
- **Backup before every merge.** A verbatim copy of `settings.json` is saved to `settings.json.cockpit-backup` before any modification.
- **Short, readable hooks.** No obfuscation, no minification. Every hook is a standalone script you can read and understand in minutes.
- **No bundled third-party dependencies** in the install path — only Node.js built-ins.

---

*Maintainer: Kunal Kumar ([@kunal-7x](https://github.com/kunal-7x))*
