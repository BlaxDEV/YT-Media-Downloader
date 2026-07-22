/*
 * Buttons Module - Action Bar, Download Button & Scissors Tool
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.buttons = {
  // ─── Custom Tooltip Helper ───────────────────────────────
  bindTooltip(btn, text, shortcut = "") {
    btn.removeAttribute("title");
    let tooltipEl = null;

    const show = () => {
      if (tooltipEl) return;
      const player = document.querySelector(".html5-video-player");
      if (!player) return;
      
      tooltipEl = document.createElement("div");
      tooltipEl.className = "ytdl-custom-tooltip";
      tooltipEl.style.cssText = "position:absolute; background:rgba(0,0,0,0.3); border-radius:8px; padding:6px 10px; font-size:13px; font-weight:400; font-family:'YouTube Noto',Roboto,Arial,sans-serif; color:#fff; z-index:9999; pointer-events:none; white-space:nowrap; transition:opacity 0.15s; line-height:1; backdrop-filter:blur(4px);";
      
      tooltipEl.textContent = "";
      const wrapper = document.createElement("div");
      wrapper.className = "ytp-tooltip-text-wrapper";

      const txtSpan = document.createElement("span");
      txtSpan.style.cssText = "display:inline-block; vertical-align:middle; text-shadow: 0 0 2px rgba(0,0,0,0.3);";
      txtSpan.textContent = (text === 'undefined' || !text) ? 'Tomar captura' : text;
      wrapper.appendChild(txtSpan);

      if (shortcut) {
        const scSpan = document.createElement("span");
        scSpan.style.cssText = "display:inline-block; vertical-align:middle; margin-left:8px; padding:2px 4px; border:1px solid rgba(255,255,255,0.2); border-radius:4px; font-size:11px; font-weight:500; color:#fff; font-family:Roboto,Arial,sans-serif;";
        scSpan.textContent = shortcut;
        wrapper.appendChild(scSpan);
      }
      tooltipEl.appendChild(wrapper);
      
      player.appendChild(tooltipEl);
      
      const btnRect = btn.getBoundingClientRect();
      const playerRect = player.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();
      
      const top = btnRect.top - playerRect.top - tooltipRect.height - 24; 
      const left = btnRect.left - playerRect.left + (btnRect.width / 2) - (tooltipRect.width / 2);
      
      tooltipEl.style.top = top + "px";
      tooltipEl.style.left = left + "px";
    };

    const hide = () => {
      if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
      }
    };

    btn.addEventListener("mouseenter", show);
    btn.addEventListener("mouseleave", hide);
    btn.addEventListener("click", hide);
  },

  // ─── Find YouTube Action Bar ───────────────────────────────
  findActionBar() {
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

    const selectors = [
      "ytd-watch-metadata ytd-menu-renderer #top-level-buttons-computed",
      "ytd-watch-metadata #top-level-buttons-computed",
      "ytd-watch-metadata #actions #top-level-buttons-computed",
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
  },

  // ─── Inject Download Button ─────────────────────────────────
  injectDownloadButton() {
    if (!window.YTDL.isVideoPage()) return;
    const getLang = () => window.YTDL?.state?.defaultSettings?.defLang || "en";
    const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(getLang(), k) : k;

    const actionBar = this.findActionBar();
    if (!actionBar) {
      setTimeout(() => this.injectDownloadButton(), 1000);
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
        btn.textContent = "";
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "24");
        svg.setAttribute("height", "24");
        svg.setAttribute("fill", "currentColor");
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", "12");
        circle.setAttribute("cy", "12");
        circle.setAttribute("r", "3.2");
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z");
        svg.appendChild(circle);
        svg.appendChild(path);
        btn.appendChild(svg);
      } else {
        btn.textContent = "";
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "24");
        svg.setAttribute("height", "24");
        svg.setAttribute("fill", "currentColor");
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z");
        svg.appendChild(path);

        const labelSpan = document.createElement("span");
        labelSpan.style.cssText = "font-family: 'Roboto', 'Arial', sans-serif; font-size: 14px; font-weight: 500;";
        labelSpan.textContent = t("ytDownloadBtn");

        btn.appendChild(svg);
        btn.appendChild(labelSpan);
      }

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.YTDL.panel.togglePanel();
      });
    } else if (!isShorts) {
      const span = btn.querySelector("span");
      if (span && window.YTDL_I18N_get) {
        const getLang = () => window.YTDL?.state?.defaultSettings?.defLang || "en";
        span.textContent = window.YTDL_I18N_get(getLang(), "ytDownloadBtn");
      }
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

  },

  // ─── Inject Camera Frame Grabber Button ─────────────────────
  injectCameraBtn(rightControls, scissorsBtn) {
    let cameraBtn = document.getElementById("ytdl-camera-btn");
    if (!cameraBtn && rightControls) {
      cameraBtn = document.createElement("button");
      cameraBtn.id = "ytdl-camera-btn";
      cameraBtn.className = "ytp-button";
      const title = typeof YTDL_I18N_get === "function" ? YTDL_I18N_get("cameraGrabTitle") : "Tomar captura";
      this.bindTooltip(cameraBtn, title);
      cameraBtn.style.cssText = "width:48px; height:100%; opacity:0.9; display:none; align-items:center; justify-content:center; position:relative; border:none; background:none; cursor:pointer; padding:0;";
      cameraBtn.textContent = "";
      const svgNS = "http://www.w3.org/2000/svg";
      const camSvg = document.createElementNS(svgNS, "svg");
      camSvg.setAttribute("viewBox", "0 0 24 24");
      camSvg.setAttribute("width", "24");
      camSvg.setAttribute("height", "24");
      camSvg.setAttribute("fill", "#bbb");
      const camPath = document.createElementNS(svgNS, "path");
      camPath.setAttribute("d", "M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h4.05l1.83-2h4.24l1.83 2H20v12zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z");
      camSvg.appendChild(camPath);
      cameraBtn.appendChild(camSvg);

      cameraBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const video = window.YTDL.preview.getYouTubeVideo();
        if (!video) return;
        
        const svg = cameraBtn.querySelector("svg");
        if (svg) svg.setAttribute("fill", "#fff");
        setTimeout(() => { if (svg) svg.setAttribute("fill", "#bbb"); }, 300);

        const currentTime = video.currentTime;
        const videoUrl = window.YTDL.state.currentVideoUrl || window.location.href;
        const titleText = window.YTDL.state.videoInfo?.title || document.title.replace(" - YouTube", "") || "Frame";
        const outDir = window.YTDL.state.defaultSettings.outputDir || "";

        let dataUrl = null;
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 1920;
          canvas.height = video.videoHeight || 1080;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const tryData = canvas.toDataURL("image/png");
          if (tryData && tryData.length > 2000) {
            dataUrl = tryData;
          }
        } catch (err) {
          // Cross-origin tainted canvas fallback handled smoothly by server
        }

        const payload = {
          url: videoUrl,
          timestamp: currentTime,
          title: titleText,
          output_dir: outDir
        };
        if (dataUrl) payload.data_url = dataUrl;

        await window.YTDL.serverPost("/frame_grab", payload);
        
        const badgeMsg = typeof YTDL_I18N_get === "function" ? YTDL_I18N_get("frameGrabbed") : "Frame captured & saved!";
        const existing = document.getElementById("ytdl-preview-badge");
        if (existing) existing.remove();
        const badge = document.createElement("div");
        badge.id = "ytdl-preview-badge";
        badge.textContent = `📸 ${badgeMsg}`;
        document.body.appendChild(badge);
        setTimeout(() => { if (badge && badge.parentNode) badge.remove(); }, 3000);
      });

      if (scissorsBtn && scissorsBtn.parentNode === rightControls) {
        rightControls.insertBefore(cameraBtn, scissorsBtn);
      } else {
        rightControls.insertBefore(cameraBtn, rightControls.firstChild);
      }
    }
  },

  // ─── Inject Scissors Button ─────────────────────────────────
  injectScissorsButton(animate = false) {
    const isShorts = window.location.pathname.startsWith("/shorts/");
    if (isShorts) return;

    let scissorsBtn = document.getElementById("ytdl-scissors-btn");
    const rightControls = document.querySelector(".ytp-right-controls");
    if (!rightControls) return;

    if (!scissorsBtn) {
      scissorsBtn = document.createElement("button");
      scissorsBtn.id = "ytdl-scissors-btn";
      scissorsBtn.className = "ytp-button";
      this.bindTooltip(scissorsBtn, "Modo Recorte");
      scissorsBtn.style.cssText = "width:48px; height:100%; opacity:0.9; display:none; align-items:center; justify-content:center; position:relative; border:none; background:none; cursor:pointer; padding:0;";
      scissorsBtn.textContent = "";
      const svgNS = "http://www.w3.org/2000/svg";
      const scisSvg = document.createElementNS(svgNS, "svg");
      scisSvg.setAttribute("viewBox", "0 0 24 24");
      scisSvg.setAttribute("width", "24");
      scisSvg.setAttribute("height", "24");
      scisSvg.setAttribute("fill", "#bbb");
      const scisPath = document.createElementNS(svgNS, "path");
      scisPath.setAttribute("d", "M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1.09l-9.91-9.91zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z");
      scisSvg.appendChild(scisPath);

      const scisLbl = document.createElement("span");
      scisLbl.id = "ytdl-scissors-label";
      scisLbl.style.cssText = "font-size:12px; font-weight:bold; color:#fff; position:absolute; bottom:6px; right:4px; text-shadow: 1px 1px 2px #000;";

      scissorsBtn.appendChild(scisSvg);
      scissorsBtn.appendChild(scisLbl);

      scissorsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const video = window.YTDL.preview.getYouTubeVideo();
        if (!video) return;

        const dur = window.YTDL.state.videoInfo?.duration || video.duration || 1;
        const currentTimeSec = video.currentTime;
        const currentVal = Math.round((currentTimeSec / dur) * 1000);
        const label = document.getElementById("ytdl-scissors-label");

        if (window.YTDL.state.scissorsState === 0) {
          window.YTDL.state.scissorsTimeSecA = currentTimeSec;
          window.YTDL.state.scissorsTimeSecB = null;
          window.YTDL.state.scissorsTrimA = currentVal;
          window.YTDL.state.scissorsTrimB = null;
          window.YTDL.state.scissorsState = 1;
          if (label) label.textContent = "A";
          const activeCol = window.YTDL.state.activeScissorsColor || "#ff1744";
          scissorsBtn.querySelector("svg").setAttribute("fill", activeCol);
        } else if (window.YTDL.state.scissorsState === 1) {
          if (currentTimeSec <= (window.YTDL.state.scissorsTimeSecA || 0) || currentVal <= window.YTDL.state.scissorsTrimA) {
            window.YTDL.state.scissorsTimeSecB = window.YTDL.state.scissorsTimeSecA;
            window.YTDL.state.scissorsTimeSecA = currentTimeSec;
            window.YTDL.state.scissorsTrimB = window.YTDL.state.scissorsTrimA;
            window.YTDL.state.scissorsTrimA = currentVal;
          } else {
            window.YTDL.state.scissorsTimeSecB = currentTimeSec;
            window.YTDL.state.scissorsTrimB = currentVal;
          }
          window.YTDL.state.scissorsState = 2;
          if (label) label.textContent = "B";
        } else {
          window.YTDL.state.scissorsTimeSecA = null;
          window.YTDL.state.scissorsTimeSecB = null;
          window.YTDL.state.scissorsTrimA = null;
          window.YTDL.state.scissorsTrimB = null;
          window.YTDL.state.scissorsState = 0;
          if (label) label.textContent = "";
          scissorsBtn.querySelector("svg").setAttribute("fill", "#bbb");
        }

        this.applyScissorsToPanel(window.YTDL.state.scissorsState === 0);

        if (window.YTDL.state.scissorsState > 0) {
          window.YTDL.preview.startPreview("v", false);
          const popup = document.getElementById("ytdl-popup-panel");
          if (popup) {
            const activeTab = popup.querySelector('.ytdl-popup-content.active');
            const isAudio = activeTab && activeTab.dataset.content === 'audio';
            const prefix = isAudio ? 'a' : 'v';
            const previewCb = popup.querySelector(`#ytdl-${prefix}-preview-cb`);
            if (previewCb && !previewCb.checked) {
              previewCb.checked = true;
            }
          }
        } else {
          window.YTDL.preview.stopPreview();
        }
      });

      rightControls.insertBefore(scissorsBtn, rightControls.firstChild);
      this.injectCameraBtn(rightControls, scissorsBtn);
    } else if (!document.getElementById("ytdl-camera-btn")) {
      this.injectCameraBtn(rightControls, scissorsBtn);
    }

    if (window.YTDL.state.formatsData) {
      this.showScissorsButton(animate);
    }
  },

  // ─── Show Scissors Button ───────────────────────────────────
  showScissorsButton(animate = false) {
    const isShorts = window.location.pathname.startsWith("/shorts/");
    if (isShorts) return;

    const scissorsBtn = document.getElementById("ytdl-scissors-btn");
    const cameraBtn = document.getElementById("ytdl-camera-btn");
    if (scissorsBtn) {
      scissorsBtn.style.display = "inline-flex";
      if (animate) {
        scissorsBtn.classList.remove("ytdl-scissors-show");
        void scissorsBtn.offsetWidth;
        scissorsBtn.classList.add("ytdl-scissors-show");
      }
    }
    if (cameraBtn) cameraBtn.style.display = "inline-flex";
  },

  // ─── Hide Scissors Button ───────────────────────────────────
  hideScissorsButton(force = false) {
    if (!force && window.YTDL.state.scissorsUnlockedForVideo) return;
    const scissorsBtn = document.getElementById("ytdl-scissors-btn");
    const cameraBtn = document.getElementById("ytdl-camera-btn");
    if (scissorsBtn) {
      scissorsBtn.style.display = "none";
      scissorsBtn.classList.remove("ytdl-scissors-show");
    }
    if (cameraBtn) cameraBtn.style.display = "none";
  },

  // ─── Reset Scissors Tool ────────────────────────────────────
  resetScissorsTool() {
    if (window.YTDL.state.scissorsState === 0 && window.YTDL.state.scissorsTrimA === null && window.YTDL.state.scissorsTrimB === null) return;
    window.YTDL.state.scissorsState = 0;
    window.YTDL.state.scissorsTrimA = null;
    window.YTDL.state.scissorsTrimB = null;
    window.YTDL.state.scissorsTimeSecA = null;
    window.YTDL.state.scissorsTimeSecB = null;
    window.YTDL.state.activeScissorsColor = "#ff1744";
    const panel = document.getElementById("ytdl-popup-panel");
    if (panel) panel.style.setProperty("--ytdl-active-color", "#ff1744");
    
    const label = document.getElementById("ytdl-scissors-label");
    if (label) label.textContent = "";
    const scissorsBtn = document.getElementById("ytdl-scissors-btn");
    if (scissorsBtn) {
      const svg = scissorsBtn.querySelector("svg");
      if (svg) svg.setAttribute("fill", "#bbb");
    }
    window.YTDL.preview.stopPreview();
  },

  // ─── Apply Scissors to Panel ────────────────────────────────
  isApplyingScissors: false,
  applyScissorsToPanel(resetToDefault = false) {
    const popup = document.getElementById("ytdl-popup-panel");
    if (!popup) return;
    this.isApplyingScissors = true;
    try {
      ["v", "a"].forEach(prefix => {
        const startInput = popup.querySelector(`#ytdl-${prefix}-start`);
        const endInput = popup.querySelector(`#ytdl-${prefix}-end`);
        if (!startInput || !endInput) return;

        if (window.YTDL.state.scissorsTrimA !== null && window.YTDL.state.scissorsTrimB !== null) {
          startInput.value = window.YTDL.state.scissorsTrimA;
          endInput.value = window.YTDL.state.scissorsTrimB;
          startInput.dispatchEvent(new Event("input"));
          endInput.dispatchEvent(new Event("input"));
        } else if (window.YTDL.state.scissorsTrimA !== null) {
          startInput.value = window.YTDL.state.scissorsTrimA;
          startInput.dispatchEvent(new Event("input"));
        } else if (resetToDefault) {
          startInput.value = 0;
          endInput.value = 1000;
          startInput.dispatchEvent(new Event("input"));
          endInput.dispatchEvent(new Event("input"));
        }

        if (window.YTDL.state.scissorsState > 0) {
          const previewCb = popup.querySelector(`#ytdl-${prefix}-preview-cb`);
          if (previewCb && !previewCb.checked) {
            previewCb.checked = true;
            previewCb.dispatchEvent(new Event("change"));
          }
        }
      });
    } finally {
      this.isApplyingScissors = false;
    }
  }
};
