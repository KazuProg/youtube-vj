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
- **Tauri 2** - ネイティブアプリケーションフレームワーク
- **Biome** - 高速リンター・フォーマッター
- **Husky** + **lint-staged** - Git hooks による品質管理
- **react-youtube** - YouTube iframe API

## 🚀 開発環境セットアップ

### 前提条件

- **Node.js** 18 以上
- **Rust** 1.70 以上（Tauri 用）
- **システム依存関係**:
  - **Linux**: `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Visual Studio C++ Build Tools

### インストール

```bash
# 依存関係インストール
npm install

# 開発サーバー起動（Web版）
npm run dev

# Tauri開発モード（ネイティブアプリ）
npm run tauri:dev

# プロダクションビルド（Web版）
npm run build

# Tauriビルド（ネイティブアプリ）
npm run tauri:build
```

## 📋 利用可能なコマンド

### 開発・ビルド

```bash
npm run dev         # 開発サーバー起動（Web版）
npm run build       # プロダクションビルド（Web版）
npm run preview     # ビルド結果のプレビュー
npm run tauri:dev   # Tauri開発モード（ネイティブアプリ）
npm run tauri:build # Tauriビルド（ネイティブアプリ）
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

src-tauri/                      # Tauriバックエンド（Rust）
├── src/
│   └── main.rs                # Rustエントリーポイント
├── Cargo.toml                 # Rust依存関係
├── tauri.conf.json            # Tauri設定
└── icons/                      # アプリケーションアイコン
```

## 🖥️ Tauri ネイティブアプリ

このプロジェクトは Tauri を使用してデスクトップアプリケーションとしても動作します。

### 初回セットアップ

1. **Rust のインストール**（未インストールの場合）:

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **システム依存関係のインストール**（Linux の場合）:
   ```bash
   sudo apt update
   sudo apt install libwebkit2gtk-4.1-dev \
     build-essential \
     curl \
     wget \
     libssl-dev \
     libgtk-3-dev \
     libayatana-appindicator3-dev \
     librsvg2-dev
   ```

### アイコンの追加

`src-tauri/icons/` ディレクトリに以下のサイズのアイコンを追加してください：

- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

アイコンがない場合、Tauri CLI がデフォルトアイコンを使用します。

### ビルド成果物

`npm run tauri:build` を実行すると、現在のプラットフォーム用のビルド成果物が生成されます：

- **Linux**: `src-tauri/target/release/bundle/`
- **macOS**: `src-tauri/target/release/bundle/`
- **Windows**: `src-tauri/target/release/bundle/`

### Windows 用 exe ファイルの作成

#### 方法 1: Windows 環境でビルド（推奨）

Windows 環境で以下のコマンドを実行：

```bash
npm run tauri:build
```

または、Windows 用のみをビルド：

```bash
npm run tauri:build:windows
```

ビルド成果物は以下の場所に生成されます：

- **実行ファイル**: `src-tauri/target/release/youtube-vj-react.exe`（または`x86_64-pc-windows-gnu/release/youtube-vj-react.exe`）
- **インストーラー**（Windows 環境でのみ）:
  - MSI: `src-tauri/target/release/bundle/msi/youtube-vj-react_0.0.0_x64_en-US.msi`
  - NSIS: `src-tauri/target/release/bundle/nsis/youtube-vj-react_0.0.0_x64-setup.exe`

#### 方法 2: Linux/macOS からクロスコンパイル

Linux/macOS から Windows 用の exe を作成する場合：

**重要**: `x86_64-pc-windows-msvc`ターゲットは Windows 環境でのみ使用可能です。Linux/macOS からクロスコンパイルする場合は、`x86_64-pc-windows-gnu`ターゲットを使用してください。

1. **Windows 用の Rust ターゲットを追加**:

   ```bash
   # GNUターゲット（Linux/macOSからクロスコンパイル用）
   rustup target add x86_64-pc-windows-gnu

   # MSVCターゲット（Windows環境でのみ使用可能）
   # rustup target add x86_64-pc-windows-msvc
   ```

2. **必要なビルドツールをインストール**:

   **Linux**:

   ```bash
   sudo apt update
   sudo apt install -y \
     gcc-mingw-w64-x86-64 \
     llvm \
     llvm-dev
   ```

   **macOS**:

   ```bash
   brew install mingw-w64 llvm
   ```

3. **ビルド実行**:

   ```bash
   # GNUターゲットでビルド（exeファイルのみ、Linux/macOSから）
   npm run tauri:build:windows

   # インストーラーも作成する場合（NSISが必要、通常はWindows環境で実行）
   npm run tauri:build:windows:installer

   # MSVCターゲットでビルド（Windows環境でのみ）
   # npm run tauri:build:windows:msvc
   ```

   **注意**:

   - クロスコンパイルは複雑で、一部の機能が制限される可能性があります
   - `llvm-rc`（LLVM Resource Compiler）が必要です。インストール後、`which llvm-rc`で確認してください
   - `x86_64-pc-windows-msvc`は Windows 環境でのみ使用可能です
   - **インストーラー作成**: Linux/macOS からインストーラー（MSI/NSIS）を作成するには、NSIS が必要ですが、通常は Windows 環境で実行することを推奨します
   - デフォルトの`tauri:build:windows`は exe ファイルのみを生成します（インストーラーはスキップ）
   - 生成された exe ファイルは `src-tauri/target/x86_64-pc-windows-gnu/release/youtube-vj-react.exe` にあります

#### クロスコンパイル時のエラー対処

**`llvm-rc`が見つからないエラー**:

```bash
# Linux
sudo apt install -y llvm llvm-dev

# インストール確認
which llvm-rc
```

**`gcc-mingw-w64`が見つからないエラー**:

```bash
# Linux
sudo apt install -y gcc-mingw-w64-x86-64
```

#### Windows ビルドの前提条件

Windows 環境でビルドする場合、以下が必要です：

1. **Microsoft Visual Studio C++ Build Tools**:

   - [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) をインストール
   - "Desktop development with C++" ワークロードを選択

2. **Rust**:

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. **Node.js** 18 以上

#### ビルドオプション

特定のターゲットのみをビルドする場合：

```bash
# Windows 64bit (GNU - Linux/macOSからクロスコンパイル可能)
tauri build --target x86_64-pc-windows-gnu

# Windows 64bit (MSVC - Windows環境でのみ)
tauri build --target x86_64-pc-windows-msvc

# Windows 32bit (GNU)
tauri build --target i686-pc-windows-gnu

# デバッグビルド
tauri build --debug
```

**ターゲットの違い**:

- **`x86_64-pc-windows-gnu`**: MinGW-w64 を使用。Linux/macOS からクロスコンパイル可能
- **`x86_64-pc-windows-msvc`**: Microsoft Visual C++を使用。Windows 環境でのみ使用可能

### トラブルシューティング

#### GTK 初期化エラー（Linux）

`Failed to initialize GTK` エラーが発生する場合：

1. **ディスプレイサーバーが実行されていることを確認**:

   ```bash
   echo $DISPLAY
   # または
   echo $XDG_SESSION_TYPE
   ```

2. **SSH 経由で接続している場合**:

   - X11 転送を有効にして接続: `ssh -X user@host`
   - または、Wayland を使用している場合は環境変数を設定:
     ```bash
     export WAYLAND_DISPLAY=wayland-0
     ```

3. **ローカルマシンで実行している場合**:

   - DISPLAY 環境変数を設定:
     ```bash
     export DISPLAY=:0
     # または
     export DISPLAY=:1
     ```

4. **GUI 環境がない場合**:
   - Tauri アプリは GUI アプリケーションのため、X11 または Wayland が必要です
   - リモートサーバーで実行する場合は、X11 転送または VNC を使用してください
