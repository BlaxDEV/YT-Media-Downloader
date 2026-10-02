/*
 * History Module - History Tab Rendering & Live Queue Cancellation
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.history = {
  currentPage: 1,
  _pollTimer: null,

  stopAutoRefresh() {
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
  },

  // ─── Load History Data ──────────────────────────────────────
  async loadHistoryData(panel) {
    this.stopAutoRefresh();
    const listEl = panel?.querySelector("#ytdl-history-list");
    if (!listEl) return;
    const getLang = () => window.YTDL?.state?.defaultSettings?.defLang || "en";
    const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(getLang(), k) : k;

    if (!listEl.hasChildNodes() || listEl.querySelector(".ytdl-history-empty")) {
      listEl.textContent = "";
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "ytdl-history-empty";
      loadingDiv.textContent = t("histLoading");
      listEl.appendChild(loadingDiv);
    }

    const res = await window.YTDL.serverRequest("/history");
    let items = res?.downloads || res?.history || [];

    const storageAPI = typeof browser !== "undefined" ? browser?.storage?.local : chrome?.storage?.local;
    if (items.length > 0) {
      items = items.slice(0, 50);
      if (storageAPI) {
        try { storageAPI.set({ ytdl_history: items }); } catch (e) {}
      }
    } else if (storageAPI) {
      try {
        const stored = await new Promise(resolve => storageAPI.get(["ytdl_history"], data => resolve(data?.ytdl_history || [])));
        if (stored && stored.length > 0) items = stored.slice(0, 50);
      } catch (e) {}
    }

    if (!items || items.length === 0) {
      listEl.textContent = "";
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "ytdl-history-empty";
      emptyDiv.textContent = t("histEmpty");
      listEl.appendChild(emptyDiv);
      return;
    }

    this.currentPage = 1;
    this.renderPage(panel, items, 1);

    // Auto-refresh while there are active processing downloads and history tab is visible
    const hasActive = items.some(item => item.status === "processing");
    if (hasActive) {
      this._pollTimer = setTimeout(() => {
        const histContent = panel?.querySelector('[data-content="history"]');
        if (histContent && histContent.classList.contains("active")) {
          this.loadHistoryData(panel);
        }
      }, 1500);
    }
  },

  // ─── Render Paginated History Page ──────────────────────────
  renderPage(panel, items, page) {
    const listEl = panel?.querySelector("#ytdl-history-list");
    if (!listEl) return;

    const getLang = () => window.YTDL?.state?.defaultSettings?.defLang || "en";
    const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(getLang(), k) : k;

    const totalPages = Math.max(1, Math.ceil(items.length / 10));
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    this.currentPage = page;

    listEl.textContent = "";

    const pageItems = items.slice((page - 1) * 10, page * 10);
    pageItems.forEach(d => {
      const card = document.createElement("div");
      card.className = "ytdl-hist-item";

      // 1. Left Thumbnail Column
      const thumbWrap = document.createElement("div");
      thumbWrap.className = "ytdl-hist-thumb-wrap";

      const createFallbackSvg = () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "ytdl-hist-fallback-icon");
        svg.setAttribute("viewBox", "0 0 24 24");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "currentColor");
        path.setAttribute("d", d.type === "audio" 
          ? "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
          : "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z");
        svg.appendChild(path);
        return svg;
      };

      if (d.thumbnail) {
        const img = document.createElement("img");
        img.className = "ytdl-hist-thumb-img";
        img.src = d.thumbnail;
        img.onerror = () => {
          img.replaceWith(createFallbackSvg());
        };
        thumbWrap.appendChild(img);
      } else {
        thumbWrap.appendChild(createFallbackSvg());
      }

      if (d.duration) {
        const durPill = document.createElement("span");
        durPill.className = "ytdl-hist-dur-pill";
        durPill.textContent = d.duration;
        thumbWrap.appendChild(durPill);
      }

      card.appendChild(thumbWrap);

      // 2. Center Info Column
      const infoCol = document.createElement("div");
      infoCol.className = "ytdl-hist-info";

      const titleDiv = document.createElement("div");
      titleDiv.className = "ytdl-hist-title";
      titleDiv.textContent = d.title || "Video";
      titleDiv.setAttribute("title", d.title || "Video");
      infoCol.appendChild(titleDiv);

      // Tags Row (e.g. 1080p MP4 52:48 448 MB)
      const tagsDiv = document.createElement("div");
      tagsDiv.className = "ytdl-hist-tags";
      
      const tagQuality = d.quality || (d.type === "audio" ? "Audio" : "1080p");
      const tagFormat = (d.format || (d.type === "audio" ? "MP3" : "MP4")).toUpperCase();
      
      const tags = [tagQuality, tagFormat];
      if (d.duration && !thumbWrap.querySelector('.ytdl-hist-dur-pill')) tags.push(d.duration);
      if (d.filesize_str) tags.push(d.filesize_str);

      tags.forEach(tText => {
        const tSpan = document.createElement("span");
        tSpan.className = "ytdl-hist-tag";
        tSpan.textContent = tText;
        tagsDiv.appendChild(tSpan);
      });
      infoCol.appendChild(tagsDiv);

      // Status Row
      const isProcessing = d.status === "processing";
      const isCancelled = d.status === "cancelled";
      const isComplete = d.status === "complete";
      const isError = d.status === "error";

      const stText = isComplete 
        ? (t("histComplete") || "Completado")
        : isProcessing 
        ? `${t("histProcessing") || "Descargando..."} (${Math.round(d.progress || 0)}%)` 
        : isCancelled
        ? (t("histCancelled") || "Cancelado")
        : isError 
        ? (d.error ? `${t("histError") || "Error"}: ${d.error.slice(0, 30)}` : (t("histError") || "Error"))
        : `${Math.round(d.progress || 0)}%`;

      const statusDiv = document.createElement("div");
      statusDiv.className = `ytdl-hist-status ${d.status}`;
      statusDiv.textContent = stText;
      infoCol.appendChild(statusDiv);

      card.appendChild(infoCol);

      // 3. Right Column (Date, Cancel button if processing, Open button if complete)
      const rightCol = document.createElement("div");
      rightCol.className = "ytdl-hist-right-col";

      const dateDiv = document.createElement("div");
      dateDiv.className = "ytdl-hist-date";
      dateDiv.textContent = d.timestamp_str || d.date || "";
      rightCol.appendChild(dateDiv);

      if (isProcessing && d.id) {
        const cancelBtn = document.createElement("button");
        cancelBtn.className = "ytdl-hist-cancel-btn";
        cancelBtn.textContent = t("histCancelBtn") || "Cancelar";
        cancelBtn.setAttribute("title", "Cancelar esta descarga");
        cancelBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          cancelBtn.disabled = true;
          cancelBtn.textContent = "...";
          try {
            await window.YTDL.serverPost("/cancel", { id: d.id });
            d.status = "cancelled";
            d.progress = 0;
            this.loadHistoryData(panel);
          } catch (err) {
            cancelBtn.disabled = false;
            cancelBtn.textContent = t("histCancelBtn") || "Cancelar";
          }
        });
        rightCol.appendChild(cancelBtn);
      } else if (isComplete && d.output_dir) {
        const openBtn = document.createElement("button");
        openBtn.className = "ytdl-hist-open-btn";
        openBtn.textContent = "📁 " + (t("histOpenFolder") || "Abrir");
        openBtn.setAttribute("title", t("histOpenFolder") || "Abrir carpeta");
        openBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          window.YTDL.serverPost("/open_folder", { id: d.id, path: d.output_dir });
        });
        rightCol.appendChild(openBtn);
      }

      card.appendChild(rightCol);
      listEl.appendChild(card);
    });

    if (totalPages > 1) {
      const pagDiv = document.createElement("div");
      pagDiv.className = "ytdl-hist-pagination";

      const prevBtn = document.createElement("button");
      prevBtn.className = "ytdl-hist-page-btn";
      prevBtn.textContent = t("histPrev");
      prevBtn.disabled = page <= 1;
      prevBtn.addEventListener("click", () => {
        window.YTDL.history.renderPage(panel, items, page - 1);
      });

      const pageInfo = document.createElement("span");
      pageInfo.textContent = `${t("histPage")} ${page} ${t("histOf")} ${totalPages}`;

      const nextBtn = document.createElement("button");
      nextBtn.className = "ytdl-hist-page-btn";
      nextBtn.textContent = t("histNext");
      nextBtn.disabled = page >= totalPages;
      nextBtn.addEventListener("click", () => {
        window.YTDL.history.renderPage(panel, items, page + 1);
      });

      pagDiv.appendChild(prevBtn);
      pagDiv.appendChild(pageInfo);
      pagDiv.appendChild(nextBtn);
      listEl.appendChild(pagDiv);
    }
  }
};
