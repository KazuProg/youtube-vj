import { IPlaylistManager } from "../interfaces/IPlaylistManager.js";

/**
 * プレイリスト管理クラス
 * プレイリストのビジネスロジックを担当
 */
export class PlaylistManager extends IPlaylistManager {
  #playlistUI;
  #onPlaylistChangedCallback;

  constructor() {
    super();
  }

  /**
   * プレイリストUIコンポーネントを設定
   * @param {PlaylistUIComponent} playlistUI - プレイリストUIコンポーネント
   */
  setPlaylistUI(playlistUI) {
    this.#playlistUI = playlistUI;
  }

  /**
   * プレイリストを追加または更新
   * @param {string} name - プレイリスト名
   * @param {string[]} videoIds - 動画IDの配列
   */
  insertPlaylist(name, videoIds) {
    this.#playlistUI.insertPlaylist(name, videoIds);
  }

  /**
   * 現在選択されているプレイリスト名を取得
   * @returns {string} - プレイリスト名
   */
  getCurrentPlaylistName() {
    return this.#playlistUI.getCurrentPlaylistName();
  }

  /**
   * プレイリスト変更時のコールバックを設定
   * @param {Function} callback - コールバック関数
   */
  setOnPlaylistChanged(callback) {
    this.#onPlaylistChangedCallback = callback;
  }

  /**
   * 上方向のナビゲーション
   */
  navigateUp() {
    this.#playlistUI.navigateUp();
  }

  /**
   * 下方向のナビゲーション
   */
  navigateDown() {
    this.#playlistUI.navigateDown();
  }

  /**
   * フォーカス状態を設定
   * @param {boolean} focused - フォーカス状態
   */
  setFocused(focused) {
    this.#playlistUI.setFocused(focused);
  }

  /**
   * プレイリスト変更を処理
   * @param {string} name - プレイリスト名
   * @param {string[]} videoIds - 動画IDの配列
   */
  handlePlaylistChanged(name, videoIds) {
    if (this.#onPlaylistChangedCallback) {
      this.#onPlaylistChangedCallback(name, videoIds);
    }
  }
}
