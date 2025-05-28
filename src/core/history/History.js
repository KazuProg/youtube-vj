import { HistoryManager } from "./HistoryManager.js";
import { HistoryRepository } from "./HistoryRepository.js";
import { JsonStorageService } from "../storage/JsonStorageService.js";
import { LocalStorageProvider } from "../storage/LocalStorageProvider.js";

/**
 * 後方互換性を保つためのHistoryクラス
 * Facade Pattern: 複雑なサブシステムへの簡単なインターフェースを提供
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
}

const History = new _HistoryManager();

export default History;
