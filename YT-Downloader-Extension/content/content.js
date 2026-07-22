/*
 * Content Script Entry Point - YT Media Downloader Extension
 * 
 * This file serves as the main entry point for the content script.
 * All modules are loaded via manifest.json in the correct order.
 * The observer.js module handles initialization automatically.
 *
 * Module Structure:
 * - core.js: Constants, state, utilities
 * - icons.js: SVG icon strings
 * - buttons.js: Action bar, download button, scissors tool
 * - panel.js: Panel HTML creation
 * - panel-events.js: Panel logic and event wiring
 * - panel-i18n.js: Translations and option visibilities
 * - sliders.js: Trim sliders and size display
 * - preview.js: Preview trim and progress overlay
 * - history.js: History tab rendering
 * - video-data.js: Video data loading and quality rendering
 * - download.js: Download execution and progress polling
 * - observer.js: SPA navigation observer and initialization
 */

// All functionality is exposed via the window.YTDL namespace.
// See observer.js for the initialization logic.
