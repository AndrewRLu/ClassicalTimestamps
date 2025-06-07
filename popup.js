// make option button a cog
document.querySelector('#options-button').addEventListener('click', function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});





async function requestVideoTitle() {
  //retrive video title from content script
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  // console.log(tab);
  const response = await chrome.tabs.sendMessage(tab.id, {message: "getVideoID"});
  // do something with response here, not outside the function
  console.log(`retrieved title: ${response.reply}`);
  return response.reply;
}

async function setVideoTitle(){
  const title = await requestVideoTitle();
  document.getElementById("burgers").textContent = title;
  console.log("done setting");
}

/////////////////

let videoTitle = "";
// const curURL = window.location.href;
// console.log(curURL);
// const URLTemplate = /(?:https:\/\/www.youtube.com\/watch)/;

// if(URLTemplate.test(curURL)){
// }

videoTitle = requestVideoTitle();
if(videoTitle != ""){
  document.addEventListener("DOMContentLoaded", () => {
    setVideoTitle();
  });
}



