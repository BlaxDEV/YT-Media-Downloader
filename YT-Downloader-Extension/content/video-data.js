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

    const info = await window.YTDL.serverRequest(`/info?url=${encodeURIComponent(window.YTDL.state.currentVideoUrl)}`);
    if (info.error) {
      const errEl = document.getElementById("ytdl-server-err");
      if (errEl) errEl.style.display = "flex";
      if (loadEl) loadEl.style.display = "none";
      return;
    }

    window.YTDL.state.videoInfo = info;

    const data = await window.YTDL.serverRequest(`/formats?url=${encodeURIComponent(window.YTDL.state.currentVideoUrl)}`);
    if (data.error) {
      if (loadEl) { loadEl.textContent = ""; const errSpan = document.createElement("span"); errSpan.style.color = "#f44336"; errSpan.textContent = data.error; loadEl.appendChild(errSpan); }
      return;
    }

    window.YTDL.state.formatsData = data;
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

    const targetRes = ["1080p", "720p", "480p", "360p", "240p", "144p"];
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
          noSubOpt.textContent = "No hay subtítulos";
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
            noAudioOpt.textContent = "Pista estándar únicamente";
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
      ["v", "a"].forEach(prefix => {
        const chBox = panel.querySelector(`#ytdl-${prefix}-chapters-box`);
        const chSel = panel.querySelector(`#ytdl-${prefix}-chapters-sel`);
        const chCb = panel.querySelector(`#ytdl-${prefix}-chapters-cb`);
        const chRow = panel.querySelector(`#ytdl-${prefix}-chapters-row`);
        if (chBox && chSel) {
          if (chapters.length > 0) {
            chBox.style.display = "block";
            chSel.textContent = "";
            chapters.forEach((c, i) => {
              const opt = document.createElement("option");
              opt.value = `${window.YTDL.formatTime(c.start_time)}-${window.YTDL.formatTime(c.end_time)}`;
              opt.textContent = `${i+1}. ${c.title} (${window.YTDL.formatTime(c.start_time)} - ${window.YTDL.formatTime(c.end_time)})`;
              chSel.appendChild(opt);
            });
            const allOpt = document.createElement("option");
            allOpt.value = "all";
            allOpt.textContent = "📚 Descargar todos los capítulos";
            chSel.appendChild(allOpt);
            if (chCb) chCb.onchange = () => { if (chRow) chRow.style.display = chCb.checked ? "flex" : "none"; };
          } else {
            chBox.style.display = "none";
          }
        }
      });

      window.YTDL.panelI18n.applyOptionVisibilities(panel);
      window.YTDL.sliders.updateDisplayedSizes(panel);
    }

    window.YTDL.sliders.setupSliders(document.getElementById("ytdl-popup-panel"));
  }
};
