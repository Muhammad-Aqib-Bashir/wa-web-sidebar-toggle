(function () {
  "use strict";

  const CONFIG = {
    GITHUB_REPO_URL:
      "https://github.com/Muhammad-Aqib-Bashir/wa-web-sidebar-toggle",
    CHROME_STORE_EXTENSION_ID: "",
    BUY_ME_A_COFFEE_URL: "https://ko-fi.com/muhammadaqibbashir",
    HIRE_URL: "https://muhammadaqibbashir.netlify.app",
    DEV_NAME: "M. Aqib Bashir",
    SOCIAL_LINKS: {
      github: "https://github.com/Muhammad-Aqib-Bashir",
      linkedin: "https://www.linkedin.com/in/muhammadaqibbashir-dev/",
      freelancer: "https://www.freelancer.com/get/mAqibBashir?f=give",
      website: "https://muhammadaqibbashir.netlify.app",
    },
  };

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
    setLink("link-social-linkedin", CONFIG.SOCIAL_LINKS.linkedin);
    setLink("link-social-freelancer", CONFIG.SOCIAL_LINKS.freelancer);
    setLink("link-social-site", CONFIG.SOCIAL_LINKS.website);

    document.getElementById("dev-name").textContent = CONFIG.DEV_NAME;

    initPinBanner();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
