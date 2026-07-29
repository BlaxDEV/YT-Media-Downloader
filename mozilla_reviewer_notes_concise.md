# Information for Mozilla AMO Reviewers — YT Media Downloader v1.2.7

### 1. Add-on Purpose & Companion Server
YT Media Downloader downloads YouTube videos, Shorts, and audio (up to 4K/60fps). Due to browser sandbox limits for video encoding, it connects to a local companion Python server (`ytdl_host.py`) running on `http://127.0.0.1:19836`.

### 2. Permission Rationale
- `activeTab`: Used to capture the active YouTube video URL when the panel opens.
- `cookies` (`*://*.youtube.com/*`): Used exclusively to fetch non-sensitive player session cookies (`VISITOR_INFO1_LIVE`, `YSC`, `PREF`, `LOGIN_INFO`) so `yt-dlp` can bypass 1080p/4K playback throttling.

### 3. 🔒 Critical Security & Privacy Safeguards
- **Master Account Keys Discarded:** Sensitive login tokens (`SID`, `HSID`, `SSID`, `APISID`, `SAPISID`, `__Secure-*`) are explicitly blacklisted in `background.js` and NEVER transmitted or stored.
- **Zero-Disk RAM Cookies:** Cookies are processed 100% in RAM memory streams with zero disk persistence.
- **Legacy File Purge:** Obsolete cookie files (`.yt_cookies.txt`, `cookies.txt`) are automatically deleted on host startup.

### 4. Source Code & Security Compliance
- 100% unminified, plain JavaScript (no obfuscation, no remote script execution).
- Source code for the companion host is included under `linux-host/ytdl_host.py`.

### 5. Quick Testing Steps
1. Load add-on in `about:debugging` (`manifest.firefox.json` or ZIP).
2. Run companion server: `python YT-Downloader-Extension/linux-host/ytdl_host.py` (or execute `Setup_YT_Downloader-Win-v1.2.7.exe` / `./install.sh`).
3. Open any YouTube video, click the red **Download** button, choose a destination folder in the native OS picker dialog, and confirm download.
