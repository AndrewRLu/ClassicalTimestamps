chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openSavedTimestamps") {
    chrome.tabs.create({url: chrome.runtime.getURL('saved_timestamps.html')});
  }
});