# YT Media Downloader v1.2.4

## Bug Fixes
- **Download button crash** — Fixed `ReferenceError: prefix is not defined` in `download.js` that prevented all downloads from starting.
- **"Open Folder" button not working** — Implemented missing `/open_folder` POST endpoint in the companion server.
- **Always downloading at 360p** — Removed hardcoded `player_client=android,web` extractor arg from download commands that restricted DASH formats to 360p only. The extension now sends the selected resolution (e.g. `1080p`) and the server builds the correct `-f "bestvideo[height<=1080]+bestaudio"` specifier.
- **CMD windows popping up** — Added `CREATE_NO_WINDOW` flag to all subprocess calls on Windows to suppress console windows.

## Improvements
- **YouTube cookie authentication** — The companion server now auto-detects browser cookies (Chrome, Edge, Firefox, Brave) to authenticate with YouTube, bypassing bot detection and enabling all video qualities (1080p, 720p, 480p, etc.).
- **Installer forces browser close** — The Windows installer now requires closing all browsers before installation to export YouTube cookies automatically during setup.
- **Quality grid always complete** — The resolution grid (1080p–144p) now always renders all options even when yt-dlp doesn't return explicit formats for each resolution.
