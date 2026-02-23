# MIDI Script Editor 実装方針

## 概要

`midi-script-manager-js` のカスタムスクリプトエディタを参考に、本プロジェクト内で独自実装する。
外部スクリプト（別オリジン）への依存を排除し、`useStorageSync` によるウィンドウ間同期で Controller と MidiScriptEditor ページ間のデータ共有を行う。

---

## 現状の理解

### 参考: midi-script-manager-js のアーキテクチャ

```
[Controller Window]                    [Editor Window (別オリジン)]
     |                                           |
     |  openCustomScriptEditor()                  |
     |  ─────────────────────────────────────>  window.open(url)
     |                                           |
     |  postMessage("requestData")                |
     |  <───────────────────────────────────────  |
     |                                           |
     |  postMessage(keymaps + templates)          |
     |  ───────────────────────────────────────> |
     |                                           |
     |  (storage event で変更検知)                |  postMessage(保存したkeymaps)
     |  <─────────────────────────────────────── |
```

- **PostMessage**: 異なるオリジン間の通信に使用
- **LocalStorage + storage event**: 同一オリジン内の別タブ間で keymap 更新を検知

### 本プロジェクトの構成

- **Controller** (`/controller`): MIDI API を初期化し、`StatusBar` の MIDI クリックで `openCustomScriptEditor` を呼ぶ
- **MidiScriptEditor** (`/midi-script-editor`): 現在はプレースホルダのみ。ここにエディタ UI を実装
- **openCustomScriptEditor**: 現在は `window.open` で別オリジン（kazuprog.github.io）のエディタを開いている

---

## 実装方針

### 1. エディタの起動方法の変更

**現状**: `window.open` で別オリジン URL を開く  
**変更後**: 同一オリジン内で `window.open` により `/midi-script-editor` を新規ウィンドウで開く

- `openCustomScriptEditor` を `window.open('/midi-script-editor', 'MidiScriptEditor', 'width=640,height=720')` に変更
- 同一タブでの遷移は行わない（常に新規ウィンドウ）
- サービス名は本リポジトリ管理下のため、URL パラメータで渡す必要はない

---

### 2. データ同期: PostMessage → useStorageSync

**useStorageSync の特性**:
- `localStorage` + `StorageEvent`（他タブ/ウィンドウ）+ 同タブ内カスタムイベント で変更を検知
- `dataRef`, `setData`, `onChange` を提供

**データ構造（keymap）**:
```typescript
// 1デバイス分の keymap
interface KeymapObject {
  device: { name: string; manufacturer: string };
  service: string;
  mappings: Array<{
    midi: string;      // 例: "n00a" (type + channel + number)
    name?: string;
    script?: { name: string; code: string };
  }>;
}

// 全デバイス分の配列
type KeymapsData = KeymapObject[];
```

**useStorageSync のキー**:
- `LOCAL_STORAGE_KEY.midiScripts`（新規追加）: `"midi_script"`
- デフォルト値: `[]`

**同期フロー**:
1. MidiScriptEditor: `useStorageSync(LOCAL_STORAGE_KEY.midiScripts, [])` で keymaps を読み書き
2. Controller 側の MIDIScriptManager も同一キーで localStorage を読み、デバイス接続時に適用
3. エディタで保存 → `setData` → localStorage 更新 → StorageEvent → Controller が検知 → デバイスにマッピング再適用

---

### 3. MidiScriptEditor ページの機能（midi-script-manager-js と同じ挙動）

| 機能 | 説明 |
|------|------|
| **ヘッダー** | サービス名、接続デバイス名の表示 |
| **キーマップテーブル** | Control / Name / Script の一覧。行クリックでエディタ開く |
| **Export** | 現在デバイスの keymap を JSON でダウンロード |
| **Import** | JSON ファイルを読み込み、keymap を適用 |
| **スクリプトエディタ（モーダル）** | Control Name / Script Name / Script Code の編集。Save / Discard / Delete |
| **テンプレート** | datalist によるスクリプト名候補。テンプレート選択でコード欄にプレースホルダ |
| **リアルタイム値表示** | MIDI 操作時に該当要素の data2 を表示 |
| **ハイライト** | MIDI 操作時に該当行をハイライト＆スクロール |
| **キーボード** | Esc で閉じる、F2 で最新操作要素のエディタを開く |

---

### 4. 必要なモジュール（独自実装）

既存実装（midi-script-manager-js）の構成に従う必要はなく、あくまで参考とする。挙動が元と変わっていなければよい。

| モジュール | 責務 | 配置（参考） |
|-----------|------|--------------|
| **MIDIDevice** | Web MIDI API の入力デバイス管理、MIDIElement の管理、マッピング適用 | `src/pages/MidiScriptEditor/utils/MIDIDevice.ts` |
| **MIDIElement** | 単一の MIDI コントロール（Note/CC）の状態、script 実行 | `src/pages/MidiScriptEditor/utils/MIDIElement.ts` |
| **MIDIMessageTypes** | Note/CC 等の定数 | `src/pages/MidiScriptEditor/constants.ts` |
| **keymap 型** | KeymapObject, Mapping 等の型定義 | `src/pages/MidiScriptEditor/types.ts` |

**注意**: `midi-script-manager-js` を import せず、上記はあくまで参考。構成や実装方法は自由に決めてよい。

---

### 5. useStorageSync と MIDI ロジックの統合

**MidiScriptEditor ページ**:
- `useStorageSync<KeymapsData>(LOCAL_STORAGE_KEY.midiScripts, [])` で keymaps を取得
- Web MIDI API でデバイス接続を検知、`MIDIDevice` を生成
- デバイス接続時: `useStorageSync` から該当デバイスの keymap を読み、`applyMappings` で適用
- エディタで保存時: `MIDIDevice.toJSON()` で keymap を生成し、`setData` で全体を更新

**Controller 側**:
- `window.MIDIScriptManager` に依存している現状を、独自の React フックまたはプロバイダに置き換える
- または、MIDIScriptManager 相当をプロジェクト内で実装し、`openCustomScriptEditor` は `/midi-script-editor` を開くだけの薄いラッパーにする

---

### 6. openCustomScriptEditor の新しい仕様

```typescript
// 現在の呼び出し
midiAPI.openCustomScriptEditor(midiScriptTemplate);

// 新しい仕様
// - 新規ウィンドウで /midi-script-editor を開く（サービス名はパラメータ不要、リポジトリ内で管理）
```

**templates の渡し方**:
- **案A**: URL クエリ（長くなりがち）
- **案B**: `useStorageSync('ytvj_midi_script_templates', [])` で templates を保存し、Controller が事前に setData、エディタは読み取る
- **案C**: エディタは templates を import して固定で持つ（midi-script-template.json）

→ **採用**: 案C（既存の midi-script-template を MidiScriptEditor で import）

---

### 7. Import / Export

**現状**: `FileHandler.readJson()` / `FileHandler.downloadJson()`（別 submodule）

**独自実装**:
- **Import**: `<input type="file" accept=".json">` + `FileReader` で JSON パース
- **Export**: `Blob` + `URL.createObjectURL` + `<a download>` でダウンロード

カスタムフック（例: `useFileIO`）として実装すれば汎用性があり、他コンポーネントでも再利用可能。

---

### 8. ルーティング・起動フロー

1. Controller の StatusBar で MIDI クリック
2. 初回: MIDI アクセス要求、成功後に `setMidiAPI`
3. 2回目以降: `openCustomScriptEditor` 相当の処理
   - `window.open('/midi-script-editor', 'MidiScriptEditor', 'width=640,height=720')`
4. MidiScriptEditor ページ: サービス名は定数で管理、useStorageSync で keymaps を読み、MIDI デバイスを初期化

---

## 実装フェーズ案

1. **Phase 1**: 型定義・定数・MIDIElement / MIDIDevice のユーティリティ実装
2. **Phase 2**: useStorageSync による keymaps 永続化、LOCAL_STORAGE_KEY 追加
3. **Phase 3**: MidiScriptEditor ページの UI（ヘッダー、テーブル、Export/Import）
4. **Phase 4**: スクリプトエディタモーダル
5. **Phase 5**: openCustomScriptEditor の差し替え、Controller との統合

---

## 足りない情報・未決定事項（決定済み）

### データ・ストレージ
- [x] **LOCAL_STORAGE_KEY**: `midi_script` を使用する
- [x] **サービス名**: `YouTube-VJ` 固定

### UI/UX
- [x] **デザイン方針**: 元のスクリプト（midi-script-manager-js）を再現する（Controller と色合いは既に似せているため）
- [x] **ウィンドウサイズ**: 640x720（後から変更可能）

### Controller 統合
- [x] **window.MIDIScriptManager**: グローバルスコープから完全に削除
- [x] **executeScript**: 別モジュール分割は不要。MIDI デバイスからの信号受信などは共通化し、1 つのスクリプトで `executeScript` オプション等で制御する

### テンプレート
- [x] **templates**: 案C（import）で進める。postMessage での受け渡しをやめ、シンプルにする

### エラーハンドリング
- [x] **MIDI 非対応時**: alert で内容をユーザに提示し、ScriptEditor の場合は `window.close()` する
- [x] **デバイス未接続時**: エラーにしない。デバイスを常に受け入れる体制を維持する（現状の midi-script-manager-js と同じ）

### その他（実装中に判明した事項）
- [ ] （ここに追記）

---

## 実装に必要な追加情報

以下の事項は実装時に参照する情報として明記する。

### Controller 側の変更（window.MIDIScriptManager 削除時）

- **index.html**: 外部スクリプト `<script src="https://kazuprog.github.io/midi-script-manager-js/midi-script-manager.js">` を削除する
- **スクリプト実行環境**: MIDI スクリプトは `ch`, `mixer`, `library` をグローバル（window）から参照する。ControllerAPIContext が `window.ch`, `window.mixer`, `window.library` を設定しているため、この前提は維持する
- **Controller 用 MIDI ロジック**: `requestAccess`, デバイス管理、keymap 適用、スクリプト実行を行うモジュールをプロジェクト内に新規作成する必要がある（例: `useMidiController` フック、または MidiControllerProvider）
- **スクリプト実行時の引数**: `executeScript` に渡すオブジェクトは `{ status, data1, data2, type, channel, value, output }`。スクリプト内では `ch`, `mixer`, `library` をグローバルから参照する

### openCustomScriptEditor の新しいシグネチャ

- 案C 採用により templates 引数は不要
- `openCustomScriptEditor()` は引数なしで呼び出す（または `openCustomScriptEditor: () => void`）

### テンプレートの配置

- 現在: `src/pages/Controller/utils/midi-script-template.ts` が `generated/midi-script-template.json` を import
- MidiScriptEditor から import する場合、`@/pages/Controller/utils/midi-script-template` で参照可能
- 循環依存の懸念がある場合は、共通位置（例: `src/utils/midi-script-template.ts`）への移動を検討

### localStorage キーの役割

| キー | 用途 |
|------|------|
| `midi` | StatusBar が MIDI 初回起動をスキップするか判定（`"true"` が設定されていれば初回から MIDI を有効化） |
| `midi_script` | keymaps の永続化（useStorageSync で使用） |

### Import 時のバリデーション

- 不正な JSON、KeymapObject 形式でない場合のエラーハンドリング
- `isValidKeymapObject` 相当のバリデーションを行うことを推奨
- バリデーション失敗時: alert でエラー内容を表示し、Import をキャンセル

### 複数デバイス時の挙動

- keymaps は複数デバイス分を配列で保持
- エディタでは「現在接続中かつ選択されているデバイス」の keymap のみ表示・編集
- Export 時は現在選択デバイスの keymap のみ出力（元実装と同様）

### Export 時のファイル名

- 元実装: `${serviceName}_${manufacturer} ${name}.json`（例: `YouTube-VJ_KORG nanoKONTROL2.json`）

---

## 参考ファイル一覧

| ファイル | 用途 |
|----------|------|
| `index.html` | 外部 MIDIScriptManager スクリプトの読み込み（削除対象） |
| `midi-script-manager-js/src/index.js` | MIDIScriptManager、openCustomScriptEditor |
| `midi-script-manager-js/src/StorageManager.js` | PostMessage / LocalStorage の切り替え |
| `midi-script-manager-js/src/PostMessageHandler.js` | postMessage の送受信 |
| `midi-script-manager-js/docs/custom-script-editor/script.js` | メインロジック |
| `midi-script-manager-js/docs/custom-script-editor/script-editor.js` | モーダルエディタ |
| `midi-script-manager-js/docs/custom-script-editor/style.css` | スタイル（再現用） |
| `src/hooks/useStorageSync/index.ts` | 同期フック |
| `src/pages/Controller/components/StatusBar/index.tsx` | openCustomScriptEditor の呼び出し元 |
| `src/pages/Controller/contexts/ControllerAPIContext.tsx` | window.ch, mixer, library の設定 |
| `src/pages/Controller/utils/midi-script-template.ts` | テンプレート（MidiScriptEditor で import） |
| `src/pages/Controller/utils/generated/midi-script-template.json` | テンプレート JSON |
