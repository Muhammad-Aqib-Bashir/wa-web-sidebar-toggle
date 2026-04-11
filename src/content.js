(function () {
  "use strict";

  /* ──────────────────────────────────────────────
   * CONFIG & CONSTANTS
   * ────────────────────────────────────────────── */
  const EXT = "wa-web-sidebar-toggle";

  const CONFIG = {
    EXT: EXT,
    BTN_ID: `${EXT}-btn`,
    STORAGE_KEY: `${EXT}-hidden`,
    HTML_CLASS: `${EXT}-hidden`,
    SELECTORS: {
      sidebar: "#side",
      navButtons: 'button[data-navbar-item="true"]',
      chatsBtn: 'button[aria-label="Chats"]',
    },
  };

  const log = (...a) => console.log(`[${EXT}]`, ...a);

  /* ──────────────────────────────────────────────
   * STATE MANAGEMENT
   * ────────────────────────────────────────────── */
  const State = {
    get isHidden() {
      return sessionStorage.getItem(CONFIG.STORAGE_KEY) === "true";
    },
    set isHidden(val) {
      sessionStorage.setItem(CONFIG.STORAGE_KEY, String(val));
    },
  };

  /* ──────────────────────────────────────────────
   * DOM SELECTORS
   * ────────────────────────────────────────────── */
  const DOM = {
    getSidebarPanel() {
      const side = document.querySelector(CONFIG.SELECTORS.sidebar);
      if (!side) return null;
      // Target the x18dvir5 container typically wrapping the sidebar
      return side.closest(".x18dvir5") || side.parentElement || side;
    },
    getToggleButton() {
      return document.getElementById(CONFIG.BTN_ID);
    },
  };

  /* ──────────────────────────────────────────────
   * ASSETS (SVG)
   * ────────────────────────────────────────────── */
  function getIconSVG(hidden) {
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

  /* ──────────────────────────────────────────────
   * CORE LOGIC
   * ────────────────────────────────────────────── */
  const Sidebar = {
    toggle() {
      this.apply(!State.isHidden, true);
    },

    show() {
      if (State.isHidden) this.apply(false, true);
    },

    apply(hide, animate) {
      const panel = DOM.getSidebarPanel();
      if (!panel) return;

      State.isHidden = hide;
      const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

      if (hide) {
        // Hiding logic
        panel.style.transition = animate
          ? `opacity 150ms ease, width 260ms ${EASE}`
          : "none";
        panel.style.opacity = "0";
        panel.style.width = "0";
        panel.style.minWidth = "0";
        panel.style.maxWidth = "0";
        panel.style.overflow = "hidden";
        panel.style.pointerEvents = "none";
        document.documentElement.classList.add(CONFIG.HTML_CLASS);
      } else {
        // Showing logic
        document.documentElement.classList.remove(CONFIG.HTML_CLASS);
        panel.style.transition = animate
          ? `width 260ms ${EASE}, opacity 200ms ease`
          : "none";
        panel.style.width = "";
        panel.style.minWidth = "";
        panel.style.maxWidth = "";
        panel.style.opacity = "1";
        panel.style.overflow = "";
        panel.style.pointerEvents = "";
      }

      UI.updateButtonState(hide);
    },
  };

  /* ──────────────────────────────────────────────
   * UI CONSTRUCTION
   * ────────────────────────────────────────────── */
  const UI = {
    buildToggleButton() {
      // 1. Slot Container
      const slot = document.createElement("div");
      slot.className =
        "x1c4vz4f xs83m0k xdl72j9 x1g77sc7 x78zum5 xozqiw3 x1oa3qoh x12fk4p8 xeuugli x2lwn1j x1nhvcw1 x1q0g3np x1cy8zhl x100vrsf x1vqgdyp xhslqc4 x1ekkm8c x1143rjc xum4auv xj21bgg x1277o0a x13i9f1t xr9ek0c xjpr12u";

      // 2. Standard Span Wrapper
      const span = document.createElement("span");
      span.className =
        "html-span xdj266r x14z9mp xat24cr x1lziwak xexx8yu xyri2b x18d9i69 x1c1uobl x1hl2dhg x16tdsg8 x1vvkbs x4k7w5x x1h91t0o x1h9r5lt x1jfb8zj xv2umb2 x1beo9mf xaigb6o x12ejxvf x3igimt xarpa2k xedcshv x1lytzrv x1t2pt76 x7ja8zs x1qrby5j";

      // 3. The Button
      const btn = document.createElement("button");
      btn.id = CONFIG.BTN_ID;
      btn.type = "button";
      btn.setAttribute("tabindex", "0");
      btn.setAttribute("data-navbar-item", "true");
      btn.setAttribute("aria-label", "Toggle sidebar");
      btn.className =
        "xjb2p0i xk390pu x1heor9g x1ypdohk xjbqb8w x972fbf x10w94by x1qhh985 x14e42zd xtnn1bt x9v5kkp xmw7ebm xrdum7p xt8t1vi x1xc408v x129tdwq x15urzxu xh8yej3 x1y1aw1k xf159sx xwib8y2 xmzvs34";

      // 4. Inner Visual Structure
      btn.innerHTML = `
        <div class="x1c4vz4f xs83m0k xdl72j9 x1g77sc7 x78zum5 xozqiw3 x1oa3qoh x12fk4p8 xeuugli x2lwn1j x1nhvcw1 x1q0g3np x6s0dn4 xh8yej3 x1n2onr6">
          <div style="flex-grow: 1;">
            <div>
              <span aria-hidden="true" class="${CONFIG.EXT}-icon">
                ${getIconSVG(State.isHidden)}
              </span>
            </div>
          </div>
        </div>`;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        Sidebar.toggle();
      });

      span.appendChild(btn);
      slot.appendChild(span);

      // 5. Divider
      const hr = document.createElement("hr");
      hr.className =
        "xh8yej3 xjm9jq1 x178xt8z x13fuv20 xx42vgk x18oe1m7 x1sy0etr xstzfhl";

      const fragment = document.createDocumentFragment();
      fragment.appendChild(slot);
      fragment.appendChild(hr);

      return fragment;
    },

    updateButtonState(hidden) {
      const btn = DOM.getToggleButton();
      if (!btn) return;

      // Update Icon
      const iconContainer = btn.querySelector(`.${CONFIG.EXT}-icon`);
      if (iconContainer) iconContainer.innerHTML = getIconSVG(hidden);

      // Update Accessibility
      btn.setAttribute("aria-pressed", String(hidden));

      // Update Selection Highlight (matching WA style)
      const slot = btn.closest(".x1c4vz4f");
      if (slot) {
        if (hidden) {
          slot.classList.add("x14ug900", "xzs022t"); // WA's "active" classes
          btn.setAttribute("data-navbar-item-selected", "true");
        } else {
          slot.classList.remove("x14ug900", "xzs022t");
          btn.setAttribute("data-navbar-item-selected", "false");
        }
      }
    },
  };

  /* ──────────────────────────────────────────────
   * INITIALIZATION & OBSERVERS
   * ────────────────────────────────────────────── */
  function inject() {
    if (DOM.getToggleButton()) return false;

    const chatsBtn = document.querySelector(CONFIG.SELECTORS.chatsBtn);
    if (!chatsBtn) {
      log("Chats button not ready");
      return false;
    }

    const navItem = chatsBtn?.parentElement?.parentElement;
    const navContainer = navItem?.parentElement;

    if (!navContainer) {
      log("nav container not found");
      return false;
    }

    const toggleButtonWrapper = UI.buildToggleButton();

    navContainer.insertBefore(toggleButtonWrapper, navItem);

    log("button injected ✓");

    Sidebar.apply(State.isHidden, false);

    return true;
  }

  function init() {
    // 1. Watch for Nav Clicks: If sidebar is hidden and a nav item is clicked, show sidebar
    document.addEventListener(
      "click",
      (e) => {
        const navBtn = e.target.closest(CONFIG.SELECTORS.navButtons);
        // Ensure we didn't just click our own toggle button
        if (navBtn && navBtn.id !== CONFIG.BTN_ID) {
          Sidebar.show();
        }
      },
      true,
    );

    // 2. Watch for DOM changes (WhatsApp is a SPA)
    const observer = new MutationObserver(() => inject());
    observer.observe(document.body, { childList: true, subtree: true });

    // 3. Keyboard Shortcut (Alt + S)
    document.addEventListener("keydown", (e) => {
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        Sidebar.toggle();
      }
    });

    inject();
  }

  // Run
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
