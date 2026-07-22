/*
 * Panel i18n Module - Translations & Option Visibilities
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.panelI18n = {
  // ─── Apply Panel Translations ───────────────────────────────
  applyPanelTranslations(panel, lang) {
    if (!panel) return;
    const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(lang, k) : k;

    // Header
    if (panel.querySelector("#i18n-subtitleCreator")) panel.querySelector("#i18n-subtitleCreator").textContent = t("subtitleCreator");
    if (panel.querySelector("#i18n-buyMeKofi")) panel.querySelector("#i18n-buyMeKofi").textContent = t("buyMeKofi");
    if (panel.querySelector("#ytdl-header-drag")) panel.querySelector("#ytdl-header-drag").setAttribute("title", t("dragTitle") || "Haz clic y arrastra para mover la ventana");

    // Tabs
    const tabs = panel.querySelectorAll(".ytdl-popup-tab");
    tabs.forEach(tab => {
      const dt = tab.dataset.tab;
      if (dt === "video") tab.lastChild.textContent = " " + t("tabVideo");
      if (dt === "audio") tab.lastChild.textContent = " " + t("tabAudio");
      if (dt === "history") tab.lastChild.textContent = " " + t("tabHistory");
    });

    // Video tab
    if (panel.querySelector("#ytdl-server-err span")) panel.querySelector("#ytdl-server-err span").textContent = t("serverErr");
    if (panel.querySelector("#ytdl-retry")) panel.querySelector("#ytdl-retry").textContent = t("retryServer");
    if (panel.querySelector("#ytdl-loading span")) panel.querySelector("#ytdl-loading span").textContent = t("loadingQualities");
    if (panel.querySelector("#ytdl-vfmt-row label")) panel.querySelector("#ytdl-vfmt-row label").textContent = t("formatLabel");
    if (panel.querySelector("#ytdl-opt-thumb + span")) panel.querySelector("#ytdl-opt-thumb + span").textContent = t("thumbCb");
    if (panel.querySelector("#ytdl-opt-sub + span")) panel.querySelector("#ytdl-opt-sub + span").textContent = t("subCb");
    if (panel.querySelector("#ytdl-opt-v-audio + span")) panel.querySelector("#ytdl-opt-v-audio + span").textContent = t("audioCb");
    if (panel.querySelector("#ytdl-video-trim .ytdl-trim-title")) panel.querySelector("#ytdl-video-trim .ytdl-trim-title").textContent = t("trimLabel");
    if (panel.querySelector("#ytdl-video-trim .ytdl-preview-label")) panel.querySelector("#ytdl-video-trim .ytdl-preview-label").textContent = t("previewCb");
    if (panel.querySelector("#ytdl-dl-video")) {
      let dlBtnText = t("dlVideoBtn");
      const audioToggle = panel.querySelector("#ytdl-v-include-audio");
      if (audioToggle && !audioToggle.checked) {
        dlBtnText += " " + (t("noAudioNotice") || "(Sin Audio)");
      }
      panel.querySelector("#ytdl-dl-video").lastChild.textContent = " " + dlBtnText;
    }
    if (panel.querySelector("#ytdl-audio-toggle-wrapper")) panel.querySelector("#ytdl-audio-toggle-wrapper").setAttribute("title", t("audioToggleTitle") || "Incluir / Excluir Audio");

    // Audio tab
    const afmtRow = panel.querySelector("[data-content='audio'] .ytdl-opt-row:nth-of-type(1) label");
    if (afmtRow) afmtRow.textContent = t("formatLabel");
    const aqRow = panel.querySelector("[data-content='audio'] .ytdl-opt-row:nth-of-type(2) label");
    if (aqRow) aqRow.textContent = t("qualityLabel");
    if (panel.querySelector("#ytdl-opt-a-audio + span")) panel.querySelector("#ytdl-opt-a-audio + span").textContent = t("audioCb");
    if (panel.querySelector("#ytdl-audio-trim .ytdl-trim-title")) panel.querySelector("#ytdl-audio-trim .ytdl-trim-title").textContent = t("trimLabel");
    if (panel.querySelector("#ytdl-audio-trim .ytdl-preview-label")) panel.querySelector("#ytdl-audio-trim .ytdl-preview-label").textContent = t("previewCb");
    if (panel.querySelector("#ytdl-dl-audio")) panel.querySelector("#ytdl-dl-audio").lastChild.textContent = " " + t("dlAudioBtn");

    // History tab
    if (panel.querySelector(".ytdl-history-header span")) panel.querySelector(".ytdl-history-header span").textContent = t("histHeader");
    if (panel.querySelector("#ytdl-hist-clear")) panel.querySelector("#ytdl-hist-clear").setAttribute("title", t("histClear") || "Borrar Historial");
    if (panel.querySelector("#ytdl-v-open-folder-btn")) panel.querySelector("#ytdl-v-open-folder-btn").textContent = "📁 " + t("histOpenFolder");
    if (panel.querySelector("#ytdl-a-open-folder-btn")) panel.querySelector("#ytdl-a-open-folder-btn").textContent = "📁 " + t("histOpenFolder");

    // Config tab
    const cfgRows = panel.querySelectorAll("[data-content='config'] .ytdl-opt-row");
    if (cfgRows[0]) {
      const lbl = cfgRows[0].querySelector("label");
      const sm = cfgRows[0].querySelector("small");
      if (lbl) lbl.textContent = t("cfgOutDir");
      if (sm) sm.textContent = t("cfgOutDirSmall");
    }
    if (cfgRows[1]) {
      const lbl = cfgRows[1].querySelector("label");
      if (lbl) lbl.textContent = t("cfgSelectLang");
    }
    if (cfgRows[2]) {
      const lbl = cfgRows[2].querySelector("label");
      if (lbl) lbl.textContent = t("cfgDefVfmt");
    }
    if (cfgRows[3]) {
      const lbl = cfgRows[3].querySelector("label");
      if (lbl) lbl.textContent = t("cfgDefVq");
    }
    if (cfgRows[4]) {
      const lbl = cfgRows[4].querySelector("label");
      if (lbl) lbl.textContent = t("cfgDefAfmt");
    }
    if (cfgRows[5]) {
      const lbl = cfgRows[5].querySelector("label");
      if (lbl) lbl.textContent = t("cfgDefAq");
    }
    if (cfgRows[6]) {
      const lbl = cfgRows[6].querySelector("label");
      if (lbl) lbl.textContent = t("cfgDefCheckboxes");
      const cbs = cfgRows[6].querySelectorAll(".ytdl-checkbox-label span");
      if (cbs[0]) cbs[0].textContent = t("cfgThumbCheck");
      if (cbs[1]) cbs[1].textContent = t("cfgSubCheck");
      if (cbs[2]) cbs[2].textContent = t("cfgAudioCheck");
    }
    if (panel.querySelector("#ytdl-cfg-additional-title")) panel.querySelector("#ytdl-cfg-additional-title").textContent = t("cfgAdditionalTitle") || "Opciones adicionales";
    if (panel.querySelector("#ytdl-lbl-lufs")) panel.querySelector("#ytdl-lbl-lufs").textContent = t("cfgLufsNorm") || "Normalización de Volumen de Audio (LUFS)";
    if (panel.querySelector("#ytdl-lbl-gif")) panel.querySelector("#ytdl-lbl-gif").textContent = t("cfgGifExport") || "Activar exportación como GIF / WebP Animado";
    if (panel.querySelector("#ytdl-lbl-meta")) panel.querySelector("#ytdl-lbl-meta").textContent = t("cfgAudioMeta") || "Descarga automática de Metadata de Audio";

    if (panel.querySelector("#ytdl-v-add-trim")) panel.querySelector("#ytdl-v-add-trim").setAttribute("title", t("optAddTrim") || "+");
    if (panel.querySelector("#ytdl-a-add-trim")) panel.querySelector("#ytdl-a-add-trim").setAttribute("title", t("optAddTrim") || "+");
    panel.querySelectorAll(".ytdl-chapters-header .ytdl-preview-label").forEach(s => { s.textContent = t("optChapters") || "Descargar por Capítulos"; });

    if (panel.querySelector("#ytdl-save-cfg")) panel.querySelector("#ytdl-save-cfg").lastChild.textContent = " " + t("saveBtn");

    const actionBtnSpan = document.querySelector("#ytdl-action-btn span");
    if (actionBtnSpan) actionBtnSpan.textContent = t("ytDownloadBtn");

    if (panel.querySelector("#ytdl-history-list") && window.YTDL?.history?.loadHistoryData) {
      window.YTDL.history.loadHistoryData(panel);
    }
  },

  // ─── Apply Option Visibilities ──────────────────────────────
  applyOptionVisibilities(panel) {
    if (!panel) return;
    const isThumbEnabled = panel.querySelector("#ytdl-def-thumb")?.checked || !!window.YTDL.state.defaultSettings.defThumb;
    const isSubEnabled = panel.querySelector("#ytdl-def-sub")?.checked || !!window.YTDL.state.defaultSettings.defSub;
    const isAudioEnabled = panel.querySelector("#ytdl-def-audio")?.checked || !!window.YTDL.state.defaultSettings.defAudio;
    const isGifEnabled = panel.querySelector("#ytdl-opt-gif-export")?.checked || !!window.YTDL.state.defaultSettings.gifExport;

    const gifChip = panel.querySelector('#ytdl-v-fmt .ytdl-chip[data-v="gif"]');
    const webpChip = panel.querySelector('#ytdl-v-fmt .ytdl-chip[data-v="webp"]');
    if (gifChip) gifChip.style.display = isGifEnabled ? "inline-flex" : "none";
    if (webpChip) webpChip.style.display = isGifEnabled ? "inline-flex" : "none";

    const thumbContainer = panel.querySelector("#ytdl-opt-thumb")?.closest(".ytdl-checkbox-label");
    if (thumbContainer) thumbContainer.style.display = isThumbEnabled ? "flex" : "none";

    const subContainer = panel.querySelector("#ytdl-opt-sub")?.closest(".ytdl-checkbox-label");
    const selSub = panel.querySelector("#ytdl-sel-sub");
    if (subContainer) subContainer.style.display = isSubEnabled ? "flex" : "none";
    if (!isSubEnabled && selSub) selSub.style.display = "none";
    else if (isSubEnabled && selSub && panel.querySelector("#ytdl-opt-sub")?.checked) selSub.style.display = "block";

    const vAudioContainer = panel.querySelector("#ytdl-opt-v-audio")?.closest(".ytdl-checkbox-label");
    const selVAudio = panel.querySelector("#ytdl-sel-v-audio");
    if (vAudioContainer) vAudioContainer.style.display = isAudioEnabled ? "flex" : "none";
    if (!isAudioEnabled && selVAudio) selVAudio.style.display = "none";
    else if (isAudioEnabled && selVAudio && panel.querySelector("#ytdl-opt-v-audio")?.checked) selVAudio.style.display = "block";

    const aAudioContainer = panel.querySelector("#ytdl-opt-a-audio")?.closest(".ytdl-checkbox-label");
    const selAAudio = panel.querySelector("#ytdl-sel-a-audio");
    if (aAudioContainer) aAudioContainer.style.display = isAudioEnabled ? "flex" : "none";
    if (!isAudioEnabled && selAAudio) selAAudio.style.display = "none";
    else if (isAudioEnabled && selAAudio && panel.querySelector("#ytdl-opt-a-audio")?.checked) selAAudio.style.display = "block";

    const vExtras = panel.querySelector('[data-content="video"] .ytdl-opt-extras');
    if (vExtras) {
      vExtras.style.display = (isThumbEnabled || isSubEnabled || isAudioEnabled) ? "block" : "none";
    }
    const aExtras = panel.querySelector('[data-content="audio"] .ytdl-opt-extras');
    if (aExtras) {
      aExtras.style.display = isAudioEnabled ? "block" : "none";
    }
  }
};
