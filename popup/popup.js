(function () {
  "use strict";

  const CONFIG = {
    CHROME_STORE_EXTENSION_ID: "kcecmmnkmpoeociooaffmimbpljdmglj",
    DEV_NAME: "M. Aqib Bashir",
    GITHUB_REPO_URL:
      "https://github.com/Muhammad-Aqib-Bashir/wa-web-sidebar-toggle",
    BUY_ME_A_COFFEE_URL: "https://ko-fi.com/muhammadaqibbashir",
    HIRE_URL: "https://www.freelancer.com/u/mAqibBashir",
    SOCIAL_LINKS: {
      github: "https://github.com/Muhammad-Aqib-Bashir",
      linkedin: "https://linkedin.com/in/muhammadaqibbashir-dev",
      freelancer: "https://www.freelancer.com/u/mAqibBashir",
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

  function initPinBanner() {
    const banner = document.getElementById("pin-banner");
    const closeBtn = document.getElementById("pin-banner-close");
    if (!banner || !closeBtn) return;

    chrome.storage.local.get("pinBannerDismissed", (result) => {
      if (result.pinBannerDismissed) return;
      banner.hidden = false;
    });

    closeBtn.addEventListener("click", () => {
      banner.hidden = true;
      chrome.storage.local.set({ pinBannerDismissed: true });
    });
  }

  function init() {
    const manifest = chrome.runtime.getManifest();
    document.getElementById("ext-name").textContent = manifest.name;
    document.getElementById("ext-version").textContent = `v${manifest.version}`;

    setLink("link-github", CONFIG.GITHUB_REPO_URL);
    setLink(
      "link-review",
      CONFIG.CHROME_STORE_EXTENSION_ID
        ? `https://chromewebstore.google.com/detail/${CONFIG.CHROME_STORE_EXTENSION_ID}/reviews?utm_source=popup&utm_medium=extension&utm_campaign=review_prompt`
        : "",
    );
    setLink("link-hire", CONFIG.HIRE_URL);
    setLink("link-support", CONFIG.BUY_ME_A_COFFEE_URL);
    setLink("link-social-github", CONFIG.SOCIAL_LINKS.github);
    setLink("link-social-linkedin", CONFIG.SOCIAL_LINKS.linkedin);
    setLink("link-social-freelancer", CONFIG.SOCIAL_LINKS.freelancer);
    setLink("link-social-site", CONFIG.SOCIAL_LINKS.website);

    document.getElementById("dev-name").textContent = CONFIG.DEV_NAME;

    initPinBanner();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
