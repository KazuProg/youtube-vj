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
      HistoryManager.add(videoId);
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
        case "filter":
          document.querySelector(`.opacity .deck${channel}`).value =
            val["opacity"];
          break;
      }
    },
  };

  ch[0] = new VJController(0, { autoplay: true });
  ch[1] = new VJController(1);

  for (const c of ch) {
    c.addEventListener("changeVideo", eventHandlers.onChangeVideo);
    c.addEventListener("suspendPreview", eventHandlers.onSuspendPreview);
    c.addEventListener("resumePreview", eventHandlers.onResumePreview);
    c.addEventListener("timeSyncStart", eventHandlers.onTimeSyncStart);
    c.addEventListener("timeSyncEnd", eventHandlers.onTimeSyncEnd);
    c.addEventListener("dataApplied", eventHandlers.onDataApplied);
  }

  // 拡張機能とのデータのやり取り
  const relayElement = document.querySelector("#videoId");
  new MutationObserver(() => {
    document
      .querySelector("#extension-status .indicator")
      .classList.add("active");
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
        requestMidiAccess();
      } else {
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

  let muteState = [];
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      onInactive();
    } else if (document.visibilityState === "visible") {
      onActive();
    }
  });
  window.addEventListener("blur", onInactive);
  window.addEventListener("focus", onActive);
  function onActive() {
    for (let i = 0; i < ch.length; i++) {
      if (muteState[i] == false) {
        ch[i].unMute();
      }
    }
  }
  function onInactive() {
    for (let i = 0; i < ch.length; i++) {
      muteState[i] = ch[i].isMuted;
      ch[i].mute();
    }
  }

  document.querySelector("#projection-status").addEventListener("click", () => {
    openProjectionWindow();
  });
  document
    .querySelector("#midi-device-status")
    .addEventListener("click", () => {
      if (!midi) {
        requestMidiAccess();
      } else {
        midi.openCustomScriptEditor();
      }
    });
  document.querySelector("#extension-status").addEventListener("click", () => {
    window.open("./docs/chrome-extension.html");
  });

  changeVideo(relayElement.value);
  setCrossfader(-1);
  openProjectionWindow();
  requestMidiAccess(true);
});

function requestMidiAccess(startup = false) {
  if (startup && !loadSystemData()?.midiAccess) {
    return;
  }
  if (!midi) {
    midi = new MIDIScriptManager("YouTube-VJ", {
      executeScript: true,
    });
  }
  midi
    .requestAccess()
    .then(() => {
      updateSystemData({ midiAccess: true });
      document
        .querySelector("#midi-device-status .indicator")
        .classList.add("active");
    })
    .catch(() => {
      updateSystemData({ midiAccess: false });
      midi = null;
      alert("Failed to access MIDI device.");
    });
}

var prepareVideoId;
function changeVideo(text) {
  let id;
  let start = null;
  if (text.indexOf("@") !== -1) {
    start = text.split("@")[1];
    text = text.split("@")[0];
  }
  if (text.length === 11) {
    id = text;
  } else {
    if (/^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(text)) {
      const url = new URL(text);
      const params = new URLSearchParams(url.search);
      if (url.hostname === "youtu.be") {
        id = url.pathname.substr(1, 11);
      }
      if (url.pathname === "/watch") {
        id = params.get("v");
      }
      start = params.get("t");
    }
  }

  if (id) {
    let idPos = id;
    if (start !== null) {
      idPos = `${id}@${start}`;
    }
    const url = `https://img.youtube.com/vi/${id}/default.jpg`;
    document.querySelector(".yt-thumbnail").src = url;
    document.querySelector("#input-videoId").value = idPos;
    prepareVideoId = idPos;
  }
}

var switchingDuration = 1000;
var switching = false;
function switchVideo() {
  if (switching) return;
  switching = true;
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
      switching = false;
    }
  }, intervalTime);
}

function setSwitchingDuration() {
  const input = prompt("Switching Duration (ms)", switchingDuration);
  switchingDuration = parseInt(input);
}

function setCrossfader(val) {
  updateSystemData({ crossfader: val });
  document.querySelector("#cross-fader").value = val;
}

function loadSystemData() {
  return JSON.parse(localStorage.getItem("ytvj_sys"));
}

function updateSystemData(obj) {
  localStorage.setItem(
    "ytvj_sys",
    JSON.stringify({
      ...loadSystemData(),
      ...obj,
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
  const wnd = window.open(
    "./projection.html",
    "Projection",
    "width=640,height=360"
  );
  if (wnd) {
    document
      .querySelector("#projection-status .indicator")
      .classList.add("active");
    let int = setInterval(() => {
      if (wnd.closed) {
        clearInterval(int);
        document
          .querySelector("#projection-status .indicator")
          .classList.remove("active");
      }
    }, 500);
  }
}

function openSetListWindow() {
  window.open("./setlist.html", "SetList", "width=640,height=960");
}
