import React, { useCallback, useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import "../css/PagesShared.css";
import {
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  discoverMovies,
  getMovieGenres,
  getMovieVideos,
  SORT_OPTIONS,
} from "../services/api";

const FILTER_CHIPS = ["All", "Popular", "Top Rated", "Now Playing", "Upcoming"];

/* ── Skeleton loader ── */
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

/* ── Attach videos to a list of movies ── */
const attachVideos = async (movies) =>
  Promise.all(
    movies.map(async (movie) => {
      try {
        const videos = await getMovieVideos(movie.id);
        return { ...movie, videos };
      } catch {
        return { ...movie, videos: [] };
      }
    }),
  );

/* ── Fetch by category helper ── */
const fetchByCategory = async (category, page) => {
  switch (category) {
    case "Top Rated":
      return getTopRatedMovies(page);
    case "Now Playing":
      return getNowPlayingMovies(page);
    case "Upcoming":
      return getUpcomingMovies(page);
    default:
      return getPopularMovies(page); // "All" and "Popular"
  }
};

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState(SORT_OPTIONS[0].value);
  const [activeGenreId, setActiveGenreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  /* ── Load genres once ── */
  useEffect(() => {
    getMovieGenres().then(setGenres).catch(console.error);
  }, []);

  /* ── Main fetch: re-runs whenever filter/sort/genre changes ── */
  const loadMovies = useCallback(
    async (page = 1, append = false) => {
      page === 1 ? setLoading(true) : setLoadingMore(true);
      setError(null);
      try {
        let data;
        // If a genre chip is active OR a custom sort is chosen, use /discover
        if (activeGenreId || activeSort !== SORT_OPTIONS[0].value) {
          data = await discoverMovies({
            genreIds: activeGenreId ? [activeGenreId] : [],
            sortBy: activeSort,
            page,
          });
        } else {
          data = await fetchByCategory(activeFilter, page);
        }
        const withVideos = await attachVideos(data.results);
        setMovies((prev) => (append ? [...prev, ...withVideos] : withVideos));
        setTotalPages(data.totalPages);
        setTotalResults(data.totalResults ?? 0);
        setCurrentPage(data.currentPage);
      } catch (err) {
        setError("Failed to load movies. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeFilter, activeSort, activeGenreId],
  );

  useEffect(() => {
    loadMovies(1, false);
  }, [loadMovies]);

  const handleFilterChange = (chip) => {
    setActiveFilter(chip);
    setActiveGenreId(null); // clear genre when switching category
  };

  const handleGenreToggle = (id) => {
    setActiveGenreId((prev) => (prev === id ? null : id));
    setActiveFilter("All");
  };

  const handleLoadMore = () => loadMovies(currentPage + 1, true);

  return (
    <div className="page movies-page">
      {/* ══ HERO ══════════════════════════ */}
      <header className="page-hero movies-hero">
        <p className="page-eyebrow">Discover Cinema</p>
        <h1 className="page-title">
          Browse <span>Movies</span>
        </h1>
        <p className="page-desc">
          Millions of films at your fingertips — from blockbuster hits to indie
          gems, filtered and sorted exactly how you like.
        </p>
      </header>

      <div className="page-divider" />

      {/* ══ STAT PILLS ════════════════════════ */}
      <div className="stat-pills">
        {[
          {
            icon: "🎬",
            value: totalResults > 0 ? totalResults.toLocaleString() : "10,000+",
            label: "Movies",
          },
          { icon: "⭐", value: "8.9", label: "Avg Rating" },
          { icon: "🌍", value: "50+", label: "Languages" },
          { icon: "📅", value: "2025", label: "Latest Year" },
        ].map((stat) => (
          <div className="stat-pill" key={stat.label}>
            <span className="stat-pill-icon">{stat.icon}</span>
            <div className="stat-pill-body">
              <div className="stat-pill-value">{stat.value}</div>
              <div className="stat-pill-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ CATEGORY FILTER CHIPS ═════════════ */}
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

      {/* ══ GENRE CHIPS (from API) ════════════ */}
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
                ? "All Movies"
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
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ══ ERROR ═════════════════════════════ */}
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
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* ══ GRID ══════════════════════════ */}
      {loading ? (
        <SkeletonGrid count={12} />
      ) : movies.length === 0 ? (
        <div className="empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
          <h3>No movies found</h3>
          <p>Try a different filter or genre.</p>
        </div>
      ) : (
        <>
          <div className="page-grid">
            {movies.map((movie, i) => (
              <div
                key={movie.id}
                style={{ animationDelay: `${Math.min(i * 45, 600)}ms` }}
              >
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>

          {currentPage < totalPages && (
            <div
              className="load-more-wrap"
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
                  <>
                    Load More{" "}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Movies;
