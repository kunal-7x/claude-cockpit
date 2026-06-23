#!/usr/bin/env node
"use strict";
/* Interactive configurator — pick features + set your brand, then apply. Zero deps. */
const fs = require("fs"), os = require("os"), path = require("path"), readline = require("readline"), cp = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CLAUDE_HOME = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
const USER_CFG = path.join(CLAUDE_HOME, "cockpit.config.json");
const paint = (c, s) => `\x1b[${c}m${s}\x1b[0m`;
const MAG = "1;38;2;199;146;234", CY = "38;2;134;225;252", GR = "38;2;125;135;178", GRN = "38;2;195;232;141";
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return d; } };

const cfg = readJson(USER_CFG, null) || readJson(path.join(ROOT, "config.example.json"), {});
cfg.brand = cfg.brand || {};
cfg.features = cfg.features || {};

const FEATURES = [
  ["statusline", "Live status line (real tokens, limits, timer, clock)"],
  ["sounds", "Sound chime when Claude finishes        (Windows)"],
  ["voice", "Voice — speak Claude's messages          (Windows)"],
  ["clipboardImage", "Clipboard image paste — screenshot+Ctrl+V (Windows)"],
  ["banner", "Rebrandable welcome banner               (Windows)"],
  ["terminalTheme", "Neon terminal theme + Ctrl+Shift+E files  (Windows)"],
  ["fileBrowser", "In-terminal file browser (yazi + micro)"],
  ["commands", "18 slash commands"],
  ["agents", "Explainer agent"],
  ["outputStyles", "Founder Mode output style"],
  ["safetyGuard", "Safety guard — block catastrophic commands"],
];

function save() {
  fs.mkdirSync(CLAUDE_HOME, { recursive: true });
  fs.writeFileSync(USER_CFG, JSON.stringify(cfg, null, 2));
  console.log(paint(GRN, `\n  ✓ Saved ${USER_CFG}`));
  console.log(paint(GR, `  Tip: drop your own ASCII logo at ${path.join(CLAUDE_HOME, "branding", "logo.txt")}`));
}
function apply() {
  console.log(paint(GR, "\n  Applying…\n"));
  const r = cp.spawnSync(process.execPath, [path.join(__dirname, "install.js")], { stdio: "inherit" });
  process.exit(r.status == null ? 1 : r.status);
}

if (!process.stdin.isTTY) {
  console.log(paint(GR, "Non-interactive shell — keeping current config and applying."));
  apply();
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));
  (async () => {
    console.log(paint(MAG, "\n  Claude Cockpit — configure\n"));
    const name = (await ask(`  Brand name [${paint(CY, cfg.brand.name || "Claude Cockpit")}]: `)).trim();
    if (name) cfg.brand.name = name;

    console.log(`\n  Presets:  ${paint(CY, "1")} Everything   ${paint(CY, "2")} Status line only   ${paint(CY, "3")} Custom`);
    const preset = (await ask("  Choose [1]: ")).trim() || "1";
    if (preset === "1") {
      FEATURES.forEach(([k]) => (cfg.features[k] = true));
    } else if (preset === "2") {
      FEATURES.forEach(([k]) => (cfg.features[k] = k === "statusline" || k === "commands"));
    } else {
      console.log(paint(GR, "\n  y = on, n = off, Enter = keep current\n"));
      for (const [k, desc] of FEATURES) {
        const cur = cfg.features[k] !== false;
        const a = (await ask(`  ${desc}  [${cur ? "Y/n" : "y/N"}]: `)).trim().toLowerCase();
        cfg.features[k] = a === "y" ? true : a === "n" ? false : cur;
      }
    }
    rl.close();
    save();
    apply();
  })();
}
