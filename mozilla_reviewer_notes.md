# Notes for Mozilla AMO Reviewers — YT Media Downloader v1.2.7

Dear Mozilla Add-ons Review Team,

Thank you for reviewing **YT Media Downloader (Extension v1.2.7)**. Below is an overview of the add-on's purpose, architecture, permissions rationale, security architecture, and step-by-step testing instructions.

---

## 1. Extension Overview & Functionality

**YT Media Downloader** is an open-source browser extension designed to download YouTube videos, Shorts, and standalone audio tracks in resolutions up to 1080p, 4K, and 60fps.

Key user-facing features in v1.2.7 include:
- **Direct OS Folder Picker ("Save As"):** Clicking the Download button invokes the native OS file manager folder selector (`/select_folder`) directly.
- **Chapter Selection Modal Overlay:** A popup modal allowing users to select/deselect specific chapters with `Select All` and `Deselect All` controls.
- **Precision Trimming & Player Indicators:** Scissors mode for setting Point A / Point B trim timestamps, with center-screen player badges ("A", "B", ♻️ Loop).
- **Multi-language Support:** Full i18n support across 9 languages (EN, ES, PT, FR, DE, IT, RU, JA, ZH).

---

## 2. Architecture & Companion Server Connection

Due to browser sandbox limitations regarding heavy video processing (FFmpeg muxing, 4K video merging, multi-format audio conversion), the extension connects to a local companion Python server (`ytdl_host.py`).

- **Communication Mechanism:** HTTP POST requests over loopback interface `http://127.0.0.1:19836`.
- **Local Server Source Code:** The companion server source (`ytdl_host.py`) is completely open-source and included in the release repository under `linux-host/ytdl_host.py` and `YT-Downloader-Extension/linux-host/ytdl_host.py`.

---

## 3. Permissions Rationale

- **`activeTab`**: Allows the extension content script to detect the active YouTube video URL and page context when the user opens YouTube.
- **`cookies` & `*://*.youtube.com/*`**: Needed exclusively to pass active player cookies (`VISITOR_INFO1_LIVE`, `YSC`, `PREF`, `LOGIN_INFO`) to the local companion server so `yt-dlp` can bypass YouTube throttling and fetch 1080p/4K formats smoothly.

---

## 4. 🔒 Critical Security & Privacy Safeguards (v1.2.7 Upgrade)

1. **Master Account Credentials Discarded (Account Protection):**
   - All master session and authentication keys (`SID`, `HSID`, `SSID`, `APISID`, `SAPISID`, `ACCOUNT_CHOOSER`, `OSID`, `__Secure-1PSID`, `__Secure-3PSID`, `__Secure-1PAPISID`, `__Secure-3PAPISID`, `__Secure-1PSIDTS`, `__Secure-3PSIDTS`, `__Secure-1PSIDCC`, `__Secure-3PSIDCC`) are explicitly blacklisted in `background.js` (`DISCARD_COOKIES`) and **NEVER** transmitted to the local server or stored anywhere.

2. **Zero-Disk Memory Processing:**
   - Active cookies sent to `ytdl_host.py` are processed **exclusively in RAM** via an in-memory stream buffer. No cookie files are stored on disk.
   - Any temporary engine cookie files created during execution are immediately deleted with 0-byte overwrites upon job completion.

3. **Automatic Legacy File Purge:**
   - Upon startup, `ytdl_host.py` automatically scans and purges any legacy plaintext cookie files (`.yt_cookies.txt`, `cookies.txt`).

---

## 5. Source Code & Code Transparency

- **No Obfuscation:** All JavaScript code across the extension (`background.js`, `content/*.js`, `popup/*.js`, `welcome/*.js`, `i18n.js`) is 100% unminified, plain, human-readable source code.
- **No Third-Party Remote Code:** The extension does not load any external scripts, remote trackers, or dynamic code execution (`eval`).

---

## 6. How to Test the Add-on

1. **Load Extension in Firefox:**
   - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
   - Click **Load Temporary Add-on...** and select `manifest.firefox.json` or `YT-Media-Downloader-Extension-Firefox-v1.2.7.zip`.

2. **Run Local Companion Server:**
   - **Windows:** Run `Setup_YT_Downloader-Win-v1.2.7.exe` or execute `python YT-Downloader-Extension/linux-host/ytdl_host.py`.
   - **Linux:** Extract `Setup_YT_Downloader-Linux-v1.2.7.tar.gz` and run `./install.sh` or execute `python3 ytdl_host.py`.

3. **Verify Download Flow:**
   - Open any YouTube video (e.g. `https://www.youtube.com/watch?v=...`).
   - Observe the red **Download** button inserted under the video player action bar.
   - Click **Download Video**. The native OS folder selector dialog will prompt you to choose a destination folder.
   - Click **Select Folder**. The download completes cleanly.

---

Should you have any questions or require additional details, please feel free to reach out.

Best regards,  
**BlaxDEV** (Developer of YT Media Downloader)
