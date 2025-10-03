import ControllerPage from "@/pages/ControllerPage";
import ProjectionPage from "@/pages/ProjectionPage";

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode");

  if (mode === "projection") {
    return <ProjectionPage />;
  }

  return <ControllerPage />;
}

export default App;
