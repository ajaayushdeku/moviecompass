import { useEffect, useState } from "react";
import MovieTrailerModal from "./MovieTrailerModal";
import { useMovieContext } from "../contexts/MovieContext";
import { getTvShowVideos } from "../services/api";

const SpotlightBanner = ({ show }) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const { isFavorite, addToFavorites, removeFromFavorites } = useMovieContext();
  const favorite = show ? isFavorite(show.id) : false;

  /* ── Fetch videos whenever the featured show changes ── */
  useEffect(() => {
    if (!show?.id) return;

    let cancelled = false;
    const fetchVideos = async () => {
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
    };

    fetchVideos();

    return () => {
      cancelled = true;
    };
  }, [show?.id]);

  if (!show) return null;

  const onFavoriteClick = (e) => {
    e.stopPropagation();
    if (favorite) {
      removeFromFavorites(show.id);
    } else {
      // Normalize so MovieCard/context shape is consistent
      addToFavorites({
        ...show,
        title: show.name ?? show.original_name,
        release_date: show.first_air_date,
        videos,
      });
    }
  };

  const hasTrailer = videos.some(
    (v) => v.type === "Trailer" && v.site === "YouTube",
  );

  // Pass the fetched videos down to the modal
  const showWithVideos = { ...show, videos };

  return (
    <div className="spotlight-banner">
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
        <div className="spotlight-meta">
          <span className="spotlight-meta-item">
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

        <div className="spotlight-actions">
          {/* ── Watch Trailer ── */}
          <button
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
              /* mini spinner */
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

          {/* ── Add to Favorite ── */}
          <button
            className={`btn-ghost ${favorite ? "btn-ghost--active" : ""}`}
            onClick={onFavoriteClick}
            title={favorite ? "Remove from Favorites" : "Add to Favorites"}
            style={
              favorite ? { borderColor: "var(--red)", color: "var(--red)" } : {}
            }
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
          </button>
        </div>
      </div>

      {/* ── Trailer Modal ── */}
      {showTrailer && (
        <MovieTrailerModal
          movie={showWithVideos}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </div>
  );
};

export default SpotlightBanner;
