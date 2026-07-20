document.addEventListener("DOMContentLoaded", () => {
  const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;
  const statusCard = document.getElementById("statusCard");
  const statusText = document.getElementById("statusText");
  const statusSub = document.getElementById("statusSub");
  const retryBtn = document.getElementById("retryBtn");

  let currentLang = "en";

  function applyPopupTranslations(lang) {
    const t = (k) => window.YTDL_I18N_get(lang, k);
    if (document.getElementById("i18n-popupSubtitle")) document.getElementById("i18n-popupSubtitle").textContent = t("appSubtitle");
    if (document.getElementById("i18n-popupVersionLabel")) document.getElementById("i18n-popupVersionLabel").textContent = t("popupVersionLabel");
    if (document.getElementById("i18n-popupUpdatedLabel")) document.getElementById("i18n-popupUpdatedLabel").textContent = t("popupUpdatedLabel");
    if (document.getElementById("i18n-popupEnginesTitle")) document.getElementById("i18n-popupEnginesTitle").textContent = t("popupEnginesTitle");
    if (document.getElementById("i18n-popupStatusLabel")) document.getElementById("i18n-popupStatusLabel").textContent = t("popupStatusLabel");
    if (document.getElementById("i18n-popupFooter")) document.getElementById("i18n-popupFooter").textContent = t("popupFooter");
    if (retryBtn) retryBtn.textContent = t("retryBtn");
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

  storage.local.get("settings", (res) => {
    currentLang = res?.settings?.defLang || "en";
    applyPopupTranslations(currentLang);
    checkServer();
  });

  retryBtn.addEventListener("click", checkServer);
});
