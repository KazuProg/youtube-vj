# Core モジュール - SOLID 原則に基づくリファクタリング

このディレクトリには、SOLID 原則に基づいてリファクタリングされたコアモジュールが含まれています。

## 全体構造

```
src/
├── app/                # アプリケーション層
│   ├── config.js           # 設定管理（ファサード）
│   ├── history.js          # 履歴管理（ファサード）
│   └── constants.js        # 定数管理（ファサード）
└── core/               # コア層（SOLID原則に基づく実装）
    ├── constants/          # 定数管理
    │   ├── AppConstants.js      # アプリケーション定数
    │   ├── StorageConstants.js  # ストレージキー定数
    │   └── index.js            # 統合エクスポート
    ├── storage/           # ストレージ抽象化
    │   ├── IStorageProvider.js     # ストレージインターフェース
    │   ├── LocalStorageProvider.js # LocalStorage実装
    │   └── JsonStorageService.js   # JSON 形式ストレージサービス
    ├── config/            # 設定管理
    │   ├── IConfigValidator.js  # 設定検証インターフェース
    │   ├── ConfigValidator.js   # 設定検証実装
    │   └── ConfigManager.js     # 設定管理クラス
    ├── history/           # 履歴管理
    │   ├── IHistoryRepository.js # 履歴リポジトリインターフェース
    │   ├── HistoryRepository.js  # 履歴リポジトリ実装
    │   └── HistoryManager.js     # 履歴管理ビジネスロジック
    └── index.js           # 統合エクスポート
```

## アーキテクチャ

### レイヤー構造

1. **Core 層**: SOLID 原則に基づく純粋なビジネスロジック
2. **App 層**: アプリケーション固有のファサード

### 依存関係

```
アプリケーションコード → App層 → Core層
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

### Core 層の直接使用

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

### App 層の使用（推奨）

```javascript
import Config from "./app/config.js";
import History from "./app/history.js";
import { AppConstants } from "./app/constants.js";

// クリーンなAPIで使用
Config.fadeoutVolume = true;
History.add("videoId123");

// 新しいメソッドも利用可能
const historySize = History.getSize();
const latestVideo = History.getLatest();
```

## 利点

1. **テスタビリティ**: 依存関係の注入により、モックを使用したテストが容易
2. **拡張性**: 新しい機能を既存コードを変更せずに追加可能
3. **保守性**: 各クラスの責任が明確で、変更の影響範囲が限定的
4. **再利用性**: インターフェースベースの設計により、コンポーネントの再利用が容易
5. **整理された構造**: 機能ごとに適切なディレクトリに配置
6. **クリーンなアーキテクチャ**: 不要な中間レイヤーを排除

## 移行完了

- 整理されたディレクトリ構造を実現
- Core 層と App 層の明確な分離
- 既存コードの import パスを新しい構造に更新
- SOLID 原則に基づく保守性・拡張性の高い実装
- 後方互換性ファイルを削除し、よりクリーンな構造を実現
