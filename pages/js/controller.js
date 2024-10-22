"use strict";

const ch = [];
let selCh = null;
let midi = null;

window.addEventListener("load", () => {
  const eventHandlers = {
    onChangeVideo: (channel, videoId) => {
      document.querySelector("#loadedVideoId").value = videoId;
      for (const c of ch) {
        c.channelNumber === channel ? c.unMute() : c.mute();
      }
      addHistory(videoId, ch[channel].videoTitle);
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
          document.querySelector(`.opacity .deck${channel}`).value = val;
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

  window.addEventListener("storage", (e) => {
    if (e.key !== "ytvj_sys") return;
    const oldVal = JSON.parse(e.oldValue);
    const newVal = JSON.parse(e.newValue);

    for (const key in newVal) {
      if (JSON.stringify(oldVal[key]) === JSON.stringify(newVal[key])) {
        continue;
      }
      switch (key) {
        case "videoId":
          changeVideo(newVal[key]);
          break;
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "p") {
      openProjectionWindow();
    }
    if (event.ctrlKey && event.key === "h") {
      window.open("./history.html", "History", "width=800,height=600");
    }
    if (event.ctrlKey && event.key === "l") {
      openSetListWindow();
    }
    if (event.ctrlKey && event.key === "1") {
      selectCh(0);
      event.preventDefault();
    }
    if (event.ctrlKey && event.key === "2") {
      selectCh(1);
      event.preventDefault();
    }
    if (event.ctrlKey && event.key === "m") {
      if (!midi) {
        midi = new MIDIScriptManager({
          executeScript: true,
        });
      }
      midi.requestAccess();
      event.preventDefault();
    }
    if (event.ctrlKey && event.shiftKey && event.key === "M") {
      if (midi) {
        midi.openCustomScriptEditor();
      }
      event.preventDefault();
    }

    // ID入力中は以降の処理をスキップ
    const activeElement = document.activeElement;
    if (
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      activeElement.isContentEditable
    ) {
      return;
    }

    if (event.key === "Escape") {
      selectCh(null);
      event.preventDefault();
    }
    if (event.key === "/") {
      document.querySelector("#input-videoId").focus();
      selectCh(null);
      event.preventDefault();
    }
    if (event.key === "s") {
      switchVideo();
      event.preventDefault();
    }
    if (event.key === "t" || event.key === "f") {
      OpenProjectionWindow();
      event.preventDefault();
    }

    if (selCh) {
      switch (event.key) {
        case " ":
        case "k":
          if (event.shiftKey) {
            selCh.suspendPreview();
          } else {
            selCh.togglePlayPause();
          }
          break;
        case "m":
          selCh.toggleMuteUnmute();
          break;
        case "ArrowLeft":
          selCh.adjustTiming(-5);
          break;
        case "ArrowRight":
          selCh.adjustTiming(5);
          break;
        case "j":
          selCh.adjustTiming(-10);
          break;
        case "l":
          if (event.ctrlKey) {
            selCh.setVideo(prepareVideoId);
          } else {
            selCh.adjustTiming(10);
          }
          break;
        case ",":
          selCh.adjustTiming(-0.1);
          break;
        case ".":
          selCh.adjustTiming(+0.1);
          break;
        case "<":
          selCh.setSpeed(-0.05, true);
          break;
        case ">":
          selCh.setSpeed(+0.05, true);
          break;
        case "ArrowUp":
          selCh.setOpacity(+0.05, true);
          break;
        case "ArrowDown":
          selCh.setOpacity(-0.05, true);
          break;
        default:
          return;
      }
      event.preventDefault();
    }
  });

  changeVideo(relayElement.value);
  setCrossfader(-1);
  openProjectionWindow();
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

function selectCh(channel = null) {
  selCh = ch[channel];
  for (const c of ch) {
    const cNum = c.channelNumber;
    const deck = document.querySelector(`.deck.ch${cNum}`);
    if (cNum === channel) {
      deck.classList.add("selected");
    } else {
      deck.classList.remove("selected");
    }
  }
  document.querySelector("#input-videoId").blur();
}

function openProjectionWindow() {
  window.open("./projection.html", "Projection", "width=640,height=360");
}

function openSetListWindow() {
  window.open("./setlist.html", "SetList", "width=640,height=960");
}

function addHistory(videoId, videoTitle) {
  const localStorageKey = "ytvj_history";

  let history = JSON.parse(localStorage.getItem(localStorageKey) || "[]");

  if (history[0] && history[history.length - 1].id === videoId) {
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
