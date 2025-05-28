# Core モジュール - SOLID 原則に基づくリファクタリング

このディレクトリには、SOLID 原則に基づいてリファクタリングされたコアモジュールが含まれています。

## 構造

```
src/core/
├── constants/          # 定数管理
│   ├── AppConstants.js      # アプリケーション定数
│   ├── StorageConstants.js  # ストレージキー定数
│   └── index.js            # 統合エクスポート
├── storage/           # ストレージ抽象化
│   ├── IStorageProvider.js     # ストレージインターフェース
│   ├── LocalStorageProvider.js # LocalStorage実装
│   └── JsonStorageService.js   # JSON形式ストレージサービス
├── config/            # 設定管理
│   ├── IConfigValidator.js  # 設定検証インターフェース
│   ├── ConfigValidator.js   # 設定検証実装
│   ├── ConfigManager.js     # 設定管理クラス
│   └── Config.js           # 後方互換性ファサード
├── history/           # 履歴管理
│   ├── IHistoryRepository.js # 履歴リポジトリインターフェース
│   ├── HistoryRepository.js  # 履歴リポジトリ実装
│   ├── HistoryManager.js     # 履歴管理ビジネスロジック
│   └── History.js           # 後方互換性ファサード
└── index.js           # 統合エクスポート
```

## SOLID 原則の適用

### 1. Single Responsibility Principle (SRP)

- 各クラスは単一の責任を持つ
- `ConfigManager`: 設定管理のみ
- `HistoryManager`: 履歴管理のみ
- `JsonStorageService`: JSON 形式でのストレージ操作のみ

### 2. Open/Closed Principle (OCP)

- 拡張に開放、修正に閉鎖
- 新しいストレージプロバイダーを追加可能
- 新しい設定検証ルールを追加可能

### 3. Liskov Substitution Principle (LSP)

- インターフェースの実装は置換可能
- `LocalStorageProvider`は`IStorageProvider`と置換可能

### 4. Interface Segregation Principle (ISP)

- 必要なメソッドのみを公開
- 各インターフェースは特定の機能に特化

### 5. Dependency Inversion Principle (DIP)

- 抽象に依存、具象に依存しない
- `ConfigManager`は`JsonStorageService`に依存
- `HistoryManager`は`IHistoryRepository`に依存

## 使用方法

### 新しい API（推奨）

```javascript
import {
  ConfigManager,
  ConfigValidator,
  JsonStorageService,
  LocalStorageProvider,
} from "./core/index.js";

// 依存関係の注入
const storageProvider = new LocalStorageProvider();
const storageService = new JsonStorageService(storageProvider);
const validator = new ConfigValidator();
const configManager = new ConfigManager(storageService, validator);

// 設定の使用
configManager.set("fadeoutVolume", true);
const fadeoutVolume = configManager.get("fadeoutVolume");
```

### 後方互換性 API

```javascript
import Config from "./config.js";
import History from "./history.js";

// 既存のコードはそのまま動作
Config.fadeoutVolume = true;
History.add("videoId123");
```

## 利点

1. **テスタビリティ**: 依存関係の注入により、モックを使用したテストが容易
2. **拡張性**: 新しい機能を既存コードを変更せずに追加可能
3. **保守性**: 各クラスの責任が明確で、変更の影響範囲が限定的
4. **再利用性**: インターフェースベースの設計により、コンポーネントの再利用が容易
5. **後方互換性**: 既存のコードを変更せずに新しい構造を導入
