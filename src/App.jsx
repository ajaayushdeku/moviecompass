import { Route, Routes } from "react-router-dom";
import "./css/App.css";
import { MovieProvider } from "./contexts/MovieContext";
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import NavBar from "./components/NavBar";
import Movies from "./pages/Movies";
import TvShows from "./pages/TvShows";
import Trending from "./pages/Trending";
import Genres from "./pages/Genres";

function App() {
  return (
    <MovieProvider>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/tvshows" element={<TvShows />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/genres" element={<Genres />} />
          <Route path="/favorites" element={<Favorites />} />
        </Routes>
      </main>
    </MovieProvider>
  );
}

export default App;
