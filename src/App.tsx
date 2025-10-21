import ControllerPage from "@/Controller/page";
import ProjectionPage from "@/Projection/page";

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode");

  if (mode === "projection") {
    return <ProjectionPage />;
  }

  return <ControllerPage />;
}

export default App;
