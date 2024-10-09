"use strict";

const ch = [];

window.addEventListener("load", () => {
  const eventHandlers = {
    onChangeVideo: (channel, videoId) => {
      document.querySelector("#loadedVideoId").value = videoId;
      ch[channel].unMute();
      ch[(channel + 1) % 2].mute();
      addHistory(videoId, ch[channel].player.YTPlayer.videoTitle);
    },
    onSuspendPreview: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .suspend`);
      overlay.classList.remove("hidden");
    },
    onResumePreview: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .suspend`);
      overlay.classList.add("hidden");
    },
    onTimeSyncStart: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .syncing`);
      overlay.classList.remove("hidden");
    },
    onTimeSyncEnd: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .syncing`);
      overlay.classList.add("hidden");
    },
    onDataApplied: (channel, key, val) => {
      switch (key) {
        case "speed":
          const deck = document.querySelector(`.deck.ch${channel}`);
          val = val.toFixed(2);
          deck.querySelector(`.speed input[type=range]`).value = val;
          deck.querySelector(`.speed input[type=number]`).value = val;
          break;
        case "opacity":
          document.querySelector(`.opacity .ch${channel}`).value = val;
          break;
      }
    },
  };

  ch[0] = new VJController(0, { events: eventHandlers, autoplay: true });
  ch[1] = new VJController(1, { events: eventHandlers });

  // 拡張機能とのデータのやり取り
  const relayElement = document.querySelector("#videoId");
  new MutationObserver(() => {
    console.log("YTVJ:C 変更検知(videoId)");
    changeVideo(relayElement.value);
  }).observe(relayElement, {
    attributes: true,
    childList: true,
    characterData: true,
  });
  changeVideo(relayElement.value);

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "h") {
      window.open("./history.html", "History", "width=800,height=600");
    }
  });

  changeVideo(relayElement.value);
  setCrossfader(-1);
  OpenProjectionWindow();
});

var prepareVideoId;
function changeVideo(text) {
  let id;
  if (text.length === 11) {
    id = text;
  } else {
    if (/^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(text)) {
      const url = new URL(text);
      if (url.hostname === "youtu.be") {
        id = url.pathname.substr(1, 11);
      }
      if (url.pathname === "/watch") {
        const params = new URLSearchParams(url.search);
        id = params.get("v");
      }
    }
  }

  if (id) {
    const url = `https://img.youtube.com/vi/${id}/default.jpg`;
    document.querySelector(".yt-thumbnail").src = url;
    document.querySelector("#input-videoId").value = id;
    prepareVideoId = id;
  }
}

var switchingDuration = 1000;
function switchVideo() {
  const intervalTime = 20;
  const croddFaderRange = 2;
  const crossFader = document.querySelector(".crossfader input");
  var val = parseFloat(crossFader.value);

  const dir = -Math.sign(val);
  const switchingVal =
    dir * (intervalTime / switchingDuration) * croddFaderRange;

  const interval = setInterval(() => {
    val += switchingVal;
    crossFader.value = val;
    setCrossfader(val);
    if (Math.abs(val) >= 1) {
      clearInterval(interval);
    }
  }, intervalTime);
}

function setSwitchingDuration() {
  const input = prompt("Switching Duration (ms)", switchingDuration);
  switchingDuration = parseInt(input);
}

function setCrossfader(val) {
  localStorage.setItem(
    "ytvj_sys",
    JSON.stringify({
      ...JSON.parse(localStorage.getItem("ytvj_sys")),
      crossfader: val,
    })
  );
}

function OpenProjectionWindow() {
  window.open("./projection.html", "Projection", "width=640,height=360");
}

function addHistory(videoId, videoTitle) {
  const localStorageKey = "ytvj_history";

  let history = JSON.parse(localStorage.getItem(localStorageKey) || "[]");

  if (history[0] && history[0].id === videoId) {
    return;
  }

  history.push({
    id: videoId,
    title: videoTitle,
  });

  if (100 < history.length) {
    history.shift();
  }

  localStorage.setItem(localStorageKey, JSON.stringify(history));
}
