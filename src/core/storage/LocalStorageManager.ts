type Listener = () => void;

export default class LocalStorageManager<T> {
  private key: string;
  private defaultValue: T;
  private overwrite: boolean;
  private value: T;
  private listeners = new Set<Listener>();

  constructor(key: string, defaultValue: T, overwrite = false) {
    this.key = key;
    this.defaultValue = defaultValue;
    this.overwrite = overwrite;
    this.value = this.load();

    window.addEventListener("storage", this.handleStorageEvent);
  }

  private load(): T {
    if (this.overwrite) {
      return this.defaultValue;
    }
    try {
      const item = localStorage.getItem(this.key);
      return item ? JSON.parse(item) : this.defaultValue;
    } catch {
      return this.defaultValue;
    }
  }

  private handleStorageEvent = (e: StorageEvent) => {
    if (e.key === this.key) {
      this.value = e.newValue ? JSON.parse(e.newValue) : this.defaultValue;
      this.emit();
    }
  };

  private emit() {
    for (const callback of this.listeners) {
      callback();
    }
  }

  subscribe = (callback: Listener) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };

  getSnapshot = () => {
    return this.value;
  };

  set(newValue: T) {
    this.value = newValue;
    localStorage.setItem(this.key, JSON.stringify(newValue));
    this.emit();
  }

  clear() {
    this.value = this.defaultValue;
    localStorage.removeItem(this.key);
    this.emit();
  }

  cleanup() {
    window.removeEventListener("storage", this.handleStorageEvent);
    this.listeners.clear();
  }
}
