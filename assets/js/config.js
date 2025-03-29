"use strict";

class _ConfigManager {
  #configObj = {
    fadeoutVolume: true,
    openLibrary: false,
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

  set fadeoutVolume(value) {
    this.#configObj.fadeoutVolume = value;
    this.#save();
  }

  set openLibrary(value) {
    this.#configObj.openLibrary = value;
    this.#save();
  }

  #save() {
    localStorage.setItem(this.#key, JSON.stringify(this.#configObj));
  }
}
const Config = new _ConfigManager("ytvj_config");
