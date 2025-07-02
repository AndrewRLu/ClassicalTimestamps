function getTimestampsFromComment(comment){
  // get timestamp(s) from single comment
  const timestampTemplate = /\b(?:[0-5]?\d:[0-5]\d(?::[0-5]\d)?)\b/g;
  const timestamps = comment.match(timestampTemplate) || []; 
  return timestamps;
}

function timeToSeconds(str) {
  str = String(str);
  let list = str.split(':');
  let total = 0, m = 1;

  while (list.length > 0) {
  total += m * parseInt(list.pop(), 10);
  m *= 60;
  }

  return total;
}

function timestampsToSeconds(timestamps){
  const converted = []; 
  for(const timestamp of timestamps){
    converted.push(String(timeToSeconds(timestamp)));
  }
  return converted;
}

//////////////////////////////////////////////////////

// make option button a cog
document.querySelector('#options-button').addEventListener('click', function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});

// saved timestamps button
document.querySelector('#saved-timestamps-button').addEventListener('click', function() {
    window.open(chrome.runtime.getURL('saved_timestamps.html'));
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
  //timestamps buttons
  let length = timestampsSeconds.length;
  const container = document.getElementsByClassName("part-container")[0];
  container.innerHTML=""; //clear container
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

// redirect to saved timestamps
// document.querySelector('.saved-timestamps').addEventListener('click', function() {
//     window.open(chrome.runtime.getURL('saved_timestamps.html'));
// });

function temp(){
  console.log("submitted");
  window.open(chrome.runtime.getURL('saved_timestamps.html'));
  // chrome.runtime.sendMessage({action: "openSavedTimestamps"});
}

///////////
//open form
// document.querySelector('#manual-button').addEventListener('click', function() {
//     document.getElementById('manual-button').innerHTML = "";
//     createForm();
// });

//close form
// document.querySelector('#cancelButton').addEventListener('click', function() {
//   console.log("cancel hit");
//   const container = document.getElementById('manual-button');

//   const btn = document.createElement("a");
//   btn.textContent = "Not the correct timestamps?";
//   btn.setAttribute('class', `saved-timestamps`);
//   btn.setAttribute('class', `manual-button`);
//   container.innerHTML = btn;
// });

document.querySelector('.manual-entry').addEventListener('click', (event) => {
  const eventID = event.target.id;
  console.log(eventID);

  if(eventID == 'cancelButton'){ //cancel
    const container = document.getElementsByClassName("manual-entry")[0];
    container.innerHTML = "";
    const btn = document.createElement("a");
    btn.textContent = "Not the correct timestamps?";
    btn.setAttribute('class', `saved-timestamps`);
    btn.setAttribute('id', `manual-button`);
    container.appendChild(btn);
  }else if(eventID == 'manual-button'){ //open form
    createForm();
  }
});

document.querySelector('.manual-entry').addEventListener("submit", async (event)=>{
  //manual user entry textbox 

  event.preventDefault();
  const formElem = event.target;
  const formData = new FormData(formElem);
  const input = formData.get("userInput"); // gets user input from text box
  console.log(`user input: ${input}`); 
  await chrome.storage.sync.set({ [videoID]: {'timestamps':input, 'videoLink':url , 'title':videoTitle}}).then(() => {
    console.log("Value is set");
  });

  // console resets when page loads due to submit, use event.preventDetault() and this stuff if wanna use that
  const container = document.getElementsByClassName("manual-entry")[0];
  container.innerHTML = "";
  const btn = document.createElement("a");
  btn.textContent = "Not the correct timestamps?";
  btn.setAttribute('class', `saved-timestamps`);
  btn.setAttribute('id', `manual-button`);
  container.appendChild(btn);

  console.log("after await");
  createNewButtons(input);

});

function createNewButtons(input){
  const userTimestamps = getTimestampsFromComment(input);
  const userTimestampsSecond = timestampsToSeconds(userTimestamps);
  createButtons(userTimestamps, userTimestampsSecond);
  console.log("new buttons created");
}

function createForm(){
  //create input box for user to put in manual timestamps
  const container = document.getElementsByClassName("manual-entry")[0];

  container.innerHTML = "";

  const form = document.createElement("form");
  // form.setAttribute('onsubmit', 'temp()'); //change later to save data 
  container.appendChild(form);

  const userTimestampsLabel = document.createElement("label");
  userTimestampsLabel.textContent = "Enter timestamps";
  userTimestampsLabel.setAttribute('for', `userInput`);
  form.appendChild(userTimestampsLabel);

  const userTimestampsInput = document.createElement("input");
  userTimestampsInput.setAttribute('type', "text");
  userTimestampsInput.setAttribute('id', `userInput`);
  userTimestampsInput.setAttribute('name', `userInput`);
  userTimestampsInput.setAttribute('placeholder', `i.e. "0:12, 4:35, 7:28"`);
  userTimestampsInput.setAttribute('pattern', "\\s*\\b(?:[0-5]?\\d:[0-5]\\d(?::[0-5]\\d)?)\\b(?:\\s*,\\s*\\b(?:[0-5]?\\d:[0-5]\\d(?::[0-5]\\d)?)\\b)*\\s*");
  form.appendChild(userTimestampsInput);

  const lineBreak = document.createElement('br');
  form.appendChild(lineBreak);

  const cancelButton = document.createElement("button");
  cancelButton.textContent = `cancel`;
  cancelButton.setAttribute('id', `cancelButton`);
  cancelButton.setAttribute('type', `button`); //make cancel button not submit
  form.appendChild(cancelButton); 

  const submitButton = document.createElement("input");
  submitButton.setAttribute('value', `submit`);  
  submitButton.setAttribute('type', `submit`);
  submitButton.setAttribute('id', `submit`);
  form.appendChild(submitButton);
}

//////////////////

/////////////////
// const curURL = window.location.href;
// console.log(curURL);
// const URLTemplate = /(?:https:\/\/www.youtube.com\/watch)/;

// if(URLTemplate.test(curURL)){
// }

//get all info needed


// get info then create buttons
let videoTitle;
let timestamps;
let timestampsSeconds;
let url;
let videoID;

requestInfo().then(
  function(res){
    const retrievedInfo = res;
    console.log(retrievedInfo);
    videoTitle = retrievedInfo.title;
    timestamps = retrievedInfo.timestamps;
    timestampsSeconds = retrievedInfo.timestampsSeconds;
    url = retrievedInfo.url;
    videoID = retrievedInfo.videoID;
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



