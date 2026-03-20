import React, { useState } from "react";
import "../css/MovieCard.css";
import { useMovieContext } from "../contexts/MovieContext";
import MovieTrailerModal from "./MovieTrailerModal";
// import nomovie from "../assets/images/no-movie.png";
import MovieDetailModal from "./MovieDetailModal";
import MediaIcon from "./MediaIcon";

const MovieCard = ({ movie }) => {
  const {
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    isWatchListed,
    addWatchList,
    removeFromWatchList,
  } = useMovieContext();
  const [showTrailer, setShowTrailer] = useState(false);
  const [showDetailInfo, setShowDetailInfo] = useState(false);
  const favorite = isFavorite(movie.id);
  const watchlisted = isWatchListed(movie.id);

  const isTv = Boolean(
    movie.media_type === "tv" || (movie.name && !movie.title),
  );

  const onFavoriteClick = (e) => {
    e.stopPropagation();
    favorite ? removeFromFavorites(movie.id) : addToFavorites(movie);
  };

  const onWatchListClick = (e) => {
    e.stopPropagation();
    if (watchlisted) {
      removeFromWatchList(movie.id);
    } else {
      const { status, ...cleanMovie } = movie;
      addWatchList(cleanMovie);
      console.log(
        "Check Status of Content's watchlist entry:",
        status,
        cleanMovie,
      );
    }
  };

  const posterSrc = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null; // Fallback image if poster_path is missing

  return (
    <>
      <div className="movie-card">
        {/* ── Poster ── */}
        <div
          className="movie-poster"
          style={{
            margin: "auto 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0d1b2a3e",
          }}
        >
          {posterSrc ? (
            <img src={posterSrc} alt={movie.title} loading="lazy" />
          ) : (
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.2 }}
            >
              <rect x="2" y="2" width="20" height="20" rx="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          )}

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

          {/* Media type badge — TV or Movie */}
          <div
            className={`media-badge ${isTv ? "media-badge--tv" : "media-badge--movie"}`}
          >
            <MediaIcon type={isTv ? "tv" : "movie"} />
            {isTv ? "TV" : "Movie"}
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

            {/* Watchlist — top-left */}
            <div
              type="button"
              className={`watchlist-btn ${watchlisted ? "active" : ""}`}
              onClick={onWatchListClick}
              title={watchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
              aria-label={
                watchlisted ? "Remove from Watchlist" : "Add to Watchlist"
              }
              aria-pressed={watchlisted}
            >
              {watchlisted ? (
                /* Bookmarked (filled) */
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                  aria-hidden="true"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              ) : (
                /* Not bookmarked (outline) */
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              )}
            </div>
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

          <button
            type="button"
            className="more-info-btn"
            data-movie-id={movie.id}
            data-media-type={isTv ? "tv" : "movie"}
            aria-label={`More info about ${movie.title}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowDetailInfo(true);
              // TODO: open MovieDetailModal — handler wired in next step
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            More Info
          </button>
        </div>
      </div>

      {/* ── Trailer Modal ── */}
      {showTrailer && (
        <MovieTrailerModal
          movie={movie}
          onClose={() => setShowTrailer(false)}
        />
      )}

      {showDetailInfo && (
        <MovieDetailModal
          movie={movie}
          onClose={() => setShowDetailInfo(false)}
        />
      )}
    </>
  );
};

export default MovieCard;
