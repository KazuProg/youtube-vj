"use strict";

class VJPlayerData extends EventEmitter {
  #speed = 1;
  #filter = {};
  #pause = true;
  #timing = {
    timestamp: 0,
    playerTime: 0,
  };
  #videoId = null;
  #loop = {
    start: -1,
    end: -1,
  };

  constructor() {
    super();
    const loop = () => {
      // ループ処理を呼び出すため
      this.currentTime;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  getAll() {
    return {
      speed: this.speed,
      filter: this.filter,
      pause: this.pause,
      timing: this.timing,
      videoId: this.videoId,
      loop: this.loop,
    };
  }

  dispatchAll() {
    const data = this.getAll();
    for (const key in data) {
      this.dispatchEvent("changed", key, data[key], data);
    }
  }

  get speed() {
    return structuredClone(this.#speed);
  }

  set speed(value) {
    this.#speed = value;
    this.dispatchEvent("changed", "speed", value, this.getAll());
  }

  get filter() {
    return structuredClone(this.#filter);
  }

  set filter(value) {
    this.#filter = { ...this.filter, ...value };
    this.dispatchEvent("changed", "filter", value, this.getAll());
  }

  get pause() {
    return structuredClone(this.#pause);
  }

  set pause(value) {
    this.#pause = value;
    this.dispatchEvent("changed", "pause", value, this.getAll());
  }

  get timing() {
    return structuredClone(this.#timing);
  }

  set timing(value) {
    this.#timing = value;
    this.dispatchEvent("changed", "timing", value, this.getAll());
  }

  get videoId() {
    return structuredClone(this.#videoId);
  }

  set videoId(value) {
    this.#videoId = value;
    this.dispatchEvent("changed", "videoId", value, this.getAll());
  }

  get loop() {
    return structuredClone(this.#loop);
  }

  set loop(value) {
    this.#loop = value;
    this.dispatchEvent("changed", "loop", value, this.getAll());
  }

  get currentTime() {
    const TIMING = this.#timing;
    const TIMESTAMP_NOW = new Date() / 1000;

    if (TIMING.timestamp == 0) return 0;
    if (this.#pause) return TIMING.playerTime;

    let expectPlayerTime =
      TIMING.playerTime + (TIMESTAMP_NOW - TIMING.timestamp) * this.#speed;

    if (this.isLoop && this.#loop.end < expectPlayerTime) {
      this.timing = {
        timestamp:
          TIMESTAMP_NOW - (expectPlayerTime - this.#loop.end) / this.#speed,
        playerTime: this.#loop.start,
      };
      expectPlayerTime -= this.#loop.end - this.#loop.start;

      // ループの変更を通知
      this.dispatchEvent("changed", "timing", this.timing, this.getAll());
    }

    return expectPlayerTime;
  }

  get isLoop() {
    return this.loop.start < this.loop.end;
  }

  applyData(data) {
    console.log(data);
    for (const key in data) {
      if (!(key in this)) {
        console.warn(`${key} is not a valid property`);
        continue;
      }
      if (JSON.stringify(this[key]) === JSON.stringify(data[key])) continue;
      this[key] = data[key];
    }
  }
}
