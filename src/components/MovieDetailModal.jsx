import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useMovieContext } from "../contexts/MovieContext";
import "../css/MovieDetailModal.css";
import MediaIcon from "./MediaIcon";

/* ─────────────────────────────────────────────────────────────────
   MovieDetailModal
   Triggered by the "More Info" button on MovieCard.
   Receives the same `movie` object MovieCard already has —
   no extra API call needed for the basic info panel.
   Layout: poster (left) + details (right) + trailer iframe (bottom)
───────────────────────────────────────────────────────────────── */
const MovieDetailModal = ({ movie, onClose }) => {
  const {
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    isWatchListed,
    addWatchList,
    removeFromWatchList,
  } = useMovieContext();
  const favorite = isFavorite(movie.id);
  const watchlisted = isWatchListed(movie.id);

  const videos = movie.videos ?? [];
  const isTv = movie.media_type === "tv" || (!movie.title && !!movie.name);

  // Prefer Trailer → Teaser → any YouTube video
  const trailer =
    videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ??
    videos.find((v) => v.type === "Teaser" && v.site === "YouTube") ??
    videos.find((v) => v.site === "YouTube");

  const displayTitle =
    movie.title ?? movie.name ?? movie.original_name ?? "Untitled";
  const releaseYear = (movie.release_date ?? movie.first_air_date ?? "").split(
    "-",
  )[0];
  const releaseDate = movie.release_date ?? movie.first_air_date ?? "—";
  const posterSrc = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : null;
  const backdropSrc = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const voteCount = movie.vote_count
    ? movie.vote_count >= 1000
      ? `${(movie.vote_count / 1000).toFixed(1)}k`
      : movie.vote_count
    : null;
  const mediaLabel = isTv ? "TV Series" : "Movie";
  const mediaClass = isTv ? "detail-badge--tv" : "detail-badge--movie";

  /* ── Escape key closes ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* ── Lock body scroll ── */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const onFavoriteClick = () => {
    favorite ? removeFromFavorites(movie.id) : addToFavorites(movie);
  };

  const onWatchListClick = () => {
    if (watchlisted) {
      removeFromWatchList(movie.id);
    } else {
      const { status, ...cleanMovie } = movie;
      addWatchList(cleanMovie);
    }
  };

  const modal = (
    <div
      className="detail-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${displayTitle}`}
    >
      <div className="detail-dialog" onClick={(e) => e.stopPropagation()}>
        {/* ── Backdrop hero image ── */}
        {backdropSrc ? (
          <div
            className="detail-hero"
            style={{ backgroundImage: `url(${backdropSrc})` }}
          >
            <div className="detail-hero-overlay" />
          </div>
        ) : (
          <div
            className="detail-hero"
            style={{
              margin: "auto 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0d1b2a3e",
            }}
          >
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
          </div>
        )}

        {/* ── Close button ── */}
        <button
          className="detail-close"
          onClick={onClose}
          aria-label="Close details"
          type="button"
        >
          ✖
        </button>

        {/* ── Main body: poster + info ── */}
        <div className="detail-body">
          {/* Left — poster */}
          <div className="detail-poster-wrap">
            {posterSrc ? (
              <img
                className="detail-poster"
                src={posterSrc}
                alt={`${displayTitle} poster`}
                loading="eager"
              />
            ) : (
              <div className="detail-poster-placeholder">
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
              </div>
            )}
          </div>

          {/* Right — info */}
          <div className="detail-info">
            {/* Media type badge + year */}
            <div className="detail-meta-top">
              <span className={`detail-badge ${mediaClass}`}>
                <MediaIcon type={isTv ? "tv" : "movie"} />
                {mediaLabel}
              </span>
              {releaseYear && (
                <span className="detail-year">{releaseYear}</span>
              )}
            </div>

            {/* Title */}
            <h2 className="detail-title">{displayTitle}</h2>

            {/* Rating + votes + release date row */}
            <div className="detail-stats">
              {rating && (
                <div className="detail-stat">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="#f5c518"
                    stroke="none"
                  >
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                  <span
                    className="detail-stat-value"
                    style={{ color: "#f5c518" }}
                  >
                    {rating}
                  </span>
                  {voteCount && (
                    <span className="detail-stat-sub">({voteCount} votes)</span>
                  )}
                </div>
              )}

              {releaseDate !== "—" && (
                <div className="detail-stat">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="detail-stat-value">{releaseDate}</span>
                </div>
              )}

              {movie.original_language && (
                <div className="detail-stat">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span
                    className="detail-stat-value"
                    style={{ textTransform: "uppercase" }}
                  >
                    {movie.original_language}
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="detail-divider" />

            {/* Overview */}
            {movie.overview ? (
              <p className="detail-overview">{movie.overview}</p>
            ) : (
              <p className="detail-overview detail-overview--empty">
                No overview available.
              </p>
            )}

            {/* Action buttons */}
            <div className="detail-actions">
              <div
                type="button"
                className={`detail-fav-btn ${favorite ? "detail-fav-btn--active" : ""}`}
                onClick={onFavoriteClick}
                aria-label={
                  favorite ? "Remove from favorites" : "Add to favorites"
                }
                aria-pressed={favorite}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={favorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {favorite ? "Saved" : "Add to Favorites"}
              </div>

              <div
                type="button"
                className={`detail-watchlist-btn ${watchlisted ? "detail-watchlist-btn--active" : ""}`}
                onClick={onWatchListClick}
                aria-label={
                  watchlisted ? "Remove from watchlist" : "Add to watchlist"
                }
                aria-pressed={watchlisted}
              >
                {watchlisted ? (
                  /* Bookmarked (filled) */
                  <svg
                    width="16"
                    height="16"
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
                    width="16"
                    height="16"
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
                {watchlisted ? "In Watchlist" : "Add to Watchlist"}
              </div>
            </div>
          </div>
        </div>

        {/* ── Trailer section ── */}
        {trailer ? (
          <div className="detail-trailer-section">
            <div className="detail-trailer-label">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              {trailer.type === "Trailer"
                ? "Official Trailer"
                : trailer.type === "Teaser"
                  ? "Official Teaser"
                  : "Official Clip"}
            </div>
            <div className="detail-trailer-frame">
              {/* no autoplay — user initiates playback intentionally */}
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?rel=0`}
                title={`${displayTitle} — ${trailer.name ?? "trailer"}`}
                allow="fullscreen"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        ) : (
          <div className="detail-no-trailer">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <span>No trailer available</span>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default MovieDetailModal;
