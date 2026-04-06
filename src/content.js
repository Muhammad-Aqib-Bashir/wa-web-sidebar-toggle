/**
 * WA Web Sidebar Toggle — content.js
 *
 * Strategy:
 *   1. Wait for WhatsApp Web to finish loading (the navbar and sidebar panel).
 *   2. Inject a toggle button above the "Chats" navbar item.
 *   3. On click: animate the sidebar out, expand the chat pane.
 *      On click again: restore everything.
 *   4. Persist state across page navigations via sessionStorage.
 *   5. Re-attach if WhatsApp does a soft-navigation (SPA route change).
 */

(function () {
  "use strict";

  /* ─────────────────────────── Constants ─────────────────────────── */

  const EXTENSION_ID = "wa-sidebar-toggle";
  const BTN_ID = `${EXTENSION_ID}-btn`;
  const STORAGE_KEY = `${EXTENSION_ID}-hidden`;
  const HIDDEN_CLASS = `${EXTENSION_ID}-sidebar-hidden`;

  /* Selectors derived from the provided DOM snapshot */
  const SELECTORS = {
    /* The left column that contains the header + chat list */
    sidebar: '[class*="_aigw"][class*="_as6h"]',
    /* Fallback: the pane identified by id */
    sidePane: "#side",
    /* The vertical navbar on the far left (Chats, Status, Channels…) */
    navbar:
      '[class*="x1c4vz4f"][class*="xs83m0k"][class*="xdl72j9"][class*="x1g77sc7"]',
    /* The first button in the navbar (Chats) — we inject ABOVE this */
    firstNavBtn: '[data-navbar-item="true"][data-navbar-item-index="0"]',
    /* The right-side chat/main panel */
    mainPanel: "#main",
  };

  /* ─────────────────────────── Helpers ───────────────────────────── */

  const log = (...args) => console.log(`[${EXTENSION_ID}]`, ...args);

  function isSidebarHidden() {
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  }

  function setSidebarHidden(val) {
    sessionStorage.setItem(STORAGE_KEY, String(val));
  }

  /**
   * Robustly find an element with a compound class-substring query.
   * WhatsApp uses hashed class names but they tend to be stable per build.
   */
  function findSidebar() {
    /* Try the compound selector first */
    const el = document.querySelector(SELECTORS.sidebar);
    if (el) return el;
    /* Fallback: find the element that contains #side */
    const pane = document.querySelector(SELECTORS.sidePane);
    return pane ? pane.closest("[class]") : null;
  }

  function findNavContainer() {
    const firstBtn = document.querySelector(SELECTORS.firstNavBtn);
    if (!firstBtn) return null;

    // span → div (item wrapper) → div (nav list container)
    return firstBtn.parentElement?.parentElement?.parentElement;
  }

  /* ─────────────────────────── Toggle Logic ──────────────────────── */

  function applySidebarState(hidden, animate = true) {
    const sidebar = findSidebar();
    if (!sidebar) return;

    document.documentElement.classList.toggle(HIDDEN_CLASS, hidden);

    if (hidden) {
      if (animate) {
        sidebar.style.transition =
          "opacity 200ms ease, transform 200ms ease, width 280ms cubic-bezier(0.4,0,0.2,1)";
      }
      sidebar.style.opacity = "0";
      sidebar.style.pointerEvents = "none";
      sidebar.style.overflow = "hidden";

      /* After the opacity fades, collapse the width */
      setTimeout(
        () => {
          sidebar.style.transition = animate
            ? "width 280ms cubic-bezier(0.4,0,0.2,1), min-width 280ms cubic-bezier(0.4,0,0.2,1)"
            : "none";
          sidebar.style.width = "0";
          sidebar.style.minWidth = "0";
          sidebar.style.maxWidth = "0";
          sidebar.style.flexBasis = "0";
        },
        animate ? 180 : 0,
      );
    } else {
      sidebar.style.transition = animate
        ? "width 280ms cubic-bezier(0.4,0,0.2,1), min-width 280ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease"
        : "none";
      sidebar.style.width = "";
      sidebar.style.minWidth = "";
      sidebar.style.maxWidth = "";
      sidebar.style.flexBasis = "";
      sidebar.style.pointerEvents = "";
      sidebar.style.overflow = "";

      setTimeout(
        () => {
          sidebar.style.opacity = "1";
        },
        animate ? 240 : 0,
      );
    }

    updateButton(hidden);
  }

  function toggleSidebar() {
    const newHidden = !isSidebarHidden();
    setSidebarHidden(newHidden);
    applySidebarState(newHidden, true);
  }

  /* ─────────────────────────── Button ────────────────────────────── */

  function createToggleButton() {
    const originalBtn = document.querySelector(SELECTORS.firstNavBtn);
    if (!originalBtn) return null;

    // Clone the WHOLE wrapper (span → button → inner UI)
    const wrapper = originalBtn.closest("span")?.cloneNode(true);
    if (!wrapper) return null;

    const btn = wrapper.querySelector("button");

    // Unique ID
    btn.id = BTN_ID;

    // Accessibility
    btn.setAttribute("aria-label", "Toggle sidebar");
    btn.setAttribute("title", "Toggle sidebar");
    btn.setAttribute("aria-pressed", String(isSidebarHidden()));
    btn.setAttribute("data-navbar-item", "true");

    // Remove WhatsApp-specific selection state
    btn.removeAttribute("data-navbar-item-selected");
    btn.removeAttribute("data-navbar-item-index");

    // Replace icon
    const iconContainer = btn.querySelector("[data-icon]");
    if (iconContainer) {
      iconContainer.innerHTML = buildSVG(isSidebarHidden());
      iconContainer.removeAttribute("data-icon");
    }

    // Remove unread badge (important)
    const badge = btn.querySelector("[aria-label]");
    if (badge && badge !== btn) {
      badge.remove();
    }

    // Fix tabindex (WhatsApp uses -1, but we want keyboard access)
    btn.setAttribute("tabindex", "0");

    // Click + keyboard
    btn.onclick = toggleSidebar;
    btn.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSidebar();
      }
    };

    return wrapper;
  }

  function buildSVG(isHidden) {
    /* Two-panel icon: when visible show "collapse left", when hidden show "expand right" */
    if (isHidden) {
      /* Expand / show sidebar icon */
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true" focusable="false">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/>
        <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" stroke-width="1.6"/>
        <polyline points="5.5,10 7.5,12 5.5,14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>`;
    } else {
      /* Collapse / hide sidebar icon */
      return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true" focusable="false">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/>
        <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" stroke-width="1.6"/>
        <polyline points="7.5,10 5.5,12 7.5,14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>`;
    }
  }

  function updateButton(isHidden) {
    const btn = document.getElementById(BTN_ID);
    if (!btn) return;

    btn.setAttribute("aria-pressed", String(isHidden));
    btn.setAttribute("title", isHidden ? "Show sidebar" : "Hide sidebar");
    btn.setAttribute("aria-label", isHidden ? "Show sidebar" : "Hide sidebar");

    const iconContainer = btn.querySelector("svg")?.parentElement;
    if (iconContainer) {
      iconContainer.innerHTML = buildSVG(isHidden);
    }
  }

  /* ─────────────────────────── Injection ─────────────────────────── */

  function injectButton() {
    if (document.getElementById(BTN_ID)) return;

    const container = findNavContainer();
    if (!container) return false;

    const btn = createToggleButton();
    if (!btn) return false;

    // Insert as FIRST nav item
    container.insertBefore(btn, container.firstElementChild);

    log("Toggle button injected.");
    return true;
  }

  /* ─────────────────────────── Initialisation ────────────────────── */

  function init() {
    if (injectButton()) {
      /* Restore persisted state without animation on first load */
      if (isSidebarHidden()) {
        applySidebarState(true, false);
      }
    }
  }

  /**
   * WhatsApp Web is a SPA. We use a MutationObserver to detect when the
   * navbar is rendered or replaced, then re-inject our button.
   */
  let retryTimer = null;

  function scheduleRetry(ms = 800) {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      if (!document.getElementById(BTN_ID)) {
        log("Retrying injection…");
        init();
      }
    }, ms);
  }

  const observer = new MutationObserver(() => {
    const hasNavBtn = !!document.querySelector(SELECTORS.firstNavBtn);
    const hasBtnAlready = !!document.getElementById(BTN_ID);

    if (hasNavBtn && !hasBtnAlready) {
      scheduleRetry(300);
    }
  });

  /* Start observing once the DOM is sufficiently ready */
  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleRetry(1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  /* ─────────────────── Global keyboard shortcut ──────────────────── */
  /* Alt + S (or Option + S on macOS) to toggle without mouse */
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "s" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      toggleSidebar();
    }
  });
})();
