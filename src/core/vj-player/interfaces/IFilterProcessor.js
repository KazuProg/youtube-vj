/**
 * フィルター処理のインターフェース
 */
export class IFilterProcessor {
  /**
   * フィルターを適用
   * @param {HTMLElement} iframe - iframe要素
   * @param {Object} filterValues - フィルター値
   */
  applyFilter(iframe, filterValues) {
    throw new Error("Method 'applyFilter' must be implemented");
  }

  /**
   * Z-indexを設定
   * @param {HTMLElement} iframe - iframe要素
   * @param {number} zIndex - Z-index値
   */
  setZIndex(iframe, zIndex) {
    throw new Error("Method 'setZIndex' must be implemented");
  }
}
