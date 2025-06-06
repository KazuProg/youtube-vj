/**
 * ステータスインジケーターを管理するコンポーネントクラス
 * 各種サービスの状態を視覚的に表示し、クリックイベントを処理します
 */
export class StatusIndicator {
  constructor(config = {}) {
    this.config = {
      containerId: 'status',
      indicators: [
        {
          id: 'library-status',
          label: 'Library',
          hasIndicator: true,
          clickHandler: null,
          contextMenuHandler: null
        },
        {
          id: 'projection-status', 
          label: 'Projection',
          hasIndicator: true,
          clickHandler: null,
          contextMenuHandler: null
        },
        {
          id: 'midi-device-status',
          label: 'MIDI Control',
          hasIndicator: true,
          clickHandler: null,
          contextMenuHandler: null
        },
        {
          id: 'extension-status',
          label: 'Extension',
          hasIndicator: true,
          clickHandler: null,
          contextMenuHandler: null
        }
      ],
      ...config
    };

    this.elements = new Map();
    this.activeStates = new Map();
    this.boundHandlers = new Map();
    
    this.init();
  }

  /**
   * コンポーネントを初期化
   */
  init() {
    this.createElements();
    this.setupEventListeners();
  }

  /**
   * HTML要素を作成
   */
  createElements() {
    const container = document.getElementById(this.config.containerId);
    if (!container) {
      console.error(`Container with id '${this.config.containerId}' not found`);
      return;
    }

    // 既存の要素をクリア（完全にコンポーネントで管理するため）
    container.innerHTML = '';

    // 各インジケーターを作成
    this.config.indicators.forEach(indicatorConfig => {
      const element = this.createIndicatorElement(indicatorConfig);
      container.appendChild(element);
      this.elements.set(indicatorConfig.id, element);
      this.activeStates.set(indicatorConfig.id, false);
    });
  }

  /**
   * 単一のインジケーター要素を作成
   * @param {Object} config - インジケーターの設定
   * @returns {HTMLElement} 作成されたDOM要素
   */
  createIndicatorElement(config) {
    const element = document.createElement('div');
    element.id = config.id;
    element.className = 'clickable';

    if (config.hasIndicator) {
      const indicator = document.createElement('div');
      indicator.className = 'indicator';
      element.appendChild(indicator);
    }

    const label = document.createTextNode(config.label);
    element.appendChild(label);

    return element;
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    this.config.indicators.forEach(indicatorConfig => {
      const element = this.elements.get(indicatorConfig.id);
      if (!element) return;

      // クリックイベント
      if (indicatorConfig.clickHandler) {
        const boundHandler = indicatorConfig.clickHandler.bind(this);
        this.boundHandlers.set(`${indicatorConfig.id}-click`, boundHandler);
        element.addEventListener('click', boundHandler);
      }

      // コンテキストメニューイベント
      if (indicatorConfig.contextMenuHandler) {
        const boundHandler = indicatorConfig.contextMenuHandler.bind(this);
        this.boundHandlers.set(`${indicatorConfig.id}-contextmenu`, boundHandler);
        element.addEventListener('contextmenu', boundHandler);
      }
    });
  }

  /**
   * インジケーターの状態を設定
   * @param {string} indicatorId - インジケーターのID
   * @param {boolean} isActive - アクティブ状態
   */
  setIndicatorState(indicatorId, isActive) {
    const element = this.elements.get(indicatorId);
    if (!element) {
      console.warn(`Indicator with id '${indicatorId}' not found`);
      return;
    }

    const indicator = element.querySelector('.indicator');
    if (!indicator) {
      console.warn(`Indicator element not found in '${indicatorId}'`);
      return;
    }

    const currentState = this.activeStates.get(indicatorId);
    if (currentState === isActive) return; // 状態が変わらない場合は何もしない

    if (isActive) {
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active');
    }

    this.activeStates.set(indicatorId, isActive);
    
    // 状態変更イベントを発火
    this.dispatchStateChangeEvent(indicatorId, isActive);
  }

  /**
   * インジケーターの状態を取得
   * @param {string} indicatorId - インジケーターのID
   * @returns {boolean} アクティブ状態
   */
  getIndicatorState(indicatorId) {
    return this.activeStates.get(indicatorId) || false;
  }

  /**
   * すべてのインジケーターの状態を取得
   * @returns {Object} 全インジケーターの状態
   */
  getAllStates() {
    const states = {};
    this.activeStates.forEach((state, id) => {
      states[id] = state;
    });
    return states;
  }

  /**
   * インジケーターの状態を切り替え
   * @param {string} indicatorId - インジケーターのID
   */
  toggleIndicatorState(indicatorId) {
    const currentState = this.getIndicatorState(indicatorId);
    this.setIndicatorState(indicatorId, !currentState);
  }

  /**
   * イベントハンドラーを更新
   * @param {string} indicatorId - インジケーターのID
   * @param {string} eventType - イベントタイプ ('click' または 'contextmenu')
   * @param {Function} handler - 新しいハンドラー関数
   */
  updateEventHandler(indicatorId, eventType, handler) {
    const element = this.elements.get(indicatorId);
    if (!element) return;

    const handlerKey = `${indicatorId}-${eventType}`;
    const oldHandler = this.boundHandlers.get(handlerKey);
    
    // 古いハンドラーを削除
    if (oldHandler) {
      element.removeEventListener(eventType, oldHandler);
    }

    // 新しいハンドラーを追加
    if (handler) {
      const boundHandler = handler.bind(this);
      this.boundHandlers.set(handlerKey, boundHandler);
      element.addEventListener(eventType, boundHandler);
    }
  }

  /**
   * 状態変更イベントを発火
   * @param {string} indicatorId - インジケーターのID
   * @param {boolean} isActive - アクティブ状態
   */
  dispatchStateChangeEvent(indicatorId, isActive) {
    const event = new CustomEvent('statusIndicator:stateChange', {
      detail: {
        indicatorId,
        isActive,
        timestamp: Date.now()
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * コンポーネントを破棄
   */
  destroy() {
    // イベントリスナーを削除
    this.boundHandlers.forEach((handler, key) => {
      const [indicatorId, eventType] = key.split('-');
      const element = this.elements.get(indicatorId);
      if (element) {
        element.removeEventListener(eventType, handler);
      }
    });

    // 要素を削除
    this.elements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    // 内部状態をクリア
    this.elements.clear();
    this.activeStates.clear();
    this.boundHandlers.clear();
  }

  /**
   * アクセシビリティ属性を設定
   * @param {string} indicatorId - インジケーターのID
   * @param {Object} attributes - 設定する属性
   */
  setAccessibilityAttributes(indicatorId, attributes) {
    const element = this.elements.get(indicatorId);
    if (!element) return;

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  /**
   * インジケーターにツールチップを設定
   * @param {string} indicatorId - インジケーターのID
   * @param {string} tooltip - ツールチップテキスト
   */
  setTooltip(indicatorId, tooltip) {
    const element = this.elements.get(indicatorId);
    if (!element) return;

    element.title = tooltip;
  }
} 