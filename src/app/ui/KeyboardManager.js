/**
 * キーボードショートカットを管理するクラス
 * キーボードイベントの処理とアクションの実行を担当
 */
export class KeyboardManager {
  constructor(channels, dependencies) {
    this.channels = channels;
    this.selectedChannel = null;
    this.dependencies = dependencies; // { Library, openProjectionWindow, requestMidiAccess, midi, prepareVideoId }

    this.setupEventListeners();
  }

  /**
   * 選択されたチャンネルを設定
   * @param {Object|null} channel - 選択されたチャンネル
   */
  setSelectedChannel(channel) {
    this.selectedChannel = channel;
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  /**
   * キーダウンイベントの処理
   * @param {KeyboardEvent} event - キーボードイベント
   */
  handleKeyDown(event) {
    // グローバルショートカット（Ctrl+キー）の処理
    if (this.handleGlobalShortcuts(event)) {
      return;
    }

    // ライブラリ関連のショートカット
    if (this.handleLibraryShortcuts(event)) {
      return;
    }

    // 入力フィールドにフォーカスがある場合はスキップ
    if (this.isInputFocused()) {
      return;
    }

    // その他のショートカット
    if (this.handleOtherShortcuts(event)) {
      return;
    }

    // チャンネル固有のショートカット
    if (this.selectedChannel) {
      this.handleChannelShortcuts(event);
    }
  }

  /**
   * グローバルショートカットの処理
   * @param {KeyboardEvent} event - キーボードイベント
   * @returns {boolean} 処理されたかどうか
   */
  handleGlobalShortcuts(event) {
    if (!event.ctrlKey) return false;

    switch (event.key) {
      case "p":
        this.dependencies.openProjectionWindow();
        event.preventDefault();
        return true;
      case "1":
        this.dispatchChannelSelectEvent(0);
        event.preventDefault();
        return true;
      case "2":
        this.dispatchChannelSelectEvent(1);
        event.preventDefault();
        return true;
      case "m":
        this.handleMidiShortcut();
        event.preventDefault();
        return true;
      case "l":
        if (this.selectedChannel) {
          this.selectedChannel.setVideo(this.dependencies.prepareVideoId());
        }
        event.preventDefault();
        return true;
    }
    return false;
  }

  /**
   * ライブラリ関連のショートカット処理
   * @param {KeyboardEvent} event - キーボードイベント
   * @returns {boolean} 処理されたかどうか
   */
  handleLibraryShortcuts(event) {
    switch (event.key) {
      case "Tab":
        this.dependencies.Library.actions.changeFocus();
        event.preventDefault();
        return true;
      case "ArrowUp":
        this.dependencies.Library.actions.up();
        return true;
      case "ArrowDown":
        this.dependencies.Library.actions.down();
        return true;
    }
    return false;
  }

  /**
   * その他のショートカット処理
   * @param {KeyboardEvent} event - キーボードイベント
   * @returns {boolean} 処理されたかどうか
   */
  handleOtherShortcuts(event) {
    switch (event.key) {
      case "Escape":
        this.dispatchChannelSelectEvent(null);
        event.preventDefault();
        return true;
      case "/":
        document.querySelector("#input-videoId").focus();
        this.dispatchChannelSelectEvent(null);
        event.preventDefault();
        return true;
      case "s":
        this.dispatchSwitchVideoEvent();
        event.preventDefault();
        return true;
    }
    return false;
  }

  /**
   * チャンネル固有のショートカット処理
   * @param {KeyboardEvent} event - キーボードイベント
   */
  handleChannelShortcuts(event) {
    // 数字キー（ホットキュー）の処理
    if (this.handleHotcueShortcuts(event)) {
      return;
    }

    // その他のチャンネル操作
    switch (event.key) {
      case " ":
      case "k":
        if (event.shiftKey) {
          this.selectedChannel.suspendPreview();
        } else {
          this.selectedChannel.togglePlayPause();
        }
        break;
      case "m":
        this.selectedChannel.toggleMuteUnmute();
        break;
      case "ArrowLeft":
        this.selectedChannel.adjustTiming(-5);
        break;
      case "ArrowRight":
        this.selectedChannel.adjustTiming(5);
        break;
      case "j":
        this.selectedChannel.adjustTiming(-10);
        break;
      case "l":
        this.selectedChannel.adjustTiming(10);
        break;
      case ",":
        this.selectedChannel.adjustTiming(-0.1);
        break;
      case ".":
        this.selectedChannel.adjustTiming(+0.1);
        break;
      case "<":
        this.selectedChannel.setSpeed(-0.05, true);
        break;
      case ">":
        this.selectedChannel.setSpeed(+0.05, true);
        break;
      case "ArrowUp":
        this.selectedChannel.setOpacity(+0.05, true);
        break;
      case "ArrowDown":
        this.selectedChannel.setOpacity(-0.05, true);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /**
   * ホットキューショートカットの処理
   * @param {KeyboardEvent} event - キーボードイベント
   * @returns {boolean} 処理されたかどうか
   */
  handleHotcueShortcuts(event) {
    if (event.code.substr(0, 5) === "Digit") {
      const number = parseInt(event.code.substr(5, 1));
      if (!isNaN(number)) {
        if (event.shiftKey) {
          this.selectedChannel.removeHotcue(number);
        } else {
          this.selectedChannel.hotcue(number);
        }
        event.preventDefault();
        return true;
      }
    }
    return false;
  }

  /**
   * MIDIショートカットの処理
   */
  handleMidiShortcut() {
    const midi = this.dependencies.midi();
    if (!midi) {
      this.dependencies.requestMidiAccess();
    } else {
      midi.openCustomScriptEditor();
    }
  }

  /**
   * 入力フィールドにフォーカスがあるかチェック
   * @returns {boolean} フォーカスがあるかどうか
   */
  isInputFocused() {
    const activeElement = document.activeElement;
    return (
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      activeElement.isContentEditable
    );
  }

  /**
   * チャンネル選択イベントを発火
   * @param {number|null} channel - チャンネル番号
   */
  dispatchChannelSelectEvent(channel) {
    const event = new CustomEvent("keyboard:selectChannel", {
      detail: { channel },
    });
    document.dispatchEvent(event);
  }

  /**
   * 動画切り替えイベントを発火
   */
  dispatchSwitchVideoEvent() {
    const event = new CustomEvent("keyboard:switchVideo");
    document.dispatchEvent(event);
  }

  /**
   * イベントリスナーを削除
   */
  destroy() {
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
  }
}
