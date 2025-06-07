// //wrap all in big function and make it manual for now :(

const youtubeApiKey = "PUT API KEY HERE";

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
}

//


//use some API, either musicbrainz or chatgpt to get number of movements
//FIGURE OUT LATER
// function getNumParts(){}; 

//

//return textOriginal
async function getTopLevelComments(videoID){
    console.log("getting top level comments")
    let nextPageToken = "";
    const maxResults = 100;
    const topLevelComments = []; 
    do{
        const callResponse = await fetch(`https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet&maxResults=${maxResults}&order=relevance&videoId=${videoID}&key=${youtubeApiKey}&pageToken=${nextPageToken}`);
        const callResponseJSON = await callResponse.json();
        const pageComments = callResponseJSON.items.map(comment => comment.snippet.topLevelComment.snippet.textOriginal);
        topLevelComments.push(...pageComments); //makes it not push entire list, only entires
        nextPageToken = callResponseJSON.nextPageToken || "";
        // console.log(`top level: ${topLevelComments}, cur: ${pageComments}, nxtpgtkn: ${nextPageToken}`);
    } while(nextPageToken!="");
    console.log(`all comments: ${topLevelComments}`);
    return topLevelComments;
}

async function seeIfTSWorks(){
    currentVideoID = await getVideoID(); //update global video id
    // call api to get video title, no need for async //
    currentVideoTitle = await getVideoTitle(currentVideoID);
    const topLevelComments = await getTopLevelComments(currentVideoID);
    const finalTimestamps = await getFinalTimestamps(topLevelComments, 1);
    console.log(finalTimestamps);
    console.log("see if works done");
    return;
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
const currentVideoURL = new URL(window.location.href);
let currentVideoID;
let currentVideoTitle;

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
    if (request.message === "getVideoID")
      sendResponse({reply: currentVideoTitle});
  }
);