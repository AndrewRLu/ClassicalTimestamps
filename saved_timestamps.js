// document.getElementById("buregers").innerText = "ham"; 

const videos = {};

async function getUserTimestamps(){
  const initVideos = await chrome.storage.sync.get().then((items) => {
    Object.assign(videos, items); //copy to videos
  });
  console.log(videos);
  // document.getElementById("buregers").innerText = JSON.stringify(videos); 
}

function createUL(){
  console.log("created");
  const myUL = document.getElementById("myUL");
  
  for(const key in videos){
    console.log(key);
    const myLI = document.createElement("li");
    const myLink = document.createElement("a");
    const myTimestamps = document.createElement("div");
    myLink.setAttribute('href', `${videos[key]['videoLink']}`);
    myLink.setAttribute('target', `_blank`);
    myLink.textContent = `${videos[key]['title']}`; //title
    myLI.appendChild(myLink);
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






// getUserTimestamps().then(createUL());

async function work(){
  await getUserTimestamps();
  await createUL();
}

work();