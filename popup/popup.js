(function () {
  "use strict";

  // ── Edit these to point at your own project/profiles ─────────────
  // Everything user-facing in the popup is driven from this one block.
  const CONFIG = {
    GITHUB_REPO_URL:
      "https://github.com/Muhammad-Aqib-Bashir/wa-web-sidebar-toggle",
    // Leave empty until the extension is actually live on the Chrome Web
    // Store — the review button disables itself gracefully until then
    // instead of linking to a 404.
    CHROME_STORE_EXTENSION_ID: "",
    BUY_ME_A_COFFEE_URL: "https://www.buymeacoffee.com/your-username",
    HIRE_URL: "https://your-portfolio.dev",
    DEV_NAME: "M. Aqib Bashir",
    SOCIAL_LINKS: {
      github: "https://github.com/Muhammad-Aqib-Bashir",
      x: "https://x.com/mAqibBashir",
      website: "https://muhammadaqibbashir.netlify.app",
    },
  };
  // ───────────────────────────────────────────────────────────────

  function setLink(id, url) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!url) {
      el.setAttribute("aria-disabled", "true");
      el.removeAttribute("href");
      el.title = "Coming soon";
      return;
    }
    el.href = url;
  }

  function init() {
    const manifest = chrome.runtime.getManifest();
    document.getElementById("ext-name").textContent = manifest.name;
    document.getElementById("ext-version").textContent = `v${manifest.version}`;

    setLink("link-github", CONFIG.GITHUB_REPO_URL);
    setLink(
      "link-review",
      CONFIG.CHROME_STORE_EXTENSION_ID
        ? `https://chromewebstore.google.com/detail/${CONFIG.CHROME_STORE_EXTENSION_ID}/reviews`
        : "",
    );
    setLink("link-hire", CONFIG.HIRE_URL);
    setLink("link-support", CONFIG.BUY_ME_A_COFFEE_URL);
    setLink("link-social-github", CONFIG.SOCIAL_LINKS.github);
    setLink("link-social-x", CONFIG.SOCIAL_LINKS.x);
    setLink("link-social-site", CONFIG.SOCIAL_LINKS.website);

    document.getElementById("dev-name").textContent = CONFIG.DEV_NAME;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
