import { AppConstants } from "./utils/constants";

class _HistoryManager {
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

    if (AppConstants.HISTORY_MAX < history.length) {
      history.shift();
    }

    localStorage.setItem(this.#key, JSON.stringify(history));
    return true;
  }

  replaceAll(videoIds) {
    localStorage.setItem(this.#key, JSON.stringify(videoIds));
  }

  clear() {
    localStorage.removeItem(this.#key);
  }
}
const History = new _HistoryManager(
  AppConstants.LOCAL_STORAGE_KEYS.PLAY_HISTORY
);

export default History;
