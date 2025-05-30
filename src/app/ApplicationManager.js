import Config from "./config.js";
import Library from "./library.js";
import VJController from "./vj-controller.js";
import YouTubeTitleFetcher from "./youtube-title-fetcher.js";
import templates from "./midi-templates.js";
import { AppConstants } from "./constants.js";
import { UIEventHandlers } from "./ui/UIEventHandlers.js";
import { KeyboardManager } from "./ui/KeyboardManager.js";
import { SeekBarManager } from "./ui/SeekBarManager.js";
import { VideoUtils } from "./utils/VideoUtils.js";

/**
 * アプリケーション全体を管理するメインクラス
 * 各コンポーネントの初期化と連携を担当
 */
export class ApplicationManager {
  constructor() {
    this.channels = [];
    this.selectedChannel = null;
    this.midi = null;
    this.switching = false;
    this.switchingDuration = 1000;

    // UI管理クラス
    this.uiEventHandlers = null;
    this.keyboardManager = null;
    this.seekBarManager = null;

    // イベントリスナーのバインド
    this.boundHandlers = {
      onVideoChanged: this.handleVideoChanged.bind(this),
      onPreviewResumed: this.handlePreviewResumed.bind(this),
      onChannelUnmuted: this.handleChannelUnmuted.bind(this),
      onDataApplied: this.handleDataApplied.bind(this),
      onKeyboardSelectChannel: this.handleKeyboardSelectChannel.bind(this),
      onKeyboardSwitchVideo: this.handleKeyboardSwitchVideo.bind(this),
    };
  }

  /**
   * アプリケーションを初期化
   */
  async initialize() {
    this.setupChannels();
    this.setupUIManagers();
    this.setupEventListeners();
    this.setupExtensionIntegration();
    this.setupStorageSync();
    this.setupVisibilityHandlers();
    this.setupStatusButtons();
    this.setupConfigUI();
    this.initializeServices();
  }

  /**
   * チャンネルを設定
   */
  setupChannels() {
    this.channels[0] = new VJController(0, {
      localStorageKey: AppConstants.LOCAL_STORAGE_KEYS.CTRL_CH_0,
      autoplay: true,
    });
    this.channels[1] = new VJController(1, {
      localStorageKey: AppConstants.LOCAL_STORAGE_KEYS.CTRL_CH_1,
    });

    // グローバル変数として公開（既存コードとの互換性のため）
    window.ch.length = 0; // 既存の配列をクリア
    window.ch.push(...this.channels); // 新しいチャンネルを追加
    window.ch1 = this.channels[0];
    window.ch2 = this.channels[1];
  }

  /**
   * UI管理クラスを設定
   */
  setupUIManagers() {
    // UIイベントハンドラー
    this.uiEventHandlers = new UIEventHandlers(this.channels);
    const eventHandlers = this.uiEventHandlers.getVJControllerEventHandlers();

    // VJControllerイベントの登録
    for (const channel of this.channels) {
      channel.addEventListener("changeVideo", eventHandlers.onChangeVideo);
      channel.addEventListener(
        "suspendPreview",
        eventHandlers.onSuspendPreview
      );
      channel.addEventListener("resumePreview", eventHandlers.onResumePreview);
      channel.addEventListener("timeSyncStart", eventHandlers.onTimeSyncStart);
      channel.addEventListener("timeSyncEnd", eventHandlers.onTimeSyncEnd);
      channel.addEventListener("dataApplied", eventHandlers.onDataApplied);
      channel.addEventListener("hotcueAdded", eventHandlers.onHotcueAdded);
      channel.addEventListener("hotcueRemoved", eventHandlers.onHotcueRemoved);
      channel.addEventListener("muteChange", eventHandlers.onMuteChange);
    }

    // キーボード管理
    this.keyboardManager = new KeyboardManager(this.channels, {
      Library,
      openProjectionWindow: this.openProjectionWindow.bind(this),
      requestMidiAccess: this.requestMidiAccess.bind(this),
      midi: () => this.midi,
      prepareVideoId: () => window.prepareVideoId,
    });

    // シークバー管理
    this.seekBarManager = new SeekBarManager(this.channels);
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // UIイベントハンドラーからのカスタムイベント
    document.addEventListener(
      "ui:videoChanged",
      this.boundHandlers.onVideoChanged
    );
    document.addEventListener(
      "ui:previewResumed",
      this.boundHandlers.onPreviewResumed
    );
    document.addEventListener(
      "ui:channelUnmuted",
      this.boundHandlers.onChannelUnmuted
    );
    document.addEventListener(
      "ui:dataApplied",
      this.boundHandlers.onDataApplied
    );

    // キーボード管理からのカスタムイベント
    document.addEventListener(
      "keyboard:selectChannel",
      this.boundHandlers.onKeyboardSelectChannel
    );
    document.addEventListener(
      "keyboard:switchVideo",
      this.boundHandlers.onKeyboardSwitchVideo
    );
  }

  /**
   * 拡張機能との連携を設定
   */
  setupExtensionIntegration() {
    const relayElement = document.querySelector("#videoId");
    if (relayElement) {
      new MutationObserver(() => {
        document
          .querySelector("#extension-status .indicator")
          ?.classList.add("active");
        this.changeVideo(relayElement.value);
      }).observe(relayElement, {
        attributes: true,
        childList: true,
        characterData: true,
      });
      this.changeVideo(relayElement.value);
    }
  }

  /**
   * ストレージ同期を設定
   */
  setupStorageSync() {
    window.addEventListener("storage", (e) => {
      if (e.key !== AppConstants.LOCAL_STORAGE_KEYS.CTRL_MASTER) return;

      try {
        const oldVal = JSON.parse(e.oldValue || "{}");
        const newVal = JSON.parse(e.newValue || "{}");

        for (const key in newVal) {
          if (JSON.stringify(oldVal[key]) === JSON.stringify(newVal[key])) {
            continue;
          }
          switch (key) {
            case "videoId":
              this.changeVideo(newVal[key]);
              break;
          }
        }
      } catch (error) {
        console.warn("Failed to parse storage event data:", error);
      }
    });
  }

  /**
   * 可視性変更ハンドラーを設定
   */
  setupVisibilityHandlers() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.onInactive();
      } else if (document.visibilityState === "visible") {
        this.onActive();
      }
    });

    window.addEventListener("blur", () => {
      setTimeout(() => {
        if (!document.hasFocus()) {
          this.onInactive();
        }
      }, 0);
    });

    window.addEventListener("focus", () => this.onActive());
  }

  /**
   * ステータスボタンを設定
   */
  setupStatusButtons() {
    // ライブラリボタン
    document.querySelector("#library-status")?.addEventListener("click", () => {
      if (Library.isVisible) {
        Library.hide();
      } else {
        Library.show();
      }
    });

    // プロジェクションボタン
    const projectionStatus = document.querySelector("#projection-status");
    projectionStatus?.addEventListener("click", () =>
      this.openProjectionWindow()
    );
    projectionStatus?.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.openProjectionWindow(true);
    });

    // MIDIボタン
    document
      .querySelector("#midi-device-status")
      ?.addEventListener("click", () => {
        if (!this.midi) {
          this.requestMidiAccess();
        } else {
          this.midi.openCustomScriptEditor(templates);
        }
      });

    // 拡張機能ボタン
    document
      .querySelector("#extension-status")
      ?.addEventListener("click", () => {
        window.open("./docs/chrome-extension.html");
      });
  }

  /**
   * 設定UIを設定
   */
  setupConfigUI() {
    // 設定ポップアップ
    const configPopup = document.querySelector("#config");
    document
      .querySelector("#show-config-editor")
      ?.addEventListener("click", () => {
        configPopup?.classList.remove("hidden");
      });
    document
      .querySelector("#close-config-editor")
      ?.addEventListener("click", () => {
        configPopup?.classList.add("hidden");
      });

    // 設定項目
    const fadeoutCheckbox = document.querySelector("#conf-fadeout");
    if (fadeoutCheckbox) {
      fadeoutCheckbox.checked = Config.fadeoutVolume;
      fadeoutCheckbox.addEventListener("input", (e) => {
        Config.fadeoutVolume = e.target.checked;
      });
    }

    const apiKeyInput = document.querySelector("#conf-ytapikey");
    if (apiKeyInput) {
      apiKeyInput.value = Config.youtubeAPIKey;
      apiKeyInput.addEventListener("input", (e) => {
        Config.youtubeAPIKey = e.target.value;
      });
    }

    const apiReqInput = document.querySelector("#conf-ytapireq");
    if (apiReqInput) {
      apiReqInput.value = Config.youtubeAPIRequests;
      apiReqInput.addEventListener("input", (e) => {
        Config.youtubeAPIRequests = e.target.value;
      });
    }
  }

  /**
   * サービスを初期化
   */
  initializeServices() {
    this.setCrossfader(-1);
    this.openProjectionWindow();
    this.requestMidiAccess(true);
    YouTubeTitleFetcher.init("#ytplayers");
    Library.init();

    Library.onVisibilityChanged = (isVisible) => {
      const indicator = document.querySelector("#library-status .indicator");
      if (isVisible) {
        indicator?.classList.add("active");
      } else {
        indicator?.classList.remove("active");
      }
      Config.openLibrary = isVisible;
    };

    if (Config.openLibrary) {
      Library.show();
    }
  }

  /**
   * 動画変更処理
   * @param {string} text - 動画ID/URL
   */
  changeVideo(text) {
    const parsed = VideoUtils.parseVideoInput(text);
    if (parsed) {
      VideoUtils.updateVideoUI(parsed.id, parsed.start);
    }
  }

  /**
   * チャンネル選択
   * @param {number|null} channel - チャンネル番号
   */
  selectChannel(channel = null) {
    this.selectedChannel = this.channels[channel] || null;
    window.selCh = this.selectedChannel;

    // キーボード管理に選択チャンネルを通知
    this.keyboardManager.setSelectedChannel(this.selectedChannel);

    for (const c of this.channels) {
      const cNum = c.channelNumber;
      const deck = document.querySelector(`.deck.ch${cNum}`);
      if (cNum === channel) {
        deck?.classList.add("selected");
        c.unmute();
        c.resumePreview();
      } else {
        deck?.classList.remove("selected");
        c.mute();
        c.suspendPreview();
      }
    }
    document.querySelector("#input-videoId")?.blur();
  }

  /**
   * 動画切り替え
   */
  switchVideo() {
    if (this.switching) return;
    this.switching = true;

    const intervalTime = 20;
    const crossFaderRange = 2;
    const crossFader = document.querySelector(".crossfader input");
    let val = parseFloat(crossFader?.value || 0);

    const dir = -Math.sign(val);
    const switchingVal =
      dir * (intervalTime / this.switchingDuration) * crossFaderRange;

    const interval = setInterval(() => {
      val += switchingVal;
      if (crossFader) crossFader.value = val;
      this.setCrossfader(val);
      if (Math.abs(val) >= 1) {
        clearInterval(interval);
        this.switching = false;
      }
    }, intervalTime);
  }

  /**
   * クロスフェーダー設定
   * @param {number} val - フェーダー値
   */
  setCrossfader(val) {
    this.updateSystemData({ crossfader: val });
    const crossFaderElement = document.querySelector("#cross-fader");
    if (crossFaderElement) {
      crossFaderElement.value = val;
    }
  }

  /**
   * プロジェクションウィンドウを開く
   * @param {boolean} preview - プレビューモード
   */
  openProjectionWindow(preview = false) {
    const wnd = window.open(
      "./projection.html",
      `YTVJ${preview ? "-Prev" : ""}`,
      "width=640,height=360"
    );

    if (!preview && wnd) {
      document
        .querySelector("#projection-status .indicator")
        ?.classList.add("active");
      const checkInterval = setInterval(() => {
        if (wnd.closed) {
          clearInterval(checkInterval);
          document
            .querySelector("#projection-status .indicator")
            ?.classList.remove("active");
        }
      }, 500);
    }
  }

  /**
   * MIDI アクセスを要求
   * @param {boolean} startup - 起動時かどうか
   */
  async requestMidiAccess(startup = false) {
    if (startup && !this.loadSystemData()?.midiAccess) {
      return;
    }

    if (!this.midi) {
      this.midi = new MIDIScriptManager("YouTube-VJ", {
        executeScript: true,
      });
    }

    try {
      await this.midi.requestAccess();
      this.updateSystemData({ midiAccess: true });
      document
        .querySelector("#midi-device-status .indicator")
        ?.classList.add("active");
    } catch (error) {
      this.updateSystemData({ midiAccess: false });
      this.midi = null;
      alert("Failed to access MIDI device.");
    }
  }

  /**
   * アクティブ時の処理
   */
  onActive() {
    if (Config.fadeoutVolume && this.selectedChannel) {
      this.selectedChannel.unmute();
    }
  }

  /**
   * 非アクティブ時の処理
   */
  onInactive() {
    if (Config.fadeoutVolume && this.selectedChannel) {
      this.selectedChannel.fadeoutVolume();
    }
  }

  /**
   * システムデータを読み込み
   * @returns {Object|null} システムデータ
   */
  loadSystemData() {
    try {
      return JSON.parse(
        localStorage.getItem(AppConstants.LOCAL_STORAGE_KEYS.CTRL_MASTER) ||
          "{}"
      );
    } catch (error) {
      return {};
    }
  }

  /**
   * システムデータを更新
   * @param {Object} obj - 更新データ
   */
  updateSystemData(obj) {
    const currentData = this.loadSystemData();
    const newData = { ...currentData, ...obj };
    localStorage.setItem(
      AppConstants.LOCAL_STORAGE_KEYS.CTRL_MASTER,
      JSON.stringify(newData)
    );
  }

  // イベントハンドラー
  handleVideoChanged(event) {
    const { channel, videoId } = event.detail;
    Library.addHistory(videoId);
    this.selectChannel(channel);
  }

  handlePreviewResumed(event) {
    const { channel } = event.detail;
    this.selectChannel(channel);
  }

  handleChannelUnmuted(event) {
    const { channel } = event.detail;
    this.selectChannel(channel);
  }

  handleDataApplied(event) {
    const { channel } = event.detail;
    this.selectChannel(channel);
  }

  handleKeyboardSelectChannel(event) {
    const { channel } = event.detail;
    this.selectChannel(channel);
  }

  handleKeyboardSwitchVideo() {
    this.switchVideo();
  }

  /**
   * アプリケーションを破棄
   */
  destroy() {
    // イベントリスナーの削除
    document.removeEventListener(
      "ui:videoChanged",
      this.boundHandlers.onVideoChanged
    );
    document.removeEventListener(
      "ui:previewResumed",
      this.boundHandlers.onPreviewResumed
    );
    document.removeEventListener(
      "ui:channelUnmuted",
      this.boundHandlers.onChannelUnmuted
    );
    document.removeEventListener(
      "ui:dataApplied",
      this.boundHandlers.onDataApplied
    );
    document.removeEventListener(
      "keyboard:selectChannel",
      this.boundHandlers.onKeyboardSelectChannel
    );
    document.removeEventListener(
      "keyboard:switchVideo",
      this.boundHandlers.onKeyboardSwitchVideo
    );

    // UI管理クラスの破棄
    this.keyboardManager?.destroy();
    this.seekBarManager?.destroy();
  }
}

// グローバル関数として公開（既存コードとの互換性のため）
window.setCrossfader = (val) => {
  if (window.appManager) {
    window.appManager.setCrossfader(val);
  }
};

window.selectCh = (channel) => {
  if (window.appManager) {
    window.appManager.selectChannel(channel);
  }
};

window.changeVideo = (text) => {
  if (window.appManager) {
    window.appManager.changeVideo(text);
  }
};

window.openProjectionWindow = (preview) => {
  if (window.appManager) {
    window.appManager.openProjectionWindow(preview);
  }
};

window.openYouTubeWindow = () => {
  window.open("https://www.youtube.com/", "YouTube", "width=640,height=960");
};

// 後方互換性のためのエクスポート
export { VideoUtils };
