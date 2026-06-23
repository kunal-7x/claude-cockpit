# File Browser

The `fileBrowser` feature configures [yazi](https://github.com/sxyazi/yazi) (a terminal file manager) and [micro](https://micro-editor.github.io/) (a terminal editor) so you can browse and edit files without leaving your terminal. It also benefits from several helper tools: **fd**, **ripgrep**, **fzf**, and **eza**.

This feature is **optional**. Enable it in `~/.claude/cockpit.config.json`:

```json
{
  "features": {
    "fileBrowser": true
  }
}
```

You must install the tools yourself — cockpit configures them but does not install them.

---

## Installing the tools

### Windows (winget)

Open a terminal and run:

```powershell
# Required
winget install sxyazi.yazi
winget install zyedidia.micro

# Recommended helpers (yazi uses these for previews and search)
winget install sharkdp.fd
winget install BurntSushi.ripgrep.MSVC
winget install junegunn.fzf
winget install eza-community.eza
```

After installing, restart your terminal so the new commands are on `PATH`.

> **Note:** winget is included with Windows 10 1709+ and Windows 11. If `winget` is not found, install it from the [Microsoft Store](https://apps.microsoft.com/detail/9NBLGGH4NNS1) (App Installer).

---

### macOS (Homebrew)

```bash
# Required
brew install yazi
brew install micro

# Recommended helpers
brew install fd
brew install ripgrep
brew install fzf
brew install eza
```

If Homebrew is not installed, follow the instructions at [brew.sh](https://brew.sh).

---

### Linux

#### Ubuntu / Debian (apt)

yazi is not in the default apt repositories for most Debian/Ubuntu versions. Use cargo to install it.

```bash
# micro
sudo apt install micro

# fd (note: binary may be named 'fdfind')
sudo apt install fd-find

# ripgrep
sudo apt install ripgrep

# fzf
sudo apt install fzf

# eza (Ubuntu 23.10+ / Debian 13+)
sudo apt install eza
# If unavailable: cargo install eza

# yazi — install via cargo (Rust package manager)
cargo install yazi-fm yazi-cli
```

If `cargo` is not installed: `curl https://sh.rustup.rs -sSf | sh`, then open a new shell.

> **fd alias:** On Ubuntu/Debian the `fd-find` package installs the binary as `fdfind`. Add an alias so yazi can find it:
> ```bash
> echo 'alias fd=fdfind' >> ~/.bashrc && source ~/.bashrc
> ```

#### Arch Linux (pacman)

```bash
# Required
sudo pacman -S yazi
sudo pacman -S micro

# Recommended helpers
sudo pacman -S fd
sudo pacman -S ripgrep
sudo pacman -S fzf
sudo pacman -S eza
```

#### Fedora / RHEL (dnf)

```bash
# micro
sudo dnf install micro

# yazi — not in default repos; install via cargo:
cargo install yazi-fm yazi-cli

# Recommended helpers
sudo dnf install fd-find
sudo dnf install ripgrep
sudo dnf install fzf
sudo dnf install eza
```

---

## Verifying the installation

Run each command to confirm it is on your `PATH`:

```bash
yazi --version
micro --version
fd --version
rg --version
fzf --version
eza --version
```

All six should print a version number without errors.

---

## Using the file browser

### Opening yazi

Press **Ctrl+Shift+E** in your terminal. This splits a new pane and launches yazi beside your Claude Code session.

> **Requires:** the `terminalTheme` feature enabled (Windows Terminal). That feature wires up the Ctrl+Shift+E key binding. On macOS/Linux, launch yazi directly by typing `yazi` in any terminal.

You will see a three-column view:

| Column | Shows |
|--------|-------|
| Left | Parent directory |
| Center | Current directory (focused) |
| Right | Preview of the selected file or directory |

### Navigating

| Key | Action |
|-----|--------|
| Arrow keys (or `h` `j` `k` `l`) | Move between files and directories |
| Enter | Open the selected item |
| `Backspace` or `h` | Go up to the parent directory |
| `/` | Search files by name (uses fd if installed) |
| `q` | Quit yazi |

### Opening a file in micro

1. Navigate to the file using the arrow keys.
2. Press **Enter**.

micro opens inline in the terminal — no separate window.

### Editing in micro

| Key | Action |
|-----|--------|
| Arrow keys | Move cursor |
| Type normally | Insert text |
| **Ctrl+S** | Save the file |
| **Ctrl+Q** | Quit micro |
| **Ctrl+Z** | Undo |
| **Ctrl+F** | Find |
| **Ctrl+G** | Go to line number |

micro uses familiar key bindings (similar to most GUI editors) and requires no configuration to use.

---

## What cockpit configures

When `fileBrowser: true` is set and you run `cockpit update` (or the initial install), cockpit writes configuration files for yazi (`~/.config/yazi/yazi.toml` and related files) that:

- Register micro as the default editor when you press Enter on a file
- Enable eza for directory listings if eza is installed
- Wire fd and ripgrep for yazi's built-in search (`/` inside yazi)
- Enable fzf-powered fuzzy jump (`z` inside yazi, requires `zoxide` optionally)

These files are managed by cockpit and regenerated on `cockpit update`. To add your own customizations, place them below the `# USER OVERRIDES` comment that cockpit inserts — cockpit will not modify lines below that marker on future updates.

---

## Disabling the feature

Set `fileBrowser` to `false` in `~/.claude/cockpit.config.json` and run:

```bash
cockpit update
```

This removes the cockpit-managed yazi configuration. The tools themselves (yazi, micro, etc.) remain installed — use your package manager to remove them if you no longer need them.

---

## Troubleshooting

**yazi opens but shows no previews**
Install the helper tools (`fd`, `ripgrep`, `eza`). yazi works without them but previews and search require them.

**Ctrl+Shift+E does nothing**
This key binding is set by the `terminalTheme` feature in Windows Terminal. Enable `terminalTheme` in your config and run `cockpit update`, then restart Windows Terminal.

**micro is not the editor that opens**
Check that `micro` is on your `PATH` (`micro --version`). If your `$EDITOR` environment variable points to another editor, yazi will prefer it. Unset `$EDITOR` or point it to micro:

```bash
export EDITOR=micro
```

**"cargo: command not found" on Linux**
Install Rust: `curl https://sh.rustup.rs -sSf | sh`, open a new shell, then retry the `cargo install` commands.

**"fdfind: command not found" inside yazi on Ubuntu/Debian**
The `fd-find` package installs the binary as `fdfind`. Add `alias fd=fdfind` to your shell profile (see the Ubuntu section above).
