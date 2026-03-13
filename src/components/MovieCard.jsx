import React, { useState } from "react";
import "../css/MovieCard.css";
import { useMovieContext } from "../contexts/MovieContext";
import MovieTrailerModal from "./MovieTrailerModal";

const MovieCard = ({ movie }) => {
  const { isFavorite, addToFavorites, removeFromFavorites } = useMovieContext();
  const [showTrailer, setShowTrailer] = useState(false);
  const favorite = isFavorite(movie.id);

  const onFavoriteClick = (e) => {
    e.stopPropagation();
    favorite ? removeFromFavorites(movie.id) : addToFavorites(movie);
  };

  return (
    <>
      <div className="movie-card">
        {/* ── Poster ── */}
        <div className="movie-poster">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            loading="lazy"
          />

          {/* Play button */}
          <div className="play-overlay">
            <div
              className="play-btn-circle"
              onClick={() => setShowTrailer(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="white"
                stroke="none"
              >
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </div>

          {/* Overlay layer (holds favourite btn) */}
          <div className="movie-overlay">
            <button
              className={`favorite-btn ${favorite ? "active" : ""}`}
              onClick={onFavoriteClick}
              title={favorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              ❤
            </button>
          </div>

          {/* Rating badge */}
          <div className="rating-badge">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="#f5c518"
              stroke="none"
            >
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14
                               18.18,21.02 12,17.77 5.82,21.02 7,14.14
                               2,9.27 8.91,8.26"
              />
            </svg>
            {movie.vote_average ? movie.vote_average.toFixed(2) : "NR"}
          </div>
        </div>

        {/* ── Info ── */}
        <div className="movie-info">
          <h3 className="movie-title">{movie.title}</h3>
          <div className="movie-meta-row">
            <span className="movie-year">
              {movie.release_date?.split("-")[0]}
            </span>
          </div>
          {movie.overview && <p className="movie-overview">{movie.overview}</p>}
        </div>
      </div>

      {/* ── Trailer Modal ── */}
      {showTrailer && (
        <MovieTrailerModal
          movie={movie}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </>
  );
};

export default MovieCard;
