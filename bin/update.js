#!/usr/bin/env node
"use strict";
/* Pull the latest Claude Cockpit and re-run the installer (idempotent — your config is kept). */
const cp = require("child_process");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const paint = (c, s) => `\x1b[${c}m${s}\x1b[0m`;
console.log(paint("1;38;2;199;146;234", "\nClaude Cockpit — update"));

function run(cmd, args) {
  const r = cp.spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" });
  return r.status === 0;
}

const pulled = run("git", ["pull", "--ff-only"]);
if (!pulled) {
  console.log(paint("38;2;255;199;119", "  ! git pull skipped (not a git clone or no network) — reinstalling current files."));
}
const okInstall = run(process.execPath, [path.join(ROOT, "bin", "install.js")]);
process.exit(okInstall ? 0 : 1);
