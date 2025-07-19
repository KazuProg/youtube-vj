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
import { StatusIndicator } from "./ui/StatusIndicator.js";

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
    this.statusIndicator = null;

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

    // ステータスインジケーター管理
    this.statusIndicator = new StatusIndicator({
      indicators: [
        {
          id: 'show-config-editor',
          label: 'Config',
          hasIndicator: false,
          clickHandler: this.handleConfigClick.bind(this)
        },
        {
          id: 'library-status',
          label: 'Library',
          hasIndicator: true,
          clickHandler: this.handleLibraryStatusClick.bind(this)
        },
        {
          id: 'projection-status',
          label: 'Projection',
          hasIndicator: true,
          clickHandler: this.handleProjectionStatusClick.bind(this),
          contextMenuHandler: this.handleProjectionStatusContextMenu.bind(this)
        },
        {
          id: 'midi-device-status',
          label: 'MIDI Control',
          hasIndicator: true,
          clickHandler: this.handleMidiStatusClick.bind(this)
        },
        {
          id: 'extension-status',
          label: 'Extension',
          hasIndicator: true,
          clickHandler: this.handleExtensionStatusClick.bind(this)
        }
      ]
    });
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
        this.statusIndicator.setIndicatorState('extension-status', true);
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
   * 注意: この関数は StatusIndicator コンポーネントで置き換えられました
   * 下のハンドラーメソッドを参照してください
   */
  setupStatusButtons() {
    // StatusIndicator コンポーネントで処理されるため、この関数は空にします
    // 実際のハンドラーは以下のメソッドで定義されています:
    // - handleLibraryStatusClick
    // - handleProjectionStatusClick
    // - handleProjectionStatusContextMenu
    // - handleMidiStatusClick
    // - handleExtensionStatusClick
  }

  /**
   * Configクリックハンドラー
   */
  handleConfigClick() {
    const configPopup = document.querySelector("#config");
    configPopup?.classList.remove("hidden");
  }

  /**
   * ライブラリステータスクリックハンドラー
   */
  handleLibraryStatusClick() {
    if (Library.isVisible) {
      Library.hide();
    } else {
      Library.show();
    }
  }

  /**
   * プロジェクションステータスクリックハンドラー
   */
  handleProjectionStatusClick() {
    this.openProjectionWindow();
  }

  /**
   * プロジェクションステータスコンテキストメニューハンドラー
   */
  handleProjectionStatusContextMenu(e) {
    e.preventDefault();
    this.openProjectionWindow(true);
  }

  /**
   * MIDIステータスクリックハンドラー
   */
  handleMidiStatusClick() {
    if (!this.midi) {
      this.requestMidiAccess();
    } else {
      this.midi.openCustomScriptEditor(templates);
    }
  }

  /**
   * 拡張機能ステータスクリックハンドラー
   */
  handleExtensionStatusClick() {
    window.open("./docs/chrome-extension.html");
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
      this.statusIndicator.setIndicatorState('library-status', isVisible);
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
    const e = new Error("selectChannel method is deprecated. Use keyboardManager.selectChannel instead.");
    console.warn(e.stack)
    console.log(`=== selectChannel(${channel}) - current: ${this.selectedChannel?.channelNumber} ===`);
    
    // 無限ループを防ぐための一時的な保護
    if (this._selectingChannel) {
      console.warn("selectChannel already in progress, skipping to prevent infinite loop");
      return;
    }
    this._selectingChannel = true;
    
    try {
      this.selectedChannel = this.channels[channel] || null;
      window.selCh = this.selectedChannel;

      // キーボード管理に選択チャンネルを通知
      this.keyboardManager.setSelectedChannel(this.selectedChannel);

      // イベント発火を一時的に無効化
      this._suppressEvents = true;

      // UIEventHandlersのdispatchCustomEventを一時的に無効化
      const originalDispatchCustomEvent = this.uiEventHandlers.dispatchCustomEvent;
      this.uiEventHandlers.dispatchCustomEvent = (eventName, detail) => {
        // selectChannelを引き起こすイベントのみ抑制
        const suppressedEvents = ['previewResumed', 'channelUnmuted', 'dataApplied', 'videoChanged'];
        if (suppressedEvents.includes(eventName)) {
          console.log(`dispatchCustomEvent suppressed: ${eventName}`);
          return;
        }
        // その他のイベント（suspendPreviewなど）は正常に発火
        originalDispatchCustomEvent.call(this.uiEventHandlers, eventName, detail);
      };

      for (const c of this.channels) {
        const cNum = c.channelNumber;
        const deck = document.querySelector(`.deck.ch${cNum}`);
        if (cNum === channel) {
          console.log(`Activating channel ${cNum}`);
          deck?.classList.add("selected");
          c.unmute();
          // 正常なresumePreviewを呼ぶ（UIイベントは発火するが、カスタムイベントは抑制される）
          c.resumePreview();
        } else {
          console.log(`Deactivating channel ${cNum}`);
          deck?.classList.remove("selected");
          c.mute();
          if (this.channels[cNum]?.isSuspended) {
            // 既にサスペンド状態なら何もしない
            console.log(`Channel ${cNum} is already suspended`);
            continue;
          }

          if (c) {
            console.log(`Calling suspendPreview on channel ${cNum}`);
            c.suspendPreview();
            
            // デバッグ：実際にsuspendPreviewが効いているかチェック
            const ytPlayer = c.YTPlayer;
            if (ytPlayer) {
              console.log(`Channel ${cNum} player state after suspendPreview:`, ytPlayer.getPlayerState());
              console.log("YT.PlayerState constants:", {
                UNSTARTED: YT.PlayerState.UNSTARTED,
                ENDED: YT.PlayerState.ENDED,
                PLAYING: YT.PlayerState.PLAYING,
                PAUSED: YT.PlayerState.PAUSED,
                BUFFERING: YT.PlayerState.BUFFERING,
                CUED: YT.PlayerState.CUED
              });
            } else {
              console.log(`Channel ${cNum} YTPlayer not found`);
            }
          }
        }
      }

      // UIEventHandlersのdispatchCustomEventを復元
      this.uiEventHandlers.dispatchCustomEvent = originalDispatchCustomEvent;
      document.querySelector("#input-videoId")?.blur();
      console.log(`=== selectChannel(${channel}) completed ===`);
    } finally {
      // 少し遅延してからイベント抑制を解除（非同期イベントをブロック）
      setTimeout(() => {
        this._suppressEvents = false;
        this._selectingChannel = false;
        console.log("Event suppression released");
      }, 100);
    }
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
      this.statusIndicator.setIndicatorState('projection-status', true);
      const checkInterval = setInterval(() => {
        if (wnd.closed) {
          clearInterval(checkInterval);
          this.statusIndicator.setIndicatorState('projection-status', false);
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
      this.statusIndicator.setIndicatorState('midi-device-status', true);
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
    if (this._suppressEvents) {
      console.log("DEBUG: handleVideoChanged - suppressed by _suppressEvents flag");
      return;
    }
    const { channel, videoId } = event.detail;
    console.log("DEBUG: handleVideoChanged called", { channel, videoId, currentSelected: this.selectedChannel?.channelNumber });
    Library.addHistory(videoId);
    
    // 現在選択されているチャンネル以外からのvideoChangedイベントは無視
    if (this.selectedChannel && this.selectedChannel.channelNumber !== channel) {
      console.log("DEBUG: handleVideoChanged - ignoring event from non-selected channel");
      return;
    }
    
    // 既に同じチャンネルが選択されている場合はスキップ
    if (this.selectedChannel?.channelNumber !== channel) {
      console.log("DEBUG: handleVideoChanged - calling selectChannel");
      this.selectChannel(channel);
    } else {
      console.log("DEBUG: handleVideoChanged - skipping selectChannel (same channel)");
    }
  }

  handlePreviewResumed(event) {
    if (this._suppressEvents) {
      console.log("DEBUG: handlePreviewResumed - suppressed by _suppressEvents flag");
      return;
    }
    const { channel } = event.detail;
    console.log("DEBUG: handlePreviewResumed called", { 
      channel, 
      currentSelected: this.selectedChannel?.channelNumber,
      selectedChannelExists: !!this.selectedChannel,
      comparison: this.selectedChannel?.channelNumber !== channel
    });
    
    // 現在選択されているチャンネル以外からのpreviewResumedイベントは無視
    if (this.selectedChannel && this.selectedChannel.channelNumber !== channel) {
      console.log("DEBUG: handlePreviewResumed - ignoring event from non-selected channel");
      return;
    }
    
    // 既に同じチャンネルが選択されている場合はスキップ
    if (this.selectedChannel?.channelNumber !== channel) {
      console.log("DEBUG: handlePreviewResumed - calling selectChannel");
      this.selectChannel(channel);
    } else {
      console.log("DEBUG: handlePreviewResumed - skipping selectChannel (same channel)");
    }
  }

  handleChannelUnmuted(event) {
    if (this._suppressEvents) {
      console.log("DEBUG: handleChannelUnmuted - suppressed by _suppressEvents flag");
      return;
    }
    const { channel } = event.detail;
    console.log("DEBUG: handleChannelUnmuted called", { channel, currentSelected: this.selectedChannel?.channelNumber });
    
    // 現在選択されているチャンネル以外からのchannelUnmutedイベントは無視
    if (this.selectedChannel && this.selectedChannel.channelNumber !== channel) {
      console.log("DEBUG: handleChannelUnmuted - ignoring event from non-selected channel");
      return;
    }
    
    // 既に同じチャンネルが選択されている場合はスキップ
    if (this.selectedChannel?.channelNumber !== channel) {
      console.log("DEBUG: handleChannelUnmuted - calling selectChannel");
      this.selectChannel(channel);
    } else {
      console.log("DEBUG: handleChannelUnmuted - skipping selectChannel (same channel)");
    }
  }

  handleDataApplied(event) {
    if (this._suppressEvents) {
      console.log("DEBUG: handleDataApplied - suppressed by _suppressEvents flag");
      return;
    }
    const { channel } = event.detail;
    console.log("DEBUG: handleDataApplied called", { 
      channel, 
      currentSelected: this.selectedChannel?.channelNumber,
      suppressEvents: this._suppressEvents,
      selectingChannel: this._selectingChannel
    });
    console.log("DEBUG: handleDataApplied call stack:", new Error().stack);
    
    // 現在選択されているチャンネル以外からのdataAppliedイベントは無視
    if (this.selectedChannel && this.selectedChannel.channelNumber !== channel) {
      console.log("DEBUG: handleDataApplied - ignoring event from non-selected channel");
      return;
    }
    
    // 既に同じチャンネルが選択されている場合はスキップ
    if (this.selectedChannel?.channelNumber !== channel) {
      console.log("DEBUG: handleDataApplied - calling selectChannel");
      this.selectChannel(channel);
    } else {
      console.log("DEBUG: handleDataApplied - skipping selectChannel (same channel)");
    }
  }

  handleKeyboardSelectChannel(event) {
    // キーボードからの選択は常に実行（ユーザーの明示的な操作のため）
    const { channel } = event.detail;
    console.log("DEBUG: handleKeyboardSelectChannel called", { channel, currentSelected: this.selectedChannel?.channelNumber });
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
    this.statusIndicator?.destroy();
  }
}

// グローバル関数として公開（既存コードとの互換性のため）
window.setCrossfader = (val) => {
  if (window.appManager) {
    window.appManager.setCrossfader(val);
  }
};

window.selectCh = (channel) => {
  console.log("DEBUG: window.selectCh called", { channel });
  console.log("DEBUG: window.selectCh call stack:", new Error().stack);
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

window.switchVideo = () => {
  if (window.appManager) {
    window.appManager.switchVideo();
  }
};

// VideoUtilsをグローバルに公開（UIから使用するため）
window.VideoUtils = VideoUtils;
