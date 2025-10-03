import YTPlayerForVJ from "@/components/VJPlayer";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useEffect } from "react";
import styles from "./ProjectionPage.module.css";

const ProjectionPage = () => {
  useEffect(() => {
    document.title = "📺 VJ投影画面";
    document.body.style.backgroundColor = "#000";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
    };
  }, []);

  return <YTPlayerForVJ className={styles.player} syncKey={LOCAL_STORAGE_KEY.player} />;
};

export default ProjectionPage;
