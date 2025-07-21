import { useEffect } from "react";
import YTPlayerForVJ from "../components/VJPlayer";
import { LOCAL_STORAGE_KEY } from "../constants";

const ProjectionPage = () => {
  useEffect(() => {
    // 投影画面専用の設定
    document.title = "📺 VJ投影画面";
    document.body.style.backgroundColor = "#000";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    // コンポーネントがアンマウントされる時にスタイルをリセット
    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
    };
  }, []);

  return (
    <YTPlayerForVJ style={{ position: "fixed", inset: 0 }} syncKey={LOCAL_STORAGE_KEY.player} />
  );
};

export default ProjectionPage;
