/*
 * Panel Events Module - Panel Logic & Event Wiring
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.panelEvents = {
  // ─── Setup Panel Events ─────────────────────────────────────
  setupPanelEvents(panel) {
    // Close
    panel.querySelector("#ytdl-close-btn").addEventListener("click", () => {
      window.YTDL.preview.stopPreview();
      if (window.YTDL.state.trimUpdateHandlers) {
        window.YTDL.state.trimUpdateHandlers.forEach(h => h.destroy());
        window.YTDL.state.trimUpdateHandlers = [];
      }
      panel.classList.remove("ytdl-popup-show");
      setTimeout(() => panel.remove(), 200);
      window.YTDL.state.panelOpen = false;
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
          window.YTDL.history.loadHistoryData(panel);
        }
      });
    });

    panel.querySelector("#ytdl-hist-refresh")?.addEventListener("click", () => {
      window.YTDL.history.loadHistoryData(panel);
    });

    panel.querySelector("#ytdl-hist-clear")?.addEventListener("click", () => {
      window.YTDL.serverPost("/clear_history", {}).then(() => {
        if (window.YTDL.storage?.local) {
          window.YTDL.storage.local.set({ ytdl_history: [] }, () => {
            window.YTDL.history.loadHistoryData(panel);
          });
        } else {
          window.YTDL.history.loadHistoryData(panel);
        }
      });
    });

    // Chips
    panel.querySelectorAll(".ytdl-chips").forEach(group => {
      group.querySelectorAll(".ytdl-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          group.querySelectorAll(".ytdl-chip").forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
          if (group.id === "ytdl-v-fmt") window.YTDL.videoData.renderQualities();
        });
      });
    });

    // Sliders & Multi-Trims (+)
    window.YTDL.sliders.setupSliders(panel);

    panel.querySelector("#ytdl-v-add-trim")?.addEventListener("click", (e) => { e.preventDefault(); window.YTDL.sliders.addCurrentTrimSlice("v"); });
    panel.querySelector("#ytdl-a-add-trim")?.addEventListener("click", (e) => { e.preventDefault(); window.YTDL.sliders.addCurrentTrimSlice("a"); });

    // Chapters selection (+)
    ["v", "a"].forEach(prefix => {
      const chSel = panel.querySelector(`#ytdl-${prefix}-chapters-sel`);
      const addChBtn = panel.querySelector(`#ytdl-${prefix}-add-chapter`);
      const selCont = panel.querySelector(`#ytdl-${prefix}-selected-chapters`);
      if (addChBtn && chSel && selCont) {
        addChBtn.addEventListener("click", (e) => {
          e.preventDefault();
          if (!chSel.value) return;
          const opt = chSel.options[chSel.selectedIndex];
          if (!opt) return;
          if (!window.YTDL.state[`selectedChapters_${prefix}`]) window.YTDL.state[`selectedChapters_${prefix}`] = [];
          if (chSel.value === "all") {
            Array.from(chSel.options).forEach(o => {
              if (o.value !== "all" && !window.YTDL.state[`selectedChapters_${prefix}`].some(x => x.range === o.value)) {
                window.YTDL.state[`selectedChapters_${prefix}`].push({ range: o.value, text: o.textContent });
              }
            });
          } else {
            if (window.YTDL.state[`selectedChapters_${prefix}`].some(x => x.range === chSel.value)) return;
            window.YTDL.state[`selectedChapters_${prefix}`].push({ range: chSel.value, text: opt.textContent });
          }
          const renderCh = () => {
            selCont.innerHTML = "";
            window.YTDL.state[`selectedChapters_${prefix}`].forEach((item, idx) => {
              const row = document.createElement("div");
              row.className = "ytdl-multi-trim-row";
              row.style.borderLeftColor = "#00e676";
              row.innerHTML = `<span><b>Cap:</b> ${item.text}</span><button class="ytdl-multi-trim-del">✖</button>`;
              row.querySelector("button").addEventListener("click", () => {
                window.YTDL.state[`selectedChapters_${prefix}`].splice(idx, 1);
                renderCh();
              });
              selCont.appendChild(row);
            });
          };
          renderCh();
        });
      }
    });

    // Include/Exclude Audio toggle in Video tab
    panel.querySelector("#ytdl-v-include-audio")?.addEventListener("change", (e) => {
      const isAudioOn = e.target.checked;
      const icon = panel.querySelector("#ytdl-audio-icon");
      if (icon) {
        icon.src = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime.getURL(isAudioOn ? 'icons/audio.png' : 'icons/no-audio.png') : '';
      }
      window.YTDL.panelI18n.applyPanelTranslations(panel, window.YTDL.state.defaultSettings.defLang || "en");
    });

    // Preview trim checkboxes
    panel.querySelector("#ytdl-v-preview-cb")?.addEventListener("change", (e) => {
      if (e.target.checked) {
        window.YTDL.preview.startPreview("v", !window.YTDL.buttons.isApplyingScissors);
      } else {
        window.YTDL.preview.stopPreview();
      }
    });
    panel.querySelector("#ytdl-a-preview-cb")?.addEventListener("change", (e) => {
      if (e.target.checked) {
        window.YTDL.preview.startPreview("a", !window.YTDL.buttons.isApplyingScissors);
      } else {
        window.YTDL.preview.stopPreview();
      }
    });

    // Retry
    panel.querySelector("#ytdl-retry")?.addEventListener("click", () => {
      panel.querySelector("#ytdl-server-err").style.display = "none";
      panel.querySelector("#ytdl-loading").style.display = "flex";
      window.YTDL.videoData.loadVideoData();
    });

    // Download Video
    panel.querySelector("#ytdl-dl-video").addEventListener("click", () => window.YTDL.download.startDownload("video"));

    // Download Audio
    panel.querySelector("#ytdl-dl-audio").addEventListener("click", () => window.YTDL.download.startDownload("audio"));

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
      const dLufs = panel.querySelector("#ytdl-opt-lufs")?.checked || false;
      const dGif = panel.querySelector("#ytdl-opt-gif-export")?.checked || false;
      const dMeta = panel.querySelector("#ytdl-opt-audio-meta")?.checked || false;
      window.YTDL.state.defaultSettings = { outputDir: dir, defLang: dLang, videoFormat: vfmt, videoQuality: vq, audioFormat: afmt, audioQuality: aq, defThumb: dThumb, defSub: dSub, defAudio: dAudio, lufsNorm: dLufs, gifExport: dGif, audioMeta: dMeta };
      window.YTDL.storage.local.set({ settings: window.YTDL.state.defaultSettings }, () => {
        window.YTDL.panelI18n.applyOptionVisibilities(panel);
        window.YTDL.panelI18n.applyPanelTranslations(panel, window.YTDL.state.defaultSettings.defLang);
        const msg = panel.querySelector("#ytdl-cfg-msg");
        const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(window.YTDL.state.defaultSettings.defLang, k) : k;
        msg.textContent = t("savedMsg") || "Saved!";
        msg.className = "ytdl-cfg-msg ok";
        setTimeout(() => { msg.textContent = ""; msg.className = "ytdl-cfg-msg"; }, 2000);
      });
    });

    panel.querySelector("#ytdl-def-lang")?.addEventListener("change", () => {
      const selectedLang = panel.querySelector("#ytdl-def-lang").value;
      window.YTDL.state.defaultSettings.defLang = selectedLang;
      window.YTDL.panelI18n.applyPanelTranslations(panel, selectedLang);
    });

    ["#ytdl-def-thumb", "#ytdl-def-sub", "#ytdl-def-audio", "#ytdl-opt-gif-export"].forEach(sel => {
      panel.querySelector(sel)?.addEventListener("change", () => {
        window.YTDL.panelI18n.applyOptionVisibilities(panel);
      });
    });

    // Load saved config
    window.YTDL.storage.local.get("settings", (r) => {
      if (r.settings) {
        window.YTDL.state.defaultSettings = { ...window.YTDL.state.defaultSettings, ...r.settings };
        if (r.settings.outputDir) panel.querySelector("#ytdl-out-dir").value = r.settings.outputDir;
        if (r.settings.defLang && panel.querySelector("#ytdl-def-lang")) {
          panel.querySelector("#ytdl-def-lang").value = r.settings.defLang;
        } else if (panel.querySelector("#ytdl-def-lang")) {
          panel.querySelector("#ytdl-def-lang").value = window.YTDL.state.defaultSettings.defLang || "en";
        }
        if (r.settings.videoFormat) panel.querySelector("#ytdl-def-vfmt").value = r.settings.videoFormat;
        if (r.settings.videoQuality) panel.querySelector("#ytdl-def-vq").value = r.settings.videoQuality;
        if (r.settings.audioFormat) panel.querySelector("#ytdl-def-afmt").value = r.settings.audioFormat;
        if (r.settings.audioQuality) panel.querySelector("#ytdl-def-aq").value = r.settings.audioQuality;
        if (r.settings.defThumb !== undefined && panel.querySelector("#ytdl-def-thumb")) panel.querySelector("#ytdl-def-thumb").checked = !!r.settings.defThumb;
        if (r.settings.defSub !== undefined && panel.querySelector("#ytdl-def-sub")) panel.querySelector("#ytdl-def-sub").checked = !!r.settings.defSub;
        if (r.settings.defAudio !== undefined && panel.querySelector("#ytdl-def-audio")) panel.querySelector("#ytdl-def-audio").checked = !!r.settings.defAudio;
        if (r.settings.lufsNorm !== undefined && panel.querySelector("#ytdl-opt-lufs")) panel.querySelector("#ytdl-opt-lufs").checked = !!r.settings.lufsNorm;
        if (r.settings.gifExport !== undefined && panel.querySelector("#ytdl-opt-gif-export")) panel.querySelector("#ytdl-opt-gif-export").checked = !!r.settings.gifExport;
        if (r.settings.audioMeta !== undefined && panel.querySelector("#ytdl-opt-audio-meta")) panel.querySelector("#ytdl-opt-audio-meta").checked = !!r.settings.audioMeta;

        const vfmtChip = panel.querySelector(`#ytdl-v-fmt .ytdl-chip[data-v="${window.YTDL.state.defaultSettings.videoFormat}"]`);
        if (vfmtChip) {
          panel.querySelectorAll("#ytdl-v-fmt .ytdl-chip").forEach(c => c.classList.remove("active"));
          vfmtChip.classList.add("active");
        }
        const afmtChip = panel.querySelector(`#ytdl-a-fmt .ytdl-chip[data-v="${window.YTDL.state.defaultSettings.audioFormat}"]`);
        if (afmtChip) {
          panel.querySelectorAll("#ytdl-a-fmt .ytdl-chip").forEach(c => c.classList.remove("active"));
          afmtChip.classList.add("active");
        }
        const aqChip = panel.querySelector(`#ytdl-a-q .ytdl-chip[data-v="${window.YTDL.state.defaultSettings.audioQuality}"]`);
        if (aqChip) {
          panel.querySelectorAll("#ytdl-a-q .ytdl-chip").forEach(c => c.classList.remove("active"));
          aqChip.classList.add("active");
        }
      }
      window.YTDL.panelI18n.applyOptionVisibilities(panel);
      window.YTDL.panelI18n.applyPanelTranslations(panel, window.YTDL.state.defaultSettings.defLang || "en");
    });

    panel.addEventListener("mousedown", (e) => e.stopPropagation());
    panel.addEventListener("pointerdown", (e) => e.stopPropagation());

    // Click outside to close
    document.addEventListener("mousedown", function outsideClick(e) {
      if (document.getElementById("ytdl-popup-panel")?.contains(e.target)) return;
      if (document.getElementById("ytdl-action-btn")?.contains(e.target)) return;
      if (e.target.closest("#movie_player, .html5-video-player, video, ytd-player")) return;

      window.YTDL.preview.stopPreview();
      const p = document.getElementById("ytdl-popup-panel");
      if (p) {
        p.classList.remove("ytdl-popup-show");
        setTimeout(() => p.remove(), 200);
      }
      window.YTDL.state.panelOpen = false;
      document.removeEventListener("mousedown", outsideClick);
    });
  }
};
