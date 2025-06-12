import { IAudioManager } from "../interfaces/IAudioManager.js";

/**
 * 音量管理の実装
 */
export class AudioManager extends IAudioManager {
  #player;
  #volume = 100;
  #isMuted = false;
  #onMuteChange;

  /**
   * @param {Object} player - プレイヤー
   * @param {Function} onMuteChange - ミュート変更コールバック
   */
  constructor(player, onMuteChange) {
    super();
    this.#player = player;
    this.#onMuteChange = onMuteChange;
  }

  /**
   * ミュート状態を取得
   * @returns {boolean} ミュート状態
   */
  get isMuted() {
    return this.#isMuted;
  }

  /**
   * ミュート状態を設定
   * @param {boolean} value - ミュート状態
   */
  set isMuted(value) {
    if (value) {
      this.#player.mute();
    } else {
      this.#player.unMute();
      this.#player.setVolume(this.#volume);
    }
    if (value === this.#isMuted) return;
    this.#isMuted = value;
    if (this.#onMuteChange) {
      this.#onMuteChange(value);
    }
  }

  /**
   * 音量を取得
   * @returns {number} 音量
   */
  get volume() {
    return this.#volume;
  }

  /**
   * 音量を設定
   * @param {number} value - 音量
   */
  set volume(value) {
    this.#volume = value;
    this.#player.setVolume(value);
  }

  /**
   * プレイヤーを取得
   * @returns {Object} プレイヤー
   */
  getPlayer() {
    return this.#player;
  }

  /**
   * フェードアウト
   */
  fadeoutVolume() {
    this.#isMuted = true;
    const fadeout = setInterval(() => {
      if (!this.#isMuted) {
        clearInterval(fadeout);
        return;
      }

      this.#player.setVolume(this.#player.getVolume() - 1);

      if (this.#player.getVolume() <= 0) {
        clearInterval(fadeout);
      }
    }, 20);
  }
}
