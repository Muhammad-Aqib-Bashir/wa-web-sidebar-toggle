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
    NAVBAR_CLASS: `${EXT}-navbar`,
    COLLAPSED_CLASS: `${EXT}-collapsed`,
    EASE: "cubic-bezier(0.4, 0, 0.2, 1)",
    COLLAPSE_MS: 400,
    CONTENT_FADE_DELAY_MS: 300,
    CONTENT_FADE_MS: 300,
    SYNC_INTERVAL_MS: 1500,
    SELECTORS: {
      // WhatsApp wraps every top-level layout slot (nav rail, side panel,
      // main area) in this same generic flex-item class. We can't target
      // the side panel by id, because the *content* node's id/structure
      // changes depending on which tab is open (Chats/Status/Communities/
      // Settings) - but every one of these layout slots shares this class,
      // so instead we collapse all of them EXCEPT the nav rail. That makes
      // the toggle work identically no matter what's currently shown.
      container: "x18dvir5",
      navButtons: 'button[data-navbar-item="true"]',
      navHeader: "header[data-tab]",
      chatsBtn: 'button[aria-label="Chats"]',
      // Fallback list for the actual scrollable list/content node, tried in
      // order. Only used for an extra crisp opacity fade once the layout
      // slot around it has already been collapsed to zero width.
      content: [
        "#side",
        "#pane-side",
        '[data-testid="chatlist"]',
        '[data-testid="chatlist-container"]',
        'div[role="complementary"]',
      ],
      navLabels: [
        "Chats",
        "Status",
        "Communities",
        "Comunidades",
        "Channels",
        "Canales",
        "Settings",
        "Profile",
      ],
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
    contentFadeTimer: null,
  };

  /* ──────────────────────────────────────────────
   * DOM SELECTORS
   * ────────────────────────────────────────────── */
  const DOM = {
    getToggleButton() {
      return document.getElementById(CONFIG.BTN_ID);
    },

    getAllContainers() {
      return Array.from(
        document.querySelectorAll(`.${CONFIG.SELECTORS.container}`),
      );
    },

    // The actual scrollable list (chat list / status list / communities
    // list / settings panel). Only used for an extra-crisp fade once the
    // layout slot around it has already been collapsed to zero width.
    findContent() {
      for (const sel of CONFIG.SELECTORS.content) {
        const el = document.querySelector(sel);
        if (el) return el;
      }
      return null;
    },

    // Decides whether a given .x18dvir5 wrapper is the narrow navigation
    // rail (Chats/Status/Communities/Settings/Profile icons), so we never
    // collapse it by mistake. Several independent signals are checked
    // because WhatsApp's auto-generated class names aren't stable across
    // releases - any one of them being true is enough.
    isNavRail(container) {
      const navHeader = container.querySelector(CONFIG.SELECTORS.navHeader);
      const navButtons = container.querySelectorAll(
        CONFIG.SELECTORS.navButtons,
      );

      // A header with multiple nav buttons is unambiguously the rail.
      if (navHeader && navButtons.length >= 2) return true;

      // Our own toggle button only ever lives inside the rail.
      if (
        container.querySelector(`#${CONFIG.BTN_ID}`) &&
        (navHeader || navButtons.length >= 2)
      ) {
        return true;
      }

      // 4+ nav-item buttons directly inside = definitely the rail.
      if (navButtons.length >= 4) return true;

      // 4+ of the known nav aria-labels present = definitely the rail.
      const labelMatches = CONFIG.SELECTORS.navLabels.filter((label) =>
        container.querySelector(`button[aria-label="${label}"]`),
      ).length;
      if (labelMatches >= 4) return true;

      // The rail is narrow (vertical icon strip); a narrow container that
      // also looks nav-ish is almost certainly it.
      const width = container.getBoundingClientRect().width;
      if (width > 0 && width < 150 && (navHeader || navButtons.length >= 3)) {
        return true;
      }

      return false;
    },

    // Tags every layout slot so it's cheap to tell nav rail apart from
    // collapsible panels on screen (useful for debugging), and returns the
    // set that should actually be collapsed.
    getCollapsibleContainers() {
      const collapsible = [];
      for (const container of this.getAllContainers()) {
        if (this.isNavRail(container)) {
          container.classList.add(CONFIG.NAVBAR_CLASS);
        } else {
          container.classList.remove(CONFIG.NAVBAR_CLASS);
          collapsible.push(container);
        }
      }
      return collapsible;
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
      State.isHidden = hide;
      this._render(hide, animate);
      document.documentElement.classList.toggle(CONFIG.HTML_CLASS, hide);
      UI.updateButtonState(hide);
    },

    // Re-applies the current state to whatever's in the DOM right now.
    // Safe to call repeatedly - WhatsApp's SPA rebuilds these wrapper nodes
    // whenever a tab is switched (Chats/Status/Communities/Settings) or the
    // view otherwise re-renders, which would silently drop our collapsed
    // styling. This is what keeps the toggle glued in place instead of
    // popping back open. Called from the mutation observer / sync timer.
    reassert() {
      this._render(State.isHidden, false);
    },

    _render(hide, animate) {
      const containers = DOM.getCollapsibleContainers();
      const content = DOM.findContent();

      if (State.contentFadeTimer) {
        clearTimeout(State.contentFadeTimer);
        State.contentFadeTimer = null;
      }

      if (containers.length === 0) {
        // Structural slots not found (very early load) - fall back to
        // hiding the content node directly so the toggle still does
        // *something* useful.
        if (content) content.style.display = hide ? "none" : "";
        return;
      }

      const transition = animate
        ? `flex ${CONFIG.COLLAPSE_MS}ms ${CONFIG.EASE}, width ${CONFIG.COLLAPSE_MS}ms ${CONFIG.EASE}, min-width ${CONFIG.COLLAPSE_MS}ms ${CONFIG.EASE}, max-width ${CONFIG.COLLAPSE_MS}ms ${CONFIG.EASE}`
        : "none";

      if (hide) {
        containers.forEach((container) => {
          container.style.transition = transition;
          if (animate) void container.offsetWidth; // force reflow so the transition actually plays
          container.classList.add(CONFIG.COLLAPSED_CLASS);
          container.style.flex = "0 0 0%";
          container.style.width = "0";
          container.style.minWidth = "0";
          container.style.maxWidth = "0";
        });

        const fadeContent = () => {
          if (!State.isHidden) return; // toggled back before the delay fired
          const el = DOM.findContent();
          if (!el) return;
          el.style.transition = `opacity ${CONFIG.CONTENT_FADE_MS}ms ease, visibility ${CONFIG.CONTENT_FADE_MS}ms ease`;
          el.style.opacity = "0";
          el.style.visibility = "hidden";
          el.style.pointerEvents = "none";
        };

        if (animate) {
          State.contentFadeTimer = setTimeout(
            fadeContent,
            CONFIG.CONTENT_FADE_DELAY_MS,
          );
        } else {
          fadeContent();
        }
      } else {
        if (content) {
          Object.assign(content.style, {
            opacity: "",
            visibility: "",
            pointerEvents: "",
            display: "",
          });
        }

        const restore = () => {
          containers.forEach((container) => {
            container.style.transition = transition;
            container.classList.remove(CONFIG.COLLAPSED_CLASS);
            container.style.flex = "";
            container.style.width = "";
            container.style.minWidth = "";
            container.style.maxWidth = "";
          });
        };

        if (animate) requestAnimationFrame(restore);
        else restore();
      }
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
      span.id = `${CONFIG.BTN_ID}-wrapper-span`;

      // 3. The Button
      const btn = document.createElement("button");
      btn.id = CONFIG.BTN_ID;
      btn.type = "button";
      btn.setAttribute("tabindex", "0");
      btn.setAttribute("data-navbar-item", "true");
      btn.setAttribute("aria-label", "Toggle Sidebar");
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
    // WhatsApp is a SPA: switching tabs (Chats/Status/Communities/
    // Settings), opening a chat, or even just receiving a message mutates
    // the DOM - sometimes rebuilding the panel wrapper nodes entirely. We
    // re-sync after every burst of mutations (batched into one rAF tick so
    // this stays cheap even though WhatsApp mutates constantly), plus a
    // slow interval as a safety net in case a mutation is ever missed.
    let frame = null;
    const sync = () => {
      inject();
      Sidebar.reassert();
    };
    const scheduleSync = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        sync();
      });
    };

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true });

    setInterval(sync, CONFIG.SYNC_INTERVAL_MS);

    // Keyboard Shortcut (Alt + S)
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
