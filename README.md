<div align="center">

# WA Web Sidebar Toggle

**Hide WhatsApp Web's sidebar with one click. Focus on the chat, not the noise.**

A tiny Chrome extension that adds a button (and an `Alt + S` shortcut) to
[WhatsApp Web](https://web.whatsapp.com) to collapse the chat/status/communities/settings
panel — perfect for screen sharing, distraction-free reading, or just reclaiming screen space.

![Manifest V3](https://img.shields.io/badge/manifest-v3-blue)
![Permissions](https://img.shields.io/badge/permissions-storage%20only-brightgreen)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/kcecmmnkmpoeociooaffmimbpljdmglj.svg)](https://chromewebstore.google.com/detail/kcecmmnkmpoeociooaffmimbpljdmglj?utm_source=github&utm_medium=readme&utm_campaign=organic)
[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](LICENSE)

</div>

---

Click the toggle button in WhatsApp's own nav rail, or press **`Alt + S`** (Windows/Linux) /
**`⌥ Option + S`** (macOS), and the sidebar smoothly slides away — leaving just the
conversation on screen.

## ✨ Features

|                              |                                                                       |
| ---------------------------- | --------------------------------------------------------------------- |
| 🖱️ **One-click toggle**      | Hide or show the sidebar instantly, with a smooth animation           |
| ⌨️ **Keyboard shortcut**     | `Alt + S` — no mouse required                                         |
| 💾 **Remembers your choice** | Persists per tab session (resets on a fresh page load)                |
| 🔒 **Privacy-first**         | No accounts, no servers, no analytics, no message access              |
| ♿ **Accessible**            | Full ARIA support, keyboard focusable, visible focus ring             |
| 🌗 **Theme aware**           | Matches WhatsApp Web's light and dark mode automatically              |
| 🧩 **Feels native**          | Injects one button that matches WhatsApp Web's own design             |
| 🌍 **66 languages**          | Tooltip follows _WhatsApp's_ language setting, not just the browser's |

---

## 🔐 Privacy & permissions

This extension only ever runs on `web.whatsapp.com` and never talks to the network:

- **`storage`** — remembers your sidebar preference in the browser's local storage.
- **Host access to `web.whatsapp.com`** — required so the content script can inject the
  toggle button and read/collapse the page's own layout.

That's it. No `<all_urls>`, no analytics, no external requests, no access to your messages
or contacts. Everything runs client-side in your browser.

---

## 📦 Installation

### Option A — Chrome Web Store (recommended)

1. Open the [extension page on the Chrome Web Store](https://chromewebstore.google.com/detail/kcecmmnkmpoeociooaffmimbpljdmglj).
2. Click **Add to Chrome** → **Add extension**.
3. Open or refresh [WhatsApp Web](https://web.whatsapp.com).
4. The toggle button appears in the nav rail within a few seconds. Done!

### Option B — Manual install (developer mode)

<details>
<summary>Click to expand</summary>

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome (or any Chromium browser — Edge, Brave, etc.).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder containing `manifest.json`.
5. Open or refresh [WhatsApp Web](https://web.whatsapp.com).

To update later: pull the latest changes, then click **Reload** on the extension's card in
`chrome://extensions`.

</details>

---

## 🕹️ Usage

| Action                           | How                                                         |
| -------------------------------- | ----------------------------------------------------------- |
| Toggle the sidebar               | Click the toggle button in the nav rail, or press `Alt + S` |
| See the shortcut inside WhatsApp | Open WhatsApp's menu → **Keyboard shortcuts**               |

> The hidden/shown state is remembered for the current tab session — reopening WhatsApp Web
> in a fresh tab always starts with the sidebar visible.

---

## ⚙️ How it works

WhatsApp Web re-renders constantly, and its CSS class names are auto-generated and unstable
across releases — so this extension deliberately avoids hooking into any WhatsApp
_content-specific_ identifier (like a particular panel's `id`), since those are the first
things to break between tabs or app updates.

Instead, `src/content.js` does roughly this:

1. **Find every top-level layout slot.** WhatsApp wraps each major region (nav rail, side
   panel, main conversation area) in the same generic flex-item class — the extension queries
   all of them.
2. **Identify the nav rail, not the panel.** Rather than guessing which slot _is_ the side
   panel, it scores each slot against several independent signals (does it contain the nav
   buttons? is it a narrow icon rail? does it hold our own injected button?) to determine
   which one is _definitely the rail_ — everything else is treated as collapsible.
3. **Collapse the rest.** The non-rail slots get `flex: 0 0 0%` plus zeroed width/min-width/
   max-width with a CSS transition, so they shrink away regardless of which tab's content
   currently lives inside them.
4. **Keep reasserting.** A batched `MutationObserver` (plus a slow interval as a safety net)
   continuously re-applies the current hidden/shown state, since WhatsApp regularly tears
   down and rebuilds these wrapper nodes — without this, a collapsed sidebar could silently
   pop back open after switching tabs.

This trades a bit of selector verbosity for resilience: tab-switching, incoming messages, and
most WhatsApp UI tweaks shouldn't break it, since the logic only depends on a slot's
_structural role_, never its specific identity.

---

## 🛠️ Building locally

```bash
npm install
npm run build
```

This produces `dist/wa-web-sidebar-toggle-v<version>.zip`. The build script
(`scripts/build.js`) is plain Node.js — it uses [`yazl`](https://www.npmjs.com/package/yazl)
instead of shelling out to `zip`/`bash`, so `npm run build` works identically on Windows,
macOS, and Linux with nothing installed beyond Node.js. CI builds and uploads the zip on
Ubuntu, Windows, and macOS on every push/PR, so a platform-specific regression gets caught
automatically.

## 🚀 Releasing

Version bumps, builds, and Chrome Web Store publishing are automated via GitHub Actions —
see [`docs/PUBLISHING.md`](docs/PUBLISHING.md) for the one-time setup and the day-to-day
release flow (`npm run release:patch`, then push the tag).

---

## 📁 Project structure

```
wa-web-sidebar-toggle/
├── manifest.json          # MV3 manifest — storage permission, one content script
├── package.json           # Release tooling only (chrome-webstore-upload-cli, yazl)
├── src/
│   ├── content.js         # All toggle, layout-detection, and UI logic
│   └── content.css        # Tooltip styling
├── popup/
│   ├── popup.html         # Toolbar popup — info, GitHub/review/support links
│   ├── popup.css          # WA Web themed styling for the popup
│   └── popup.js           # CONFIG block for links + dynamic name/version
├── icons/                 # Toolbar/extension icons (16–256 px)
├── scripts/
│   ├── build.js            # Zips the extension into dist/ (pure Node — cross-platform)
│   └── version.js          # Bumps manifest.json + tags the release
├── .github/workflows/
│   ├── ci.yml               # Validates + builds on every push/PR
│   └── release.yml          # Builds + publishes on a vX.Y.Z tag
└── docs/
    └── PUBLISHING.md        # Chrome Web Store credential setup + release flow
```

---

## 🌍 Language support

The toggle button's tooltip, its `aria-label`, and the row this extension adds to WhatsApp's
own **Keyboard shortcuts** modal are all localized. Rather than reading the browser's
language, the extension reads WhatsApp Web's own `<html lang="...">` attribute — the language
WhatsApp itself is set to — so it matches what's actually on screen even if Chrome's UI
language is different.

<details>
<summary><strong>66 supported languages</strong> (click to expand)</summary>

English, Spanish, Portuguese, Italian, French, German, Dutch, Polish, Turkish, Russian,
Arabic, Hindi, Indonesian, Vietnamese, Thai, Korean, Japanese, Chinese (Simplified &
Traditional), Urdu, Farsi/Persian, Greek, Hungarian, Czech, Ukrainian, Hebrew, Bengali,
Punjabi, Gujarati, Marathi, Tamil, Telugu, Kannada, Malayalam, Sinhala, Nepali, Malay,
Filipino/Tagalog, Khmer, Lao, Burmese, Swahili, Amharic, Romanian, Bulgarian, Croatian,
Serbian, Slovak, Slovenian, Swedish, Norwegian, Danish, Finnish, Estonian, Latvian,
Lithuanian, Georgian, Armenian, Azerbaijani, Kazakh, Mongolian, Catalan, Basque, Galician,
Afrikaans, Zulu.

</details>

If a language isn't in the list yet, the tooltip falls back to English rather than showing
blank or broken text. Adding a new one is a single line in the `I18N` object in
`src/content.js`:

```js
sv: { toggle: "Växla sidofält" }, // Swedish
```

---

## ⚠️ Known limitations

- The `aria-label`/tooltip fall back to English for any WhatsApp language not yet in the
  `I18N` dictionary above.

## 🤝 Contributing

Pull requests welcome — please open an issue first to discuss what you'd like to change.

---

<div align="center">

## 📄 License

GPL v3 — see [`LICENSE`](LICENSE) for details.

</div>
