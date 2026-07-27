/*
 * Preview Module - Preview Trim & Progress Overlay
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.preview = {
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
    if (video && range) {
      video.currentTime = range.start;
    }
  },

  // ─── Seek to Trim End ───────────────────────────────────────
  seekToTrimEnd(prefix) {
    const video = this.getYouTubeVideo();
    const range = this.getTrimRange(prefix);
    if (video && range) {
      video.currentTime = range.end;
    }
  },

  // ─── YouTube Time Update Handler ────────────────────────────
  onYouTubeTimeUpdate() {
    if (!window.YTDL.state.previewMode) return;
    const video = this.getYouTubeVideo();
    if (!video) return;
    const range = this.getTrimRange(window.YTDL.state.previewMode);
    if (!range) return;
    const dur = window.YTDL.state.videoInfo?.duration || video.duration || 1;

    if (video.currentTime >= range.end) {
      video.currentTime = range.start;
    }

    const currentPct = video.currentTime / dur;
    this.updateProgressOverlay(range.start / dur, range.end / dur, currentPct);
  },

  // ─── Start Preview ──────────────────────────────────────────
  startPreview(prefix, seek = true) {
    this.stopPreview();
    window.YTDL.state.previewMode = prefix;

    const video = this.getYouTubeVideo();
    if (!video) return;

    const range = this.getTrimRange(prefix);
    if (!range) return;

    if (seek) {
      video.currentTime = range.start;
      if (video.paused) {
        video.play().catch(() => {});
      }
    }

    video.addEventListener("timeupdate", () => this.onYouTubeTimeUpdate());

    const player = document.querySelector("#movie_player, .html5-video-player");
    if (player) player.classList.add("ytdl-preview-active");

    this.showPreviewIndicator(true);
    this.createProgressOverlay();
    const dur = window.YTDL.state.videoInfo?.duration || video.duration || 1;
    this.updateProgressOverlay(range.start / dur, range.end / dur, video.currentTime / dur);
  },

  // ─── Stop Preview ───────────────────────────────────────────
  stopPreview() {
    window.YTDL.state.previewMode = null;
    const video = this.getYouTubeVideo();
    if (video) {
      video.removeEventListener("timeupdate", () => this.onYouTubeTimeUpdate());
    }
    const player = document.querySelector("#movie_player, .html5-video-player");
    if (player) player.classList.remove("ytdl-preview-active");

    this.showPreviewIndicator(false);
    this.removeProgressOverlay();
  },

  // ─── Create Progress Overlay ────────────────────────────────
  createProgressOverlay() {
    this.removeProgressOverlay();
    const player = document.querySelector("#movie_player, .html5-video-player");
    if (!player) return;

    const progressBar = player.querySelector(".ytp-progress-bar-container") || player.querySelector(".ytp-progress-bar");
    if (!progressBar) return;

    const overlay = document.createElement("div");
    overlay.id = "ytdl-trim-overlay";
    overlay.textContent = "";
    progressBar.appendChild(overlay);
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

    // 1. Render all slices in multi-trim queue
    if (window.YTDL.state.scissorsTrims && window.YTDL.state.scissorsTrims.length > 0) {
      window.YTDL.state.scissorsTrims.forEach((trim, idx) => {
        const isEditing = (window.YTDL.state.editingTrimIndex === idx);
        const col = trim.color || "#ff1744";
        const sPct = (trim.start / 1000);
        const ePct = (trim.end / 1000);

        const sliceDiv = document.createElement("div");
        sliceDiv.className = `ytdl-ov-slice ${isEditing ? 'active' : ''}`;
        sliceDiv.style.cssText = `
          position: absolute !important;
          top: 0 !important;
          height: 100% !important;
          left: ${(sPct * 100).toFixed(2)}% !important;
          width: ${((ePct - sPct) * 100).toFixed(2)}% !important;
          background: ${col} !important;
          opacity: ${isEditing ? '0.95' : '0.55'} !important;
          box-shadow: ${isEditing ? `0 0 10px ${col}, 0 0 18px ${col}` : `0 0 4px ${col}`} !important;
          z-index: ${isEditing ? '95' : '85'} !important;
          border-radius: 2px !important;
          pointer-events: none !important;
        `;
        overlay.appendChild(sliceDiv);
      });
    }

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

      if (player) {
        player.style.setProperty("--ytdl-active-color", activeColor);
      }
    }
  },

  // ─── Remove Progress Overlay ────────────────────────────────
  removeProgressOverlay() {
    const existing = document.getElementById("ytdl-trim-overlay");
    if (existing) existing.remove();
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
