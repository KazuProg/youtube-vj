"use strict";

class EventEmitter {
  #events;

  constructor() {
    this.#events = {};
  }

  addEventListener(type, listener) {
    if (!this.#events[type]) {
      this.#events[type] = [];
    }
    this.#events[type].push(listener);
  }

  removeEventListener(type, listener) {
    if (this.#events[type]) {
      const index = this.#events[type].indexOf(listener);
      if (index !== -1) {
        this.#events[type].splice(index, 1);
      }
    }
  }

  dispatchEvent(type, ...args) {
    if (this.#events[type]) {
      this.#events[type].forEach((listener) => listener(...args));
    }
  }
}
