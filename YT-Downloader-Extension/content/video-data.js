/*
 * Video Data Module - Load Video Info & Render Qualities
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.videoData = {
  // ─── Load Video Data ────────────────────────────────────────
  async loadVideoData() {
    const currentUrl = window.location.href;
    
    // Check if we already have the data for this URL
    if (window.YTDL.state.currentVideoUrl === currentUrl && window.YTDL.state.formatsData) {
      this.renderQualities();
      return;
    }

    // Reset selection and trim state for new video URL (without stopping active downloads)
    if (window.YTDL.state.currentVideoUrl !== currentUrl) {
      window.YTDL.state.selectedPlaylistItems_v = [];
      window.YTDL.state.selectedPlaylistItems_a = [];
      window.YTDL.state.selectedChapters_v = [];
      window.YTDL.state.selectedChapters_a = [];
      window.YTDL.state.trims_video = [];
      window.YTDL.state.trims_audio = [];
      window.YTDL.state.scissorsTrims = [];
      window.YTDL.state.currentChapters = [];
      window.YTDL.state.playlistInfo = null;
      window.YTDL.state.formatsData = null;
      window.YTDL.state.videoInfo = null;

      const panel = document.getElementById("ytdl-popup-panel");
      if (panel) {
        if (window.YTDL?.panelEvents?.updatePlaylistBreakdown) {
          window.YTDL.panelEvents.updatePlaylistBreakdown(panel, "v");
          window.YTDL.panelEvents.updatePlaylistBreakdown(panel, "a");
        }
        if (window.YTDL?.panelEvents?.updateChaptersBreakdown) {
          window.YTDL.panelEvents.updateChaptersBreakdown(panel, "v");
          window.YTDL.panelEvents.updateChaptersBreakdown(panel, "a");
        }
        if (window.YTDL?.panelI18n?.updateDownloadButtons) {
          window.YTDL.panelI18n.updateDownloadButtons(panel);
        }
      }
    }
    
    window.YTDL.state.currentVideoUrl = currentUrl;
    
    const loadEl = document.getElementById("ytdl-loading");
    const container = document.getElementById("ytdl-qualities");
    if (loadEl) { 
      loadEl.style.display = "flex"; 
      loadEl.textContent = "";
      const spinner = document.createElement("div");
      spinner.className = "ytdl-spinner";
      const span = document.createElement("span");
      span.id = "i18n-loading";
      span.textContent = "Cargando calidades...";
      loadEl.append(spinner, span);
    }
    if (container) container.textContent = "";

    const info = await window.YTDL.serverPost("/info", { url: window.YTDL.state.currentVideoUrl });
    if (info.error) {
      const errEl = document.getElementById("ytdl-server-err");
      if (errEl) errEl.style.display = "flex";
      if (loadEl) loadEl.style.display = "none";
      return;
    }

    window.YTDL.state.videoInfo = info;

    const data = await window.YTDL.serverPost("/formats", { url: window.YTDL.state.currentVideoUrl });
    if (data.error) {
      if (loadEl) { loadEl.textContent = ""; const errSpan = document.createElement("span"); errSpan.style.color = "#f44336"; errSpan.textContent = data.error; loadEl.appendChild(errSpan); }
      return;
    }

    window.YTDL.state.formatsData = data;

    if (window.YTDL.state.currentVideoUrl.includes("list=")) {
      try {
        const plData = await window.YTDL.serverPost("/playlist_info", { url: window.YTDL.state.currentVideoUrl });
        if (plData && !plData.error && Array.isArray(plData.items)) {
          window.YTDL.state.playlistInfo = plData;
        }
      } catch (e) {}
    } else {
      window.YTDL.state.playlistInfo = null;
    }

    this.renderQualities();
  },

  // ─── Render Qualities ───────────────────────────────────────
  renderQualities() {
    const container = document.getElementById("ytdl-qualities");
    const loading = document.getElementById("ytdl-loading");
    const trimVideo = document.getElementById("ytdl-video-trim");
    const trimAudio = document.getElementById("ytdl-audio-trim");
    const dlBtn = document.getElementById("ytdl-dl-video");

    if (loading) loading.style.display = "none";

    const targetRes = ["4K", "1440p", "1080p", "720p", "480p", "360p", "240p", "144p"];
    const selectedFmt = document.querySelector("#ytdl-v-fmt .ytdl-chip.active")?.dataset.v || "mp4";

    const videoFormats = window.YTDL.state.formatsData?.formats?.filter(f =>
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

    if (container) container.textContent = "";
    targetRes.forEach(res => {
      const exts = fmtGroups[res];
      if (!exts) return; // Skip rendering if the resolution is not actually available

      const formats = exts[selectedFmt] || exts[Object.keys(exts)[0]];
      if (!formats || formats.length === 0) return;

      const fmt = formats[0];
      const fmtId = fmt.format_id;
      const rawSize = fmt.filesize || 0;
      const ext = fmt.ext || selectedFmt;
      let sizeText = selectedFmt.toUpperCase();
      if (fmt.filesize && fmt.filesize > 0) {
        const mb = fmt.filesize / 1048576;
        if (mb >= 1024) {
          sizeText = `~${(mb / 1024).toFixed(1)} GB`;
        } else if (mb >= 10) {
          sizeText = `~${mb.toFixed(0)} MB`;
        } else if (mb >= 1) {
          sizeText = `~${mb.toFixed(1)} MB`;
        } else {
          sizeText = `~${(fmt.filesize / 1024).toFixed(0)} KB`;
        }
      }

      const btn = document.createElement("button");
      btn.className = "ytdl-q-btn";
      btn.dataset.fmt = fmtId;
      btn.dataset.rawSize = rawSize;
      btn.dataset.ext = ext;
      const resSpan = document.createElement("span"); resSpan.className = "ytdl-q-res"; resSpan.textContent = res;
      const infoSpan = document.createElement("span"); infoSpan.className = "ytdl-q-info"; infoSpan.textContent = sizeText;
      btn.appendChild(resSpan); btn.appendChild(infoSpan);
      btn.addEventListener("click", () => {
        container.querySelectorAll(".ytdl-q-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
      container.appendChild(btn);
    });

    const defaultQ = window.YTDL.state.defaultSettings.videoQuality || '1080p';
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
    window.YTDL.buttons.injectScissorsButton();
    window.YTDL.buttons.showScissorsButton(true);
    window.YTDL.buttons.applyScissorsToPanel();
    window.YTDL.panelI18n.applyPanelTranslations(document.getElementById("ytdl-popup-panel"), window.YTDL.state.defaultSettings.defLang || "en");

    const panel = document.getElementById("ytdl-popup-panel");
    if (panel) {
      const getLang = () => window.YTDL?.state?.defaultSettings?.defLang || "en";
      const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(getLang(), k) : k;

      const optSub = panel.querySelector("#ytdl-opt-sub");
      const selSub = panel.querySelector("#ytdl-sel-sub");
      if (optSub && selSub) {
        selSub.textContent = "";
        const allSubs = [
          ...(window.YTDL.state.formatsData?.subtitles || []),
          ...(window.YTDL.state.formatsData?.automatic_captions || [])
        ];
        if (allSubs.length === 0) {
          const noSubOpt = document.createElement("option");
          noSubOpt.value = "";
          noSubOpt.textContent = t("noSubtitlesNotice");
          selSub.appendChild(noSubOpt);
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

      const audioTracks = window.YTDL.state.formatsData?.audio_tracks || [];
      ["v", "a"].forEach(prefix => {
        const optAudio = panel.querySelector(`#ytdl-opt-${prefix === "v" ? "v" : "a"}-audio`);
        const selAudio = panel.querySelector(`#ytdl-sel-${prefix === "v" ? "v" : "a"}-audio`);
        if (optAudio && selAudio) {
          selAudio.textContent = "";
          if (audioTracks.length === 0) {
            const noAudioOpt = document.createElement("option");
            noAudioOpt.value = "";
            noAudioOpt.textContent = t("stdAudioTrack");
            selAudio.appendChild(noAudioOpt);
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

      const chapters = window.YTDL.state.videoInfo?.chapters || [];
      window.YTDL.state.currentChapters = chapters;
      ["v", "a"].forEach(prefix => {
        const chBox = panel.querySelector(`#ytdl-${prefix}-chapters-box`);
        if (chBox) {
          chBox.style.display = chapters.length > 0 ? "block" : "none";
        }
        if (window.YTDL?.panelEvents?.updateChaptersBreakdown) {
          window.YTDL.panelEvents.updateChaptersBreakdown(panel, prefix);
        }
      });

      const plItems = window.YTDL.state.playlistInfo?.items || [];
      ["v", "a"].forEach(prefix => {
        const plBox = panel.querySelector(`#ytdl-${prefix}-playlist-box`);
        if (plBox) {
          plBox.style.display = plItems.length > 0 ? "block" : "none";
        }
        if (window.YTDL?.panelEvents?.updatePlaylistBreakdown) {
          window.YTDL.panelEvents.updatePlaylistBreakdown(panel, prefix);
        }
      });

      window.YTDL.panelI18n.applyOptionVisibilities(panel);
      window.YTDL.sliders.updateDisplayedSizes(panel);
    }

    window.YTDL.sliders.setupSliders(document.getElementById("ytdl-popup-panel"));
  }
};
