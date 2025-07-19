/**
 * ライブラリUI管理クラス
 * ライブラリ全体のUI状態と表示を管理
 */
export class LibraryUIManager {
  #UIElements;
  #playlistUI;
  #videoListUI;
  #focusedComponent;
  #onVisibilityChanged;

  constructor(playlistUI, videoListUI) {
    this.#playlistUI = playlistUI;
    this.#videoListUI = videoListUI;
    this.#initializeUIElements();
  }

  /**
   * UI要素を初期化
   */
  #initializeUIElements() {
    const root = document.querySelector("#library");
    this.#UIElements = {
      library: root,
      playlist: root.querySelector(".playlist"),
      videolist: root.querySelector(".videolist"),
      searchInput: root.querySelector("#search-keyword"),
    };
  }

  /**
   * 表示状態を取得
   * @returns {boolean} - 表示されているかどうか
   */
  get isVisible() {
    return !this.#UIElements.library.classList.contains("hidden");
  }

  /**
   * ライブラリを表示
   */
  show() {
    this.#focusVideoList();
    this.#UIElements.library.classList.remove("hidden");
    if (typeof this.#onVisibilityChanged === "function") {
      this.#onVisibilityChanged(true);
    }
  }

  /**
   * ライブラリを非表示
   */
  hide() {
    this.#UIElements.library.classList.add("hidden");
    if (typeof this.#onVisibilityChanged === "function") {
      this.#onVisibilityChanged(false);
    }
  }

  /**
   * 上方向のナビゲーション
   */
  navigateUp() {
    if (this.#focusedComponent) {
      this.#focusedComponent.navigateUp();
    }
  }

  /**
   * 下方向のナビゲーション
   */
  navigateDown() {
    if (this.#focusedComponent) {
      this.#focusedComponent.navigateDown();
    }
  }

  /**
   * フォーカスを切り替え
   */
  changeFocus() {
    if (this.#UIElements.playlist.classList.contains("focused")) {
      this.#focusVideoList();
    } else {
      this.#focusPlaylist();
    }
  }

  /**
   * 検索入力の表示状態を設定
   * @param {boolean} visible - 表示するかどうか
   */
  setSearchInputVisible(visible) {
    if (visible) {
      this.#UIElements.searchInput.classList.remove("hidden");
    } else {
      this.#UIElements.searchInput.classList.add("hidden");
    }
  }

  /**
   * 検索入力にイベントリスナーを設定
   * @param {Function} onSearch - 検索実行時のコールバック
   */
  setupSearchInput(onSearch) {
    // Enterキーでの即座検索
    this.#UIElements.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const keyword = this.#UIElements.searchInput.value.trim();
        if (keyword.length > 0) {
          onSearch(keyword);
        }
      }
    });
  }

  /**
   * 表示状態変更時のコールバックを設定
   * @param {Function} callback - コールバック関数
   */
  setOnVisibilityChanged(callback) {
    this.#onVisibilityChanged = callback;
  }

  /**
   * プレイリストにフォーカス
   */
  #focusPlaylist() {
    this.#playlistUI.setFocused(true);
    this.#videoListUI.setFocused(false);
    this.#focusedComponent = this.#playlistUI;
  }

  /**
   * ビデオリストにフォーカス
   */
  #focusVideoList() {
    this.#playlistUI.setFocused(false);
    this.#videoListUI.setFocused(true);
    this.#focusedComponent = this.#videoListUI;
  }
}
