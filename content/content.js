/*
 * Content Script - YT Media Downloader Extension
 * Elegant download button in YouTube's action bar
 */

(function () {
  "use strict";

  console.log("[YTDL] Content script loaded");

  // Firefox/Chrome compatibility
  const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;

  let currentVideoUrl = null;
  let formatsData = null;
  let videoInfo = null;
  let isDownloading = false;
  let panelOpen = false;
  let previewMode = null; // "video" | "audio" | null
  let trimUpdateHandlers = [];
  let scissorsState = 0;
  let scissorsTrimA = null;
  let scissorsTrimB = null;
  let scissorsUnlockedForVideo = false;
  let defaultSettings = { outputDir: '', defLang: 'en', videoFormat: 'mp4', videoQuality: '1080p', audioFormat: 'mp3', audioQuality: '192K', defThumb: false, defSub: false, defAudio: false };

  const SERVER_URL = "http://127.0.0.1:19836";

  // ─── SVG Icons ─────────────────────────────────────────────
  const ICONS = {
    download: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    gear: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z"/></svg>`,
    video: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>`,
    music: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
    check: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
  };

  // ─── Utilities ─────────────────────────────────────────────
  function isVideoPage() {
    return window.location.pathname === "/watch" || window.location.pathname.startsWith("/shorts/");
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function parseTime(timeStr) {
    const parts = timeStr.split(':').map(Number);
    if (parts.some(isNaN)) return 0;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return parts[0] || 0;
  }

  async function serverRequest(path) {
    try {
      const resp = await fetch(`${SERVER_URL}${path}`);
      return await resp.json();
    } catch (e) {
      return { error: "Servidor no disponible" };
    }
  }

  async function serverPost(path, body) {
    try {
      const resp = await fetch(`${SERVER_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      return await resp.json();
    } catch (e) {
      return { error: "Servidor no disponible" };
    }
  }

  // ─── Find YouTube Action Bar ───────────────────────────────
  function findActionBar() {
    // Try Shorts-specific selectors first
    const shortsSelectors = [
      "ytd-reel-player-header-renderer #actions",
      "ytd-reel-player-header-renderer #top-level-buttons",
      "ytd-shorts #actions",
      "ytd-shorts ytd-menu-renderer #top-level-buttons-computed",
      "#page-manager ytd-shorts #action-buttons"
    ];

    for (const sel of shortsSelectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }

    // Regular video selectors
    const selectors = [
      "ytd-watch-metadata ytd-menu-renderer #top-level-buttons-computed",
      "ytd-menu-renderer #top-level-buttons-computed",
      "#above-the-fold ytd-menu-renderer #top-level-buttons-computed",
      "#actions ytd-menu-renderer #top-level-buttons-computed",
      "#above-the-fold #menu #top-level-buttons-computed",
      "#above-the-fold #menu",
      "ytd-video-primary-info-renderer #menu",
      "#info-contents #menu"
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // --- Inject Download Button ---
  function injectDownloadButton() {
    const actionBar = findActionBar();
    if (!actionBar) {
      setTimeout(injectDownloadButton, 1000);
      return;
    }

    const isShorts = window.location.pathname.startsWith("/shorts/");
    let btn = document.getElementById("ytdl-action-btn");
    if (!btn) {
      btn = document.createElement("div");
      btn.id = "ytdl-action-btn";
      btn.className = isShorts ? "ytdl-shorts-btn" : "ytdl-fallback-btn";
      btn.setAttribute("title", "YT Media Downloader");

      if (isShorts) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><circle cx="12" cy="12" r="3.2"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>`;
      } else {
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
          <span style="font-family: 'Roboto', 'Arial', sans-serif; font-size: 14px; font-weight: 500;">Descargar</span>
        `;
      }

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePanel();
      });
    }

    if (isShorts) {
      const likeBtn = actionBar.querySelector(
        "ytd-like-button-renderer, button[aria-label*='like' i], #like-button"
      );
      if (likeBtn && btn.nextSibling !== likeBtn) {
        actionBar.insertBefore(btn, likeBtn);
      } else if (!likeBtn && btn.parentElement !== actionBar) {
        actionBar.appendChild(btn);
      }
    } else {
      const menuRenderer = actionBar.closest("ytd-menu-renderer") || actionBar.closest("#menu") || actionBar;
      const overflowBtn = menuRenderer.querySelector(
        "#overflow-button, ytd-menu-renderer > #button, ytd-menu-renderer > yt-icon-button#button, #flexible-item-buttons + #overflow-button, button[aria-label*='More' i], button[aria-label*='Más' i], button[aria-label*='Mais' i], button[aria-label*='Mehr' i], button[aria-label*='Altro' i], button[aria-label*='Ещё' i], button[aria-label*='その他' i], button[aria-label*='更多' i]"
      );
      if (overflowBtn && overflowBtn.parentNode) {
        if (btn.nextSibling !== overflowBtn) {
          overflowBtn.parentNode.insertBefore(btn, overflowBtn);
        }
      } else {
        const flexButtons = menuRenderer.querySelector("#flexible-item-buttons");
        if (flexButtons && btn.parentElement !== flexButtons) {
          flexButtons.appendChild(btn);
        } else if (!flexButtons && btn.parentElement !== actionBar) {
          actionBar.appendChild(btn);
        }
      }
    }

    // --- Inject Scissors Button ---
    injectScissorsButton(false);
  }

  function injectScissorsButton(animate = false) {
    const isShorts = window.location.pathname.startsWith("/shorts/");
    if (isShorts) return;

    let scissorsBtn = document.getElementById("ytdl-scissors-btn");
    const rightControls = document.querySelector(".ytp-right-controls");
    if (!rightControls) return;

    if (!scissorsBtn) {
      scissorsBtn = document.createElement("button");
      scissorsBtn.id = "ytdl-scissors-btn";
      scissorsBtn.className = "ytp-button";
      scissorsBtn.setAttribute("title", "YT Media Downloader: Trimming Mode");
      scissorsBtn.style.cssText = "width:48px; height:100%; opacity:0.9; display:none; align-items:center; justify-content:center; position:relative; border:none; background:none; cursor:pointer; padding:0;";
      scissorsBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="#bbb"><path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1.09l-9.91-9.91zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z"/></svg><span id="ytdl-scissors-label" style="font-size:12px; font-weight:bold; color:#fff; position:absolute; bottom:6px; right:4px; text-shadow: 1px 1px 2px #000;"></span>`;

      scissorsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const video = getYouTubeVideo();
        if (!video) return;

        const dur = videoInfo?.duration || video.duration || 1;
        const currentTimeSec = video.currentTime;
        const currentVal = Math.round((currentTimeSec / dur) * 1000);
        const label = document.getElementById("ytdl-scissors-label");

        if (scissorsState === 0) {
          // Set point A
          scissorsTrimA = currentVal;
          scissorsTrimB = null;
          scissorsState = 1;
          if (label) label.textContent = "A";
          scissorsBtn.querySelector("svg").setAttribute("fill", "#3ea6ff");
        } else if (scissorsState === 1) {
          // Set point B
          if (currentVal <= scissorsTrimA) {
            scissorsTrimB = scissorsTrimA;
            scissorsTrimA = currentVal;
          } else {
            scissorsTrimB = currentVal;
          }
          scissorsState = 2;
          if (label) label.textContent = "B";
        } else {
          // Reset
          scissorsTrimA = null;
          scissorsTrimB = null;
          scissorsState = 0;
          if (label) label.textContent = "";
          scissorsBtn.querySelector("svg").setAttribute("fill", "#bbb");
        }

        // Apply to panel sliders
        applyScissorsToPanel(scissorsState === 0);

        // Auto-activate preview mode if panel is open
        if (scissorsState > 0) {
          const popup = document.getElementById("ytdl-popup-panel");
          if (popup) {
            const activeTab = popup.querySelector('.ytdl-popup-content.active');
            const isAudio = activeTab && activeTab.dataset.content === 'audio';
            const prefix = isAudio ? 'a' : 'v';
            const previewCb = popup.querySelector(`#ytdl-${prefix}-preview-cb`);
            if (previewCb && !previewCb.checked) {
              previewCb.checked = true;
              previewCb.dispatchEvent(new Event("change"));
            }
          }
        }
      });

      // Insert as first child of right controls (visually right after the time counter)
      rightControls.insertBefore(scissorsBtn, rightControls.firstChild);
    }

    scissorsBtn.style.display = "inline-flex";
    if (animate) {
      scissorsBtn.classList.remove("ytdl-scissors-show");
      void scissorsBtn.offsetWidth; // trigger reflow to restart animation
      scissorsBtn.classList.add("ytdl-scissors-show");
    }
  }

  function hideScissorsButton(force = false) {
    if (!force && scissorsUnlockedForVideo) return;
    const scissorsBtn = document.getElementById("ytdl-scissors-btn");
    if (scissorsBtn) {
      scissorsBtn.style.display = "none";
      scissorsBtn.classList.remove("ytdl-scissors-show");
    }
  }

  function resetScissorsTool() {
    if (scissorsState === 0 && scissorsTrimA === null && scissorsTrimB === null) return;
    scissorsState = 0;
    scissorsTrimA = null;
    scissorsTrimB = null;
    const label = document.getElementById("ytdl-scissors-label");
    if (label) label.textContent = "";
    const scissorsBtn = document.getElementById("ytdl-scissors-btn");
    if (scissorsBtn) {
      const svg = scissorsBtn.querySelector("svg");
      if (svg) svg.setAttribute("fill", "#bbb");
    }
  }

  let isApplyingScissors = false;
  function applyScissorsToPanel(resetToDefault = false) {
    const popup = document.getElementById("ytdl-popup-panel");
    if (!popup) return;
    isApplyingScissors = true;
    try {
      ["v", "a"].forEach(prefix => {
        const startInput = popup.querySelector(`#ytdl-${prefix}-start`);
        const endInput = popup.querySelector(`#ytdl-${prefix}-end`);
        if (!startInput || !endInput) return;

        if (scissorsTrimA !== null && scissorsTrimB !== null) {
          startInput.value = scissorsTrimA;
          endInput.value = scissorsTrimB;
          startInput.dispatchEvent(new Event("input"));
        } else if (scissorsTrimA !== null) {
          startInput.value = scissorsTrimA;
          startInput.dispatchEvent(new Event("input"));
        } else if (resetToDefault) {
          startInput.value = 0;
          endInput.value = 1000;
          startInput.dispatchEvent(new Event("input"));
        }

        if (scissorsState > 0) {
          const previewCb = popup.querySelector(`#ytdl-${prefix}-preview-cb`);
          if (previewCb && !previewCb.checked) {
            previewCb.checked = true;
            previewCb.dispatchEvent(new Event("change"));
          }
        }
      });
    } finally {
      isApplyingScissors = false;
    }
  }

  // ─── Create Panel ──────────────────────────────────────────
  function createPanel() {
    const panel = document.createElement("div");
    panel.id = "ytdl-popup-panel";
    panel.className = "ytdl-popup";
    panel.innerHTML = `
      <div class="ytdl-popup-inner">
        <div class="ytdl-popup-header" id="ytdl-header-drag" title="Haz clic y arrastra para mover la ventana">
          <div class="ytdl-popup-title" style="display: flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0;">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#ff4444" style="flex-shrink: 0;"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
            <span style="font-weight: 600; font-size: 15px;">YT Media Downloader</span>
            <span class="ytdl-grip-handle" style="color: #999; font-size: 20px; font-weight: bold; margin-left: 8px; letter-spacing: -3px; user-select: none; display: inline-flex; align-items: center; cursor: grab; line-height: 1;" title="Haz clic y arrastra para mover la ventana">⋮⋮</span>
          </div>
          <div style="text-align: right; margin-left: auto; margin-right: 8px; flex-shrink: 0;">
            <div class="ytdl-popup-subtitle" id="i18n-subtitleCreator">creado por BlaxDEV</div>
            <a href="https://ko-fi.com/blaxdev" target="_blank" class="ytdl-kofi-subtitle" id="i18n-buyMeKofi">☕ Buy me a Ko-Fi!</a>
          </div>
          <button class="ytdl-popup-close" id="ytdl-close-btn" style="flex-shrink: 0;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div class="ytdl-popup-tabs">
          <button class="ytdl-popup-tab active" data-tab="video">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
            Video
          </button>
          <button class="ytdl-popup-tab" data-tab="audio">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            Audio
          </button>
          <button class="ytdl-popup-tab" data-tab="history">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z"/></svg>
            Historial
          </button>
          <button class="ytdl-popup-tab" data-tab="config">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z"/></svg>
          </button>
        </div>

        <div class="ytdl-popup-body">
          <!-- Video Tab -->
          <div class="ytdl-popup-content active" data-content="video">
            <div class="ytdl-server-err" id="ytdl-server-err" style="display:none">
              <span>Servidor no disponible</span>
              <button id="ytdl-retry">Reintentar</button>
            </div>
            <div class="ytdl-opt-row" id="ytdl-vfmt-row">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding-right: 4px;">
                <label style="margin-bottom: 0;">Formato</label>
                <label class="ytdl-audio-toggle" id="ytdl-audio-toggle-wrapper" style="display: inline-flex !important; align-items: center !important; gap: 8px !important; cursor: pointer !important; user-select: none !important; margin-right: 14px !important;" title="Incluir / Excluir Audio en la descarga de video">
                  <span style="font-size: 14px;">🎵</span>
                  <input type="checkbox" id="ytdl-v-include-audio" checked>
                  <span class="ytdl-toggle-track" style="display: inline-block !important; width: 36px !important; height: 20px !important; min-width: 36px !important; min-height: 20px !important; border-radius: 10px !important; position: relative !important; flex-shrink: 0 !important;"></span>
                </label>
              </div>
              <div class="ytdl-chips" id="ytdl-v-fmt">
                <button class="ytdl-chip active" data-v="mp4">MP4</button>
                <button class="ytdl-chip" data-v="webm">WebM</button>
                <button class="ytdl-chip" data-v="mkv">MKV</button>
              </div>
            </div>
            <div class="ytdl-loading" id="ytdl-loading">
              <div class="ytdl-spinner"></div>
              <span>Cargando calidades...</span>
            </div>
            <div class="ytdl-qualities-grid" id="ytdl-qualities"></div>
            <div id="ytdl-no-audio-notice" style="visibility: hidden; min-height: 18px; line-height: 18px; font-size: 12px; color: #ff5555; font-weight: 600; text-align: center; margin-top: 2px; margin-bottom: 4px;">(Sin Audio)</div>
            <div class="ytdl-opt-extras">
              <label class="ytdl-checkbox-label">
                <input type="checkbox" id="ytdl-opt-thumb">
                <span>Descargar miniatura (.JPG)</span>
              </label>
              <label class="ytdl-checkbox-label">
                <input type="checkbox" id="ytdl-opt-sub">
                <span>Descargar subtítulos (.SRT)</span>
              </label>
              <select id="ytdl-sel-sub" class="ytdl-select-input" style="display:none; margin-top:4px; margin-bottom:6px;"></select>
              <label class="ytdl-checkbox-label">
                <input type="checkbox" id="ytdl-opt-v-audio">
                <span>Usar pista de audio multi-idioma</span>
              </label>
              <select id="ytdl-sel-v-audio" class="ytdl-select-input" style="display:none; margin-top:4px; margin-bottom:6px;"></select>
            </div>
            <div class="ytdl-trim-box" id="ytdl-video-trim" style="display:none">
              <div class="ytdl-trim-header">
                <span>Recortar</span>
                <span class="ytdl-trim-range" id="ytdl-v-trim-text">0:00 - 0:00</span>
              </div>
              <div class="ytdl-dual-range">
                <input type="text" class="ytdl-range-time-input" id="ytdl-v-time-a" value="0:00">
                <div class="ytdl-range-track">
                  <div class="ytdl-range-fill" id="ytdl-v-fill"></div>
                  <input type="range" min="0" max="1000" value="0" step="1" class="ytdl-range-input" id="ytdl-v-start">
                  <input type="range" min="0" max="1000" value="1000" step="1" class="ytdl-range-input" id="ytdl-v-end">
                </div>
                <input type="text" class="ytdl-range-time-input" id="ytdl-v-time-b" value="0:00">
              </div>
              <label class="ytdl-preview-toggle">
                <input type="checkbox" id="ytdl-v-preview-cb">
                <span class="ytdl-toggle-track"></span>
                <span class="ytdl-preview-label">Previsualizar recortes</span>
              </label>
            </div>
            <button class="ytdl-dl-btn" id="ytdl-dl-video" disabled>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              Descargar Video
            </button>
            <button class="ytdl-open-folder-btn" id="ytdl-v-open-folder-btn" style="display:none;">📁 Abrir Carpeta</button>
            <div class="ytdl-progress" id="ytdl-v-progress" style="display:none">
              <div class="ytdl-progress-track"><div class="ytdl-progress-bar" id="ytdl-v-bar"></div></div>
              <span class="ytdl-progress-pct" id="ytdl-v-pct">0%</span>
            </div>
          </div>

          <!-- Audio Tab -->
          <div class="ytdl-popup-content" data-content="audio">
            <div class="ytdl-opt-row">
              <label>Formato</label>
              <div class="ytdl-chips" id="ytdl-a-fmt">
                <button class="ytdl-chip active" data-v="mp3">MP3</button>
                <button class="ytdl-chip" data-v="m4a">M4A</button>
                <button class="ytdl-chip" data-v="opus">Opus</button>
                <button class="ytdl-chip" data-v="flac">FLAC</button>
              </div>
            </div>
            <div class="ytdl-opt-row">
              <label>Calidad</label>
              <div class="ytdl-chips" id="ytdl-a-q">
                <button class="ytdl-chip" data-v="128K">128k</button>
                <button class="ytdl-chip active" data-v="192K">192k</button>
                <button class="ytdl-chip" data-v="256K">256k</button>
                <button class="ytdl-chip" data-v="320K">320k</button>
                <button class="ytdl-chip" data-v="0">Max</button>
              </div>
            </div>
            <div class="ytdl-opt-extras">
              <label class="ytdl-checkbox-label">
                <input type="checkbox" id="ytdl-opt-a-audio">
                <span>Usar pista de audio multi-idioma</span>
              </label>
              <select id="ytdl-sel-a-audio" class="ytdl-select-input" style="display:none; margin-top:4px; margin-bottom:6px;"></select>
            </div>
            <div class="ytdl-trim-box" id="ytdl-audio-trim" style="display:none">
              <div class="ytdl-trim-header">
                <span>Recortar</span>
                <span class="ytdl-trim-range" id="ytdl-a-trim-text">0:00 - 0:00</span>
              </div>
              <div class="ytdl-dual-range">
                <input type="text" class="ytdl-range-time-input" id="ytdl-a-time-a" value="0:00">
                <div class="ytdl-range-track">
                  <div class="ytdl-range-fill" id="ytdl-a-fill"></div>
                  <input type="range" min="0" max="1000" value="0" step="1" class="ytdl-range-input" id="ytdl-a-start">
                  <input type="range" min="0" max="1000" value="1000" step="1" class="ytdl-range-input" id="ytdl-a-end">
                </div>
                <input type="text" class="ytdl-range-time-input" id="ytdl-a-time-b" value="0:00">
              </div>
              <label class="ytdl-preview-toggle">
                <input type="checkbox" id="ytdl-a-preview-cb">
                <span class="ytdl-toggle-track"></span>
                <span class="ytdl-preview-label">Previsualizar recortes</span>
              </label>
            </div>
            <button class="ytdl-dl-btn" id="ytdl-dl-audio">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              Descargar Audio
            </button>
            <button class="ytdl-open-folder-btn" id="ytdl-a-open-folder-btn" style="display:none;">📁 Abrir Carpeta</button>
            <div class="ytdl-progress" id="ytdl-a-progress" style="display:none">
              <div class="ytdl-progress-track"><div class="ytdl-progress-bar" id="ytdl-a-bar"></div></div>
              <span class="ytdl-progress-pct" id="ytdl-a-pct">0%</span>
            </div>
          </div>

          <!-- History Tab -->
          <div class="ytdl-popup-content" data-content="history" id="ytdl-tab-history">
            <div class="ytdl-history-header">
              <span>Historial de Descargas</span>
              <button id="ytdl-hist-refresh" title="Actualizar">↻</button>
            </div>
            <div class="ytdl-history-list" id="ytdl-history-list">
              <div class="ytdl-history-empty">Cargando descargas...</div>
            </div>
          </div>

          <!-- Config Tab -->
          <div class="ytdl-popup-content" data-content="config">
            <div class="ytdl-opt-row">
              <label>Carpeta de descarga</label>
              <input type="text" id="ytdl-out-dir" class="ytdl-text-input" placeholder="%USERPROFILE%\Downloads">
              <small>Dejar vacío para usar Descargas por defecto</small>
            </div>
            <div class="ytdl-opt-row">
              <label>Seleccionar Idioma</label>
              <select id="ytdl-def-lang" class="ytdl-select-input">
                <option value="en">English (Default)</option>
                <option value="es">Español (Spanish)</option>
                <option value="pt">Português (Portuguese)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="it">Italiano (Italian)</option>
                <option value="ru">Русский (Russian)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="zh">中文 (Chinese)</option>
              </select>
            </div>
            <div class="ytdl-opt-row">
              <label>Formato de video por defecto</label>
              <select id="ytdl-def-vfmt" class="ytdl-select-input">
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
                <option value="mkv">MKV</option>
              </select>
            </div>
            <div class="ytdl-opt-row">
              <label>Calidad de video por defecto</label>
              <select id="ytdl-def-vq" class="ytdl-select-input">
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
                <option value="240p">240p</option>
                <option value="144p">144p</option>
              </select>
            </div>
            <div class="ytdl-opt-row">
              <label>Formato de audio por defecto</label>
              <select id="ytdl-def-afmt" class="ytdl-select-input">
                <option value="mp3">MP3</option>
                <option value="m4a">M4A</option>
                <option value="opus">Opus</option>
                <option value="wav">WAV</option>
              </select>
            </div>
            <div class="ytdl-opt-row">
              <label>Calidad de audio por defecto</label>
              <select id="ytdl-def-aq" class="ytdl-select-input">
                <option value="320K">320 kbps</option>
                <option value="192K">192 kbps</option>
                <option value="128K">128 kbps</option>
              </select>
            </div>
            <div class="ytdl-opt-row">
              <label>Habilitar opciones en pestaña Video/Audio</label>
              <div class="ytdl-def-checkboxes">
                <label class="ytdl-checkbox-label">
                  <input type="checkbox" id="ytdl-def-thumb">
                  <span>Descargar miniatura (.JPG)</span>
                </label>
                <label class="ytdl-checkbox-label">
                  <input type="checkbox" id="ytdl-def-sub">
                  <span>Descargar subtítulos (.SRT)</span>
                </label>
                <label class="ytdl-checkbox-label">
                  <input type="checkbox" id="ytdl-def-audio">
                  <span>Pista de audio multi-idioma</span>
                </label>
              </div>
            </div>
            <button class="ytdl-dl-btn" id="ytdl-save-cfg">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              Guardar
            </button>
            <div class="ytdl-cfg-msg" id="ytdl-cfg-msg"></div>
            <div class="ytdl-version" style="margin-top:16px;font-size:11px;color:#666;text-align:center;">v1.1.6</div>
          </div>
        </div>
      </div>
    `;
    return panel;
  }

  // ─── Panel Logic ───────────────────────────────────────────
  function togglePanel() {
    const existing = document.getElementById("ytdl-popup-panel");
    if (existing) {
      existing.classList.remove("ytdl-popup-show");
      setTimeout(() => existing.remove(), 200);
      panelOpen = false;
      hideScissorsButton();
      return;
    }

    const panel = createPanel();
    document.body.appendChild(panel);

    // Position above the button
    const btn = document.getElementById("ytdl-action-btn");
    if (btn) {
      const rect = btn.getBoundingClientRect();
      panel.style.position = "fixed";
      panel.style.bottom = (window.innerHeight - rect.top + 8) + "px";
      panel.style.left = (rect.left + rect.width / 2 - 170) + "px";
      panel.style.right = "auto";
    }

    requestAnimationFrame(() => panel.classList.add("ytdl-popup-show"));
    panelOpen = true;
    scissorsUnlockedForVideo = true;
    injectScissorsButton(true);
    applyScissorsToPanel();

    setupPanelEvents(panel);
    loadVideoData();
  }

  function setupPanelEvents(panel) {
    // Close
    panel.querySelector("#ytdl-close-btn").addEventListener("click", () => {
      stopPreview();
      panel.classList.remove("ytdl-popup-show");
      setTimeout(() => panel.remove(), 200);
      panelOpen = false;
      hideScissorsButton();
    });

    // Drag & Drop on header
    const header = panel.querySelector(".ytdl-popup-header");
    const inner = panel.querySelector(".ytdl-popup-inner");
    if (header && inner) {
      let dragging = false, startX, startY, startLeft, startTop;

      header.addEventListener("mousedown", (e) => {
        if (e.target.closest("#ytdl-close-btn")) return;
        dragging = true;
        panel.classList.add("ytdl-dragging");

        const rect = panel.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;

        // Switch to absolute positioning for free movement
        panel.style.position = "fixed";
        panel.style.left = startLeft + "px";
        panel.style.top = startTop + "px";
        panel.style.bottom = "auto";
        panel.style.right = "auto";

        e.preventDefault();
      });

      document.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        panel.style.left = (startLeft + dx) + "px";
        panel.style.top = (startTop + dy) + "px";
      });

      document.addEventListener("mouseup", () => {
        if (dragging) {
          dragging = false;
          panel.classList.remove("ytdl-dragging");
        }
      });
    }

    // Tabs
    panel.querySelectorAll(".ytdl-popup-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        panel.querySelectorAll(".ytdl-popup-tab").forEach(t => t.classList.remove("active"));
        panel.querySelectorAll(".ytdl-popup-content").forEach(c => c.classList.remove("active"));
        tab.classList.add("active");
        panel.querySelector(`[data-content="${tab.dataset.tab}"]`).classList.add("active");
        if (tab.dataset.tab === "history") {
          loadHistoryData(panel);
        }
      });
    });

    panel.querySelector("#ytdl-hist-refresh")?.addEventListener("click", () => {
      loadHistoryData(panel);
    });

    // Chips
    panel.querySelectorAll(".ytdl-chips").forEach(group => {
      group.querySelectorAll(".ytdl-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          group.querySelectorAll(".ytdl-chip").forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
          if (group.id === "ytdl-v-fmt") renderQualities();
        });
      });
    });

    // Sliders
    setupSliders(panel);

    // Include/Exclude Audio toggle in Video tab
    panel.querySelector("#ytdl-v-include-audio")?.addEventListener("change", (e) => {
      const isAudioOn = e.target.checked;
      const notice = panel.querySelector("#ytdl-no-audio-notice");
      if (notice) {
        notice.style.visibility = isAudioOn ? "hidden" : "visible";
        if (!isAudioOn) {
          const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(defaultSettings.defLang, k) : k;
          notice.textContent = t("noAudioNotice") || "(Sin Audio)";
        }
      }
    });

    // Preview trim checkboxes
    panel.querySelector("#ytdl-v-preview-cb")?.addEventListener("change", (e) => {
      if (e.target.checked) {
        startPreview("v");
      } else {
        stopPreview();
      }
    });
    panel.querySelector("#ytdl-a-preview-cb")?.addEventListener("change", (e) => {
      if (e.target.checked) {
        startPreview("a");
      } else {
        stopPreview();
      }
    });

    // Retry
    panel.querySelector("#ytdl-retry")?.addEventListener("click", () => {
      panel.querySelector("#ytdl-server-err").style.display = "none";
      panel.querySelector("#ytdl-loading").style.display = "flex";
      loadVideoData();
    });

    // Download Video
    panel.querySelector("#ytdl-dl-video").addEventListener("click", () => startDownload("video"));

    // Download Audio
    panel.querySelector("#ytdl-dl-audio").addEventListener("click", () => startDownload("audio"));

    // Save Config
    panel.querySelector("#ytdl-save-cfg").addEventListener("click", () => {
      const dir = panel.querySelector("#ytdl-out-dir").value.trim();
      const dLang = panel.querySelector("#ytdl-def-lang")?.value || "en";
      const vfmt = panel.querySelector("#ytdl-def-vfmt").value;
      const vq = panel.querySelector("#ytdl-def-vq").value;
      const afmt = panel.querySelector("#ytdl-def-afmt").value;
      const aq = panel.querySelector("#ytdl-def-aq").value;
      const dThumb = panel.querySelector("#ytdl-def-thumb")?.checked || false;
      const dSub = panel.querySelector("#ytdl-def-sub")?.checked || false;
      const dAudio = panel.querySelector("#ytdl-def-audio")?.checked || false;
      defaultSettings = { outputDir: dir, defLang: dLang, videoFormat: vfmt, videoQuality: vq, audioFormat: afmt, audioQuality: aq, defThumb: dThumb, defSub: dSub, defAudio: dAudio };
      storage.local.set({ settings: defaultSettings }, () => {
        applyOptionVisibilities(panel);
        applyPanelTranslations(panel, defaultSettings.defLang);
        const msg = panel.querySelector("#ytdl-cfg-msg");
        const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(defaultSettings.defLang, k) : k;
        msg.textContent = t("savedMsg") || "Saved!";
        msg.className = "ytdl-cfg-msg ok";
        setTimeout(() => { msg.textContent = ""; msg.className = "ytdl-cfg-msg"; }, 2000);
      });
    });

    panel.querySelector("#ytdl-def-lang")?.addEventListener("change", () => {
      const selectedLang = panel.querySelector("#ytdl-def-lang").value;
      defaultSettings.defLang = selectedLang;
      applyPanelTranslations(panel, selectedLang);
    });

    ["#ytdl-def-thumb", "#ytdl-def-sub", "#ytdl-def-audio"].forEach(sel => {
      panel.querySelector(sel)?.addEventListener("change", () => {
        applyOptionVisibilities(panel);
      });
    });

    // Load saved config
    storage.local.get("settings", (r) => {
      if (r.settings) {
        defaultSettings = { ...defaultSettings, ...r.settings };
        if (r.settings.outputDir) panel.querySelector("#ytdl-out-dir").value = r.settings.outputDir;
        if (r.settings.defLang && panel.querySelector("#ytdl-def-lang")) {
          panel.querySelector("#ytdl-def-lang").value = r.settings.defLang;
        } else if (panel.querySelector("#ytdl-def-lang")) {
          panel.querySelector("#ytdl-def-lang").value = defaultSettings.defLang || "en";
        }
        if (r.settings.videoFormat) panel.querySelector("#ytdl-def-vfmt").value = r.settings.videoFormat;
        if (r.settings.videoQuality) panel.querySelector("#ytdl-def-vq").value = r.settings.videoQuality;
        if (r.settings.audioFormat) panel.querySelector("#ytdl-def-afmt").value = r.settings.audioFormat;
        if (r.settings.audioQuality) panel.querySelector("#ytdl-def-aq").value = r.settings.audioQuality;
        if (r.settings.defThumb !== undefined && panel.querySelector("#ytdl-def-thumb")) panel.querySelector("#ytdl-def-thumb").checked = !!r.settings.defThumb;
        if (r.settings.defSub !== undefined && panel.querySelector("#ytdl-def-sub")) panel.querySelector("#ytdl-def-sub").checked = !!r.settings.defSub;
        if (r.settings.defAudio !== undefined && panel.querySelector("#ytdl-def-audio")) panel.querySelector("#ytdl-def-audio").checked = !!r.settings.defAudio;

        // Apply default video format chip
        const vfmtChip = panel.querySelector(`#ytdl-v-fmt .ytdl-chip[data-v="${defaultSettings.videoFormat}"]`);
        if (vfmtChip) {
          panel.querySelectorAll("#ytdl-v-fmt .ytdl-chip").forEach(c => c.classList.remove("active"));
          vfmtChip.classList.add("active");
        }
        // Apply default audio format chip
        const afmtChip = panel.querySelector(`#ytdl-a-fmt .ytdl-chip[data-v="${defaultSettings.audioFormat}"]`);
        if (afmtChip) {
          panel.querySelectorAll("#ytdl-a-fmt .ytdl-chip").forEach(c => c.classList.remove("active"));
          afmtChip.classList.add("active");
        }
        // Apply default audio quality chip
        const aqChip = panel.querySelector(`#ytdl-a-q .ytdl-chip[data-v="${defaultSettings.audioQuality}"]`);
        if (aqChip) {
          panel.querySelectorAll("#ytdl-a-q .ytdl-chip").forEach(c => c.classList.remove("active"));
          aqChip.classList.add("active");
        }
      }
      applyOptionVisibilities(panel);
      applyPanelTranslations(panel, defaultSettings.defLang || "en");
    });

    panel.addEventListener("mousedown", (e) => e.stopPropagation());
    panel.addEventListener("pointerdown", (e) => e.stopPropagation());

    // Click outside to close (but NOT on the YouTube player or inside panel)
    document.addEventListener("mousedown", function outsideClick(e) {
      if (document.getElementById("ytdl-popup-panel")?.contains(e.target)) return;
      if (document.getElementById("ytdl-action-btn")?.contains(e.target)) return;
      if (e.target.closest("#movie_player, .html5-video-player, video, ytd-player")) return;

      stopPreview();
      const p = document.getElementById("ytdl-popup-panel");
      if (p) {
        p.classList.remove("ytdl-popup-show");
        setTimeout(() => p.remove(), 200);
      }
      panelOpen = false;
      hideScissorsButton();
      document.removeEventListener("mousedown", outsideClick);
    });
  }

  function applyPanelTranslations(panel, lang) {
    if (!panel) return;
    const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(lang, k) : k;

    // Header
    if (panel.querySelector("#i18n-subtitleCreator")) panel.querySelector("#i18n-subtitleCreator").textContent = t("subtitleCreator");
    if (panel.querySelector("#i18n-buyMeKofi")) panel.querySelector("#i18n-buyMeKofi").textContent = t("buyMeKofi");
    if (panel.querySelector("#ytdl-header-drag")) panel.querySelector("#ytdl-header-drag").setAttribute("title", t("dragTitle") || "Haz clic y arrastra para mover la ventana");

    // Tabs
    const tabs = panel.querySelectorAll(".ytdl-popup-tab");
    tabs.forEach(tab => {
      const dt = tab.dataset.tab;
      if (dt === "video") tab.lastChild.textContent = " " + t("tabVideo");
      if (dt === "audio") tab.lastChild.textContent = " " + t("tabAudio");
      if (dt === "history") tab.lastChild.textContent = " " + t("tabHistory");
    });

    // Video tab
    if (panel.querySelector("#ytdl-server-err span")) panel.querySelector("#ytdl-server-err span").textContent = t("serverErr");
    if (panel.querySelector("#ytdl-retry")) panel.querySelector("#ytdl-retry").textContent = t("retryServer");
    if (panel.querySelector("#ytdl-loading span")) panel.querySelector("#ytdl-loading span").textContent = t("loadingQualities");
    if (panel.querySelector("#ytdl-vfmt-row label")) panel.querySelector("#ytdl-vfmt-row label").textContent = t("formatLabel");
    if (panel.querySelector("#ytdl-opt-thumb + span")) panel.querySelector("#ytdl-opt-thumb + span").textContent = t("thumbCb");
    if (panel.querySelector("#ytdl-opt-sub + span")) panel.querySelector("#ytdl-opt-sub + span").textContent = t("subCb");
    if (panel.querySelector("#ytdl-opt-v-audio + span")) panel.querySelector("#ytdl-opt-v-audio + span").textContent = t("audioCb");
    if (panel.querySelector("#ytdl-video-trim .ytdl-trim-header span:first-child")) panel.querySelector("#ytdl-video-trim .ytdl-trim-header span:first-child").textContent = t("trimLabel");
    if (panel.querySelector("#ytdl-video-trim .ytdl-preview-label")) panel.querySelector("#ytdl-video-trim .ytdl-preview-label").textContent = t("previewCb");
    if (panel.querySelector("#ytdl-dl-video")) panel.querySelector("#ytdl-dl-video").lastChild.textContent = " " + t("dlVideoBtn");
    if (panel.querySelector("#ytdl-audio-toggle-wrapper")) panel.querySelector("#ytdl-audio-toggle-wrapper").setAttribute("title", t("audioToggleTitle") || "Incluir / Excluir Audio");
    if (panel.querySelector("#ytdl-no-audio-notice")) panel.querySelector("#ytdl-no-audio-notice").textContent = t("noAudioNotice") || "(Sin Audio)";

    // Audio tab
    const afmtRow = panel.querySelector("[data-content='audio'] .ytdl-opt-row:nth-of-type(1) label");
    if (afmtRow) afmtRow.textContent = t("formatLabel");
    const aqRow = panel.querySelector("[data-content='audio'] .ytdl-opt-row:nth-of-type(2) label");
    if (aqRow) aqRow.textContent = t("qualityLabel");
    if (panel.querySelector("#ytdl-opt-a-audio + span")) panel.querySelector("#ytdl-opt-a-audio + span").textContent = t("audioCb");
    if (panel.querySelector("#ytdl-audio-trim .ytdl-trim-header span:first-child")) panel.querySelector("#ytdl-audio-trim .ytdl-trim-header span:first-child").textContent = t("trimLabel");
    if (panel.querySelector("#ytdl-audio-trim .ytdl-preview-label")) panel.querySelector("#ytdl-audio-trim .ytdl-preview-label").textContent = t("previewCb");
    if (panel.querySelector("#ytdl-dl-audio")) panel.querySelector("#ytdl-dl-audio").lastChild.textContent = " " + t("dlAudioBtn");

    // History tab
    if (panel.querySelector(".ytdl-history-header span")) panel.querySelector(".ytdl-history-header span").textContent = t("histHeader");

    // Config tab
    const cfgRows = panel.querySelectorAll("[data-content='config'] .ytdl-opt-row");
    if (cfgRows[0]) {
      const lbl = cfgRows[0].querySelector("label");
      const sm = cfgRows[0].querySelector("small");
      if (lbl) lbl.textContent = t("cfgOutDir");
      if (sm) sm.textContent = t("cfgOutDirSmall");
    }
    if (cfgRows[1]) {
      const lbl = cfgRows[1].querySelector("label");
      if (lbl) lbl.textContent = t("cfgSelectLang");
    }
    if (cfgRows[2]) {
      const lbl = cfgRows[2].querySelector("label");
      if (lbl) lbl.textContent = t("cfgDefVfmt");
    }
    if (cfgRows[3]) {
      const lbl = cfgRows[3].querySelector("label");
      if (lbl) lbl.textContent = t("cfgDefVq");
    }
    if (cfgRows[4]) {
      const lbl = cfgRows[4].querySelector("label");
      if (lbl) lbl.textContent = t("cfgDefAfmt");
    }
    if (cfgRows[5]) {
      const lbl = cfgRows[5].querySelector("label");
      if (lbl) lbl.textContent = t("cfgDefAq");
    }
    if (cfgRows[6]) {
      const lbl = cfgRows[6].querySelector("label");
      if (lbl) lbl.textContent = t("cfgDefCheckboxes");
      const cbs = cfgRows[6].querySelectorAll(".ytdl-checkbox-label span");
      if (cbs[0]) cbs[0].textContent = t("cfgThumbCheck");
      if (cbs[1]) cbs[1].textContent = t("cfgSubCheck");
      if (cbs[2]) cbs[2].textContent = t("cfgAudioCheck");
    }
    if (panel.querySelector("#ytdl-save-cfg")) panel.querySelector("#ytdl-save-cfg").lastChild.textContent = " " + t("saveBtn");
  }

  function applyOptionVisibilities(panel) {
    if (!panel) return;
    const isThumbEnabled = panel.querySelector("#ytdl-def-thumb")?.checked || !!defaultSettings.defThumb;
    const isSubEnabled = panel.querySelector("#ytdl-def-sub")?.checked || !!defaultSettings.defSub;
    const isAudioEnabled = panel.querySelector("#ytdl-def-audio")?.checked || !!defaultSettings.defAudio;

    // Thumbnail option in Video tab
    const thumbContainer = panel.querySelector("#ytdl-opt-thumb")?.closest(".ytdl-checkbox-label");
    if (thumbContainer) thumbContainer.style.display = isThumbEnabled ? "flex" : "none";

    // Subtitle option in Video tab
    const subContainer = panel.querySelector("#ytdl-opt-sub")?.closest(".ytdl-checkbox-label");
    const selSub = panel.querySelector("#ytdl-sel-sub");
    if (subContainer) subContainer.style.display = isSubEnabled ? "flex" : "none";
    if (!isSubEnabled && selSub) selSub.style.display = "none";
    else if (isSubEnabled && selSub && panel.querySelector("#ytdl-opt-sub")?.checked) selSub.style.display = "block";

    // Multi-lang audio option in Video tab
    const vAudioContainer = panel.querySelector("#ytdl-opt-v-audio")?.closest(".ytdl-checkbox-label");
    const selVAudio = panel.querySelector("#ytdl-sel-v-audio");
    if (vAudioContainer) vAudioContainer.style.display = isAudioEnabled ? "flex" : "none";
    if (!isAudioEnabled && selVAudio) selVAudio.style.display = "none";
    else if (isAudioEnabled && selVAudio && panel.querySelector("#ytdl-opt-v-audio")?.checked) selVAudio.style.display = "block";

    // Multi-lang audio option in Audio tab
    const aAudioContainer = panel.querySelector("#ytdl-opt-a-audio")?.closest(".ytdl-checkbox-label");
    const selAAudio = panel.querySelector("#ytdl-sel-a-audio");
    if (aAudioContainer) aAudioContainer.style.display = isAudioEnabled ? "flex" : "none";
    if (!isAudioEnabled && selAAudio) selAAudio.style.display = "none";
    else if (isAudioEnabled && selAAudio && panel.querySelector("#ytdl-opt-a-audio")?.checked) selAAudio.style.display = "block";

    // Check if extra container in video has anything visible
    const vExtras = panel.querySelector('[data-content="video"] .ytdl-opt-extras');
    if (vExtras) {
      vExtras.style.display = (isThumbEnabled || isSubEnabled || isAudioEnabled) ? "block" : "none";
    }
    const aExtras = panel.querySelector('[data-content="audio"] .ytdl-opt-extras');
    if (aExtras) {
      aExtras.style.display = isAudioEnabled ? "block" : "none";
    }
  }

  function updateDisplayedSizes(panel) {
    if (!panel) return;
    const dur = videoInfo?.duration || 1;
    const startVal = parseInt(panel.querySelector("#ytdl-v-start")?.value || "0");
    const endVal = parseInt(panel.querySelector("#ytdl-v-end")?.value || "1000");
    const isTrimmed = (startVal > 0 || endVal < 1000);
    const ratio = isTrimmed ? Math.max(0.01, (endVal - startVal) / 1000) : 1;

    panel.querySelectorAll(".ytdl-q-btn").forEach(btn => {
      const rawSize = parseInt(btn.dataset.rawSize || "0");
      const infoSpan = btn.querySelector(".ytdl-q-info");
      if (!infoSpan) return;
      if (rawSize > 0) {
        const calculated = ratio * rawSize;
        const mb = (calculated / 1048576).toFixed(ratio < 0.1 ? 1 : 0);
        infoSpan.textContent = isTrimmed ? `~${mb} MB` : `${mb} MB`;
      } else {
        infoSpan.textContent = btn.dataset.ext || "mp4";
      }
    });
  }

  async function loadHistoryData(panel) {
    const listEl = panel?.querySelector("#ytdl-history-list");
    if (!listEl) return;
    listEl.innerHTML = `<div class="ytdl-history-empty">Cargando descargas...</div>`;
    const res = await serverRequest("/history");
    if (!res || !res.downloads || res.downloads.length === 0) {
      listEl.innerHTML = `<div class="ytdl-history-empty">No hay descargas en esta sesión</div>`;
      return;
    }
    listEl.textContent = "";
    res.downloads.slice().reverse().forEach(d => {
      const item = document.createElement("div");
      item.className = "ytdl-hist-item";
      const icon = d.type === "audio" ? "🎵" : "🎬";
      const st = d.status === "complete" ? "✅ Listo" : d.status === "processing" ? "⏳ Procesando..." : d.status === "error" ? "❌ Error" : `${Math.round(d.progress || 0)}%`;

      const infoDiv = document.createElement("div");
      infoDiv.className = "ytdl-hist-info";

      const titleSpan = document.createElement("span");
      titleSpan.className = "ytdl-hist-title";
      titleSpan.textContent = `${icon} ${d.title || "Video"}`;

      const statusSpan = document.createElement("span");
      statusSpan.className = `ytdl-hist-status ${d.status}`;
      statusSpan.textContent = st;

      infoDiv.appendChild(titleSpan);
      infoDiv.appendChild(statusSpan);

      const barDiv = document.createElement("div");
      barDiv.className = "ytdl-hist-bar";
      const fillDiv = document.createElement("div");
      fillDiv.className = "ytdl-hist-bar-fill";
      fillDiv.style.width = `${d.progress || 0}%`;
      barDiv.appendChild(fillDiv);

      item.appendChild(infoDiv);
      item.appendChild(barDiv);

      if (d.status === "complete") {
        const openBtn = document.createElement("button");
        openBtn.className = "ytdl-hist-open-btn";
        openBtn.textContent = "📁 Abrir Carpeta";
        openBtn.addEventListener("click", () => {
          serverPost("/open_folder", { id: d.id, path: d.output_dir });
        });
        item.appendChild(openBtn);
      }
      listEl.appendChild(item);
    });
  }

  function setupSliders(panel) {
    // Remove old handlers
    trimUpdateHandlers.forEach(h => h.destroy());
    trimUpdateHandlers = [];

    ["v", "a"].forEach(prefix => {
      const start = panel.querySelector(`#ytdl-${prefix}-start`);
      const end = panel.querySelector(`#ytdl-${prefix}-end`);
      const fill = panel.querySelector(`#ytdl-${prefix}-fill`);
      const timeA = panel.querySelector(`#ytdl-${prefix}-time-a`);
      const timeB = panel.querySelector(`#ytdl-${prefix}-time-b`);
      const trimText = panel.querySelector(`#ytdl-${prefix}-trim-text`);

      if (!start || !end) return;

      function update(fromInput = false) {
        const dur = videoInfo?.duration || 600;
        let s, e;
        
        if (fromInput) {
          s = (parseTime(timeA.value) / dur) * 1000;
          e = (parseTime(timeB.value) / dur) * 1000;
          if (s < 0) s = 0;
          if (e > 1000) e = 1000;
          if (s > e - 20) s = Math.max(0, e - 20);
          start.value = s;
          end.value = e;
        } else {
          s = parseInt(start.value);
          e = parseInt(end.value);
          if (s > e - 20) { start.value = e - 20; s = e - 20; }
        }

        fill.style.left = (s / 10) + "%";
        fill.style.width = ((e - s) / 10) + "%";

        const tStart = formatTime((s / 1000) * dur);
        const tEnd = formatTime((e / 1000) * dur);
        
        if (!fromInput) {
          timeA.value = tStart;
          timeB.value = tEnd;
        }
        
        if (trimText) {
           const remainSecs = ((e - s) / 1000) * dur;
           trimText.textContent = `Restante: ${formatTime(remainSecs)}`;
        }

        if (prefix === "v") {
          updateDisplayedSizes(panel);
        }

        // If preview is active, seek player and update overlay
        if (previewMode === prefix) {
          seekToTrimStart(prefix);
          const video = getYouTubeVideo();
          const currentPct = video ? video.currentTime / dur : s / 1000;
          updateProgressOverlay(s / 1000, e / 1000, currentPct);
        }
      }

      const handleSliderInput = (e) => {
        if (!isApplyingScissors && e && e.isTrusted && (scissorsState > 0 || scissorsTrimA !== null || scissorsTrimB !== null)) {
          resetScissorsTool();
        }
        update(false);
      };

      start.addEventListener("input", handleSliderInput);
      end.addEventListener("input", handleSliderInput);
      
      const handleInputEdit = (e) => {
        if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
          if (!isApplyingScissors && e && e.isTrusted && (scissorsState > 0 || scissorsTrimA !== null || scissorsTrimB !== null)) {
            resetScissorsTool();
          }
          update(true);
        }
      };
      
      if (timeA && timeB) {
          timeA.addEventListener("blur", handleInputEdit);
          timeA.addEventListener("keydown", handleInputEdit);
          timeB.addEventListener("blur", handleInputEdit);
          timeB.addEventListener("keydown", handleInputEdit);
      }

      update();

      trimUpdateHandlers.push({ destroy: () => {
        start.removeEventListener("input", handleSliderInput);
        end.removeEventListener("input", handleSliderInput);
        if (timeA && timeB) {
            timeA.removeEventListener("blur", handleInputEdit);
            timeA.removeEventListener("keydown", handleInputEdit);
            timeB.removeEventListener("blur", handleInputEdit);
            timeB.removeEventListener("keydown", handleInputEdit);
        }
      }});
    });
  }

  // ─── Preview Trim ─────────────────────────────────────────
  function getYouTubeVideo() {
    return document.querySelector("video.html5-main-video, video.video-stream, video");
  }

  function getTrimRange(prefix) {
    const panel = document.getElementById("ytdl-popup-panel");
    if (!panel) return null;
    const dur = videoInfo?.duration || 600;
    const s = parseInt(panel.querySelector(`#ytdl-${prefix}-start`)?.value || 0);
    const e = parseInt(panel.querySelector(`#ytdl-${prefix}-end`)?.value || 1000);
    return {
      start: (s / 1000) * dur,
      end: (e / 1000) * dur
    };
  }

  function seekToTrimStart(prefix) {
    const video = getYouTubeVideo();
    const range = getTrimRange(prefix);
    if (video && range) {
      video.currentTime = range.start;
    }
  }

  function onYouTubeTimeUpdate() {
    if (!previewMode) return;
    const video = getYouTubeVideo();
    if (!video) return;
    const range = getTrimRange(previewMode);
    if (!range) return;
    const dur = videoInfo?.duration || 1;

    // Loop: when reaching end, jump back to start
    if (video.currentTime >= range.end) {
      video.currentTime = range.start;
    }

    // Update overlay: played (light blue) vs unplayed (dark blue) within trim
    const currentPct = video.currentTime / dur;
    updateProgressOverlay(range.start / dur, range.end / dur, currentPct);
  }

  function startPreview(prefix) {
    stopPreview();
    previewMode = prefix;

    const video = getYouTubeVideo();
    if (!video) return;

    const range = getTrimRange(prefix);
    if (!range) return;

    // Seek to start and play
    video.currentTime = range.start;
    if (video.paused) {
      video.play().catch(() => {});
    }

    // Add loop constraint via timeupdate
    video.addEventListener("timeupdate", onYouTubeTimeUpdate);

    // Add preview class to player for styling
    const player = document.querySelector("#movie_player, .html5-video-player");
    if (player) player.classList.add("ytdl-preview-active");

    // Show indicator + overlay on progress bar
    showPreviewIndicator(true);
    createProgressOverlay();
    const dur = videoInfo?.duration || 1;
    updateProgressOverlay(range.start / dur, range.end / dur, range.start / dur);
  }

  function stopPreview() {
    previewMode = null;
    const video = getYouTubeVideo();
    if (video) {
      video.removeEventListener("timeupdate", onYouTubeTimeUpdate);
    }
    // Remove preview class from player
    const player = document.querySelector("#movie_player, .html5-video-player");
    if (player) player.classList.remove("ytdl-preview-active");

    showPreviewIndicator(false);
    removeProgressOverlay();
  }

  // ─── Progress Bar Overlay ──────────────────────────────────
  function createProgressOverlay() {
    removeProgressOverlay();
    const player = document.querySelector("#movie_player, .html5-video-player");
    if (!player) return;

    const progressBar = player.querySelector(".ytp-progress-bar");
    if (!progressBar) return;

    const overlay = document.createElement("div");
    overlay.id = "ytdl-trim-overlay";
    overlay.innerHTML = `
      <div class="ytdl-ov-dim ytdl-ov-dim-left"></div>
      <div class="ytdl-ov-played"></div>
      <div class="ytdl-ov-unplayed"></div>
      <div class="ytdl-ov-dim ytdl-ov-dim-right"></div>
    `;
    progressBar.insertBefore(overlay, progressBar.firstChild);
  }

  function updateProgressOverlay(trimStartPct, trimEndPct, currentPct) {
    const overlay = document.getElementById("ytdl-trim-overlay");
    if (!overlay) return;

    const dimLeft = overlay.querySelector(".ytdl-ov-dim-left");
    const played = overlay.querySelector(".ytdl-ov-played");
    const unplayed = overlay.querySelector(".ytdl-ov-unplayed");
    const dimRight = overlay.querySelector(".ytdl-ov-dim-right");

    // Clamp current position within trim range
    const clamped = Math.max(trimStartPct, Math.min(trimEndPct, currentPct));

    // Dim: outside trim range (dark gray)
    if (dimLeft) dimLeft.style.width = (trimStartPct * 100) + "%";
    if (dimRight) {
      dimRight.style.left = (trimEndPct * 100) + "%";
      dimRight.style.width = ((1 - trimEndPct) * 100) + "%";
    }

    // Played: from trim start to current position (light blue)
    if (played) {
      played.style.left = (trimStartPct * 100) + "%";
      played.style.width = ((clamped - trimStartPct) * 100) + "%";
    }

    // Unplayed: from current position to trim end (dark blue)
    if (unplayed) {
      unplayed.style.left = (clamped * 100) + "%";
      unplayed.style.width = ((trimEndPct - clamped) * 100) + "%";
    }
  }

  function removeProgressOverlay() {
    const existing = document.getElementById("ytdl-trim-overlay");
    if (existing) existing.remove();
  }

  function showPreviewIndicator(on) {
    const existing = document.getElementById("ytdl-preview-badge");
    if (existing) existing.remove();
    if (!on) return;

    const badge = document.createElement("div");
    badge.id = "ytdl-preview-badge";
    badge.textContent = "Previsualizando recorte";
    document.body.appendChild(badge);
  }

  // ─── Load Video Data ───────────────────────────────────────
  async function loadVideoData() {
    currentVideoUrl = window.location.href;

    const info = await serverRequest(`/info?url=${encodeURIComponent(currentVideoUrl)}`);
    if (info.error) {
      const errEl = document.getElementById("ytdl-server-err");
      const loadEl = document.getElementById("ytdl-loading");
      if (errEl) errEl.style.display = "flex";
      if (loadEl) loadEl.style.display = "none";
      return;
    }

    videoInfo = info;

    const data = await serverRequest(`/formats?url=${encodeURIComponent(currentVideoUrl)}`);
    if (data.error) {
      const loadEl = document.getElementById("ytdl-loading");
      if (loadEl) { loadEl.textContent = ""; const errSpan = document.createElement("span"); errSpan.style.color = "#f44336"; errSpan.textContent = data.error; loadEl.appendChild(errSpan); }
      return;
    }

    formatsData = data;
    renderQualities();
  }

  function renderQualities() {
    const container = document.getElementById("ytdl-qualities");
    const loading = document.getElementById("ytdl-loading");
    const trimVideo = document.getElementById("ytdl-video-trim");
    const trimAudio = document.getElementById("ytdl-audio-trim");
    const dlBtn = document.getElementById("ytdl-dl-video");

    if (loading) loading.style.display = "none";

    const targetRes = ["1080p", "720p", "480p", "360p", "240p", "144p"];
    const selectedFmt = document.querySelector("#ytdl-v-fmt .ytdl-chip.active")?.dataset.v || "mp4";

    const videoFormats = formatsData?.formats?.filter(f =>
      f.type === "video" && f.resolution && targetRes.includes(f.resolution)
    ) || [];

    const fmtGroups = {};
    videoFormats.forEach(fmt => {
      const resKey = fmt.resolution;
      const extKey = fmt.ext || selectedFmt;
      if (!fmtGroups[resKey]) fmtGroups[resKey] = {};
      if (!fmtGroups[resKey][extKey]) fmtGroups[resKey][extKey] = [];
      fmtGroups[resKey][extKey].push(fmt);
    });

    if (container) container.innerHTML = "";
    targetRes.forEach(res => {
      const exts = fmtGroups[res];
      if (!exts) return;
      const formats = exts[selectedFmt] || exts[Object.keys(exts)[0]];
      if (!formats || formats.length === 0) return;
      const fmt = formats[0];
      const btn = document.createElement("button");
      btn.className = "ytdl-q-btn";
      btn.dataset.fmt = fmt.format_id;
      btn.dataset.rawSize = fmt.filesize || 0;
      btn.dataset.ext = fmt.ext || selectedFmt;
      const size = fmt.filesize ? `${(fmt.filesize / 1048576).toFixed(0)} MB` : fmt.ext;
      const resSpan = document.createElement("span"); resSpan.className = "ytdl-q-res"; resSpan.textContent = res;
      const infoSpan = document.createElement("span"); infoSpan.className = "ytdl-q-info"; infoSpan.textContent = size;
      btn.appendChild(resSpan); btn.appendChild(infoSpan);
      btn.addEventListener("click", () => {
        container.querySelectorAll(".ytdl-q-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
      container.appendChild(btn);
    });

    // Select default quality based on settings
    const defaultQ = defaultSettings.videoQuality || '1080p';
    const defaultBtn = container.querySelector(`.ytdl-q-btn`) && Array.from(container.querySelectorAll('.ytdl-q-btn')).find(b => {
      const resText = b.querySelector('.ytdl-q-res')?.textContent;
      return resText === defaultQ;
    });
    if (defaultBtn) {
      defaultBtn.classList.add("active");
    } else {
      const first = container.querySelector(".ytdl-q-btn");
      if (first) first.classList.add("active");
    }

    if (trimVideo) trimVideo.style.display = "block";
    if (trimAudio) trimAudio.style.display = "block";
    if (dlBtn) dlBtn.disabled = false;
    applyScissorsToPanel();
    const audioToggleEl = document.getElementById("ytdl-popup-panel")?.querySelector("#ytdl-v-include-audio");
    const noAudioNoticeEl = document.getElementById("ytdl-popup-panel")?.querySelector("#ytdl-no-audio-notice");
    if (noAudioNoticeEl) {
      const isAudioOn = audioToggleEl ? audioToggleEl.checked : true;
      noAudioNoticeEl.style.visibility = isAudioOn ? "hidden" : "visible";
      const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(defaultSettings.defLang, k) : k;
      noAudioNoticeEl.textContent = t("noAudioNotice") || "(Sin Audio)";
    }

    // Populate extras (subtitles and multi-language audio tracks)
    const panel = document.getElementById("ytdl-popup-panel");
    if (panel) {
      // Subtitles
      const optSub = panel.querySelector("#ytdl-opt-sub");
      const selSub = panel.querySelector("#ytdl-sel-sub");
      if (optSub && selSub) {
        selSub.innerHTML = "";
        const allSubs = [
          ...(formatsData?.subtitles || []),
          ...(formatsData?.automatic_captions || [])
        ];
        if (allSubs.length === 0) {
          selSub.innerHTML = `<option value="">No hay subtítulos</option>`;
        } else {
          allSubs.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.lang;
            opt.textContent = s.name;
            selSub.appendChild(opt);
          });
        }
        optSub.onchange = () => { selSub.style.display = optSub.checked ? "block" : "none"; };
      }

      // Multi-lang Audio tracks
      const audioTracks = formatsData?.audio_tracks || [];
      ["v", "a"].forEach(prefix => {
        const optAudio = panel.querySelector(`#ytdl-opt-${prefix === "v" ? "v" : "a"}-audio`);
        const selAudio = panel.querySelector(`#ytdl-sel-${prefix === "v" ? "v" : "a"}-audio`);
        if (optAudio && selAudio) {
          selAudio.innerHTML = "";
          if (audioTracks.length === 0) {
            selAudio.innerHTML = `<option value="">Pista estándar únicamente</option>`;
          } else {
            audioTracks.forEach(at => {
              const opt = document.createElement("option");
              opt.value = at.format_id;
              opt.textContent = at.label;
              selAudio.appendChild(opt);
            });
          }
          optAudio.onchange = () => { selAudio.style.display = optAudio.checked ? "block" : "none"; };
        }
      });

      applyOptionVisibilities(panel);
      updateDisplayedSizes(panel);
    }

    setupSliders(document.getElementById("ytdl-popup-panel"));
  }

  // ─── Download ──────────────────────────────────────────────
  async function startDownload(type) {
    if (isDownloading) return;
    isDownloading = true;

    const panel = document.getElementById("ytdl-popup-panel");
    const btn = panel.querySelector(`#ytdl-dl-${type}`);
    const progress = panel.querySelector(`#ytdl-${type === "video" ? "v" : "a"}-progress`);
    const bar = panel.querySelector(`#ytdl-${type === "video" ? "v" : "a"}-bar`);
    const pct = panel.querySelector(`#ytdl-${type === "video" ? "v" : "a"}-pct`);

    btn.disabled = true;
    if (progress) progress.style.display = "flex";
    if (bar) bar.style.width = "0%";
    if (pct) pct.textContent = "Iniciando...";

    let body = { url: currentVideoUrl, type };

    if (type === "video") {
      const fmtBtn = panel.querySelector("#ytdl-qualities .ytdl-q-btn.active");
      if (!fmtBtn) { isDownloading = false; btn.disabled = false; return; }

      const fmtId = fmtBtn.dataset.fmt;
    const videoFormats = formatsData?.formats?.filter(f => f.type === "video" && f.resolution && f.resolution !== "unknown") || [];
      const audioFormats = formatsData?.formats?.filter(f => f.type === "audio") || [];
      const selectedFmt = videoFormats.find(f => f.format_id === fmtId);

      body.format_id = fmtId;
      const includeAudio = panel.querySelector("#ytdl-v-include-audio")?.checked !== false;
      if (selectedFmt?.type === "video" && audioFormats.length > 0 && includeAudio) {
        const bestAudio = audioFormats.find(f => f.ext === "m4a") || audioFormats[0];
        body.format_id = `${fmtId}+${bestAudio.format_id}`;
      }
      if (!includeAudio) {
        body.no_audio = true;
      }

      const dur = videoInfo?.duration || 600;
      const s = parseInt(panel.querySelector("#ytdl-v-start")?.value || 0);
      const e = parseInt(panel.querySelector("#ytdl-v-end")?.value || 1000);
      if (s > 10 || e < 990) {
        body.trim_start = formatTime((s / 1000) * dur);
        body.trim_end = formatTime((e / 1000) * dur);
      }

      if (panel.querySelector("#ytdl-opt-thumb")?.checked) {
        body.write_thumbnail = true;
      }
      if (panel.querySelector("#ytdl-opt-sub")?.checked) {
        const subLang = panel.querySelector("#ytdl-sel-sub")?.value;
        if (subLang) body.subtitle_lang = subLang;
      }
      if (panel.querySelector("#ytdl-opt-v-audio")?.checked) {
        const aTrack = panel.querySelector("#ytdl-sel-v-audio")?.value;
        if (aTrack) body.audio_track = aTrack;
      }
    } else {
      body.audio_format = panel.querySelector("#ytdl-a-fmt .ytdl-chip.active")?.dataset.v || "mp3";
      body.audio_quality = panel.querySelector("#ytdl-a-q .ytdl-chip.active")?.dataset.v || "192K";

      const dur = videoInfo?.duration || 600;
      const s = parseInt(panel.querySelector("#ytdl-a-start")?.value || 0);
      const e = parseInt(panel.querySelector("#ytdl-a-end")?.value || 1000);
      if (s > 10 || e < 990) {
        body.trim_start = formatTime((s / 1000) * dur);
        body.trim_end = formatTime((e / 1000) * dur);
      }

      if (panel.querySelector("#ytdl-opt-a-audio")?.checked) {
        const aTrack = panel.querySelector("#ytdl-sel-a-audio")?.value;
        if (aTrack) body.audio_track = aTrack;
      }
    }

    const res = await serverPost("/download", body);

    if (res?.id) {
      pollProgress(type, res.id);
    } else {
      if (pct) pct.textContent = `Error: ${res?.error || "desconocido"}`;
      isDownloading = false;
      btn.disabled = false;
    }
  }

  async function pollProgress(type, id) {
    const prefix = type === "video" ? "v" : "a";
    const panel = document.getElementById("ytdl-popup-panel");
    const bar = panel?.querySelector(`#ytdl-${prefix}-bar`);
    const pct = panel?.querySelector(`#ytdl-${prefix}-pct`);
    const btn = panel?.querySelector(`#ytdl-dl-${type}`);
    const progress = panel?.querySelector(`#ytdl-${prefix}-progress`);

    const check = async () => {
      const data = await serverRequest(`/progress?id=${id}`);

      if (data?.progress !== undefined) {
        const p = Math.min(100, Math.round(data.progress));
        if (bar) bar.style.width = p + "%";
        if (pct) pct.textContent = p + "%";
      }

      if (data?.status === "processing") {
        if (pct) pct.textContent = "Procesando...";
      }

      if (data?.status === "complete") {
        if (bar) bar.style.width = "100%";
        if (pct) pct.textContent = "¡Completado!";
        isDownloading = false;
        if (btn) {
          btn.disabled = false;
          btn.classList.add("ytdl-btn-success");
          const origNodes = Array.from(btn.childNodes);
          const svgNS = "http://www.w3.org/2000/svg";
          const checkSvg = document.createElementNS(svgNS, "svg");
          checkSvg.setAttribute("viewBox", "0 0 24 24");
          checkSvg.setAttribute("width", "16");
          checkSvg.setAttribute("height", "16");
          checkSvg.setAttribute("fill", "currentColor");
          const path = document.createElementNS(svgNS, "path");
          path.setAttribute("d", "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z");
          checkSvg.appendChild(path);

          const textSpan = document.createElement("span");
          textSpan.textContent = " ¡Descargado!";

          btn.replaceChildren(checkSvg, textSpan);
          setTimeout(() => {
            btn.classList.remove("ytdl-btn-success");
            btn.replaceChildren(...origNodes);
          }, 4000);
        }

        const openBtn = panel?.querySelector(`#ytdl-${prefix}-open-folder-btn`);
        if (openBtn) {
          openBtn.style.display = "inline-flex";
          openBtn.onclick = () => {
            serverPost("/open_folder", { id: id, path: data.output_dir });
          };
        }

        loadHistoryData(panel);

        setTimeout(() => {
          if (progress) progress.style.display = "none";
        }, 6000);
        return;
      }

      if (data?.status === "error") {
        if (pct) pct.textContent = "Error";
        isDownloading = false;
        if (btn) btn.disabled = false;
        return;
      }

      setTimeout(check, 800);
    };

    check();
  }

  // ─── SPA Observer ──────────────────────────────────────────
  let lastUrl = "";
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      stopPreview();
      const existing = document.getElementById("ytdl-action-btn");
      if (existing) existing.remove();
      const panel = document.getElementById("ytdl-popup-panel");
      if (panel) panel.remove();

      if (isVideoPage()) {
        formatsData = null;
        videoInfo = null;
        isDownloading = false;
        panelOpen = false;
        scissorsUnlockedForVideo = false;
        scissorsState = 0;
        scissorsTrimA = null;
        scissorsTrimB = null;
        hideScissorsButton(true);
        setTimeout(injectDownloadButton, 1500);
        setTimeout(injectDownloadButton, 3500);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ─── Init ──────────────────────────────────────────────────
  lastUrl = window.location.href;
  if (isVideoPage()) {
    setTimeout(injectDownloadButton, 1500);
    setTimeout(injectDownloadButton, 3500);
  }
})();
