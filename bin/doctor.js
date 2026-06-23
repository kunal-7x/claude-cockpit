#!/usr/bin/env node
"use strict";
/* cockpit doctor — quick health check of your install. Exit 0 = healthy. */
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");
const HOME = os.homedir();
const CLAUDE_HOME = process.env.CLAUDE_CONFIG_DIR || path.join(HOME, ".claude");
const paint = (c, s) => `\x1b[${c}m${s}\x1b[0m`;
const ok = (s) => console.log(paint("38;2;195;232;141", "  ✓ ") + s);
const bad = (s) => { console.log(paint("38;2;255;117;127", "  ✗ ") + s); fails++; };
const warn = (s) => console.log(paint("38;2;255;199;119", "  ! ") + s);
const head = (s) => console.log("\n" + paint("1;38;2;199;146;234", s));
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return d; } };
let fails = 0;

head("Claude Cockpit — doctor");
console.log(paint("38;2;125;135;178", "  config dir: " + CLAUDE_HOME));

const major = parseInt(process.versions.node.split(".")[0], 10);
if (major >= 16) ok("Node.js " + process.versions.node);
else bad("Node.js " + process.versions.node + " — need >= 16");

const s = readJson(path.join(CLAUDE_HOME, "settings.json"), null);
if (!s) bad("settings.json not found in " + CLAUDE_HOME);
else {
  if (s.statusLine && /statusline\.js/i.test(JSON.stringify(s.statusLine))) ok("status line wired into settings.json");
  else warn("status line not in settings.json (statusline feature off?)");
  const hookCount = s.hooks ? Object.values(s.hooks).reduce((a, b) => a + (Array.isArray(b) ? b.length : 0), 0) : 0;
  ok(hookCount + " hook entr" + (hookCount === 1 ? "y" : "ies") + " registered");
  if (fs.existsSync(path.join(CLAUDE_HOME, "settings.json.cockpit-backup"))) ok("settings.json backup present");
  else warn("no settings.json backup found");
}

const sl = path.join(CLAUDE_HOME, "statusline.js");
if (fs.existsSync(sl)) {
  if (cp.spawnSync(process.execPath, ["--check", sl]).status === 0) ok("statusline.js parses");
  else bad("statusline.js has a syntax error");
  const r = cp.spawnSync(process.execPath, [sl], { input: '{"model":{"display_name":"Opus"},"context_window":{"total_input_tokens":1000,"context_window_size":1000000}}', encoding: "utf8" });
  if (r.stdout && r.stdout.length > 0) ok("statusline.js renders a line");
  else warn("statusline.js produced no output");
} else warn("statusline.js not installed (statusline feature off?)");

if (fs.existsSync(path.join(CLAUDE_HOME, "cockpit.config.json"))) ok("cockpit.config.json present");
else warn("cockpit.config.json missing — run 'cockpit configure'");

const cmdDir = path.join(CLAUDE_HOME, "commands");
if (fs.existsSync(cmdDir)) { const n = fs.readdirSync(cmdDir).filter((f) => f.endsWith(".md")).length; if (n) ok(n + " slash commands installed"); }

head(fails === 0 ? "All good ✅" : fails + " issue(s) found ❌");
console.log(paint("38;2;125;135;178", "  'cockpit update' re-applies everything · 'cockpit configure' changes features\n"));
process.exit(fails === 0 ? 0 : 1);
