// make option button a cog
document.querySelector('#options-button').addEventListener('click', function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});

// make buttons for parts work, id will be seconds
document.querySelector('.part-container').addEventListener('click', (event) => {
  console.log("i cliekd buttoned");
  console.log(event.target.id);
  // id is time in seconds
  requestSeek(event.target.id);
});

async function requestSeek(time){
  console.log(`requested w ${time}`);
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  chrome.tabs.sendMessage(tab.id, {message: "seek", seconds: time});
}

async function requestInfo() {
  //retrive video title from content script
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  // console.log(tab);
  const response = await chrome.tabs.sendMessage(tab.id, {message: "getInfo"});
  // do something with response here, not outside the function
  console.log(`retrieved: ${response.currentVideoTitle}, ${response.timestamps}, ${response.timestampsSeconds}, ${response.url}`);
  return response;
}

function createButtons(timestamps, timestampsSeconds){
  let length = timestampsSeconds.length;
  const container = document.getElementsByClassName("part-container")[0];
  for(let i = 0; i<length; i++){
    const mvt = integerToRoman(i+1);
    const timestamp = timestamps[i];
    const timestampS = timestampsSeconds[i];
    const btn = document.createElement("button");
    btn.textContent = `${mvt} (${timestamp})`;
    btn.setAttribute('class', "part");
    btn.setAttribute('id', `${timestampS}`);
    container.appendChild(btn);
  }
}

async function setVideoTitle(videoTitle){
  document.getElementById("title").textContent = videoTitle;
  console.log("done setting");
}

function integerToRoman(num) {
  const romanValues = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1
  };
  let roman = '';
  for (let key in romanValues) {
    while (num >= romanValues[key]) {
      roman += key;
      num -= romanValues[key];
    }
  }
  return roman;
}


/////////////////
// const curURL = window.location.href;
// console.log(curURL);
// const URLTemplate = /(?:https:\/\/www.youtube.com\/watch)/;

// if(URLTemplate.test(curURL)){
// }

//get all info needed


// get info then create buttons
requestInfo().then(
  function(res){
    const retrievedInfo = res;
    console.log(retrievedInfo);
    const videoTitle = retrievedInfo.title;
    const timestamps = retrievedInfo.timestamps;
    const timestampsSeconds = retrievedInfo.timestampsSeconds;
    const url = retrievedInfo.url;
    console.log("got");
    createButtons(timestamps, timestampsSeconds);
    setVideoTitle(videoTitle);
  }
)


// if(videoTitle != ""){
//   document.addEventListener("DOMContentLoaded", () => {
//     setVideoTitle();
    
//   });
// }



