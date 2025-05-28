/**
 * アプリケーション全体で利用する基本定数を定義します。
 * Single Responsibility Principle: 定数の定義のみを責務とする
 */
export class AppConstants {
  // 同期間隔（ミリ秒）
  static get SYNC_INTERVAL() {
    return 3000;
  }

  // 履歴の最大保存数
  static get HISTORY_MAX() {
    return 100;
  }

  // アプリケーション名
  static get APP_NAME() {
    return "YouTube-VJ";
  }

  // バージョン情報
  static get VERSION() {
    return "1.0.0";
  }
}
