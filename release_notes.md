# YT Media Downloader v1.2.5

## Bug Fixes
- **Trim & Cut Editing Specificity** — Fixed an issue where manual slider movements or input typing during cut editing would trigger `resetScissorsTool()` prematurely. This was resetting the active trim mode, stopping the preview, and discarding active selection properties. Adjusting the ranges is now precise and specific.
- **Individual Cut Previews (No Onion Skinning)** — Completely removed the layered "onion skin" slices (`ytdl-ov-slice`) to avoid visual clutter. The player progress timeline now renders only the active, individual selection (either the one being actively made or the active edit segment) with its corresponding brand color, dimming highlights, and markers.
- **Scissors Position Markers** — Added custom scissor markers ("A" and "B" icons) on the progress bar to clearly mark the selected start and end boundaries on the timeline.
- **Listener Leak Prevention** — Replaced anonymous wrapper functions on the YouTube video element `timeupdate` event with a single bound reference to prevent memory and performance leaks during active preview switching.
