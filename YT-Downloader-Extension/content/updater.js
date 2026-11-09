/*
 * Updater Module - Update Notifications & Safe Automated Downloads
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.updater = {
  latestUpdate: null,
  _pollTimer: null,
  _hasCheckedAuto: false,

  // ─── Initialize Event Listeners ─────────────────────────────
  init(panel) {
    if (!panel) return;

    const closeBtn = panel.querySelector("#ytdl-update-close");
    const laterBtn = panel.querySelector("#ytdl-update-btn-later");
    const installBtn = panel.querySelector("#ytdl-update-btn-install");
    const checkBtn = panel.querySelector("#ytdl-btn-check-updates");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.postpone(panel));
    }
    if (laterBtn) {
      laterBtn.addEventListener("click", () => this.postpone(panel));
    }
    if (installBtn) {
      installBtn.addEventListener("click", () => this.startInstall(panel));
    }
    if (checkBtn) {
      checkBtn.addEventListener("click", () => this.checkManual(panel));
    }

    // Run auto-check once per session if not checked yet
    if (!this._hasCheckedAuto) {
      this._hasCheckedAuto = true;
      setTimeout(() => this.checkAuto(panel), 1500);
    }
  },

  // ─── Query Update API (Companion Host + Fallback to GitHub) ─
  async checkUpdateApi(force = false) {
    const manifestVer = (typeof chrome !== "undefined" && chrome?.runtime?.getManifest?.()?.version) || "1.3.1";
    let res = null;

    // 1. Try local companion server first
    try {
      res = await window.YTDL.serverRequest("/check_update" + (force ? "?force=true" : ""));
    } catch (e) {
      res = null;
    }

    if (res && res.status === "ok") {
      return res;
    }

    // 2. Fallback: Direct GitHub API query if companion host is not reachable
    try {
      const ghRes = await fetch("https://api.github.com/repos/BlaxDEV/YT-Media-Downloader/releases/latest", {
        headers: { "Accept": "application/vnd.github.v3+json" }
      });
      if (!ghRes.ok) throw new Error("GitHub HTTP " + ghRes.status);
      const data = await ghRes.json();
      const tag = (data.tag_name || "").replace(/^[vV]/, "").trim();

      const parseV = (v) => v.split(".").map(n => parseInt(n, 10) || 0);
      const curParts = parseV(manifestVer);
      const latParts = parseV(tag);
      let isNewer = false;
      for (let i = 0; i < Math.max(curParts.length, latParts.length); i++) {
        const c = curParts[i] || 0;
        const l = latParts[i] || 0;
        if (l > c) { isNewer = true; break; }
        if (l < c) { break; }
      }

      const isWin = navigator.platform?.toLowerCase().includes("win");
      const assets = data.assets || [];
      let targetAsset = assets.find(a => isWin ? a.name?.endsWith(".exe") && (a.name.includes("Win") || a.name.includes("Setup")) : a.name?.endsWith(".tar.gz"));
      if (!targetAsset && assets.length > 0) targetAsset = assets[0];

      return {
        status: "ok",
        update_available: isNewer,
        current_version: manifestVer,
        latest_version: tag,
        title: data.name || `v${tag}`,
        notes: (data.body || "").trim(),
        html_url: data.html_url || "https://github.com/BlaxDEV/YT-Media-Downloader/releases/latest",
        asset_name: targetAsset?.name || "",
        download_url: targetAsset?.browser_download_url || "",
        asset_size: targetAsset?.size || 0
      };
    } catch (err) {
      return {
        status: "error",
        update_available: false,
        current_version: manifestVer,
        error: err.message
      };
    }
  },

  // ─── Automatic Check on Startup (Respects 24h Postpone) ─────
  async checkAuto(panel) {
    const storageAPI = typeof browser !== "undefined" ? browser?.storage?.local : chrome?.storage?.local;
    if (storageAPI) {
      try {
        const stored = await new Promise(r => storageAPI.get(["ytdl_postponed_time", "ytdl_postponed_ver"], r));
        const lastTime = stored?.ytdl_postponed_time || 0;
        const now = Date.now();
        // If postponed less than 24 hours ago, do not disturb
        if (now - lastTime < 24 * 60 * 60 * 1000) {
          return;
        }
      } catch (e) {}
    }

    const res = await this.checkUpdateApi(false);
    if (res && res.update_available) {
      this.latestUpdate = res;
      this.showModal(panel, res);
    }
  },

  // ─── Manual Check from Settings Tab ─────────────────────────
  async checkManual(panel) {
    const getLang = () => window.YTDL?.state?.defaultSettings?.defLang || "en";
    const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(getLang(), k) : k;

    const checkBtn = panel.querySelector("#ytdl-btn-check-updates");
    const checkTxt = panel.querySelector("#ytdl-txt-check-updates");
    const statusEl = panel.querySelector("#ytdl-update-cfg-status");

    if (checkBtn) checkBtn.disabled = true;
    if (checkTxt) checkTxt.textContent = t("updateChecking") || "Comprobando...";
    if (statusEl) statusEl.style.display = "none";

    const res = await this.checkUpdateApi(true);

    if (checkBtn) checkBtn.disabled = false;
    if (checkTxt) checkTxt.textContent = t("updateCheckBtn") || "Buscar actualizaciones";

    if (res && res.update_available) {
      this.latestUpdate = res;
      this.showModal(panel, res);
      if (statusEl) {
        statusEl.textContent = `🚀 v${res.latest_version}`;
        statusEl.style.color = "#4cd162";
        statusEl.style.display = "block";
      }
    } else if (res && res.status === "ok") {
      if (statusEl) {
        statusEl.textContent = `✓ ${t("updateUpToDate") || "Estás en la última versión"} (v${res.current_version})`;
        statusEl.style.color = "#4cd162";
        statusEl.style.display = "block";
        setTimeout(() => { if (statusEl) statusEl.style.display = "none"; }, 4000);
      }
    } else {
      if (statusEl) {
        statusEl.textContent = t("updateError") || "No se pudo verificar la actualización";
        statusEl.style.color = "#ff4e45";
        statusEl.style.display = "block";
        setTimeout(() => { if (statusEl) statusEl.style.display = "none"; }, 4000);
      }
    }
  },

  // ─── Show Update Modal ──────────────────────────────────────
  showModal(panel, info) {
    const modal = panel.querySelector("#ytdl-update-modal");
    if (!modal) return;

    const getLang = () => window.YTDL?.state?.defaultSettings?.defLang || "en";
    const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(getLang(), k) : k;

    const titleEl = panel.querySelector("#ytdl-update-title");
    const verText = panel.querySelector("#ytdl-update-version-text");
    const verStrong = panel.querySelector("#ytdl-update-new-ver");
    const notesEl = panel.querySelector("#ytdl-update-notes-container");
    const progWrap = panel.querySelector("#ytdl-update-progress-wrap");
    const installBtn = panel.querySelector("#ytdl-update-btn-install");
    const installTxt = panel.querySelector("#ytdl-update-install-txt");
    const laterBtn = panel.querySelector("#ytdl-update-btn-later");

    if (titleEl) titleEl.textContent = t("updateTitle") || "¡Nueva actualización disponible!";
    if (verStrong) verStrong.textContent = `v${info.latest_version}`;
    if (verText) {
      const msgTpl = t("updateAvailableMsg") || "Está disponible la versión v{v} para su descarga.";
      verText.innerHTML = msgTpl.replace("{v}", `<strong id="ytdl-update-new-ver" style="color: #4cd162;">v${info.latest_version}</strong>`);
    }

    if (notesEl) {
      if (info.notes && info.notes.length > 5) {
        // Strip excessive markdown badges/links for clean reading
        const cleanNotes = info.notes.replace(/!\[.*?\]\(.*?\)/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1").trim();
        notesEl.textContent = cleanNotes;
        notesEl.style.display = "block";
      } else {
        notesEl.style.display = "none";
      }
    }

    if (progWrap) progWrap.style.display = "none";
    if (installBtn) {
      installBtn.disabled = false;
      if (installTxt) installTxt.textContent = t("updateInstallBtn") || "Instalar";
    }
    if (laterBtn) {
      laterBtn.disabled = false;
      laterBtn.textContent = t("updateLaterBtn") || "Recordarme más tarde";
    }

    modal.style.display = "flex";
  },

  // ─── Postpone Update (24 Hours) ─────────────────────────────
  postpone(panel) {
    const modal = panel.querySelector("#ytdl-update-modal");
    if (modal) modal.style.display = "none";

    const storageAPI = typeof browser !== "undefined" ? browser?.storage?.local : chrome?.storage?.local;
    if (storageAPI) {
      try {
        storageAPI.set({
          ytdl_postponed_time: Date.now(),
          ytdl_postponed_ver: this.latestUpdate?.latest_version || ""
        });
      } catch (e) {}
    }
  },

  // ─── Start Download and Launch Installer via UAC ────────────
  async startInstall(panel) {
    const getLang = () => window.YTDL?.state?.defaultSettings?.defLang || "en";
    const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(getLang(), k) : k;

    const modal = panel.querySelector("#ytdl-update-modal");
    const progWrap = panel.querySelector("#ytdl-update-progress-wrap");
    const progFill = panel.querySelector("#ytdl-update-progress-fill");
    const progLabel = panel.querySelector("#ytdl-update-progress-label");
    const progPct = panel.querySelector("#ytdl-update-progress-pct");
    const installBtn = panel.querySelector("#ytdl-update-btn-install");
    const installTxt = panel.querySelector("#ytdl-update-install-txt");
    const laterBtn = panel.querySelector("#ytdl-update-btn-later");

    if (installBtn) installBtn.disabled = true;
    if (laterBtn) laterBtn.disabled = true;
    if (progWrap) progWrap.style.display = "block";
    if (progFill) progFill.style.width = "0%";
    if (progPct) progPct.textContent = "0%";
    if (progLabel) progLabel.textContent = t("updateDownloading") || "Descargando actualización...";

    const info = this.latestUpdate;
    if (!info) return;

    try {
      // Trigger download on companion server
      const startRes = await window.YTDL.serverPost("/download_update", {
        download_url: info.download_url,
        asset_name: info.asset_name
      });

      if (!startRes || (startRes.error && startRes.status !== "already_downloading")) {
        throw new Error(startRes?.error || "Error starting download");
      }

      // Poll download progress
      const pollProgress = () => {
        return new Promise((resolve, reject) => {
          const check = async () => {
            try {
              const p = await window.YTDL.serverRequest("/update_progress");
              if (!p) {
                setTimeout(check, 800);
                return;
              }
              const pct = Math.min(100, Math.round(p.progress || 0));
              if (progFill) progFill.style.width = pct + "%";
              if (progPct) progPct.textContent = pct + "%";

              if (p.status === "ready") {
                resolve(p);
                return;
              }
              if (p.status === "error") {
                reject(new Error(p.error || "Download failed"));
                return;
              }
              setTimeout(check, 500);
            } catch (err) {
              setTimeout(check, 800);
            }
          };
          check();
        });
      };

      await pollProgress();

      // Download complete: trigger installer execution via Windows ShellExecute / UAC
      if (progLabel) progLabel.textContent = t("updateReadyMsg") || "¡Descarga completada! Ejecutando instalador...";
      if (progFill) progFill.style.width = "100%";
      if (progPct) progPct.textContent = "100%";

      const installRes = await window.YTDL.serverPost("/install_update", {});
      if (installRes?.status === "ok") {
        setTimeout(() => {
          if (modal) modal.style.display = "none";
        }, 2500);
      } else {
        throw new Error(installRes?.error || "Could not launch installer");
      }

    } catch (err) {
      // Fallback: If companion host fails or is unreachable, open GitHub release page directly
      if (progLabel) progLabel.textContent = "Abriendo página oficial de descarga...";
      setTimeout(() => {
        if (info.html_url) {
          window.open(info.html_url, "_blank");
        }
        if (modal) modal.style.display = "none";
      }, 1200);
    }
  }
};
