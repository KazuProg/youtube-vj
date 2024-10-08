var LPlayer, RPlayer;
window.addEventListener("load", () => {
  LPlayer = new VJPlayer(1, { isProjection: true });
  RPlayer = new VJPlayer(2, { isProjection: true });

  window.addEventListener("storage", (event) => {
    if (event.key === "ytvj_sys") {
      systemHandler();
      return;
    }
    document.dispatchEvent(
      new CustomEvent("VJPlayerUpdated", {
        detail: {
          key: event.key,
          value: event.newValue,
        },
      })
    );
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
          const cf_value = parseFloat(data[key]);
          const strength = 1 - Math.abs(cf_value);
          const ch1_container = document.querySelector(`.player_container.ch1`);
          const ch2_container = document.querySelector(`.player_container.ch2`);
          ch1_container.style.opacity = cf_value < 0 ? 1 : strength * 0.5;
          ch1_container.style.zIndex = cf_value < 0 ? 0 : 1;
          ch2_container.style.opacity = cf_value < 0 ? strength * 0.5 : 1;
          ch2_container.style.zIndex = cf_value < 0 ? 1 : 0;
          break;
      }
    }
  }

  systemHandler();
});
