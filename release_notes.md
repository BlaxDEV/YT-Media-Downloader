# YT Media Downloader v1.2.2

## 🚀 Bugfix & Release Notes (v1.2.2)

### 🐛 Hotfix & Firefox / Zen Compatibility Updates
- **Firefox & Zen Browser Icon Fix (`web_accessible_resources`)**: Added missing `web_accessible_resources` declaration in `manifest.firefox.json` allowing content scripts to render extension icons (`audio.png`, `no-audio.png`, `delete.png`) without browser CORS / CSP security blocks.
- **Global Version Synchronization**: Synchronized version number `v1.2.2` across `manifest.json`, `manifest.firefox.json`, Extension Popup (`popup.html`), Welcome Page (`welcome.html`), YouTube injected Panel (`panel.js`), Python helper scripts, Windows Installer, and Linux build manifests.

