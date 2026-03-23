import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import MovieTrailerModal from "./MovieTrailerModal";
import { useMovieContext } from "../contexts/MovieContext";
import { getTvShowVideos } from "../services/api";

const SpotlightBanner = ({ show }) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const {
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    isWatchListed,
    addWatchList,
    removeFromWatchList,
  } = useMovieContext();

  const favorite = show ? isFavorite(show.id) : false;
  const watchlisted = show ? isWatchListed(show.id) : false;

  // ── Fetch videos whenever the featured show changes ─────────────
  useEffect(() => {
    if (!show?.id) return;

    let cancelled = false;
    setVideos([]);
    setLoadingVideos(true);

    getTvShowVideos(show.id)
      .then((results) => {
        if (!cancelled) setVideos(results);
      })
      .catch((err) => {
        console.error("SpotlightBanner video fetch failed:", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingVideos(false);
      });

    return () => {
      cancelled = true;
    };
  }, [show?.id]);

  if (!show) return null;

  // ── Favourite toggle ─────────────────────────────────────────────
  const onFavoriteClick = () => {
    if (favorite) {
      removeFromFavorites(show.id);
    } else {
      // Normalize TV fields + strip videos before storing in favorites
      const { status: _s, ...cleanShow } = show;
      addToFavorites({
        ...cleanShow,
        title: show.name ?? show.original_name,
        release_date: show.first_air_date,
      });
    }
  };

  // ── Watchlist toggle ─────────────────────────────────────────────
  const onWatchListClick = () => {
    if (watchlisted) {
      removeFromWatchList(show.id);
    } else {
      // Strip videos, status, and normalize TV fields before storing.
      // addWatchList in context also strips status, but doing it here
      // keeps the stored object clean and predictable.
      const { status: _s, ...cleanShow } = show;
      addWatchList({
        ...cleanShow,
        title: show.name ?? show.original_name,
        release_date: show.first_air_date,
      });
    }
  };

  const hasTrailer = videos.some(
    (v) => v.type === "Trailer" && v.site === "YouTube",
  );
  const showWithVideos = { ...show, videos };

  return (
    <div className="spotlight-banner">
      {/* Backdrop */}
      <div
        className="spotlight-bg"
        style={{
          backgroundImage: show.backdrop_path
            ? `url(https://image.tmdb.org/t/p/w1280${show.backdrop_path})`
            : undefined,
          backgroundColor: "#0d1b2a",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="spotlight-noise" />

      <div className="spotlight-content">
        <p className="spotlight-eyebrow">📡 Featured Series</p>
        <h2 className="spotlight-title">{show.name}</h2>

        {/* Meta row */}
        <div className="spotlight-meta">
          <span className="spotlight-meta-item" style={{ color: "#f5c518" }}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="#f5c518"
              stroke="none"
            >
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            {show.vote_average?.toFixed(1)}
          </span>
          <span className="spotlight-meta-item">
            {show.first_air_date?.split("-")[0]}
          </span>
          {show.origin_country?.[0] && (
            <span className="spotlight-meta-item">
              {show.origin_country[0]}
            </span>
          )}
        </div>

        {/* Overview */}
        <p
          style={{
            fontSize: "0.83rem",
            color: "var(--muted)",
            maxWidth: 380,
            lineHeight: 1.55,
            margin: "0 0 16px",
          }}
        >
          {show.overview?.slice(0, 120)}…
        </p>

        {/* Action buttons */}
        <div className="spotlight-actions">
          {/* Watch Trailer */}
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowTrailer(true)}
            disabled={loadingVideos || !hasTrailer}
            title={
              loadingVideos
                ? "Loading trailer…"
                : !hasTrailer
                  ? "No trailer available"
                  : "Watch Trailer"
            }
            style={{ opacity: !loadingVideos && !hasTrailer ? 0.5 : 1 }}
          >
            {loadingVideos ? (
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            ) : (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
            {loadingVideos
              ? "Loading…"
              : hasTrailer
                ? "Watch Trailer"
                : "No Trailer"}
          </button>

          {/* Add to Favourite */}
          <div
            type="button"
            className={`detail-fav-btn ${favorite ? "detail-fav-btn--active" : ""}`}
            onClick={onFavoriteClick}
            title={favorite ? "Remove from Favorites" : "Add to Favorites"}
            aria-pressed={favorite}
          >
            <svg
              width="13"
              height="13"
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

          {/* Add to Watchlist — use <button> not <div> */}
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
                aria-hidden="true"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
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

      {/* Trailer Modal — portal so it's never clipped by spotlight overflow */}
      {showTrailer &&
        createPortal(
          <MovieTrailerModal
            movie={showWithVideos}
            onClose={() => setShowTrailer(false)}
          />,
          document.body,
        )}
    </div>
  );
};

export default SpotlightBanner;
