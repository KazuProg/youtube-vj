/**
 * プレイリスト管理のインターフェース
 */
export class IPlaylistManager {
  /**
   * プレイリストを追加または更新
   * @param {string} name - プレイリスト名
   * @param {string[]} videoIds - 動画IDの配列
   */
  insertPlaylist(name, videoIds) {
    throw new Error("Method 'insertPlaylist' must be implemented");
  }

  /**
   * 現在選択されているプレイリスト名を取得
   * @returns {string} - プレイリスト名
   */
  getCurrentPlaylistName() {
    throw new Error("Method 'getCurrentPlaylistName' must be implemented");
  }

  /**
   * プレイリスト変更時のコールバックを設定
   * @param {Function} callback - コールバック関数
   */
  setOnPlaylistChanged(callback) {
    throw new Error("Method 'setOnPlaylistChanged' must be implemented");
  }
}
