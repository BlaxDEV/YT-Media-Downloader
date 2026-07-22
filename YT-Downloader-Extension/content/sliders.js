/*
 * Sliders Module - Trim Sliders & Size Display Logic
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.sliders = {
  // ─── Update Displayed Sizes ─────────────────────────────────
  updateDisplayedSizes(panel) {
    if (!panel) return;
    const dur = window.YTDL.state.videoInfo?.duration || 1;
    const startVal = parseInt(panel.querySelector("#ytdl-v-start")?.value || "0");
    const endVal = parseInt(panel.querySelector("#ytdl-v-end")?.value || "1000");
    const isTrimmed = (startVal > 0 || endVal < 1000);
    const ratio = isTrimmed ? Math.max(0.01, (endVal - startVal) / 1000) : 1;

    panel.querySelectorAll(".ytdl-q-btn").forEach(btn => {
      const rawSize = parseInt(btn.dataset.rawSize || "0");
      const infoSpan = btn.querySelector(".ytdl-q-info");
      if (!infoSpan) return;
      if (rawSize > 0) {
        const calculated = ratio * rawSize;
        const mb = (calculated / 1048576).toFixed(ratio < 0.1 ? 1 : 0);
        infoSpan.textContent = isTrimmed ? `~${mb} MB` : `${mb} MB`;
      } else {
        infoSpan.textContent = btn.dataset.ext || "mp4";
      }
    });
  },

  // ─── Multi-Trim Onion Slices Management ─────────────────────
  renderMultiTrimList(prefix) {
    const panel = document.getElementById("ytdl-popup-panel");
    if (!panel) return;
    const container = panel.querySelector(`#ytdl-${prefix}-multi-trims`);
    if (!container) return;
    container.textContent = "";
    if (!window.YTDL.state.scissorsTrims || window.YTDL.state.scissorsTrims.length === 0) return;

    const dur = window.YTDL.state.videoInfo?.duration || window.YTDL.preview?.getYouTubeVideo()?.duration || 600;
    window.YTDL.state.scissorsTrims.forEach((trim, idx) => {
      const row = document.createElement("div");
      row.className = "ytdl-multi-trim-row";
      row.style.borderLeftColor = trim.color || "#ff1744";
      const isEditing = (window.YTDL.state.editingTrimIndex === idx);
      if (isEditing) {
        row.style.background = "rgba(255, 255, 255, 0.18)";
        row.style.boxShadow = `0 0 8px ${trim.color || "#ff1744"}`;
      }
      const startStr = trim.startStr || window.YTDL.formatTime((trim.start / 1000) * dur);
      const endStr = trim.endStr || window.YTDL.formatTime((trim.end / 1000) * dur);
      row.textContent = "";

      const span = document.createElement("span");
      span.style.cssText = "color: #ffffff !important; font-weight: 500;";
      span.textContent = `Corte ${idx + 1}: `;

      const b = document.createElement("b");
      b.style.cssText = "color: #ffffff !important;";
      b.textContent = `${startStr} - ${endStr}`;
      span.appendChild(b);

      const progSpan = document.createElement("span");
      progSpan.className = "ytdl-trim-progress";
      progSpan.id = `ytdl-trim-progress-${idx}`;
      progSpan.style.cssText = "color: #4caf50; font-size: 11px; margin-left: 8px;";
      span.appendChild(progSpan);

      const divBtn = document.createElement("div");
      divBtn.style.cssText = "display: flex; align-items: center; gap: 6px;";

      const editBtn = document.createElement("button");
      editBtn.className = `ytdl-multi-trim-edit ${isEditing ? 'active' : ''}`;
      editBtn.title = "Editar este corte en tiempo real";
      editBtn.textContent = isEditing ? '✅ Editando' : '✏️ Editar';

      const delBtn = document.createElement("button");
      delBtn.className = "ytdl-multi-trim-del";
      delBtn.title = "Eliminar";
      delBtn.textContent = "✖";

      divBtn.appendChild(editBtn);
      divBtn.appendChild(delBtn);

      row.appendChild(span);
      row.appendChild(divBtn);
      editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.YTDL.state.editingTrimIndex === idx) {
          window.YTDL.state.editingTrimIndex = null;
          this.renderMultiTrimList(prefix);
          return;
        }
        window.YTDL.state.editingTrimIndex = idx;
        const startEl = panel.querySelector(`#ytdl-${prefix}-start`);
        const endEl = panel.querySelector(`#ytdl-${prefix}-end`);
        const timeAEl = panel.querySelector(`#ytdl-${prefix}-time-a`);
        const timeBEl = panel.querySelector(`#ytdl-${prefix}-time-b`);
        if (startEl && endEl) {
          startEl.value = trim.start;
          endEl.value = trim.end;
        }
        if (timeAEl && timeBEl) {
          timeAEl.value = trim.startStr || window.YTDL.formatTime((trim.start / 1000) * dur);
          timeBEl.value = trim.endStr || window.YTDL.formatTime((trim.end / 1000) * dur);
        }
        window.YTDL.state.scissorsTimeSecA = trim.timeSecA !== undefined ? trim.timeSecA : (trim.start / 1000) * dur;
        window.YTDL.state.scissorsTimeSecB = trim.timeSecB !== undefined ? trim.timeSecB : (trim.end / 1000) * dur;
        window.YTDL.state.scissorsTrimA = trim.start;
        window.YTDL.state.scissorsTrimB = trim.end;
        window.YTDL.state.scissorsState = 2;
        window.YTDL.state.activeScissorsColor = trim.color;
        if (panel) panel.style.setProperty("--ytdl-active-color", trim.color);
        
        const fill = panel.querySelector(`#ytdl-${prefix}-fill`);
        if (fill) {
          fill.style.left = (trim.start / 10) + "%";
          fill.style.width = ((trim.end - trim.start) / 10) + "%";
        }
        const scissorsBtn = document.getElementById("ytdl-scissors-btn");
        if (scissorsBtn) {
          const svg = scissorsBtn.querySelector("svg");
          if (svg) svg.setAttribute("fill", trim.color);
          const lbl = document.getElementById("ytdl-scissors-label");
          if (lbl) lbl.textContent = "B";
        }
        if (window.YTDL.state.previewMode) {
          const video = window.YTDL.preview.getYouTubeVideo();
          const curPct = video ? video.currentTime / dur : 0;
          window.YTDL.preview.updateProgressOverlay(trim.start / 1000, trim.end / 1000, curPct);
          window.YTDL.preview.seekToTrimStart(prefix);
        }
        this.renderMultiTrimList(prefix);
      });
      delBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.YTDL.state.editingTrimIndex === idx) {
          window.YTDL.state.editingTrimIndex = null;
        } else if (window.YTDL.state.editingTrimIndex > idx) {
          window.YTDL.state.editingTrimIndex--;
        }
        window.YTDL.state.scissorsTrims.splice(idx, 1);
        this.renderMultiTrimList(prefix);
        if (window.YTDL.state.previewMode) {
          const video = window.YTDL.preview.getYouTubeVideo();
          const curPct = video ? video.currentTime / dur : 0;
          const r = window.YTDL.preview.getTrimRange(prefix);
          if (r) window.YTDL.preview.updateProgressOverlay(r.start / dur, r.end / dur, curPct);
        }
      });
      container.appendChild(row);
    });
  },

  addCurrentTrimSlice(prefix) {
    const panel = document.getElementById("ytdl-popup-panel");
    if (!panel) return;
    if (!window.YTDL.state.scissorsTrims) window.YTDL.state.scissorsTrims = [];
    if (window.YTDL.state.scissorsTrims.length >= 10) return;
    window.YTDL.state.editingTrimIndex = null;

    const dur = window.YTDL.state.videoInfo?.duration || window.YTDL.preview?.getYouTubeVideo()?.duration || 600;
    const timeAEl = panel.querySelector(`#ytdl-${prefix}-time-a`);
    const timeBEl = panel.querySelector(`#ytdl-${prefix}-time-b`);
    const s = parseInt(panel.querySelector(`#ytdl-${prefix}-start`)?.value || 0);
    const e = parseInt(panel.querySelector(`#ytdl-${prefix}-end`)?.value || 1000);

    const startSec = timeAEl ? window.YTDL.parseTime(timeAEl.value) : (s / 1000) * dur;
    const endSec = timeBEl ? window.YTDL.parseTime(timeBEl.value) : (e / 1000) * dur;
    const startStr = timeAEl ? timeAEl.value.trim() : window.YTDL.formatTime(startSec);
    const endStr = timeBEl ? timeBEl.value.trim() : window.YTDL.formatTime(endSec);

    const colorIdx = window.YTDL.state.scissorsTrims.length % window.YTDL.state.TRIM_COLORS.length;
    const color = window.YTDL.state.TRIM_COLORS[colorIdx];

    window.YTDL.state.scissorsTrims.push({
      id: Date.now(),
      start: s,
      end: e,
      timeSecA: startSec,
      timeSecB: endSec,
      startStr,
      endStr,
      color
    });

    const nextIdx = window.YTDL.state.scissorsTrims.length % window.YTDL.state.TRIM_COLORS.length;
    window.YTDL.state.activeScissorsColor = window.YTDL.state.TRIM_COLORS[nextIdx];
    if (panel) panel.style.setProperty("--ytdl-active-color", window.YTDL.state.activeScissorsColor);

    if (window.YTDL.buttons && typeof window.YTDL.buttons.resetScissorsTool === "function") {
      window.YTDL.buttons.resetScissorsTool();
    }
    const startEl = panel.querySelector(`#ytdl-${prefix}-start`);
    const endEl = panel.querySelector(`#ytdl-${prefix}-end`);
    if (startEl && endEl) {
      startEl.value = 0;
      endEl.value = 1000;
      startEl.dispatchEvent(new Event("input"));
    }

    this.renderMultiTrimList(prefix);
    if (window.YTDL.state.previewMode === prefix) {
      const video = window.YTDL.preview.getYouTubeVideo();
      const curPct = video ? video.currentTime / dur : 0;
      window.YTDL.preview.updateProgressOverlay(startSec / dur, endSec / dur, curPct);
    }
  },

  // ─── Setup Sliders ──────────────────────────────────────────
  setupSliders(panel) {
    if (panel) panel.style.setProperty("--ytdl-active-color", window.YTDL.state.activeScissorsColor || "#ff1744");
    window.YTDL.state.trimUpdateHandlers.forEach(h => h.destroy());
    window.YTDL.state.trimUpdateHandlers = [];

    ["v", "a"].forEach(prefix => {
      const start = panel.querySelector(`#ytdl-${prefix}-start`);
      const end = panel.querySelector(`#ytdl-${prefix}-end`);
      const fill = panel.querySelector(`#ytdl-${prefix}-fill`);
      const timeA = panel.querySelector(`#ytdl-${prefix}-time-a`);
      const timeB = panel.querySelector(`#ytdl-${prefix}-time-b`);
      const trimText = panel.querySelector(`#ytdl-${prefix}-trim-text`);

      if (!start || !end) return;

      const update = (fromInput = false, targetEl = null) => {
        const dur = window.YTDL.state.videoInfo?.duration || window.YTDL.preview?.getYouTubeVideo()?.duration || 600;
        let s, e;
        
        if (fromInput) {
          if (timeA) {
            const secA = window.YTDL.parseTime(timeA.value);
            s = (secA / dur) * 1000;
            if (window.YTDL.state.scissorsTimeSecA !== null) window.YTDL.state.scissorsTimeSecA = secA;
          }
          if (timeB) {
            const secB = window.YTDL.parseTime(timeB.value);
            e = (secB / dur) * 1000;
            if (window.YTDL.state.scissorsTimeSecB !== null) window.YTDL.state.scissorsTimeSecB = secB;
          }
          if (s < 0) s = 0;
          if (e > 1000) e = 1000;
          if (s > e - 20) s = Math.max(0, e - 20);
          start.value = s;
          end.value = e;
        } else {
          s = parseInt(start.value);
          e = parseInt(end.value);
          if (s > e - 20) { start.value = e - 20; s = e - 20; }
        }

        fill.style.left = (s / 10) + "%";
        fill.style.width = ((e - s) / 10) + "%";

        if (!fromInput && timeA && timeB) {
          if (window.YTDL.buttons.isApplyingScissors && window.YTDL.state.scissorsTimeSecA !== null && window.YTDL.state.scissorsTimeSecA !== undefined) {
            timeA.value = window.YTDL.formatTime(window.YTDL.state.scissorsTimeSecA);
          } else {
            timeA.value = window.YTDL.formatTime((s / 1000) * dur);
          }
          if (window.YTDL.buttons.isApplyingScissors && window.YTDL.state.scissorsTimeSecB !== null && window.YTDL.state.scissorsTimeSecB !== undefined) {
            timeB.value = window.YTDL.formatTime(window.YTDL.state.scissorsTimeSecB);
          } else {
            timeB.value = window.YTDL.formatTime((e / 1000) * dur);
          }
        }
        
        if (trimText) {
          const secStart = window.YTDL.parseTime(timeA.value);
          const secEnd = window.YTDL.parseTime(timeB.value);
          const remainSecs = Math.max(0, secEnd - secStart);
          trimText.textContent = `Restante: ${window.YTDL.formatTime(remainSecs)}`;
        }

        if (window.YTDL.state.editingTrimIndex !== null && window.YTDL.state.editingTrimIndex !== undefined) {
          const editTrim = window.YTDL.state.scissorsTrims[window.YTDL.state.editingTrimIndex];
          if (editTrim) {
            editTrim.start = s;
            editTrim.end = e;
            const secStart = window.YTDL.parseTime(timeA.value);
            const secEnd = window.YTDL.parseTime(timeB.value);
            editTrim.timeSecA = secStart;
            editTrim.timeSecB = secEnd;
            editTrim.startStr = timeA.value.trim();
            editTrim.endStr = timeB.value.trim();
            const rowB = panel.querySelector(`#ytdl-${prefix}-multi-trims .ytdl-multi-trim-row:nth-child(${window.YTDL.state.editingTrimIndex + 1}) b`);
            if (rowB) {
              rowB.textContent = `${editTrim.startStr} - ${editTrim.endStr}`;
            }
          }
        }

        if (prefix === "v") {
          this.updateDisplayedSizes(panel);
        }

        if (window.YTDL.state.previewMode === prefix) {
          if (!window.YTDL.buttons.isApplyingScissors && targetEl) {
            if (targetEl === end) {
              window.YTDL.preview.seekToTrimEnd(prefix);
            } else if (targetEl === start || fromInput) {
              window.YTDL.preview.seekToTrimStart(prefix);
            }
          }
          const video = window.YTDL.preview.getYouTubeVideo();
          const currentPct = video ? video.currentTime / dur : s / 1000;
          const range = window.YTDL.preview.getTrimRange(prefix);
          if (range) {
            window.YTDL.preview.updateProgressOverlay(range.start / dur, range.end / dur, currentPct);
          } else {
            window.YTDL.preview.updateProgressOverlay(s / 1000, e / 1000, currentPct);
          }
        }
      };

      const handleSliderInput = (e) => {
        if (!window.YTDL.buttons.isApplyingScissors && e && e.isTrusted && (window.YTDL.state.scissorsState > 0 || window.YTDL.state.scissorsTrimA !== null || window.YTDL.state.scissorsTrimB !== null)) {
          window.YTDL.buttons.resetScissorsTool();
        }
        update(false, e ? e.target : null);
      };

      start.addEventListener("input", handleSliderInput);
      end.addEventListener("input", handleSliderInput);
      
      const handleInputEdit = (e) => {
        if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
          if (!window.YTDL.buttons.isApplyingScissors && e && e.isTrusted && (window.YTDL.state.scissorsState > 0 || window.YTDL.state.scissorsTrimA !== null || window.YTDL.state.scissorsTrimB !== null)) {
            window.YTDL.buttons.resetScissorsTool();
          }
          update(true, e ? e.target : null);
        }
      };
      
      if (timeA && timeB) {
          timeA.addEventListener("blur", handleInputEdit);
          timeA.addEventListener("keydown", handleInputEdit);
          timeB.addEventListener("blur", handleInputEdit);
          timeB.addEventListener("keydown", handleInputEdit);
      }

      update();
      this.renderMultiTrimList(prefix);

      window.YTDL.state.trimUpdateHandlers.push({ destroy: () => {
        start.removeEventListener("input", handleSliderInput);
        end.removeEventListener("input", handleSliderInput);
        if (timeA && timeB) {
            timeA.removeEventListener("blur", handleInputEdit);
            timeA.removeEventListener("keydown", handleInputEdit);
            timeB.removeEventListener("blur", handleInputEdit);
            timeB.removeEventListener("keydown", handleInputEdit);
        }
      }});
    });
  }
};
