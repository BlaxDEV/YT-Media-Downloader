/*
 * Panel Module - Panel HTML Creation
 * YT Media Downloader Extension
 */

window.YTDL = window.YTDL || {};

window.YTDL.panel = {
  // ─── Create Panel ──────────────────────────────────────────
  createPanel() {
    const panel = document.createElement("div");
    panel.id = "ytdl-popup-panel";
    panel.className = "ytdl-popup";
    const htmlStr = `
      <div class="ytdl-popup-inner">
        <div class="ytdl-popup-header" id="ytdl-header-drag" title="Haz clic y arrastra para mover la ventana">
          <div class="ytdl-popup-title" style="display: flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0;">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#ff4444" style="flex-shrink: 0;"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
            <span style="font-weight: 600; font-size: 15px;">YT Media Downloader</span>
            <span class="ytdl-grip-handle" style="color: #999; font-size: 20px; font-weight: bold; margin-left: 8px; letter-spacing: -3px; user-select: none; display: inline-flex; align-items: center; cursor: grab; line-height: 1;" title="Haz clic y arrastra para mover la ventana">⋮⋮</span>
          </div>
          <div style="text-align: right; margin-left: auto; margin-right: 8px; flex-shrink: 0;">
            <div class="ytdl-popup-subtitle" id="i18n-subtitleCreator">creado por BlaxDEV</div>
            <a href="https://ko-fi.com/blaxdev" target="_blank" class="ytdl-kofi-subtitle" id="i18n-buyMeKofi">☕ Buy me a Ko-Fi!</a>
          </div>
          <button class="ytdl-popup-close" id="ytdl-close-btn" style="flex-shrink: 0;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div class="ytdl-popup-tabs">
          <button class="ytdl-popup-tab active" data-tab="video">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
            Video
          </button>
          <button class="ytdl-popup-tab" data-tab="audio">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            Audio
          </button>
          <button class="ytdl-popup-tab" data-tab="history">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z"/></svg>
            Historial
          </button>
          <button class="ytdl-popup-tab" data-tab="config">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z"/></svg>
          </button>
        </div>

        <div class="ytdl-popup-body">
          <!-- Video Tab -->
          <div class="ytdl-popup-content active" data-content="video">
            <div class="ytdl-server-err" id="ytdl-server-err" style="display:none">
              <span>Servidor no disponible</span>
              <button id="ytdl-retry">Reintentar</button>
            </div>
            <div class="ytdl-opt-row" id="ytdl-vfmt-row">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding-right: 4px;">
                <label style="margin-bottom: 0;">Formato</label>
                <label class="ytdl-audio-toggle" id="ytdl-audio-toggle-wrapper" style="display: inline-flex !important; align-items: center !important; gap: 8px !important; cursor: pointer !important; user-select: none !important; margin-right: 14px !important;" title="Incluir / Excluir Audio en la descarga de video">
                  <img id="ytdl-audio-icon" src="${(typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime.getURL('icons/audio.png') : ''}" style="width:16px;height:16px;">
                  <input type="checkbox" id="ytdl-v-include-audio" checked>
                  <span class="ytdl-toggle-track" style="display: inline-block !important; width: 36px !important; height: 20px !important; min-width: 36px !important; min-height: 20px !important; border-radius: 10px !important; position: relative !important; flex-shrink: 0 !important;"></span>
                </label>
              </div>
              <div class="ytdl-chips" id="ytdl-v-fmt">
                <button class="ytdl-chip active" data-v="mp4">MP4</button>
                <button class="ytdl-chip" data-v="webm">WebM</button>
                <button class="ytdl-chip" data-v="mkv">MKV</button>
                <button class="ytdl-chip" data-v="gif" style="display:none;">GIF</button>
                <button class="ytdl-chip" data-v="webp" style="display:none;">WebP</button>
              </div>
            </div>
            <div class="ytdl-loading" id="ytdl-loading">
              <div class="ytdl-spinner"></div>
              <span>Cargando calidades...</span>
            </div>
            <div class="ytdl-qualities-grid" id="ytdl-qualities"></div>
            <div class="ytdl-opt-extras">
              <label class="ytdl-checkbox-label">
                <input type="checkbox" id="ytdl-opt-thumb">
                <span>Descargar miniatura (.JPG)</span>
              </label>
              <label class="ytdl-checkbox-label">
                <input type="checkbox" id="ytdl-opt-sub">
                <span>Descargar subtítulos (.SRT)</span>
              </label>
              <select id="ytdl-sel-sub" class="ytdl-select-input" style="display:none; margin-top:4px; margin-bottom:6px;"></select>
              <label class="ytdl-checkbox-label">
                <input type="checkbox" id="ytdl-opt-v-audio">
                <span>Usar pista de audio multi-idioma</span>
              </label>
              <select id="ytdl-sel-v-audio" class="ytdl-select-input" style="display:none; margin-top:4px; margin-bottom:6px;"></select>
            </div>
            <div class="ytdl-trim-box" id="ytdl-video-trim" style="display:none">
              <div class="ytdl-trim-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <button class="ytdl-add-trim-btn" id="ytdl-v-add-trim" title="Añadir otro recorte (+)">+</button>
                  <span class="ytdl-trim-title">Recortar</span>
                </div>
                <span class="ytdl-trim-range" id="ytdl-v-trim-text">0:00 - 0:00</span>
              </div>
              <div class="ytdl-dual-range">
                <input type="text" class="ytdl-range-time-input" id="ytdl-v-time-a" value="0:00">
                <div class="ytdl-range-track">
                  <div class="ytdl-range-fill" id="ytdl-v-fill"></div>
                  <input type="range" min="0" max="1000" value="0" step="1" class="ytdl-range-input" id="ytdl-v-start">
                  <input type="range" min="0" max="1000" value="1000" step="1" class="ytdl-range-input" id="ytdl-v-end">
                </div>
                <input type="text" class="ytdl-range-time-input" id="ytdl-v-time-b" value="0:00">
              </div>
              <div class="ytdl-multi-trims-container" id="ytdl-v-multi-trims"></div>
              <label class="ytdl-preview-toggle">
                <input type="checkbox" id="ytdl-v-preview-cb">
                <span class="ytdl-toggle-track"></span>
                <span class="ytdl-preview-label">Previsualizar recortes</span>
              </label>
              <div class="ytdl-chapters-box" id="ytdl-v-chapters-box" style="display:none;">
                <div class="ytdl-chapters-header">
                  <label class="ytdl-preview-toggle" style="margin: 0; padding-left: 0;">
                    <input type="checkbox" id="ytdl-v-chapters-cb">
                    <span class="ytdl-toggle-track"></span>
                    <span class="ytdl-preview-label">Descargar por Capítulos</span>
                  </label>
                </div>
                <div class="ytdl-chapters-select-row" id="ytdl-v-chapters-row" style="display:none; margin-top: 8px;">
                  <select id="ytdl-v-chapters-sel" class="ytdl-select-input"></select>
                  <button class="ytdl-add-trim-btn" id="ytdl-v-add-chapter" title="Seleccionar múltiple (+)">+</button>
                </div>
                <div class="ytdl-multi-trims-container" id="ytdl-v-selected-chapters"></div>
              </div>
            </div>
            <button class="ytdl-dl-btn" id="ytdl-dl-video" disabled>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              Descargar Video
            </button>
            <button class="ytdl-open-folder-btn" id="ytdl-v-open-folder-btn" style="display:none;">📁 Abrir Carpeta</button>
            <div class="ytdl-progress" id="ytdl-v-progress" style="display:none">
              <div class="ytdl-progress-track"><div class="ytdl-progress-bar" id="ytdl-v-bar"></div></div>
              <span class="ytdl-progress-pct" id="ytdl-v-pct">0%</span>
            </div>
          </div>

          <!-- Audio Tab -->
          <div class="ytdl-popup-content" data-content="audio">
            <div class="ytdl-opt-row">
              <label>Formato</label>
              <div class="ytdl-chips" id="ytdl-a-fmt">
                <button class="ytdl-chip active" data-v="mp3">MP3</button>
                <button class="ytdl-chip" data-v="m4a">M4A</button>
                <button class="ytdl-chip" data-v="opus">Opus</button>
                <button class="ytdl-chip" data-v="flac">FLAC</button>
              </div>
            </div>
            <div class="ytdl-opt-row">
              <label>Calidad</label>
              <div class="ytdl-chips" id="ytdl-a-q">
                <button class="ytdl-chip" data-v="128K">128k</button>
                <button class="ytdl-chip active" data-v="192K">192k</button>
                <button class="ytdl-chip" data-v="256K">256k</button>
                <button class="ytdl-chip" data-v="320K">320k</button>
                <button class="ytdl-chip" data-v="0">Max</button>
              </div>
            </div>
            <div class="ytdl-opt-extras">
              <label class="ytdl-checkbox-label">
                <input type="checkbox" id="ytdl-opt-a-audio">
                <span>Usar pista de audio multi-idioma</span>
              </label>
              <select id="ytdl-sel-a-audio" class="ytdl-select-input" style="display:none; margin-top:4px; margin-bottom:6px;"></select>
            </div>
            <div class="ytdl-trim-box" id="ytdl-audio-trim" style="display:none">
              <div class="ytdl-trim-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <button class="ytdl-add-trim-btn" id="ytdl-a-add-trim" title="Añadir otro recorte (+)">+</button>
                  <span class="ytdl-trim-title">Recortar</span>
                </div>
                <span class="ytdl-trim-range" id="ytdl-a-trim-text">0:00 - 0:00</span>
              </div>
              <div class="ytdl-dual-range">
                <input type="text" class="ytdl-range-time-input" id="ytdl-a-time-a" value="0:00">
                <div class="ytdl-range-track">
                  <div class="ytdl-range-fill" id="ytdl-a-fill"></div>
                  <input type="range" min="0" max="1000" value="0" step="1" class="ytdl-range-input" id="ytdl-a-start">
                  <input type="range" min="0" max="1000" value="1000" step="1" class="ytdl-range-input" id="ytdl-a-end">
                </div>
                <input type="text" class="ytdl-range-time-input" id="ytdl-a-time-b" value="0:00">
              </div>
              <div class="ytdl-multi-trims-container" id="ytdl-a-multi-trims"></div>
              <label class="ytdl-preview-toggle">
                <input type="checkbox" id="ytdl-a-preview-cb">
                <span class="ytdl-toggle-track"></span>
                <span class="ytdl-preview-label">Previsualizar recortes</span>
              </label>
              <div class="ytdl-chapters-box" id="ytdl-a-chapters-box" style="display:none;">
                <div class="ytdl-chapters-header">
                  <label class="ytdl-preview-toggle" style="margin: 0; padding-left: 0;">
                    <input type="checkbox" id="ytdl-a-chapters-cb">
                    <span class="ytdl-toggle-track"></span>
                    <span class="ytdl-preview-label">Descargar por Capítulos</span>
                  </label>
                </div>
                <div class="ytdl-chapters-select-row" id="ytdl-a-chapters-row" style="display:none; margin-top: 8px;">
                  <select id="ytdl-a-chapters-sel" class="ytdl-select-input"></select>
                  <button class="ytdl-add-trim-btn" id="ytdl-a-add-chapter" title="Seleccionar múltiple (+)">+</button>
                </div>
                <div class="ytdl-multi-trims-container" id="ytdl-a-selected-chapters"></div>
              </div>
            </div>
            <button class="ytdl-dl-btn" id="ytdl-dl-audio">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              Descargar Audio
            </button>
            <button class="ytdl-open-folder-btn" id="ytdl-a-open-folder-btn" style="display:none;">📁 Abrir Carpeta</button>
            <div class="ytdl-progress" id="ytdl-a-progress" style="display:none">
              <div class="ytdl-progress-track"><div class="ytdl-progress-bar" id="ytdl-a-bar"></div></div>
              <span class="ytdl-progress-pct" id="ytdl-a-pct">0%</span>
            </div>
          </div>

          <!-- History Tab -->
          <div class="ytdl-popup-content" data-content="history" id="ytdl-tab-history">
            <div class="ytdl-history-header">
              <span>Historial de Descargas</span>
              <div style="display:flex; gap: 4px;">
                <button id="ytdl-hist-clear" title="Borrar Historial" style="display:flex;align-items:center;justify-content:center;background-color:#e0e0e0;border-radius:4px;border:none;padding:4px;">
                  <img src="${(typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime.getURL('icons/delete.png') : ''}" style="width:16px;height:16px;">
                </button>
                <button id="ytdl-hist-refresh" title="Actualizar">↻</button>
              </div>
            </div>
            <div class="ytdl-history-list" id="ytdl-history-list">
              <div class="ytdl-history-empty">Cargando descargas...</div>
            </div>
          </div>

          <!-- Config Tab -->
          <div class="ytdl-popup-content" data-content="config">
            <div class="ytdl-opt-row">
              <label>Carpeta de descarga</label>
              <input type="text" id="ytdl-out-dir" class="ytdl-text-input" placeholder="%USERPROFILE%\Downloads">
              <small>Dejar vacío para usar Descargas por defecto</small>
            </div>
            <div class="ytdl-opt-row">
              <label>Seleccionar Idioma</label>
              <select id="ytdl-def-lang" class="ytdl-select-input">
                <option value="en">English (Default)</option>
                <option value="es">Español (Spanish)</option>
                <option value="pt">Português (Portuguese)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="it">Italiano (Italian)</option>
                <option value="ru">Русский (Russian)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="zh">中文 (Chinese)</option>
              </select>
            </div>
            <div class="ytdl-opt-row">
              <label>Formato de video por defecto</label>
              <select id="ytdl-def-vfmt" class="ytdl-select-input">
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
                <option value="mkv">MKV</option>
              </select>
            </div>
            <div class="ytdl-opt-row">
              <label>Calidad de video por defecto</label>
              <select id="ytdl-def-vq" class="ytdl-select-input">
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
                <option value="240p">240p</option>
                <option value="144p">144p</option>
              </select>
            </div>
            <div class="ytdl-opt-row">
              <label>Formato de audio por defecto</label>
              <select id="ytdl-def-afmt" class="ytdl-select-input">
                <option value="mp3">MP3</option>
                <option value="m4a">M4A</option>
                <option value="opus">Opus</option>
                <option value="wav">WAV</option>
              </select>
            </div>
            <div class="ytdl-opt-row">
              <label>Calidad de audio por defecto</label>
              <select id="ytdl-def-aq" class="ytdl-select-input">
                <option value="320K">320 kbps</option>
                <option value="192K">192 kbps</option>
                <option value="128K">128 kbps</option>
              </select>
            </div>
            <div class="ytdl-opt-row">
              <label>Habilitar opciones en pestaña Video/Audio</label>
              <div class="ytdl-def-checkboxes">
                <label class="ytdl-checkbox-label">
                  <input type="checkbox" id="ytdl-def-thumb">
                  <span>Descargar miniatura (.JPG)</span>
                </label>
                <label class="ytdl-checkbox-label">
                  <input type="checkbox" id="ytdl-def-sub">
                  <span>Descargar subtítulos (.SRT)</span>
                </label>
                <label class="ytdl-checkbox-label">
                  <input type="checkbox" id="ytdl-def-audio">
                  <span>Pista de audio multi-idioma</span>
                </label>
              </div>
              <div class="ytdl-opt-section-title" id="ytdl-cfg-additional-title">Opciones adicionales</div>
              <div class="ytdl-def-checkboxes">
                <label class="ytdl-checkbox-label">
                  <input type="checkbox" id="ytdl-opt-lufs">
                  <span id="ytdl-lbl-lufs">Normalización de Volumen de Audio (LUFS)</span>
                </label>
                <label class="ytdl-checkbox-label">
                  <input type="checkbox" id="ytdl-opt-gif-export">
                  <span id="ytdl-lbl-gif">Activar exportación como GIF / WebP Animado</span>
                </label>
                <label class="ytdl-checkbox-label">
                  <input type="checkbox" id="ytdl-opt-audio-meta">
                  <span id="ytdl-lbl-meta">Descarga automática de Metadata de Audio</span>
                </label>
              </div>
            </div>
            <button class="ytdl-dl-btn" id="ytdl-save-cfg">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              Guardar
            </button>
            <div class="ytdl-cfg-msg" id="ytdl-cfg-msg"></div>
            <div class="ytdl-version" style="margin-top:16px;font-size:11px;color:#666;text-align:center;">v1.2.0</div>
          </div>
        </div>
      </div>
    `;
    const doc = new DOMParser().parseFromString(htmlStr, "text/html");
    panel.replaceChildren(...doc.body.childNodes);
    return panel;
  },

  // ─── Toggle Panel ───────────────────────────────────────────
  togglePanel() {
    const existing = document.getElementById("ytdl-popup-panel");
    if (existing) {
      existing.classList.remove("ytdl-popup-show");
      setTimeout(() => existing.remove(), 200);
      window.YTDL.state.panelOpen = false;
      window.YTDL.preview.stopPreview();
      return;
    }

    const panel = this.createPanel();
    document.body.appendChild(panel);

    const btn = document.getElementById("ytdl-action-btn");
    if (btn) {
      const rect = btn.getBoundingClientRect();
      panel.style.position = "fixed";
      panel.style.bottom = (window.innerHeight - rect.top + 8) + "px";
      panel.style.left = (rect.left + rect.width / 2 - 170) + "px";
      panel.style.right = "auto";
    }

    requestAnimationFrame(() => panel.classList.add("ytdl-popup-show"));
    window.YTDL.state.panelOpen = true;
    window.YTDL.state.scissorsUnlockedForVideo = true;
    window.YTDL.buttons.injectScissorsButton(true);
    window.YTDL.buttons.applyScissorsToPanel();

    window.YTDL.panelEvents.setupPanelEvents(panel);
    window.YTDL.videoData.loadVideoData();
  }
};
