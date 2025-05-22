import { AppConstants } from "./utils/constants";

class _ConfigManager {
  #configObj = {
    fadeoutVolume: true,
    openLibrary: false,
    youtubeAPIKey: "",
    youtubeAPIRequests: 10,
  };
  #key;

  constructor(localStorageKey) {
    this.#key = localStorageKey;

    const savedConfig = localStorage.getItem(this.#key);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      for (const key in parsed) {
        this.#configObj[key] = parsed[key];
      }
    }
  }

  get fadeoutVolume() {
    return this.#configObj.fadeoutVolume;
  }

  get openLibrary() {
    return this.#configObj.openLibrary;
  }

  get youtubeAPIKey() {
    return this.#configObj.youtubeAPIKey;
  }

  get youtubeAPIRequests() {
    return this.#configObj.youtubeAPIRequests;
  }

  set fadeoutVolume(value) {
    this.#configObj.fadeoutVolume = value;
    this.#save();
  }

  set openLibrary(value) {
    this.#configObj.openLibrary = value;
    this.#save();
  }

  set youtubeAPIKey(value) {
    this.#configObj.youtubeAPIKey = value;
    this.#save();
  }

  set youtubeAPIRequests(value) {
    this.#configObj.youtubeAPIRequests = value;
    this.#save();
  }

  #save() {
    localStorage.setItem(this.#key, JSON.stringify(this.#configObj));
  }
}
const Config = new _ConfigManager(AppConstants.LOCAL_STORAGE_KEYS.APP_SETTINGS);

export default Config;
