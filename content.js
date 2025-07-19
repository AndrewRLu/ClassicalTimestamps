function getVideoID(){
  const videoID = currentVideoURL.searchParams.get("v");
  return videoID;
}

function getTimestampsFromComment(comment){
  const timestampTemplate = /\b(?:[0-5]?\d:[0-5]\d(?::[0-5]\d)?)\b/g;
  const timestamps = comment.match(timestampTemplate) || []; 
  return timestamps;
}

async function getFinalTimestamps(comments, numParts){
  // iterate through list of comments to try to find one with greq number of timestamps, 
  // return false if none found
  for (let comment of comments){
    const timestamps = await getTimestampsFromComment(comment);
    if(timestamps.length >= numParts && timestamps.length < 5){
      return timestamps;
    }
  }
  return false;
}

async function getTimestampsFromDescription(currentVideoID){
  const response = await fetch('https://ytchromeext.netlify.app/.netlify/functions/getDescription', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json', 
    },
    body: JSON.stringify({ 
      videoID: currentVideoID,  
    }),
  });
  const responseJSON = await response.json();
  const description = responseJSON.description;
  const lines = description.split("\n");
  const timestamps = [];
  for(const line of lines){
    const timestampsOfLine = getTimestampsFromComment(line);        
    if(timestampsOfLine.length > 0){
      if(timestampsOfLine.length == 2){
        //only want first, e.g. 0:00-0:30
        timestamps.push(timestampsOfLine[0]);
      } else {
        timestamps.push(...timestampsOfLine);
      }
    }
  }
  if(timestamps.length >= 3){
    //check if enough movements
    return timestamps;
  }else{
    return false;
  }
}

async function getTimestampsFromComments(currentVideoID, numMvt){ 
  //with serverless
  let nextPageToken = "";
  let finalTimestamps = false;

  do{
    const response = await fetch('https://ytchromeext.netlify.app/.netlify/functions/getTopLevelComments', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json', 
      },
      body: JSON.stringify({ 
        videoID: currentVideoID,  
        nextPageToken: nextPageToken 
      }),
    });

    const responseJSON = await response.json();
    const topLevelComments = responseJSON.comments;
    nextPageToken = responseJSON.token;
    npt = responseJSON.nextPageToken;
    finalTimestamps = await getFinalTimestamps(topLevelComments, numMvt);

  } while(nextPageToken!="" && !finalTimestamps); 

  if(!finalTimestamps){
    return false;
  }else{
    return finalTimestamps;
  }
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

function skipToTime(time){
  //need to update this if DOM changes, get by class
  const youtubePlayer = document.getElementsByClassName('video-stream html5-main-video')[0];
  youtubePlayer.currentTime = time;
}

async function getChapters(){
  const savedVideoIDs = [];
  const initSavedVideoIDs = await chrome.storage.sync.getKeys().then((items) => {
    savedVideoIDs.push(...items);
  });
  currentVideoID = await getVideoID();
  if(savedVideoIDs.includes(currentVideoID)){
    //used saved info as default
    const retrievedInfo = {};
    const initRetrievedInfo = await chrome.storage.sync.get(currentVideoID).then((items) => {
      Object.assign(retrievedInfo, items);
    });
    currentVideoTitle = retrievedInfo[currentVideoID].title;
    timestamps = getTimestampsFromComment(retrievedInfo[currentVideoID].timestamps);
    timestampsSeconds = timestampsToSeconds(timestamps);
    currentVideoURL = new URL(retrievedInfo[currentVideoID].videoLink);
  }else{
    const response = await fetch('https://ytchromeext.netlify.app/.netlify/functions/getVideoTitle', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json', 
      },
      body: JSON.stringify({ 
        videoID: currentVideoID  
      }),
    });

    const responseJSON = await response.json();
    currentVideoTitle = responseJSON.title;

    //try description first
    const descriptionTimestamps = await getTimestampsFromDescription(currentVideoID);
    if(descriptionTimestamps){
      timestamps = descriptionTimestamps;
      timestampsSeconds = timestampsToSeconds(descriptionTimestamps);
      return;
    }

    //then try comments, usually 3 or 4;
    for(let numMvt = 3; numMvt > 0; numMvt--){
      const finalTimestamps = await getTimestampsFromComments(currentVideoID, numMvt);
      if(finalTimestamps){
        timestamps = finalTimestamps;
        timestampsSeconds = timestampsToSeconds(finalTimestamps);
        return;
      }
    }
  }
}

/////////////////// init variables then get chapters ///////////////////

//global variables
let currentVideoURL = new URL(window.location.href); 
let currentVideoID;
let currentVideoTitle;
let timestamps;
let timestampsSeconds;

getChapters();

/////////////////// detect when user switches videos ///////////////////

let timer; //debounce
const videoChangeObserver = new MutationObserver(() => {
  if(currentVideoURL != new URL(window.location.href)){
    clearTimeout(timer);
    currentVideoURL = new URL(window.location.href);
    timer = setTimeout(() => getChapters(), 1000);
  }
}
);

videoChangeObserver.observe(document.body, {childList: true});

/////////////////// send message to popup js when asked ///////////////////

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
  if (request.message === "getInfo")
    sendResponse({title: currentVideoTitle, timestamps: timestamps, timestampsSeconds: timestampsSeconds, url: String(currentVideoURL), videoID: currentVideoID});
  if (request.message === "seek")
    skipToTime(request.seconds);
  }
);

/////////////////// detect user change to timestamps ///////////////////

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if(newValue === undefined){
      getChapters();
    }else{
      currentVideoTitle = newValue.title;
      timestamps = getTimestampsFromComment(newValue.timestamps);
      timestampsSeconds = timestampsToSeconds(timestamps);
      currentVideoURL = new URL(newValue.videoLink);
    }
  }
});