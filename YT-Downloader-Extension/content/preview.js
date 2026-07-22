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

    const progressBar = player.querySelector(".ytp-progress-bar");
    if (!progressBar) return;

    const overlay = document.createElement("div");
    overlay.id = "ytdl-trim-overlay";
    overlay.textContent = "";
    ["ytdl-ov-dim ytdl-ov-dim-left", "ytdl-ov-played", "ytdl-ov-unplayed", "ytdl-ov-dim ytdl-ov-dim-right"].forEach(cls => {
      const div = document.createElement("div");
      div.className = cls;
      overlay.appendChild(div);
    });
    progressBar.insertBefore(overlay, progressBar.firstChild);
  },

  // ─── Update Progress Overlay ────────────────────────────────
  updateProgressOverlay(trimStartPct, trimEndPct, currentPct) {
    const overlay = document.getElementById("ytdl-trim-overlay");
    if (!overlay) return;

    const dimLeft = overlay.querySelector(".ytdl-ov-dim-left");
    const played = overlay.querySelector(".ytdl-ov-played");
    const unplayed = overlay.querySelector(".ytdl-ov-unplayed");
    const dimRight = overlay.querySelector(".ytdl-ov-dim-right");

    const clamped = Math.max(trimStartPct, Math.min(trimEndPct, currentPct));

    if (dimLeft) {
      dimLeft.style.left = "0%";
      dimLeft.style.width = (trimStartPct * 100) + "%";
    }
    if (dimRight) {
      dimRight.style.left = (trimEndPct * 100) + "%";
      dimRight.style.width = ((1 - trimEndPct) * 100) + "%";
    }

    if (played) {
      played.style.left = (trimStartPct * 100) + "%";
      played.style.width = ((clamped - trimStartPct) * 100) + "%";
    }

    if (unplayed) {
      unplayed.style.left = (clamped * 100) + "%";
      unplayed.style.width = ((trimEndPct - clamped) * 100) + "%";
    }

    // Apply active color to the player container for CSS variables
    const player = document.querySelector("#movie_player, .html5-video-player");
    if (player) {
      player.style.setProperty("--ytdl-active-color", window.YTDL.state.activeScissorsColor || "#ff1744");
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
