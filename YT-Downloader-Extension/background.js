/*
 * Background Service Worker / Script - YT Media Downloader Extension
 * Handles onInstalled welcome tab opening.
 */

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browserAPI.tabs.create({
      url: browserAPI.runtime.getURL("welcome/welcome.html")
    });
  }
});
