import YouTubeController from "@/components/VJController";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useState } from "react";

const ControllerPage = () => {
  const [projectionWindow, setProjectionWindow] = useState<Window | null>(null);

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
};

export default ControllerPage;
