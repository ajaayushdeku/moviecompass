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
import Actors from "./pages/Actors";
import WatchList from "./pages/WatchList";
import ActorProfilePage from "./pages/ActorProfilePage";
import Footer from "./components/Footer";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <MovieProvider>
      <div className="app-shell">
        <NavBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tvshows" element={<TvShows />} />
            <Route path="/actors" element={<Actors />} />
            <Route path="/actors/:id" element={<ActorProfilePage />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/genres" element={<Genres />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/watchlist" element={<WatchList />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </MovieProvider>
  );
}

export default App;
