# YT Media Downloader — Video & Audio Downloader
**Created by [BlaxDEV](https://github.com/BlaxDEV)** · *Version v1.2.1 (Release — YouTube Premium Action Bar Fix, Exact Frame Grabber & Pro Audio Update)*

<p align="center">
  <img src="https://img.shields.io/badge/Version-v1.2.1-ff1744?style=for-the-badge&logo=youtube&logoColor=white" alt="Version v1.2.1" />
  <img src="https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox%20%7C%20Edge-2b2b2b?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Supported Browsers" />
  <img src="https://img.shields.io/badge/Backend-Local%20Port%2019836-107c41?style=for-the-badge" alt="Local Backend" />
  <a href="https://ko-fi.com/blaxdev"><img src="https://img.shields.io/badge/Support-Buy%20me%20a%20Ko--Fi-ff5e5b?style=for-the-badge&logo=kofi&logoColor=white" alt="Ko-Fi" /></a>
</p>

---

## Features

**YT Media Downloader** is a powerful, ad-free, high-performance browser extension designed to give you complete control over your YouTube downloads and precision clips directly from the video player.

- **1080p, 4K & 60FPS Video Downloads**: Automatically merges high-definition video streams and standalone audio tracks without quality loss or watermarks.
- **Precision Trimming Mode & Exact Frame Grabber (`📷 / ✂️`)**: Click the scissors icon or camera button inside the YouTube player controls to mark exact start/end timestamps and capture snapshots.
- **Multi-Trim & Chapter Batching (`+` / `📚`)**: Add up to 10 distinct slices per video or batch-download all YouTube chapters in one click into separate split files.
- **Pro Audio & Animated Export Studio**: Export animated GIF & WebP loops, normalize audio volume with LUFS (`#ytdl-opt-lufs`), embed ID3 tags & cover art, and dynamically toggle audio streams.
- **Interactive History & Real Video Titles**: Real-time progress monitoring, persistent history with real video titles, and a dedicated Clear History button (`🗑️`).
- **Multi-Language Audio, Subtitles & Custom Output**: Select multi-language dubbed audio tracks, closed captions (.srt), and custom download directories across 9 UI languages.
- **Draggable Floating Panel**: Sleek, responsive dark mode popup window (`⋮⋮` grip handle) that can be dragged anywhere across your screen for maximum comfort.
- **Zero Ads, Zero Tracking, Zero Paywalls**: 100% clean experience powered locally on your own machine.

---

## Architecture & Setup (Option A — Hybrid Model)

To guarantee maximum download speeds, bypass rate limits, and cleanly merge 4K video and audio streams, **YT Media Downloader works in tandem with a lightweight local companion server (`YTDownloader.exe` on Windows / `YTDownloader` on Linux)** listening on port `19836`.

### Step 1: Download & Start the Companion Server
#### For Windows (`Setup_YT_Downloader-Win-v1.2.0.exe`)
1. Go to the [**Releases Tab**](../../releases) of this GitHub repository.
2. Download `Setup_YT_Downloader-Win-v1.2.0.exe`.
3. Run the installer to start the local backend (`YTDownloader.exe` on port `19836`).

> **Note about Windows SmartScreen:**  
> Since our companion server is free, open, and distributed independently without a commercial corporate code-signing certificate, Windows Defender SmartScreen might show a blue warning saying *"Windows protected your PC"*.  
> **How to proceed safely:** Click **"More info"** and then **"Run anyway"**. The software is 100% safe, clean, and communicates strictly on your local loopback address (`127.0.0.1:19836`).

#### For Linux (`Setup_YT_Downloader-Linux-v1.2.0.tar.gz`)
1. Download `Setup_YT_Downloader-Linux-v1.2.0.tar.gz` from the [**Releases Tab**](../../releases).
2. Extract the archive and run the automated installation script:
   ```bash
   tar -xzf Setup_YT_Downloader-Linux-v1.2.0.tar.gz
   cd Setup_YT_Downloader-Linux-v1.2.0
   ./install.sh
   ```
   *This automatically installs the standalone companion binary (`YTDownloader`) to `~/.local/bin/` and registers a **systemd user service** (`yt-downloader.service`) so that the local backend runs continuously and silently in the background on port `19836`.*

### Step 2: Install the Browser Extension
> **v1.2.0 Bugfix & Browser Compatibility Notice:** Manifest V3 strictly enforces `"service_worker"` on Chrome/Edge (rejecting `"scripts"`), while Firefox strictly requires `"scripts"` (warning on `"service_worker"`). In `v1.2.0`, we separate the build targets into dedicated packages for each browser engine (`manifest.json` for Chrome and `manifest.firefox.json` for Firefox) to eliminate all manifest validation warnings and errors (`background.scripts requires manifest version of 2 or lower` on Chrome and `unsupported service_worker` on Firefox).

- **Chrome / Edge / Brave (Unpacked Mode):**
  1. Download `YT-Media-Downloader-Extension-Chrome-v1.2.0.zip` from the [Releases](../../releases) tab and extract it.
  2. Open `chrome://extensions` in your browser.
  3. Enable **Developer mode** in the top right corner.
  4. Click **Load unpacked** and select the extracted folder.
- **Firefox (AMO / Add-on / Temporary Add-on):**
  1. Install directly from the Mozilla Add-ons store (`addons.mozilla.org`), or download `YT-Media-Downloader-Extension-Firefox-v1.2.0.zip` and load via `about:debugging`.

### Step 3: Enjoy on YouTube!
Open any YouTube video or Short. You will see the new **Download** button directly inside the native YouTube action bar right before the overflow menu (`...`). Click it to open the floating panel or use the scissors icon to trim clips.

---

## Building from Source (For Developers)

This repository is completely open-source and transparent. You can easily compile both the browser extension and the Windows companion server installer directly from the source scripts included in this repository.

### Prerequisites
- **Python 3.10+** (with `pip installed`)
- **PyInstaller**: `pip install pyinstaller`
- **Inno Setup 6+** (to compile the Windows `.exe` installer)
- **PowerShell 5.1+** (included natively in Windows)

### 1. Build the Companion Server
#### For Windows (`Setup_YT_Downloader.exe`)
The local backend service for Windows is driven by `scripts/ytdl_host.py` alongside local video processing tools.
1. Place the required binaries (`ffmpeg.exe`, `ffprobe.exe`, `yt-dlp.exe`) inside the `tools/` directory.
2. Run the automated PowerShell build script from the root of the repository:
   ```powershell
   .\scripts\build_installer.ps1
   ```
   *This script automatically compiles `ytdl_host.py` into a standalone native Windows binary (`native-host/YTDownloader.exe`) using `PyInstaller`, embeds version metadata (`scripts/version_info.txt`), and then invokes `Inno Setup` (`scripts/installer.iss`) to package the complete standalone installer `Setup_YT_Downloader.exe`.*

#### For Linux (`Setup_YT_Downloader-Linux.tar.gz`)
The native Linux companion server environment is completely isolated inside the `linux-host/` directory.
1. Ensure `python3` and `pyinstaller` (`pip install --user pyinstaller`) are installed on your Linux build machine.
2. Run the automated bash build script inside the `linux-host/` directory:
   ```bash
   cd linux-host
   ./build_linux.sh
   ```
   *This script compiles `ytdl_host.py` into a standalone POSIX ELF binary (`YTDownloader`) using `PyInstaller --onefile`, packages it alongside `install_linux.sh` and the `systemd` user service unit (`yt-downloader.service`), and creates the final release archive (`release-linux/Setup_YT_Downloader-Linux-v1.2.0.tar.gz`).*

### 2. Build the WebExtension ZIP
To package the clean browser extension into POSIX-compliant archives (`YT-Media-Downloader-Extension-Chrome-v1.2.0.zip` and `YT-Media-Downloader-Extension-Firefox-v1.2.0.zip`) ready for Chrome Web Store and Mozilla Add-ons without browser-specific warnings:
```powershell
python scripts/pack_extension.py
```
*The packaging script (`scripts/pack_extension.py`) guarantees strict UNIX forward-slash entry headers (`create_system = 3`), automatically swaps `manifest.firefox.json` for Firefox builds, and enforces official release naming rules:*
- `Setup_YT_Downloader-Linux-<version>.tar.gz`
- `Setup_YT_Downloader-Win-<version>.exe` (or `.tar.gz`)
- `YT-Media-Downloader-Extension-Chrome-<version>.zip`
- `YT-Media-Downloader-Extension-Firefox-<version>.zip`

---

## Frequently Asked Questions (FAQ)

#### Server disconnected or not responding
- **Solution:** Ensure `YTDownloader.exe` (on Windows) or the `yt-downloader.service` systemd service (on Linux: check with `systemctl --user status yt-downloader.service`) is running on your PC and listening on port `19836`. Check your antivirus or firewall settings if the local loopback connection is blocked.

#### Rate limit errors during heavy downloads
- **Solution:** If you download dozens of videos in rapid succession, YouTube may temporarily throttle requests. Wait a few minutes or switch to a different quality setting.

#### Download button not appearing on YouTube
- **Solution:** Refresh the YouTube page (`F5`). Check that the extension is enabled in your browser's extension manager.

---

## License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.

---

## Support BlaxDEV

If **YT Media Downloader** saves you time and enhances your workflow, consider supporting its ongoing development and ad-free maintenance!

[![Buy Me A Coffee](https://img.shields.io/badge/Support%20BlaxDEV-Buy%20Me%20A%20Ko--Fi-ff5e5b?style=for-the-badge&logo=kofi&logoColor=white)](https://ko-fi.com/blaxdev)

---
*Created by BlaxDEV — Video & Audio Downloader Pro v1.2.0*
