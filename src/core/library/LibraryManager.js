/**
 * ライブラリ全体の機能統合管理クラス
 * 各マネージャーとサービスを統合して、ライブラリの機能を提供
 */
export class LibraryManager {
  #uiManager;
  #playlistManager;
  #videoListManager;
  #youtubeSearchService;
  #fileProcessor;
  #historyManager;
  #videoController;

  constructor(
    uiManager,
    playlistManager,
    videoListManager,
    youtubeSearchService,
    fileProcessor,
    historyManager,
    videoController
  ) {
    this.#uiManager = uiManager;
    this.#playlistManager = playlistManager;
    this.#videoListManager = videoListManager;
    this.#youtubeSearchService = youtubeSearchService;
    this.#fileProcessor = fileProcessor;
    this.#historyManager = historyManager;
    this.#videoController = videoController;
  }

  /**
   * ライブラリを初期化
   */
  init() {
    this.#setupEventHandlers();
    this.#setupFileDrop();
    this.#setupSearch();
  }

  /**
   * 表示状態を取得
   * @returns {boolean} - 表示されているかどうか
   */
  get isVisible() {
    return this.#uiManager.isVisible;
  }

  /**
   * ライブラリを表示
   */
  show() {
    this.#updateHistory();
    this.#uiManager.show();
  }

  /**
   * ライブラリを非表示
   */
  hide() {
    this.#uiManager.hide();
  }

  /**
   * 上方向のナビゲーション
   */
  navigateUp() {
    this.#uiManager.navigateUp();
  }

  /**
   * 下方向のナビゲーション
   */
  navigateDown() {
    this.#uiManager.navigateDown();
  }

  /**
   * フォーカスを切り替え
   */
  changeFocus() {
    this.#uiManager.changeFocus();
  }

  /**
   * 履歴に動画を追加
   * @param {string} videoId - 動画ID
   */
  addHistory(videoId) {
    this.#historyManager.add(videoId);
    this.#updateHistory();
  }

  /**
   * リストファイルを読み込み
   */
  async loadListFile() {
    try {
      const result = await FileHandler.readText();
      this.#loadList(result.file.name, result.content);
    } catch (error) {
      console.error("Error loading list file:", error);
    }
  }

  /**
   * 表示状態変更時のコールバックを設定
   * @param {Function} callback - コールバック関数
   */
  setOnVisibilityChanged(callback) {
    this.#uiManager.setOnVisibilityChanged(callback);
  }

  /**
   * イベントハンドラーを設定
   */
  #setupEventHandlers() {
    // プレイリスト変更時の処理
    this.#playlistManager.setOnPlaylistChanged((name, videoIds) => {
      this.#videoListManager.updateVideoList(videoIds);
      this.#uiManager.setSearchInputVisible(name === "Search");
    });

    // ビデオ選択時の処理
    this.#videoListManager.setOnVideoSelected((videoId) => {
      this.#videoController.changeVideo(videoId);
    });

    // ビデオリスト変更時の処理
    this.#videoListManager.setOnVideoListChanged((videoIds) => {
      this.#historyManager.replaceAll(videoIds);
    });
  }

  /**
   * ファイルドロップを設定
   */
  #setupFileDrop() {
    const root = document.querySelector("#library");
    new FileDrop(root, this.#onFileDrop.bind(this));
  }

  /**
   * 検索機能を設定
   */
  #setupSearch() {
    if (this.#youtubeSearchService.isAvailable()) {
      this.#playlistManager.insertPlaylist("Search", []);
      this.#uiManager.setupSearchInput(this.#searchYouTubeVideos.bind(this));
    }
  }

  /**
   * YouTube動画を検索
   * @param {string} keyword - 検索キーワード
   */
  async #searchYouTubeVideos(keyword) {
    try {
      const videoIds = await this.#youtubeSearchService.search(keyword);
      this.#playlistManager.insertPlaylist("Search", videoIds);
    } catch (error) {
      console.error("Error searching YouTube videos:", error);
    }
  }

  /**
   * ファイルドロップ時の処理
   * @param {FileList} files - ドロップされたファイル
   */
  #onFileDrop(files) {
    for (const file of files) {
      if (this.#fileProcessor.canProcess(file)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.#loadList(file.name, e.target.result);
        };
        reader.readAsText(file);
      }
    }
  }

  /**
   * リストを読み込み
   * @param {string} filename - ファイル名
   * @param {string} content - ファイル内容
   */
  #loadList(filename, content) {
    const result = this.#fileProcessor.processFile(filename, content);
    this.#playlistManager.insertPlaylist(result.name, result.videoIds);
  }

  /**
   * 履歴を更新
   */
  #updateHistory() {
    const idx = this.#videoListManager.getSelectedIndex();
    const history = this.#historyManager.getAll();
    this.#playlistManager.insertPlaylist("History", history);

    if (history.length !== 0) {
      // リスト更新時に先頭の動画が選択されてしまう対策
      // 履歴の最後(=選択中だった動画)を選択させる
      this.#videoListManager.handleVideoSelected(history.at(-1));

      // もともと選択されていた動画を選択
      if (idx !== -1) {
        this.#videoListManager.selectByIndex(idx, false);
      }
    }
  }
}
