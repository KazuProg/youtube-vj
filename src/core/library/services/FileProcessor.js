import { IFileProcessor } from "../interfaces/IFileProcessor.js";

/**
 * ファイル処理サービスの実装
 */
export class FileProcessor extends IFileProcessor {
  #urlParser;

  constructor(urlParser) {
    super();
    this.#urlParser = urlParser;
  }

  /**
   * ファイルの内容を処理してプレイリストを作成
   * @param {string} filename - ファイル名
   * @param {string} content - ファイル内容
   * @returns {Object} - {name: string, videoIds: string[]}
   */
  processFile(filename, content) {
    const name = this.#getFileNameWithoutExtension(filename);
    const videoIds = this.#parseContent(content);

    return {
      name,
      videoIds,
    };
  }

  /**
   * ファイルが処理可能かどうかを確認
   * @param {File} file - ファイルオブジェクト
   * @returns {boolean} - 処理可能かどうか
   */
  canProcess(file) {
    return file.type === "text/plain" || file.name.endsWith(".txt");
  }

  /**
   * ファイル名から拡張子を除去
   * @param {string} filename - ファイル名
   * @returns {string} - 拡張子を除いたファイル名
   */
  #getFileNameWithoutExtension(filename) {
    return filename.substring(0, filename.lastIndexOf(".")) || filename;
  }

  /**
   * ファイル内容を解析してビデオIDの配列を作成
   * @param {string} content - ファイル内容
   * @returns {string[]} - ビデオIDの配列
   */
  #parseContent(content) {
    return content
      .split(/\r\n|\r|\n/)
      .map((text) => {
        text = text.trim();
        if (!text) return null;
        if (text.startsWith(";")) return null;

        const parsed = this.#urlParser(text);
        if (parsed) {
          let result = parsed.id;
          if (parsed.start) result = `${result}@${parsed.start}`;
          return result;
        } else {
          return text;
        }
      })
      .filter((item) => item);
  }
}
