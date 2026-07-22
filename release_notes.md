# YT Media Downloader v1.2.2

## 🚀 Bugfix & Release Notes (v1.2.2)

### 🐛 Hotfix & Firefox / Zen Compatibility Updates
- **Firefox & Zen Browser Icon Fix (`web_accessible_resources`)**: Added missing `web_accessible_resources` declaration in `manifest.firefox.json` allowing content scripts to render extension icons (`audio.png`, `no-audio.png`, `delete.png`) without browser CORS / CSP security blocks.
- **Global Version Synchronization**: Synchronized version number `v1.2.2` across `manifest.json`, `manifest.firefox.json`, Extension Popup (`popup.html`), Welcome Page (`welcome.html`), YouTube injected Panel (`panel.js`), Python helper scripts, Windows Installer, and Linux build manifests.

---

## 🚀 Key Features from v1.2.0

### 🎥 Video & Frame Capture
- **Exact Frame Grabber (`📷`)**: Capture high-res native frame snapshots directly from the YouTube player.
- **Multi-Trim System (`+`)**: Add up to 10 distinct slices per video with live real-time timestamp editing (`✏️`) and timeline visualizers.
- **Live Trim Preview**: Preview exact trimmed sections before initiating download.

### 📚 Chapter Batching
- **Chapter Selector**: Download specific video chapters from YouTube's native chapter markers.
- **Batch All Chapters (`📚`)**: Select "Descargar todos los capítulos" to automatically add all video chapters to the trim queue in one click.

### 🎧 Pro Audio & Animated Export Studio
- **GIF & WebP Animated Export**: Export clips directly into animated GIF or WebP loops.
- **LUFS Volume Normalization**: Option to normalize audio volume seamlessly.
- **ID3 Tags & Cover Art**: Automatic embedding of metadata and cover art thumbnails in audio files.
- **Dynamic Audio Toggle**: UI button dynamically switches icons (`audio.png` vs `no-audio.png`) depending on toggle state.

### 🗂️ History & Management
- **Persistent History**: Stores last 50 downloads with pagination.
- **Real YouTube Video Titles**: Displays actual video titles instead of generic placeholders.
- **Clear History Button (`🗑️`)**: Dedicated button to clear download history.
