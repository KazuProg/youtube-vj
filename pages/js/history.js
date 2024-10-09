"use strict";

window.onload = () => {
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
      localStorage.removeItem("ytvj_history");
      location.reload();
    }
  }
});

function showHistory() {
  const isAtBottom =
    window.innerHeight + window.scrollY >= document.body.offsetHeight;

  const parent = document.querySelector("div#history");
  parent.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("ytvj_history") || "[]");
  for (const i in history) {
    const videoInfo = history[i];
    const div = document.createElement("div");
    div.className = "video";
    div.innerHTML = `
      <img src="https://img.youtube.com/vi/${videoInfo.id}/default.jpg">
      <div><span>${videoInfo.title}</span></div>`;
    parent.appendChild(div);
  }

  if (isAtBottom) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }
}
