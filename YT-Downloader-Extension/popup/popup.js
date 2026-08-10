document.addEventListener("DOMContentLoaded", () => {
  const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;
  const statusCard = document.getElementById("statusCard");
  const statusText = document.getElementById("statusText");
  const statusSub = document.getElementById("statusSub");
  const retryBtn = document.getElementById("retryBtn");

  function getBrowserLang() {
    const lang = (navigator.language || "en").toLowerCase();
    if (lang.startsWith("es")) return "es";
    if (lang.startsWith("pt")) return "pt";
    if (lang.startsWith("fr")) return "fr";
    if (lang.startsWith("de")) return "de";
    if (lang.startsWith("it")) return "it";
    if (lang.startsWith("ru")) return "ru";
    if (lang.startsWith("ja")) return "ja";
    if (lang.startsWith("zh")) return "zh";
    return "en";
  }

  let currentLang = getBrowserLang();

  function formatLocalDate(lang) {
    const releaseDate = new Date(2026, 7, 10); // August 10, 2026
    const localeMap = {
      en: 'en-US',
      es: 'es-ES',
      pt: 'pt-BR',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      ru: 'ru-RU',
      ja: 'ja-JP',
      zh: 'zh-CN'
    };
    try {
      const loc = localeMap[lang] || navigator.language || 'en-US';
      return new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'numeric', day: 'numeric' }).format(releaseDate);
    } catch (e) {
      return "10/8/2026";
    }
  }

  function applyPopupTranslations(lang) {
    currentLang = lang || getBrowserLang();
    const t = (k) => window.YTDL_I18N_get(currentLang, k);
    const manifest = (typeof chrome !== "undefined" && chrome.runtime?.getManifest) ? chrome.runtime.getManifest() : ((typeof browser !== "undefined" && browser.runtime?.getManifest) ? browser.runtime.getManifest() : null);
    if (manifest && manifest.version) {
      const versionEl = document.getElementById("popupVersion");
      if (versionEl) versionEl.textContent = `v${manifest.version}`;
    }
    const dateEl = document.getElementById("popupDate");
    if (dateEl) {
      dateEl.textContent = formatLocalDate(currentLang);
    }
    if (document.getElementById("i18n-popupSubtitle")) document.getElementById("i18n-popupSubtitle").textContent = t("appSubtitle") || "Video & Audio Downloader Pro";
    if (document.getElementById("i18n-popupVersionLabel")) document.getElementById("i18n-popupVersionLabel").textContent = t("popupVersionLabel") || "Version:";
    if (document.getElementById("i18n-popupUpdatedLabel")) document.getElementById("i18n-popupUpdatedLabel").textContent = t("popupUpdatedLabel") || "Last Updated:";
    if (document.getElementById("i18n-popupEnginesTitle")) document.getElementById("i18n-popupEnginesTitle").textContent = t("popupEnginesTitle") || "Compatible with:";
    if (document.getElementById("i18n-popupStatusLabel")) document.getElementById("i18n-popupStatusLabel").textContent = t("popupStatusLabel") || "Server Status:";
    if (document.getElementById("i18n-popupFooter")) document.getElementById("i18n-popupFooter").textContent = t("popupFooter") || "Advanced settings are located in the ⚙️ icon inside the YouTube video panel.";
    if (retryBtn) retryBtn.textContent = t("retryBtn") || "Retry connection";
  }

  async function checkServer() {
    const t = (k) => window.YTDL_I18N_get(currentLang, k);
    statusCard.className = "server-status-card";
    statusText.textContent = t("popupChecking");
    statusSub.textContent = "127.0.0.1:19836...";
    retryBtn.style.display = "none";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch("http://127.0.0.1:19836/ping", {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data.status === "ok") {
          statusCard.className = "server-status-card connected";
          statusText.textContent = t("popupConnected");
          statusSub.textContent = t("popupServerRun");
          return;
        }
      }
      throw new Error("Invalid response");
    } catch (e) {
      statusCard.className = "server-status-card disconnected";
      statusText.textContent = t("popupDisconnected");
      statusSub.textContent = t("popupServerOff");
      retryBtn.style.display = "block";
    }
  }

  if (storage?.onChanged) {
    storage.onChanged.addListener((changes) => {
      if (changes.settings?.newValue?.defLang) {
        applyPopupTranslations(changes.settings.newValue.defLang);
        checkServer();
      }
    });
  }

  storage.local.get("settings", (res) => {
    currentLang = res?.settings?.defLang || getBrowserLang();
    applyPopupTranslations(currentLang);
    checkServer();
  });

  retryBtn.addEventListener("click", checkServer);
});
