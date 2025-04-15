/**
 * イベントエミッタークラス - カスタムイベントの発行・購読のためのシンプルな実装
 */
export default class EventEmitter {
  constructor() {
    this._events = {};
  }

  /**
   * イベントリスナーを追加する
   * @param {string} eventName - イベント名
   * @param {function} listener - コールバック関数
   */
  addEventListener(eventName, listener) {
    if (!this._events[eventName]) {
      this._events[eventName] = [];
    }
    this._events[eventName].push(listener);
    return this;
  }

  /**
   * イベントリスナーを削除する
   * @param {string} eventName - イベント名
   * @param {function} listener - コールバック関数
   */
  removeEventListener(eventName, listener) {
    if (!this._events[eventName]) return this;
    
    const index = this._events[eventName].indexOf(listener);
    if (index !== -1) {
      this._events[eventName].splice(index, 1);
    }
    return this;
  }

  /**
   * 特定のイベント名のすべてのリスナーを削除する
   * @param {string} eventName - イベント名
   */
  removeAllListeners(eventName) {
    if (eventName) {
      delete this._events[eventName];
    } else {
      this._events = {};
    }
    return this;
  }

  /**
   * イベントを発行する
   * @param {string} eventName - イベント名
   * @param {...any} args - リスナーに渡される引数
   */
  dispatchEvent(eventName, ...args) {
    if (!this._events[eventName]) return false;
    
    const listeners = this._events[eventName].slice();
    for (const listener of listeners) {
      listener.apply(this, args);
    }
    return true;
  }

  /**
   * イベントリスナーを1回だけ実行するように登録
   * @param {string} eventName - イベント名
   * @param {function} listener - コールバック関数
   */
  once(eventName, listener) {
    const onceWrapper = (...args) => {
      this.removeEventListener(eventName, onceWrapper);
      listener.apply(this, args);
    };
    
    return this.addEventListener(eventName, onceWrapper);
  }

  // エイリアス
  on(eventName, listener) {
    return this.addEventListener(eventName, listener);
  }

  off(eventName, listener) {
    return this.removeEventListener(eventName, listener);
  }

  emit(eventName, ...args) {
    return this.dispatchEvent(eventName, ...args);
  }
} 