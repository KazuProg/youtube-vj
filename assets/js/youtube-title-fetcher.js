"use strict";

class _YouTubeTitleFetcher {
  #playersContainer;
  #list = {}; // 取得予定はnull、取得中は""、取得済みはタイトル文字列
  #maxFetch = 3; // 同時に取得する最大数

  init(containerSelector) {
    this.#playersContainer = document.querySelector(containerSelector);
  }

  fetch(id) {
    if (!(id in this.#list)) {
      this.#list[id] = null;
      this.#fetchIf();
    }
    return this.#fetchFromList(id);
  }

  #fetchingCount() {
    let fetchingCount = 0;
    for (const key in this.#list) {
      if (this.#list[key] == "") {
        fetchingCount++;
      }
    }
    return fetchingCount;
  }

  #firstNullKey() {
    for (const key in this.#list) {
      if (this.#list[key] == null) {
        return key;
      }
    }
    return null;
  }

  #fetchIf() {
    let fetchingCount = this.#fetchingCount();
    while (fetchingCount < this.#maxFetch) {
      const id = this.#firstNullKey();
      if (id == null) {
        break;
      }
      this.#fetchTitle(id);
      fetchingCount++;
    }
  }

  #fetchTitle(id) {
    this.#list[id] = "";

    const playerElem = document.createElement("div");
    playerElem.id = `yttf_${id}`;
    this.#playersContainer.appendChild(playerElem);

    const cleanup = () => {
      player.destroy();
      playerElem.remove();
      this.#fetchIf();
    };

    const player = new YT.Player(playerElem.id, {
      videoId: id,
      events: {
        onReady: (e) => {
          // 広告が読み込まれる可能性もある？
          e.target.mute();
          e.target.playVideo();
        },
        onStateChange: (e) => {
          const data = e.target.getVideoData();
          // 広告が読み込まれる可能性もある？
          if (data.video_id == id) {
            this.#list[id] = e.target.videoTitle;
            cleanup();
          }
        },
        onError: () => {
          cleanup();
        },
      },
    });
  }

  #fetchFromList(id) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (
          id in this.#list &&
          this.#list[id] != null &&
          this.#list[id] != ""
        ) {
          clearInterval(interval);
          resolve(this.#list[id]);
        }
      }, 1);
    });
  }
}

const YouTubeTitleFetcher = new _YouTubeTitleFetcher();
