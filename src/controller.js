import { ApplicationManager } from "./app/ApplicationManager.js";

// グローバル変数の初期化（既存コードとの互換性のため）
const ch = [];
let selCh = null;
let midi = null;

window.ch = ch;

// アプリケーション管理インスタンス
let appManager = null;

/**
 * アプリケーション初期化
 */
window.addEventListener("load", () => {
  document.querySelector("#terms-agree-btn").addEventListener("click", () => {
    document.getElementById("terms").style.display = "none";
    init();
  });
});

/**
 * メイン初期化関数
 */
async function init() {
  try {
    appManager = new ApplicationManager();
    window.appManager = appManager; // グローバルアクセス用

    await appManager.initialize();

    console.log("YouTube-VJ initialized successfully");
  } catch (error) {
    console.error("Failed to initialize YouTube-VJ:", error);
    alert(
      "アプリケーションの初期化に失敗しました。ページを再読み込みしてください。"
    );
  }
}

/**
 * 動画切り替え時間設定
 */
function setSwitchingDuration() {
  const input = prompt(
    "Switching Duration (ms)",
    appManager?.switchingDuration || 1000
  );
  const duration = parseInt(input);
  if (!isNaN(duration) && appManager) {
    appManager.switchingDuration = duration;
  }
}

// グローバル関数として公開（既存コードとの互換性のため）
window.setSwitchingDuration = setSwitchingDuration;

// 後方互換性のためのエクスポート
export { ch, selCh, setSwitchingDuration };

// 既存のエクスポートされた関数は ApplicationManager 経由でアクセス
// これらは window オブジェクトに既に設定されているため、ここでは省略
