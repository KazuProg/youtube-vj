import ControllerPage from "@/pages/Controller";
import ProjectionPage from "@/pages/Projection";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ControllerPage />} />
      <Route path="/projection" element={<ProjectionPage />} />
    </Routes>
  );
}

export default App;
