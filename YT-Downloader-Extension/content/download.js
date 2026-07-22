/*
 * Download Module - Download Execution & Progress Polling
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.download = {
  // ─── Start Download ─────────────────────────────────────────
  async startDownload(type) {
    if (window.YTDL.state.isDownloading) return;
    window.YTDL.state.isDownloading = true;

    const panel = document.getElementById("ytdl-popup-panel");
    const btn = panel.querySelector(`#ytdl-dl-${type}`);
    const progress = panel.querySelector(`#ytdl-${type === "video" ? "v" : "a"}-progress`);
    const bar = panel.querySelector(`#ytdl-${type === "video" ? "v" : "a"}-bar`);
    const pct = panel.querySelector(`#ytdl-${type === "video" ? "v" : "a"}-pct`);

    const openBtn = panel.querySelector(`#ytdl-${prefix}-open-folder-btn`);
    if (openBtn) openBtn.style.display = "none";
    btn.disabled = true;
    if (progress) progress.style.display = "flex";
    if (bar) bar.style.width = "0%";
    if (pct) pct.textContent = "Iniciando...";

    const pageTitle = document.title.replace(/^\(\d+\)\s*/, "").replace(/ - YouTube$/, "") || "Video";
    let body = { 
      url: window.YTDL.state.currentVideoUrl, 
      type, 
      title: window.YTDL.state.formatsData?.title || window.YTDL.state.videoInfo?.title || pageTitle 
    };
    if (type === "video") {
      const fmtBtn = panel.querySelector("#ytdl-qualities .ytdl-q-btn.active");
      if (!fmtBtn) { window.YTDL.state.isDownloading = false; btn.disabled = false; return; }

      const fmtId = fmtBtn.dataset.fmt;
      const videoFormats = window.YTDL.state.formatsData?.formats?.filter(f => f.type === "video" && f.resolution && f.resolution !== "unknown") || [];
      const audioFormats = window.YTDL.state.formatsData?.formats?.filter(f => f.type === "audio") || [];
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

      const dur = window.YTDL.state.videoInfo?.duration || window.YTDL.preview?.getYouTubeVideo()?.duration || 600;
      const timeAEl = panel.querySelector("#ytdl-v-time-a");
      const timeBEl = panel.querySelector("#ytdl-v-time-b");
      const s = parseInt(panel.querySelector("#ytdl-v-start")?.value || 0);
      const e = parseInt(panel.querySelector("#ytdl-v-end")?.value || 1000);
      if (s > 0 || e < 1000 || (timeAEl && timeAEl.value !== "0:00")) {
        const startStr = timeAEl ? timeAEl.value.trim() : window.YTDL.formatTime((s / 1000) * dur);
        const endStr = timeBEl ? timeBEl.value.trim() : window.YTDL.formatTime((e / 1000) * dur);
        body.trim_start = startStr;
        body.trim_end = endStr;
        body.trim_a = startStr;
        body.trim_b = endStr;
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

      const dur = window.YTDL.state.videoInfo?.duration || window.YTDL.preview?.getYouTubeVideo()?.duration || 600;
      const timeAEl = panel.querySelector("#ytdl-a-time-a");
      const timeBEl = panel.querySelector("#ytdl-a-time-b");
      const s = parseInt(panel.querySelector("#ytdl-a-start")?.value || 0);
      const e = parseInt(panel.querySelector("#ytdl-a-end")?.value || 1000);
      if (s > 0 || e < 1000 || (timeAEl && timeAEl.value !== "0:00")) {
        const startStr = timeAEl ? timeAEl.value.trim() : window.YTDL.formatTime((s / 1000) * dur);
        const endStr = timeBEl ? timeBEl.value.trim() : window.YTDL.formatTime((e / 1000) * dur);
        body.trim_start = startStr;
        body.trim_end = endStr;
        body.trim_a = startStr;
        body.trim_b = endStr;
      }

      if (panel.querySelector("#ytdl-opt-a-audio")?.checked) {
        const aTrack = panel.querySelector("#ytdl-sel-a-audio")?.value;
        if (aTrack) body.audio_track = aTrack;
      }
    }

    // Attach Pro options (LUFS, Audio Metadata, Chapters, GIF/WebP, Multi-Trims)
    if (panel.querySelector("#ytdl-opt-lufs")?.checked || window.YTDL.state.defaultSettings.lufsNorm) {
      body.lufs_norm = true;
    }
    if (panel.querySelector("#ytdl-opt-audio-meta")?.checked || window.YTDL.state.defaultSettings.audioMeta) {
      body.audio_meta = true;
    }
    const activeChipExt = panel.querySelector("#ytdl-v-fmt .ytdl-chip.active")?.dataset.v;
    if (type === "video" && (activeChipExt === "gif" || activeChipExt === "webp")) {
      body.ext = activeChipExt;
    }
    const prefix2 = type === "video" ? "v" : "a";
    if (panel.querySelector(`#ytdl-${prefix2}-chapters-cb`)?.checked) {
      body.split_chapters = true;
      if (window.YTDL.state[`selectedChapters_${prefix2}`] && window.YTDL.state[`selectedChapters_${prefix2}`].length > 0) {
        body.chapters = window.YTDL.state[`selectedChapters_${prefix2}`].map(x => x.range);
      }
    }
    if (window.YTDL.state.scissorsTrims && window.YTDL.state.scissorsTrims.length > 0) {
      const dur = window.YTDL.state.videoInfo?.duration || window.YTDL.preview?.getYouTubeVideo()?.duration || 600;
      body.trim_ranges = window.YTDL.state.scissorsTrims.map(t => {
        const startStr = t.startStr || window.YTDL.formatTime((t.start / 1000) * dur);
        const endStr = t.endStr || window.YTDL.formatTime((t.end / 1000) * dur);
        return `${startStr}-${endStr}`;
      });
      // scissorsTrims is the source of truth — clear individual trim fields to avoid duplicates
      delete body.trim_a;
      delete body.trim_b;
      delete body.trim_start;
      delete body.trim_end;
    }

    const res = await window.YTDL.serverPost("/download", body);

    if (res?.id) {
      this.pollProgress(type, res.id);
    } else {
      if (pct) pct.textContent = `Error: ${res?.error || "desconocido"}`;
      window.YTDL.state.isDownloading = false;
      btn.disabled = false;
    }
  },

  // ─── Poll Progress ──────────────────────────────────────────
  async pollProgress(type, id) {
    const prefix = type === "video" ? "v" : "a";
    let errorCount = 0;

    const check = async () => {
      const panel = document.getElementById("ytdl-popup-panel");
      const bar = panel?.querySelector(`#ytdl-${prefix}-bar`);
      const pct = panel?.querySelector(`#ytdl-${prefix}-pct`);
      const btn = panel?.querySelector(`#ytdl-dl-${type}`);
      const progress = panel?.querySelector(`#ytdl-${prefix}-progress`);

      const data = await window.YTDL.serverRequest(`/progress?id=${id}`);

      const getLang = () => window.YTDL?.state?.defaultSettings?.defLang || "en";
      const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(getLang(), k) : k;

      if (!data || data.error) {
        errorCount++;
        if (errorCount > 5) {
          if (pct) pct.textContent = t("histError") || "Error";
          window.YTDL.state.isDownloading = false;
          if (btn) btn.disabled = false;
          return;
        }
        setTimeout(check, 1500);
        return;
      }

      errorCount = 0;

      if (data.progress !== undefined) {
        const p = Math.min(100, Math.round(data.progress));
        if (bar) bar.style.width = p + "%";
        if (pct) pct.textContent = p + "%";
        
        if (window.YTDL.state.scissorsTrims && window.YTDL.state.scissorsTrims.length > 1) {
          const totalTrims = window.YTDL.state.scissorsTrims.length;
          const chunk = 100 / totalTrims;
          for (let i = 0; i < totalTrims; i++) {
            const span = panel?.querySelector(`#ytdl-trim-progress-${i}`);
            if (span) {
              const startPct = i * chunk;
              const endPct = (i + 1) * chunk;
              let trimPct = 0;
              if (data.progress >= endPct) trimPct = 100;
              else if (data.progress <= startPct) trimPct = 0;
              else trimPct = ((data.progress - startPct) / chunk) * 100;
              
              span.textContent = ` (${Math.round(trimPct)}%)`;
              if (trimPct === 100) span.style.color = "#4caf50";
              else if (trimPct > 0) span.style.color = "#ffeb3b";
              else span.style.color = "#aaa";
            }
          }
        }
      }

      if (data.status === "processing") {
        if (pct) pct.textContent = t("histProcessing") || "Processing...";
      }

      if (data.status === "complete") {
        if (bar) bar.style.width = "100%";
        if (pct) pct.textContent = t("histComplete") || "Complete";
        window.YTDL.state.isDownloading = false;
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
          textSpan.textContent = " " + (t("histComplete") || "Complete");

          btn.replaceChildren(checkSvg, textSpan);
          setTimeout(() => {
            btn.classList.remove("ytdl-btn-success");
            btn.replaceChildren(...origNodes);
          }, 4000);
        }

        const openBtn = panel?.querySelector(`#ytdl-${prefix}-open-folder-btn`);
        if (openBtn) {
          openBtn.style.display = "inline-flex";
          openBtn.textContent = "📁 " + (t("histOpenFolder") || "Open Folder");
          openBtn.onclick = () => {
            window.YTDL.serverPost("/open_folder", { id: id, path: data.output_dir });
          };
        }

        window.YTDL.history.loadHistoryData(panel);

        setTimeout(() => {
          if (progress) progress.style.display = "none";
        }, 6000);
        return;
      }

      if (data.status === "error") {
        if (pct) pct.textContent = "Error";
        window.YTDL.state.isDownloading = false;
        if (btn) btn.disabled = false;
        return;
      }

      setTimeout(check, 800);
    };

    check();
  }
};
