import ControllerPage from "@/pages/Controller";
import MidiScriptEditorPage from "@/pages/MidiScriptEditor";
import ProjectionPage from "@/pages/Projection";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ControllerPage />} />
      <Route path="/projection" element={<ProjectionPage />} />
      <Route path="/midi-script-editor" element={<MidiScriptEditorPage />} />
    </Routes>
  );
}

export default App;
