import { AppConstants } from "./app/constants.js";
import { ApplicationManager } from "./app/ApplicationManager.js";

const ch = [];
let selCh = null;
let midi = null;

window.ch = ch;
window.selCh = selCh;

// アプリケーション管理インスタンス
let appManager = null;

window.addEventListener("load", () => {
  document.querySelector("#terms-agree-btn").addEventListener("click", () => {
    document.getElementById("terms").style.display = "none";
    init();
  });
});

async function init() {
  try {
    appManager = new ApplicationManager();
    window.appManager = appManager; // グローバルアクセス用

    await appManager.initialize();

    console.log("YouTube-VJ initialized successfully");
  } catch (error) {
    console.error("Failed to initialize YouTube-VJ:", error);
    alert(
      "アプリケーションの初期化に失敗しました。ページを再読み込みしてください。"
    );
  }
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
  if (url.pathname.startsWith("/shorts")) {
    id = url.pathname.substr(8, 11);
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
  const input = prompt(
    "Switching Duration (ms)",
    appManager?.switchingDuration || 1000
  );
  const duration = parseInt(input);
  if (!isNaN(duration) && appManager) {
    appManager.switchingDuration = duration;
  }
}

function setCrossfader(val) {
  updateSystemData({ crossfader: val });
  document.querySelector("#cross-fader").value = val;
}
window.setCrossfader = setCrossfader;

function loadSystemData() {
  return JSON.parse(
    localStorage.getItem(AppConstants.LOCAL_STORAGE_KEYS.CTRL_MASTER)
  );
}

function updateSystemData(obj) {
  localStorage.setItem(
    AppConstants.LOCAL_STORAGE_KEYS.CTRL_MASTER,
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
  console.log("Config is automatically saved");
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";

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
  formatTime,
};
