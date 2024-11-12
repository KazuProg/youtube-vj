"use strict";

var list = null;
var index = 0;

function loadSetlist() {
  FileHandler.readText().then((content) => {
    list = content.split(/\r\n|\r|\n/).map((text) => {
      if (text.length == 11) return text;
      if (/^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(text)) {
        const url = new URL(text);
        if (url.hostname === "youtu.be") {
          return url.pathname.substr(1, 11);
        }
        if (url.pathname === "/watch") {
          const params = new URLSearchParams(url.search);
          return params.get("v");
        }
      }
      return null;
    });

    list = list.filter((a) => a);

    const parent = document.querySelector("div#setlist");
    parent.innerHTML = "";
    for (const id of list) {
      const div = document.createElement("div");
      div.className = "video";
      div.innerHTML = `
        <img src="https://img.youtube.com/vi/${id}/default.jpg">
        <div><span></span></div>`;
      div.onclick = () => {
        sendToController(id);
      };
      parent.appendChild(div);
    }

    new YT.Player("ytplayer", {
      videoId: list[index],
      events: {
        onReady: (e) => {
          e.target.mute();
          e.target.playVideo();
        },
        onStateChange: (e) => {
          const data = e.target.getVideoData();
          if (data.video_id == list[index]) {
            document
              .querySelectorAll("div#setlist > div")
              [index].querySelector("span").innerText = e.target.videoTitle;
            loadNext(e.target);
          }
        },
        onError: (e) => {
          loadNext(e.target);
        },
      },
    });
  });
}

function loadNext(player) {
  index++;
  if (list[index]) {
    player.cueVideoById(list[index]);
  } else {
    player.destroy();
  }
}

function sendToController(id) {
  localStorage.setItem(
    "ytvj_sys",
    JSON.stringify({
      ...(JSON.parse(localStorage.getItem("ytvj_sys")) || {}),
      videoId: id,
    })
  );
}

sendToController(undefined);
