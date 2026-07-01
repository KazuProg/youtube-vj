(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("tag") !== "vjp") {
    return;
  }

  const style = document.createElement("style");
  style.textContent = "#player-controls, #ytp-caption-window-container { display: none }";
  document.head.appendChild(style);
})();
