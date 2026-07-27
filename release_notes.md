# YT Media Downloader v1.2.3

## 🚀 Bugfix & Release Notes (v1.2.3)

### 🐛 Hotfix & Firefox / Zen Compatibility Updates
- **Firefox & Zen Browser Icon Fix (`web_accessible_resources`)**: Added missing `web_accessible_resources` declaration in `manifest.firefox.json` allowing content scripts to render extension icons (`audio.png`, `no-audio.png`, `delete.png`) without browser CORS / CSP security blocks.
- **Global Version Synchronization (v1.2.3)**: Synchronized version number `v1.2.3` across `manifest.json`, `manifest.firefox.json`, Extension Popup (`popup.html`), Welcome Page (`welcome.html`), YouTube injected Panel (`panel.js`), Python helper scripts, Windows Installer, and Linux build manifests.
- **Companion Server `TOOLS_DIR` Resolution & Null I/O Fix**: Enhanced multi-level parent path resolution for `tools/` binaries (`yt-dlp`, `ffmpeg`, `ffprobe`) in `ytdl_host.py` to eliminate `HTTP 500` errors on `/info` endpoints during local development and cross-platform execution. Redirected null I/O streams (`sys.stdout`/`sys.stderr`) when built with PyInstaller `--noconsole` to prevent silent startup crashes.
- **Windows & Linux Installer Output strictly in `Output/`**: Synchronized `/history` endpoint in the companion server binary, resolved background process file locks, and configured installer build output strictly to `Output/Setup_YT_Downloader-Win-v1.2.3.exe` and `Output/Setup_YT_Downloader-Linux-v1.2.3.tar.gz`.
- **Multi-Language i18n for Cut & Edit Labels**: Added comprehensive translation keys (`trimCutPrefix`, `trimEditBtn`, `trimEditingBtn`, `trimEditTitle`, `trimDeleteTitle`) across all 9 supported languages (`en`, `es`, `pt`, `fr`, `de`, `it`, `ru`, `ja`, `zh`) so multi-trim queue slice rows render dynamically in the user's selected language.
- **Scissors & Trim Slice Editing Bugfix**: Fixed state machine transition in `sliders.js` and `buttons.js` when editing an active cut slice (`editingTrimIndex`). Selecting or re-marking Point A/B with the scissors tool now dynamically updates the selected slice's start/end timestamps and timeline overlay without resetting values to `00:00 - 00:00`.
- **Welcome Page Modernization**: Updated `welcome.html` and step 6 translations across all languages from outdated "Onion Skinning" terminology to "Multi-Trim Queue (+)".

