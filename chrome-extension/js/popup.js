(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector("#open_windows");
    btn.addEventListener("click", () => {
      chrome.windows.create({
        url: "https://youtube-vj.kazuprog.work/",
        type: "popup",
        width: 960,
        height: 540,
      });
    });
  });
})();
