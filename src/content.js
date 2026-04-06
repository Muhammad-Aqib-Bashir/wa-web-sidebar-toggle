/**
 * WA Web Sidebar Toggle — content.js  v2.0
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

  /* ── IDs & keys ─────────────────────────────────────────────────── */
  const EXT = "wa-sidebar-toggle";
  const BTN_ID = `${EXT}-btn`;
  const KEY = `${EXT}-hidden`;
  const HTML_CLS = `${EXT}-hidden`; // added to <html> when sidebar is hidden

  /* ── Selectors ──────────────────────────────────────────────────── */
  // The Chats button — our most reliable anchor point.
  const SEL_CHATS_BTN = '[data-navbar-item-index="0"]';

  // The sidebar panel: element that directly contains #side.
  const SEL_SIDE = "#side";

  /* ── State ──────────────────────────────────────────────────────── */
  let retryTimer = null;

  /* ── Helpers ────────────────────────────────────────────────────── */
  const log = (...a) => console.log(`[${EXT}]`, ...a);

  const isHidden = () => sessionStorage.getItem(KEY) === "true";
  const setHidden = (v) => sessionStorage.setItem(KEY, String(v));

  /**
   * Find the nav items column — the direct parent of the Chats button's
   * wrapping <span>.  From the real DOM:
   *   column-div > span > button[data-navbar-item-index="0"]
   * so: button → parentElement(span) → parentElement(column-div)
   */
  function findNavColumn() {
    const chatsBtn = document.querySelector(SEL_CHATS_BTN);
    if (!chatsBtn) return null;
    return chatsBtn.parentElement?.parentElement ?? null;
  }

  /**
   * Find the sidebar panel element to collapse.
   * #side's parent is the full left column including WA's own header.
   * If the parent looks wrong, fall back to #side itself.
   */
  function findSidebarPanel() {
    const side = document.querySelector(SEL_SIDE);
    if (!side) return null;
    const parent = side.parentElement;
    if (
      !parent ||
      parent === document.body ||
      parent === document.documentElement
    ) {
      return side;
    }
    return parent;
  }

  /* ── SVG icons ──────────────────────────────────────────────────── */
  /**
   * Panel-split icon.
   *   hidden=false  → left panel visible
   *   hidden=true   → left panel gone
   */
  function iconSVG(hidden) {
    return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      ${
        hidden
          ? `<path d="M7 8v8" />`
          : `<rect x="6.5" y="7.5" width="4" height="9" rx=".5" fill="black" stroke="black" />`
      }
      <rect x="3" y="4" width="18" height="16" rx="2.186" />
    </svg>`;
  }

  function buildButtonWrapper() {
    // 1. The outermost container div (The "Slot")
    const slot = document.createElement("div");
    slot.className =
      "x1c4vz4f xs83m0k xdl72j9 x1g77sc7 x78zum5 xozqiw3 x1oa3qoh x12fk4p8 xeuugli x2lwn1j x1nhvcw1 x1q0g3np x1cy8zhl x100vrsf x1vqgdyp xhslqc4 x1ekkm8c x1143rjc xum4auv xj21bgg x1277o0a x13i9f1t xr9ek0c xjpr12u";

    // 2. The Span wrapper (Standard WA wrapper)
    const span = document.createElement("span");
    span.className =
      "html-span xdj266r x14z9mp xat24cr x1lziwak xexx8yu xyri2b x18d9i69 x1c1uobl x1hl2dhg x16tdsg8 x1vvkbs x4k7w5x x1h91t0o x1h9r5lt x1jfb8zj xv2umb2 x1beo9mf xaigb6o x12ejxvf x3igimt xarpa2k xedcshv x1lytzrv x1t2pt76 x7ja8zs x1qrby5j";

    // 3. The Button
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.setAttribute("tabindex", "0");
    btn.setAttribute("data-navbar-item", "true");
    btn.setAttribute("data-navbar-item-index", "0");
    btn.className =
      "xjb2p0i xk390pu x1heor9g x1ypdohk xjbqb8w x972fbf x10w94by x1qhh985 x14e42zd xtnn1bt x9v5kkp xmw7ebm xrdum7p xt8t1vi x1xc408v x129tdwq x15urzxu xh8yej3 x1y1aw1k xf159sx xwib8y2 xmzvs34";

    // 4. Inner Structure
    btn.innerHTML = `
    <div class="x1c4vz4f xs83m0k xdl72j9 x1g77sc7 x78zum5 xozqiw3 x1oa3qoh x12fk4p8 xeuugli x2lwn1j x1nhvcw1 x1q0g3np x6s0dn4 xh8yej3 x1n2onr6">
      <div style="flex-grow: 1;">
        <div>
          <span aria-hidden="true" class="${EXT}-icon">
            ${iconSVG(isHidden())}
          </span>
        </div>
      </div>
    </div>`;

    btn.addEventListener("click", onToggleClick);

    span.appendChild(btn);
    slot.appendChild(span);

    // 5. Create HR element
    const hr = document.createElement("hr");
    hr.className =
      "xh8yej3 xjm9jq1 x178xt8z x13fuv20 xx42vgk x18oe1m7 x1sy0etr xstzfhl";

    // 6. Wrap both slot and hr in a fragment or container
    const container = document.createDocumentFragment();
    container.appendChild(slot);
    container.appendChild(hr);

    return container;
  }

  /* ── Toggle ─────────────────────────────────────────────────────── */
  function onToggleClick() {
    const next = !isHidden();
    setHidden(next);
    applySidebarState(next, true);
  }

  /**
   * Core show / hide.
   *
   * We collapse the sidebar panel (parent of #side) by animating its width
   * to zero in two phases: fade → then collapse.  The CSS rule in content.css
   * makes #main fill the freed space via flex.
   */
  function applySidebarState(hidden, animate) {
    const panel = findSidebarPanel();
    if (!panel) {
      log("sidebar panel not found");
      return;
    }

    const EASE = "cubic-bezier(0.4,0,0.2,1)";

    if (hidden) {
      // Phase 1 – fade out
      panel.style.transition = animate ? `opacity 150ms ease` : "none";
      panel.style.opacity = "0";
      panel.style.pointerEvents = "none";

      // Phase 2 – collapse width (after fade)
      setTimeout(
        () => {
          panel.style.transition = animate
            ? `width 260ms ${EASE}, min-width 260ms ${EASE}, max-width 260ms ${EASE}`
            : "none";
          panel.style.overflow = "hidden";
          panel.style.width = "0";
          panel.style.minWidth = "0";
          panel.style.maxWidth = "0";

          // Tell CSS to expand #main
          document.documentElement.classList.add(HTML_CLS);

          // Clean up transition property after animation completes
          setTimeout(() => {
            panel.style.transition = "";
          }, 280);
        },
        animate ? 155 : 0,
      );
    } else {
      // Expand width first, then fade in
      document.documentElement.classList.remove(HTML_CLS);

      panel.style.transition = animate
        ? `width 260ms ${EASE}, min-width 260ms ${EASE}, max-width 260ms ${EASE}`
        : "none";
      panel.style.width = "";
      panel.style.minWidth = "";
      panel.style.maxWidth = "";
      panel.style.overflow = "";

      setTimeout(
        () => {
          panel.style.transition = animate ? `opacity 200ms ease` : "none";
          panel.style.opacity = "1";
          panel.style.pointerEvents = "";

          setTimeout(() => {
            panel.style.transition = "";
          }, 220);
        },
        animate ? 240 : 0,
      );
    }

    refreshButton(hidden);
  }

  /* ── Button state sync ──────────────────────────────────────────── */
  function refreshButton(hidden) {
    const btn = document.getElementById(BTN_ID);
    if (!btn) return;

    // Update ARIA and Titles
    const label = hidden ? "Show sidebar" : "Hide sidebar";
    btn.setAttribute("aria-pressed", String(hidden));
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);

    // Update the Icon
    const iconSpan = btn.querySelector(`.${EXT}-icon`);
    if (iconSpan) iconSpan.innerHTML = iconSVG(hidden);

    // Match the "Selected" background highlight
    // The slot (outermost div) gets the highlight class in WA
    const slot = btn.closest(".x1c4vz4f");
    if (slot) {
      if (hidden) {
        slot.classList.add("x14ug900", "xzs022t");
        btn.setAttribute("data-navbar-item-selected", "true");
      } else {
        slot.classList.remove("x14ug900", "xzs022t");
        btn.setAttribute("data-navbar-item-selected", "false");
      }
    }
  }

  /* ── Injection ──────────────────────────────────────────────────── */
  function inject() {
    if (document.getElementById(BTN_ID)) return true;

    const chatsBtn = document.querySelector(SEL_CHATS_BTN);
    if (!chatsBtn) {
      log("Chats button not ready");
      return false;
    }

    const wrapper = buildButtonWrapper();

    // Chats button's closest parent that wraps nav items
    const navItemWrapper = chatsBtn.closest('div[class*="x1c4vz4f"]');
    if (navItemWrapper && navItemWrapper.parentElement) {
      navItemWrapper.parentElement.insertBefore(wrapper, navItemWrapper);
      log("button injected ✓");
    } else {
      log("cannot find proper parent to insert button");
      return false;
    }

    // Restore persisted state without animation on first load
    if (isHidden()) applySidebarState(true, false);

    return true;
  }

  /* ── MutationObserver + retry loop ─────────────────────────────── */
  const observer = new MutationObserver(() => {
    if (
      document.querySelector(SEL_CHATS_BTN) &&
      !document.getElementById(BTN_ID)
    ) {
      scheduleRetry(250);
    }
  });

  function scheduleRetry(ms) {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      if (!inject()) scheduleRetry(800);
    }, ms);
  }

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleRetry(1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  /* ── Keyboard shortcut: Alt+S ───────────────────────────────────── */
  document.addEventListener("keydown", (e) => {
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      onToggleClick();
    }
  });
})();
