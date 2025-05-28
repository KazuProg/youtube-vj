/**
 * データ同期サービスのインターフェース
 */
export class IDataSyncService {
  /**
   * データを設定
   * @param {string} key - キー
   * @param {*} value - 値
   */
  setData(key, value) {
    throw new Error("setData method must be implemented");
  }

  /**
   * タイミングデータを取得
   * @returns {Object} タイミングデータ
   */
  getTimingData() {
    throw new Error("getTimingData method must be implemented");
  }
}
