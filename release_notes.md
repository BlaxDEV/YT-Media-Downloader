# YT Media Downloader v1.2.5

## Bug Fixes
- **Trim & Cut Editing Specificity** — Fixed an issue where manual slider movements or input typing during cut editing would trigger `resetScissorsTool()` prematurely. This was resetting the active trim mode, stopping the preview, and discarding active selection properties. Adjusting the ranges is now precise and specific.
- **YouTube Progress Bar Overlay Visibility** — Rewrote the overlay engine in `preview.js` with `refreshOverlay()` to dynamically create and update boundaries, slices, and highlights on the player progress bar. The slices and active boundaries are now drawn with their correct colors even when preview mode is disabled.
- **Scissors Position Markers** — Added custom scissor markers ("A" and "B" icons) on the progress bar to clearly mark the selected start and end boundaries on the timeline.
- **Listener Leak Prevention** — Replaced anonymous wrapper functions on the YouTube video element `timeupdate` event with a single bound reference to prevent memory and performance leaks during active preview switching.
