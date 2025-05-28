import { HistoryManager } from "../core/history/HistoryManager.js";
import { HistoryRepository } from "../core/history/HistoryRepository.js";
import { JsonStorageService } from "../core/storage/JsonStorageService.js";
import { LocalStorageProvider } from "../core/storage/LocalStorageProvider.js";

/**
 * YouTube再生履歴を管理するクラス
 * 新しいSOLID原則に基づく実装を使用
 */
class _HistoryManager {
  #historyManager;

  constructor() {
    // 依存関係の注入
    const storageProvider = new LocalStorageProvider();
    const storageService = new JsonStorageService(storageProvider);
    const repository = new HistoryRepository(storageService);

    this.#historyManager = new HistoryManager(repository);
  }

  getAll() {
    return this.#historyManager.getAll();
  }

  add(videoId) {
    return this.#historyManager.add(videoId);
  }

  replaceAll(videoIds) {
    this.#historyManager.replaceAll(videoIds);
  }

  clear() {
    this.#historyManager.clear();
  }

  // 新しいメソッドも公開
  getSize() {
    return this.#historyManager.getSize();
  }

  getLatest() {
    return this.#historyManager.getLatest();
  }
}

const History = new _HistoryManager();

export default History;
