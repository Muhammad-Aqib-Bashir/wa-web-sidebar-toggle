# Changelog

All notable changes to this project will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.2] — 2026-09-01

### Added

- 6 more languages to the `I18N` dictionary — Albanian, Chinese (Hong Kong), Hausa, Irish,
  Macedonian, and Uzbek — plus a `fil` alias for the existing Filipino/Tagalog translation,
  bringing coverage to 72 languages (all languages in Meta's official WhatsApp language list)
- CI now validates that every icon path in `manifest.json` actually exists on disk, and
  runs `node --check` on `background.js`, `popup/popup.js`, and the release scripts (not
  just `src/content.js`) — this would have caught the icon-path bug fixed below automatically

### Fixed

- `manifest.json` pointed the 32px and 64px icon slots at `icon128.png` instead of the
  actual `icon32.png`/`icon64.png` files
- `icons/iocn32.png` was a typo'd filename (fixed to `icon32.png`, referenced correctly
  in the manifest)
- The popup's LinkedIn social icon had `aria-label="GitHub profile"`, and the Freelancer
  icon had `aria-label="X profile"` — both mismatched their actual link destinations,
  which screen reader users would have heard incorrectly
- `docs/index.html` (the public landing page) claimed "zero permissions" / "no special
  permissions" in six places, despite the extension requesting the `storage` permission —
  now accurately describes it as `storage` + `web.whatsapp.com` access only
- `docs/index.html` also claimed the project was "MIT licensed" in four places; corrected
  to GPL v3 to match the actual `LICENSE` file

## [0.3.1] — 2026-07-28

### Fixed

- Tooltip on the toggle button stayed open after a click instead of
  dismissing immediately, unlike WhatsApp's own nav-rail buttons (Chats,
  Status, etc.) — it now hides on click and reappears normally the next
  time the pointer leaves and re-enters the button

## [0.3.0] — 2026-07-28

### Added

- Multi-language support (66 languages) for the toggle button's tooltip,
  its `aria-label`, and the row injected into WhatsApp's native
  _Keyboard shortcuts_ modal — driven by WhatsApp Web's own
  `document.documentElement.lang`, not the browser's language, so it
  matches what's actually shown on screen
- `I18N` dictionary in `src/content.js`, with graceful fallback to the
  base language code (e.g. `pt-BR` → `pt`) and finally to English for
  any language not yet translated

### Fixed

- Toggle button silently failed to inject on any non-English WhatsApp
  Web locale (reported on Italian): the injection anchor selector
  (`button[aria-label="Chats"]`) only ever matched the English label, so
  the button never appeared at all once WhatsApp's UI language changed.
  Injection now falls back to the language-independent
  `button[data-navbar-item="true"]` attribute when the English label
  isn't present.
- Nav-rail detection heuristic (`navLabels`) was English/Spanish only;
  broadened alongside the language work so it isn't the false negative
  it used to be on other locales

## [0.2.0] — 2025-07-01

### Added

- Toolbar popup with extension info, GitHub/review/Upwork/Freelancer.com/coffee links
- One-time "pin this extension" banner in the popup (dismissed state persisted via `chrome.storage`)
- Welcome/onboarding page opened automatically on first install
- Keyboard shortcut `Alt+S` now appears in WhatsApp's own built-in _Keyboard shortcuts_ modal
- Background service worker (`background.js`) for first-install event
- Automated CI pipeline (validate + build on every push/PR)
- Automated release pipeline (build + publish to Chrome Web Store on `vX.Y.Z` tag)
- `scripts/version.js` — bumps `manifest.json`, commits, and tags in one command
- `scripts/build.sh` — produces a versioned `.zip` artifact

### Fixed

- Stray chat-list header bar (`.x570efc …`) now hidden alongside the panel
- Tooltip clipped by WhatsApp's header positioning context — rebuilt as a
  body-level `position: fixed` element so it escapes the clipping ancestor

## [0.1.0] — 2025-06-28

### Added

- Toggle button injected into WhatsApp's navigation rail (before the Chats item)
- Sidebar collapse/expand using `flex: 0 0 0%` on every collapsible layout slot,
  so it works on all tabs (Chats, Status, Communities, Settings)
- `MutationObserver` + 1.5 s interval to reapply state after WhatsApp re-renders
- Smooth eased transition (400 ms) on collapse/expand
- `sessionStorage` used to persist hidden/shown state within the tab session
- `Alt+S` keyboard shortcut

### Fixed

- Initial approach targeting `#side` by id was unreliable when switching tabs —
  replaced with structural nav-rail detection + collapse-everything-else strategy

## [0.0.0] — 2025-06-21

### Added

- Initial scaffold: `manifest.json`, `src/content.js`, `src/content.css`, icons
