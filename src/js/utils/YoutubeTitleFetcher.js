/**
 * YouTube動画のタイトルを取得するユーティリティクラス
 */
export default class YoutubeTitleFetcher {
  constructor() {
    this.cache = new Map();
    this.pendingFetches = new Map();
  }

  /**
   * YouTube動画のタイトルを取得する
   * @param {string} videoId - YouTube動画ID
   * @returns {Promise<string>} 動画タイトルを含むPromise
   */
  fetchTitle(videoId) {
    if (!videoId) {
      return Promise.reject('動画IDが指定されていません');
    }

    // キャッシュにある場合はキャッシュから返す
    if (this.cache.has(videoId)) {
      return Promise.resolve(this.cache.get(videoId));
    }

    // 既にフェッチ中の場合は同じPromiseを返す
    if (this.pendingFetches.has(videoId)) {
      return this.pendingFetches.get(videoId);
    }

    // YouTubeのOEmbed APIを使用してタイトルを取得
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const fetchPromise = fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('タイトル取得に失敗しました');
        }
        return response.json();
      })
      .then(data => {
        const title = data.title || '不明なタイトル';
        
        // キャッシュに保存
        this.cache.set(videoId, title);
        
        // pendingリストから削除
        this.pendingFetches.delete(videoId);
        
        return title;
      })
      .catch(error => {
        // pendingリストから削除
        this.pendingFetches.delete(videoId);
        
        // エラー時は「不明なタイトル」を返す
        const fallbackTitle = `不明なタイトル (${videoId})`;
        this.cache.set(videoId, fallbackTitle);
        
        console.error('YouTubeタイトル取得エラー:', error);
        return fallbackTitle;
      });

    // pendingリストに追加
    this.pendingFetches.set(videoId, fetchPromise);
    
    return fetchPromise;
  }

  /**
   * 複数の動画IDに対するタイトルを一括取得
   * @param {Array<string>} videoIds - YouTube動画IDの配列
   * @returns {Promise<Map<string, string>>} 動画IDとタイトルのマップを含むPromise
   */
  fetchMultipleTitles(videoIds) {
    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return Promise.resolve(new Map());
    }

    const promises = videoIds.map(id => 
      this.fetchTitle(id).then(title => [id, title])
    );

    return Promise.all(promises)
      .then(results => new Map(results));
  }

  /**
   * キャッシュをクリアする
   * @param {string} [videoId] - クリアする特定の動画ID（省略時は全てクリア）
   */
  clearCache(videoId) {
    if (videoId) {
      this.cache.delete(videoId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * キャッシュされたタイトル情報を取得
   * @returns {Map<string, string>} 動画IDとタイトルのマップ
   */
  getCachedTitles() {
    return new Map(this.cache);
  }
} 