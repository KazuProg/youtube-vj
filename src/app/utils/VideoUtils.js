/**
 * 動画関連のユーティリティ関数
 */
export class VideoUtils {
  /**
   * テキストから動画IDと開始時間を抽出
   * @param {string} text - 入力テキスト
   * @returns {Object|null} 抽出結果 { id, start }
   */
  static parseVideoInput(text) {
    if (!text) return null;

    text = text.trim();
    let id;
    let start = null;

    // @記号で開始時間が指定されている場合
    if (text.indexOf("@") !== -1) {
      const parts = text.split("@");
      start = parts[1];
      text = parts[0];
    }

    // 11文字の場合は直接動画IDとして扱う
    if (text.length === 11) {
      id = text;
    } else {
      // URLとして解析を試行
      const parsed = this.parseYouTubeURL(text);
      if (parsed) {
        id = parsed.id;
        start = parsed.start || start;
      }
    }

    return id ? { id, start } : null;
  }

  /**
   * YouTube URLを解析
   * @param {string} text - 入力テキスト
   * @returns {Object|null} 解析結果 { id, start }
   */
  static parseYouTubeURL(text) {
    const urls = this.extractURLs(text);
    if (urls.length === 0) {
      return null;
    }

    try {
      const url = new URL(urls[0]);
      let id, start;
      const params = new URLSearchParams(url.search);

      // youtu.be形式
      if (url.hostname === "youtu.be") {
        id = url.pathname.substr(1, 11);
      }
      // youtube.com/watch形式
      else if (url.pathname === "/watch") {
        id = params.get("v");
      }
      // youtube.com/shorts形式
      else if (url.pathname.startsWith("/shorts")) {
        id = url.pathname.substr(8, 11);
      }

      start = params.get("t");

      return { id, start };
    } catch (error) {
      return null;
    }
  }

  /**
   * テキストからURLを抽出
   * @param {string} text - 入力テキスト
   * @returns {Array<string>} URL配列
   */
  static extractURLs(text) {
    const urlPattern = /https?:\/\/[^\s/$.?#].[^\s]*/g;
    return text.match(urlPattern) || [];
  }

  /**
   * テキストがURLかどうかを判定
   * @param {string} text - 入力テキスト
   * @returns {boolean} URLかどうか
   */
  static isURL(text) {
    return /^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(text);
  }

  /**
   * 動画IDから表示用の文字列を生成
   * @param {string} id - 動画ID
   * @param {string|null} start - 開始時間
   * @returns {string} 表示用文字列
   */
  static formatVideoIdForDisplay(id, start) {
    if (!id) return "";

    let result = id;
    if (start !== null && start !== undefined) {
      result = `${id}@${start}`;
    }
    return result;
  }

  /**
   * 動画IDからサムネイルURLを生成
   * @param {string} id - 動画ID
   * @returns {string} サムネイルURL
   */
  static getThumbnailURL(id) {
    return `https://img.youtube.com/vi/${id}/default.jpg`;
  }

  /**
   * 動画情報をUIに反映
   * @param {string} id - 動画ID
   * @param {string|null} start - 開始時間
   */
  static updateVideoUI(id, start) {
    if (!id) return;

    const displayId = this.formatVideoIdForDisplay(id, start);
    const thumbnailURL = this.getThumbnailURL(id);

    // サムネイル更新
    const thumbnailElement = document.querySelector(".yt-thumbnail");
    if (thumbnailElement) {
      thumbnailElement.src = thumbnailURL;
    }

    // 入力フィールド更新
    const inputElement = document.querySelector("#input-videoId");
    if (inputElement) {
      inputElement.value = displayId;
    }

    // グローバル変数更新（既存MIDIスクリプトとの互換性のため）
    window.prepareVideoId = displayId;
  }

  /**
   * 現在準備されている動画IDを取得
   * UIの状態から動的に取得するため、変数として保持する必要がない
   * @returns {string} 準備されている動画ID
   */
  static getPreparedVideoId() {
    const inputElement = document.querySelector("#input-videoId");
    if (!inputElement || !inputElement.value.trim()) {
      return "";
    }
    
    const parsed = this.parseVideoInput(inputElement.value);
    return parsed ? this.formatVideoIdForDisplay(parsed.id, parsed.start) : "";
  }
}
