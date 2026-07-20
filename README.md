# YT Media Downloader — Video & Audio Downloader Pro
**Created by [BlaxDEV](https://github.com/BlaxDEV)** · *Version v1.1.5 (Release)*

<p align="center">
  <img src="https://img.shields.io/badge/Version-v1.1.5-3ea6ff?style=for-the-badge&logo=youtube&logoColor=white" alt="Version v1.1.5" />
  <img src="https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox%20%7C%20Edge-2b2b2b?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Supported Browsers" />
  <img src="https://img.shields.io/badge/Backend-Local%20Port%2019836-107c41?style=for-the-badge" alt="Local Backend" />
  <a href="https://ko-fi.com/blaxdev"><img src="https://img.shields.io/badge/Support-Buy%20me%20a%20Ko--Fi-ff5e5b?style=for-the-badge&logo=kofi&logoColor=white" alt="Ko-Fi" /></a>
</p>

---

## Features

**YT Media Downloader** is a powerful, ad-free, high-performance browser extension designed to give you complete control over your YouTube downloads and precision clips directly from the video player.

- **1080p, 4K & 60FPS Video Downloads**: Automatically merges high-definition video streams and standalone audio tracks without quality loss or watermarks.
- **Precision Trimming Mode**: Click the scissors icon right inside the YouTube player controls to mark exact start (**Point A**) and end (**Point B**) timestamps and export customized clips instantly.
- **Multi-Language Audio & Subtitles (.srt)**: Select and download multi-language dubbed audio tracks and exact closed captions effortlessly.
- **Thumbnail Grabber (.jpg)**: Download crystal-clear video cover thumbnails with a single checkbox.
- **Draggable Floating Panel**: Sleek, responsive dark mode popup window (`⋮⋮` grip handle) that can be dragged anywhere across your screen for maximum comfort.
- **Zero Ads, Zero Tracking, Zero Paywalls**: 100% clean experience powered locally on your own machine.

---

## Architecture & Setup (Option A — Hybrid Model)

To guarantee maximum download speeds, bypass rate limits, and cleanly merge 4K video and audio streams, **YT Media Downloader works in tandem with a lightweight local companion server (`YTDownloader.exe`)** running on Windows (port `19836`).

### Step 1: Download the Companion Server (`Setup_YT_Downloader.exe`)
1. Go to the [**Releases Tab**](../../releases) of this GitHub repository.
2. Download `Setup_YT_Downloader.exe`.
3. Run the installer to start the local backend (`YTDownloader.exe` on port `19836`).

> **Note about Windows SmartScreen:**  
> Since our companion server is free, open, and distributed independently without a commercial corporate code-signing certificate, Windows Defender SmartScreen might show a blue warning saying *"Windows protected your PC"*.  
> **How to proceed safely:** Click **"More info"** and then **"Run anyway"**. The software is 100% safe, clean, and communicates strictly on your local loopback address (`127.0.0.1:19836`).

### Step 2: Install the Browser Extension
- **Chrome / Edge / Brave (Unpacked Mode):**
  1. Download `YT-Downloader-Extension.zip` from the [Releases](../../releases) tab and extract it.
  2. Open `chrome://extensions` in your browser.
  3. Enable **Developer mode** in the top right corner.
  4. Click **Load unpacked** and select the `YT-Downloader-Extension` folder.
- **Firefox (AMO / Add-on):**
  1. Install directly from the Mozilla Add-ons store (`addons.mozilla.org`) or load as a temporary extension via `about:debugging`.

### Step 3: Enjoy on YouTube!
Open any YouTube video or Short. You will see the new **Download** button directly inside the native YouTube action bar right before the overflow menu (`...`). Click it to open the floating panel or use the scissors icon to trim clips.

---

## Frequently Asked Questions (FAQ)

#### Server disconnected or not responding
- **Solution:** Ensure `YTDownloader.exe` is running on your PC and listening on port `19836`. Check your antivirus or firewall settings if the local connection is blocked.

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
*Created by BlaxDEV — Video & Audio Downloader Pro v1.1.5*
