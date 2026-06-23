#!/usr/bin/env node
// Claude Code status line — ONE compact line, truecolor, zero deps.
// Order: model -> context(real tokens) -> 5h -> weekly -> edits -> timer -> clock -> dir.
// BULLETPROOF: any failure -> safe minimal line (NEVER blank) + error logged to .sl-error.log.
let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => main());
const _t = setTimeout(() => main(), 800); // never hang blank if stdin stays open

let _ran = false;
function done(s) {
  try { clearTimeout(_t); } catch (_) {}
  try { process.stdout.write(s); } catch (_) {}
}
function main() {
  if (_ran) return; _ran = true;
  let fsmod, pathmod;
  try { fsmod = require("fs"); pathmod = require("path"); } catch (_) {}
  let d = {};
  try { let s = raw || "{}"; if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1); d = JSON.parse(s); } catch (_) { d = {}; }
  try {
    done(render(d, fsmod, pathmod));
  } catch (e) {
    try { if (fsmod) fsmod.appendFileSync(pathmod.join(__dirname, ".sl-error.log"), new Date().toISOString() + "  " + ((e && e.stack) || String(e)) + "\n"); } catch (_) {}
    done(safeLine(d));
  }
}

// Minimal line that cannot throw — shown only if the rich render fails.
function safeLine(d) {
  let dir = "~", model = "Claude", clk = "";
  try { dir = String((d && d.workspace && d.workspace.current_dir) || (d && d.cwd) || "~").split(/[\\/]/).filter(Boolean).pop() || "~"; } catch (_) {}
  try { model = (d && d.model && d.model.display_name) || "Claude"; } catch (_) {}
  try { const n = new Date(); const p = (x) => String(x).padStart(2, "0"); clk = p(n.getHours()) + ":" + p(n.getMinutes()) + ":" + p(n.getSeconds()); } catch (_) {}
  return "\x1b[38;2;199;146;234m▌\x1b[0m \x1b[1m🤖 " + model + "\x1b[0m \x1b[38;2;125;135;178m🕐 " + clk + " 📂 " + dir + "\x1b[0m";
}

function render(d, fsmod, pathmod) {
  let show = {
    model: true, effort: true, ctx: true, ctxCap: true, bars: true,
    limit5h: true, limit7d: true, resets: false, cost: false, burn: false,
    timer: true, clock: true, clockSeconds: true, edits: true,
    dir: true, branch: true, pills: true,
  };
  let tokensCap = 1000000;
  try {
    const cfg = JSON.parse(fsmod.readFileSync(pathmod.join(__dirname, "ui-config.json"), "utf8"));
    if (cfg && cfg.show) show = Object.assign(show, cfg.show);
    if (cfg && cfg.tokensCap) tokensCap = Number(cfg.tokensCap);
  } catch (_) {}

  const fg = (r, g, b) => `\x1b[38;2;${r};${g};${b}m`;
  const bg = (r, g, b) => `\x1b[48;2;${r};${g};${b}m`;
  const R = "\x1b[0m";
  const B = "\x1b[1m";
  const C = {
    gray: fg(125, 135, 178), red: fg(255, 117, 127), grn: fg(195, 232, 141),
    yel: fg(255, 199, 119), blu: fg(130, 170, 255), mag: fg(199, 146, 234), cyn: fg(134, 225, 252),
  };

  const num = (v) => (v == null || v === "" ? null : Number(v));
  const round = (v) => (v == null ? null : Math.round(v));
  const heat = (p) => (p == null ? C.gray : p >= 80 ? C.red : p >= 50 ? C.yel : C.grn);
  const bar = (p) => {
    if (p == null) return "";
    const w = 5, f = Math.max(0, Math.min(w, Math.round((p / 100) * w)));
    return " " + heat(p) + "▰".repeat(f) + C.gray + "▱".repeat(w - f);
  };
  const resetIn = (s) => {
    if (!s) return null;
    let ms = s * 1000 - Date.now();
    if (ms <= 0) return "now";
    let m = Math.floor(ms / 60000);
    const day = Math.floor(m / 1440); m -= day * 1440;
    const h = Math.floor(m / 60); m -= h * 60;
    if (day > 0) return `${day}d${h}h`;
    if (h > 0) return `${h}h${m}m`;
    return `${m}m`;
  };
  const fmtDur = (ms) => {
    if (!ms) return null;
    let s = Math.round(ms / 1000);
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    if (h > 0) return `${h}h${m}m`;
    if (m > 0) return `${m}m${s}s`;
    return `${s}s`;
  };
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtTok = (n) => {
    if (n == null) return null;
    if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
    return (n / 1000).toFixed(1) + "k";
  };
  const ctxTokens = (file) => {
    if (!file || !fsmod) return null;
    try {
      const fd = fsmod.openSync(file, "r");
      const size = fsmod.fstatSync(fd).size;
      const len = Math.min(size, 262144);
      const buf = Buffer.alloc(len);
      if (len > 0) fsmod.readSync(fd, buf, 0, len, size - len);
      fsmod.closeSync(fd);
      const lines = buf.toString("utf8").split(/\r?\n/);
      for (let i = lines.length - 1; i >= 0; i--) {
        if (!lines[i]) continue;
        let o; try { o = JSON.parse(lines[i]); } catch (_) { continue; }
        const u = o && o.message && o.message.usage;
        if (u) return (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
      }
    } catch (_) {}
    return null;
  };

  const cwd = (d.workspace && d.workspace.current_dir) || d.cwd || "~";
  const dir = String(cwd).replace(/[\\/]+$/, "").split(/[\\/]/).pop() || cwd;
  let branch = null;
  try {
    const head = fsmod.readFileSync(pathmod.join(cwd, ".git", "HEAD"), "utf8").trim();
    branch = head.startsWith("ref:") ? head.replace(/^ref:\s*refs\/heads\//, "") : head.slice(0, 7);
  } catch (_) {}
  const model = (d.model && d.model.display_name) || "Claude";
  const effort = d.effort && d.effort.level ? d.effort.level : null;

  const cw = d.context_window || {};
  let tok = (typeof cw.total_input_tokens === "number" && cw.total_input_tokens > 0)
    ? cw.total_input_tokens
    : ctxTokens(d.transcript_path || d.transcriptPath);
  let cap = (typeof cw.context_window_size === "number" && cw.context_window_size > 0)
    ? cw.context_window_size : tokensCap;
  let ctxPct = (tok != null && cap > 0) ? Math.min(100, Math.round((tok / cap) * 100)) : null;

  const rl = d.rate_limits || {};
  const p5 = round(num((rl.five_hour || {}).used_percentage));
  const p7 = round(num((rl.seven_day || {}).used_percentage));
  const r5 = resetIn((rl.five_hour || {}).resets_at);
  const r7 = resetIn((rl.seven_day || {}).resets_at);

  const cost = d.cost && d.cost.total_cost_usd != null ? d.cost.total_cost_usd : null;
  const durMs = d.cost ? d.cost.total_duration_ms : null;
  const burn = durMs && durMs > 0 && cost != null ? cost / (durMs / 3600000) : null;
  const added = d.cost && d.cost.total_lines_added;
  const removed = d.cost && d.cost.total_lines_removed;

  const now = new Date();
  let clock = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  if (show.clockSeconds) clock += `:${pad2(now.getSeconds())}`;

  const parts = [];
  if (show.model) parts.push(`${C.mag}${B}🤖 ${model}${R}${show.effort && effort ? `${C.gray} ${effort}` : ""}`);
  if (show.ctx && tok != null) {
    const col = ctxPct == null ? C.cyn : heat(ctxPct);
    let s = `${C.gray}🧠 ${col}${B}${fmtTok(tok)}${R}`;
    if (show.ctxCap) s += `${C.gray} /${fmtTok(cap)}`;
    if (show.bars && ctxPct != null) s += bar(ctxPct);
    if (ctxPct != null && ctxPct >= 80) s += ` ${C.red}⚠`;
    parts.push(s);
  } else if (show.ctx && cw.used_percentage != null) {
    const p = round(num(cw.used_percentage));
    parts.push(`${C.gray}🧠 ${heat(p)}${p}%${show.bars ? bar(p) : ""}`);
  }
  if (show.limit5h && p5 != null) parts.push(`${C.gray}🔋 5 hour ${heat(p5)}${p5}%${show.bars ? bar(p5) : ""}${show.resets && r5 ? `${C.gray} ⟳${r5}` : ""}`);
  if (show.limit7d && p7 != null) parts.push(`${C.gray}🔋 weekly ${heat(p7)}${p7}%${show.bars ? bar(p7) : ""}${show.resets && r7 ? `${C.gray} ⟳${r7}` : ""}`);
  if (show.edits && (added || removed)) parts.push(`${C.grn}✏ +${added || 0}${C.gray}/${C.red}-${removed || 0}`);
  if (show.timer) { const st = fmtDur(durMs); if (st) parts.push(`${C.gray}⌛ ${st}`); }
  if (show.cost && cost != null) {
    let s = `${C.grn}💲$${cost.toFixed(2)}`;
    if (show.burn && burn != null) s += `${C.yel} 🔥$${burn < 10 ? burn.toFixed(1) : Math.round(burn)}/hr`;
    parts.push(s);
  }
  if (show.clock) parts.push(`${C.gray}🕐 ${clock}`);
  if (show.dir) parts.push(`${C.blu}📂 ${dir}`);
  if (show.branch && branch) parts.push(`${C.cyn}🌿 ${branch}`);

  let body;
  if (show.pills) {
    const PILL = bg(22, 26, 45);
    body = parts.map((p) => `${PILL} ${p} ${R}`).join(" ");
  } else {
    body = parts.join(` ${C.gray}·${R} `);
  }
  return `${C.mag}▌${R} ` + body + R;
}
