"use strict";

window.addEventListener("load", () => {
  YouTubeTitleFetcher.init("#ytplayers");
});

function loadSetlist() {
  FileHandler.readText().then((content) => {
    const list = content
      .split(/\r\n|\r|\n/)
      .map((text) => {
        if (text.length == 11) return text;
        if (/^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(text)) {
          const url = new URL(text);
          if (url.hostname === "youtu.be") {
            return url.pathname.substr(1, 11);
          }
          if (url.pathname === "/watch") {
            const params = new URLSearchParams(url.search);
            return params.get("v");
          }
        }
        return null;
      })
      .filter((a) => a);

    const parent = document.querySelector("div#setlist");
    parent.innerHTML = "";
    for (const id of list) {
      const div = document.createElement("div");
      div.className = "video";
      div.innerHTML = `
        <img src="https://img.youtube.com/vi/${id}/default.jpg">
        <div><span></span></div>`;
      div.onclick = () => {
        sendToController(id);
      };
      YouTubeTitleFetcher.fetch(id).then((title) => {
        div.querySelector("span").innerText = title;
      });
      parent.appendChild(div);
    }
  });
}

function sendToController(id) {
  localStorage.setItem(
    "ytvj_sys",
    JSON.stringify({
      ...(JSON.parse(localStorage.getItem("ytvj_sys")) || {}),
      videoId: id,
    })
  );
}

sendToController(undefined);
