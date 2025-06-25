import { useEffect, useState } from "react";
import YTPlayerForVJ from "./components/YTPlayerForVJ";
import YouTubeController from "./components/YouTubeController";
import "./App.css";
import { LOCAL_STORAGE_KEY } from "./constants";

function App() {
  const [projectionWindow, setProjectionWindow] = useState<Window | null>(null);

  // URLパラメータをチェックして投影モードかどうかを判定
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");

    if (mode === "projection") {
      // 投影画面専用の表示にする
      document.title = "📺 VJ投影画面";
      // 背景を黒くして投影に適した表示にする
      document.body.style.backgroundColor = "#000";
      document.body.style.margin = "0";
      document.body.style.padding = "0";
    }
  }, []);

  // 別ウィンドウで投影画面を開く
  const openProjectionWindow = () => {
    const projectionUrl = `${window.location.origin}${window.location.pathname}?mode=projection`;

    const newWindow = window.open(
      projectionUrl,
      "VJProjection",
      "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=yes"
    );

    if (newWindow) {
      setProjectionWindow(newWindow);
      // ウィンドウが閉じられたときの処理
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          setProjectionWindow(null);
          clearInterval(checkClosed);
        }
      }, 1000);
    } else {
      alert("ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。");
    }
  };

  // 投影画面専用の表示（URLパラメータでmode=projectionの場合）
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("mode") === "projection") {
    return (
      <>
        {/* 全画面ボタン */}
        <button
          type="button"
          onClick={() => {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen();
            }
          }}
          style={{
            position: "fixed",
            top: "10px",
            right: "10px",
            padding: "8px 16px",
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            zIndex: 1000,
          }}
        >
          🔳 全画面表示
        </button>

        <YTPlayerForVJ
          style={{ position: "fixed", inset: 0 }}
          syncMode="projection"
          syncKey={LOCAL_STORAGE_KEY.player}
          autoLoop={true}
        />
      </>
    );
  }

  // コントローラー画面
  return (
    <div style={{ padding: "20px" }}>
      <h1>YouTube VJ Controller</h1>

      {/* 投影画面開くボタン */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <button
          type="button"
          onClick={openProjectionWindow}
          disabled={projectionWindow !== null}
          style={{
            padding: "10px 20px",
            backgroundColor: projectionWindow ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: projectionWindow ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            marginRight: "10px",
          }}
        >
          {projectionWindow ? "📺 投影画面開いています" : "🚀 投影画面を開く"}
        </button>

        {projectionWindow && (
          <>
            <button
              type="button"
              onClick={() => projectionWindow.focus()}
              style={{
                padding: "8px 12px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "5px",
              }}
            >
              フォーカス
            </button>
            <button
              type="button"
              onClick={() => {
                projectionWindow.close();
                setProjectionWindow(null);
              }}
              style={{
                padding: "8px 12px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              閉じる
            </button>
          </>
        )}
      </div>

      {/* コントローラー */}
      <YouTubeController localStorageKey={LOCAL_STORAGE_KEY.player} />
    </div>
  );
}

export default App;
