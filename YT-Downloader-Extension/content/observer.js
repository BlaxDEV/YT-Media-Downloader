/*
 * Observer Module - SPA Navigation Observer & Initialization
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.observer = {
  lastUrl: "",

  // ─── Initialize Observer ────────────────────────────────────
  init() {
    console.log("[YTDL] Content script loaded");

    this.lastUrl = window.location.href;
    if (window.YTDL.isVideoPage()) {
      setTimeout(() => window.YTDL.buttons.injectDownloadButton(), 1500);
      setTimeout(() => window.YTDL.buttons.injectDownloadButton(), 3500);
    }

    const observer = new MutationObserver(() => {
      if (window.location.href !== this.lastUrl) {
        this.lastUrl = window.location.href;
        window.YTDL.preview.stopPreview();
        if (window.YTDL.state.trimUpdateHandlers) {
          window.YTDL.state.trimUpdateHandlers.forEach(h => h.destroy());
          window.YTDL.state.trimUpdateHandlers = [];
        }
        const existing = document.getElementById("ytdl-action-btn");
        if (existing) existing.remove();
        const panel = document.getElementById("ytdl-popup-panel");
        if (panel) panel.remove();

        if (window.YTDL.isVideoPage()) {
          window.YTDL.state.formatsData = null;
          window.YTDL.state.videoInfo = null;
          window.YTDL.state.isDownloading = false;
          window.YTDL.state.panelOpen = false;
          window.YTDL.state.scissorsUnlockedForVideo = false;
          window.YTDL.state.scissorsState = 0;
          window.YTDL.state.scissorsTrimA = null;
          window.YTDL.state.scissorsTrimB = null;
          window.YTDL.state.scissorsTimeSecA = null;
          window.YTDL.state.scissorsTimeSecB = null;
          window.YTDL.buttons.hideScissorsButton(true);
          setTimeout(() => window.YTDL.buttons.injectDownloadButton(), 1500);
          setTimeout(() => window.YTDL.buttons.injectDownloadButton(), 3500);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
};

// Auto-initialize when script loads
window.YTDL.observer.init();
