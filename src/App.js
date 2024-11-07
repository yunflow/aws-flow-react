import './App.css';
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage"
import ARPage from "./pages/ARPage"

function App() {
  return (
    <div className="app">
      <Routes>
        <Route exact path="/" element={<HomePage />} />
        <Route exact path="/ar-test" element={<ARPage />} />
      </Routes>
    </div>
  );
}

export default App;
