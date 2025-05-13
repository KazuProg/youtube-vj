"use strict";

function init(fullscreen = false) {
  if (fullscreen) {
    const f =
      document.body.requestFullscreen ||
      document.body.webkitRequestFullscreen ||
      document.body.mozRequestFullScreen ||
      document.body.msRequestFullscreen;
    if (f) {
      f.call(document.body);
    }
  }
  document.querySelector("#init_button").remove();

  let ch0_opacity = 1;
  let ch1_opacity = 1;
  let crossfader = 0;

  const ch0_dataManager = new VJPlayerData();
  const ch1_dataManager = new VJPlayerData();
  ch0_dataManager.applyData(JSON.parse(localStorage.getItem("ytvj_ch0")));
  ch1_dataManager.applyData(JSON.parse(localStorage.getItem("ytvj_ch1")));

  const ch0 = new VJPlayer(0, ch0_dataManager, { isProjection: true });
  const ch1 = new VJPlayer(1, ch1_dataManager, { isProjection: true });

  ch0.addEventListener("dataApplied", (key, value) => {
    if (key === "filter" && "opacity" in value) {
      if (ch0_opacity == value.opacity) return;
      ch0_opacity = value.opacity;
      applyOpacity();
    }
  });
  ch1.addEventListener("dataApplied", (key, value) => {
    if (key === "filter" && "opacity" in value) {
      if (ch1_opacity == value.opacity) return;
      ch1_opacity = value.opacity;
      applyOpacity();
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === "ytvj_sys") {
      systemHandler();
      return;
    }
    if (event.key === "ytvj_ch0") {
      ch0_dataManager.applyData(JSON.parse(event.newValue));
    }
    if (event.key === "ytvj_ch1") {
      ch1_dataManager.applyData(JSON.parse(event.newValue));
    }
  });

  let _sysDat = {};
  function systemHandler() {
    const data = JSON.parse(localStorage.getItem("ytvj_sys"));

    for (const key in data) {
      if (JSON.stringify(_sysDat[key]) === JSON.stringify(data[key])) {
        continue;
      }
      _sysDat[key] = data[key];
      switch (key) {
        case "crossfader":
          crossfader = parseFloat(data[key]);
          applyOpacity();
          break;
      }
    }
  }

  systemHandler();

  function applyOpacity() {
    const ch0_container = document.querySelector(`.player_container.ch0`);
    const ch1_container = document.querySelector(`.player_container.ch1`);

    const cf_weight = 1 - Math.abs(crossfader);
    const ch0_weight = ch0_opacity * (0 < crossfader ? cf_weight : 1);
    const ch1_weight = ch1_opacity * (crossfader < 0 ? cf_weight : 1);
    const ch0_isFront = ch0_weight >= ch1_weight;
    const ch1_isFront = ch0_weight < ch1_weight;
    ch0_container.style.zIndex = ch0_isFront ? 1 : 0;
    ch1_container.style.zIndex = ch1_isFront ? 1 : 0;
    ch0_container.style.opacity =
      (ch0_isFront ? 1 - ch1_weight / 2 : 1) * ch0_weight;
    ch1_container.style.opacity =
      (ch1_isFront ? 1 - ch0_weight / 2 : 1) * ch1_weight;
  }
}
