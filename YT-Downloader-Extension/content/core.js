/*
 * Core Module - Constants, State & Utilities
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

// ─── Storage Compatibility ────────────────────────────────
window.YTDL.storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;

// ─── Constants ────────────────────────────────────────────
window.YTDL.SERVER_URL = "http://127.0.0.1:19836";

// ─── State ────────────────────────────────────────────────
window.YTDL.state = {
  currentVideoUrl: null,
  formatsData: null,
  videoInfo: null,
  isDownloading: false,
  panelOpen: false,
  previewMode: null,
  trimUpdateHandlers: [],
  scissorsState: 0,
  scissorsTrimA: null,
  scissorsTrimB: null,
  scissorsTimeSecA: null,
  scissorsTimeSecB: null,
  scissorsTrims: [],
  activeScissorsColor: "#ff1744",
  TRIM_COLORS: ["#3ea6ff", "#00e676", "#ff9100", "#d500f9", "#ff4081", "#ffeb3b", "#00e5ff", "#ff1744", "#aeea00", "#1de9b6"],
  scissorsUnlockedForVideo: false,
  defaultSettings: {
    outputDir: '',
    defLang: 'en',
    videoFormat: 'mp4',
    videoQuality: '1080p',
    audioFormat: 'mp3',
    audioQuality: '192K',
    defThumb: false,
    defSub: false,
    defAudio: false,
    lufsNorm: false,
    gifExport: false,
    audioMeta: false
  }
};

// ─── Utilities ────────────────────────────────────────────
window.YTDL.utils = {
  isVideoPage() {
    return window.location.pathname === "/watch" || window.location.pathname.startsWith("/shorts/");
  },

  formatTime(seconds, precise = false) {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const totalSecs = Math.round(seconds);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = Math.floor(totalSecs % 60);
    const sStr = String(s).padStart(2, "0");
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${sStr}`;
    return `${m}:${sStr}`;
  },

  parseTime(timeStr) {
    const parts = timeStr.split(':').map(Number);
    if (parts.some(isNaN)) return 0;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return parts[0] || 0;
  },

  async getCookies() {
    const DISCARD = new Set([
      "SID", "HSID", "SSID", "APISID", "SAPISID",
      "ACCOUNT_CHOOSER", "OSID", "__Secure-1PSID", "__Secure-3PSID",
      "__Secure-1PAPISID", "__Secure-3PAPISID", "__Secure-1PSIDTS",
      "__Secure-3PSIDTS", "__Secure-1PSIDCC", "__Secure-3PSIDCC"
    ]);
    const cookies = [];
    try {
      // 1. Direct tab document.cookie parsing (Instant & 100% reliable)
      const rawCookies = document.cookie || "";
      if (rawCookies) {
        for (const pair of rawCookies.split(";")) {
          const parts = pair.split("=");
          const name = parts[0].trim();
          const value = parts.slice(1).join("=").trim();
          if (name && !DISCARD.has(name) && !name.startsWith("__Secure-")) {
            cookies.push({
              name: name,
              value: value,
              domain: ".youtube.com",
              path: "/",
              secure: true
            });
          }
        }
      }

      // 2. Supplement with background extension API cookies if available
      const browserAPI = typeof chrome !== "undefined" ? chrome : (typeof browser !== "undefined" ? browser : null);
      if (browserAPI?.runtime?.sendMessage) {
        const bgCookies = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve([]), 1000);
          browserAPI.runtime.sendMessage({ action: "get_yt_cookies" }, (res) => {
            clearTimeout(timeout);
            resolve(Array.isArray(res) ? res : []);
          });
        });
        if (Array.isArray(bgCookies) && bgCookies.length > 0) {
          const existingNames = new Set(cookies.map(c => c.name));
          for (const bgc of bgCookies) {
            if (bgc && bgc.name && !existingNames.has(bgc.name)) {
              cookies.push(bgc);
            }
          }
        }
      }
    } catch (e) {}
    return cookies;
  },

  getPoToken() {
    try {
      if (window.ytcfg && typeof window.ytcfg.get === 'function') {
        const token = window.ytcfg.get('PO_TOKEN') || window.ytcfg.get('POTOKEN');
        if (token && typeof token === 'string' && !token.startsWith('Cgt')) return token;
      }
      if (window.yt && window.yt.config_ && (window.yt.config_.PO_TOKEN || window.yt.config_.POTOKEN)) {
        const token = window.yt.config_.PO_TOKEN || window.yt.config_.POTOKEN;
        if (token && typeof token === 'string' && !token.startsWith('Cgt')) return token;
      }
    } catch (e) {}
    return null;
  },

  async serverRequest(path, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const resp = await fetch(`${window.YTDL.SERVER_URL}${path}`);
        const resJson = await resp.json();
        if (resJson && resJson.version && resJson.version !== "1.3.0") {
          window.YTDL.state.companionOutdated = true;
          window.YTDL.state.companionVersion = resJson.version;
        }
        return resJson;
      } catch (e) {
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
    return { error: "Servidor no disponible" };
  },

  async serverPost(path, body = {}, retries = 2) {
    // Automatically attach sanitized YouTube session cookies and PO-Token if available
    if (!body.cookies) {
      body.cookies = await window.YTDL.utils.getCookies();
    }
    if (!body.po_token) {
      const po = window.YTDL.utils.getPoToken();
      if (po) body.po_token = po;
    }
    for (let i = 0; i < retries; i++) {
      try {
        const resp = await fetch(`${window.YTDL.SERVER_URL}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const resJson = await resp.json();
        if (resJson && resJson.version && resJson.version !== "1.3.0") {
          window.YTDL.state.companionOutdated = true;
          window.YTDL.state.companionVersion = resJson.version;
        }
        return resJson;
      } catch (e) {
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
    return { error: "Servidor no disponible" };
  }
};

// Shorthand aliases
window.YTDL.isVideoPage = window.YTDL.utils.isVideoPage;
window.YTDL.formatTime = window.YTDL.utils.formatTime;
window.YTDL.parseTime = window.YTDL.utils.parseTime;
window.YTDL.serverRequest = window.YTDL.utils.serverRequest;
window.YTDL.serverPost = window.YTDL.utils.serverPost;

// Initialize settings early
window.YTDL.storage.local.get("settings", (r) => {
  if (r.settings) {
    window.YTDL.state.defaultSettings = { ...window.YTDL.state.defaultSettings, ...r.settings };
  }
});
