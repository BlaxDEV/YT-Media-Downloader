/*
 * Background Service Worker / Script - YT Media Downloader Extension
 * Handles onInstalled welcome tab opening.
 */

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browserAPI.tabs.create({
      url: browserAPI.runtime.getURL("welcome/welcome.html")
    });
  } else if (details.reason === "update") {
    browserAPI.tabs.create({
      url: browserAPI.runtime.getURL("welcome/changelog.html")
    });
  }
});

// Master account session keys to NEVER transmit (Account protection)
const DISCARD_COOKIES = new Set([
  "SID", "HSID", "SSID", "APISID", "SAPISID",
  "ACCOUNT_CHOOSER", "OSID", "__Secure-1PSID", "__Secure-3PSID",
  "__Secure-1PAPISID", "__Secure-3PAPISID", "__Secure-1PSIDTS",
  "__Secure-3PSIDTS", "__Secure-1PSIDCC", "__Secure-3PSIDCC"
]);

async function getSanitizedYtCookies() {
  try {
    let cookies = await browserAPI.cookies.getAll({ url: "https://www.youtube.com" });
    if (!cookies || cookies.length === 0) {
      cookies = await browserAPI.cookies.getAll({ domain: "youtube.com" });
    }
    const safeCookies = (cookies || [])
      .filter(c => c && c.name && !DISCARD_COOKIES.has(c.name) && !c.name.startsWith("__Secure-"))
      .map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain || ".youtube.com",
        path: c.path || "/",
        secure: Boolean(c.secure),
        expirationDate: c.expirationDate || Math.floor(Date.now() / 1000) + 86400 * 365
      }));
    return safeCookies;
  } catch (err) {
    console.warn("[YTDL] Could not fetch cookies via extension API:", err);
    return [];
  }
}

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_yt_cookies") {
    getSanitizedYtCookies().then(sendResponse);
    return true; // Keep channel open for async response
  }
});

