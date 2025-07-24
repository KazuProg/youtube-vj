# YouTube VJ Web App

YouTube iframe API を活用した VJ (Video Jockey) Web アプリケーションです。

## 🎯 特徴

- **YouTube 動画制御**: 再生、一時停止、速度変更、音量調整
- **外部制御**: `forwardRef`を使用した親子コンポーネント間の通信
- **型安全**: TypeScript による型チェック
- **高品質コード**: Biome によるリント・フォーマット

## 🛠️ 技術スタック

- **React 19** + **TypeScript**
- **Vite** - 高速ビルドツール
- **Biome** - 高速リンター・フォーマッター
- **Husky** + **lint-staged** - Git hooks による品質管理
- **react-youtube** - YouTube iframe API

## 🚀 開発環境セットアップ

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

## 📋 利用可能なコマンド

### 開発・ビルド

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run preview  # ビルド結果のプレビュー
```

### コード品質

```bash
npm run check        # Biome: リント + フォーマット チェック
npm run check:fix    # Biome: 自動修正
npm run lint         # リントのみ
npm run format       # フォーマットのみ
npm run type-check   # TypeScript型チェック
```

## 🔧 Git Hooks による品質管理

### Pre-commit Hook

コミット前に自動実行される品質チェック：

- **Biome**: リント・フォーマット自動修正
- **TypeScript**: 型チェック

### Commit-msg Hook

**[Conventional Commits](https://www.conventionalcommits.org/)** 準拠のコミットメッセージ形式チェック：

```
<type>(<scope>): <description>

例:
feat: add user authentication
feat(auth): implement login functionality
fix: resolve memory leak in video player
docs: update API documentation
style: fix indentation in components
```

#### 標準タイプ（Conventional Commits 準拠）

- `feat` - 新機能の追加
- `fix` - バグ修正
- `docs` - ドキュメントのみの変更
- `style` - コードの意味に影響しない変更（フォーマット等）
- `refactor` - バグ修正でも機能追加でもないコード変更
- `perf` - パフォーマンスを向上させるコード変更
- `test` - テストの追加や既存テストの修正
- `chore` - ビルドプロセスや補助ツール・ライブラリの変更
- `ci` - CI 設定ファイルとスクリプトの変更
- `build` - ビルドシステムや外部依存関係に影響する変更

## 🎮 YouTube Player API

### 基本制御

- `play()` - 再生
- `pause()` - 一時停止
- `mute()` / `unmute()` - ミュート制御
- `setSpeed(rate)` - 再生速度変更 (0.25x, 0.5x, 1x, 2x)
- `setVolume(volume)` - 音量調整 (0-100)

### 使用例

```tsx
const playerRef = useRef<YouTubePlayerRef>(null);

// 再生
playerRef.current?.play();

// 2倍速に変更
playerRef.current?.setSpeed(2);
```

## 🧪 開発のヒント

1. **品質チェック**: `npm run check` でコミット前に品質確認
2. **型安全**: TypeScript の型エラーは必ず修正
3. **コミット形式**: [Conventional Commits](https://www.conventionalcommits.org/) 準拠
4. **自動修正**: Biome が自動でフォーマット・リント修正

## 🤖 開発環境自動化

### Cursor 開発環境

このプロジェクトは Cursor IDE で最適化されており、以下の自動化ルールが設定されています：

- **自動コミットワークフロー**: 「コミットして」で Conventional Commits 準拠の自動コミット
- **ドキュメント同期**: コード変更時に関連ドキュメントの更新を自動提案
- **安全なコマンド実行**: 破壊的操作を防ぐ安全対策

### 自動コミット機能

```bash
# 手動ステージング後、自動でコミット
git add <files>
# チャットで「コミットして」と入力
```

**特徴:**

- 既存のステージング済みファイルのみ処理
- 自動的な`git add`は実行されない（安全性重視）
- Conventional Commits 準拠のメッセージ自動生成

### 🔄 旧ルールから新ルールへの移行ガイド

| 旧ルール        | 新ルール（Conventional Commits）                              | 例                                                           |
| --------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| `upd: 機能改良` | `feat: 新機能追加` または `fix: バグ修正`                     | `upd: improve button` → `feat: enhance button functionality` |
| `rm: 削除`      | `refactor: リファクタリング` または `chore: 不要ファイル削除` | `rm: old components` → `refactor: remove unused components`  |
| `add: 追加`     | `feat: 新機能追加`                                            | `add: new utils` → `feat: add utility functions`             |

## 📁 プロジェクト構造

```
src/
├── components/
│   ├── YouTubePlayer.tsx      # YouTube プレイヤーコンポーネント
│   └── YouTubeController.tsx  # 制御パネルコンポーネント
├── App.tsx                    # アプリケーションルート
└── main.tsx                   # エントリーポイント
```
