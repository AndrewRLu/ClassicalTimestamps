chrome.commands.onCommand.addListener((command) => {
  console.log(`Command: ${command}`);
  chrome.action.openPopup();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openSavedTimestamps") {
    chrome.tabs.create({url: chrome.runtime.getURL('saved_timestamps.html')});
  }
});