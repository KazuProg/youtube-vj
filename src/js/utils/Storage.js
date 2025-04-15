/**
 * ローカルストレージを扱うユーティリティクラス
 */
export default class Storage {
  /**
   * 値を保存する
   * @param {string} key - キー
   * @param {any} value - 保存する値
   */
  static save(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      
      // カスタムイベントでストレージの変更を通知
      document.dispatchEvent(
        new CustomEvent('VJPlayerUpdated', {
          detail: {
            key,
            value: serializedValue
          }
        })
      );
      
      return true;
    } catch (error) {
      console.error('ストレージ保存エラー:', error);
      return false;
    }
  }

  /**
   * 値を取得する
   * @param {string} key - キー
   * @param {any} defaultValue - デフォルト値
   * @returns {any} 保存された値、またはデフォルト値
   */
  static load(key, defaultValue = null) {
    try {
      const serializedValue = localStorage.getItem(key);
      
      if (serializedValue === null) {
        return defaultValue;
      }
      
      return JSON.parse(serializedValue);
    } catch (error) {
      console.error('ストレージ読み込みエラー:', error);
      return defaultValue;
    }
  }

  /**
   * 値を削除する
   * @param {string} key - キー
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('ストレージ削除エラー:', error);
      return false;
    }
  }

  /**
   * 全ての値をクリアする
   */
  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('ストレージクリアエラー:', error);
      return false;
    }
  }
  
  /**
   * キーが存在するか確認する
   * @param {string} key - キー
   * @returns {boolean} 存在するかどうか
   */
  static has(key) {
    return localStorage.getItem(key) !== null;
  }
  
  /**
   * 部分的に値を更新する（オブジェクトの場合）
   * @param {string} key - キー
   * @param {Object} partialValue - 更新するオブジェクトの一部
   */
  static update(key, partialValue) {
    const currentValue = this.load(key, {});
    
    if (typeof currentValue !== 'object' || currentValue === null) {
      return this.save(key, partialValue);
    }
    
    const updatedValue = { ...currentValue, ...partialValue };
    return this.save(key, updatedValue);
  }
} 