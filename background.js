/*
 * Background Service Worker / Script - YT Media Downloader Extension
 * Handles onInstalled welcome tab opening.
 */

const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome/welcome.html")
    });
  }
});
