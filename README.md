# WA Web Sidebar Toggle

A production-ready Chrome extension that adds a sleek toggle button to WhatsApp Web, letting you instantly hide or reveal the chat sidebar for a distraction-free, full-screen conversation experience.

---

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

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `wa-sidebar-toggle` folder
6. Open [WhatsApp Web](https://web.whatsapp.com) — the toggle button appears above the Chats icon in the left navbar

### From Chrome Web Store

*(Coming soon)*

---

## Usage

| Action | Result |
|---|---|
| Click the **⊞ panel icon** above Chats | Hides the sidebar, chat panel expands to fill screen |
| Click the icon again | Restores the sidebar |
| Press `Alt + S` | Toggles sidebar from keyboard |

The button icon changes direction to indicate the current state:
- **← arrow** (pointing left) = sidebar is visible, click to hide
- **→ arrow** (pointing right) = sidebar is hidden, click to show

---

## How It Works

The extension injects a content script and stylesheet into `web.whatsapp.com`. A `MutationObserver` watches for WhatsApp Web's SPA navigation to re-inject the button if the page soft-navigates. The sidebar is toggled via CSS width/opacity transitions — no DOM nodes are removed, so WhatsApp's internal React state is never disturbed.

---

## Privacy

This extension:
- Reads **no** messages, contacts, or any WhatsApp data
- Makes **no** network requests
- Stores only a single boolean (`wa-sidebar-toggle-hidden`) in `sessionStorage` — this never leaves your browser and is cleared when you close the tab

---

## Browser Support

| Browser | Supported |
|---|---|
| Chrome 109+ | ✅ |
| Edge 109+ | ✅ (Chromium-based) |
| Brave | ✅ |
| Firefox | ⚠️ Requires Manifest V2 conversion |
| Safari | ❌ |

---

## Permissions Requested

| Permission | Reason |
|---|---|
| `host_permissions: web.whatsapp.com` | Required to inject the toggle button into WhatsApp Web |

No other permissions are requested.

---

## Contributing

Pull requests welcome. Please open an issue first for major changes.

---

## License

MIT © 2026
