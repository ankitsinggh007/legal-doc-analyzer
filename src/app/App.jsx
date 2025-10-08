import { Routes, Route } from "react-router-dom";
import { AnalyzePage } from "../features/analyze/AnalyzePage.jsx";
function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
      <Route path="/analyze" element={<AnalyzePage />} />
      {/* <Route path="*" element={<NotFoundPage/>} /> */}
    </Routes>
  );
}

export default App;
