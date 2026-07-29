/*
 * Changelog Page Script - YT Media Downloader Extension v1.2.7
 * Multi-language support & language switcher
 */

document.addEventListener("DOMContentLoaded", () => {
  const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;
  const langSelect = document.getElementById("langSelect");

  const translations = {
    en: {
      title: "YT Media Downloader — Release v1.2.7",
      subtitle: "What's new in v1.2.7 across the Extension and Companion Server.",
      secTitle: "Critical Security & Zero-Disk Memory Upgrade",
      secDesc: "Master credentials (SID, HSID, SSID, APISID, SAPISID) are strictly discarded. Cookies are processed 100% in RAM with zero disk persistence, and legacy disk cookie files are purged automatically on server startup.",
      srvTitle: "Companion Server (ytdl_host.py)",
      srvItem1T: "Zero-Disk Cookie Security:",
      srvItem1D: "Processes active player cookies exclusively in RAM with instant 0-byte file cleanup.",
      srvItem2T: "Native OS Folder Selector (/select_folder):",
      srvItem2D: "Opens native Windows/Linux folder picker windows, remembering the last selected folder.",
      srvItem3T: "Legacy Disk Cookie Purge:",
      srvItem3D: "Automatically detects and purges plaintext cookie files (.yt_cookies.txt, cookies.txt) on startup.",
      srvItem4T: "Updated yt-dlp & 4K Bypass:",
      srvItem4D: "Updated engine dependencies to ensure smooth 1080p, 4K, and 60fps format parsing.",
      extTitle: "Extension UI & Features",
      extItem1T: "Direct 'Save As' Workflow:",
      extItem1D: "Clicking Download Video or Download Audio prompts the OS folder picker window directly.",
      extItem2T: "Chapter Selection Modal:",
      extItem2D: "Sleek modal popup with Select All / Deselect All controls and dynamic badge summary.",
      extItem3T: "YouTube Player Animations:",
      extItem3D: "Center-screen badges ('A', 'B', and ♻️ Loop arrows) over the video player while trimming.",
      extItem4T: "Dynamic i18n Download Labels:",
      extItem4D: "Real-time button label states translated across 9 supported languages.",
      ctaTitle: "Upgrade Your Companion Server to v1.2.7",
      ctaDesc: "To take full advantage of the new security model and native folder picker, download the latest Companion Server executable.",
      ctaBtn: "🚀 Download Companion Server v1.2.7 (Release Tab)"
    },
    es: {
      title: "YT Media Downloader — Versión v1.2.7",
      subtitle: "Novedades de la versión v1.2.7 en la Extensión y el Servidor Companion.",
      secTitle: "Actualización Crítica de Seguridad y Memoria Cero-Disco",
      secDesc: "Las credenciales maestras (SID, HSID, SSID, APISID, SAPISID) son descartadas estrictamente. Las cookies se procesan 100% en memoria RAM sin persistencia en disco, y los archivos de cookies antiguos se eliminan automáticamente.",
      srvTitle: "Servidor Companion (ytdl_host.py)",
      srvItem1T: "Seguridad de Cookies Cero-Disco:",
      srvItem1D: "Procesa las cookies del reproductor exclusivamente en RAM con borrado instantáneo a 0 bytes.",
      srvItem2T: "Selector Nativo del Sistema Operativo (/select_folder):",
      srvItem2D: "Abre la ventana nativa de selección de carpeta en Windows/Linux recordando la última ubicación.",
      srvItem3T: "Depuración de Archivos de Cookies Antiguos:",
      srvItem3D: "Detecta y elimina automáticamente archivos de texto plano (.yt_cookies.txt, cookies.txt) al iniciar.",
      srvItem4T: "yt-dlp Actualizado y Bypass 4K:",
      srvItem4D: "Motor actualizado para garantizar descargas fluidas en 1080p, 4K y 60fps.",
      extTitle: "Extensión UI y Funciones",
      extItem1T: "Flujo Directo 'Guardar como...':",
      extItem1D: "Al presionar Descargar Video o Descargar Audio se abre directamente el explorador del sistema.",
      extItem2T: "Ventana Modal de Selección de Capítulos:",
      extItem2D: "Popup modal elegante con botones Seleccionar Todos / Deseleccionar Todos y resumen dinámico.",
      extItem3T: "Animaciones en el Reproductor de YouTube:",
      extItem3D: "Insignias animadas ('A', 'B' y flechas de bucle ♻️) al recortar videos.",
      extItem4T: "Botones de Descarga Dinámicos e Idiomas:",
      extItem4D: "Estados del botón traducidos dinámicamente en los 9 idiomas soportados.",
      ctaTitle: "Actualiza tu Servidor Companion a la versión v1.2.7",
      ctaDesc: "Para aprovechar el nuevo modelo de seguridad y el selector de carpetas nativo, descarga el ejecutable más reciente.",
      ctaBtn: "🚀 Descargar Servidor Companion v1.2.7 (Pestaña Releases)"
    }
  };

  function applyTranslations(lang) {
    const dict = translations[lang] || translations.en;

    const setTxt = (id, text) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text;
    };

    setTxt("cl-title", dict.title);
    setTxt("cl-subtitle", dict.subtitle);
    setTxt("cl-sec-title", dict.secTitle);
    setTxt("cl-sec-desc", dict.secDesc);
    setTxt("cl-srv-title", dict.srvTitle);
    setTxt("cl-srv-item1-t", dict.srvItem1T);
    setTxt("cl-srv-item1-d", dict.srvItem1D);
    setTxt("cl-srv-item2-t", dict.srvItem2T);
    setTxt("cl-srv-item2-d", dict.srvItem2D);
    setTxt("cl-srv-item3-t", dict.srvItem3T);
    setTxt("cl-srv-item3-d", dict.srvItem3D);
    setTxt("cl-srv-item4-t", dict.srvItem4T);
    setTxt("cl-srv-item4-d", dict.srvItem4D);

    setTxt("cl-ext-title", dict.extTitle);
    setTxt("cl-ext-item1-t", dict.extItem1T);
    setTxt("cl-ext-item1-d", dict.extItem1D);
    setTxt("cl-ext-item2-t", dict.extItem2T);
    setTxt("cl-ext-item2-d", dict.extItem2D);
    setTxt("cl-ext-item3-t", dict.extItem3T);
    setTxt("cl-ext-item3-d", dict.extItem3D);
    setTxt("cl-ext-item4-t", dict.extItem4T);
    setTxt("cl-ext-item4-d", dict.extItem4D);

    setTxt("cl-cta-title", dict.ctaTitle);
    setTxt("cl-cta-desc", dict.ctaDesc);
    setTxt("cl-cta-btn", dict.ctaBtn);
  }

  storage.local.get("settings", (res) => {
    const savedLang = res?.settings?.defLang || "en";
    if (langSelect) langSelect.value = savedLang;
    applyTranslations(savedLang);
  });

  if (langSelect) {
    langSelect.addEventListener("change", (e) => {
      const selectedLang = e.target.value;
      applyTranslations(selectedLang);
      storage.local.get("settings", (res) => {
        const current = res?.settings || {};
        storage.local.set({ settings: { ...current, defLang: selectedLang } });
      });
    });
  }
});
