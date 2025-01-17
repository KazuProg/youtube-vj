"use strict";

class _YouTubeTitleFetcher {
  #playersContainer;
  #list = {};

  init(containerSelector) {
    this.#playersContainer = document.querySelector(containerSelector);
  }

  fetch(id) {
    if (!(id in this.#list)) {
      this.#list[id] = null;
      this.#fetchTitle(id);
    }
    return this.#fetchFromList(id);
  }

  #fetchTitle(id) {
    const playerElem = document.createElement("div");
    playerElem.id = `yttf_${id}`;
    this.#playersContainer.appendChild(playerElem);

    const cleanup = () => {
      player.destroy();
      playerElem.remove();
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
        if (id in this.#list && this.#list[id] != null) {
          clearInterval(interval);
          resolve(this.#list[id]);
        }
      }, 1);
    });
  }
}

const YouTubeTitleFetcher = new _YouTubeTitleFetcher();
