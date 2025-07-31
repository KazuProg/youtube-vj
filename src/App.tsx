import ControllerPage from "@/pages/ControllerPage";
import ProjectionPage from "@/pages/ProjectionPage";

function App() {
  // URLパラメータをチェックして投影モードかどうかを判定
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode");

  // 投影画面専用の表示（URLパラメータでmode=projectionの場合）
  if (mode === "projection") {
    return <ProjectionPage />;
  }

  // コントローラー画面
  return <ControllerPage />;
}

export default App;
