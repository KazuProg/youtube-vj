import { IHotcueManager } from "../interfaces/IHotcueManager.js";

/**
 * ホットキュー管理の実装
 */
export class HotcueManager extends IHotcueManager {
  #hotcues = [];
  #onHotcueAdded;
  #onHotcueRemoved;
  #onSetTime;

  /**
   * @param {Function} onHotcueAdded - ホットキュー追加コールバック
   * @param {Function} onHotcueRemoved - ホットキュー削除コールバック
   * @param {Function} onSetTime - 時間設定コールバック
   */
  constructor(onHotcueAdded, onHotcueRemoved, onSetTime) {
    super();
    this.#onHotcueAdded = onHotcueAdded;
    this.#onHotcueRemoved = onHotcueRemoved;
    this.#onSetTime = onSetTime;
  }

  /**
   * ホットキューを実行
   * @param {number} index - ホットキューインデックス
   */
  hotcue(index) {
    if (this.#hotcues[index]) {
      this.playHotcue(index);
    } else {
      // 現在時間を取得するためのコールバックが必要
      // この実装では外部から時間を渡してもらう
      throw new Error("Current time is required for adding hotcue");
    }
  }

  /**
   * ホットキューを追加
   * @param {number} index - ホットキューインデックス
   * @param {number} time - 時間
   */
  addHotcue(index, time) {
    this.removeHotcue(index); // 上書き用
    this.#hotcues[index] = time;
    if (this.#onHotcueAdded) {
      this.#onHotcueAdded(index, time);
    }
  }

  /**
   * ホットキューを再生
   * @param {number} index - ホットキューインデックス
   */
  playHotcue(index) {
    if (this.#hotcues[index] && this.#onSetTime) {
      this.#onSetTime(this.#hotcues[index]);
    }
  }

  /**
   * ホットキューを削除
   * @param {number} index - ホットキューインデックス
   */
  removeHotcue(index) {
    if (this.#hotcues[index]) {
      this.#hotcues[index] = null;
      if (this.#onHotcueRemoved) {
        this.#onHotcueRemoved(index);
      }
    }
  }

  /**
   * すべてのホットキューをクリア
   */
  clearAllHotcues() {
    for (const i in this.#hotcues) {
      this.removeHotcue(i);
    }
    this.#hotcues = [];
  }

  /**
   * ホットキューを実行（時間付き）
   * @param {number} index - ホットキューインデックス
   * @param {number} currentTime - 現在時間
   */
  hotcueWithTime(index, currentTime) {
    if (this.#hotcues[index]) {
      this.playHotcue(index);
    } else {
      this.addHotcue(index, currentTime);
    }
  }
}
