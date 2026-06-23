#!/usr/bin/env node
"use strict";
/*
 * Claude Cockpit installer — cross-platform, zero dependencies.
 * Installs ONLY the features enabled in config.json into your Claude config dir,
 * substitutes branding + path tokens, and SAFE-MERGES settings.json (your existing
 * settings, tokens and hooks are preserved; a backup is written).
 *
 * Usage:  node bin/install.js
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const HOME = os.homedir();
const CLAUDE_HOME = process.env.CLAUDE_CONFIG_DIR || path.join(HOME, ".claude");
const IS_WIN = process.platform === "win32";
const NODE = process.execPath;

// ---------- pretty output ----------
const paint = (code, s) => `\x1b[${code}m${s}\x1b[0m`;
const ok = (s) => console.log(paint("38;2;195;232;141", "  ✓ ") + s);
const info = (s) => console.log(paint("38;2;130;170;255", "  • ") + s);
const warn = (s) => console.log(paint("38;2;255;199;119", "  ! ") + s);
const head = (s) => console.log("\n" + paint("1;38;2;199;146;234", s));

// ---------- helpers ----------
function readJson(p, def) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return def; } }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function deepMerge(base, over) {
  if (over === undefined) return base;
  if (Array.isArray(over)) return over.slice();
  if (over && typeof over === "object" && base && typeof base === "object" && !Array.isArray(base)) {
    const out = Object.assign({}, base);
    for (const k of Object.keys(over)) out[k] = deepMerge(base[k], over[k]);
    return out;
  }
  return over;
}
const USER_CFG = path.join(CLAUDE_HOME, "cockpit.config.json");
// Source of truth = the user's saved config (survives updates), layered over the repo defaults
// so brand-new feature keys appear with sane defaults without ever clobbering the user's choices.
function loadConfig() {
  const example = readJson(path.join(ROOT, "config.example.json"), {});
  const repo = readJson(path.join(ROOT, "config.json"), null); // optional maintainer override
  const user = readJson(USER_CFG, null);                       // the user's choices
  return deepMerge(deepMerge(example, repo || {}), user || {});
}

const cfg = loadConfig();
const brand = Object.assign(
  { name: "Claude Cockpit", tagline: "Supercharged Claude Code", company: "FAMIT", showCompanyCredit: true, logoFile: "branding/logo.txt" },
  cfg.brand || {}
);
const feat = Object.assign(
  { statusline: true, sounds: true, voice: true, clipboardImage: true, banner: true, terminalTheme: true, fileBrowser: true, commands: true, agents: true, outputStyles: true, safetyGuard: true },
  cfg.features || {}
);

const fwd = (p) => p.replace(/\\/g, "/");
function subst(text) {
  return text
    .split("{{CLAUDE_HOME}}").join(fwd(CLAUDE_HOME))
    .split("{{HOME}}").join(fwd(HOME))
    .split("{{BRAND}}").join(brand.name)
    .split("{{COMPANY}}").join(brand.company);
}
function copyFile(srcPath, destPath, doSubst) {
  let data = fs.readFileSync(srcPath);
  if (doSubst) data = Buffer.from(subst(data.toString("utf8")), "utf8");
  ensureDir(path.dirname(destPath));
  fs.writeFileSync(destPath, data);
}
function copyDir(srcDir, destDir, doSubst) {
  if (!fs.existsSync(srcDir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, e.name), d = path.join(destDir, e.name);
    if (e.isDirectory()) n += copyDir(s, d, doSubst);
    else { copyFile(s, d, doSubst); n++; }
  }
  return n;
}

// ---------- install ----------
head("┌ Claude Cockpit — installer");
info(`Claude config dir : ${CLAUDE_HOME}`);
info(`Platform          : ${process.platform}`);
info(`Brand             : ${brand.name}  (credit: ${brand.company})`);
ensureDir(CLAUDE_HOME);

// runtime config + branding (banner & updater read these). Write the MERGED config back so new
// feature defaults appear over time while the user's saved choices survive every update.
fs.writeFileSync(path.join(CLAUDE_HOME, "cockpit.config.json"), JSON.stringify(cfg, null, 2));
copyDir(path.join(ROOT, "branding"), path.join(CLAUDE_HOME, "branding"), false);

head("Features");

// 1) Status line (cross-platform)
if (feat.statusline) {
  copyFile(path.join(SRC, "statusline.js"), path.join(CLAUDE_HOME, "statusline.js"), true);
  let ui;
  if (cfg.statusline && cfg.statusline.show) {
    ui = { show: cfg.statusline.show, tokensCap: cfg.statusline.tokensCap || 1000000, compressImages: true, maxImageDim: 1280 };
  } else {
    ui = readJson(path.join(SRC, "ui-config.json"), {});
  }
  fs.writeFileSync(path.join(CLAUDE_HOME, "ui-config.json"), JSON.stringify(ui, null, 2));
  ok("Status line — real tokens vs auto-compact, limits, timer, live clock");
}

// 2) Slash commands / agents / output styles (cross-platform)
if (feat.commands) { const n = copyDir(path.join(SRC, "commands"), path.join(CLAUDE_HOME, "commands"), true); ok(`${n} slash commands (/ui /powers /files /fix /ship …)`); }
if (feat.agents) { const n = copyDir(path.join(SRC, "agents"), path.join(CLAUDE_HOME, "agents"), true); if (n) ok(`${n} agent(s) (e.g. /explainer)`); }
if (feat.outputStyles) { const n = copyDir(path.join(SRC, "output-styles"), path.join(CLAUDE_HOME, "output-styles"), true); if (n) ok(`${n} output style(s) (Founder Mode)`); }

// 3) Hooks (PowerShell — Windows)
if (IS_WIN) {
  const hk = (name) => copyFile(path.join(SRC, "hooks", name), path.join(CLAUDE_HOME, "hooks", name), true);
  if (feat.safetyGuard) hk("safety-guard.ps1");
  if (feat.sounds || feat.voice) ["sound-smart.ps1", "sound-needyou.ps1", "sound-done.ps1", "prompt-timer.ps1"].forEach(hk);
  if (feat.clipboardImage) ["clip-watch.ps1", "clip-image.ps1", "clip-attach.ps1"].forEach(hk);
  if (feat.safetyGuard || feat.sounds || feat.voice || feat.clipboardImage) ok("Hooks — sound + voice alerts, clipboard image paste, safety guard");
} else if (feat.sounds || feat.clipboardImage || feat.safetyGuard) {
  warn(`Sound / clipboard / safety hooks are Windows-only for now — skipped on ${process.platform}.`);
}

// 4) Welcome banner (Windows)
if (feat.banner && IS_WIN) { copyFile(path.join(SRC, "terminal", "claude-launch.ps1"), path.join(CLAUDE_HOME, "claude-launch.ps1"), true); ok("Welcome banner (your logo + subtle credit)"); }

// 5) File browser configs
if (feat.fileBrowser) {
  copyFile(path.join(SRC, "filekit", "micro-settings.json"), path.join(HOME, ".config", "micro", "settings.json"), false);
  const yaziDir = IS_WIN && process.env.APPDATA ? path.join(process.env.APPDATA, "yazi", "config") : path.join(HOME, ".config", "yazi");
  copyFile(path.join(SRC, "filekit", "yazi.toml"), path.join(yaziDir, "yazi.toml"), false);
  ok("File-browser configs (yazi + micro) — install the tools per docs/file-browser.md");
}

// 6) settings.json SAFE-MERGE (never clobbers existing settings / secrets)
mergeSettings();

// 7) Windows extras (best-effort; skipped in sandbox/CI)
const SANDBOX = !!process.env.COCKPIT_SANDBOX;
if (IS_WIN && feat.terminalTheme && !SANDBOX) tryWindowsTerminal();
if (IS_WIN && feat.clipboardImage && !SANDBOX) tryClipStartup();
if (SANDBOX) info("Sandbox mode — skipped Windows Terminal + Startup changes.");

head("└ Done.");
ok(`Installed into ${CLAUDE_HOME}`);
console.log(`
  ${paint("38;2;199;146;234", "Next:")}
    1. ${paint("1", "Restart Claude Code")} (or open a new terminal) — the live status line turns on at startup.
    2. Make it yours: edit ${paint("38;2;134;225;252", path.join(CLAUDE_HOME, "branding", "logo.txt"))} (your logo)
       and ${paint("38;2;134;225;252", path.join(CLAUDE_HOME, "cockpit.config.json"))} (your name).
    3. Update any time:  ${paint("1", "cockpit update")}   (or /cockpit inside Claude)

  ${paint("38;2;90;96;130", "by " + brand.company)}
`);

function mergeSettings() {
  const p = path.join(CLAUDE_HOME, "settings.json");
  if (fs.existsSync(p)) fs.copyFileSync(p, p + ".cockpit-backup");
  const s = readJson(p, {});

  if (feat.statusline) {
    s.statusLine = { type: "command", command: `"${NODE}" "${path.join(CLAUDE_HOME, "statusline.js")}"`, refreshInterval: 1 };
  }

  s.hooks = s.hooks || {};
  const addHook = (event, command, matcher) => {
    s.hooks[event] = s.hooks[event] || [];
    const present = s.hooks[event].some((m) => (m.hooks || []).some((h) => h.command === command));
    if (present) return;
    const entry = { hooks: [{ type: "command", command }] };
    if (matcher !== undefined) entry.matcher = matcher;
    s.hooks[event].push(entry);
  };
  if (IS_WIN) {
    const ps = (script) => `powershell -NoProfile -ExecutionPolicy Bypass -File "${path.join(CLAUDE_HOME, "hooks", script)}"`;
    if (feat.safetyGuard) addHook("PreToolUse", ps("safety-guard.ps1"), "");
    if (feat.sounds || feat.voice) {
      addHook("Stop", ps("sound-smart.ps1"));
      addHook("Notification", ps("sound-needyou.ps1"));
      addHook("UserPromptSubmit", ps("prompt-timer.ps1"));
    }
    if (feat.clipboardImage) addHook("UserPromptSubmit", ps("clip-attach.ps1"));
  }

  ensureDir(CLAUDE_HOME);
  fs.writeFileSync(p, JSON.stringify(s, null, 2));
  ok("settings.json merged — your existing settings + secrets preserved (backup: settings.json.cockpit-backup)");
}

function tryWindowsTerminal() {
  try {
    const fragPath = path.join(SRC, "terminal", "windows-terminal.fragment.json");
    if (!fs.existsSync(fragPath)) return;
    const frag = JSON.parse(subst(fs.readFileSync(fragPath, "utf8")));
    const wt = path.join(process.env.LOCALAPPDATA || "", "Packages", "Microsoft.WindowsTerminal_8wekyb3d8bbwe", "LocalState", "settings.json");
    if (!fs.existsSync(wt)) { warn("Windows Terminal settings not found — skipped theme (you may not use WT)."); return; }
    fs.copyFileSync(wt, wt + ".cockpit-backup");
    const s = readJson(wt, {});
    // color scheme
    s.schemes = s.schemes || [];
    for (const sc of (frag.schemes || [])) if (!s.schemes.some((x) => x.name === sc.name)) s.schemes.push(sc);
    // profiles (by guid)
    s.profiles = s.profiles || {}; s.profiles.list = s.profiles.list || [];
    for (const pr of (frag.profiles || [])) if (!s.profiles.list.some((x) => x.guid === pr.guid)) s.profiles.list.push(pr);
    // keybindings (by keys)
    s.keybindings = s.keybindings || [];
    for (const kb of (frag.keybindings || [])) if (!s.keybindings.some((x) => x.keys === kb.keys)) s.keybindings.push(kb);
    fs.writeFileSync(wt, JSON.stringify(s, null, 4));
    ok("Windows Terminal theme + Ctrl+Shift+E file browser (profiles added, default unchanged; backup written)");
  } catch (e) { warn("Windows Terminal theme step skipped: " + e.message); }
}

function tryClipStartup() {
  try {
    const startup = path.join(process.env.APPDATA || "", "Microsoft", "Windows", "Start Menu", "Programs", "Startup");
    if (!fs.existsSync(startup)) return;
    const watcher = path.join(CLAUDE_HOME, "hooks", "clip-watch.ps1");
    const vbs = `Set s = CreateObject("WScript.Shell")\r\ns.Run "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -STA -File ""${watcher}""", 0, False\r\n`;
    fs.writeFileSync(path.join(startup, "cockpit-clip-watch.vbs"), vbs);
    ok("Clipboard image watcher set to auto-start on login");
  } catch (e) { warn("Clipboard auto-start step skipped: " + e.message); }
}
