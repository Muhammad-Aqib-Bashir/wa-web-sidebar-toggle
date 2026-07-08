# WA Web Sidebar Toggle

A small Chrome extension that adds a button (and an `Alt+S` shortcut) to [WhatsApp Web](https://web.whatsapp.com) to hide or show the left sidebar the chat list, status list, communities list, or settings panel so you can read or write a single conversation without the rest of your inbox staring back at you.

No accounts, no servers, no analytics. It touches only `web.whatsapp.com`, requests zero permissions, and does its work entirely client-side.

![Manifest V3](https://img.shields.io/badge/manifest-v3-blue)
![Permissions](https://img.shields.io/badge/permissions-none-brightgreen)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/EXTENSION_ID.svg)](https://chromewebstore.google.com/detail/EXTENSION_ID)
[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](LICENSE)

## Features

- **One-click toggle** — hide or show the sidebar instantly with a smooth animation
- **Keyboard shortcut** — `Alt + S` (Windows/Linux) / `Option + S` (macOS) to toggle without touching the mouse
- **State persistence** — your preference is remembered across page refreshes (per session)
- **Zero permissions** — no access to your messages, contacts, or any data
- **Accessible** — full ARIA support (`aria-label`, `aria-pressed`), keyboard focusable, visible focus ring
- **Dark mode aware** — adapts to WhatsApp Web's light and dark themes automatically
- **Non-intrusive** — injects a single button that matches WhatsApp Web's native design language

---

## Installation

### From Chrome Web Store

1. Open the extension page on the **Chrome Web Store**.
2. Click **Add to Chrome**.
3. Confirm by clicking **Add extension** in the permission popup.
4. Open or refresh [WhatsApp Web](https://web.whatsapp.com).
5. The sidebar toggle button will appear in the navigation rail within a few seconds.

The extension requires **no permissions**, does not collect data, and runs entirely inside your browser.

### Manual Installation (Developer Mode)

If you prefer to install from source or the extension is not yet available on the Chrome Web Store:

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome (or any Chromium-based browser such as Edge or Brave).
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the project folder containing `manifest.json`.
6. Open or refresh [WhatsApp Web](https://web.whatsapp.com) — the toggle button should appear in the navigation rail within a second or two.

To update a manually installed version, pull the latest changes and click the **Reload** button on the extension card in `chrome://extensions`.

## Usage

| Action                              | How                                                         |
| ----------------------------------- | ----------------------------------------------------------- |
| Toggle the sidebar                  | Click the toggle button in the nav rail, or press `Alt + S` |
| See the shortcut listed in WhatsApp | Open WhatsApp's menu → **Keyboard shortcuts**               |

The hidden/shown state is remembered for the current browser tab session (it resets on a fresh page load), so reopening WhatsApp Web starts from a clean, visible sidebar.

## How it works

WhatsApp Web is a single-page app that re-renders heavily, and its CSS class names are auto-generated and unstable across releases — so this extension deliberately avoids depending on any of WhatsApp's _content-specific_ identifiers (like a particular panel's `id`), since those are the first things to change between tabs or app updates.

Instead, `src/content.js` does roughly this:

1. **Find every top-level layout slot.** WhatsApp wraps each major region (nav rail, side panel, main conversation area) in the same generic flex-item class. The extension queries all of them.
2. **Identify the nav rail, not the panel.** Rather than guessing which slot _is_ the side panel, it scores each slot against a handful of independent signals (does it contain the navigation buttons? is it narrow like an icon rail? does it contain our own injected button?) to figure out which one is _definitely the rail_ — and treats everything else as collapsible.
3. **Collapse the rest.** The non-rail slots get `flex: 0 0 0%` plus zeroed width/min-width/max-width, with a CSS transition, so they shrink to nothing regardless of which tab's content currently lives inside them.
4. **Keep reasserting.** A batched `MutationObserver` (plus a slow interval as a safety net) continuously re-applies the current hidden/shown state, because WhatsApp regularly tears down and rebuilds these wrapper nodes — without this, a collapsed sidebar could silently reappear after switching tabs.

This trades a bit of selector verbosity for resilience: tab-switching, message arrivals, and most WhatsApp UI tweaks shouldn't break it, since none of the logic depends on a specific panel's identity — only on its structural role.

## Building locally

```bash
npm install
npm run build
```

This produces `dist/wa-sidebar-toggle-v<version>.zip`. The build script (`scripts/build.js`) is plain Node.js — it uses the [`yazl`](https://www.npmjs.com/package/yazl) library instead of shelling out to the `zip`/`bash` CLI tools, so `npm run build` works identically on Windows, macOS, and Linux with nothing installed beyond Node.js itself (no WSL, Git Bash, or Cygwin needed). CI builds and uploads the zip on Ubuntu, Windows, and macOS on every push/PR, so a platform-specific regression gets caught automatically.

## Releasing

Version bumps, builds, and Chrome Web Store publishing are automated via GitHub Actions — see [`docs/PUBLISHING.md`](docs/PUBLISHING.md) for the one-time setup and the day-to-day release flow (`npm run release:patch`, then push the tag).

## Project structure

```
wa-sidebar-toggle/
├── manifest.json          # MV3 manifest — no permissions, one content script
├── package.json           # Release tooling only (chrome-webstore-upload-cli)
├── src/
│   ├── content.js          # All toggle, layout-detection, and UI logic
│   └── content.css          # Tooltip styling
├── popup/
│   ├── popup.html           # Toolbar popup — info, GitHub/review/support links
│   ├── popup.css             # WA Web themed styling for the popup
│   └── popup.js               # CONFIG block for links + dynamic name/version
├── icons/                  # Toolbar/extension icons
├── scripts/
│   ├── build.js              # Zips the extension into dist/ (pure Node — works on Windows/macOS/Linux)
│   └── version.js           # Bumps manifest.json + tags the release
├── .github/workflows/
│   ├── ci.yml                # Validates + builds on every push/PR
│   └── release.yml           # Builds + publishes on a vX.Y.Z tag
└── docs/
    └── PUBLISHING.md         # Chrome Web Store credential setup + release flow
```

## Known limitations

- Selectors like `button[aria-label="Chats"]` assume an English UI; non-English WhatsApp locales may not be detected.

## Contributing

Pull requests welcome. Please open an issue first.

---

## License

GPL v3: see [`LICENSE`](LICENSE) for details.
