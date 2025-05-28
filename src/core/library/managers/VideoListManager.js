import { IVideoListManager } from "../interfaces/IVideoListManager.js";

/**
 * ビデオリスト管理クラス
 * ビデオリストのビジネスロジックを担当
 */
export class VideoListManager extends IVideoListManager {
  #videoListUI;
  #onVideoSelectedCallback;
  #onVideoListChangedCallback;

  constructor() {
    super();
  }

  /**
   * ビデオリストUIコンポーネントを設定
   * @param {VideoListUIComponent} videoListUI - ビデオリストUIコンポーネント
   */
  setVideoListUI(videoListUI) {
    this.#videoListUI = videoListUI;
  }

  /**
   * ビデオリストを更新
   * @param {string[]} videoIds - 動画IDの配列
   */
  updateVideoList(videoIds) {
    this.#videoListUI.updateVideoList(videoIds);
  }

  /**
   * 現在選択されているビデオのインデックスを取得
   * @returns {number} - 選択されているインデックス
   */
  getSelectedIndex() {
    return this.#videoListUI.getSelectedIndex();
  }

  /**
   * インデックスでビデオを選択
   * @param {number} index - インデックス
   * @param {boolean} notify - 通知するかどうか
   */
  selectByIndex(index, notify = true) {
    this.#videoListUI.selectByIndex(index, notify);
  }

  /**
   * ビデオ選択時のコールバックを設定
   * @param {Function} callback - コールバック関数
   */
  setOnVideoSelected(callback) {
    this.#onVideoSelectedCallback = callback;
  }

  /**
   * ビデオリスト変更時のコールバックを設定
   * @param {Function} callback - コールバック関数
   */
  setOnVideoListChanged(callback) {
    this.#onVideoListChangedCallback = callback;
  }

  /**
   * 上方向のナビゲーション
   */
  navigateUp() {
    this.#videoListUI.navigateUp();
  }

  /**
   * 下方向のナビゲーション
   */
  navigateDown() {
    this.#videoListUI.navigateDown();
  }

  /**
   * フォーカス状態を設定
   * @param {boolean} focused - フォーカス状態
   */
  setFocused(focused) {
    this.#videoListUI.setFocused(focused);
  }

  /**
   * ビデオ選択を処理
   * @param {string} videoId - 選択されたビデオID
   */
  handleVideoSelected(videoId) {
    if (this.#onVideoSelectedCallback) {
      this.#onVideoSelectedCallback(videoId);
    }
  }

  /**
   * ビデオリスト変更を処理
   * @param {string[]} videoIds - 変更されたビデオIDの配列
   */
  handleVideoListChanged(videoIds) {
    if (this.#onVideoListChangedCallback) {
      this.#onVideoListChangedCallback(videoIds);
    }
  }
}
