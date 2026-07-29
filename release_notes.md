# YT Media Downloader — Release v1.2.7

> ⚠️ **IMPORTANT SECURITY UPDATE**: Beyond new UI features and aesthetic enhancements, this release contains a **critical security and privacy upgrade**. Users are strongly encouraged to update their Companion Server and Extension to v1.2.7.

---

## 🔒 Security & Privacy Upgrades (Companion Server)
- **Zero-Disk Memory Processing**: Active YouTube player cookies are processed 100% in RAM via memory streams. No cookie files are written to disk.
- **Account Protection**: Master session keys (`SID`, `HSID`, `SSID`, `APISID`, `SAPISID`, `__Secure-*`) are strictly discarded and never transmitted or saved.
- **Automatic Legacy File Purge**: On startup, `ytdl_host.py` scans and purges any legacy plaintext cookie files (`.yt_cookies.txt`, `cookies.txt`).

---

## 🚀 New Features & Enhancements

### 🖥️ Companion Server (`ytdl_host.py`)
- **Native OS Folder Picker (`/select_folder`)**: Directly prompts the native Windows/Linux directory selection dialog initialized to the last chosen folder.
- **Engine Update**: Updated `yt-dlp` dependencies for smooth 1080p, 4K, and 60fps format parsing.

### 🎨 Extension UI & Features
- **Direct "Save As..." Workflow**: Clicking Download Video or Download Audio automatically opens the native OS folder picker.
- **Chapter Selection Modal Overlay**: Replaced old sliders/dropdowns with a popup modal (`[ 📑 Select Chapters ]`) featuring `Select All` / `Deselect All` buttons and dynamic count badge.
- **YouTube Player Indicators**: Animated center-screen badges ("A", "B", and ♻️ Loop arrows) during trimming and looping.
- **Changelog Page**: Extension update notification page (`changelog.html`) summarizing changes across the extension and server.
- **Multi-language Support**: Full i18n support across 9 supported languages (EN, ES, PT, FR, DE, IT, RU, JA, ZH).

---

## 📦 Assets Attached
- `Setup_YT_Downloader-Win-v1.2.7.exe` *(Windows Companion Installer)*
- `Setup_YT_Downloader-Linux-v1.2.7.tar.gz` *(Linux Companion Release Package)*
- `YT-Media-Downloader-Extension-Chrome-v1.2.7.zip` *(Chrome Extension Package)*
- `YT-Media-Downloader-Extension-Firefox-v1.2.7.zip` *(Firefox Extension Package)*
