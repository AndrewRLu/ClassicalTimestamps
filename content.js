function getVideoID(){
  // get video id of current tab from url
  const videoID = currentVideoURL.searchParams.get("v");
  console.log(`video id obtained: ${videoID}`);
  return videoID;
}


//

function getTimestampsFromComment(comment){
  // get timestamp(s) from single comment
  const timestampTemplate = /\b(?:[0-5]?\d:[0-5]\d(?::[0-5]\d)?)\b/g;
  const timestamps = comment.match(timestampTemplate) || []; 
  return timestamps;
}

async function getFinalTimestamps(comments, numParts){
  // iterate through list of comments to try to find one with greq number of timestamps, 
  // return false if none found
  for (let comment of comments){
    const timestamps = await getTimestampsFromComment(comment);
    if(timestamps.length >= numParts){
      // return timestamps;
      console.log("comment found")
      for(let x of timestamps){
        console.log(x);
      }
      return timestamps;
    }
  }
  return false;
}

//


//use some API, either musicbrainz or chatgpt to get number of movements
//FIGURE OUT LATER
// function getNumParts(){}; 

//

//return textOriginal

//old getTopLevelComments w/o serverless
async function getTopLevelComments(videoID, nextPageToken){
  console.log(`getting top level comments`);
  const maxResults = 100;

  const callResponse = await fetch(`https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet&maxResults=${maxResults}&order=relevance&videoId=${videoID}&key=${youtubeApiKey}&pageToken=${nextPageToken}`);
  const callResponseJSON = await callResponse.json();
  const pageComments = callResponseJSON.items.map(comment => comment.snippet.topLevelComment.snippet.textOriginal);
  nextPageToken = callResponseJSON.nextPageToken || "";

  console.log(`comments with token "${nextPageToken}": ${pageComments}`);
  return {comments: pageComments, token: nextPageToken};
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


// async function seeIfTSWorks(){
//   currentVideoID = await getVideoID(); //update global video id
//   // call api to get video title, no need for async //
  
//   const topLevelComments = await getTopLevelComments(currentVideoID);
//   const finalTimestamps = await getFinalTimestamps(topLevelComments, 1);
//   console.log(finalTimestamps);
//   console.log("see if works done");
//   return;
// }

async function seeIfTSWorks(){
  console.log("seeifitworks run")
  const savedVideoIDs = [];
  const initSavedVideoIDs = await chrome.storage.sync.getKeys().then((items) => {
    savedVideoIDs.push(...items);
    console.log(items)
    console.log(savedVideoIDs);
  });
  currentVideoID = await getVideoID(); //update global video id
  // currentVideoTitle = await getVideoTitle(currentVideoID);
  if(savedVideoIDs.includes(currentVideoID)){
    console.log("found");
    //used saved info as default
    const retrievedInfo = {};
    const initRetrievedInfo = await chrome.storage.sync.get(currentVideoID).then((items) => {
      Object.assign(retrievedInfo, items);
      console.log(retrievedInfo);
    });
    currentVideoTitle = retrievedInfo[currentVideoID].title;
    timestamps = getTimestampsFromComment(retrievedInfo[currentVideoID].timestamps);
    console.log(timestamps);
    timestampsSeconds = timestampsToSeconds(timestamps);
    console.log(timestampsSeconds);
    currentVideoURL = retrievedInfo[currentVideoID].videoLink;
  }else{
    console.log("not found");
    currentVideoTitle = await fetch('https://ytchromeext.netlify.app/.netlify/functions/getVideoTitle', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json', 
      },
      body: JSON.stringify({ 
        videoID: currentVideoID  
      }),
    });

    currentVideoTitle = await currentVideoTitle.json();
    currentVideoTitle = currentVideoTitle.title;
    console.log(currentVideoTitle);

    //usually 3 or 4;
    for(let numMvt = 4; numMvt > 0; numMvt--){
      const finalTimestamps = await tryGetTimestamps(currentVideoID, numMvt);
      if(finalTimestamps){
        // currentVideoTitle = await getVideoTitle(currentVideoID);

        console.log(`final timestamps: ${finalTimestamps}`);

        // finalTimestamps = ['0:12', '03:14', '4:35'];
        timestamps = finalTimestamps;
        timestampsSeconds = timestampsToSeconds(finalTimestamps);
        console.log(`tts: ${timestampsSeconds}`);
        console.log("see if works done");
        // skipToTime(40);
        // console.log("skipped");
        return;
      }
    }
  }

}

// async function tryGetTimestamps(currentVideoID, numMvt){ //without serverless
//   // call api to get video title, no need for async //
//   let nextPageToken = "";
//   let finalTimestamps = false;
//   do{
//     const response = await getTopLevelComments(currentVideoID, nextPageToken);
//     const topLevelComments = response.comments;
//     nextPageToken = response.token;
//     finalTimestamps = await getFinalTimestamps(topLevelComments, numMvt);
//     // if(finalTimestamps != false){ //if returns a list of timestamps, stop
//     //   timestampsFound = true;
//     // }
//   } while(nextPageToken!="" && !finalTimestamps);
  
//   if(!finalTimestamps){
//     return false;
//   }else{
//     return finalTimestamps;
//   }
// }

async function tryGetTimestamps(currentVideoID, numMvt){ 
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
    // console.log(responseJSON);
    const topLevelComments = responseJSON.comments;
    nextPageToken = responseJSON.token;
    npt = responseJSON.nextPageToken;
    finalTimestamps = await getFinalTimestamps(topLevelComments, numMvt);

  } while(nextPageToken!="" && !finalTimestamps); 
    // console.log(npt);

  if(!finalTimestamps){
    return false;
  }else{
    return finalTimestamps;
  }
}


// async function getVideoTitle(videoID){
//   const callResponse = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${videoID}&key=${youtubeApiKey}`);
//   const callResponseJSON = await callResponse.json();
//   console.log(callResponseJSON.items[0].snippet.title);
//   return callResponseJSON.items[0].snippet.title;
// }



///////////////////SCRIPT FOR FIRST TIME RAN///////////////////////


console.log("script began running");

//global vairables
let currentVideoURL = new URL(window.location.href); 
let currentVideoID;
let currentVideoTitle;
let timestamps;
let timestampsSeconds;

seeIfTSWorks();

// function storeVideoID(){
//   chrome.storage.local.set({ curVideoID: currentVideoID }).then(() => {
//     console.log("video id set");
//   });
//   chrome.storage.local.get(["curVideoID"]).then(result => {console.log(`stored value content script: ${result.curVideoID}`)});
// }


// test();


////////////////////////////////

// const test = "iuhsa shfiha sef 01:23 2:13";
// // getTimestamps(test);
// // const thing = getTimestamps(test);
// getFinalTimestamps([test], 1);






////////////// important stuff to keep/////////////////////////


//detect going to new youtube video while currently on video

let timer; //debounce
const videoChangeObserver = new MutationObserver(() => {
  if(currentVideoURL != new URL(window.location.href)){
    clearTimeout(timer);
    currentVideoURL = new URL(window.location.href);
    console.log("video changed");
    timer = setTimeout(() => seeIfTSWorks(), 5000);
  }
}
);

//youtube is SPA, when new video, body updates; detect when change to body
videoChangeObserver.observe(document.body, {childList: true});


//

//////////////// send message to popup js when asked /////////////////////

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
  console.log("message recieved");
  if (request.message === "getInfo")
    sendResponse({title: currentVideoTitle, timestamps: timestamps, timestampsSeconds: timestampsSeconds, url: String(currentVideoURL), videoID: currentVideoID});
  if (request.message === "seek")
    skipToTime(request.seconds);
  }
);

////////////////////// detect user change to timestamps //////////////////////////

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${JSON.stringify(oldValue)}", new value is "${JSON.stringify(newValue)}".`
    );
    currentVideoTitle = newValue.title;
    timestamps = getTimestampsFromComment(newValue.timestamps);
    // console.log(timestamps);
    timestampsSeconds = timestampsToSeconds(timestamps);
    // console.log(timestampsSeconds);
    currentVideoURL = newValue.videoLink;
  }
});