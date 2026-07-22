/*
 * Welcome Page Script - YT Media Downloader Extension
 * Features: Multi-language support, Two-Tab Navigation & 5-Step Carousel Slider
 */

document.addEventListener("DOMContentLoaded", () => {
  const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;
  const langSelect = document.getElementById("langSelect");

  function applyTranslations(lang) {
    const t = (key) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(lang, key) : key;

    const el = (id, k) => {
      const element = document.getElementById(id);
      if (element) element.textContent = t(k);
    };

    el("i18n-welcomeTitle", "welcomeTitle");
    el("i18n-welcomeSubtitle", "welcomeSubtitle");
    el("i18n-subtitleCreator", "subtitleCreator");
    el("i18n-welcomeSelectLang", "welcomeSelectLang");
    el("i18n-welcomeTabHow", "welcomeTabHow");
    el("i18n-welcomeTabFaq", "welcomeTabFaq");
    el("i18n-welcomeHowItWorks", "welcomeHowItWorks");

    // 5 Steps
    el("i18n-welcomeStep1Title", "welcomeStep1Title");
    el("i18n-welcomeStep1Desc", "welcomeStep1Desc");
    el("i18n-welcomeStep2Title", "welcomeStep2Title");
    el("i18n-welcomeStep2Desc", "welcomeStep2Desc");
    el("i18n-welcomeStep3Title", "welcomeStep3Title");
    el("i18n-welcomeStep3Desc", "welcomeStep3Desc");
    el("i18n-welcomeStep4Title", "welcomeStep4Title");
    el("i18n-welcomeStep4Desc", "welcomeStep4Desc");
    el("i18n-welcomeStep5Title", "welcomeStep5Title");
    el("i18n-welcomeStep5Desc", "welcomeStep5Desc");
    el("i18n-welcomeStep6Title", "welcomeStep6Title");
    el("i18n-welcomeStep6Desc", "welcomeStep6Desc");
    el("i18n-welcomeStep7Title", "welcomeStep7Title");
    el("i18n-welcomeStep7Desc", "welcomeStep7Desc");

    // FAQ items
    el("i18n-faq1Title", "faq1Title");
    el("i18n-faq1Desc", "faq1Desc");
    el("i18n-faq2Title", "faq2Title");
    el("i18n-faq2Desc", "faq2Desc");
    el("i18n-faq3Title", "faq3Title");
    el("i18n-faq3Desc", "faq3Desc");
    el("i18n-faq4Title", "faq4Title");
    el("i18n-faq4Desc", "faq4Desc");

    // Ko-Fi & Footer
    el("i18n-welcomeKoFiTitle", "welcomeKoFiTitle");
    el("i18n-welcomeKoFiDesc", "welcomeKoFiDesc");
    el("i18n-footerCreator", "subtitleCreator");
  }

  // Load saved setting
  storage.local.get("settings", (res) => {
    const savedLang = res?.settings?.defLang || "en";
    if (langSelect) langSelect.value = savedLang;
    applyTranslations(savedLang);
  });

  // Handle language change
  if (langSelect) {
    langSelect.addEventListener("change", () => {
      const selectedLang = langSelect.value;
      applyTranslations(selectedLang);

      storage.local.get("settings", (res) => {
        const currentSettings = res?.settings || {};
        currentSettings.defLang = selectedLang;
        storage.local.set({ settings: currentSettings });
      });
    });
  }

  // ─── Tab Switching Logic ──────────────────────────────────────────────
  const tabHowBtn = document.getElementById("tabHowBtn");
  const tabFaqBtn = document.getElementById("tabFaqBtn");
  const paneHow = document.getElementById("paneHow");
  const paneFaq = document.getElementById("paneFaq");
  let isTabHowActive = true;

  if (tabHowBtn && tabFaqBtn && paneHow && paneFaq) {
    tabHowBtn.addEventListener("click", () => {
      if (isTabHowActive) return;
      isTabHowActive = true;
      tabHowBtn.classList.add("active");
      tabFaqBtn.classList.remove("active");
      paneHow.classList.add("active");
      paneFaq.classList.remove("active");
      startTimer();
    });

    tabFaqBtn.addEventListener("click", () => {
      if (!isTabHowActive) return;
      isTabHowActive = false;
      tabFaqBtn.classList.add("active");
      tabHowBtn.classList.remove("active");
      paneFaq.classList.add("active");
      paneHow.classList.remove("active");
      stopTimer();
    });
  }

  // ─── Carousel Logic (Auto-rotates every 5 seconds) ───────────────────
  const slides = document.querySelectorAll(".step-card");
  const dots = document.querySelectorAll(".carousel-dots .dot");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const wrapper = document.getElementById("carouselWrapper");

  let currentStep = 0;
  const totalSteps = slides.length;
  let timer = null;

  function showStep(index) {
    if (totalSteps === 0) return;
    currentStep = (index + totalSteps) % totalSteps;

    slides.forEach((slide, i) => {
      if (i === currentStep) {
        slide.classList.add("active");
      } else {
        slide.classList.remove("active");
      }
    });

    dots.forEach((dot, i) => {
      if (i === currentStep) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  }

  function nextStep() {
    showStep(currentStep + 1);
  }

  function prevStep() {
    showStep(currentStep - 1);
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    if (isTabHowActive) {
      timer = setInterval(nextStep, 5000);
    }
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
  }

  // Event Listeners
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevStep();
      startTimer();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextStep();
      startTimer();
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const idx = parseInt(dot.getAttribute("data-dot"), 10);
      showStep(idx);
      startTimer();
    });
  });

  if (wrapper) {
    wrapper.addEventListener("mouseenter", stopTimer);
    wrapper.addEventListener("mouseleave", () => {
      if (isTabHowActive) startTimer();
    });
  }

  // Initialize
  showStep(0);
  startTimer();
});
