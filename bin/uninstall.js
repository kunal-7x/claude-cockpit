#!/usr/bin/env node
"use strict";
/* Uninstall Claude Cockpit — restore settings backups + remove only cockpit's own files. Safe. */
const fs = require("fs"), os = require("os"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const HOME = os.homedir();
const CLAUDE_HOME = process.env.CLAUDE_CONFIG_DIR || path.join(HOME, ".claude");

const paint = (c, s) => `\x1b[${c}m${s}\x1b[0m`;
const ok = (s) => console.log(paint("38;2;195;232;141", "  ✓ ") + s);
const info = (s) => console.log(paint("38;2;130;170;255", "  • ") + s);
const warn = (s) => console.log(paint("38;2;255;199;119", "  ! ") + s);
const head = (s) => console.log("\n" + paint("1;38;2;199;146;234", s));
const rm = (p) => { try { if (fs.existsSync(p)) { fs.rmSync(p, { recursive: true, force: true }); return true; } } catch (e) {} return false; };
const names = (d) => { try { return fs.readdirSync(path.join(SRC, d)); } catch (e) { return []; } };

head("┌ Claude Cockpit — uninstall");
info(`Claude config dir : ${CLAUDE_HOME}`);

// 1) settings.json — restore from cockpit backup (cleanly undoes the statusLine + hook merge)
const sp = path.join(CLAUDE_HOME, "settings.json");
if (fs.existsSync(sp + ".cockpit-backup")) {
  try { fs.copyFileSync(sp + ".cockpit-backup", sp); ok("Restored settings.json from backup (your original settings + secrets)"); }
  catch (e) { warn("Could not restore settings.json: " + e.message); }
} else {
  warn("No settings.json backup found — remove cockpit's statusLine/hooks manually if needed.");
}

// 2) Windows Terminal — restore from backup if present
const wt = path.join(process.env.LOCALAPPDATA || "", "Packages", "Microsoft.WindowsTerminal_8wekyb3d8bbwe", "LocalState", "settings.json");
if (fs.existsSync(wt + ".cockpit-backup")) {
  try { fs.copyFileSync(wt + ".cockpit-backup", wt); ok("Restored Windows Terminal settings from backup"); } catch (e) {}
}

// Signal a running clipboard watcher to stop (it checks this flag each loop, then exits + releases its mutex)
try { fs.writeFileSync(path.join(CLAUDE_HOME, ".cockpit-clip-stop"), "stop"); } catch (e) {}

// 3) Remove installed component files (only the ones cockpit ships)
["statusline.js", "ui-config.json", "cockpit.config.json", "claude-launch.ps1"].forEach((f) => rm(path.join(CLAUDE_HOME, f)));
rm(path.join(CLAUDE_HOME, "branding"));
names("commands").forEach((f) => rm(path.join(CLAUDE_HOME, "commands", f)));
names("agents").forEach((f) => rm(path.join(CLAUDE_HOME, "agents", f)));
names("output-styles").forEach((f) => rm(path.join(CLAUDE_HOME, "output-styles", f)));
names("hooks").forEach((f) => rm(path.join(CLAUDE_HOME, "hooks", f)));
ok("Removed cockpit component files (your own commands/agents/hooks are untouched)");

// 4) clipboard watcher auto-start
const vbs = path.join(process.env.APPDATA || "", "Microsoft", "Windows", "Start Menu", "Programs", "Startup", "cockpit-clip-watch.vbs");
if (rm(vbs)) ok("Removed clipboard watcher auto-start");

head("└ Done.");
console.log(`
  ${paint("38;2;199;146;234", "Cockpit removed from " + CLAUDE_HOME + ".")}
  ${paint("38;2;125;135;178", "The clone at " + path.join(HOME, ".cockpit") + " is left in place — delete it to fully remove,")}
  ${paint("38;2;125;135;178", "and remove that folder from PATH if you added the 'cockpit' command.")}
  Restart Claude Code / open a new terminal for changes to take effect.
`);
