/**
 * ファイル処理サービスのインターフェース
 */
export class IFileProcessor {
  /**
   * ファイルの内容を処理してプレイリストを作成
   * @param {string} filename - ファイル名
   * @param {string} content - ファイル内容
   * @returns {Object} - {name: string, videoIds: string[]}
   */
  processFile(filename, content) {
    throw new Error("Method 'processFile' must be implemented");
  }

  /**
   * ファイルが処理可能かどうかを確認
   * @param {File} file - ファイルオブジェクト
   * @returns {boolean} - 処理可能かどうか
   */
  canProcess(file) {
    throw new Error("Method 'canProcess' must be implemented");
  }
}
