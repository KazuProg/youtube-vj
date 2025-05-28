import { IFilterProcessor } from "../interfaces/IFilterProcessor.js";

/**
 * フィルター処理の実装
 */
export class FilterProcessor extends IFilterProcessor {
  /**
   * フィルターを適用
   * @param {HTMLElement} iframe - iframe要素
   * @param {Object} filterValues - フィルター値
   */
  applyFilter(iframe, filterValues) {
    const filter = [];

    for (const key in filterValues) {
      if (key === "opacity") continue;

      let cssKey = key;
      if (key === "hueRotate") cssKey = "hue-rotate";

      filter.push(`${cssKey}(${filterValues[key]})`);
    }

    iframe.style.filter = filter.join(" ");
  }

  /**
   * Z-indexを設定
   * @param {HTMLElement} iframe - iframe要素
   * @param {number} zIndex - Z-index値
   */
  setZIndex(iframe, zIndex) {
    iframe.style.zIndex = zIndex;
  }
}
