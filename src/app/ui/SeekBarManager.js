/**
 * シークバーの操作を管理するクラス
 * シークバーのマウスイベントと表示更新を担当
 */
export class SeekBarManager {
  constructor(channels) {
    this.channels = channels;
    this.seekBars = [];
    this.indicators = [];

    this.setupSeekBars();
    this.startUpdateLoop();
  }

  /**
   * シークバーの初期設定
   */
  setupSeekBars() {
    for (let i = 0; i < this.channels.length; i++) {
      this.setupChannelSeekBar(i);
    }
  }

  /**
   * 指定チャンネルのシークバーを設定
   * @param {number} channelIndex - チャンネルインデックス
   */
  setupChannelSeekBar(channelIndex) {
    const seekBar = document.querySelector(`.deck.ch${channelIndex} .seek-bar`);
    const indicator = seekBar?.querySelector(".indicator");

    if (!seekBar || !indicator) {
      console.warn(`SeekBar not found for channel ${channelIndex}`);
      return;
    }

    this.seekBars[channelIndex] = seekBar;
    this.indicators[channelIndex] = indicator;

    // イベントリスナーの設定
    seekBar.addEventListener("mousemove", (e) =>
      this.handleMouseMove(channelIndex, e)
    );
    seekBar.addEventListener("mouseleave", () =>
      this.handleMouseLeave(channelIndex)
    );
    seekBar.addEventListener("click", (e) => this.handleClick(channelIndex, e));
  }

  /**
   * マウス移動時の処理
   * @param {number} channelIndex - チャンネルインデックス
   * @param {MouseEvent} event - マウスイベント
   */
  handleMouseMove(channelIndex, event) {
    const ratio = this.getRatio(this.seekBars[channelIndex], event);
    const indicator = this.indicators[channelIndex];

    if (indicator) {
      indicator.classList.add("hovering");
      indicator.style.left = `${ratio * 100}%`;
    }
  }

  /**
   * マウスリーブ時の処理
   * @param {number} channelIndex - チャンネルインデックス
   */
  handleMouseLeave(channelIndex) {
    const indicator = this.indicators[channelIndex];
    if (indicator) {
      indicator.classList.remove("hovering");
    }
  }

  /**
   * クリック時の処理
   * @param {number} channelIndex - チャンネルインデックス
   * @param {MouseEvent} event - マウスイベント
   */
  handleClick(channelIndex, event) {
    this.seek(this.channels[channelIndex], this.seekBars[channelIndex], event);
  }

  /**
   * 要素内での相対位置を取得
   * @param {HTMLElement} element - 要素
   * @param {MouseEvent} event - マウスイベント
   * @returns {number} 相対位置（0-1）
   */
  getRatio(element, event) {
    const rect = element.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    return Math.max(0, Math.min(1, clickX / rect.width));
  }

  /**
   * シーク処理
   * @param {Object} player - プレイヤーオブジェクト
   * @param {HTMLElement} element - シークバー要素
   * @param {MouseEvent} event - マウスイベント
   */
  seek(player, element, event) {
    const ratio = this.getRatio(element, event);
    const seekTime = player.duration * ratio;
    player.setTime(seekTime);
  }

  /**
   * シークバーの表示を更新
   */
  updateSeekBars() {
    for (let i = 0; i < this.channels.length; i++) {
      this.updateChannelSeekBar(i);
    }
  }

  /**
   * 指定チャンネルのシークバー表示を更新
   * @param {number} channelIndex - チャンネルインデックス
   */
  updateChannelSeekBar(channelIndex) {
    try {
      const channel = this.channels[channelIndex];
      const deck = document.querySelector(`.deck.ch${channelIndex}`);

      if (!deck || !channel) return;

      const bar = deck.querySelector(".seek-bar .bar");
      const indicator = deck.querySelector(".seek-bar .indicator");
      const currentTimeElement = deck.querySelector(".time .current");
      const durationElement = deck.querySelector(".time .duration");

      if (!bar || !indicator) return;

      const progress =
        channel.duration > 0
          ? (channel.currentTime / channel.duration) * 100
          : 0;
      const cssValue = `${progress}%`;

      // プログレスバーの更新
      bar.style.width = cssValue;

      // インジケーターの更新（ホバー中でない場合のみ）
      if (!indicator.classList.contains("hovering")) {
        indicator.style.left = cssValue;
      }

      // 時間表示の更新
      if (currentTimeElement) {
        currentTimeElement.innerText = this.formatTime(channel.currentTime);
      }
      if (durationElement) {
        durationElement.innerText = this.formatTime(channel.duration);
      }
    } catch (error) {
      // エラーは無視（チャンネルが初期化されていない場合など）
    }
  }

  /**
   * 時間をフォーマット
   * @param {number} sec - 秒数
   * @returns {string} フォーマットされた時間文字列
   */
  formatTime(sec) {
    if (!sec || isNaN(sec)) return "0:00";

    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    const formattedSeconds = String(seconds).padStart(2, "0");

    return `${minutes}:${formattedSeconds}`;
  }

  /**
   * 更新ループを開始
   */
  startUpdateLoop() {
    const update = () => {
      this.updateSeekBars();
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  /**
   * イベントリスナーを削除
   */
  destroy() {
    for (let i = 0; i < this.seekBars.length; i++) {
      const seekBar = this.seekBars[i];
      if (seekBar) {
        // イベントリスナーの削除は複雑なため、実際の実装では
        // AbortControllerを使用することを推奨
        seekBar.replaceWith(seekBar.cloneNode(true));
      }
    }
  }
}
