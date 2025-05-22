import { AppConstants } from "./utils/constants";

class Config {
  static #defaultConfig = {
    fadeoutVolume: true,
    openLibrary: false,
    youtubeAPIKey: "",
    youtubeAPIRequests: 10,
  };

  static #config = {};
  static #localStorageKey = AppConstants.LOCAL_STORAGE_KEYS.APP_SETTINGS;

  static {
    Object.assign(Config.#config, Config.#defaultConfig);

    const savedConfig = localStorage.getItem(Config.#localStorageKey);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        for (const key in parsed) {
          if (Object.prototype.hasOwnProperty.call(Config.#config, key)) {
            Config.#config[key] = parsed[key];
          }
        }
      } catch (e) {
        console.error("Failed to parse saved config from localStorage:", e);
      }
    }
  }

  static get fadeoutVolume() {
    return Config.#config.fadeoutVolume;
  }

  static get openLibrary() {
    return Config.#config.openLibrary;
  }

  static get youtubeAPIKey() {
    return Config.#config.youtubeAPIKey;
  }

  static get youtubeAPIRequests() {
    return Config.#config.youtubeAPIRequests;
  }

  static set fadeoutVolume(value) {
    if (typeof value === "boolean") {
      Config.#config.fadeoutVolume = value;
      Config.#save();
    } else {
      console.warn("Invalid value for fadeoutVolume: must be a boolean.");
    }
  }

  static set openLibrary(value) {
    if (typeof value === "boolean") {
      Config.#config.openLibrary = value;
      Config.#save();
    } else {
      console.warn("Invalid value for openLibrary: must be a boolean.");
    }
  }

  static set youtubeAPIKey(value) {
    if (typeof value === "string") {
      Config.#config.youtubeAPIKey = value;
      Config.#save();
    } else {
      console.warn("Invalid value for youtubeAPIKey: must be a string.");
    }
  }

  static set youtubeAPIRequests(value) {
    if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
      Config.#config.youtubeAPIRequests = value;
      Config.#save();
    } else {
      console.warn(
        "Invalid value for youtubeAPIRequests: must be a non-negative integer."
      );
    }
  }

  static #save() {
    localStorage.setItem(
      Config.#localStorageKey,
      JSON.stringify(Config.#config)
    );
  }

  static getAllConfig() {
    return { ...Config.#config };
  }

  static resetConfig() {
    Object.assign(Config.#config, Config.#defaultConfig);
    Config.#save();
  }
}

export default Config;
