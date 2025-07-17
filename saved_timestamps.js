const videos = {};

async function getUserTimestamps(){
  const initVideos = await chrome.storage.sync.get().then((items) => {
    Object.assign(videos, items); //copy to videos
  });
  console.log(videos);
}

function createUL(){
  console.log("created");
  const myUL = document.getElementById("myUL");
  
  for(const key in videos){
    console.log(key);
    const myLI = document.createElement("li");
    const myTitle = document.createElement("div");
    const myLink = document.createElement("a");
    const myTimestamps = document.createElement("div");
    myLink.setAttribute('href', `${videos[key]['videoLink']}`);
    myLink.setAttribute('target', `_blank`);
    myLink.textContent = `${videos[key]['title']}`; //title
    myTitle.setAttribute('class', 'title');
    myTitle.appendChild(myLink);
    myLI.appendChild(myTitle);
    myTimestamps.textContent = `${videos[key]['timestamps']}`; //timestamps
    myTimestamps.setAttribute('class', 'timestamp');
    myLI.appendChild(myTimestamps);
    myLI.setAttribute('id', `${key}`);
    myUL.appendChild(myLI);
  }

  const myNodelist = document.getElementsByTagName("LI");
  for (let i = 0; i < myNodelist.length; i++) {
    const span = document.createElement("SPAN");
    const txt = document.createTextNode("\u00D7");
    span.className = "close";
    span.appendChild(txt);
    myNodelist[i].appendChild(span);
  }

  //this is so much easier than event listener 
  const close = document.getElementsByClassName("close");
  for (let i = 0; i < close.length; i++) {
    close[i].onclick = async function() {
      const parent = this.parentElement;
      const parentID = String(parent.id);
      const remove = await chrome.storage.sync.remove(parentID).then(() => {
        parent.style.display = "none";
      });
    }
  }
}

(async function (){
  await getUserTimestamps();
  await createUL();
})();