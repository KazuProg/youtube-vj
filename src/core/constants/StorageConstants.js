/**
 * ローカルストレージのキー定数を管理します。
 * Single Responsibility Principle: ストレージキーの定義のみを責務とする
 */
export class StorageConstants {
  // アプリケーション設定のキー
  static get APP_SETTINGS() {
    return "ytvj_config";
  }

  // 再生履歴のキー
  static get PLAY_HISTORY() {
    return "ytvj_history";
  }

  // コントロールチャンネル0のキー
  static get CTRL_CH_0() {
    return "ytvj_ch0";
  }

  // コントロールチャンネル1のキー
  static get CTRL_CH_1() {
    return "ytvj_ch1";
  }

  // マスターコントロールのキー
  static get CTRL_MASTER() {
    return "ytvj_sys";
  }

  /**
   * すべてのストレージキーを取得します
   * @returns {Object} すべてのストレージキー
   */
  static getAllKeys() {
    return {
      APP_SETTINGS: this.APP_SETTINGS,
      PLAY_HISTORY: this.PLAY_HISTORY,
      CTRL_CH_0: this.CTRL_CH_0,
      CTRL_CH_1: this.CTRL_CH_1,
      CTRL_MASTER: this.CTRL_MASTER,
    };
  }
}
