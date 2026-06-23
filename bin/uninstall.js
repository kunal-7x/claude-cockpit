#!/usr/bin/env node
"use strict";
/* Restore your settings backup and remove Claude Cockpit's own files. Non-destructive to your other config. */
const fs = require("fs");
const os = require("os");
const path = require("path");

const HOME = os.homedir();
const CLAUDE_HOME = process.env.CLAUDE_CONFIG_DIR || path.join(HOME, ".claude");
const paint = (c, s) => `\x1b[${c}m${s}\x1b[0m`;
const ok = (s) => console.log(paint("38;2;195;232;141", "  ✓ ") + s);
const info = (s) => console.log(paint("38;2;130;170;255", "  • ") + s);

console.log(paint("1;38;2;199;146;234", "\nClaude Cockpit — uninstall"));

const sp = path.join(CLAUDE_HOME, "settings.json");
const bak = sp + ".cockpit-backup";
if (fs.existsSync(bak)) { fs.copyFileSync(bak, sp); ok("Restored settings.json from its pre-Cockpit backup"); }
else info("No backup found — your settings.json was left as-is (remove the Cockpit statusLine/hooks by hand if you want).");

const rm = (p) => { try { if (fs.existsSync(p)) { fs.rmSync(p, { recursive: true, force: true }); ok("Removed " + path.basename(p)); } } catch (e) { /* ignore */ } };
["statusline.js", "ui-config.json", "cockpit.config.json", "claude-launch.ps1", "branding"].forEach((f) => rm(path.join(CLAUDE_HOME, f)));

info("Slash commands, agents and hooks were copied into your Claude dir — delete any you no longer want from:");
info("  " + CLAUDE_HOME);
console.log("\n  Done. Restart Claude Code.\n");
