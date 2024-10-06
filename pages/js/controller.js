const VJC = [];
const ch1 = 1;
const ch2 = 2;
window.addEventListener("load", () => {
  const eventHandlers = {
    onChangeVideo: (channel, videoId) => {
      document.querySelector("#loadedVideoId").value = videoId;
      VJC[channel].unMute();
      VJC[channel == ch1 ? ch2 : ch1].mute();
      addHistory(videoId, VJC[channel].player.YTPlayer.videoTitle);
    },
    onSuspendPreview: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .suspend`);
      overlay.classList.remove("hidden");
    },
    onResumePreview: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .suspend`);
      overlay.classList.add("hidden");
    },
    onSyncStart: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .syncing`);
      overlay.classList.remove("hidden");
    },
    onSyncEnd: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .syncing`);
      overlay.classList.add("hidden");
    },
  };

  VJC[ch1] = new VJController(1, { events: eventHandlers, autoplay: true });
  VJC[ch2] = new VJController(2, { events: eventHandlers });

  const relayElement = document.querySelector("#videoId");

  var observer = new MutationObserver(() => {
    console.log("YTVJ:C 変更検知(videoId)");
    changeVideo(relayElement.value);
  });

  observer.observe(relayElement, {
    attributes: true,
    childList: true,
    characterData: true,
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "h") {
      window.open("./history.html", "History", "width=800,height=600");
    }
  });

  changeVideo(relayElement.value);
  calcOpacity();
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
    calcOpacity();
    if (Math.abs(val) >= 1) {
      clearInterval(interval);
    }
  }, intervalTime);
}

function setSwitchingDuration() {
  const input = prompt("Switching Duration (ms)", switchingDuration);
  console.log(input);
  switchingDuration = parseFloat(input);
}

const speedStep = 0.05;
const _speedStep = 1 / speedStep;

function setLSpeed(val) {
  val = Math.round(parseFloat(val) * _speedStep) / _speedStep;
  VJC[ch1].setData("speed", val);
  document.querySelector(".deck.ch1 .speed input[type=range]").value =
    val.toFixed(2);
  document.querySelector(".deck.ch1 .speed input[type=number]").value =
    val.toFixed(2);
}

function setRSpeed(val) {
  val = Math.round(parseFloat(val) * _speedStep) / _speedStep;
  VJC[ch2].setData("speed", val);
  document.querySelector(".deck.ch2 .speed input[type=range]").value =
    val.toFixed(2);
  document.querySelector(".deck.ch2 .speed input[type=number]").value =
    val.toFixed(2);
}

function calcOpacity() {
  var l = parseFloat(document.querySelector("#Lopacity").value);
  var r = parseFloat(document.querySelector("#Ropacity").value);
  var s = parseFloat(document.querySelector("#cross-fader").value);
  if (s < 0) {
    VJC[ch1].setData("zIndex", 0);
    VJC[ch2].setData("zIndex", 1);
    r *= (1 - Math.abs(s)) * 0.5;
  } else {
    VJC[ch1].setData("zIndex", 1);
    VJC[ch2].setData("zIndex", 0);
    l *= (1 - Math.abs(s)) * 0.5;
  }
  VJC[ch1].setData("opacity", l);
  VJC[ch2].setData("opacity", r);
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
