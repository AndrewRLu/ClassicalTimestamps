// //wrap all in big function and make it manual for now :(

const youtubeApiKey = "";

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
    converted = [];
    for(timestamp of timestamps){
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
//     currentVideoID = await getVideoID(); //update global video id
//     // call api to get video title, no need for async //
    
//     const topLevelComments = await getTopLevelComments(currentVideoID);
//     const finalTimestamps = await getFinalTimestamps(topLevelComments, 1);
//     console.log(finalTimestamps);
//     console.log("see if works done");
//     return;
// }

async function seeIfTSWorks(){
    currentVideoID = await getVideoID(); //update global video id
    currentVideoTitle = await getVideoTitle(currentVideoID);
    //usually 3 or 4;
    for(let numMvt = 1; numMvt > 0; numMvt--){
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

async function tryGetTimestamps(currentVideoID, numMvt){
    // call api to get video title, no need for async //
    let nextPageToken = "";
    let finalTimestamps = false;
    do{
        const response = await getTopLevelComments(currentVideoID, nextPageToken);
        const topLevelComments = response.comments;
        nextPageToken = response.token;
        finalTimestamps = await getFinalTimestamps(topLevelComments, numMvt);
        // if(finalTimestamps != false){ //if returns a list of timestamps, stop
        //     timestampsFound = true;
        // }
    } while(nextPageToken!="" && !finalTimestamps);
    
    if(!finalTimestamps){
        return false;
    }else{
        return finalTimestamps;
    }
}



async function getVideoTitle(videoID){
    const callResponse = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${videoID}&key=${youtubeApiKey}`);
    const callResponseJSON = await callResponse.json();
    console.log(callResponseJSON.items[0].snippet.title);
    return callResponseJSON.items[0].snippet.title;
}



//////////////////////////////////////////


console.log("script began running");

//global vairables
const currentVideoURL = new URL(window.location.href); //there is doop below, fix later
let currentVideoID;
let currentVideoTitle;
let timestamps;
let timestampsSeconds;

seeIfTSWorks();

// function storeVideoID(){
//     chrome.storage.local.set({ curVideoID: currentVideoID }).then(() => {
//         console.log("video id set");
//     });
//     chrome.storage.local.get(["curVideoID"]).then(result => {console.log(`stored value content script: ${result.curVideoID}`)});
// }


// test();


////////////////////////////////

// const test = "iuhsa shfiha sef 01:23 2:13";
// // getTimestamps(test);
// // const thing = getTimestamps(test);
// getFinalTimestamps([test], 1);






////////////// important stuff to keep/////////////////////////


//detect going to new youtube video while currently on video

let currentURL = window.location.href;
const videoChangeObserver = new MutationObserver(() => {
    if(currentURL != window.location.href){
        currentURL = window.location.href;
        console.log("video changed");
        // REPLACE WITH ACTUAL FUNCTION LATER
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
      sendResponse({title: currentVideoTitle, timestamps: timestamps, timestampsSeconds: timestampsSeconds, url: String(currentURL)});
    if (request.message === "seek")
      skipToTime(request.seconds);
  }
);