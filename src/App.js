import './App.css';
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage"
import GamePage from "./pages/GamePage"

function App() {
  return (
    <div className="app">
      <Routes>
        <Route exact path="/" element={<HomePage />} />
        <Route exact path="/game-test" element={<GamePage />} />
      </Routes>
    </div>
  );
}

export default App;
