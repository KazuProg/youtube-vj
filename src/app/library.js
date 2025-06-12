import {
  LibraryManager,
  PlaylistUIComponent,
  VideoListUIComponent,
  LibraryUIManager,
  PlaylistManager,
  VideoListManager,
  YouTubeSearchService,
  FileProcessor,
} from "../core/library/index.js";
import Config from "./config.js";
import History from "./history.js";
import YouTubeTitleFetcher from "./youtube-title-fetcher.js";
import { VideoUtils } from "./utils/VideoUtils.js";

/**
 * ライブラリファサードクラス
 * 依存関係を注入してライブラリを構築
 */
class LibraryFacade {
  #libraryManager;
  #actions;

  constructor() {
    this.#initializeLibrary();
    this.#setupActions();
  }

  /**
   * ライブラリを初期化
   */
  #initializeLibrary() {
    // UI コンポーネントの作成
    const root = document.querySelector("#library");
    const playlistElement = root.querySelector(".playlist");
    const videolistElement = root.querySelector(".videolist");

    // マネージャーの作成（先に作成）
    const playlistManager = new PlaylistManager();
    const videoListManager = new VideoListManager();

    const playlistUI = new PlaylistUIComponent(
      playlistElement,
      (name, videoIds) => playlistManager.handlePlaylistChanged(name, videoIds)
    );

    const videoListUI = new VideoListUIComponent(
      videolistElement,
      (videoId) => videoListManager.handleVideoSelected(videoId),
      (videoIds) => videoListManager.handleVideoListChanged(videoIds),
      YouTubeTitleFetcher
    );

    const uiManager = new LibraryUIManager(playlistUI, videoListUI);

    // マネージャーにUIコンポーネントを設定
    playlistManager.setPlaylistUI(playlistUI);
    videoListManager.setVideoListUI(videoListUI);

    // サービスの作成
    const youtubeSearchService = new YouTubeSearchService(
      Config,
      YouTubeTitleFetcher
    );
    const fileProcessor = new FileProcessor(VideoUtils.parseYouTubeURL.bind(VideoUtils));

    // ビデオコントローラーオブジェクト
    const videoController = {
      changeVideo: (text) => {
        if (window.appManager) {
          window.appManager.changeVideo(text);
        }
      },
    };

    // メインライブラリマネージャーの作成
    this.#libraryManager = new LibraryManager(
      uiManager,
      playlistManager,
      videoListManager,
      youtubeSearchService,
      fileProcessor,
      History,
      videoController
    );

    // コールバックの設定
    playlistManager.setOnPlaylistChanged(this.#onPlaylistChanged.bind(this));
    videoListManager.setOnVideoSelected(this.#onVideoSelected.bind(this));
    videoListManager.setOnVideoListChanged(this.#onVideoListChanged.bind(this));
  }

  /**
   * アクションを設定
   */
  #setupActions() {
    this.#actions = {
      up: this.#libraryManager.navigateUp.bind(this.#libraryManager),
      down: this.#libraryManager.navigateDown.bind(this.#libraryManager),
      changeFocus: this.#libraryManager.changeFocus.bind(this.#libraryManager),
    };
  }

  /**
   * ライブラリを初期化
   */
  init() {
    this.#libraryManager.init();
  }

  /**
   * アクションを取得
   * @returns {Object} - アクションオブジェクト
   */
  get actions() {
    return this.#actions;
  }

  /**
   * 表示状態を取得
   * @returns {boolean} - 表示されているかどうか
   */
  get isVisible() {
    return this.#libraryManager.isVisible;
  }

  /**
   * ライブラリを表示
   */
  show() {
    this.#libraryManager.show();
  }

  /**
   * ライブラリを非表示
   */
  hide() {
    this.#libraryManager.hide();
  }

  /**
   * 履歴に動画を追加
   * @param {string} videoId - 動画ID
   */
  addHistory(videoId) {
    this.#libraryManager.addHistory(videoId);
  }

  /**
   * リストファイルを読み込み
   */
  loadListFile() {
    this.#libraryManager.loadListFile();
  }

  /**
   * 表示状態変更時のコールバックを設定
   * @param {Function} callback - コールバック関数
   */
  set onVisibilityChanged(callback) {
    this.#libraryManager.setOnVisibilityChanged(callback);
  }

  /**
   * プレイリスト変更時の処理
   * @param {string} name - プレイリスト名
   * @param {string[]} videoIds - 動画IDの配列
   */
  #onPlaylistChanged(name, videoIds) {
    // 必要に応じて追加の処理を実装
  }

  /**
   * ビデオ選択時の処理
   * @param {string} videoId - 選択されたビデオID
   */
  #onVideoSelected(videoId) {
    // 必要に応じて追加の処理を実装
  }

  /**
   * ビデオリスト変更時の処理
   * @param {string[]} videoIds - 変更されたビデオIDの配列
   */
  #onVideoListChanged(videoIds) {
    // 必要に応じて追加の処理を実装
  }
}

// シングルトンインスタンスを作成
const Library = new LibraryFacade();

// グローバル空間に公開（既存コードとの互換性のため）
window.Library = Library;

export default Library;
