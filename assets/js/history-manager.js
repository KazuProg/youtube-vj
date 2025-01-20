"use strict";

class _HistoryManager {
  #MAX_COUNT = 100;
  #key;

  constructor(localStorageKey) {
    this.#key = localStorageKey;
  }

  getAll() {
    return JSON.parse(localStorage.getItem(this.#key) || "[]");
  }

  add(videoId) {
    let history = this.getAll();

    if (history.length !== 0 && history[history.length - 1] === videoId) {
      return false;
    }

    history.push(videoId);

    if (this.#MAX_COUNT < history.length) {
      history.shift();
    }

    localStorage.setItem(this.#key, JSON.stringify(history));
    return true;
  }

  clear() {
    localStorage.removeItem(this.#key);
  }
}
const HistoryManager = new _HistoryManager("ytvj_history");
