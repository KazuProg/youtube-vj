"use strict";

window.onload = () => {
  YouTubeTitleFetcher.init("#ytplayers");

  window.addEventListener("storage", (event) => {
    if (event.key === "ytvj_history") {
      showHistory();
    }
  });

  showHistory();
};

document.addEventListener("keydown", (event) => {
  if (event.key === "Delete") {
    if (confirm("履歴を削除しますか？")) {
      HistoryManager.clear();
      location.reload();
    }
  }
});

function showHistory() {
  const isAtBottom =
    window.innerHeight + window.scrollY >= document.body.offsetHeight;

  const parent = document.querySelector("div#history");
  parent.innerHTML = "";
  const history = HistoryManager.getAll();
  for (const id of history) {
    const div = document.createElement("div");
    div.className = "video";
    div.innerHTML = `
      <img src="https://img.youtube.com/vi/${id}/default.jpg">
      <div><span>Loading...</span></div>`;
    parent.appendChild(div);

    YouTubeTitleFetcher.fetch(id).then((title) => {
      div.querySelector("span").innerText = title;
    });
  }

  if (isAtBottom) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }
}
