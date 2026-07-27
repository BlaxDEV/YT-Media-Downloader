# YT Media Downloader v1.2.2

## 🚀 Bugfix & Release Notes (v1.2.2)

### 🐛 Hotfix & Firefox / Zen Compatibility Updates
- **Firefox & Zen Browser Icon Fix (`web_accessible_resources`)**: Added missing `web_accessible_resources` declaration in `manifest.firefox.json` allowing content scripts to render extension icons (`audio.png`, `no-audio.png`, `delete.png`) without browser CORS / CSP security blocks.
- **Global Version Synchronization**: Synchronized version number `v1.2.2` across `manifest.json`, `manifest.firefox.json`, Extension Popup (`popup.html`), Welcome Page (`welcome.html`), YouTube injected Panel (`panel.js`), Python helper scripts, Windows Installer, and Linux build manifests.
- **Companion Server `TOOLS_DIR` Resolution & Null I/O Fix**: Enhanced multi-level parent path resolution for `tools/` binaries (`yt-dlp`, `ffmpeg`, `ffprobe`) in `ytdl_host.py` to eliminate `HTTP 500` errors on `/info` endpoints during local development and cross-platform execution. Redirected null I/O streams (`sys.stdout`/`sys.stderr`) when built with PyInstaller `--noconsole` to prevent silent startup crashes.
- **Windows Installer Output & `/history` Endpoint Sync**: Synchronized `/history` endpoint in the companion server binary, resolved background process file locks, and configured installer build output strictly to `Output/Setup_YT_Downloader-Win-v1.2.2.exe`.

