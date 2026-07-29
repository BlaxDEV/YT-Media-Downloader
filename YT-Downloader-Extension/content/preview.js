/*
 * Preview Module - Preview Trim & Progress Overlay
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.preview = {
  _timeUpdateHandler: null,

  init() {
    if (!this._timeUpdateHandler) {
      this._timeUpdateHandler = () => this.onYouTubeTimeUpdate();
    }
  },

  // ─── Get YouTube Video Element ──────────────────────────────
  getYouTubeVideo() {
    return document.querySelector("video.html5-main-video, video.video-stream, video");
  },

  // ─── Get Trim Range ─────────────────────────────────────────
  getTrimRange(prefix) {
    const panel = document.getElementById("ytdl-popup-panel");
    const dur = window.YTDL.state.videoInfo?.duration || this.getYouTubeVideo()?.duration || 600;
    if (panel) {
      const timeA = panel.querySelector(`#ytdl-${prefix}-time-a`);
      const timeB = panel.querySelector(`#ytdl-${prefix}-time-b`);
      if (timeA && timeB) {
        let startSec = window.YTDL.parseTime(timeA.value);
        let endSec = window.YTDL.parseTime(timeB.value);
        if (window.YTDL.state.scissorsTimeSecA !== null && window.YTDL.state.scissorsTimeSecA !== undefined && Math.abs(startSec - window.YTDL.state.scissorsTimeSecA) < 1.5) {
          startSec = window.YTDL.state.scissorsTimeSecA;
        }
        if (window.YTDL.state.scissorsTimeSecB !== null && window.YTDL.state.scissorsTimeSecB !== undefined && Math.abs(endSec - window.YTDL.state.scissorsTimeSecB) < 1.5) {
          endSec = window.YTDL.state.scissorsTimeSecB;
        }
        return { start: startSec, end: endSec };
      }
      const s = parseInt(panel.querySelector(`#ytdl-${prefix}-start`)?.value || 0);
      const e = parseInt(panel.querySelector(`#ytdl-${prefix}-end`)?.value || 1000);
      return {
        start: (s / 1000) * dur,
        end: (e / 1000) * dur
      };
    }
    if (window.YTDL.state.scissorsTimeSecA !== null || window.YTDL.state.scissorsTrimA !== null) {
      const startSec = (window.YTDL.state.scissorsTimeSecA !== null && window.YTDL.state.scissorsTimeSecA !== undefined) ? window.YTDL.state.scissorsTimeSecA : ((window.YTDL.state.scissorsTrimA || 0) / 1000) * dur;
      const endSec = (window.YTDL.state.scissorsTimeSecB !== null && window.YTDL.state.scissorsTimeSecB !== undefined) ? window.YTDL.state.scissorsTimeSecB : (window.YTDL.state.scissorsTrimB !== null ? (window.YTDL.state.scissorsTrimB / 1000) * dur : dur);
      return { start: startSec, end: endSec };
    }
    return null;
  },

  // ─── Seek to Trim Start ─────────────────────────────────────
  seekToTrimStart(prefix) {
    const video = this.getYouTubeVideo();
    const range = this.getTrimRange(prefix);
    if (video && range && isFinite(range.start)) {
      video.currentTime = range.start;
    }
  },

  // ─── Seek to Trim End ───────────────────────────────────────
  seekToTrimEnd(prefix) {
    const video = this.getYouTubeVideo();
    const range = this.getTrimRange(prefix);
    if (video && range && isFinite(range.end)) {
      video.currentTime = range.end;
    }
  },

  showPlayerIndicator(type) {
    try {
      const player = document.querySelector("#movie_player, .html5-video-player");
      if (!player) return;
      let overlay = player.querySelector(".ytdl-player-indicator-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "ytdl-player-indicator-overlay";
        player.appendChild(overlay);
      }
      overlay.className = "ytdl-player-indicator-overlay";
      void overlay.offsetWidth; // trigger reflow

      if (type === "A") {
        overlay.textContent = "A";
        overlay.classList.add("ytdl-anim-pulse");
      } else if (type === "B") {
        overlay.textContent = "B";
        overlay.classList.add("ytdl-anim-pulse");
      } else if (type === "loop") {
        overlay.innerHTML = `<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`;
        overlay.classList.add("ytdl-anim-loop");
      }
    } catch (e) {}
  },

  // ─── YouTube Time Update Handler ────────────────────────────
  onYouTubeTimeUpdate() {
    if (window.YTDL.state.previewMode) {
      const video = this.getYouTubeVideo();
      if (video) {
        const range = this.getTrimRange(window.YTDL.state.previewMode);
        if (range && video.currentTime >= range.end && isFinite(range.start)) {
          this.showPlayerIndicator("loop");
          video.currentTime = range.start;
        }
      }
    }
    this.refreshOverlay();
  },

  // ─── Refresh Progress Overlay ───────────────────────────────
  refreshOverlay() {
    const video = this.getYouTubeVideo();
    if (!video) return;

    const dur = window.YTDL.state.videoInfo?.duration || video.duration || 1;
    const curPct = video.currentTime / dur;

    const hasSlices = window.YTDL.state.scissorsTrims && window.YTDL.state.scissorsTrims.length > 0;
    const isEditing = (window.YTDL.state.editingTrimIndex !== null && window.YTDL.state.editingTrimIndex !== undefined);
    const isScissorsActive = window.YTDL.state.scissorsState > 0;
    const isPreviewActive = window.YTDL.state.previewMode !== null;

    const player = document.querySelector("#movie_player, .html5-video-player");

    // Show overlay if editing, previewing, or scissors actively placing points
    const active = isPreviewActive || isEditing || isScissorsActive;

    if (!active) {
      if (player) player.classList.remove("ytdl-trim-active");
      this.removeProgressOverlay();
      return;
    }

    if (player) player.classList.add("ytdl-trim-active");

    // Determine current active trim range percentages
    let range = null;
    if (isPreviewActive) {
      range = this.getTrimRange(window.YTDL.state.previewMode);
    } else if (isEditing) {
      const editTrim = window.YTDL.state.scissorsTrims[window.YTDL.state.editingTrimIndex];
      if (editTrim) {
        range = {
          start: editTrim.timeSecA !== undefined ? editTrim.timeSecA : (editTrim.start / 1000) * dur,
          end: editTrim.timeSecB !== undefined ? editTrim.timeSecB : (editTrim.end / 1000) * dur
        };
      }
    } else if (isScissorsActive) {
      const s = window.YTDL.state.scissorsTimeSecA !== null ? window.YTDL.state.scissorsTimeSecA : 0;
      const e = window.YTDL.state.scissorsTimeSecB !== null ? window.YTDL.state.scissorsTimeSecB : dur;
      range = { start: s, end: e };
    }

    if (range) {
      this.updateProgressOverlay(range.start / dur, range.end / dur, curPct);
    } else {
      this.updateProgressOverlay(undefined, undefined, curPct);
    }
  },

  // ─── Start Preview ──────────────────────────────────────────
  startPreview(prefix, seek = true) {
    this.stopPreview();
    window.YTDL.state.previewMode = prefix;

    const video = this.getYouTubeVideo();
    if (!video) return;

    const range = this.getTrimRange(prefix);
    if (!range) return;

    if (seek && isFinite(range.start)) {
      video.currentTime = range.start;
      if (video.paused) {
        video.play().catch(() => {});
      }
    }

    this.init();
    video.addEventListener("timeupdate", this._timeUpdateHandler);

    const player = document.querySelector("#movie_player, .html5-video-player");
    if (player) {
      player.classList.add("ytdl-preview-active");
      player.classList.add("ytdl-trim-active");
    }

    this.showPreviewIndicator(true);
    this.createProgressOverlay();
    this.refreshOverlay();
  },

  // ─── Stop Preview ───────────────────────────────────────────
  stopPreview() {
    window.YTDL.state.previewMode = null;
    const video = this.getYouTubeVideo();
    this.init();
    if (video && this._timeUpdateHandler) {
      video.removeEventListener("timeupdate", this._timeUpdateHandler);
    }
    const player = document.querySelector("#movie_player, .html5-video-player");
    if (player) {
      player.classList.remove("ytdl-preview-active");
      // Let refreshOverlay decide whether to remove ytdl-trim-active
    }

    this.showPreviewIndicator(false);
    this.refreshOverlay();
  },

  // ─── Create Progress Overlay ────────────────────────────────
  createProgressOverlay() {
    const existing = document.getElementById("ytdl-trim-overlay");
    if (existing) return;

    const player = document.querySelector("#movie_player, .html5-video-player");
    if (!player) return;

    const progressBar = player.querySelector(".ytp-progress-bar");
    if (!progressBar) return;

    const overlay = document.createElement("div");
    overlay.id = "ytdl-trim-overlay";
    overlay.textContent = "";
    progressBar.appendChild(overlay);

    const video = this.getYouTubeVideo();
    if (video) {
      this.init();
      video.removeEventListener("timeupdate", this._timeUpdateHandler);
      video.addEventListener("timeupdate", this._timeUpdateHandler);
    }
  },

  // ─── Update Progress Overlay ────────────────────────────────
  updateProgressOverlay(trimStartPct, trimEndPct, currentPct) {
    let overlay = document.getElementById("ytdl-trim-overlay");
    if (!overlay) {
      this.createProgressOverlay();
      overlay = document.getElementById("ytdl-trim-overlay");
      if (!overlay) return;
    }
    overlay.textContent = "";

    const player = document.querySelector("#movie_player, .html5-video-player");
    const video = this.getYouTubeVideo();
    const dur = window.YTDL.state.videoInfo?.duration || video?.duration || 1;

    // Render only the active selection or the actively edited cut to avoid onion-skinning (individual preview style).

    // 2. Render active trim highlight & dim background if trimming is active
    if (trimStartPct !== undefined && trimEndPct !== undefined) {
      const clamped = Math.max(trimStartPct, Math.min(trimEndPct, currentPct || 0));
      const activeColor = window.YTDL.state.activeScissorsColor || "#ff1744";

      const dimLeft = document.createElement("div");
      dimLeft.className = "ytdl-ov-dim ytdl-ov-dim-left";
      dimLeft.style.cssText = `position:absolute !important;top:0 !important;height:100% !important;left:0% !important;width:${(trimStartPct * 100).toFixed(2)}% !important;background:rgba(0,0,0,0.6) !important;z-index:80 !important;pointer-events:none !important;`;

      const dimRight = document.createElement("div");
      dimRight.className = "ytdl-ov-dim ytdl-ov-dim-right";
      dimRight.style.cssText = `position:absolute !important;top:0 !important;height:100% !important;left:${(trimEndPct * 100).toFixed(2)}% !important;width:${((1 - trimEndPct) * 100).toFixed(2)}% !important;background:rgba(0,0,0,0.6) !important;z-index:80 !important;pointer-events:none !important;`;

      const played = document.createElement("div");
      played.className = "ytdl-ov-played";
      played.style.cssText = `position:absolute !important;top:0 !important;height:100% !important;left:${(trimStartPct * 100).toFixed(2)}% !important;width:${((clamped - trimStartPct) * 100).toFixed(2)}% !important;background:${activeColor} !important;box-shadow:0 0 10px ${activeColor} !important;z-index:96 !important;pointer-events:none !important;transition:width 0.1s linear !important;`;

      const unplayed = document.createElement("div");
      unplayed.className = "ytdl-ov-unplayed";
      unplayed.style.cssText = `position:absolute !important;top:0 !important;height:100% !important;left:${(clamped * 100).toFixed(2)}% !important;width:${((trimEndPct - clamped) * 100).toFixed(2)}% !important;background:${activeColor} !important;opacity:0.45 !important;z-index:91 !important;pointer-events:none !important;`;

      overlay.appendChild(dimLeft);
      overlay.appendChild(dimRight);
      overlay.appendChild(played);
      overlay.appendChild(unplayed);

      // Render scissor markers "A" and "B" exactly at cut points
      if (trimStartPct !== undefined) {
        const markerA = document.createElement("div");
        markerA.className = "ytdl-trim-marker ytdl-trim-marker-a";
        markerA.style.cssText = `
          position: absolute !important;
          top: -4px !important;
          height: 16px !important;
          width: 2px !important;
          left: ${(trimStartPct * 100).toFixed(2)}% !important;
          background: ${activeColor} !important;
          z-index: 100001 !important;
          box-shadow: 0 0 4px ${activeColor} !important;
          pointer-events: none !important;
        `;
        const dotA = document.createElement("div");
        dotA.style.cssText = `
          position: absolute !important;
          top: -6px !important;
          left: -4px !important;
          width: 10px !important;
          height: 10px !important;
          border-radius: 50% !important;
          background: ${activeColor} !important;
          border: 1px solid #fff !important;
          box-shadow: 0 0 4px rgba(0,0,0,0.5) !important;
          font-size: 7px !important;
          font-weight: bold !important;
          color: #fff !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        `;
        dotA.textContent = "A";
        markerA.appendChild(dotA);
        overlay.appendChild(markerA);
      }

      if (trimEndPct !== undefined) {
        const markerB = document.createElement("div");
        markerB.className = "ytdl-trim-marker ytdl-trim-marker-b";
        markerB.style.cssText = `
          position: absolute !important;
          top: -4px !important;
          height: 16px !important;
          width: 2px !important;
          left: ${(trimEndPct * 100).toFixed(2)}% !important;
          background: ${activeColor} !important;
          z-index: 100001 !important;
          box-shadow: 0 0 4px ${activeColor} !important;
          pointer-events: none !important;
        `;
        const dotB = document.createElement("div");
        dotB.style.cssText = `
          position: absolute !important;
          top: -6px !important;
          left: -4px !important;
          width: 10px !important;
          height: 10px !important;
          border-radius: 50% !important;
          background: ${activeColor} !important;
          border: 1px solid #fff !important;
          box-shadow: 0 0 4px rgba(0,0,0,0.5) !important;
          font-size: 7px !important;
          font-weight: bold !important;
          color: #fff !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        `;
        dotB.textContent = "B";
        markerB.appendChild(dotB);
        overlay.appendChild(markerB);
      }

      if (player) {
        player.style.setProperty("--ytdl-active-color", activeColor);
      }
    }
  },

  // ─── Remove Progress Overlay ────────────────────────────────
  removeProgressOverlay() {
    const existing = document.getElementById("ytdl-trim-overlay");
    if (existing) existing.remove();

    const video = this.getYouTubeVideo();
    if (video && this._timeUpdateHandler) {
      video.removeEventListener("timeupdate", this._timeUpdateHandler);
    }
  },

  // ─── Show Preview Indicator ─────────────────────────────────
  showPreviewIndicator(on) {
    const existing = document.getElementById("ytdl-preview-badge");
    if (existing) existing.remove();
    if (!on) return;

    const badge = document.createElement("div");
    badge.id = "ytdl-preview-badge";
    badge.textContent = "Previsualizando recorte";
    document.body.appendChild(badge);
  }
};
