import Config from "./config.js";
import Library from "./library.js";
import VJController from "./vj-controller.js";
import YouTubeTitleFetcher from "./youtube-title-fetcher.js";
import templates from "./script-template.js";

const ch = [];
let selCh = null;
let midi = null;

window.ch = ch;
window.selCh = selCh;

window.addEventListener("load", () => {
  document.querySelector("#terms-agree-btn").addEventListener("click", () => {
    document.getElementById("terms").style.display = "none";
    init();
  });
});

function init() {
  const eventHandlers = {
    onChangeVideo: (channel, videoId) => {
      document.querySelector("#loadedVideoId").value = videoId;
      for (const c of ch) {
        c.channelNumber === channel ? c.unmute() : c.mute();
      }
      Library.addHistory(videoId);
      selectCh(channel);
    },
    onSuspendPreview: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .suspend`);
      overlay.classList.remove("hidden");
    },
    onResumePreview: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .suspend`);
      overlay.classList.add("hidden");
      selectCh(channel);
    },
    onTimeSyncStart: (channel) => {
      const bar = document.querySelector(`.deck.ch${channel} .seek-bar`);
      bar.classList.add("syncing");
    },
    onTimeSyncEnd: (channel) => {
      const bar = document.querySelector(`.deck.ch${channel} .seek-bar`);
      bar.classList.remove("syncing");
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
        case "loop":
          const loopParent = document.querySelector(`.deck.ch${channel} .loop`);

          loopParent.innerHTML = "";

          if (val.start != -1) {
            const markerS = document.createElement("span");
            markerS.className = `loop-start`;
            markerS.innerText = "|";
            markerS.style.left = `${(val.start / ch[channel].duration) * 100}%`;
            loopParent.appendChild(markerS);
          }

          if (val.end != -1) {
            const markerE = document.createElement("span");
            markerE.className = `loop-end`;
            markerE.innerText = "|";
            markerE.style.left = `${(val.end / ch[channel].duration) * 100}%`;
            loopParent.appendChild(markerE);
          }
          break;
      }
      selectCh(channel);
    },
    onHotcueAdded: (channel, index, time) => {
      const hotcues = document.querySelector(`.deck.ch${channel} .hotcues`);

      const marker = document.createElement("span");
      marker.className = `hotcue${index}`;
      marker.innerText = index;
      marker.style.left = `${(time / ch[channel].duration) * 100}%`;
      hotcues.appendChild(marker);
    },
    onHotcueRemoved: (channel, index) => {
      const marker = document.querySelector(
        `.deck.ch${channel} .hotcue${index}`
      );
      if (marker) {
        marker.remove();
      }
    },
    onMuteChange: (channel, isMute) => {
      const deck = document.querySelector(`.deck.ch${channel}`);
      if (isMute) {
        deck.classList.add("muted");
      } else {
        deck.classList.remove("muted");
        selectCh(channel);
      }
    },
  };

  ch[0] = new VJController(0, { autoplay: true });
  ch[1] = new VJController(1);

  // for custom script
  window.ch1 = ch[0];
  window.ch2 = ch[1];

  for (const c of ch) {
    c.addEventListener("changeVideo", eventHandlers.onChangeVideo);
    c.addEventListener("suspendPreview", eventHandlers.onSuspendPreview);
    c.addEventListener("resumePreview", eventHandlers.onResumePreview);
    c.addEventListener("timeSyncStart", eventHandlers.onTimeSyncStart);
    c.addEventListener("timeSyncEnd", eventHandlers.onTimeSyncEnd);
    c.addEventListener("dataApplied", eventHandlers.onDataApplied);
    c.addEventListener("hotcueAdded", eventHandlers.onHotcueAdded);
    c.addEventListener("hotcueRemoved", eventHandlers.onHotcueRemoved);
    c.addEventListener("muteChange", eventHandlers.onMuteChange);
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
      return;
    }
    if (event.ctrlKey && event.key === "1") {
      selectCh(0);
      event.preventDefault();
      return;
    }
    if (event.ctrlKey && event.key === "2") {
      selectCh(1);
      event.preventDefault();
      return;
    }
    if (event.ctrlKey && event.key === "m") {
      if (!midi) {
        requestMidiAccess();
      } else {
        midi.openCustomScriptEditor();
      }
      event.preventDefault();
      return;
    }

    if (event.key == "Tab") {
      Library.actions.changeFocus();
      event.preventDefault();
      return;
    }
    if (event.key == "ArrowUp") {
      Library.actions.up();
      return;
    }
    if (event.key == "ArrowDown") {
      Library.actions.down();
      return;
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
      return;
    }
    if (event.key === "/") {
      document.querySelector("#input-videoId").focus();
      selectCh(null);
      event.preventDefault();
      return;
    }
    if (event.key === "s") {
      switchVideo();
      event.preventDefault();
      return;
    }

    if (selCh) {
      if (event.code.substr(0, 5) === "Digit") {
        const number = parseInt(event.code.substr(5, 1));
        if (!isNaN(number)) {
          if (event.shiftKey) {
            selCh.removeHotcue(number);
          } else {
            selCh.hotcue(number);
          }
          event.preventDefault();
          return;
        }
      }

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
      return;
    }
  });

  const ch0_seekBar = document.querySelector(".deck.ch0 .seek-bar");
  const ch0_Indicator = ch0_seekBar.querySelector(".indicator");
  ch0_seekBar.addEventListener("mousemove", (e) => {
    const ratio = getRatio(ch0_seekBar, e);
    ch0_Indicator.classList.add("hovering");
    ch0_Indicator.style.left = `${ratio * 100}%`;
  });
  ch0_seekBar.addEventListener("mouseleave", () => {
    ch0_Indicator.classList.remove("hovering");
  });
  ch0_seekBar.addEventListener("click", (e) => {
    _seek(ch[0], ch0_seekBar, e);
  });

  const ch1_seekBar = document.querySelector(".deck.ch1 .seek-bar");
  const ch1_Indicator = ch1_seekBar.querySelector(".indicator");
  ch1_seekBar.addEventListener("mousemove", (e) => {
    const ratio = getRatio(ch1_seekBar, e);
    ch1_Indicator.classList.add("hovering");
    ch1_Indicator.style.left = `${ratio * 100}%`;
  });
  ch1_seekBar.addEventListener("mouseleave", () => {
    ch1_Indicator.classList.remove("hovering");
  });
  ch1_seekBar.addEventListener("click", (e) => {
    _seek(ch[1], ch1_seekBar, e);
  });

  function getRatio(element, event) {
    const rect = element.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    return clickX / rect.width;
  }

  function _seek(player, element, event) {
    const ratio = getRatio(element, event);
    const seekTime = player.duration * ratio;
    player.setTime(seekTime);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      onInactive();
    } else if (document.visibilityState === "visible") {
      onActive();
    }
  });
  window.addEventListener("blur", () => {
    setTimeout(() => {
      if (!document.hasFocus()) {
        onInactive();
      }
    }, 0);
  });
  window.addEventListener("focus", onActive);
  function onActive() {
    if (Config.fadeoutVolume) {
      selCh.unmute();
    }
  }
  function onInactive() {
    if (Config.fadeoutVolume) {
      selCh.fadeoutVolume();
    }
  }

  const configPopup = document.querySelector("#config");
  document
    .querySelector("#show-config-editor")
    .addEventListener("click", () => {
      configPopup.classList.remove("hidden");
    });
  document
    .querySelector("#close-config-editor")
    .addEventListener("click", () => {
      configPopup.classList.add("hidden");
    });

  document.querySelector("#library-status").addEventListener("click", () => {
    if (Library.isVisible) {
      Library.hide();
    } else {
      Library.show();
    }
  });
  document.querySelector("#projection-status").addEventListener("click", () => {
    openProjectionWindow();
  });
  document
    .querySelector("#projection-status")
    .addEventListener("contextmenu", (e) => {
      e.preventDefault();
      openProjectionWindow(true);
    });
  document
    .querySelector("#midi-device-status")
    .addEventListener("click", () => {
      if (!midi) {
        requestMidiAccess();
      } else {
        midi.openCustomScriptEditor(templates);
      }
    });
  document.querySelector("#extension-status").addEventListener("click", () => {
    window.open("./docs/chrome-extension.html");
  });

  document.querySelector("#conf-fadeout").checked = Config.fadeoutVolume;
  document.querySelector("#conf-fadeout").addEventListener("input", (e) => {
    Config.fadeoutVolume = e.target.checked;
  });

  document.querySelector("#conf-ytapikey").value = Config.youtubeAPIKey;
  document.querySelector("#conf-ytapikey").addEventListener("input", (e) => {
    Config.youtubeAPIKey = e.target.value;
  });

  document.querySelector("#conf-ytapireq").value = Config.youtubeAPIRequests;
  document.querySelector("#conf-ytapireq").addEventListener("input", (e) => {
    Config.youtubeAPIRequests = e.target.value;
  });

  changeVideo(relayElement.value);
  setCrossfader(-1);
  openProjectionWindow();
  requestMidiAccess(true);
  YouTubeTitleFetcher.init("#ytplayers");
  Library.init();
  Library.onVisibilityChanged = (isVisible) => {
    const indicator = document.querySelector("#library-status .indicator");
    if (isVisible) {
      indicator.classList.add("active");
    } else {
      indicator.classList.remove("active");
    }
    Config.openLibrary = isVisible;
  };

  if (Config.openLibrary) {
    Library.show();
  }
  requestAnimationFrame(updateSeekbar);
}

function updateSeekbar() {
  for (let i = 0; i < ch.length; i++) {
    try {
      const deck = document.querySelector(`.deck.ch${i}`);
      const bar = deck.querySelector(".seek-bar .bar");
      const ind = deck.querySelector(".seek-bar .indicator");
      const cur = deck.querySelector(".time .current");
      const dur = deck.querySelector(".time .duration");
      const cssValue = `${(ch[i].currentTime / ch[i].duration) * 100}%`;
      bar.style.width = cssValue;
      if (!ind.classList.contains("hovering")) {
        ind.style.left = cssValue;
      }
      cur.innerText = formatTime(ch[i].currentTime);
      dur.innerText = formatTime(ch[i].duration);
    } catch (e) {}
  }
  requestAnimationFrame(updateSeekbar);
}

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

function changeVideo(text) {
  text = text.trim();
  let id;
  let start = null;
  if (text.indexOf("@") !== -1) {
    start = text.split("@")[1];
    text = text.split("@")[0];
  }
  if (text.length === 11) {
    id = text;
  } else {
    const parsed = parseYouTubeURL(text);
    if (parsed) {
      id = parsed.id;
      start = parsed.start;
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
    window.prepareVideoId = idPos;
  }
}
window.changeVideo = changeVideo;
function extractURLs(text) {
  const urlPattern = /https?:\/\/[^\s/$.?#].[^\s]*/g;
  return text.match(urlPattern) || [];
}
function isURL(text) {
  return /^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(text);
}

function parseYouTubeURL(text) {
  const urls = extractURLs(text);
  if (urls.length === 0) {
    return null;
  }
  const url = new URL(urls[0]);

  let id, start;
  const params = new URLSearchParams(url.search);
  if (url.hostname === "youtu.be") {
    id = url.pathname.substr(1, 11);
  }
  if (url.pathname === "/watch") {
    id = params.get("v");
  }
  start = params.get("t");

  return {
    id,
    start,
  };
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
window.setCrossfader = setCrossfader;

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
      c.unmute();
      c.resumePreview();
    } else {
      deck.classList.remove("selected");
      c.mute();
      c.suspendPreview();
    }
  }
  document.querySelector("#input-videoId").blur();
}
window.selectCh = selectCh;

function openProjectionWindow(preview = false) {
  const wnd = window.open(
    "./projection.html",
    `YTVJ${preview ? "-Prev" : ""}`,
    "width=640,height=360"
  );
  if (!preview && wnd) {
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

window.openProjectionWindow = openProjectionWindow;

function openYouTubeWindow() {
  window.open("https://www.youtube.com/", "YouTube", "width=640,height=960");
}

window.openYouTubeWindow = openYouTubeWindow;

function saveConfig() {
  localStorage.setItem("ytvj_config", JSON.stringify(config));
}

function formatTime(sec) {
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);

  const formattedSeconds = String(seconds).padStart(2, "0");

  return `${minutes}:${formattedSeconds}`;
}

export {
  ch,
  selCh,
  setCrossfader,
  changeVideo,
  extractURLs,
  isURL,
  parseYouTubeURL,
  setSwitchingDuration,
  openProjectionWindow,
  openYouTubeWindow,
  saveConfig,
};
