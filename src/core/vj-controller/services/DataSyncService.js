import { IDataSyncService } from "../interfaces/IDataSyncService.js";

/**
 * データ同期サービスの実装
 */
export class DataSyncService extends IDataSyncService {
  #dataManager;
  #localStorageKey;
  #getCurrentTime;

  /**
   * @param {Object} dataManager - データマネージャー
   * @param {string} localStorageKey - LocalStorageキー
   * @param {Function} getCurrentTime - 現在時間取得関数
   */
  constructor(dataManager, localStorageKey, getCurrentTime) {
    super();
    this.#dataManager = dataManager;
    this.#localStorageKey = localStorageKey;
    this.#getCurrentTime = getCurrentTime;
  }

  /**
   * データを設定
   * @param {string} key - キー
   * @param {*} value - 値
   */
  setData(key, value) {
    let data = this.#dataManager.getAll();

    data[key] = value;
    if (key === "speed") {
      // 速度変更なら、タイミング情報も送信
      data["timing"] = this.getTimingData();
    }

    localStorage.setItem(this.#localStorageKey, JSON.stringify(data));
    this.#dataManager.applyData(data);
  }

  /**
   * タイミングデータを取得
   * @returns {Object} タイミングデータ
   */
  getTimingData() {
    return {
      timestamp: +new Date() / 1000,
      playerTime: this.#getCurrentTime(),
    };
  }
}
