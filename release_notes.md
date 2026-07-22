# YT Media Downloader v1.2.1

## 🚀 Bugfix & Release Notes (v1.2.1)

### 🐛 Hotfix & Compatibility Updates
- **YouTube Premium Action Bar Fix**: Resolved button injection failure caused by ReferenceError in `injectDownloadButton()` and added support for YouTube Premium metadata layouts (`ytd-watch-metadata #top-level-buttons-computed`).
- **Manifest V3 Specification**: Updated version tags to `v1.2.1` across Chrome (`manifest.json`) and Firefox (`manifest.firefox.json`) builds for immediate Web Store & AMO submission.

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
