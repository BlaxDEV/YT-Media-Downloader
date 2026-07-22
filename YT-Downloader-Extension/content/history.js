/*
 * History Module - History Tab Rendering
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.history = {
  currentPage: 1,

  // ─── Load History Data ──────────────────────────────────────
  async loadHistoryData(panel) {
    const listEl = panel?.querySelector("#ytdl-history-list");
    if (!listEl) return;
    const getLang = () => window.YTDL?.state?.defaultSettings?.defLang || "en";
    const t = (k) => typeof window.YTDL_I18N_get === "function" ? window.YTDL_I18N_get(getLang(), k) : k;
    listEl.innerHTML = `<div class="ytdl-history-empty">${t("histLoading")}</div>`;

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
      listEl.innerHTML = `<div class="ytdl-history-empty">${t("histEmpty")}</div>`;
      return;
    }

    this.currentPage = 1;
    this.renderPage(panel, items, 1);
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
      const item = document.createElement("div");
      item.className = "ytdl-hist-item";
      const icon = d.type === "audio" ? "🎵" : "🎬";
      const st = d.status === "complete" ? `✅ ${t("histComplete")}` : d.status === "processing" ? `⏳ ${t("histProcessing")}` : d.status === "error" ? `❌ ${t("histError")}` : `${Math.round(d.progress || 0)}%`;

      const infoDiv = document.createElement("div");
      infoDiv.className = "ytdl-hist-info";

      const titleSpan = document.createElement("span");
      titleSpan.className = "ytdl-hist-title";
      titleSpan.textContent = `${icon} ${d.title || "Video"}`;

      const statusSpan = document.createElement("span");
      statusSpan.className = `ytdl-hist-status ${d.status}`;
      statusSpan.textContent = st;

      infoDiv.appendChild(titleSpan);
      infoDiv.appendChild(statusSpan);

      const barDiv = document.createElement("div");
      barDiv.className = "ytdl-hist-bar";
      const fillDiv = document.createElement("div");
      fillDiv.className = "ytdl-hist-bar-fill";
      fillDiv.style.width = `${d.progress || 0}%`;
      barDiv.appendChild(fillDiv);

      item.appendChild(infoDiv);
      item.appendChild(barDiv);

      if (d.status === "complete") {
        const actionRow = document.createElement("div");
        actionRow.className = "ytdl-hist-action-row";

        if (d.file_exists !== false && d.exists !== false) {
          const openBtn = document.createElement("button");
          openBtn.className = "ytdl-hist-open-btn";
          openBtn.style.margin = "0";
          openBtn.textContent = `📁 ${t("histOpenFolder")}`;
          openBtn.addEventListener("click", () => {
            window.YTDL.serverPost("/open_folder", { id: d.id, path: d.output_dir });
          });
          actionRow.appendChild(openBtn);
        } else {
          const missingBtn = document.createElement("button");
          missingBtn.className = "ytdl-hist-missing-btn";
          missingBtn.setAttribute("title", t("histMissingNotice"));
          missingBtn.innerHTML = `<span>?</span>`;
          missingBtn.addEventListener("click", () => {
            alert(t("histMissingNotice"));
          });
          actionRow.appendChild(missingBtn);
        }
        item.appendChild(actionRow);
      }
      listEl.appendChild(item);
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
