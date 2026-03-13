import React, { useEffect, useState, useCallback } from "react";
import MovieCard from "../components/MovieCard";
import "../css/PagesShared.css";
import {
  getPopularTvShows,
  getTopRatedTvShows,
  getAiringTodayTvShows,
  getOnTheAirTvShows,
  discoverTvShows,
  getTvGenres,
  TV_SORT_OPTIONS,
  getTvShowVideos,
} from "../services/api";
import MovieTrailerModal from "../components/MovieTrailerModal";
import { useMovieContext } from "../contexts/MovieContext";

const FILTER_CHIPS = [
  "All",
  "Popular",
  "Top Rated",
  "Airing Today",
  "On The Air",
];

/* ── Skeleton ── */
const SkeletonGrid = ({ count = 12 }) => (
  <div className="skeleton-grid">
    {Array.from({ length: count }).map((_, i) => (
      <div
        className="skeleton-card"
        key={i}
        style={{ animationDelay: `${i * 35}ms` }}
      >
        <div className="skeleton-poster" />
        <div className="skeleton-info">
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
        </div>
      </div>
    ))}
  </div>
);

/* ── Normalize TV show object so MovieCard works (uses first_air_date, name) ── */
const normalizeTv = (show) => ({
  ...show,
  title: show.name ?? show.original_name,
  release_date: show.first_air_date,
  videos: [],
});

/* ── Fetch videos for every show and attach via spread ──────────────*/
const attachVideos = async (shows) => {
  const results = await Promise.allSettled(
    shows.map((show) => getTvShowVideos(show.id)),
  );
  return shows.map((show, i) => ({
    ...show,
    videos: results[i].status === "fulfilled" ? results[i].value : [],
  }));
};

/* ── Fetch by category ── */
const fetchByCategory = (category, page) => {
  switch (category) {
    case "Top Rated":
      return getTopRatedTvShows(page);
    case "Airing Today":
      return getAiringTodayTvShows(page);
    case "On The Air":
      return getOnTheAirTvShows(page);
    default:
      return getPopularTvShows(page);
  }
};

/* ── Spotlight banner — shows the first airing-today show ── */
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
            {favorite ? "Saved ✓" : "Add to Favorites"}
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

const TvShows = () => {
  const [shows, setShows] = useState([]);
  const [genres, setGenres] = useState([]);
  const [spotlight, setSpotlight] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState(TV_SORT_OPTIONS[0].value);
  const [activeGenreId, setActiveGenreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  /* ── Load genres + spotlight once ── */
  useEffect(() => {
    getTvGenres().then(setGenres).catch(console.error);

    // Use airing today for the spotlight banner
    getAiringTodayTvShows(1)
      .then((data) => {
        if (data.results.length) setSpotlight(data.results[0]);
      })
      .catch(console.error);
  }, []);

  /* ── Main fetch ── */
  const loadShows = useCallback(
    async (page = 1, append = false) => {
      page === 1 ? setLoading(true) : setLoadingMore(true);
      setError(null);
      try {
        let data;
        if (activeGenreId || activeSort !== TV_SORT_OPTIONS[0].value) {
          data = await discoverTvShows({
            genreIds: activeGenreId ? [activeGenreId] : [],
            sortBy: activeSort,
            page,
          });
        } else {
          data = await fetchByCategory(activeFilter, page);
        }
        const normalized = data.results.map(normalizeTv);
        const withVideos = await attachVideos(normalized);
        setShows((prev) => (append ? [...prev, ...withVideos] : withVideos));
        setTotalPages(data.totalPages);
        setTotalResults(data.totalResults ?? 0);
        setCurrentPage(data.currentPage);
      } catch (err) {
        setError("Failed to load TV shows. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeFilter, activeSort, activeGenreId],
  );

  useEffect(() => {
    loadShows(1, false);
  }, [loadShows]);

  const handleFilterChange = (chip) => {
    setActiveFilter(chip);
    setActiveGenreId(null);
  };
  const handleGenreToggle = (id) => {
    setActiveGenreId((p) => (p === id ? null : id));
    setActiveFilter("All");
  };
  const handleLoadMore = () => loadShows(currentPage + 1, true);

  return (
    <div className="page tvshows-page">
      {/* ══ HERO ══════════════════════════ */}
      <header className="page-hero tvshows-hero">
        <p className="page-eyebrow">Stream & Binge</p>
        <h1 className="page-title">
          TV <span>Shows</span>
        </h1>
        <p className="page-desc">
          From prestige dramas to laugh-out-loud comedies — explore every show
          across every genre, sorted by what's trending right now.
        </p>
      </header>

      <div className="page-divider" />

      {/* ══ STAT PILLS ════════════════════ */}
      <div className="stat-pills">
        {[
          {
            icon: "📺",
            value: totalResults > 0 ? totalResults.toLocaleString() : "8500+",
            label: "TV Shows",
          },
          { icon: "🎭", value: "150+", label: "Genres" },
          { icon: "📡", value: "On Air", label: "Airing Today" },
          { icon: "🏆", value: "Top", label: "Award Winners" },
        ].map((s) => (
          <div className="stat-pill" key={s.label}>
            <span className="stat-pill-icon">{s.icon}</span>
            <div className="stat-pill-body">
              <div className="stat-pill-value">{s.value}</div>
              <div className="stat-pill-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ SPOTLIGHT ═════════════════════ */}
      <SpotlightBanner show={spotlight} />

      {/* ══ FILTER CHIPS ══════════════════ */}
      <div className="filter-bar">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip}
            className={`filter-chip ${activeFilter === chip && !activeGenreId ? "active" : ""}`}
            onClick={() => handleFilterChange(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* ══ GENRE CHIPS ═══════════════════ */}
      {genres.length > 0 && (
        <div className="filter-bar" style={{ paddingTop: 0 }}>
          {genres.map((g) => (
            <button
              key={g.id}
              className={`filter-chip ${activeGenreId === g.id ? "active" : ""}`}
              onClick={() => handleGenreToggle(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* ══ SORT ROW ══════════════════════ */}
      <div className="sort-row">
        <div className="section-header" style={{ padding: 0, marginBottom: 0 }}>
          <h2 className="section-title">
            {activeGenreId
              ? (genres.find((g) => g.id === activeGenreId)?.name ?? "Genre")
              : activeFilter === "All"
                ? "All TV Shows"
                : activeFilter}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="sort-label">Sort by</span>
          <select
            className="sort-select"
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value)}
          >
            {TV_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ margin: "0 5vw 24px" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonGrid count={12} />
      ) : shows.length === 0 ? (
        <div className="empty-state">
          <h3>No shows found</h3>
          <p>Try a different filter or genre.</p>
        </div>
      ) : (
        <>
          <div className="page-grid">
            {shows.map((show, i) => (
              <div
                key={`${show.id}-${i}`}
                style={{ animationDelay: `${Math.min(i * 40, 600)}ms` }}
              >
                <MovieCard movie={show} />
              </div>
            ))}
          </div>
          {currentPage < totalPages && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "32px 0 8px",
              }}
            >
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <span className="load-more-spinner" />
                ) : (
                  <>Load More</>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TvShows;
