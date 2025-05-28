/**
 * ビデオリスト管理のインターフェース
 */
export class IVideoListManager {
  /**
   * ビデオリストを更新
   * @param {string[]} videoIds - 動画IDの配列
   */
  updateVideoList(videoIds) {
    throw new Error("Method 'updateVideoList' must be implemented");
  }

  /**
   * 現在選択されているビデオのインデックスを取得
   * @returns {number} - 選択されているインデックス
   */
  getSelectedIndex() {
    throw new Error("Method 'getSelectedIndex' must be implemented");
  }

  /**
   * インデックスでビデオを選択
   * @param {number} index - インデックス
   * @param {boolean} notify - 通知するかどうか
   */
  selectByIndex(index, notify = true) {
    throw new Error("Method 'selectByIndex' must be implemented");
  }

  /**
   * ビデオ選択時のコールバックを設定
   * @param {Function} callback - コールバック関数
   */
  setOnVideoSelected(callback) {
    throw new Error("Method 'setOnVideoSelected' must be implemented");
  }

  /**
   * ビデオリスト変更時のコールバックを設定
   * @param {Function} callback - コールバック関数
   */
  setOnVideoListChanged(callback) {
    throw new Error("Method 'setOnVideoListChanged' must be implemented");
  }
}
