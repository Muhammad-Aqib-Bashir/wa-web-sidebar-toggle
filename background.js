// background.js — MV3 service worker
// Kept deliberately minimal: the only thing a background script needs to do
// for this extension is open the welcome page the first time someone installs
// it. No persistent state, no alarms, no messaging. The service worker is
// spun up, does its job, and Chrome suspends it again immediately.

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome/welcome.html"),
    });
  }
});
