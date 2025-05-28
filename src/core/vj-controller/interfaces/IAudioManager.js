/**
 * 音量管理のインターフェース
 */
export class IAudioManager {
  /**
   * ミュート状態を取得
   * @returns {boolean} ミュート状態
   */
  get isMuted() {
    throw new Error("isMuted getter must be implemented");
  }

  /**
   * ミュート状態を設定
   * @param {boolean} value - ミュート状態
   */
  set isMuted(value) {
    throw new Error("isMuted setter must be implemented");
  }

  /**
   * 音量を取得
   * @returns {number} 音量
   */
  get volume() {
    throw new Error("volume getter must be implemented");
  }

  /**
   * 音量を設定
   * @param {number} value - 音量
   */
  set volume(value) {
    throw new Error("volume setter must be implemented");
  }

  /**
   * フェードアウト
   */
  fadeoutVolume() {
    throw new Error("fadeoutVolume method must be implemented");
  }
}
