"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector("#open_windows");
  btn.addEventListener("click", () => {
    chrome.windows.create({
      url: "https://kazuprog.github.io/youtube-vj/",
      type: "popup",
      width: 960,
      height: 540,
    });
  });
});
