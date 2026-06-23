#!/usr/bin/env node
"use strict";
/* Claude Cockpit — command dispatcher.  Usage:  cockpit <command> */
const cp = require("child_process");
const path = require("path");

const paint = (c, s) => `\x1b[${c}m${s}\x1b[0m`;
const MAG = "1;38;2;199;146;234", CY = "38;2;134;225;252", GR = "38;2;125;135;178", RED = "38;2;255;117;127";

const cmd = (process.argv[2] || "help").toLowerCase();
const rest = process.argv.slice(3);
const map = {
  install: "install.js", update: "update.js", up: "update.js",
  configure: "configure.js", config: "configure.js",
  uninstall: "uninstall.js", remove: "uninstall.js",
  doctor: "doctor.js", status: "doctor.js", check: "doctor.js",
};

function help() {
  console.log(`
${paint(MAG, "Claude Cockpit")} ${paint(GR, "— supercharge Claude Code")}

  ${paint(CY, "cockpit update")}      pull the latest + apply new features  ${paint(GR, "(keeps your config)")}
  ${paint(CY, "cockpit configure")}   pick features + set your brand name / logo
  ${paint(CY, "cockpit doctor")}      health check ${paint(GR, "(node, settings, hooks, status line)")}
  ${paint(CY, "cockpit uninstall")}   remove cockpit + restore your settings backup
  ${paint(CY, "cockpit install")}     (re)install with the current config

  ${paint(GR, "docs: https://github.com/kunal-7x/claude-cockpit")}
`);
}

if (["help", "--help", "-h", ""].includes(cmd)) { help(); process.exit(0); }
if (["version", "--version", "-v"].includes(cmd)) {
  const pkg = require(path.join(__dirname, "..", "package.json"));
  console.log("claude-cockpit " + pkg.version);
  process.exit(0);
}
const script = map[cmd];
if (!script) {
  console.error(paint(RED, `  Unknown command: ${cmd}`) + paint(GR, "   (try: cockpit help)"));
  process.exit(1);
}
const r = cp.spawnSync(process.execPath, [path.join(__dirname, script), ...rest], { stdio: "inherit" });
process.exit(r.status == null ? 1 : r.status);
