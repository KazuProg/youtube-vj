import { IConcurrencyManager } from "../interfaces/IConcurrencyManager.js";

/**
 * 同時実行制御の実装
 */
export class ConcurrencyManager extends IConcurrencyManager {
  #maxConcurrent;
  #runningTasks = new Set();

  /**
   * @param {number} maxConcurrent - 最大同時実行数
   */
  constructor(maxConcurrent = 3) {
    super();
    this.#maxConcurrent = maxConcurrent;
  }

  /**
   * タスクを実行可能かチェック
   * @returns {boolean}
   */
  canExecute() {
    return this.#runningTasks.size < this.#maxConcurrent;
  }

  /**
   * タスクの実行を開始
   * @param {string} id - タスクID
   */
  startTask(id) {
    if (this.#runningTasks.size >= this.#maxConcurrent) {
      throw new Error("Maximum concurrent tasks exceeded");
    }
    this.#runningTasks.add(id);
  }

  /**
   * タスクの実行を終了
   * @param {string} id - タスクID
   */
  endTask(id) {
    this.#runningTasks.delete(id);
  }

  /**
   * 実行中のタスク数を取得
   * @returns {number}
   */
  getRunningTaskCount() {
    return this.#runningTasks.size;
  }
}
